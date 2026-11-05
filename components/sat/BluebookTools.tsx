"use client";

import { useRef, useState } from "react";
import { ExternalLink, GripHorizontal, Maximize2, Minimize2, X } from "lucide-react";
import type { SatSection } from "@/lib/sat-qbank";

/** Desmos's own build for the digital SAT — the calculator Bluebook embeds. */
const DESMOS_URL = "https://www.desmos.com/testing/cb-digital-sat/graphing";

/** A tool's window: a black title bar to drag it by, over whatever it holds. */
function FloatingPanel({ title, start, size, hidden, actions, onClose, children }: {
  title: string; start: { x: number; y: number }; size: string; hidden?: boolean;
  actions?: React.ReactNode; onClose: () => void; children: React.ReactNode;
}) {
  const [pos, setPos] = useState(start);
  const grab = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const down = (e: React.PointerEvent) => {
    if ((e.target as Element).closest("a, button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const move = (e: React.PointerEvent) => {
    const s = grab.current;
    if (!s) return;
    setPos({
      x: Math.min(window.innerWidth - 120, Math.max(0, s.px + e.clientX - s.x)),
      y: Math.min(window.innerHeight - 60, Math.max(0, s.py + e.clientY - s.y)),
    });
  };

  return (
    <div role="dialog" aria-label={title} style={{ left: pos.x, top: pos.y }} hidden={hidden} className={`bb-panel ${size}`}>
      <div onPointerDown={down} onPointerMove={move} onPointerUp={() => (grab.current = null)} className="bb-panel-head">
        <span className="font-bold">{title}</span>
        <GripHorizontal className="w-4 h-4 mx-auto opacity-70" />
        {actions}
        <button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}><X className="w-5 h-5" /></button>
      </div>
      {children}
    </div>
  );
}

/**
 * The graphing calculator, in a window that can be dragged out of the way, as in Bluebook. It stays
 * mounted once opened and is only hidden, so what's been typed in it survives closing it.
 */
export function CalculatorPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [wide, setWide] = useState(false);
  return (
    <FloatingPanel title="Calculator" start={{ x: 16, y: 84 }} hidden={!open} onClose={onClose}
      size={wide ? "w-[min(46rem,calc(100vw-2rem))] h-[min(38rem,calc(100dvh-10rem))]" : "w-[min(26rem,calc(100vw-2rem))] h-[min(34rem,calc(100dvh-10rem))]"}
      actions={(
        <>
          <button type="button" onClick={() => setWide((w) => !w)} aria-label={wide ? "Make the calculator smaller" : "Make the calculator larger"}>
            {wide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a href={DESMOS_URL} target="_blank" rel="noreferrer" aria-label="Open the calculator in a new tab">
            <ExternalLink className="w-4 h-4" />
          </a>
        </>
      )}>
      <iframe src={DESMOS_URL} title="Desmos graphing calculator" className="flex-1 w-full border-0 bg-white" />
    </FloatingPanel>
  );
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 };

/** Labels on the sheet's figures. */
function L({ x, y, children }: { x: number; y: number; children: string }) {
  return <text x={x} y={y} textAnchor="middle" fontSize="13" fontStyle="italic" fill="currentColor" fontFamily="var(--font-body)">{children}</text>;
}

/** The sheet's figures, drawn here: each is a plain outline with its measures named. */
const FIGURES: { formula: string[]; figure: React.ReactNode }[] = [
  {
    formula: ["A = πr²", "C = 2πr"],
    figure: <><circle cx="50" cy="42" r="32" {...line} /><path d="M50 42H82" {...line} /><circle cx="50" cy="42" r="2" fill="currentColor" /><L x={66} y={37}>r</L></>,
  },
  {
    formula: ["A = ℓw"],
    figure: <><rect x="14" y="20" width="72" height="44" {...line} /><L x={50} y={15}>ℓ</L><L x={94} y={46}>w</L></>,
  },
  {
    formula: ["A = ½bh"],
    figure: <><path d="M10 66H90L34 16Z" {...line} /><path d="M34 16V66" {...line} strokeDasharray="4 3" /><path d="M34 60h6v6" {...line} /><L x={50} y={80}>b</L><L x={26} y={46}>h</L></>,
  },
  {
    formula: ["c² = a² + b²"],
    figure: <><path d="M16 66H84V16Z" {...line} /><path d="M76 66v-8h8" {...line} /><L x={50} y={80}>b</L><L x={93} y={45}>a</L><L x={42} y={36}>c</L></>,
  },
  {
    formula: ["Special right triangle", "30°, 60°, 90°"],
    figure: <><path d="M14 66H86V24Z" {...line} /><path d="M78 66v-8h8" {...line} /><L x={48} y={80}>x√3</L><L x={94} y={48}>x</L><L x={40} y={38}>2x</L></>,
  },
  {
    formula: ["Special right triangle", "45°, 45°, 90°"],
    figure: <><path d="M26 66H78V14Z" {...line} /><path d="M70 66v-8h8" {...line} /><L x={52} y={80}>s</L><L x={86} y={44}>s</L><L x={40} y={36}>s√2</L></>,
  },
  {
    formula: ["V = ℓwh"],
    figure: <><path d="M12 30H68V68H12Z M12 30L30 14H86L68 30 M86 14V52L68 68" {...line} /><L x={40} y={82}>ℓ</L><L x={86} y={68}>w</L><L x={96} y={36}>h</L></>,
  },
  {
    formula: ["V = πr²h"],
    figure: <><ellipse cx="50" cy="18" rx="30" ry="9" {...line} /><path d="M20 18V62A30 9 0 0 0 80 62V18" {...line} /><path d="M50 18H80" {...line} /><L x={66} y={14}>r</L><L x={90} y={44}>h</L></>,
  },
  {
    formula: ["V = (4/3)πr³"],
    figure: <><circle cx="50" cy="42" r="32" {...line} /><ellipse cx="50" cy="42" rx="32" ry="9" {...line} strokeDasharray="4 3" /><path d="M50 42H82" {...line} /><L x={66} y={37}>r</L></>,
  },
  {
    formula: ["V = (1/3)πr²h"],
    figure: <><ellipse cx="50" cy="64" rx="30" ry="9" {...line} /><path d="M20 64L50 12L80 64" {...line} /><path d="M50 12V64H80" {...line} strokeDasharray="4 3" /><L x={58} y={44}>h</L><L x={66} y={60}>r</L></>,
  },
  {
    formula: ["V = (1/3)ℓwh"],
    figure: <><path d="M12 62L34 46H88L66 62Z" {...line} /><path d="M12 62L50 10L66 62 M50 10L88 46" {...line} /><path d="M50 10V54" {...line} strokeDasharray="4 3" /><L x={38} y={76}>ℓ</L><L x={86} y={62}>w</L><L x={44} y={38}>h</L></>,
  },
];

/** The formulas Bluebook's reference sheet gives for Math. */
export function ReferenceSheet({ onClose }: { onClose: () => void }) {
  return (
    <FloatingPanel title="Reference" start={{ x: Math.max(16, window.innerWidth - 496), y: 84 }} onClose={onClose}
      size="w-[min(30rem,calc(100vw-2rem))] max-h-[calc(100dvh-10rem)]">
      <div className="overflow-y-auto p-4">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4">
          {FIGURES.map(({ formula, figure }) => (
            <li key={formula.join()} className="flex flex-col items-center text-center">
              <svg viewBox="0 0 100 86" className="w-28 h-auto" aria-hidden>{figure}</svg>
              {formula.map((f) => <span key={f} className="text-sm tabular-nums">{f}</span>)}
            </li>
          ))}
        </ul>
        <ul className="mt-4 pt-3 border-t border-gray-300 space-y-1 text-sm">
          <li>The number of degrees of arc in a circle is 360.</li>
          <li>The number of radians of arc in a circle is 2π.</li>
          <li>The sum of the measures in degrees of the angles of a triangle is 180.</li>
        </ul>
      </div>
    </FloatingPanel>
  );
}

/** A centred sheet over a dimmed screen, closed by its button or Esc. */
function Dialog({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="bb-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bb-dialog">
        <h2>{title}</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {footer ?? <button type="button" onClick={onClose} className="bb-button">Close</button>}
        </div>
      </div>
    </div>
  );
}

/** The section's directions, opened from the top bar. */
export function DirectionsPanel({ section, onClose }: { section: SatSection; onClose: () => void }) {
  return (
    <Dialog title="Directions" onClose={onClose}>
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
    </Dialog>
  );
}

const SHORTCUTS: [string, string][] = [
  ["← / →", "Back / Next"],
  ["A, B, C, D", "Choose an answer"],
  ["Shift + A, B, C, D", "Cross out an answer"],
  ["X", "Answer eliminator on or off"],
  ["M", "Mark for Review"],
  ["Q", "Question navigator"],
  ["H", "Highlights & Notes"],
  ["Esc", "Close what's open"],
];

export function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keyboard Shortcuts" onClose={onClose}>
      <table className="w-full text-sm">
        <tbody>
          {SHORTCUTS.map(([keys, what]) => (
            <tr key={keys} className="border-b border-gray-200">
              <th scope="row" className="text-left font-bold py-1.5 pr-4 whitespace-nowrap">{keys}</th>
              <td className="py-1.5">{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

/** Leaving mid-set. The set stays on this device unless it's thrown away here. */
export function ExitDialog({ onStay, onLeave, onDiscard }: { onStay: () => void; onLeave: () => void; onDiscard: () => void }) {
  return (
    <Dialog title="Exit This Practice?" onClose={onStay}
      footer={(
        <>
          <button type="button" onClick={onDiscard} className="bb-button-plain mr-auto">Discard this set</button>
          <button type="button" onClick={onStay} className="bb-button-outline">Keep Going</button>
          <button type="button" onClick={onLeave} className="bb-button">Save and Exit</button>
        </>
      )}>
      <p>
        Your answers, highlights, notes and the clock are kept on this device. You can pick up where you
        left off from the Question Bank.
      </p>
    </Dialog>
  );
}
