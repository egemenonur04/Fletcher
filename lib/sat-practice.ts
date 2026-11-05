// A practice set in progress: its rules, and how it is kept on this device.
//
// Pure and dependency-free (scripts/test-sat-practice.mjs). Nothing here reaches the server: a
// question's answer is stored when the set is submitted (SatAttempt), and until then the set lives
// in the browser. One set at a time, under one key, so a reload, a lost connection or leaving the
// screen doesn't lose it. Everything read back is checked, since storage outlives the code that
// wrote it.

import { readAnnotation, type Annotation } from "@/lib/sat-annotations";

export const SAVED_PRACTICE_KEY = "sat-practice-attempt";

export type PracticePhase = "test" | "review";

export interface PracticeProgress {
  phase: PracticePhase;
  index: number;
  answers: Record<string, string>;
  marked: string[];
  crossed: Record<string, string[]>;
  annotations: Record<string, Annotation[]>;
  /** Seconds left on the clock; it stands still while the screen is closed. */
  left: number;
  /** Seconds spent on each question so far. */
  spent: Record<string, number>;
  /** How much of the width the passage takes. */
  split: number;
  eliminator: boolean;
}

export interface SavedPractice extends PracticeProgress {
  ids: string[];
}

export const SPLIT_MIN = 25;
export const SPLIT_MAX = 75;

export function clampSplit(value: number): number {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

export function freshProgress(left: number): PracticeProgress {
  return {
    phase: "test", index: 0, answers: {}, marked: [], crossed: {}, annotations: {}, left, spent: {},
    split: 50, eliminator: false,
  };
}

/** "31:05"; an hour or more as "1:02:09". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

/** What may be typed in a student-produced response box, as in Bluebook: 5 characters, 6 with a minus. */
export function cleanTyped(value: string): string {
  const s = value.replace(/[^0-9./-]/g, "");
  return s.slice(0, s.startsWith("-") ? 6 : 5);
}

/**
 * The answer eliminator. Crossing out a choice takes the answer off it if it was the one picked;
 * crossing it out again puts the choice back, the answer staying off.
 */
export function toggleCrossed<P extends Pick<PracticeProgress, "answers" | "crossed">>(state: P, id: string, label: string): P {
  const list = state.crossed[id] ?? [];
  if (list.includes(label)) {
    return { ...state, crossed: { ...state.crossed, [id]: list.filter((l) => l !== label) } };
  }
  const answers = { ...state.answers };
  if (answers[id] === label) delete answers[id];
  return { ...state, answers, crossed: { ...state.crossed, [id]: [...list, label] } };
}

/** Picking a choice that was crossed out brings it back, as Bluebook does. */
export function pickChoice<P extends Pick<PracticeProgress, "answers" | "crossed">>(state: P, id: string, label: string): P {
  const list = state.crossed[id] ?? [];
  return {
    ...state,
    answers: { ...state.answers, [id]: label },
    crossed: list.includes(label) ? { ...state.crossed, [id]: list.filter((l) => l !== label) } : state.crossed,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

function stringMap(v: unknown, keep: readonly string[]): Record<string, string> {
  if (!isObject(v)) return {};
  return Object.fromEntries(keep.flatMap((id) => (typeof v[id] === "string" && v[id] ? [[id, v[id] as string]] : [])));
}

function numberMap(v: unknown, keep: readonly string[]): Record<string, number> {
  if (!isObject(v)) return {};
  return Object.fromEntries(keep.flatMap((id) => (Number.isFinite(v[id]) && (v[id] as number) >= 0 ? [[id, v[id] as number]] : [])));
}

function listMap<T>(v: unknown, keep: readonly string[], read: (item: unknown) => T | null): Record<string, T[]> {
  if (!isObject(v)) return {};
  return Object.fromEntries(keep.flatMap((id) => {
    const list = Array.isArray(v[id]) ? (v[id] as unknown[]).flatMap((x) => { const r = read(x); return r === null ? [] : [r]; }) : [];
    return list.length ? [[id, list]] : [];
  }));
}

/**
 * What storage holds for this exact set, or a fresh start. A different set of questions, or anything
 * unreadable, starts fresh; a saved field that doesn't fit falls back on its own, keeping the rest.
 */
export function restoreProgress(raw: string | null, ids: readonly string[], limit: number): PracticeProgress {
  const fresh = freshProgress(limit);
  if (!raw) return fresh;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return fresh;
  }
  if (!isObject(v) || !Array.isArray(v.ids) || v.ids.join(",") !== ids.join(",")) return fresh;
  const left = Number.isFinite(v.left) ? Math.min(limit, Math.max(0, Math.round(v.left as number))) : limit;
  const index = Number.isInteger(v.index) && (v.index as number) >= 0 && (v.index as number) < ids.length ? v.index as number : 0;
  return {
    phase: v.phase === "review" ? "review" : "test",
    index,
    answers: stringMap(v.answers, ids),
    marked: Array.isArray(v.marked) ? ids.filter((id) => (v as { marked: unknown[] }).marked.includes(id)) : [],
    crossed: listMap(v.crossed, ids, (x) => (typeof x === "string" && /^[A-Z]$/.test(x) ? x : null)),
    annotations: listMap(v.annotations, ids, readAnnotation),
    left,
    spent: numberMap(v.spent, ids),
    split: Number.isFinite(v.split) ? clampSplit(v.split as number) : fresh.split,
    eliminator: v.eliminator === true,
  };
}

/** The set waiting on this device, for a "Resume" link: its ids and how far it got. */
export function savedSummary(raw: string | null): { ids: string[]; answered: number } | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!isObject(v) || !Array.isArray(v.ids) || v.ids.length === 0 || !v.ids.every((id) => typeof id === "string")) return null;
    return { ids: v.ids as string[], answered: isObject(v.answers) ? Object.keys(v.answers).length : 0 };
  } catch {
    return null;
  }
}
