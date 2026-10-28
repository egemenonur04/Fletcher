// UCAT practice scores: what a practice test result is, and checking one typed in.
//
// Pure and dependency-free (scripts/test-ucat.mjs). The UCAT has three cognitive subtests scored
// 300–900 each (a total of 900–2700) and the Situational Judgement Test reported as Band 1–4,
// Band 1 the best. Abstract Reasoning was dropped from 2025.

export const UCAT_NOT_READY = "The UCAT score log isn't set up yet. Run 044-ucat-scores.sql.";

export const SUBTESTS = [
  { key: "vr", name: "Verbal Reasoning", questions: 44, minutes: 22, scale: "300–900" },
  { key: "dm", name: "Decision Making", questions: 35, minutes: 37, scale: "300–900" },
  { key: "qr", name: "Quantitative Reasoning", questions: 36, minutes: 26, scale: "300–900" },
  { key: "sjt", name: "Situational Judgement", questions: 69, minutes: 26, scale: "Band 1–4" },
] as const;

export const SCORE_MIN = 300;
export const SCORE_MAX = 900;

export interface UcatScore {
  id: string;
  /** "YYYY-MM-DD". */
  takenOn: string;
  /** Which practice test: "Official Practice Test A", a question bank set… */
  source: string;
  vr: number | null;
  dm: number | null;
  qr: number | null;
  /** 1–4; 1 is the best band. */
  sjt: number | null;
  notes: string | null;
}

export type UcatScoreBody = Omit<UcatScore, "id">;

/** The three cognitive scores added up — only when all three were taken. */
export function totalOf(s: Pick<UcatScore, "vr" | "dm" | "qr">): number | null {
  return s.vr !== null && s.dm !== null && s.qr !== null ? s.vr + s.dm + s.qr : null;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** A score typed into the form: blank is "not taken"; anything else must be 300–900. */
function scoreFrom(value: unknown): number | null | "bad" {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isInteger(n) && n >= SCORE_MIN && n <= SCORE_MAX ? n : "bad";
}

export function readScoreBody(value: unknown): { ok: true; body: UcatScoreBody } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Send the score as JSON." };
  const v = value as Record<string, unknown>;
  const takenOn = typeof v.takenOn === "string" ? v.takenOn.trim() : "";
  if (!isDate(takenOn)) return { ok: false, error: "Pick the date you took it." };
  const source = typeof v.source === "string" ? v.source.trim() : "";
  if (!source) return { ok: false, error: "Say which practice test it was." };
  if (source.length > 80) return { ok: false, error: "Keep the test name under 80 characters." };
  const vr = scoreFrom(v.vr), dm = scoreFrom(v.dm), qr = scoreFrom(v.qr);
  if (vr === "bad" || dm === "bad" || qr === "bad") return { ok: false, error: `Scores run from ${SCORE_MIN} to ${SCORE_MAX}.` };
  let sjt: number | null = null;
  if (v.sjt !== null && v.sjt !== undefined && v.sjt !== "") {
    const n = Number(v.sjt);
    if (!Number.isInteger(n) || n < 1 || n > 4) return { ok: false, error: "The SJT band is 1, 2, 3 or 4." };
    sjt = n;
  }
  if (vr === null && dm === null && qr === null && sjt === null) return { ok: false, error: "Enter at least one score." };
  const notes = typeof v.notes === "string" && v.notes.trim() ? v.notes.trim() : null;
  if (notes && notes.length > 500) return { ok: false, error: "Keep the notes under 500 characters." };
  return { ok: true, body: { takenOn, source, vr, dm, qr, sjt, notes } };
}
