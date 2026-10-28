-- The UCAT page's practice-score log.
--
-- Creates "UcatScore" — one row per practice test: the date, which test, the three cognitive
-- scores (300–900 each, null when not taken) and the Situational Judgement band (1–4).
--
-- ADDITIVE, RLS on. Run before (or right as) the deploy: the UCAT page still opens without it and
-- says the log waits for it.
--
-- Idempotent: safe to run again.

BEGIN;

CREATE TABLE IF NOT EXISTS "UcatScore" (
    "id" TEXT NOT NULL,
    "takenOn" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "vr" INTEGER,
    "dm" INTEGER,
    "qr" INTEGER,
    "sjt" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UcatScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UcatScore_takenOn_idx" ON "UcatScore"("takenOn");

ALTER TABLE "UcatScore" ENABLE ROW LEVEL SECURITY;

COMMIT;
