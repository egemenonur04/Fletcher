// UCAT practice scores. What decides whether the log can be trusted: a score is 300–900 or blank,
// the SJT is a band of 1–4, a date is a real day, and a total only counts all three subtests.
// And the lessons: every question's key points at a real answer, ids are unique, and the marking
// matches the real test's.
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-ucat.mjs
import { readScoreBody, totalOf } from "../lib/ucat.ts";
import { COURSES, SUBTEST_ORDER, allLessonIds, findLesson, ratingCredit, readLessonDoneBody, yesNoMarks } from "../lib/ucat-lessons.ts";

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

// ── Lessons ──
eq(yesNoMarks(5), 2, "drag-and-drop: five right is 2 marks");
eq(yesNoMarks(4), 1, "drag-and-drop: four right is 1 mark");
eq(yesNoMarks(3), 0, "drag-and-drop: three right is nothing");
eq([ratingCredit(1, 1), ratingCredit(0, 1), ratingCredit(3, 1)], [1, 0.5, 0], "SJT: key full, one step half, two steps nothing");

eq(readLessonDoneBody({ lessonId: "vr/how-it-works", done: true }), { ok: true, lessonId: "vr/how-it-works", done: true }, "a real lesson can be marked done");
eq(readLessonDoneBody({ lessonId: "vr/nope", done: true }).ok, false, "an unknown lesson is refused");
eq(readLessonDoneBody({ lessonId: "../vr/how-it-works", done: true }).ok, false, "a made-up id is refused");
eq(readLessonDoneBody({ lessonId: "vr/how-it-works", done: "yes" }).ok, false, "done must be a boolean");
eq(readLessonDoneBody(null).ok, false, "no body is refused");
eq(findLesson("ar", "how-it-works"), null, "Abstract Reasoning is gone");
eq(findLesson("dm", "missing"), null, "an unknown lesson is not found");

const ids = allLessonIds();
eq(new Set(ids).size, ids.length, "lesson ids are unique");
const questionIds = [];
const problems = [];
for (const key of SUBTEST_ORDER) {
  const course = COURSES[key];
  if (course.key !== key) problems.push(`${key}: course key is ${course.key}`);
  if (course.lessons.length < 4) problems.push(`${key}: only ${course.lessons.length} lessons`);
  for (const lesson of course.lessons) {
    const where = `${key}/${lesson.slug}`;
    if (!/^[a-z0-9-]+$/.test(lesson.slug)) problems.push(`${where}: slug not url-safe`);
    if (!lesson.sections.length) problems.push(`${where}: no teaching`);
    if (!lesson.terms.length) problems.push(`${where}: no key terms`);
    if (!lesson.practice.length) problems.push(`${where}: no practice`);
    for (const q of [...lesson.examples, ...lesson.practice]) {
      questionIds.push(q.id);
      const at = `${where} ${q.id}`;
      if (q.kind === "mcq") {
        if (q.options.length < 3 || q.options.length > 5) problems.push(`${at}: ${q.options.length} options`);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) problems.push(`${at}: answer out of range`);
        if (new Set(q.options).size !== q.options.length) problems.push(`${at}: repeated option`);
        if (!q.explanation) problems.push(`${at}: no explanation`);
      } else if (q.kind === "yesno") {
        if (q.statements.length !== 5) problems.push(`${at}: ${q.statements.length} statements, not 5`);
        if (q.statements.some((st) => typeof st.answer !== "boolean" || !st.why)) problems.push(`${at}: statement without answer or reason`);
      } else if (q.kind === "rating") {
        if (q.items.length < 2) problems.push(`${at}: too few items`);
        if (q.items.some((it) => ![0, 1, 2, 3].includes(it.answer) || !it.why)) problems.push(`${at}: item without a 0–3 key or reason`);
      } else problems.push(`${at}: unknown kind`);
    }
  }
}
eq(problems, [], "every lesson has teaching, terms and practice, and every key points at a real answer");
eq(new Set(questionIds).size, questionIds.length, "question ids are unique");
eq(COURSES.dm.lessons.flatMap((l) => [...l.examples, ...l.practice]).some((q) => q.kind === "yesno"), true, "Decision Making practises drag-and-drop");
eq(COURSES.sjt.lessons.flatMap((l) => [...l.examples, ...l.practice]).some((q) => q.kind === "rating"), true, "Situational Judgement practises ratings");

if (failures.length) {
  console.error(`${pass} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`${pass} passed, 0 failed`);
