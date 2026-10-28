"use client";

import { useState } from "react";
import Blocks from "@/components/study/ucat/Blocks";
import { SCALES, ratingCredit, yesNoMarks, type Question as Q } from "@/lib/ucat-lessons";

const LETTERS = "ABCDE";

const right = "text-green-700";
const wrong = "text-red-700";
const pill = (on: boolean) =>
  `px-3 py-1.5 text-sm border ${on ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-900 border-gray-300 hover:border-gray-900"}`;

/**
 * One UCAT question. A worked example shows the answer at a click; a practice question is answered
 * first, then marked the way the real test marks it.
 */
export default function Question({ question: q, label, worked }: { question: Q; label: string; worked: boolean }) {
  // mcq: the chosen option; yesno: true/false per statement; rating: a scale point per item.
  const [picks, setPicks] = useState<Record<number, number | boolean>>({});
  const [shown, setShown] = useState(false);

  const count = q.kind === "mcq" ? 1 : q.kind === "yesno" ? q.statements.length : q.items.length;
  const complete = Object.keys(picks).length === count;
  const pick = (i: number, v: number | boolean) => !shown && setPicks((p) => (q.kind === "mcq" ? { 0: v } : { ...p, [i]: v }));

  let result = "";
  if (shown && !worked) {
    if (q.kind === "mcq") result = picks[0] === q.answer ? "Correct." : `Not quite — the answer is ${LETTERS[q.answer]}.`;
    if (q.kind === "yesno") {
      const n = q.statements.filter((s, i) => picks[i] === s.answer).length;
      const marks = yesNoMarks(n);
      result = `${n} of 5 right — ${marks} mark${marks === 1 ? "" : "s"} of 2.`;
    }
    if (q.kind === "rating") {
      const credit = q.items.reduce((sum, it, i) => sum + ratingCredit(picks[i] as number, it.answer), 0);
      result = `${credit} of ${q.items.length} marks (half a mark for an answer one step from the key).`;
    }
  }

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</p>
      {q.stimulus && <Blocks blocks={q.stimulus} />}
      <p className="font-semibold text-gray-900">{q.prompt}</p>

      {q.kind === "mcq" && (
        <ol className="space-y-2">
          {q.options.map((opt, i) => {
            const chosen = picks[0] === i;
            const mark = shown ? (i === q.answer ? right : chosen ? wrong : "") : "";
            return (
              <li key={i}>
                <button type="button" onClick={() => pick(0, i)} disabled={worked || shown} aria-pressed={chosen}
                  className={`w-full text-left flex gap-3 items-start px-3 py-2 border rounded-lg ${chosen ? "border-gray-900" : "border-gray-200"} ${worked || shown ? "cursor-default" : "hover:border-gray-900"}`}>
                  <span className={`font-bold w-5 flex-shrink-0 ${mark}`}>{LETTERS[i]}</span>
                  <span className={`font-normal ${mark}`}>{opt}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {q.kind === "yesno" && (
        <ol className="divide-y divide-gray-200 border-y border-gray-200">
          {q.statements.map((s, i) => (
            <li key={i} className="py-3 space-y-2">
              <p>{s.text}</p>
              {!worked && (
                <div className="flex gap-2" role="group" aria-label={`Statement ${i + 1}`}>
                  <button type="button" className={pill(picks[i] === true)} onClick={() => pick(i, true)} disabled={shown} aria-pressed={picks[i] === true}>Yes</button>
                  <button type="button" className={pill(picks[i] === false)} onClick={() => pick(i, false)} disabled={shown} aria-pressed={picks[i] === false}>No</button>
                </div>
              )}
              {shown && (
                <p className={`text-sm ${worked || picks[i] === s.answer ? right : wrong}`}>
                  <strong>{s.answer ? "Yes" : "No"}.</strong> <span className="text-gray-700">{s.why}</span>
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {q.kind === "rating" && (
        <ol className="divide-y divide-gray-200 border-y border-gray-200">
          {q.items.map((it, i) => (
            <li key={i} className="py-3 space-y-2">
              <p>{it.text}</p>
              {!worked && (
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Response ${i + 1}`}>
                  {SCALES[q.scale].map((name, v) => (
                    <button key={v} type="button" className={pill(picks[i] === v)} onClick={() => pick(i, v)} disabled={shown} aria-pressed={picks[i] === v}>{name}</button>
                  ))}
                </div>
              )}
              {shown && (
                <p className={`text-sm ${worked || picks[i] === it.answer ? right : wrong}`}>
                  <strong>{SCALES[q.scale][it.answer]}.</strong> <span className="text-gray-700">{it.why}</span>
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {shown && result && <p className="font-semibold">{result}</p>}
      {shown && q.kind === "mcq" && <p className="text-gray-700"><strong className="text-gray-900">{LETTERS[q.answer]}.</strong> {q.explanation}</p>}

      <div className="flex gap-2">
        {worked ? (
          <button type="button" onClick={() => setShown((s) => !s)} className="px-4 py-2 text-sm font-bold bg-gray-900 text-white">
            {shown ? "Hide the answer" : "Show the answer"}
          </button>
        ) : shown ? (
          <button type="button" onClick={() => { setPicks({}); setShown(false); }} className="px-4 py-2 text-sm font-bold border border-gray-900">
            Try again
          </button>
        ) : (
          <button type="button" onClick={() => setShown(true)} disabled={!complete} className="px-4 py-2 text-sm font-bold bg-gray-900 text-white disabled:opacity-40">
            Check
          </button>
        )}
      </div>
    </article>
  );
}
