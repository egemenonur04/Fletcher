"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MessageSquarePlus, Trash2, Underline, X } from "lucide-react";
import {
  HIGHLIGHT_COLORS, MAX_NOTE, piecesIn,
  type Annotation, type AnnotationArea, type HighlightColor,
} from "@/lib/sat-annotations";

/**
 * Highlighting on the practice screen: the DOM side. The rules are in lib/sat-annotations.ts.
 *
 * Offsets count only text a reader can select as text. MathML, SVG and screen-reader copies are
 * left out: a <mark> inside <math> is invalid and breaks the equation. A selection running across
 * an equation still works; the equation just isn't painted.
 */
const SKIP = "math, svg, .sr-only, [class*='sr-only']";

function textNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const out: Text[] = [];
  while (walker.nextNode()) out.push(walker.currentNode as Text);
  return out;
}

export interface SelectedSpan {
  area: AnnotationArea;
  start: number;
  end: number;
  quote: string;
}

/** A browser range as a span of an area's text, clipped to that area. */
function spanOf(root: HTMLElement, area: AnnotationArea, range: Range): SelectedSpan | null {
  let at = 0;
  let start = -1;
  let end = -1;
  let whole = "";
  for (const t of textNodes(root)) {
    if (range.intersectsNode(t)) {
      const from = t === range.startContainer ? range.startOffset : 0;
      const to = t === range.endContainer ? range.endOffset : t.length;
      if (to > from) {
        if (start < 0) start = at + from;
        end = at + to;
      }
    }
    whole += t.data;
    at += t.length;
  }
  if (start < 0) return null;
  // A span starting or ending in spaces is a sloppy drag, not a choice.
  const quote = whole.slice(start, end);
  const lead = quote.length - quote.trimStart().length;
  const trail = quote.length - quote.trimEnd().length;
  if (lead === quote.length) return null;
  return { area, start: start + lead, end: end - trail, quote: quote.trim() };
}

const areaOf = (node: Node | null): HTMLElement | null =>
  (node instanceof Element ? node : node?.parentElement)?.closest<HTMLElement>("[data-annotate-area]") ?? null;

export interface Selected extends SelectedSpan {
  rect: DOMRect;
}

/** Reports the selection inside an annotatable area as the reader makes it, or null when there is none. */
export function useTextSelection(onChange: (selected: Selected | null) => void) {
  const report = useRef(onChange);
  useEffect(() => {
    report.current = onChange;
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const read = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return report.current(null);
      const root = areaOf(selection.anchorNode) ?? areaOf(selection.focusNode);
      const area = root?.dataset.annotateArea as AnnotationArea | undefined;
      if (!root || !area) return report.current(null);
      const range = selection.getRangeAt(0);
      const span = spanOf(root, area, range);
      report.current(span ? { ...span, rect: range.getBoundingClientRect() } : null);
    };
    // A short wait, so a toolbar doesn't chase the pointer through a drag.
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(read, 120);
    };
    document.addEventListener("selectionchange", changed);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", changed);
    };
  }, []);
}

function paint(root: HTMLElement, spans: readonly Annotation[], activeId: string | null) {
  let at = 0;
  for (const t of textNodes(root)) {
    const length = t.length;
    const pieces = piecesIn(spans, at, length);
    at += length;
    // Whitespace between table cells or list items can't hold a <mark>.
    if (!t.data.trim()) continue;
    for (const { start, end, annotation } of pieces) {
      if (end < length) t.splitText(end);
      const piece = start > 0 ? t.splitText(start) : t;
      const mark = document.createElement("mark");
      mark.className = "bb-mark";
      mark.dataset.a = annotation.id;
      mark.dataset.color = annotation.color;
      if (annotation.underline) mark.dataset.underline = "";
      if (annotation.id === activeId) mark.dataset.active = "";
      piece.replaceWith(mark);
      mark.append(piece);
    }
  }
  for (const a of spans) {
    if (!a.note) continue;
    const marks = root.querySelectorAll<HTMLElement>(`mark[data-a="${CSS.escape(a.id)}"]`);
    if (marks.length) marks[marks.length - 1].dataset.noted = "";
  }
}

/**
 * Question HTML with its highlights drawn in. The HTML is set once by React and repainted from
 * scratch here, so marks never pile up; give it a `key` per question. A tap on a mark picks it.
 */
export function AnnotatedHtml({ area, html, annotations, activeId, onPick, className }: {
  area: AnnotationArea; html: string; annotations: readonly Annotation[]; activeId: string | null;
  onPick: (id: string, rect: DOMRect) => void; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = html;
    paint(root, annotations.filter((a) => a.area === area), activeId);
  }, [html, annotations, activeId, area]);

  const click = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    const mark = (e.target as Element).closest?.<HTMLElement>("mark[data-a]");
    if (mark?.dataset.a) onPick(mark.dataset.a, mark.getBoundingClientRect());
  };

  return <div ref={ref} data-annotate-area={area} onClick={click} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

const COLOR_NAMES: Record<HighlightColor, string> = { yellow: "Yellow", blue: "Blue", pink: "Pink", none: "No colour" };

/**
 * The bar that appears over a selection or a picked highlight. Pressing it must not take the
 * selection away, hence preventDefault on pointer down.
 */
export function HighlightToolbar({ rect, color, underline, existing, onColor, onUnderline, onNote, onDelete, onClose }: {
  rect: DOMRect; color: HighlightColor | null; underline: boolean; existing: boolean;
  onColor: (c: Exclude<HighlightColor, "none">) => void; onUnderline: () => void; onNote: () => void;
  onDelete: () => void; onClose: () => void;
}) {
  const WIDTH = 248;
  const HEIGHT = 48;
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  // Over the text, unless it would leave the screen; on a phone under it, clear of the system's own menu.
  const above = rect.top - HEIGHT - 10;
  const top = touch || above < 72 ? Math.min(rect.bottom + 10, window.innerHeight - HEIGHT - 72) : above;
  const left = Math.min(window.innerWidth - WIDTH - 8, Math.max(8, rect.left + rect.width / 2 - WIDTH / 2));
  return (
    <div role="toolbar" aria-label="Highlight" className="bb-toolbar" style={{ top, left, width: WIDTH, height: HEIGHT }}
      onPointerDown={(e) => e.preventDefault()}>
      {HIGHLIGHT_COLORS.map((c) => (
        <button key={c} type="button" onClick={() => onColor(c)} aria-label={`${COLOR_NAMES[c]} highlight`} aria-pressed={color === c}
          className="bb-swatch" data-color={c} />
      ))}
      <span className="bb-toolbar-rule" />
      <button type="button" onClick={onUnderline} aria-label="Underline" aria-pressed={underline} className="bb-toolbar-button">
        <Underline className="w-4.5 h-4.5" />
      </button>
      <button type="button" onClick={onNote} aria-label="Add a note" className="bb-toolbar-button">
        <MessageSquarePlus className="w-4.5 h-4.5" />
      </button>
      {existing ? (
        <button type="button" onClick={onDelete} aria-label="Remove highlight" className="bb-toolbar-button">
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      ) : (
        <button type="button" onClick={onClose} aria-label="Close" className="bb-toolbar-button">
          <X className="w-4.5 h-4.5" />
        </button>
      )}
    </div>
  );
}

/** The annotate panel: what was selected, and the note on it. */
export function NotePanel({ annotation, onSave, onDelete, onClose }: {
  annotation: Annotation; onSave: (note: string) => void; onDelete: () => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(annotation.note);
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => box.current?.focus(), []);
  return (
    <section className="bb-sheet" aria-label="Annotate">
      <header className="bb-sheet-head">
        <h2>Annotate</h2>
        <button type="button" onClick={onClose} aria-label="Close annotate"><X className="w-5 h-5" /></button>
      </header>
      <div className="bb-sheet-body">
        <p className="bb-sheet-quote"><span>Selected:</span> “{annotation.quote}”</p>
        <textarea ref={box} value={draft} maxLength={MAX_NOTE} rows={3} onChange={(e) => setDraft(e.target.value)}
          aria-label="Note" placeholder="Add a note…" className="bb-note-box" />
        <div className="flex items-center gap-3 mt-2">
          <button type="button" onClick={() => onSave(draft.trim())} className="bb-button">Save</button>
          <button type="button" onClick={onClose} className="bb-button-plain">Cancel</button>
          <span className="ml-auto text-xs text-gray-600 tabular-nums">{draft.length}/{MAX_NOTE}</span>
          <button type="button" onClick={onDelete} className="bb-button-plain inline-flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </section>
  );
}

/** Every highlight and note of the set, in question order; a row goes to it. */
export function NotesList({ rows, onOpen, onDelete, onClose }: {
  rows: { number: number; index: number; annotation: Annotation }[];
  onOpen: (index: number, annotation: Annotation) => void; onDelete: (index: number, id: string) => void; onClose: () => void;
}) {
  return (
    <section className="bb-sheet" aria-label="Highlights and notes">
      <header className="bb-sheet-head">
        <h2>Highlights &amp; Notes</h2>
        <button type="button" onClick={onClose} aria-label="Close highlights and notes"><X className="w-5 h-5" /></button>
      </header>
      <div className="bb-sheet-body">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-700">Select text in a passage or question to highlight it or add a note.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rows.map(({ number, index, annotation: a }) => (
              <li key={a.id} className="flex items-start gap-3 py-2">
                <span className="bb-note-number">{number}</span>
                <button type="button" onClick={() => onOpen(index, a)} className="flex-1 min-w-0 text-left">
                  <span className="bb-note-quote" data-color={a.color} data-underline={a.underline ? "" : undefined}>{a.quote}</span>
                  {a.note && <span className="block mt-0.5 text-sm font-normal text-gray-700 whitespace-pre-wrap">{a.note}</span>}
                </button>
                <button type="button" onClick={() => onDelete(index, a.id)} aria-label={`Remove highlight on question ${number}`} className="p-1 text-gray-700 hover:text-gray-900">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
