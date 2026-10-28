// The SAT Suite Question Bank: reading College Board's answers and checking a student's.
//
// Pure and dependency-free (scripts/test-sat-qbank.mjs). The network side is
// lib/sat-qbank-service.ts. College Board publishes the bank at satsuitequestionbank.collegeboard.org;
// its API is public but undocumented, so every field is read defensively — anything missing is
// left out rather than guessed.
//
// Two shapes of question come back. Current items (`external_id`) carry `stem`, `stimulus`,
// `answerOptions[{id, content}]`, `correct_answer` (letters, or the accepted answers for a
// student-produced response) and `rationale`. Older disclosed items (`ibn`) carry `prompt`, `body`
// and `answer: {style, choices: {a: {body}}, correct_choice, rationale}`.

export type SatSection = "rw" | "math";
export type SatDifficulty = "E" | "M" | "H";

/** The bank's `test` number for each section, and the domains to ask for. */
export const SECTION_QUERY: Record<SatSection, { test: number; domains: string }> = {
  rw: { test: 1, domains: "INI,CAS,EOI,SEC" },
  math: { test: 2, domains: "H,P,Q,S" },
};

export const SECTION_LABELS: Record<SatSection, string> = {
  rw: "Reading and Writing",
  math: "Math",
};

export const DOMAIN_LABELS: Record<string, string> = {
  INI: "Information and Ideas",
  CAS: "Craft and Structure",
  EOI: "Expression of Ideas",
  SEC: "Standard English Conventions",
  H: "Algebra",
  P: "Advanced Math",
  Q: "Problem-Solving and Data Analysis",
  S: "Geometry and Trigonometry",
};

export const DIFFICULTY_LABELS: Record<SatDifficulty, string> = { E: "Easy", M: "Medium", H: "Hard" };

/**
 * Bluebook's pace: Reading and Writing is 27 questions in 32 minutes, Math 22 in 35. A practice set
 * gets the same time per question.
 */
export const SECONDS_PER_QUESTION: Record<SatSection, number> = { rw: (32 * 60) / 27, math: (35 * 60) / 22 };

export function timeLimitSeconds(counts: Record<SatSection, number>): number {
  return Math.round(counts.rw * SECONDS_PER_QUESTION.rw + counts.math * SECONDS_PER_QUESTION.math);
}

/** One line of the bank's index: enough to filter on and to fetch the question later. */
export interface SatStub {
  /** College Board's short question id ("6b4c8a1e") — what its own site shows. */
  id: string;
  section: SatSection;
  /** How to fetch the body: a current item by external id, an older one by its ibn. */
  source: { kind: "external"; key: string } | { kind: "ibn"; key: string };
  domain: string;
  skill: string;
  skillName: string;
  difficulty: SatDifficulty | null;
  /** 1–7, finer than the difficulty letter; null when not given. */
  band: number | null;
  /** For keeping the newer of two copies of the same question. */
  updated: number;
}

export interface SatOption {
  label: string;
  html: string;
}

export interface SatQuestion {
  id: string;
  section: SatSection;
  domain: string;
  skill: string;
  skillName: string;
  difficulty: SatDifficulty | null;
  /** Multiple choice, or a student-produced response typed into a box. */
  type: "mcq" | "spr";
  stimulus: string;
  stem: string;
  options: SatOption[];
  /** Option letters for multiple choice; every accepted answer for a typed one. Empty: no key. */
  correct: string[];
  rationale: string;
}

type Raw = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function html(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** One index entry, or null when it can't be fetched or placed. */
export function toStub(raw: Raw | null | undefined, section: SatSection): SatStub | null {
  if (!raw || typeof raw !== "object") return null;
  const id = text(raw.questionId);
  const external = text(raw.external_id);
  const ibn = text(raw.ibn);
  if (!id || (!external && !ibn)) return null;
  const difficulty = text(raw.difficulty).toUpperCase();
  const band = Number(raw.score_band_range_cd);
  const updated = Number(raw.updateDate);
  return {
    id,
    section,
    source: external ? { kind: "external", key: external } : { kind: "ibn", key: ibn },
    domain: text(raw.primary_class_cd),
    skill: text(raw.skill_cd),
    skillName: text(raw.skill_desc),
    difficulty: difficulty === "E" || difficulty === "M" || difficulty === "H" ? difficulty : null,
    band: Number.isInteger(band) && band >= 1 && band <= 7 ? band : null,
    updated: Number.isFinite(updated) ? updated : 0,
  };
}

/** The index, read and de-duplicated: the bank lists some questions twice; the newer copy wins. */
export function toStubs(rows: unknown, section: SatSection): SatStub[] {
  const list = Array.isArray(rows) ? rows : [];
  const byId = new Map<string, SatStub>();
  for (const row of list) {
    const stub = toStub(row as Raw, section);
    if (!stub) continue;
    const seen = byId.get(stub.id);
    if (!seen || stub.updated > seen.updated) byId.set(stub.id, stub);
  }
  return [...byId.values()];
}

const letter = (i: number) => String.fromCharCode(65 + i);

/** A current item's body, placed under its index entry. */
export function fromExternal(raw: Raw | null | undefined, stub: SatStub): SatQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const answerOptions = Array.isArray(raw.answerOptions) ? (raw.answerOptions as Raw[]) : [];
  const options = answerOptions.map((o, i) => ({ label: letter(i), html: html(o?.content) }));
  const type = text(raw.type).toLowerCase() === "spr" || options.length === 0 ? "spr" : "mcq";
  const keys = Array.isArray(raw.correct_answer) ? raw.correct_answer.map((k) => text(k)).filter(Boolean) : [];
  const correct = type === "mcq"
    ? keys.map((k) => k.toUpperCase()).filter((k) => /^[A-Z]$/.test(k) && k.charCodeAt(0) - 65 < options.length)
    : keys;
  const stem = html(raw.stem);
  if (!stem && !html(raw.stimulus)) return null;
  return {
    ...placement(stub),
    type,
    stimulus: html(raw.stimulus),
    stem,
    options: type === "mcq" ? options : [],
    correct,
    rationale: html(raw.rationale),
  };
}

/** An older disclosed item's body (the bank answers with a one-element list). */
export function fromIbn(raw: unknown, stub: SatStub): SatQuestion | null {
  const item = (Array.isArray(raw) ? raw[0] : raw) as Raw | undefined;
  if (!item || typeof item !== "object") return null;
  const answer = (item.answer ?? {}) as Raw;
  const type = text(answer.style).toLowerCase() === "multiple choice" ? "mcq" : "spr";
  const choices = (answer.choices ?? {}) as Record<string, Raw | undefined>;
  const options = Object.keys(choices)
    .filter((k) => /^[a-z]$/i.test(k))
    .sort()
    .map((k) => ({ label: k.toUpperCase(), html: html(choices[k]?.body) }));
  const key = text(answer.correct_choice);
  let stimulus = html(item.body);
  let stem = html(item.prompt);
  // With no prompt, the body is the question itself.
  if (!stem.trim()) {
    stem = stimulus;
    stimulus = "";
  }
  if (!stem.trim()) return null;
  return {
    ...placement(stub),
    type,
    stimulus,
    stem,
    options: type === "mcq" ? options : [],
    correct: key ? [type === "mcq" ? key.toUpperCase() : key] : [],
    rationale: html(answer.rationale),
  };
}

function placement(stub: SatStub) {
  return {
    id: stub.id,
    section: stub.section,
    domain: stub.domain,
    skill: stub.skill,
    skillName: stub.skillName,
    difficulty: stub.difficulty,
  };
}

/** A typed answer as a number: "1/2", ".5", "-3", "4.25"; null when it isn't one. */
export function numberOf(value: string): number | null {
  const s = value.replace(/\s+/g, "").replace(/−/g, "-");
  if (!s) return null;
  const fraction = /^(-?)(\d+)\/(\d+)$/.exec(s);
  if (fraction) {
    const den = Number(fraction[3]);
    if (den === 0) return null;
    return (fraction[1] ? -1 : 1) * (Number(fraction[2]) / den);
  }
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : null;
}

/**
 * Whether an answer is right. Multiple choice: the letter. A typed answer: any accepted answer,
 * written the same way or worth the same number — "0.5" and ".5" and "1/2" are one answer when the
 * key lists any of them. A question with no key is never marked right or wrong (null).
 */
export function isCorrect(question: Pick<SatQuestion, "type" | "correct">, answer: string | null | undefined): boolean | null {
  if (question.correct.length === 0) return null;
  const given = (answer ?? "").trim();
  if (!given) return false;
  if (question.type === "mcq") return question.correct.includes(given.toUpperCase());
  const compact = given.replace(/\s+/g, "");
  const value = numberOf(compact);
  return question.correct.some((key) => {
    const k = key.replace(/\s+/g, "");
    if (k === compact) return true;
    const n = numberOf(k);
    return n !== null && value !== null && Math.abs(n - value) < 1e-9;
  });
}

/** What the bank page filters on. Empty strings mean "any". */
export interface StubFilter {
  domain?: string;
  skill?: string;
  difficulty?: string;
}

export function filterStubs(stubs: readonly SatStub[], f: StubFilter): SatStub[] {
  return stubs.filter((s) =>
    (!f.domain || s.domain === f.domain) &&
    (!f.skill || s.skill === f.skill) &&
    (!f.difficulty || s.difficulty === f.difficulty));
}

/** Each skill once, under its domain, in the bank's order of domains. */
export function skillsOf(stubs: readonly SatStub[]): { domain: string; skill: string; name: string; count: number }[] {
  const order = Object.keys(DOMAIN_LABELS);
  const map = new Map<string, { domain: string; skill: string; name: string; count: number }>();
  for (const s of stubs) {
    if (!s.skill) continue;
    const found = map.get(s.skill);
    if (found) found.count++;
    else map.set(s.skill, { domain: s.domain, skill: s.skill, name: s.skillName || s.skill, count: 1 });
  }
  return [...map.values()].sort((a, b) =>
    order.indexOf(a.domain) - order.indexOf(b.domain) || a.name.localeCompare(b.name));
}

/** Question ids carried in a practice link: short hex/alnum ids, comma-separated, at most `max`. */
export function idsFrom(value: string | null | undefined, max = 100): string[] {
  const out: string[] = [];
  for (const part of (value ?? "").split(",")) {
    const id = part.trim();
    if (/^[A-Za-z0-9-]{4,64}$/.test(id) && !out.includes(id)) out.push(id);
    if (out.length >= max) break;
  }
  return out;
}
