import { db } from "@/lib/db";
import { fromKey, toKey, type DateKey } from "@/lib/dates";
import type { WeightEntry, Workout, WorkoutBody, WorkoutKind } from "@/lib/health";
import { isMissingTable, isNotFound } from "@/lib/prisma-errors";

const workoutSelect = {
  id: true, date: true, kind: true, title: true, minutes: true, distanceKm: true, kcal: true, notes: true, stravaId: true,
  sets: { orderBy: { position: "asc" as const }, select: { exercise: true, sets: true, reps: true, weightKg: true } },
};

type Row = { id: string; date: Date; kind: string; title: string | null; minutes: number; distanceKm: number | null; kcal: number | null; notes: string | null; stravaId: string | null; sets: Workout["sets"] };

const toWorkout = (r: Row): Workout => ({ ...r, date: toKey(r.date), kind: r.kind as WorkoutKind });

/** Workouts, newest first, from `from` on (all of them without it). Null until migration 047 has run. */
export async function listWorkouts(from?: DateKey): Promise<Workout[] | null> {
  try {
    const rows = await db.workout.findMany({
      where: from ? { date: { gte: fromKey(from) } } : undefined,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: workoutSelect,
    });
    return rows.map(toWorkout);
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

export async function createWorkout(body: WorkoutBody): Promise<Workout> {
  const { sets, date, ...rest } = body;
  const row = await db.workout.create({
    data: { ...rest, date: fromKey(date), sets: { create: sets.map((s, position) => ({ ...s, position })) } },
    select: workoutSelect,
  });
  return toWorkout(row);
}

/** False when it was already deleted. */
export async function deleteWorkout(id: string): Promise<boolean> {
  try {
    await db.workout.delete({ where: { id } });
    return true;
  } catch (e) {
    if (isNotFound(e)) return false;
    throw e;
  }
}

/** Every weigh-in, newest first. Null until migration 047 has run. */
export async function listWeights(): Promise<WeightEntry[] | null> {
  try {
    const rows = await db.bodyWeight.findMany({ orderBy: { date: "desc" }, select: { date: true, kg: true } });
    return rows.map((r) => ({ date: toKey(r.date), kg: r.kg }));
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

/** One a day: a second weigh-in on the same day replaces the first. */
export async function saveWeight(entry: WeightEntry): Promise<WeightEntry> {
  const date = fromKey(entry.date);
  await db.bodyWeight.upsert({ where: { date }, create: { date, kg: entry.kg }, update: { kg: entry.kg } });
  return entry;
}

export async function deleteWeight(date: DateKey): Promise<void> {
  await db.bodyWeight.deleteMany({ where: { date: fromKey(date) } });
}
