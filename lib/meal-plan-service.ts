import { db } from "@/lib/db";
import { fromKey, toKey, type DateKey } from "@/lib/dates";
import { isMissingTable } from "@/lib/prisma-errors";

export type WaterEntry = { id: string; ml: number; /** When it was logged, an ISO instant. */ at: string };
export type DayTracking = { checked: string[]; water: WaterEntry[] };

/**
 * The meals ticked off and the water drunk on a day. Null until migration 038 has run, so the
 * Diet page can still show the plan without them.
 */
export async function dayTracking(date: DateKey): Promise<DayTracking | null> {
  try {
    const [checks, water] = await Promise.all([
      db.mealCheck.findMany({ where: { date: fromKey(date) }, select: { meal: true } }),
      db.waterIntake.findMany({ where: { date: fromKey(date) }, orderBy: { createdAt: "asc" } }),
    ]);
    return {
      checked: checks.map((c) => c.meal),
      water: water.map((w) => ({ id: w.id, ml: w.ml, at: w.createdAt.toISOString() })),
    };
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

/** Meals ticked and water drunk on each day from `from` to `to`. Null until migration 038 has run. */
export async function dietRange(from: DateKey, to: DateKey): Promise<Map<string, { checked: Set<string>; waterMl: number }> | null> {
  try {
    const range = { gte: fromKey(from), lte: fromKey(to) };
    const [checks, water] = await Promise.all([
      db.mealCheck.findMany({ where: { date: range }, select: { date: true, meal: true } }),
      db.waterIntake.groupBy({ by: ["date"], where: { date: range }, _sum: { ml: true } }),
    ]);
    const days = new Map<string, { checked: Set<string>; waterMl: number }>();
    const day = (d: Date) => {
      const key = toKey(d);
      if (!days.has(key)) days.set(key, { checked: new Set(), waterMl: 0 });
      return days.get(key)!;
    };
    for (const c of checks) day(c.date).checked.add(c.meal);
    for (const w of water) day(w.date).waterMl = w._sum.ml ?? 0;
    return days;
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}
