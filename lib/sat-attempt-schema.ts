// The body a finished practice set posts. Zod stays out of lib/sat-qbank.ts so the practice screen,
// which runs in the browser, does not carry it.

import { z } from "zod";
import { idsFrom } from "@/lib/sat-qbank";

/** A set is at most this many questions — the same cap as a practice link. */
export const MAX_SET = 100;

const attemptSchema = z.object({
  questionId: z.string(),
  answer: z.string().max(40).nullable(),
  seconds: z.number().int().min(0).max(6 * 3600).nullable(),
});

const bodySchema = z.object({ attempts: z.array(attemptSchema).min(1).max(MAX_SET) });

export interface AttemptInput {
  questionId: string;
  answer: string | null;
  seconds: number | null;
}

export function readAttempts(value: unknown): { ok: true; attempts: AttemptInput[] } | { ok: false; error: string } {
  const parsed = bodySchema.safeParse(value);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  const attempts: AttemptInput[] = [];
  for (const a of parsed.data.attempts) {
    const [id] = idsFrom(a.questionId, 1);
    if (!id) return { ok: false, error: "That isn't a question id." };
    const answer = a.answer?.trim() || null;
    attempts.push({ questionId: id, answer, seconds: a.seconds });
  }
  return { ok: true, attempts };
}
