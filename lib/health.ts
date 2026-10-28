// Health: workouts (typed in, or imported from Strava), body weight, and the totals the Progress
// page adds up from them.
//
// Pure and dependency-free (scripts/test-health.mjs). Dates are "YYYY-MM-DD" keys in the user's
// zone, as everywhere else; a Strava activity's day is its own local start date.

import { addDays, isDateKey, weekStartOf, type DateKey } from "@/lib/dates";

export const HEALTH_NOT_READY = "Exercise and weight tracking aren't set up yet. Run 047-health.sql.";

export const WORKOUT_KINDS = [
  { key: "gym", label: "Gym" },
  { key: "run", label: "Run" },
  { key: "walk", label: "Walk" },
  { key: "ride", label: "Ride" },
  { key: "swim", label: "Swim" },
  { key: "sport", label: "Sport" },
  { key: "other", label: "Other" },
] as const;

export type WorkoutKind = (typeof WORKOUT_KINDS)[number]["key"];

export const kindLabel = (kind: string) => WORKOUT_KINDS.find((k) => k.key === kind)?.label ?? "Other";

/** One exercise in a gym session: 3 × 10 at 40 kg. */
export interface WorkoutSet {
  exercise: string;
  sets: number;
  reps: number;
  /** null for bodyweight work. */
  weightKg: number | null;
}

export interface Workout {
  id: string;
  date: DateKey;
  kind: WorkoutKind;
  title: string | null;
  minutes: number;
  distanceKm: number | null;
  kcal: number | null;
  notes: string | null;
  /** Set when it came from Strava. */
  stravaId: string | null;
  sets: WorkoutSet[];
}

export type WorkoutBody = Omit<Workout, "id" | "stravaId">;

export interface WeightEntry {
  date: DateKey;
  kg: number;
}

const MAX_SETS = 30;

/** A number typed into a field: blank is null; otherwise it must be within [min, max]. */
function numberFrom(value: unknown, min: number, max: number, integer: boolean): number | null | "bad" {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) return "bad";
  return n;
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

export function readWorkoutBody(value: unknown): { ok: true; body: WorkoutBody } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Send the workout as JSON." };
  const v = value as Record<string, unknown>;
  const date = typeof v.date === "string" ? v.date.trim() : "";
  if (!isDateKey(date)) return { ok: false, error: "Pick the day of the workout." };
  if (!WORKOUT_KINDS.some((k) => k.key === v.kind)) return { ok: false, error: "Pick what kind of workout it was." };
  const kind = v.kind as WorkoutKind;
  const minutes = numberFrom(v.minutes, 1, 1440, true);
  if (minutes === null || minutes === "bad") return { ok: false, error: "Minutes is a whole number from 1 to 1440." };
  const distanceKm = numberFrom(v.distanceKm, 0, 1000, false);
  if (distanceKm === "bad") return { ok: false, error: "Distance is in km, up to 1000." };
  const kcal = numberFrom(v.kcal, 0, 10000, true);
  if (kcal === "bad") return { ok: false, error: "kcal is a whole number up to 10,000." };
  const title = text(v.title);
  if (title && title.length > 80) return { ok: false, error: "Keep the title under 80 characters." };
  const notes = text(v.notes);
  if (notes && notes.length > 500) return { ok: false, error: "Keep the notes under 500 characters." };

  const rawSets = Array.isArray(v.sets) ? v.sets : [];
  if (rawSets.length > MAX_SETS) return { ok: false, error: `Up to ${MAX_SETS} exercises a workout.` };
  const sets: WorkoutSet[] = [];
  for (const raw of rawSets) {
    const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const exercise = text(s.exercise);
    // A row left completely empty in the form is skipped, not an error.
    if (!exercise && !s.sets && !s.reps && !s.weightKg) continue;
    if (!exercise || exercise.length > 60) return { ok: false, error: "Name each exercise (up to 60 characters)." };
    const count = numberFrom(s.sets, 1, 50, true);
    const reps = numberFrom(s.reps, 1, 1000, true);
    if (count === null || count === "bad" || reps === null || reps === "bad") {
      return { ok: false, error: `${exercise}: sets and reps are whole numbers.` };
    }
    const weightKg = numberFrom(s.weightKg, 0, 1000, false);
    if (weightKg === "bad") return { ok: false, error: `${exercise}: weight is in kg, up to 1000.` };
    sets.push({ exercise, sets: count, reps, weightKg });
  }

  return { ok: true, body: { date, kind, title, minutes, distanceKm, kcal, notes, sets } };
}

export function readWeightBody(value: unknown): { ok: true; body: WeightEntry } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Send the weight as JSON." };
  const v = value as Record<string, unknown>;
  const date = typeof v.date === "string" ? v.date.trim() : "";
  if (!isDateKey(date)) return { ok: false, error: "Pick the day you weighed yourself." };
  const kg = numberFrom(v.kg, 20, 400, false);
  if (kg === null || kg === "bad") return { ok: false, error: "Weight is in kg, from 20 to 400." };
  return { ok: true, body: { date, kg: Math.round(kg * 10) / 10 } };
}

// ── Strava ──

/** What Strava's activity list gives for each activity — only the fields used here. */
export interface StravaActivity {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  /** Local wall-clock time, written with a "Z" that does not mean UTC. */
  start_date_local: string;
  /** Metres. */
  distance: number;
  /** Seconds. */
  moving_time: number;
  elapsed_time?: number;
  kilojoules?: number;
}

const STRAVA_KINDS: Record<string, WorkoutKind> = {
  Run: "run", TrailRun: "run", VirtualRun: "run",
  Walk: "walk", Hike: "walk",
  Ride: "ride", MountainBikeRide: "ride", GravelRide: "ride", EBikeRide: "ride", EMountainBikeRide: "ride", VirtualRide: "ride", Velomobile: "ride",
  Swim: "swim",
  WeightTraining: "gym", Crossfit: "gym", Workout: "gym", HighIntensityIntervalTraining: "gym", Elliptical: "gym", StairStepper: "gym", Rowing: "gym", Pilates: "gym", Yoga: "gym",
  Soccer: "sport", Tennis: "sport", Badminton: "sport", Squash: "sport", TableTennis: "sport", Pickleball: "sport", Racquetball: "sport", Basketball: "sport", Volleyball: "sport", Golf: "sport", RockClimbing: "sport",
};

export const stravaKind = (a: Pick<StravaActivity, "sport_type" | "type">): WorkoutKind =>
  STRAVA_KINDS[a.sport_type ?? ""] ?? STRAVA_KINDS[a.type ?? ""] ?? "other";

/** A Strava activity as a workout. Strava's kJ of work is about the kcal a rider burns, as Strava shows it. */
export function fromStrava(a: StravaActivity): Omit<Workout, "id" | "sets"> & { stravaId: string } {
  const distanceKm = a.distance > 0 ? Math.round(a.distance / 10) / 100 : null;
  return {
    date: a.start_date_local.slice(0, 10) as DateKey,
    kind: stravaKind(a),
    title: a.name?.trim().slice(0, 80) || null,
    minutes: Math.max(1, Math.round((a.moving_time || a.elapsed_time || 60) / 60)),
    distanceKm,
    kcal: a.kilojoules ? Math.round(a.kilojoules) : null,
    notes: null,
    stravaId: String(a.id),
  };
}

// ── Totals ──

export interface Totals {
  sessions: number;
  minutes: number;
  km: number;
  kcal: number;
  /** Days with at least one workout. */
  activeDays: number;
}

type Countable = Pick<Workout, "date" | "minutes" | "distanceKm" | "kcal">;

/** Everything from `from` to `to`, both included. */
export function totals(workouts: Countable[], from: DateKey | null, to: DateKey): Totals {
  const days = new Set<string>();
  const t: Totals = { sessions: 0, minutes: 0, km: 0, kcal: 0, activeDays: 0 };
  for (const w of workouts) {
    if ((from && w.date < from) || w.date > to) continue;
    t.sessions++;
    t.minutes += w.minutes;
    t.km += w.distanceKm ?? 0;
    t.kcal += w.kcal ?? 0;
    days.add(w.date);
  }
  t.km = Math.round(t.km * 10) / 10;
  t.activeDays = days.size;
  return t;
}

/** Minutes trained in each of the last `weeks` weeks (Monday-first), oldest first, this week last. */
export function weeklyMinutes(workouts: Countable[], today: DateKey, weeks: number): { week: DateKey; minutes: number }[] {
  const thisWeek = weekStartOf(today);
  const out = Array.from({ length: weeks }, (_, i) => ({ week: addDays(thisWeek, -7 * (weeks - 1 - i)), minutes: 0 }));
  const index = new Map(out.map((w, i) => [w.week, i]));
  for (const w of workouts) {
    if (w.date > today) continue;
    const i = index.get(weekStartOf(w.date));
    if (i !== undefined) out[i].minutes += w.minutes;
  }
  return out;
}

/** Weeks in a row, ending with this one or last, that had at least one workout. */
export function weekStreak(workouts: Pick<Workout, "date">[], today: DateKey): number {
  const weeks = new Set(workouts.filter((w) => w.date <= today).map((w) => weekStartOf(w.date)));
  let week = weekStartOf(today);
  // This week isn't over: an empty one so far doesn't break the streak yet.
  if (!weeks.has(week)) week = addDays(week, -7);
  let n = 0;
  while (weeks.has(week)) {
    n++;
    week = addDays(week, -7);
  }
  return n;
}

/** Minutes per kind, largest first, kinds with none left out. */
export function byKind(workouts: Pick<Workout, "kind" | "minutes">[]): { kind: WorkoutKind; minutes: number; sessions: number }[] {
  const map = new Map<WorkoutKind, { minutes: number; sessions: number }>();
  for (const w of workouts) {
    const m = map.get(w.kind) ?? { minutes: 0, sessions: 0 };
    m.minutes += w.minutes;
    m.sessions++;
    map.set(w.kind, m);
  }
  return [...map].map(([kind, m]) => ({ kind, ...m })).sort((a, b) => b.minutes - a.minutes);
}

/** Change in weight over the entries given (sorted any way): last minus first, to 0.1 kg. */
export function weightChange(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return Math.round((sorted[sorted.length - 1].kg - sorted[0].kg) * 10) / 10;
}

/** "1 h 25 min", "40 min". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
