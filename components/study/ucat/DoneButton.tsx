"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { LESSONS_NOT_READY } from "@/lib/ucat-lessons";

/** Marks a lesson finished, or not. Null `initial` means the progress table isn't there yet. */
export default function DoneButton({ lessonId, initial }: { lessonId: string; initial: boolean | null }) {
  const [done, setDone] = useState(initial ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(initial === null ? LESSONS_NOT_READY : null);

  async function toggle() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/study/ucat/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, done: !done }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(res.status === 503 ? LESSONS_NOT_READY : (data.error ?? "Couldn't save"));
      else setDone(!done);
    } catch {
      setError("Couldn't save — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={toggle} disabled={saving || initial === null} aria-pressed={done}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-40 ${done ? "border border-gray-900 text-gray-900" : "bg-gray-900 text-white"}`}>
        <Check className="w-4 h-4" />
        {done ? "Done — mark as not done" : "Mark this lesson done"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
