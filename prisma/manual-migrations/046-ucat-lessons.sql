-- The UCAT lessons' progress.
--
-- Creates "UcatLessonDone" — one row per finished lesson, keyed by "vr/how-it-works". The lessons
-- themselves live in code (lib/ucat-content); this only remembers which ones are done.
--
-- ADDITIVE, RLS on. Run before (or right as) the deploy: the lessons still open without it, and
-- the done button says it waits for it.
--
-- Idempotent: safe to run again.

BEGIN;

CREATE TABLE IF NOT EXISTS "UcatLessonDone" (
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UcatLessonDone_pkey" PRIMARY KEY ("lessonId")
);

ALTER TABLE "UcatLessonDone" ENABLE ROW LEVEL SECURITY;

COMMIT;
