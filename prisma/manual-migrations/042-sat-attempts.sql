-- The SAT section's Question Bank: what you answered.
--
-- Creates "SatAttempt" — one row per question answered in a practice set: the question's College
-- Board id, where it sits (section, domain, skill, difficulty), the answer, whether it was right
-- and how long it took. The questions themselves are not stored; they are fetched from College
-- Board when needed.
--
-- ADDITIVE, RLS on. Run before (or right as) the deploy: the Question Bank still lists and opens
-- questions without it, but results aren't saved until it has run.
--
-- Idempotent: safe to run again.

BEGIN;

CREATE TABLE IF NOT EXISTS "SatAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "difficulty" TEXT,
    "answer" TEXT,
    "correct" BOOLEAN,
    "seconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SatAttempt_questionId_idx" ON "SatAttempt"("questionId");
CREATE INDEX IF NOT EXISTS "SatAttempt_createdAt_idx" ON "SatAttempt"("createdAt");

ALTER TABLE "SatAttempt" ENABLE ROW LEVEL SECURITY;

COMMIT;
