// UCAT practice scores. What decides whether the log can be trusted: a score is 300–900 or blank,
// the SJT is a band of 1–4, a date is a real day, and a total only counts all three subtests.
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-ucat.mjs
import { readScoreBody, totalOf } from "../lib/ucat.ts";

let pass = 0;
const failures = [];
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) pass++; else failures.push(`${label}\n    expected ${e}\n    got      ${a}`);
}

const base = { takenOn: "2026-10-28", source: " Official Practice Test A ", vr: "640", dm: 700, qr: "", sjt: "2", notes: "  " };
eq(readScoreBody(base), { ok: true, body: { takenOn: "2026-10-28", source: "Official Practice Test A", vr: 640, dm: 700, qr: null, sjt: 2, notes: null } },
  "a result: trimmed, numbers read, a blank subtest is not taken, blank notes are none");
eq(readScoreBody({ ...base, vr: 290 }).ok, false, "under 300 is refused");
eq(readScoreBody({ ...base, vr: 910 }).ok, false, "over 900 is refused");
eq(readScoreBody({ ...base, vr: "650.5" }).ok, false, "a fraction is refused");
eq(readScoreBody({ ...base, sjt: 5 }).ok, false, "SJT band 5 is refused");
eq(readScoreBody({ ...base, takenOn: "2026-02-30" }).ok, false, "a date that doesn't exist is refused");
eq(readScoreBody({ ...base, takenOn: "28/10/2026" }).ok, false, "a date in another format is refused");
eq(readScoreBody({ ...base, source: "   " }).ok, false, "the test name is required");
eq(readScoreBody({ ...base, vr: "", dm: "", qr: "", sjt: "" }).ok, false, "at least one score is required");
eq(readScoreBody(null).ok, false, "no body is refused");
eq(totalOf({ vr: 640, dm: 700, qr: 610 }), 1950, "the total adds the three subtests");
eq(totalOf({ vr: 640, dm: 700, qr: null }), null, "no total while a subtest is missing");

if (failures.length) {
  console.error(`${pass} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`${pass} passed, 0 failed`);
