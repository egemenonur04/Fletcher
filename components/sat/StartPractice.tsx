"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

/** Bluebook's module lengths first, then shorter and longer sets. */
const SIZES = [10, 22, 27, 44, 54];

/**
 * Starts a practice set: that many questions drawn at random from what the filters match, opened
 * in the Bluebook-style screen. The ids ride in the address, so a set survives a reload.
 */
export default function StartPractice({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [size, setSize] = useState(10);
  const count = Math.min(size, ids.length);

  const start = () => {
    const pool = [...ids];
    // Fisher–Yates, enough of it to pick `count`.
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    router.push(`/study/sat/practice?ids=${pool.slice(0, count).join(",")}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border border-gray-900 rounded-lg bg-white px-4 py-3">
      <span className="text-sm text-gray-700">Practice set of</span>
      <div className="flex gap-1" role="group" aria-label="Questions in the set">
        {SIZES.map((n) => (
          <button key={n} type="button" onClick={() => setSize(n)} aria-pressed={size === n}
            className={`px-2.5 py-1 text-sm rounded-md ${size === n ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
            {n}
          </button>
        ))}
      </div>
      <button type="button" onClick={start} disabled={ids.length === 0}
        className="ml-auto inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm disabled:opacity-40">
        <Play className="w-4 h-4" /> Start {count} question{count === 1 ? "" : "s"}
      </button>
    </div>
  );
}
