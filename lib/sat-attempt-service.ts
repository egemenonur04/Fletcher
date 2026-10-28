// What you answered in the SAT Question Bank. Server-only.

import { db } from "@/lib/db";
import { isMissingTable } from "@/lib/prisma-errors";
import { isCorrect } from "@/lib/sat-qbank";
import { getQuestion } from "@/lib/sat-qbank-service";
import type { AttemptInput } from "@/lib/sat-attempt-schema";

export const ATTEMPTS_MISSING = "Results can't be saved yet. Run 042-sat-attempts.sql.";

/** Where each question stands: never tried, last answered right, or last answered wrong. */
export type QuestionStatus = "new" | "correct" | "incorrect";

/**
 * The latest result per question. An empty map when the table isn't there yet, so the bank still
 * works before 042 has run — it just has no history to show.
 */
export async function latestResults(): Promise<Map<string, QuestionStatus>> {
  try {
    const rows = await db.satAttempt.findMany({
      where: { correct: { not: null } },
      select: { questionId: true, correct: true },
      orderBy: { createdAt: "asc" },
    });
    const map = new Map<string, QuestionStatus>();
    for (const r of rows) map.set(r.questionId, r.correct ? "correct" : "incorrect");
    return map;
  } catch (e) {
    if (isMissingTable(e)) return new Map();
    throw e;
  }
}

/**
 * Saves a finished set. Each answer is marked here, against the bank's key — never trusted from
 * the browser. Questions the bank no longer has are skipped. Returns how many were saved.
 */
export async function recordAttempts(attempts: AttemptInput[]): Promise<number> {
  const rows = [];
  for (const a of attempts) {
    const question = await getQuestion(a.questionId).catch(() => null);
    if (!question) continue;
    rows.push({
      questionId: question.id,
      section: question.section,
      domain: question.domain,
      skill: question.skill,
      difficulty: question.difficulty,
      answer: a.answer,
      correct: isCorrect(question, a.answer),
      seconds: a.seconds,
    });
  }
  if (rows.length) await db.satAttempt.createMany({ data: rows });
  return rows.length;
}
