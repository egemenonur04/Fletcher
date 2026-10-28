// The SAT Question Bank. What decides whether it can be trusted: the index is read defensively and
// de-duplicated, both shapes of question (current and older disclosed items) come out the same,
// typed answers are marked the way Bluebook marks them, and College Board's HTML is cleaned of
// anything that could run in the page.
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-sat-qbank.mjs
import {
  toStub, toStubs, fromExternal, fromIbn, isCorrect, numberOf, filterStubs, skillsOf, idsFrom,
  timeLimitSeconds,
} from "../lib/sat-qbank.ts";
import { cleanQuestionHtml } from "../lib/sat-html.ts";
import { readAttempts } from "../lib/sat-attempt-schema.ts";

let pass = 0;
const failures = [];
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) pass++; else failures.push(`${label}\n    expected ${e}\n    got      ${a}`);
}
function ok(cond, label) { if (cond) pass++; else failures.push(label); }

// ── the index ────────────────────────────────────────────────────────────────
const current = {
  questionId: "6b4c8a1e", external_id: "a1b2-c3", ibn: null, primary_class_cd: "H", primary_class_cd_desc: "Algebra",
  skill_cd: "H.A.", skill_desc: "Linear equations in one variable", difficulty: "E", score_band_range_cd: 2, updateDate: 1700000000000,
};
eq(toStub(current, "math"), {
  id: "6b4c8a1e", section: "math", source: { kind: "external", key: "a1b2-c3" }, domain: "H", skill: "H.A.",
  skillName: "Linear equations in one variable", difficulty: "E", band: 2, updated: 1700000000000,
}, "a current item: fetched by external id, placed by domain and skill");
eq(toStub({ ...current, external_id: "", ibn: "1234" }, "math").source, { kind: "ibn", key: "1234" }, "an older item: fetched by ibn");
eq(toStub({ ...current, external_id: null, ibn: null }, "math"), null, "nothing to fetch it by: left out");
eq(toStub({ ...current, questionId: "" }, "math"), null, "no question id: left out");
eq(toStub({ ...current, difficulty: "X", score_band_range_cd: 9 }, "math").difficulty, null, "an unknown difficulty is no difficulty");
eq(toStub({ ...current, score_band_range_cd: 9 }, "math").band, null, "a band outside 1–7 is no band");
const deduped = toStubs([current, { ...current, external_id: "newer", updateDate: 1800000000000 }, { ...current, external_id: "older", updateDate: 1 }, null, "junk"], "math");
eq(deduped.map((s) => s.source.key), ["newer"], "a question listed twice keeps its newer copy; junk rows are skipped");
eq(toStubs({ not: "a list" }, "rw"), [], "a body that isn't a list is an empty index");

// ── current items ────────────────────────────────────────────────────────────
const stub = toStub(current, "math");
const mcq = fromExternal({
  type: "mcq", stem: "<p>What is x?</p>", stimulus: "", rationale: "<p>Choice B is correct.</p>",
  answerOptions: [{ id: "o1", content: "<p>1</p>" }, { id: "o2", content: "<p>2</p>" }, { id: "o3", content: "<p>3</p>" }, { id: "o4", content: "<p>4</p>" }],
  correct_answer: ["b"], keys: ["o2"],
}, stub);
eq([mcq.type, mcq.options.map((o) => o.label), mcq.correct, mcq.difficulty], ["mcq", ["A", "B", "C", "D"], ["B"], "E"],
  "multiple choice: options lettered in order, the key upper-cased, placed under its index entry");
eq(fromExternal({ type: "mcq", stem: "<p>?</p>", answerOptions: [{ content: "a" }, { content: "b" }], correct_answer: ["E"] }, stub).correct, [],
  "a key pointing past the options is no key");
const spr = fromExternal({ type: "spr", stem: "<p>Find y.</p>", answerOptions: [], correct_answer: [".5", "1/2"] }, stub);
eq([spr.type, spr.options, spr.correct], ["spr", [], [".5", "1/2"]], "a typed answer: no options, every accepted answer kept");
eq(fromExternal({ stem: "<p>?</p>" }, stub).type, "spr", "no options and no type: typed");
eq(fromExternal({ stem: "", stimulus: "" }, stub), null, "no text at all: no question");

// ── older disclosed items ────────────────────────────────────────────────────
const ibnStub = toStub({ ...current, external_id: null, ibn: "777" }, "math");
const old = fromIbn([{
  body: "<p>A table.</p>", prompt: "<p>Which is true?</p>",
  answer: { style: "Multiple Choice", choices: { b: { body: "<p>Two</p>" }, a: { body: "<p>One</p>" } }, correct_choice: "b", rationale: "<p>B.</p>" },
}], ibnStub);
eq([old.type, old.stimulus, old.stem, old.options.map((o) => o.label), old.correct], ["mcq", "<p>A table.</p>", "<p>Which is true?</p>", ["A", "B"], ["B"]],
  "a disclosed item: body is the passage, prompt the question, choices sorted and lettered");
const noPrompt = fromIbn([{ body: "<p>Solve 2x = 4.</p>", answer: { style: "Grid In", correct_choice: "2" } }], ibnStub);
eq([noPrompt.type, noPrompt.stimulus, noPrompt.stem, noPrompt.correct], ["spr", "", "<p>Solve 2x = 4.</p>", ["2"]],
  "no prompt: the body is the question; a grid-in is typed");
eq(fromIbn([{ body: "<p>x</p>", answer: { style: "Multiple Choice", choices: { a: { body: "1" } } } }], ibnStub).correct, [],
  "no key given: none invented");
eq(fromIbn([], ibnStub), null, "an empty answer is no question");

// ── marking ──────────────────────────────────────────────────────────────────
eq([numberOf("1/2"), numberOf(".5"), numberOf("-3"), numberOf("4."), numberOf("1/0"), numberOf("abc"), numberOf("−2")],
  [0.5, 0.5, -3, 4, null, null, -2], "typed numbers: fractions, bare decimals, negatives (either minus sign)");
ok(isCorrect(mcq, "B") && isCorrect(mcq, "b") && !isCorrect(mcq, "C"), "multiple choice: the letter, either case");
eq(isCorrect(mcq, ""), false, "a blank answer is wrong");
ok(isCorrect(spr, "0.5") && isCorrect(spr, "1/2") && isCorrect(spr, "2/4") && isCorrect(spr, " .5 "),
  "a typed answer worth the same number as an accepted one is right");
ok(!isCorrect(spr, "0.55") && !isCorrect(spr, "1/3"), "a different number is wrong");
eq(isCorrect({ type: "spr", correct: ["3.5", "7/2"] }, "3.50"), true, "trailing zeros are the same number");
eq(isCorrect({ type: "mcq", correct: [] }, "A"), null, "no key: neither right nor wrong");

// ── filtering ────────────────────────────────────────────────────────────────
const pool = [
  toStub(current, "math"),
  toStub({ ...current, questionId: "b", skill_cd: "P.C.", skill_desc: "Nonlinear functions", primary_class_cd: "P", difficulty: "H" }, "math"),
  toStub({ ...current, questionId: "c", difficulty: "H" }, "math"),
];
eq(filterStubs(pool, { domain: "H" }).map((s) => s.id), ["6b4c8a1e", "c"], "by domain");
eq(filterStubs(pool, { difficulty: "H" }).map((s) => s.id), ["b", "c"], "by difficulty");
eq(filterStubs(pool, { domain: "H", difficulty: "H" }).map((s) => s.id), ["c"], "filters combine");
eq(filterStubs(pool, {}).length, 3, "no filter: everything");
eq(skillsOf(pool).map((s) => [s.skill, s.count]), [["H.A.", 2], ["P.C.", 1]], "each skill once, in the bank's order of domains, with its count");

// ── practice links and timing ────────────────────────────────────────────────
eq(idsFrom("6b4c8a1e, abc12345,,6b4c8a1e,../etc,<x>"), ["6b4c8a1e", "abc12345"], "ids: trimmed, de-duplicated, anything odd dropped");
eq(idsFrom("a1b2,c3d4,e5f6", 2), ["a1b2", "c3d4"], "ids: capped");
eq(idsFrom(null), [], "no ids");
eq(timeLimitSeconds({ rw: 27, math: 0 }), 32 * 60, "27 Reading and Writing questions: 32 minutes, as in Bluebook");
eq(timeLimitSeconds({ rw: 0, math: 22 }), 35 * 60, "22 Math questions: 35 minutes");

// ── what a practice set posts ────────────────────────────────────────────────
eq(readAttempts({ attempts: [{ questionId: "6b4c8a1e", answer: " B ", seconds: 40 }] }),
  { ok: true, attempts: [{ questionId: "6b4c8a1e", answer: "B", seconds: 40 }] }, "an answer, trimmed");
eq(readAttempts({ attempts: [{ questionId: "6b4c8a1e", answer: "  ", seconds: null }] }).attempts[0].answer, null, "a blank answer is no answer");
eq(readAttempts({ attempts: [{ questionId: "../x", answer: "A", seconds: 1 }] }).ok, false, "a bad id is refused");
eq(readAttempts({ attempts: [] }).ok, false, "an empty set is refused");
eq(readAttempts(null).ok, false, "no body is refused");

// ── cleaning College Board's HTML ────────────────────────────────────────────
const dirty = '<p onclick="steal()">Hi<script>alert(1)</script></p><img src="javascript:alert(1)"><a href="https://evil">link</a><iframe src="x"></iframe>';
const clean = cleanQuestionHtml(dirty);
ok(!/script|onclick|javascript|iframe|<a /i.test(clean), `scripts, handlers, javascript: URLs, links and frames are removed: ${clean}`);
ok(clean.includes("<p>Hi</p>"), "the prose stays");
const math = cleanQuestionHtml('<math display="block"><mfrac><mn>1</mn><mn>2</mn></mfrac></math>');
eq(math, '<math display="block"><mfrac><mn>1</mn><mn>2</mn></mfrac></math>', "MathML survives as written");
const svg = cleanQuestionHtml('<svg viewBox="0 0 10 10" onload="x()"><path d="M0 0L10 10" stroke="black"/><use href="https://evil/#a"/><use href="#a"/></svg>');
ok(svg.includes('viewBox="0 0 10 10"') && svg.includes('<path d="M0 0L10 10" stroke="black"') && !svg.includes("onload"),
  `SVG figures keep their case-sensitive attributes and lose handlers: ${svg}`);
ok(!svg.includes("https://evil") && svg.includes('href="#a"'), "an SVG <use> may only point inside the figure");
ok(cleanQuestionHtml('<img src="data:image/png;base64,AAAA" alt="graph">').includes('src="data:image/png;base64,AAAA"'), "data-URI images stay");
eq(cleanQuestionHtml(""), "", "nothing in, nothing out");

if (failures.length) {
  console.error(`${pass} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`${pass} passed, 0 failed`);
