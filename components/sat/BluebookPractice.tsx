"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bookmark, Calculator, ChevronDown, ChevronUp, Clock, MapPin, MoreVertical, Ruler, X,
} from "lucide-react";
import { CalculatorPanel, DirectionsPanel, ReferenceSheet } from "@/components/sat/BluebookTools";
import {
  DIFFICULTY_LABELS, DOMAIN_LABELS, SECTION_LABELS, isCorrect, timeLimitSeconds,
  type SatQuestion,
} from "@/lib/sat-qbank";

type Phase = "test" | "review" | "results";

/** "31:05"; an hour or more as "1:02:09". */
function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

/** What may be typed in a student-produced response box, as in Bluebook: 5 characters, 6 with a minus. */
function cleanTyped(value: string): string {
  const s = value.replace(/[^0-9./-]/g, "");
  return s.slice(0, s.startsWith("-") ? 6 : 5);
}

/**
 * A practice set the way Bluebook shows a module: a bar of tools and the clock along the top, the
 * passage and the question side by side, the question strip with Mark for Review and the answer
 * eliminator, and along the bottom the question navigator with Back and Next. After the last
 * question comes Check Your Work, then Submit, then results with each question's explanation.
 */
export default function BluebookPractice({ questions, missing }: { questions: SatQuestion[]; missing: number }) {
  const limit = useMemo(() => timeLimitSeconds({
    rw: questions.filter((q) => q.section === "rw").length,
    math: questions.filter((q) => q.section === "math").length,
  }), [questions]);

  const [phase, setPhase] = useState<Phase>("test");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [crossed, setCrossed] = useState<Record<string, string[]>>({});
  const [eliminator, setEliminator] = useState(false);
  const [left, setLeft] = useState(limit);
  const [clockHidden, setClockHidden] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [tool, setTool] = useState<"calculator" | "reference" | "directions" | null>(null);
  const [split, setSplit] = useState(50);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | string>("idle");
  const [reviewing, setReviewing] = useState<number | null>(null);

  // Time on each question: the clock runs for whichever question is open.
  const spent = useRef<Record<string, number>>({});
  const openedAt = useRef(0);
  const [times, setTimes] = useState<Record<string, number>>({});
  const q = questions[index];
  const hasMath = questions.some((x) => x.section === "math");

  const bank = useCallback(() => {
    const now = Date.now();
    const id = questions[index]?.id;
    if (id) spent.current[id] = (spent.current[id] ?? 0) + (now - openedAt.current) / 1000;
    openedAt.current = now;
  }, [questions, index]);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const goTo = (i: number) => {
    bank();
    setIndex(i);
    setPhase("test");
    setNavOpen(false);
  };

  // The countdown. At zero the set moves to Check Your Work; nothing is lost, it can still be submitted.
  useEffect(() => {
    if (phase === "results") return;
    const t = setInterval(() => setLeft((s) => {
      if (s <= 1) {
        clearInterval(t);
        setPhase((p) => (p === "test" ? "review" : p));
        return 0;
      }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Leaving mid-set asks first, as answers aren't saved until Submit.
  useEffect(() => {
    if (phase === "results") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const answer = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }));
  const toggleMark = (id: string) => setMarked((m) => {
    const next = new Set(m);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleCross = (id: string, label: string) => setCrossed((c) => {
    const list = c[id] ?? [];
    return { ...c, [id]: list.includes(label) ? list.filter((l) => l !== label) : [...list, label] };
  });

  const submit = async () => {
    bank();
    const seconds = Object.fromEntries(questions.map((x) => [x.id, Math.round(spent.current[x.id] ?? 0)]));
    setTimes(seconds);
    setPhase("results");
    setSaved("saving");
    try {
      const res = await fetch("/api/sat/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempts: questions.map((x) => ({
            questionId: x.id,
            answer: answers[x.id] ?? null,
            seconds: seconds[x.id],
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSaved(res.ok ? "saved" : (data.error ?? "Results couldn't be saved."));
    } catch {
      setSaved("Results couldn't be saved — check your connection.");
    }
  };

  // Dragging the divider between passage and question.
  const body = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    const box = body.current?.getBoundingClientRect();
    if (!box) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => setSplit(Math.min(75, Math.max(25, ((ev.clientX - box.left) / box.width) * 100)));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (phase === "results") {
    return (
      <Results questions={questions} answers={answers} spent={times} saved={saved}
        reviewing={reviewing} onReview={setReviewing} />
    );
  }

  const title = questions.every((x) => x.section === q.section)
    ? SECTION_LABELS[q.section]
    : "Reading and Writing and Math";

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-gray-900">
      {/* Top bar: section and directions, the clock, the tools. */}
      <header className="relative grid grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 h-16 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-bold truncate font-ui">Practice: {title}</p>
          <button type="button" onClick={() => setTool(tool === "directions" ? null : "directions")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900">
            Directions <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center">
          {clockHidden ? (
            <Clock className="w-5 h-5" aria-label="Clock hidden" />
          ) : (
            <span className={`text-lg font-bold tabular-nums ${left <= 300 && limit > 600 ? "text-red-700" : ""} font-ui`}
              role="timer" aria-live="off">{clock(left)}</span>
          )}
          <button type="button" onClick={() => setClockHidden((h) => !h)}
            className="mt-0.5 px-2.5 py-px text-xs border border-gray-400 rounded-full hover:bg-gray-100">
            {clockHidden ? "Show" : "Hide"}
          </button>
        </div>
        <div className="flex justify-end gap-1 sm:gap-3">
          {hasMath && (
            <>
              <ToolButton icon={Calculator} label="Calculator" active={tool === "calculator"} onClick={() => setTool(tool === "calculator" ? null : "calculator")} />
              <ToolButton icon={Ruler} label="Reference" active={tool === "reference"} onClick={() => setTool(tool === "reference" ? null : "reference")} />
            </>
          )}
          <Link href="/study/sat" className="flex flex-col items-center px-2 py-1 text-xs font-semibold text-gray-700 hover:text-gray-900 font-ui">
            <MoreVertical className="w-5 h-5" />
            Exit
          </Link>
        </div>
      </header>
      <div className="border-b-2 border-dashed border-gray-300" />

      {tool === "directions" && <DirectionsPanel section={q.section} onClose={() => setTool(null)} />}
      {tool === "reference" && <ReferenceSheet onClose={() => setTool(null)} />}
      {tool === "calculator" && <CalculatorPanel onClose={() => setTool(null)} />}

      {missing > 0 && phase === "test" && index === 0 && (
        <p className="px-6 py-2 text-xs text-amber-800 bg-amber-50">
          {missing} question{missing === 1 ? "" : "s"} couldn&apos;t be loaded from the question bank and {missing === 1 ? "was" : "were"} left out.
        </p>
      )}

      {phase === "review" ? (
        <CheckYourWork questions={questions} answers={answers} marked={marked} timeUp={left === 0} onPick={goTo} />
      ) : (
        <div ref={body} className="flex-1 min-h-0 flex flex-col md:flex-row">
          {(q.stimulus || q.type === "spr") && (
            <>
              <section className="md:h-full overflow-y-auto px-6 sm:px-10 py-8 border-b md:border-b-0 border-gray-200 max-md:max-h-[45%]"
                style={{ flexBasis: `${split}%` }} aria-label="Passage">
                {q.stimulus
                  ? <div className="sat-content" dangerouslySetInnerHTML={{ __html: q.stimulus }} />
                  : <SprDirections />}
              </section>
              <div onPointerDown={drag} role="separator" aria-orientation="vertical"
                className="hidden md:flex w-2 cursor-col-resize items-center justify-center bg-gray-100 hover:bg-gray-200 select-none touch-none">
                <span className="h-8 w-0.5 rounded bg-gray-500" />
              </div>
            </>
          )}
          <section className="flex-1 min-w-0 overflow-y-auto px-6 sm:px-10 py-6" aria-label="Question">
            <div className={q.stimulus || q.type === "spr" ? "" : "max-w-2xl mx-auto"}>
              <QuestionStrip number={index + 1} marked={marked.has(q.id)} onMark={() => toggleMark(q.id)}
                eliminator={eliminator} onEliminator={q.type === "mcq" ? () => setEliminator((e) => !e) : undefined} />
              <div className="sat-content mt-5" dangerouslySetInnerHTML={{ __html: q.stem }} />
              {q.type === "mcq" ? (
                <div className="mt-5 space-y-3" role="radiogroup" aria-label={`Question ${index + 1} answers`}>
                  {q.options.map((o) => (
                    <Choice key={o.label} label={o.label} html={o.html}
                      selected={answers[q.id] === o.label}
                      crossed={(crossed[q.id] ?? []).includes(o.label)}
                      eliminator={eliminator}
                      onSelect={() => answer(q.id, o.label)}
                      onCross={() => toggleCross(q.id, o.label)} />
                  ))}
                </div>
              ) : (
                <div className="mt-6">
                  <input value={answers[q.id] ?? ""} onChange={(e) => answer(q.id, cleanTyped(e.target.value))}
                    inputMode="text" autoComplete="off" aria-label={`Answer to question ${index + 1}`}
                    className="w-40 border border-gray-900 rounded-md px-3 py-2 text-lg tabular-nums font-ui" />
                  <p className="mt-3 text-sm text-gray-700 font-ui">
                    Answer Preview: <span className="font-bold">{answers[q.id] || ""}</span>
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="border-t-2 border-dashed border-gray-300" />
      {/* Bottom bar: the navigator and Back / Next. */}
      <footer className="relative grid grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 h-16 flex-shrink-0 font-ui">
        <span className="text-sm font-semibold text-gray-700 truncate">SAT Practice</span>
        {phase === "test" ? (
          <button type="button" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-md text-sm font-bold">
            Question {index + 1} of {questions.length} {navOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        ) : <span />}
        <div className="flex justify-end gap-2">
          {phase === "review" ? (
            <>
              <NavButton onClick={() => goTo(questions.length - 1)}>Back</NavButton>
              <NavButton onClick={submit}>Submit</NavButton>
            </>
          ) : (
            <>
              {index > 0 && <NavButton onClick={() => goTo(index - 1)}>Back</NavButton>}
              <NavButton onClick={() => (index < questions.length - 1 ? goTo(index + 1) : (bank(), setPhase("review")))}>Next</NavButton>
            </>
          )}
        </div>

        {navOpen && phase === "test" && (
          <Navigator questions={questions} index={index} answers={answers} marked={marked}
            onPick={goTo} onReview={() => { bank(); setNavOpen(false); setPhase("review"); }} onClose={() => setNavOpen(false)} />
        )}
      </footer>
    </div>
  );
}

function ToolButton({ icon: Icon, label, active, onClick }: {
  icon: typeof Calculator; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`flex flex-col items-center px-2 py-1 text-xs rounded-md ${active ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:text-gray-900"}`}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-700">
      {children}
    </button>
  );
}

function QuestionStrip({ number, marked, onMark, eliminator, onEliminator }: {
  number: number; marked: boolean; onMark: () => void; eliminator: boolean; onEliminator?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-100 border-b-2 border-dashed border-gray-300 font-ui">
      <span className="bg-gray-900 text-white w-8 h-8 flex items-center justify-center text-sm font-bold">{number}</span>
      <button type="button" onClick={onMark} aria-pressed={marked}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-900">
        <Bookmark className={`w-4 h-4 ${marked ? "fill-red-700 text-red-700" : ""}`} />
        Mark for Review
      </button>
      {onEliminator && (
        <button type="button" onClick={onEliminator} aria-pressed={eliminator} title="Cross out answer choices"
          className={`ml-auto mr-1 my-1 px-1.5 py-0.5 text-xs font-bold border rounded ${eliminator ? "bg-gray-900 text-white border-gray-900" : "border-gray-700 text-gray-800"}`}>
          <span className="line-through">ABC</span>
        </button>
      )}
    </div>
  );
}

function Choice({ label, html, selected, crossed, eliminator, onSelect, onCross }: {
  label: string; html: string; selected: boolean; crossed: boolean; eliminator: boolean;
  onSelect: () => void; onCross: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} disabled={crossed}
        className={`relative flex-1 flex items-center gap-4 text-left rounded-lg px-3 py-3 transition-colors ${
          selected ? "border-[3px] border-gray-900 -m-px" : "border border-gray-700 hover:bg-gray-50"
        } ${crossed ? "opacity-50" : ""}`}>
        <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
          selected ? "bg-gray-900 border-gray-900 text-white" : "border-gray-900"
        } font-ui`}>{label}</span>
        <span className="sat-content sat-choice min-w-0" dangerouslySetInnerHTML={{ __html: html }} />
        {crossed && <span aria-hidden className="absolute left-2 right-2 top-1/2 h-0.5 bg-gray-900" />}
      </button>
      {eliminator && (
        <button type="button" onClick={onCross} aria-label={crossed ? `Undo crossing out ${label}` : `Cross out ${label}`}
          className="flex-shrink-0 text-xs font-bold underline underline-offset-2 font-ui">
          {crossed ? "Undo" : <span className="inline-flex w-6 h-6 rounded-full border border-gray-900 items-center justify-center line-through">{label}</span>}
        </button>
      )}
    </div>
  );
}

function SprDirections() {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      <h2 className="text-lg">Student-produced response directions</h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>If you find more than one correct answer, enter only one.</li>
        <li>You can enter up to 5 characters for a positive answer and up to 6 (including the negative sign) for a negative one.</li>
        <li>If your answer is a fraction that doesn&apos;t fit, enter the decimal equivalent.</li>
        <li>If your answer is a decimal that doesn&apos;t fit, enter it rounded or cut off at the fourth digit.</li>
        <li>Don&apos;t enter symbols such as a percent sign, comma or dollar sign.</li>
        <li>Mixed numbers like 3½ are entered as 7/2 or 3.5.</li>
      </ul>
    </div>
  );
}

function Navigator({ questions, index, answers, marked, onPick, onReview, onClose }: {
  questions: SatQuestion[]; index: number; answers: Record<string, string>; marked: Set<string>;
  onPick: (i: number) => void; onReview: () => void; onClose: () => void;
}) {
  return (
    <div role="dialog" aria-label="Questions"
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[min(32rem,calc(100vw-2rem))] bg-white border border-gray-300 rounded-lg shadow-xl p-5">
      <div className="flex items-center justify-between">
        <p className="font-bold">Practice Questions</p>
        <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex justify-center gap-5 my-3 py-2 border-y border-gray-200 text-xs text-gray-700">
        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Current</span>
        <span className="inline-flex items-center gap-1"><span className="w-3.5 h-3.5 border border-dashed border-gray-700" /> Unanswered</span>
        <span className="inline-flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 fill-red-700 text-red-700" /> For Review</span>
      </div>
      <QuestionGrid questions={questions} index={index} answers={answers} marked={marked} onPick={onPick} />
      <div className="mt-4 text-center">
        <button type="button" onClick={onReview}
          className="px-4 py-1.5 border border-gray-900 rounded-full text-sm font-bold hover:bg-gray-50">Go to Review Page</button>
      </div>
    </div>
  );
}

function QuestionGrid({ questions, index, answers, marked, onPick }: {
  questions: SatQuestion[]; index: number | null; answers: Record<string, string>; marked: Set<string>;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {questions.map((x, i) => {
        const done = Boolean(answers[x.id]);
        return (
          <button key={x.id} type="button" onClick={() => onPick(i)} aria-label={`Question ${i + 1}${done ? ", answered" : ", unanswered"}${marked.has(x.id) ? ", marked for review" : ""}`}
            className={`relative w-9 h-9 text-sm font-bold ${done ? "bg-gray-900 text-white" : "border border-dashed border-gray-700 text-gray-900"}`}>
            {i + 1}
            {i === index && <MapPin className="absolute -top-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-gray-900" />}
            {marked.has(x.id) && <Bookmark className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 fill-red-700 text-red-700" />}
          </button>
        );
      })}
    </div>
  );
}

function CheckYourWork({ questions, answers, marked, timeUp, onPick }: {
  questions: SatQuestion[]; answers: Record<string, string>; marked: Set<string>; timeUp: boolean;
  onPick: (i: number) => void;
}) {
  const open = questions.filter((x) => !answers[x.id]).length;
  return (
    <div className="flex-1 overflow-y-auto px-6 py-10">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl">Check Your Work</h1>
        <p className="mt-3 text-[15px] text-gray-700">
          {timeUp ? "Time's up. " : ""}
          On test day you can&apos;t move on until time runs out. Here you can go back to any question,
          or Submit when you&apos;re ready.{open > 0 ? ` ${open} question${open === 1 ? " is" : "s are"} unanswered.` : ""}
        </p>
        <div className="mt-8 bg-white border border-gray-300 rounded-lg p-6 font-ui">
          <p className="font-bold mb-5">Practice Questions</p>
          <QuestionGrid questions={questions} index={null} answers={answers} marked={marked} onPick={onPick} />
        </div>
      </div>
    </div>
  );
}

function Results({ questions, answers, spent, saved, reviewing, onReview }: {
  questions: SatQuestion[]; answers: Record<string, string>; spent: Record<string, number>; saved: string;
  reviewing: number | null; onReview: (i: number | null) => void;
}) {
  const marks = questions.map((x) => isCorrect(x, answers[x.id]));
  const keyed = marks.filter((m) => m !== null).length;
  const right = marks.filter((m) => m === true).length;

  if (reviewing !== null) {
    const x = questions[reviewing];
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between gap-3 text-sm font-ui">
            <button type="button" onClick={() => onReview(null)} className="underline underline-offset-4">← All results</button>
            <span className="text-gray-500">Question {reviewing + 1} of {questions.length} · {x.id}</span>
            <span className="flex gap-3">
              {reviewing > 0 && <button type="button" onClick={() => onReview(reviewing - 1)} className="underline underline-offset-4">Previous</button>}
              {reviewing < questions.length - 1 && <button type="button" onClick={() => onReview(reviewing + 1)} className="underline underline-offset-4">Next</button>}
            </span>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-wide text-gray-500">
            {DOMAIN_LABELS[x.domain] ?? x.domain} · {x.skillName}{x.difficulty ? ` · ${DIFFICULTY_LABELS[x.difficulty]}` : ""}
          </p>
          {x.stimulus && <div className="sat-content mt-4 pb-5 border-b border-gray-200" dangerouslySetInnerHTML={{ __html: x.stimulus }} />}
          <div className="sat-content mt-5" dangerouslySetInnerHTML={{ __html: x.stem }} />
          {x.type === "mcq" ? (
            <div className="mt-5 space-y-3">
              {x.options.map((o) => {
                const key = x.correct.includes(o.label);
                const picked = answers[x.id] === o.label;
                return (
                  <div key={o.label} className={`flex items-center gap-4 rounded-lg px-3 py-3 border ${
                    key ? "border-green-700 bg-green-50" : picked ? "border-red-700 bg-red-50" : "border-gray-300"
                  }`}>
                    <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-gray-900 flex items-center justify-center text-sm font-bold font-ui">{o.label}</span>
                    <span className="sat-content sat-choice min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: o.html }} />
                    <span className="text-xs font-bold font-ui">{key ? "Correct" : picked ? "Your answer" : ""}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-sm font-ui">
              Your answer: <strong>{answers[x.id] || "—"}</strong> · Accepted: <strong>{x.correct.join(", ") || "—"}</strong>
            </p>
          )}
          {x.rationale && (
            <section className="mt-8 border-t border-gray-900 pt-4">
              <h2 className="text-lg">Explanation</h2>
              <div className="sat-content mt-2" dangerouslySetInnerHTML={{ __html: x.rationale }} />
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Practice results</p>
        <h1 className="mt-2 text-4xl">{right} of {keyed} correct</h1>
        <p className="mt-2 text-sm text-gray-600 font-ui">
          {saved === "saving" ? "Saving…" : saved === "saved" ? "Saved to your Question Bank history." : saved === "idle" ? "" : saved}
        </p>
        <ul className="mt-8 border-t border-gray-900 divide-y divide-gray-200">
          {questions.map((x, i) => (
            <li key={x.id}>
              <button type="button" onClick={() => onReview(i)} className="w-full flex items-center gap-4 py-3 text-left hover:bg-gray-50">
                <span className="w-8 text-sm font-bold font-ui">{i + 1}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] truncate">{x.skillName || DOMAIN_LABELS[x.domain]}</span>
                  <span className="block text-xs text-gray-500">
                    {x.id} · {Math.round(spent[x.id] ?? 0)}s · your answer {answers[x.id] || "—"}{x.correct.length ? `, correct ${x.correct[0]}` : ""}
                  </span>
                </span>
                <span className={`text-xs font-bold ${marks[i] === true ? "text-green-700" : marks[i] === false ? "text-red-700" : "text-gray-400"} font-ui`}>
                  {marks[i] === true ? "Correct" : marks[i] === false ? "Incorrect" : "No key"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex gap-3">
          <Link href="/study/sat" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-semibold font-ui">Back to the Question Bank</Link>
        </div>
      </div>
    </div>
  );
}
