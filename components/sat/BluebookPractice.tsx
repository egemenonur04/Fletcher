"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark, Calculator, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Highlighter, Keyboard, LogOut, MapPin,
  MoreVertical, Ruler, X,
} from "lucide-react";
import {
  AnnotatedHtml, HighlightToolbar, NotePanel, NotesList, useTextSelection, type Selected,
} from "@/components/sat/BluebookAnnotator";
import {
  CalculatorPanel, DirectionsPanel, ExitDialog, ReferenceSheet, ShortcutsPanel,
} from "@/components/sat/BluebookTools";
import {
  addAnnotation, removeAnnotation, updateAnnotation, type Annotation, type AnnotationArea, type HighlightColor,
} from "@/lib/sat-annotations";
import {
  SAVED_PRACTICE_KEY, clampSplit, cleanTyped, clock, pickChoice, restoreProgress, toggleCrossed,
  type PracticePhase, type PracticeProgress,
} from "@/lib/sat-practice";
import {
  DIFFICULTY_LABELS, DOMAIN_LABELS, SECTION_LABELS, isCorrect, timeLimitSeconds,
  type SatQuestion, type SatSection,
} from "@/lib/sat-qbank";

const SECTION_NUMBER: Record<SatSection, number> = { rw: 1, math: 2 };

/** The last five minutes: the clock can't be hidden, and says so once. */
const FINAL_STRETCH = 300;

function readSaved(): string | null {
  try {
    return localStorage.getItem(SAVED_PRACTICE_KEY);
  } catch {
    return null;
  }
}

const never = () => () => {};

/**
 * The practice screen renders in the browser only: where it starts from is in localStorage, which
 * the server can't see, and a first paint that then jumps to question 17 is worse than none.
 */
export default function BluebookPractice({ questions, missing }: { questions: SatQuestion[]; missing: number }) {
  const ready = useSyncExternalStore(never, () => true, () => false);
  if (!ready) return <div className="bb fixed inset-0 flex items-center justify-center text-sm">Loading your questions…</div>;
  return <Screen questions={questions} missing={missing} />;
}

/**
 * A practice set the way Bluebook shows a module: section, clock and tools along the top; the
 * passage and the question side by side for Reading and Writing, one column for Math; Mark for
 * Review and the answer eliminator on the question; highlights and notes on any text; the navigator
 * with Back and Next along the bottom. After the last question comes Check Your Work, then Submit,
 * then results with each question's explanation. Until Submit the whole set is kept in this
 * browser (lib/sat-practice.ts), so nothing is lost to a reload.
 */
function Screen({ questions, missing }: { questions: SatQuestion[]; missing: number }) {
  const router = useRouter();
  const ids = useMemo(() => questions.map((x) => x.id), [questions]);
  const limit = useMemo(() => timeLimitSeconds({
    rw: questions.filter((q) => q.section === "rw").length,
    math: questions.filter((q) => q.section === "math").length,
  }), [questions]);

  const [start] = useState(() => restoreProgress(readSaved(), ids, limit));
  const [p, setP] = useState<PracticeProgress>(start);
  const [left, setLeft] = useState(start.left);
  const [finished, setFinished] = useState(false);
  const [clockHidden, setClockHidden] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [calculator, setCalculator] = useState<"never" | "open" | "closed">("never");
  const [dialog, setDialog] = useState<"reference" | "directions" | "shortcuts" | "exit" | null>(null);
  const [sheet, setSheet] = useState<"list" | { note: string } | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [picked, setPicked] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | string>("idle");
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [times, setTimes] = useState<Record<string, number>>({});

  const { phase, index, answers, crossed, eliminator, split } = p;
  const marked = useMemo(() => new Set(p.marked), [p.marked]);
  const q = questions[index];
  const notes = useMemo(() => p.annotations[q.id] ?? [], [p.annotations, q.id]);
  const hasMath = questions.some((x) => x.section === "math");

  // Time on each question: the clock runs for whichever question is open.
  const spent = useRef<Record<string, number>>(start.spent);
  const openedAt = useRef(0);
  const leftNow = useRef(start.left);
  const latest = useRef(p);
  useEffect(() => {
    latest.current = p;
    leftNow.current = left;
  });

  const bank = useCallback(() => {
    const now = Date.now();
    const id = ids[latest.current.index];
    if (id && openedAt.current) spent.current[id] = (spent.current[id] ?? 0) + (now - openedAt.current) / 1000;
    openedAt.current = now;
  }, [ids]);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const store = useCallback(() => {
    bank();
    try {
      localStorage.setItem(SAVED_PRACTICE_KEY, JSON.stringify({ ...latest.current, ids, left: leftNow.current, spent: spent.current }));
    } catch {
      // Private browsing or a full disk: the set simply won't survive a reload.
    }
  }, [bank, ids]);

  const forget = useCallback(() => {
    try {
      localStorage.removeItem(SAVED_PRACTICE_KEY);
    } catch {
      // Nothing to do; a stale set is offered back at worst.
    }
  }, []);

  // Keeping the set: shortly after a change, every few seconds for the clock, and on the way out.
  useEffect(() => {
    if (finished) return;
    const t = setTimeout(store, 300);
    return () => clearTimeout(t);
  }, [p, finished, store]);
  useEffect(() => {
    if (finished) return;
    const t = setInterval(store, 5000);
    window.addEventListener("pagehide", store);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", store);
    };
  }, [finished, store]);

  // The countdown, from a fixed end so a throttled background tab doesn't slow it. At zero the set
  // moves to Check Your Work; nothing is lost, it can still be submitted.
  useEffect(() => {
    if (finished) return;
    const end = Date.now() + leftNow.current * 1000;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(t);
        setP((v) => (v.phase === "test" ? { ...v, phase: "review" } : v));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [finished]);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelected(null);
    setPicked(null);
  };

  useTextSelection((s) => {
    setSelected(s);
    if (s) setPicked(null);
  });

  const closeOverlays = () => {
    setNavOpen(false);
    setMoreOpen(false);
    setPicked(null);
  };

  const goTo = (i: number, to: PracticePhase = "test") => {
    bank();
    clearSelection();
    closeOverlays();
    setSheet((s) => (s === "list" ? s : null));
    setP((v) => ({ ...v, index: i, phase: to }));
  };

  const answer = (value: string) => setP((v) => ({ ...v, answers: { ...v.answers, [q.id]: value } }));
  const pick = (label: string) => setP((v) => pickChoice(v, q.id, label));
  const cross = (label: string) => setP((v) => toggleCrossed(v, q.id, label));
  const toggleMark = () => setP((v) => ({
    ...v,
    marked: v.marked.includes(q.id) ? v.marked.filter((id) => id !== q.id) : [...v.marked, q.id],
  }));
  const toggleEliminator = () => setP((v) => ({ ...v, eliminator: !v.eliminator }));
  const setSplit = (value: number) => setP((v) => ({ ...v, split: clampSplit(value) }));

  const setNotes = (id: string, change: (list: Annotation[]) => Annotation[]) => setP((v) => ({
    ...v,
    annotations: { ...v.annotations, [id]: change(v.annotations[id] ?? []) },
  }));

  /** A new highlight from the selection; returns it so a note can go straight onto it. */
  const highlight = (color: HighlightColor, underline: boolean): Annotation | null => {
    if (!selected) return null;
    const { area, start: from, end, quote } = selected;
    const added: Annotation = {
      id: crypto.randomUUID(), area, start: from, end, quote, color, underline, note: "",
    };
    setNotes(q.id, (list) => addAnnotation(list, added));
    return added;
  };

  const active = picked ? notes.find((a) => a.id === picked.id) ?? null : null;
  const editing = sheet && sheet !== "list" ? notes.find((a) => a.id === sheet.note) ?? null : null;

  const toolbar = selected ? {
    rect: selected.rect, color: null, underline: false, existing: false,
    onColor: (c: HighlightColor) => { highlight(c, false); clearSelection(); },
    onUnderline: () => { highlight("none", true); clearSelection(); },
    onNote: () => {
      const added = highlight("yellow", false);
      clearSelection();
      if (added) setSheet({ note: added.id });
    },
    onDelete: () => {},
  } : active && picked ? {
    rect: picked.rect, color: active.color, underline: active.underline, existing: true,
    onColor: (c: HighlightColor) => setNotes(q.id, (list) => updateAnnotation(list, active.id, { color: active.color === c ? "none" : c, underline: active.color === c ? true : active.underline })),
    onUnderline: () => setNotes(q.id, (list) => updateAnnotation(list, active.id, { underline: !active.underline })),
    onNote: () => { setSheet({ note: active.id }); setPicked(null); },
    onDelete: () => { setNotes(q.id, (list) => removeAnnotation(list, active.id)); setPicked(null); },
  } : null;

  const noteRows = questions.flatMap((x, i) => (p.annotations[x.id] ?? []).map((annotation) => ({ number: i + 1, index: i, annotation })));

  const submit = async () => {
    bank();
    const seconds = Object.fromEntries(questions.map((x) => [x.id, Math.round(spent.current[x.id] ?? 0)]));
    setTimes(seconds);
    setFinished(true);
    setSaved("saving");
    // Off the device first: a set that reached the server must not be offered back for a second go.
    forget();
    try {
      const res = await fetch("/api/sat/attempts", {
        method: "POST",
        keepalive: true,
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
      if (!res.ok) store();
      setSaved(res.ok ? "saved" : (data.error ?? "Results couldn't be saved."));
    } catch {
      store();
      setSaved("Results couldn't be saved — check your connection.");
    }
  };

  const exit = () => {
    store();
    router.push("/study/sat");
  };
  const discard = () => {
    // Nothing may write it back on the way out.
    setFinished(true);
    forget();
    router.push("/study/sat");
  };

  // The keyboard, away from anything being typed into.
  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as Element).closest?.("input, textarea, select");
      if (e.key === "Escape") {
        if (dialog) setDialog(null);
        else if (navOpen || moreOpen || picked) closeOverlays();
        else if (sheet) setSheet(null);
        else if (selected) clearSelection();
        return;
      }
      if (typing || dialog || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (phase !== "test") return;
      if (e.key === "ArrowRight") { if (index < questions.length - 1) goTo(index + 1); else goTo(index, "review"); }
      else if (e.key === "ArrowLeft") { if (index > 0) goTo(index - 1); }
      else if (key === "m") toggleMark();
      else if (key === "q") setNavOpen((o) => !o);
      else if (key === "h") setSheet((s) => (s === "list" ? null : "list"));
      else if (key === "x" && q.type === "mcq") toggleEliminator();
      else if (q.type === "mcq" && /^[a-d]$/.test(key)) {
        const label = key.toUpperCase();
        if (!q.options.some((o) => o.label === label)) return;
        if (e.shiftKey) cross(label); else pick(label);
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Dragging the divider between passage and question.
  const body = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    const box = body.current?.getBoundingClientRect();
    if (!box) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => setSplit(((ev.clientX - box.left) / box.width) * 100);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Discarded: on the way out, with nothing to show.
  if (finished && saved === "idle") return null;
  if (finished) {
    return (
      <Results questions={questions} answers={answers} spent={times} saved={saved}
        reviewing={reviewing} onReview={setReviewing} onRetry={submit} />
    );
  }

  const section = questions.every((x) => x.section === q.section) ? `Section ${SECTION_NUMBER[q.section]}: ${SECTION_LABELS[q.section]}` : `Practice: ${SECTION_LABELS[q.section]}`;
  const clockShown = !clockHidden || (limit > 600 && left <= FINAL_STRETCH);
  const lastMinutes = limit > 600 && left <= FINAL_STRETCH && left > FINAL_STRETCH - 8;
  // Reading and Writing, and a typed answer with its directions, take two panes; Math takes one.
  const twoPanes = q.type === "spr" || (q.section === "rw" && Boolean(q.stimulus));
  const inRightPane = q.section === "rw" ? "" : q.stimulus;

  const annotated = (area: AnnotationArea, html: string, className: string) => (
    <AnnotatedHtml key={`${q.id}:${area}`} area={area} html={html} annotations={notes} activeId={picked?.id ?? editing?.id ?? null}
      className={className} onPick={(id, rect) => setPicked({ id, rect })} />
  );

  return (
    <div className="bb fixed inset-0 flex flex-col">
      {/* Top bar: section and directions, the clock, the tools. */}
      <header className="bb-bar grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0">
          <p className="bb-section-title truncate">{section}</p>
          <button type="button" onClick={() => setDialog("directions")} className="bb-directions">
            Directions <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center">
          {clockShown ? (
            <span className={`bb-clock ${limit > 600 && left <= FINAL_STRETCH ? "text-red-700" : ""}`} role="timer" aria-live="off">{clock(left)}</span>
          ) : (
            <Clock className="w-5 h-5 my-0.5" aria-label="Clock hidden" />
          )}
          {!(limit > 600 && left <= FINAL_STRETCH) && (
            <button type="button" onClick={() => setClockHidden((h) => !h)} className="bb-clock-toggle">
              {clockHidden ? "Show" : "Hide"}
            </button>
          )}
        </div>
        <div className="relative flex justify-end gap-0.5 sm:gap-2">
          <ToolButton icon={Highlighter} label="Highlights & Notes" active={sheet === "list"} onClick={() => setSheet((s) => (s === "list" ? null : "list"))} />
          {hasMath && (
            <>
              <ToolButton icon={Calculator} label="Calculator" active={calculator === "open"} onClick={() => setCalculator((c) => (c === "open" ? "closed" : "open"))} />
              <ToolButton icon={Ruler} label="Reference" active={dialog === "reference"} onClick={() => setDialog(dialog === "reference" ? null : "reference")} />
            </>
          )}
          <ToolButton icon={MoreVertical} label="More" active={moreOpen} onClick={() => setMoreOpen((o) => !o)} />
          {moreOpen && (
            <div role="menu" className="bb-menu">
              <button type="button" role="menuitem" onClick={() => { setMoreOpen(false); setDialog("shortcuts"); }}>
                <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
              </button>
              <button type="button" role="menuitem" onClick={() => { setMoreOpen(false); setDialog("exit"); }}>
                <LogOut className="w-4 h-4" /> Exit the Practice
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="bb-stripe" />

      {dialog === "directions" && <DirectionsPanel section={q.section} onClose={() => setDialog(null)} />}
      {dialog === "shortcuts" && <ShortcutsPanel onClose={() => setDialog(null)} />}
      {dialog === "exit" && <ExitDialog onStay={() => setDialog(null)} onLeave={exit} onDiscard={discard} />}
      {dialog === "reference" && <ReferenceSheet onClose={() => setDialog(null)} />}
      {calculator !== "never" && <CalculatorPanel open={calculator === "open"} onClose={() => setCalculator("closed")} />}

      {lastMinutes && <p role="status" className="bb-notice">5 minutes remaining.</p>}
      {missing > 0 && phase === "test" && index === 0 && (
        <p className="px-6 py-2 text-xs text-amber-800 bg-amber-50">
          {missing} question{missing === 1 ? "" : "s"} couldn&apos;t be loaded from the question bank and {missing === 1 ? "was" : "were"} left out.
        </p>
      )}

      {phase === "review" ? (
        <CheckYourWork questions={questions} section={section} answers={answers} marked={marked} timeUp={left === 0} onPick={(i) => goTo(i)} />
      ) : (
        <div ref={body} className="bb-body flex-1 min-h-0 flex flex-col md:flex-row">
          {twoPanes && (
            <>
              <section className="bb-pane md:h-full" style={{ "--bb-split": `${split}%` } as React.CSSProperties} aria-label="Passage" data-side="left">
                {q.section === "rw" ? annotated("stimulus", q.stimulus, "sat-content") : <SprDirections />}
              </section>
              <div onPointerDown={drag} role="separator" aria-orientation="vertical" aria-label="Resize passage" tabIndex={0}
                aria-valuenow={Math.round(split)} aria-valuemin={25} aria-valuemax={75}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                  e.preventDefault();
                  e.stopPropagation();
                  setSplit(split + (e.key === "ArrowLeft" ? -4 : 4));
                }}
                className="bb-divider">
                <span><ChevronLeft className="w-3 h-3" /><ChevronRight className="w-3 h-3" /></span>
              </div>
            </>
          )}
          <section className="bb-pane flex-1 min-w-0" aria-label="Question" data-side={twoPanes ? "right" : "single"}>
            <div className={twoPanes ? "" : "bb-single"}>
              <QuestionStrip number={index + 1} marked={marked.has(q.id)} onMark={toggleMark}
                eliminator={eliminator} onEliminator={q.type === "mcq" ? toggleEliminator : undefined} />
              {inRightPane && annotated("stimulus", inRightPane, "sat-content mt-5")}
              {annotated("stem", q.stem, "sat-content mt-5")}
              {q.type === "mcq" ? (
                <div className="mt-5 space-y-3" role="radiogroup" aria-label={`Question ${index + 1} answers`}>
                  {q.options.map((o) => (
                    <Choice key={o.label} label={o.label} html={o.html}
                      selected={answers[q.id] === o.label}
                      crossed={(crossed[q.id] ?? []).includes(o.label)}
                      eliminator={eliminator}
                      onSelect={() => pick(o.label)}
                      onCross={() => cross(o.label)} />
                  ))}
                </div>
              ) : (
                <div className="mt-6">
                  <input value={answers[q.id] ?? ""} onChange={(e) => answer(cleanTyped(e.target.value))}
                    inputMode="text" autoComplete="off" aria-label={`Answer to question ${index + 1}`} className="bb-typed" />
                  <p className="mt-3 text-sm">
                    Answer Preview: <span className="font-bold">{answers[q.id] || ""}</span>
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {toolbar && phase === "test" && (
        <HighlightToolbar {...toolbar} onClose={clearSelection} />
      )}
      {sheet === "list" && (
        <NotesList rows={noteRows} onClose={() => setSheet(null)}
          onOpen={(i, a) => { if (i !== index) goTo(i); setSheet({ note: a.id }); }}
          onDelete={(i, id) => setNotes(questions[i].id, (list) => removeAnnotation(list, id))} />
      )}
      {editing && (
        <NotePanel key={editing.id} annotation={editing} onClose={() => setSheet(null)}
          onSave={(note) => { setNotes(q.id, (list) => updateAnnotation(list, editing.id, { note })); setSheet(null); }}
          onDelete={() => { setNotes(q.id, (list) => removeAnnotation(list, editing.id)); setSheet(null); }} />
      )}

      <div className="bb-stripe" />
      {/* Bottom bar: the navigator and Back / Next. */}
      <footer className="bb-bar bb-foot relative grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="text-sm font-medium truncate max-sm:hidden">SAT Practice</span>
        {phase === "test" ? (
          <button type="button" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen} className="bb-question-button max-sm:col-start-1 max-sm:justify-self-start">
            Question {index + 1} of {questions.length} {navOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        ) : <span />}
        <div className="flex justify-end gap-2 max-sm:col-span-2">
          {phase === "review" ? (
            <>
              <button type="button" onClick={() => goTo(questions.length - 1)} className="bb-button">Back</button>
              <button type="button" onClick={submit} className="bb-button">Submit</button>
            </>
          ) : (
            <>
              {index > 0 && <button type="button" onClick={() => goTo(index - 1)} className="bb-button">Back</button>}
              <button type="button" onClick={() => (index < questions.length - 1 ? goTo(index + 1) : goTo(index, "review"))} className="bb-button">Next</button>
            </>
          )}
        </div>

        {navOpen && phase === "test" && (
          <Navigator questions={questions} section={section} index={index} answers={answers} marked={marked}
            onPick={(i) => goTo(i)} onReview={() => goTo(index, "review")} onClose={() => setNavOpen(false)} />
        )}
      </footer>
    </div>
  );
}

function ToolButton({ icon: Icon, label, active, onClick }: {
  icon: typeof Calculator; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label} className="bb-tool">
      <Icon className="w-5 h-5" />
      <span className="max-sm:hidden">{label}</span>
    </button>
  );
}

function QuestionStrip({ number, marked, onMark, eliminator, onEliminator }: {
  number: number; marked: boolean; onMark: () => void; eliminator: boolean; onEliminator?: () => void;
}) {
  return (
    <div className="bb-strip">
      <span className="bb-strip-number">{number}</span>
      <button type="button" onClick={onMark} aria-pressed={marked} className="bb-mark-review">
        <Bookmark className={`w-4 h-4 ${marked ? "fill-[var(--bb-flag)] text-[var(--bb-flag)]" : ""}`} />
        Mark for Review
      </button>
      {onEliminator && (
        <button type="button" onClick={onEliminator} aria-pressed={eliminator} aria-label="Answer eliminator" title="Cross out answer choices" className="bb-eliminator">
          <span>ABC</span>
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
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect}
        className="bb-choice" data-selected={selected ? "" : undefined} data-crossed={crossed ? "" : undefined}>
        <span className="bb-choice-letter">{label}</span>
        <span className="sat-content sat-choice min-w-0" dangerouslySetInnerHTML={{ __html: html }} />
      </button>
      {eliminator && (
        <button type="button" onClick={onCross} aria-label={crossed ? `Undo crossing out ${label}` : `Cross out ${label}`} className="bb-cross">
          {crossed ? <span className="underline underline-offset-2">Undo</span> : <span className="bb-cross-letter">{label}</span>}
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

function Legend() {
  return (
    <div className="bb-legend">
      <span><MapPin className="w-3.5 h-3.5" /> Current</span>
      <span><i className="bb-legend-box" /> Unanswered</span>
      <span><Bookmark className="w-3.5 h-3.5 fill-[var(--bb-flag)] text-[var(--bb-flag)]" /> For Review</span>
    </div>
  );
}

function Navigator({ questions, section, index, answers, marked, onPick, onReview, onClose }: {
  questions: SatQuestion[]; section: string; index: number; answers: Record<string, string>; marked: Set<string>;
  onPick: (i: number) => void; onReview: () => void; onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden />
      <div role="dialog" aria-label="Questions" className="bb-navigator">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold">{section} Questions</p>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <Legend />
        <QuestionGrid questions={questions} index={index} answers={answers} marked={marked} onPick={onPick} />
        <div className="mt-5 text-center">
          <button type="button" onClick={onReview} className="bb-button-outline">Go to Review Page</button>
        </div>
      </div>
    </>
  );
}

function QuestionGrid({ questions, index, answers, marked, onPick }: {
  questions: SatQuestion[]; index: number | null; answers: Record<string, string>; marked: Set<string>;
  onPick: (i: number) => void;
}) {
  return (
    <div className="bb-grid">
      {questions.map((x, i) => {
        const done = Boolean(answers[x.id]);
        return (
          <button key={x.id} type="button" onClick={() => onPick(i)} data-done={done ? "" : undefined}
            aria-label={`Question ${i + 1}${done ? ", answered" : ", unanswered"}${marked.has(x.id) ? ", marked for review" : ""}${i === index ? ", current" : ""}`}>
            {i + 1}
            {i === index && <MapPin className="bb-grid-pin" />}
            {marked.has(x.id) && <Bookmark className="bb-grid-flag" />}
          </button>
        );
      })}
    </div>
  );
}

function CheckYourWork({ questions, section, answers, marked, timeUp, onPick }: {
  questions: SatQuestion[]; section: string; answers: Record<string, string>; marked: Set<string>; timeUp: boolean;
  onPick: (i: number) => void;
}) {
  const open = questions.filter((x) => !answers[x.id]).length;
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="bb-review-title">Check Your Work</h1>
        <p className="mt-3 text-[15px]">
          {timeUp ? "Time's up. " : ""}
          On test day, you won&apos;t be able to move on until time runs out. For this practice you can go
          back to any question, or Submit when you&apos;re ready.
        </p>
        <div className="bb-review-card">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-left">
            <p className="font-bold">{section} Questions</p>
            <p className="text-sm">{open} Unanswered · {questions.filter((x) => marked.has(x.id)).length} For Review</p>
          </div>
          <Legend />
          <QuestionGrid questions={questions} index={null} answers={answers} marked={marked} onPick={onPick} />
        </div>
      </div>
    </div>
  );
}

function Results({ questions, answers, spent, saved, reviewing, onReview, onRetry }: {
  questions: SatQuestion[]; answers: Record<string, string>; spent: Record<string, number>; saved: string;
  reviewing: number | null; onReview: (i: number | null) => void; onRetry: () => void;
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
          {saved === "saving" ? "Saving…" : saved === "saved" ? "Saved to your Question Bank history." : saved}
          {saved !== "saving" && saved !== "saved" && (
            <button type="button" onClick={onRetry} className="ml-2 underline underline-offset-4">Try again</button>
          )}
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
