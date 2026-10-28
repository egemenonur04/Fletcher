export const dynamic = "force-dynamic";

import Link from "next/link";
import { WeeklyBars } from "@/components/self-care/HealthCharts";
import WeightLog from "@/components/self-care/WeightLog";
import { addDays, todayKey, weekStartOf, type DateKey } from "@/lib/dates";
import { HEALTH_NOT_READY, byKind, formatMinutes, kindLabel, totals, weekStreak, weeklyMinutes, type Totals } from "@/lib/health";
import { listWeights, listWorkouts } from "@/lib/health-service";
import { eaten, mealDay } from "@/lib/meal-plan";
import { dietRange } from "@/lib/meal-plan-service";

const day = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

function Tile({ label, t }: { label: string; t: Totals }) {
  return (
    <div className="p-4 border-r border-b border-gray-200">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{formatMinutes(t.minutes)}</p>
      <p className="text-xs text-gray-500 mt-1">
        {t.sessions} workout{t.sessions === 1 ? "" : "s"} · {t.activeDays} active day{t.activeDays === 1 ? "" : "s"}
        {t.km > 0 && ` · ${t.km} km`}
        {t.kcal > 0 && ` · ${t.kcal.toLocaleString("en-US")} kcal`}
      </p>
    </div>
  );
}

export default async function ProgressPage() {
  const today = todayKey();
  const [workouts, weights, diet] = await Promise.all([listWorkouts(), listWeights(), dietRange(addDays(today, -6), today)]);

  if (workouts === null || weights === null) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5"><p className="text-sm text-gray-700">{HEALTH_NOT_READY}</p></div>
      </div>
    );
  }

  const year = `${today.slice(0, 4)}-01-01` as DateKey;
  const weeks = weeklyMinutes(workouts, today, 12);
  const streak = weekStreak(workouts, today);
  const kinds = byKind(workouts.filter((w) => w.date >= year && w.date <= today));
  const kindMax = Math.max(1, ...kinds.map((k) => k.minutes));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Everything added up: training from <Link href="/self-care/exercise" className="underline underline-offset-2">Exercise</Link>,
          your weight, and how the diet went this week.
        </p>
      </div>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-900 pb-2">
          <h3 className="text-lg font-bold text-gray-900">Training</h3>
          <span className="text-xs text-gray-600">
            {streak > 0 ? <><strong className="text-gray-900">{streak}</strong> week{streak === 1 ? "" : "s"} in a row with a workout</> : "No streak yet"}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 border-l border-gray-200">
          <Tile label="This week" t={totals(workouts, weekStartOf(today), today)} />
          <Tile label="This month" t={totals(workouts, `${today.slice(0, 7)}-01` as DateKey, today)} />
          <Tile label="This year" t={totals(workouts, year, today)} />
          <Tile label="All time" t={totals(workouts, null, today)} />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-900 pb-2">Time trained per week</h3>
        <WeeklyBars data={weeks} />
      </section>

      {kinds.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-900 pb-2">This year by kind</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-200">
              {kinds.map((k) => (
                <tr key={k.kind}>
                  <td className="py-2 pr-3 w-24">{kindLabel(k.kind)}</td>
                  <td className="py-2 pr-3 w-full">
                    <div className="h-2 bg-gray-900 rounded-r" style={{ width: `${(k.minutes / kindMax) * 100}%` }} />
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">{formatMinutes(k.minutes)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-500 whitespace-nowrap">{k.sessions}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <WeightLog initial={weights} />

      <section>
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-900 pb-2">Diet, last 7 days</h3>
        {diet === null ? (
          <p className="py-4 text-sm text-gray-500">Meal ticks and water aren&apos;t set up yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3 font-semibold">Day</th>
                <th className="py-2 pr-3 font-semibold text-right">kcal eaten</th>
                <th className="py-2 pr-3 font-semibold text-right">Protein</th>
                <th className="py-2 font-semibold text-right">Water</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {days.map((d) => {
                const found = mealDay(d);
                const tracked = diet.get(d);
                const ate = found ? eaten(found.day, found.plan.home, tracked?.checked ?? new Set()) : null;
                const goalMl = found ? found.plan.water[found.day.kind] * 1000 : null;
                const waterMl = tracked?.waterMl ?? 0;
                return (
                  <tr key={d}>
                    <td className="py-2 pr-3">
                      <Link href={`/self-care?date=${d}`} className="hover:underline underline-offset-4">{day(d)}</Link>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {ate ? <>{ate.kcal.toLocaleString("en-US")} <span className="text-gray-500">/ {found!.day.total.kcal.toLocaleString("en-US")}</span></> : <span className="text-gray-400">No plan</span>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{ate ? `${ate.protein} g` : "—"}</td>
                    <td className={`py-2 text-right tabular-nums ${goalMl && waterMl >= goalMl ? "text-green-700" : ""}`}>
                      {(waterMl / 1000).toFixed(1)} L{goalMl ? <span className="text-gray-500"> / {goalMl / 1000} L</span> : null}
                      {goalMl && waterMl >= goalMl ? <span aria-label="goal met"> ✓</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
