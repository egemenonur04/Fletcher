"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { WeightLine } from "@/components/self-care/HealthCharts";
import { Field, inputCls } from "@/components/ui/form";
import { addDays, todayKey, type DateKey } from "@/lib/dates";
import { HEALTH_NOT_READY, weightChange, type WeightEntry } from "@/lib/health";

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toFixed(1)} kg`;

/** Body weight: a weigh-in form, the trend over 90 days, and the entries. */
export default function WeightLog({ initial }: { initial: WeightEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [form, setForm] = useState({ date: todayKey() as string, kg: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/health/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 503 ? HEALTH_NOT_READY : (data.error ?? "Couldn't save"));
        return;
      }
      const saved = data as WeightEntry;
      setEntries((list) => [saved, ...list.filter((x) => x.date !== saved.date)].sort((a, b) => b.date.localeCompare(a.date)));
      setForm((f) => ({ ...f, kg: "" }));
    } catch {
      setError("Couldn't save — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(date: string) {
    const res = await fetch(`/api/health/weight/${date}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) setEntries((list) => list.filter((x) => x.date !== date));
    else setError("Couldn't remove that weigh-in.");
  }

  const since = addDays(todayKey(), -89);
  const recent = entries.filter((e) => e.date >= since);
  const change30 = weightChange(entries.filter((e) => e.date >= addDays(todayKey(), -29)));
  const change90 = weightChange(recent);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-900 pb-2">
        <h3 className="text-lg font-bold text-gray-900">Body weight</h3>
        <span className="text-xs text-gray-600">
          {entries[0] ? <>Latest <strong className="text-gray-900">{entries[0].kg} kg</strong></> : "No weigh-ins yet"}
          {change30 !== null && <> · 30 days {signed(change30)}</>}
          {change90 !== null && <> · 90 days {signed(change90)}</>}
        </span>
      </div>

      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <Field label="Date">
          <input type="date" value={form.date} max={todayKey()} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required className={inputCls} />
        </Field>
        <Field label="Weight (kg)">
          <input type="number" inputMode="decimal" min={20} max={400} step={0.1} value={form.kg} onChange={(e) => setForm((f) => ({ ...f, kg: e.target.value }))} required className={`${inputCls} w-28`} />
        </Field>
        <button type="submit" disabled={saving} className="bg-gray-900 text-white px-4 py-2 text-sm font-bold disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="text-sm text-red-700">{error}</p>}

      {recent.length >= 2 && <WeightLine data={recent} />}

      {entries.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-3 font-semibold">Date</th>
              <th className="py-2 pr-3 font-semibold text-right">kg</th>
              <th className="py-2"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.slice(0, 14).map((e) => (
              <tr key={e.date}>
                <td className="py-1.5 pr-3 tabular-nums">{e.date as DateKey}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{e.kg.toFixed(1)}</td>
                <td className="py-1.5 text-right">
                  <button type="button" onClick={() => remove(e.date)} aria-label={`Remove weigh-in on ${e.date}`} className="p-1 text-gray-400 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
