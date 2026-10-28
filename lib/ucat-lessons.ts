// The UCAT lessons: what a lesson is made of, and the four subtests' courses.
//
// Pure data and dependency-free (scripts/test-ucat.mjs checks every lesson's shape and answers).
// The teaching follows "Mastering the UCAT" (Nordstrom, Rendel, Tavares, 3rd ed., 2019), retold in
// our own words and brought up to the format used from 2025 — Abstract Reasoning is gone and the
// timings changed. Every question is written for this site; none is copied from the book.

import { VR } from "@/lib/ucat-content/vr";
import { DM } from "@/lib/ucat-content/dm";
import { QR } from "@/lib/ucat-content/qr";
import { SJT } from "@/lib/ucat-content/sjt";

export type SubtestKey = "vr" | "dm" | "qr" | "sjt";

/** A piece of a lesson or a question's stimulus. */
export type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "tip"; text: string }
  | { kind: "table"; head: string[]; rows: string[][] };

export interface Term {
  term: string;
  definition: string;
}

/** One multiple-choice question: three to five options (True / False / Can't Tell is three), one right. */
export interface McqQuestion {
  kind: "mcq";
  id: string;
  stimulus?: Block[];
  prompt: string;
  options: string[];
  /** Index into options. */
  answer: number;
  explanation: string;
}

/** Decision Making's drag-and-drop: five statements, each Yes (follows) or No. */
export interface YesNoQuestion {
  kind: "yesno";
  id: string;
  stimulus: Block[];
  prompt: string;
  statements: { text: string; answer: boolean; why: string }[];
}

/** Situational Judgement: one scenario, several responses each rated on a four-point scale. */
export interface RatingQuestion {
  kind: "rating";
  id: string;
  stimulus: Block[];
  prompt: string;
  scale: "appropriate" | "important";
  /** answer: 0 is the top of the scale (very appropriate / very important). */
  items: { text: string; answer: 0 | 1 | 2 | 3; why: string }[];
}

export type Question = McqQuestion | YesNoQuestion | RatingQuestion;

export interface LessonSection {
  heading: string;
  blocks: Block[];
}

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  sections: LessonSection[];
  terms: Term[];
  /** Worked through on the page, answer one click away. */
  examples: Question[];
  /** Tried first, then marked. */
  practice: Question[];
}

export interface Subtest {
  key: SubtestKey;
  name: string;
  intro: string;
  questions: number;
  minutes: number;
  lessons: Lesson[];
}

export const SCALES: Record<RatingQuestion["scale"], string[]> = {
  appropriate: [
    "A very appropriate thing to do",
    "Appropriate, but not ideal",
    "Inappropriate, but not awful",
    "A very inappropriate thing to do",
  ],
  important: ["Very important", "Important", "Of minor importance", "Not important at all"],
};

export const SUBTEST_ORDER: SubtestKey[] = ["vr", "dm", "qr", "sjt"];

export const COURSES: Record<SubtestKey, Subtest> = { vr: VR, dm: DM, qr: QR, sjt: SJT };

export function isSubtest(value: string): value is SubtestKey {
  return (SUBTEST_ORDER as string[]).includes(value);
}

/** A lesson's id as stored for progress: "vr/clue-words". */
export const lessonId = (subtest: SubtestKey, slug: string) => `${subtest}/${slug}`;

export function findLesson(subtest: string, slug: string): { course: Subtest; lesson: Lesson; index: number } | null {
  if (!isSubtest(subtest)) return null;
  const course = COURSES[subtest];
  const index = course.lessons.findIndex((l) => l.slug === slug);
  return index === -1 ? null : { course, lesson: course.lessons[index], index };
}

/** Every lesson id, for checking what a client may mark as done. */
export function allLessonIds(): string[] {
  return SUBTEST_ORDER.flatMap((k) => COURSES[k].lessons.map((l) => lessonId(k, l.slug)));
}

/** Decision Making's drag-and-drop marking: all five right is 2 marks, four is 1, fewer is 0. */
export function yesNoMarks(correctCount: number): 0 | 1 | 2 {
  return correctCount >= 5 ? 2 : correctCount === 4 ? 1 : 0;
}

/**
 * Situational Judgement marking, as UCAT describes it: the keyed answer earns full marks, the one
 * next to it partial, two or more steps away nothing. Returned as 1, 0.5 or 0.
 */
export function ratingCredit(given: number, key: number): 0 | 0.5 | 1 {
  const off = Math.abs(given - key);
  return off === 0 ? 1 : off === 1 ? 0.5 : 0;
}

export const LESSONS_NOT_READY = "Lesson progress is waiting for its database table — run migration 046-ucat-lessons.sql.";

/** A request to mark a lesson done or not: a lesson that exists, and a yes or no. */
export function readLessonDoneBody(raw: unknown): { ok: true; lessonId: string; done: boolean } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Send a lesson and whether it is done" };
  const { lessonId: id, done } = raw as { lessonId?: unknown; done?: unknown };
  if (typeof id !== "string" || !allLessonIds().includes(id)) return { ok: false, error: "No such lesson" };
  if (typeof done !== "boolean") return { ok: false, error: "done must be true or false" };
  return { ok: true, lessonId: id, done };
}
