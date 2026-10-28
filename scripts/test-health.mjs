// Health: what decides whether the exercise log and Progress totals can be trusted — a workout
// typed in is checked, a Strava activity lands on its own local day as the right kind, and the
// week / streak / per-kind totals add up.
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-health.mjs
import { byKind, formatMinutes, fromStrava, readWeightBody, readWorkoutBody, stravaKind, totals, weekStreak, weeklyMinutes, weightChange } from "../lib/health.ts";

let pass = 0;
const failures = [];
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) pass++; else failures.push(`${label}\n    expected ${e}\n    got      ${a}`);
}

// ── A workout typed in ──
const base = { date: "2026-10-28", kind: "gym", title: " Full body ", minutes: "55", distanceKm: "", kcal: "", notes: "",
  sets: [{ exercise: " Squat ", sets: "3", reps: "10", weightKg: "40" }, { exercise: "", sets: "", reps: "", weightKg: "" }, { exercise: "Push-up", sets: 3, reps: 15, weightKg: "" }] };
eq(readWorkoutBody(base), { ok: true, body: { date: "2026-10-28", kind: "gym", title: "Full body", minutes: 55, distanceKm: null, kcal: null, notes: null,
  sets: [{ exercise: "Squat", sets: 3, reps: 10, weightKg: 40 }, { exercise: "Push-up", sets: 3, reps: 15, weightKg: null }] } },
  "a gym session: trimmed, numbers read, an empty exercise row skipped, bodyweight has no kg");
eq(readWorkoutBody({ ...base, kind: "run", distanceKm: "5,2", sets: [] }).body?.distanceKm, 5.2, "a comma decimal is read");
eq(readWorkoutBody({ ...base, kind: "yoga" }).ok, false, "an unknown kind is refused");
eq(readWorkoutBody({ ...base, minutes: "" }).ok, false, "minutes are required");
eq(readWorkoutBody({ ...base, minutes: "0" }).ok, false, "zero minutes is refused");
eq(readWorkoutBody({ ...base, minutes: "45.5" }).ok, false, "fractional minutes are refused");
eq(readWorkoutBody({ ...base, date: "2026-02-30" }).ok, false, "a date that doesn't exist is refused");
eq(readWorkoutBody({ ...base, sets: [{ exercise: "Squat", sets: "", reps: "10" }] }).ok, false, "an exercise needs its sets");
eq(readWorkoutBody({ ...base, sets: [{ exercise: "", sets: "3", reps: "10" }] }).ok, false, "numbers without an exercise name are refused");
eq(readWorkoutBody({ ...base, sets: Array.from({ length: 31 }, () => ({ exercise: "x", sets: 1, reps: 1 })) }).ok, false, "at most 30 exercises");
eq(readWorkoutBody({ ...base, kcal: "-5" }).ok, false, "negative kcal is refused");
eq(readWorkoutBody(null).ok, false, "no body is refused");

// ── Weight ──
eq(readWeightBody({ date: "2026-10-28", kg: "72.46" }), { ok: true, body: { date: "2026-10-28", kg: 72.5 } }, "weight is kept to 0.1 kg");
eq(readWeightBody({ date: "2026-10-28", kg: "7" }).ok, false, "an implausible weight is refused");
eq(readWeightBody({ date: "nope", kg: 70 }).ok, false, "a weigh-in needs a real date");
eq(weightChange([{ date: "2026-10-01", kg: 75 }, { date: "2026-10-28", kg: 72.4 }, { date: "2026-10-14", kg: 74 }]), -2.6, "change is last minus first, whatever the order");
eq(weightChange([{ date: "2026-10-01", kg: 75 }]), null, "one weigh-in has no change");

// ── Strava ──
eq(stravaKind({ sport_type: "TrailRun", type: "Run" }), "run", "sport_type wins");
eq(stravaKind({ sport_type: "Something new", type: "Ride" }), "ride", "an unknown sport_type falls back to type");
eq(stravaKind({ sport_type: "WeightTraining" }), "gym", "weight training is gym");
eq(stravaKind({}), "other", "nothing known is other");
eq(fromStrava({ id: 123456789012, name: " Morning Run ", sport_type: "Run", start_date_local: "2026-10-28T00:30:00Z", distance: 5234.7, moving_time: 1712 }),
  { date: "2026-10-28", kind: "run", title: "Morning Run", minutes: 29, distanceKm: 5.23, kcal: null, notes: null, stravaId: "123456789012" },
  "an activity lands on its local day (the Z in start_date_local is not UTC), metres → km, seconds → minutes");
eq(fromStrava({ id: 1, name: "", sport_type: "Ride", start_date_local: "2026-10-27T18:00:00Z", distance: 0, moving_time: 20, kilojoules: 612.4 }).distanceKm, null, "no distance is null, not 0");
eq(fromStrava({ id: 1, name: "", sport_type: "Ride", start_date_local: "2026-10-27T18:00:00Z", distance: 0, moving_time: 20, kilojoules: 612.4 }).minutes, 1, "a very short activity still counts a minute");
eq(fromStrava({ id: 1, name: "", sport_type: "Ride", start_date_local: "2026-10-27T18:00:00Z", distance: 0, moving_time: 20, kilojoules: 612.4 }).kcal, 612, "a ride's kJ is shown as kcal, as Strava does");

// ── Totals ──
const w = (date, minutes, kind = "run", distanceKm = null, kcal = null) => ({ date, minutes, kind, distanceKm, kcal });
const list = [w("2026-10-28", 30, "run", 5), w("2026-10-28", 45, "gym"), w("2026-10-26", 60, "ride", 20.25, 500), w("2026-10-20", 40), w("2026-10-05", 50), w("2026-11-02", 99)];
eq(totals(list, "2026-10-26", "2026-10-28"), { sessions: 3, minutes: 135, km: 25.3, kcal: 500, activeDays: 2 }, "this week: three workouts on two days; a future one left out");
eq(totals(list, null, "2026-10-28").sessions, 5, "all time up to today");
eq(weeklyMinutes(list, "2026-10-28", 4), [
  { week: "2026-10-05", minutes: 50 }, { week: "2026-10-12", minutes: 0 }, { week: "2026-10-19", minutes: 40 }, { week: "2026-10-26", minutes: 135 },
], "weeks start Monday, oldest first, empty weeks kept");
eq(weekStreak(list, "2026-10-28"), 2, "this week and last in a row; the gap before stops it");
eq(weekStreak([w("2026-10-20", 40), w("2026-10-13", 40)], "2026-10-28"), 2, "an empty week so far doesn't break the streak yet");
eq(weekStreak([w("2026-10-06", 40)], "2026-10-28"), 0, "a workout weeks ago is no streak");
eq(byKind(list.slice(0, 4)).map((k) => k.kind), ["run", "ride", "gym"], "kinds sorted by minutes");
eq(byKind(list.slice(0, 4))[0], { kind: "run", minutes: 70, sessions: 2 }, "a kind's minutes and sessions add up");
eq([formatMinutes(40), formatMinutes(60), formatMinutes(85)], ["40 min", "1 h", "1 h 25 min"], "minutes read as hours and minutes");

if (failures.length) {
  console.error(`${pass} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`${pass} passed, 0 failed`);
