-- Health: workouts, their routines, body weight, and the Strava connection.
--
-- Creates "Workout" (typed in or imported from Strava; "stravaId" unique so a sync never
-- doubles up), "WorkoutSet" (exercise, sets × reps × kg; deleted with its workout),
-- "BodyWeight" (one a day) and "StravaAccount" (the one athlete's tokens).
--
-- ADDITIVE, RLS on. Run before (or right as) the deploy: Exercise and Progress still open
-- without it and say they wait for it.
--
-- Idempotent: safe to run again.

BEGIN;

CREATE TABLE IF NOT EXISTS "Workout" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT,
    "minutes" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "kcal" INTEGER,
    "notes" TEXT,
    "stravaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkoutSet" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "exercise" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BodyWeight" (
    "date" DATE NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyWeight_pkey" PRIMARY KEY ("date")
);

CREATE TABLE IF NOT EXISTS "StravaAccount" (
    "id" TEXT NOT NULL DEFAULT 'me',
    "athleteId" TEXT NOT NULL,
    "athleteName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StravaAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Workout_stravaId_key" ON "Workout"("stravaId");
CREATE INDEX IF NOT EXISTS "Workout_date_idx" ON "Workout"("date");
CREATE INDEX IF NOT EXISTS "WorkoutSet_workoutId_idx" ON "WorkoutSet"("workoutId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkoutSet_workoutId_fkey') THEN
    ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutId_fkey"
      FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Workout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutSet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BodyWeight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StravaAccount" ENABLE ROW LEVEL SECURITY;

COMMIT;
