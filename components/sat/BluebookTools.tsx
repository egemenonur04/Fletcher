"use client";

import { useRef, useState } from "react";
import { ExternalLink, GripHorizontal, X } from "lucide-react";
import type { SatSection } from "@/lib/sat-qbank";

/** Desmos's own build for the digital SAT — the calculator Bluebook embeds. */
const DESMOS_URL = "https://www.desmos.com/testing/cb-digital-sat/graphing";

/** The graphing calculator, in a panel that can be dragged out of the way, as in Bluebook. */
export function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState({ x: 16, y: 80 });
  const start = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const move = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    setPos({
      x: Math.min(window.innerWidth - 120, Math.max(0, s.px + e.clientX - s.x)),
      y: Math.min(window.innerHeight - 60, Math.max(0, s.py + e.clientY - s.y)),
    });
  };

  return (
    <div role="dialog" aria-label="Calculator" style={{ left: pos.x, top: pos.y }}
      className="fixed z-40 w-[min(26rem,calc(100vw-2rem))] h-[min(34rem,calc(100vh-7rem))] flex flex-col bg-white border border-gray-900 rounded-lg shadow-xl overflow-hidden">
      <div onPointerDown={down} onPointerMove={move} onPointerUp={() => (start.current = null)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white cursor-move select-none touch-none font-ui">
        <span className="text-sm font-bold">Calculator</span>
        <GripHorizontal className="w-4 h-4 mx-auto opacity-70" />
        <a href={DESMOS_URL} target="_blank" rel="noreferrer" aria-label="Open the calculator in a new tab" className="opacity-80 hover:opacity-100">
          <ExternalLink className="w-4 h-4" />
        </a>
        <button type="button" onClick={onClose} aria-label="Close calculator"><X className="w-4 h-4" /></button>
      </div>
      <iframe src={DESMOS_URL} title="Desmos graphing calculator" className="flex-1 w-full border-0" />
    </div>
  );
}

/** The formulas Bluebook's reference sheet gives for Math. */
export function ReferenceSheet({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["Circle", "A = πr²   C = 2πr"],
    ["Rectangle", "A = ℓw"],
    ["Triangle", "A = ½bh"],
    ["Pythagorean theorem", "c² = a² + b²"],
    ["Special right triangles", "30°-60°-90°: x, x√3, 2x   ·   45°-45°-90°: s, s, s√2"],
    ["Rectangular prism", "V = ℓwh"],
    ["Cylinder", "V = πr²h"],
    ["Sphere", "V = (4/3)πr³"],
    ["Cone", "V = (1/3)πr²h"],
    ["Rectangular pyramid", "V = (1/3)ℓwh"],
  ];
  return (
    <div role="dialog" aria-label="Reference" className="fixed z-40 right-4 top-20 w-[min(30rem,calc(100vw-2rem))] max-h-[calc(100vh-7rem)] overflow-y-auto bg-white border border-gray-900 rounded-lg shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white font-ui">
        <span className="text-sm font-bold">Reference</span>
        <button type="button" onClick={onClose} aria-label="Close reference"><X className="w-4 h-4" /></button>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([name, formula]) => (
            <tr key={name} className="border-b border-gray-200">
              <th scope="row" className="text-left font-semibold px-4 py-2 align-top w-44">{name}</th>
              <td className="px-4 py-2 tabular-nums">{formula}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="px-4 py-3 space-y-1 text-sm text-gray-700">
        <li>The number of degrees of arc in a circle is 360.</li>
        <li>The number of radians of arc in a circle is 2π.</li>
        <li>The sum of the measures in degrees of the angles of a triangle is 180.</li>
      </ul>
    </div>
  );
}

/** The section's directions, dropped down from the top bar. */
export function DirectionsPanel({ section, onClose }: { section: SatSection; onClose: () => void }) {
  return (
    <div role="dialog" aria-label="Directions" className="fixed z-40 left-4 top-16 w-[min(36rem,calc(100vw-2rem))] max-h-[calc(100vh-7rem)] overflow-y-auto bg-white border border-gray-900 rounded-lg shadow-xl p-5">
      <div className="space-y-3 text-[15px] leading-relaxed">
        {section === "rw" ? (
          <p>
            The questions cover a range of reading and writing skills. Each comes with one or more passages,
            which may include a table or graph. Read each passage and question carefully, then choose the
            best answer based on the passage. All questions are multiple choice with four choices; each has
            a single best answer.
          </p>
        ) : (
          <>
            <p>
              The questions cover a range of math skills. Use of a calculator is allowed for all questions,
              and a reference sheet of formulas is in the top bar.
            </p>
            <p>
              Unless noted, all variables and expressions are real numbers, figures are drawn to scale and
              lie in a plane, and the domain of a function is the set of all real x for which it is defined.
            </p>
            <p>
              Multiple-choice questions have a single correct answer. For a student-produced response, type
              your answer in the box; the directions appear beside the question.
            </p>
          </>
        )}
      </div>
      <div className="mt-4 text-right">
        <button type="button" onClick={onClose} className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold">Close</button>
      </div>
    </div>
  );
}
