// The SAT practice screen's rules. What decides whether it can be trusted: a highlight never
// overlaps another and never loses a note, the eliminator and the answer stay consistent, and a set
// read back from storage is that set or a clean start, never a half-broken one.
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-sat-practice.mjs
import {
  addAnnotation, annotationAt, piecesIn, readAnnotation, removeAnnotation, sortAnnotations, updateAnnotation,
} from "../lib/sat-annotations.ts";
import {
  clampSplit, cleanTyped, clock, freshProgress, pickChoice, restoreProgress, savedSummary, toggleCrossed,
} from "../lib/sat-practice.ts";

let pass = 0;
const failures = [];
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) pass++; else failures.push(`${label}\n    expected ${e}\n    got      ${a}`);
}
function ok(cond, label) { if (cond) pass++; else failures.push(label); }

const TEXT = "abcdefghijklmnopqrstuvwxyz";
const span = (id, start, end, extra = {}) => ({
  id, area: "stimulus", start, end, quote: TEXT.slice(start, end), color: "yellow", underline: false, note: "", ...extra,
});
const ranges = (list) => list.map((a) => [a.id, a.start, a.end]);

// ── adding ───────────────────────────────────────────────────────────────────
eq(ranges(addAnnotation([span("a", 0, 5)], span("b", 10, 15))), [["a", 0, 5], ["b", 10, 15]], "apart: both stay");
eq(ranges(addAnnotation([span("a", 0, 10)], span("b", 5, 15))), [["a", 0, 5], ["b", 5, 15]], "overlap on the right: the old span is trimmed");
eq(ranges(addAnnotation([span("a", 5, 15)], span("b", 0, 10))), [["b", 0, 10], ["a", 10, 15]], "overlap on the left: the old span is trimmed");
eq(ranges(addAnnotation([span("a", 0, 20)], span("b", 5, 10))), [["a", 0, 5], ["b", 5, 10], ["a-r", 10, 20]], "inside: the old span is cut in two");
eq(ranges(addAnnotation([span("a", 5, 10)], span("b", 0, 20))), [["b", 0, 20]], "swallowed whole: the old span goes");
eq(ranges(addAnnotation([span("a", 0, 5)], span("b", 5, 10))), [["a", 0, 5], ["b", 5, 10]], "touching spans don't cut each other");
eq(addAnnotation([span("a", 0, 10)], span("b", 5, 15)).map((a) => a.quote), ["abcde", "fghijklmno"], "a trimmed span's quote follows it");
eq(addAnnotation([span("a", 0, 20)], span("b", 5, 10)).map((a) => a.quote), ["abcde", "fghij", "klmnopqrst"], "both halves keep their own quote");
eq(addAnnotation([], span("a", 5, 5)), [], "an empty selection adds nothing");

const noted = span("a", 0, 20, { note: "mine" });
eq(addAnnotation([noted], span("b", 5, 10)).map((a) => a.note), ["mine", "", ""], "cut in two: the note stays on the left piece only");
eq(addAnnotation([span("a", 5, 10, { note: "mine" })], span("b", 0, 20)).map((a) => a.note), ["mine"], "swallowed whole: its note moves to the new span");
eq(addAnnotation([span("a", 5, 10, { note: "old" })], span("b", 0, 20, { note: "new" })).map((a) => a.note), ["new"], "a new span's own note wins");
eq(addAnnotation([span("a", 5, 15, { note: "mine" })], span("b", 0, 10)).map((a) => a.note), ["", "mine"], "trimmed: it keeps its note");
eq(ranges(addAnnotation([span("a", 0, 10, { area: "stem" })], span("b", 0, 10))), [["b", 0, 10], ["a", 0, 10]], "areas don't touch each other, the passage first");

// Whatever order they are laid down in, no character ends up in two spans.
let laid = [];
for (const [s, e] of [[3, 9], [0, 4], [8, 20], [10, 12], [2, 25], [24, 26], [1, 3]]) {
  laid = addAnnotation(laid, span(`x${s}`, s, e));
  ok(laid.every((a, i) => i === 0 || laid[i - 1].end <= a.start), `no overlap after laying ${s}-${e}`);
  ok(laid.every((a) => a.quote === TEXT.slice(a.start, a.end)), `every quote still matches after laying ${s}-${e}`);
}
ok(new Set(laid.map((a) => a.id)).size === laid.length, "ids stay unique");

// ── changing ─────────────────────────────────────────────────────────────────
eq(updateAnnotation([span("a", 0, 5)], "a", { color: "pink" })[0].color, "pink", "recolour");
eq(updateAnnotation([span("a", 0, 5, { color: "none", underline: true })], "a", { underline: false }), [], "no colour and no underline: nothing left to show");
eq(updateAnnotation([span("a", 0, 5)], "a", { underline: true })[0].underline, true, "underline on top of a colour");
eq(updateAnnotation([span("a", 0, 5)], "zzz", { color: "pink" })[0].color, "yellow", "another id changes nothing");
eq(removeAnnotation([span("a", 0, 5), span("b", 6, 8)], "a").map((a) => a.id), ["b"], "remove");
eq(sortAnnotations([span("b", 1, 2, { area: "stem" }), span("a", 9, 10)]).map((a) => a.id), ["a", "b"], "the passage reads before the question");
eq(annotationAt([span("a", 2, 5)], "stimulus", 4)?.id, "a", "a character in a span");
eq(annotationAt([span("a", 2, 5)], "stimulus", 5), null, "the end is exclusive");
eq(annotationAt([span("a", 2, 5)], "stem", 3), null, "the other area");

// ── cutting a text run ───────────────────────────────────────────────────────
const two = [span("a", 2, 6), span("b", 8, 14)];
eq(piecesIn(two, 0, 10).map((p) => [p.annotation.id, p.start, p.end]), [["b", 8, 10], ["a", 2, 6]], "last piece first, cut at the run's end");
eq(piecesIn(two, 10, 10).map((p) => [p.annotation.id, p.start, p.end]), [["b", 0, 4]], "offsets are local to the run");
eq(piecesIn(two, 20, 5), [], "a run no span reaches");
eq(piecesIn(two, 6, 2), [], "a run between two spans");

// ── reading back an annotation ───────────────────────────────────────────────
ok(readAnnotation(span("a", 0, 5)) !== null, "a good annotation reads back");
for (const [bad, label] of [
  [null, "null"], ["x", "a string"], [{ ...span("a", 0, 5), id: "" }, "no id"], [{ ...span("a", 0, 5), area: "choice" }, "unknown area"],
  [{ ...span("a", 0, 5), start: -1 }, "negative start"], [{ ...span("a", 5, 5) }, "empty span"], [{ ...span("a", 0, 5), start: 1.5 }, "fractional start"],
  [{ ...span("a", 0, 5), color: "green" }, "unknown colour"], [{ ...span("a", 0, 5), note: 3 }, "a note that isn't text"],
]) eq(readAnnotation(bad), null, `refused: ${label}`);
eq(readAnnotation(span("a", 0, 5, { note: "x".repeat(400) })).note.length, 300, "a long note is cut to the limit");

// ── the eliminator ───────────────────────────────────────────────────────────
const base = { answers: { q: "A" }, crossed: {} };
let s = toggleCrossed(base, "q", "B");
eq([s.answers.q, s.crossed.q], ["A", ["B"]], "crossing out another choice keeps the answer");
s = toggleCrossed(base, "q", "A");
eq([s.answers.q, s.crossed.q], [undefined, ["A"]], "crossing out the picked choice takes the answer off it");
s = toggleCrossed(s, "q", "A");
eq([s.answers.q, s.crossed.q], [undefined, []], "undo brings the choice back, not the answer");
s = pickChoice({ answers: {}, crossed: { q: ["C", "D"] } }, "q", "C");
eq([s.answers.q, s.crossed.q], ["C", ["D"]], "picking a crossed-out choice brings it back");
s = pickChoice({ answers: { q: "A" }, crossed: {} }, "q", "B");
eq(s.answers.q, "B", "picking replaces the answer");
eq(base, { answers: { q: "A" }, crossed: {} }, "state is never changed in place");

// ── small rules ──────────────────────────────────────────────────────────────
eq(clock(1865), "31:05", "minutes and seconds");
eq(clock(3729), "1:02:09", "an hour or more");
eq(clock(-4), "0:00", "the clock stops at zero");
eq(cleanTyped("12345678"), "12345", "five characters");
eq(cleanTyped("-1234567"), "-12345", "six with a minus");
eq(cleanTyped("1a/2b%"), "1/2", "only digits, point, slash and minus");
eq([clampSplit(5), clampSplit(50), clampSplit(99)], [25, 50, 75], "the divider stops short of either edge");

// ── reading back a set ───────────────────────────────────────────────────────
const ids = ["aaaa1111", "bbbb2222", "cccc3333"];
const saved = {
  ...freshProgress(600), ids, phase: "review", index: 2, answers: { aaaa1111: "B", cccc3333: "1/2", gone0000: "A" },
  marked: ["bbbb2222", "gone0000"], crossed: { aaaa1111: ["C", "not a letter"] },
  annotations: { aaaa1111: [span("a", 0, 5), { junk: true }] }, left: 321, spent: { aaaa1111: 12.5, bbbb2222: -1 }, split: 60, eliminator: true,
};
const back = restoreProgress(JSON.stringify(saved), ids, 600);
eq([back.phase, back.index, back.left, back.split, back.eliminator], ["review", 2, 321, 60, true], "where it was");
eq(back.answers, { aaaa1111: "B", cccc3333: "1/2" }, "answers, without questions outside the set");
eq(back.marked, ["bbbb2222"], "marks, without questions outside the set");
eq(back.crossed, { aaaa1111: ["C"] }, "crossings, without a bad entry");
eq(back.annotations.aaaa1111.map((a) => a.id), ["a"], "highlights, without a bad entry");
eq(back.spent, { aaaa1111: 12.5 }, "time, without a bad figure");

const fresh = freshProgress(600);
eq(restoreProgress(null, ids, 600), fresh, "nothing saved: a fresh start");
eq(restoreProgress("{not json", ids, 600), fresh, "unreadable: a fresh start");
eq(restoreProgress("[1,2]", ids, 600), fresh, "not an object: a fresh start");
eq(restoreProgress(JSON.stringify({ ...saved, ids: ["aaaa1111"] }), ids, 600), fresh, "another set: a fresh start");
eq(restoreProgress(JSON.stringify({ ...saved, ids: [...ids].reverse() }), ids, 600), fresh, "the same questions in another order are another set");
eq(restoreProgress(JSON.stringify({ ...saved, index: 99 }), ids, 600).index, 0, "an index past the end falls back");
eq(restoreProgress(JSON.stringify({ ...saved, left: 9999 }), ids, 600).left, 600, "the clock never reads more than the limit");
eq(restoreProgress(JSON.stringify({ ...saved, left: -5 }), ids, 600).left, 0, "or less than zero");
eq(restoreProgress(JSON.stringify({ ...saved, left: "soon" }), ids, 600).left, 600, "a clock that isn't a number starts over");
eq(restoreProgress(JSON.stringify({ ...saved, split: 200 }), ids, 600).split, 75, "the divider stays in range");
eq(restoreProgress(JSON.stringify({ ...saved, phase: "results" }), ids, 600).phase, "test", "an unknown phase is the test");

eq(savedSummary(JSON.stringify(saved)), { ids, answered: 3 }, "the summary for Resume");
eq(savedSummary(null), null, "nothing to resume");
eq(savedSummary("nope"), null, "unreadable: nothing to resume");
eq(savedSummary(JSON.stringify({ ids: [] })), null, "an empty set: nothing to resume");
eq(savedSummary(JSON.stringify({ ids: [1, 2] })), null, "ids that aren't text: nothing to resume");

if (failures.length) {
  console.error(`✗ ${failures.length} failed, ${pass} passed\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ SAT practice: ${pass} assertions`);
