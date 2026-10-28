"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Field, inputCls } from "@/components/ui/form";
import { todayKey } from "@/lib/dates";
import { HEALTH_NOT_READY, WORKOUT_KINDS, formatMinutes, kindLabel, type Workout } from "@/lib/health";

type SetRow = { exercise: string; sets: string; reps: string; weightKg: string };

const EMPTY_SET: SetRow = { exercise: "", sets: "", reps: "", weightKg: "" };
const EMPTY = { kind: "gym", title: "", minutes: "", distanceKm: "", kcal: "", notes: "" };

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/** The workout form (with a gym routine's exercises) and the recent workouts below it. */
export default function WorkoutLog({ initial }: { initial: Workout[] }) {
  const [workouts, setWorkouts] = useState(initial);
  const [form, setForm] = useState({ ...EMPTY, date: todayKey() });
  const [sets, setSets] = useState<SetRow[]>([{ ...EMPTY_SET }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setRow = (i: number, key: keyof SetRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSets((rows) => rows.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/health/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sets: form.kind === "gym" ? sets : [] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 503 ? HEALTH_NOT_READY : (data.error ?? "Couldn't save"));
        return;
      }
      setWorkouts((w) => [data as Workout, ...w].sort((a, b) => b.date.localeCompare(a.date)));
      setForm({ ...EMPTY, kind: form.kind, date: form.date });
      setSets([{ ...EMPTY_SET }]);
    } catch {
      setError("Couldn't save — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(w: Workout) {
    if (w.stravaId && !window.confirm("This came from Strava. Remove it here? A later sync of the same week brings it back.")) return;
    const res = await fetch(`/api/health/workouts/${w.id}`, { method: "DELETE" }).catch(() => null);
    if (res && (res.ok || res.status === 404)) setWorkouts((list) => list.filter((x) => x.id !== w.id));
    else setError("Couldn't remove that workout.");
  }

  const distanceKinds = form.kind === "run" || form.kind === "walk" || form.kind === "ride" || form.kind === "swim";

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Log a workout</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Date">
            <input type="date" value={form.date} onChange={set("date")} required max={todayKey()} className={inputCls} />
          </Field>
          <Field label="Kind">
            <select value={form.kind} onChange={set("kind")} className={inputCls}>
              {WORKOUT_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
            </select>
          </Field>
          <Field label="Minutes">
            <input type="number" inputMode="numeric" min={1} max={1440} value={form.minutes} onChange={set("minutes")} required className={inputCls} />
          </Field>
          <Field label="kcal burned">
            <input type="number" inputMode="numeric" min={0} max={10000} value={form.kcal} onChange={set("kcal")} placeholder="Optional" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-4">
          <Field label="Title">
            <input value={form.title} onChange={set("title")} maxLength={80} placeholder={form.kind === "gym" ? "Full body" : "Optional"} className={inputCls} />
          </Field>
          {distanceKinds && (
            <Field label="Distance (km)">
              <input type="number" inputMode="decimal" min={0} max={1000} step={0.01} value={form.distanceKm} onChange={set("distanceKm")} className={inputCls} />
            </Field>
          )}
        </div>

        {form.kind === "gym" && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700 mb-1.5">Exercises</legend>
            {sets.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_4rem_4rem_5rem_auto] gap-2 items-center">
                <input aria-label={`Exercise ${i + 1}`} value={row.exercise} onChange={setRow(i, "exercise")} maxLength={60} placeholder="Squat" className={inputCls} />
                <input aria-label={`Sets for exercise ${i + 1}`} type="number" inputMode="numeric" min={1} max={50} value={row.sets} onChange={setRow(i, "sets")} placeholder="Sets" className={inputCls} />
                <input aria-label={`Reps for exercise ${i + 1}`} type="number" inputMode="numeric" min={1} max={1000} value={row.reps} onChange={setRow(i, "reps")} placeholder="Reps" className={inputCls} />
                <input aria-label={`kg for exercise ${i + 1}`} type="number" inputMode="decimal" min={0} max={1000} step={0.5} value={row.weightKg} onChange={setRow(i, "weightKg")} placeholder="kg" className={inputCls} />
                <button type="button" onClick={() => setSets((rows) => (rows.length === 1 ? [{ ...EMPTY_SET }] : rows.filter((_, j) => j !== i)))}
                  aria-label={`Remove exercise ${i + 1}`} className="p-1.5 text-gray-400 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSets((rows) => [...rows, { ...EMPTY_SET }])}
              className="inline-flex items-center gap-1 text-sm font-bold text-gray-900 hover:underline underline-offset-4">
              <Plus className="w-4 h-4" /> Add exercise
            </button>
          </fieldset>
        )}

        <Field label="Notes">
          <input value={form.notes} onChange={set("notes")} maxLength={500} placeholder="Optional" className={inputCls} />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={saving} className="bg-gray-900 text-white px-4 py-2 text-sm font-bold disabled:opacity-50">
          {saving ? "Saving…" : "Log workout"}
        </button>
      </form>

      <section>
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-900 pb-2">Last 90 days</h3>
        {workouts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No workouts yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {workouts.map((w) => (
              <li key={w.id} className="py-3 flex gap-3 items-start">
                <span className="w-24 flex-shrink-0 text-sm text-gray-600 tabular-nums">{dayLabel(w.date)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    <strong>{kindLabel(w.kind)}</strong>
                    {w.title && <> · {w.title}</>}
                    {w.stravaId && <span className="ml-2 text-xs font-bold uppercase tracking-wide text-gray-500">Strava</span>}
                  </p>
                  <p className="text-sm text-gray-600 tabular-nums">
                    {[formatMinutes(w.minutes), w.distanceKm !== null && `${w.distanceKm} km`, w.kcal !== null && `${w.kcal} kcal`].filter(Boolean).join(" · ")}
                  </p>
                  {w.sets.length > 0 && (
                    <ul className="mt-1 text-sm text-gray-700">
                      {w.sets.map((s, i) => (
                        <li key={i} className="tabular-nums">{s.exercise}: {s.sets} × {s.reps}{s.weightKg !== null && ` @ ${s.weightKg} kg`}</li>
                      ))}
                    </ul>
                  )}
                  {w.notes && <p className="text-sm text-gray-500 mt-1">{w.notes}</p>}
                </div>
                <button type="button" onClick={() => remove(w)} aria-label={`Remove ${kindLabel(w.kind)} on ${w.date}`}
                  className="p-1.5 text-gray-400 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
