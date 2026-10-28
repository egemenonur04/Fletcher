export const dynamic = "force-dynamic";

import StravaCard, { type StravaNotice, type StravaState } from "@/components/self-care/StravaCard";
import WorkoutLog from "@/components/self-care/WorkoutLog";
import { addDays, todayKey } from "@/lib/dates";
import { HEALTH_NOT_READY } from "@/lib/health";
import { listWorkouts } from "@/lib/health-service";
import { stravaAccount, stravaConfigured } from "@/lib/strava";

export default async function ExercisePage({ searchParams }: { searchParams: Promise<{ strava?: string; message?: string }> }) {
  const { strava, message } = await searchParams;
  const workouts = await listWorkouts(addDays(todayKey(), -89));

  let state: StravaState = { kind: "not-configured" };
  if (workouts !== null && stravaConfigured()) {
    const account = await stravaAccount();
    state = account
      ? { kind: "connected", athleteName: account.athleteName, lastSyncAt: account.lastSyncAt?.toISOString() ?? null }
      : { kind: "disconnected" };
  }
  const notice: StravaNotice = strava ? { outcome: strava, message: message?.slice(0, 300) ?? null } : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Exercise</h2>
        <p className="text-sm text-gray-500 mt-0.5">Workouts from Strava and the ones you log yourself, with your gym routine set by set.</p>
      </div>
      {workouts === null ? (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-700">{HEALTH_NOT_READY}</p>
        </div>
      ) : (
        <>
          <StravaCard state={state} notice={notice} />
          {/* Keyed on the list so a Strava sync's router.refresh() replaces the client's copy. */}
          <WorkoutLog key={workouts.map((w) => w.id).join(",")} initial={workouts} />
        </>
      )}
    </div>
  );
}
