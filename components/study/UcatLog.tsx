"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Field, inputCls } from "@/components/ui/form";
import { todayKey } from "@/lib/dates";
import { SCORE_MAX, SCORE_MIN, UCAT_NOT_READY, totalOf, type UcatScore } from "@/lib/ucat";

const EMPTY = { source: "", vr: "", dm: "", qr: "", sjt: "", notes: "" };

/** Practice-test results: a short form to log one, and the list with each total. */
export default function UcatLog({ initial }: { initial: UcatScore[] }) {
  const [scores, setScores] = useState(initial);
  const [form, setForm] = useState({ ...EMPTY, takenOn: todayKey() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/study/ucat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 503 ? UCAT_NOT_READY : (data.error ?? "Couldn't save"));
        return;
      }
      setScores((s) => [data as UcatScore, ...s].sort((a, b) => b.takenOn.localeCompare(a.takenOn)));
      setForm({ ...EMPTY, takenOn: form.takenOn });
    } catch {
      setError("Couldn't save — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/study/ucat/${id}`, { method: "DELETE" }).catch(() => null);
    if (res && (res.ok || res.status === 404)) setScores((s) => s.filter((x) => x.id !== id));
    else setError("Couldn't remove that score.");
  }

  const totals = scores.map(totalOf).filter((t): t is number => t !== null);
  const best = totals.length ? Math.max(...totals) : null;
  const scoreField = (key: "vr" | "dm" | "qr", label: string) => (
    <Field label={label}>
      <input type="number" inputMode="numeric" min={SCORE_MIN} max={SCORE_MAX} step={10} value={form[key]} onChange={set(key)}
        placeholder={`${SCORE_MIN}–${SCORE_MAX}`} className={inputCls} />
    </Field>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-4">
          <Field label="Date">
            <input type="date" value={form.takenOn} onChange={set("takenOn")} required className={inputCls} />
          </Field>
          <Field label="Practice test">
            <input value={form.source} onChange={set("source")} required maxLength={80}
              placeholder="Official Practice Test A" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {scoreField("vr", "Verbal Reasoning")}
          {scoreField("dm", "Decision Making")}
          {scoreField("qr", "Quantitative Reasoning")}
          <Field label="SJT band">
            <select value={form.sjt} onChange={set("sjt")} className={inputCls}>
              <option value="">—</option>
              {[1, 2, 3, 4].map((b) => <option key={b} value={b}>Band {b}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <input value={form.notes} onChange={set("notes")} maxLength={500} placeholder="Optional" className={inputCls} />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={saving} className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50">
          {saving ? "Saving…" : "Log score"}
        </button>
      </form>

      <section>
        <div className="flex items-baseline justify-between border-b border-gray-900 pb-2">
          <h3 className="text-lg text-gray-900">Practice results</h3>
          {best !== null && <span className="text-xs text-gray-600">Best total <strong className="text-gray-900">{best}</strong> / 2700</span>}
        </div>
        {scores.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No practice tests logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Test</th>
                  <th className="py-2 pr-3 font-semibold text-right">VR</th>
                  <th className="py-2 pr-3 font-semibold text-right">DM</th>
                  <th className="py-2 pr-3 font-semibold text-right">QR</th>
                  <th className="py-2 pr-3 font-semibold text-right">Total</th>
                  <th className="py-2 pr-3 font-semibold text-right">SJT</th>
                  <th className="py-2"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scores.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{s.takenOn}</td>
                    <td className="py-2 pr-3">
                      {s.source}
                      {s.notes && <span className="block text-xs text-gray-500">{s.notes}</span>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.vr ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.dm ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.qr ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums font-semibold">{totalOf(s) ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">{s.sjt ? `Band ${s.sjt}` : "—"}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => remove(s.id)} aria-label={`Remove ${s.source} on ${s.takenOn}`}
                        className="p-1.5 text-gray-400 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
