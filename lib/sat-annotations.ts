// Highlights and notes on a practice question.
//
// Pure and dependency-free (scripts/test-sat-practice.mjs); the screen's DOM side is
// components/sat/BluebookAnnotator.tsx. An annotation is a span of characters in the passage or the
// question, counted over the text a reader can select, so it survives the HTML being redrawn. Spans
// in one area never overlap: a new one takes over the part of any older one it covers, as a second
// pass of a highlighter does, which is what lets each character have exactly one colour.

export type AnnotationArea = "stimulus" | "stem";

/** "none" is an underline with no colour behind it. */
export type HighlightColor = "yellow" | "blue" | "pink" | "none";

export const HIGHLIGHT_COLORS: Exclude<HighlightColor, "none">[] = ["yellow", "blue", "pink"];

/** Bluebook's annotate box has a limit too. */
export const MAX_NOTE = 300;

export interface Annotation {
  id: string;
  area: AnnotationArea;
  start: number;
  end: number;
  /** The text as selected, for the Highlights & Notes list. */
  quote: string;
  color: HighlightColor;
  underline: boolean;
  note: string;
}

const same = (a: Annotation, b: Pick<Annotation, "area">) => a.area === b.area;

/**
 * Adds a span, trimming whatever it overlaps. An older span cut in two keeps its note on the left
 * piece, and a note on a span the new one swallows whole moves to the new one if that has none, so
 * re-colouring text never loses what was written about it.
 */
export function addAnnotation(list: readonly Annotation[], added: Annotation): Annotation[] {
  if (added.end <= added.start) return [...list];
  const out: Annotation[] = [];
  let note = added.note;
  for (const a of list) {
    if (!same(a, added) || a.end <= added.start || a.start >= added.end) {
      out.push(a);
      continue;
    }
    const left = a.start < added.start;
    const right = a.end > added.end;
    if (!left && !right) {
      if (!note) note = a.note;
      continue;
    }
    if (left) {
      out.push({ ...a, end: added.start, quote: a.quote.slice(0, added.start - a.start) });
    }
    if (right) {
      out.push({
        ...a,
        id: left ? `${a.id}-r` : a.id,
        start: added.end,
        quote: a.quote.slice(added.end - a.start),
        note: left ? "" : a.note,
      });
    }
  }
  out.push({ ...added, note });
  return sortAnnotations(out);
}

/** Changes a span; one left with no colour and no underline shows nothing, so it goes. */
export function updateAnnotation(list: readonly Annotation[], id: string, change: Partial<Pick<Annotation, "color" | "underline" | "note">>): Annotation[] {
  return list.flatMap((a) => {
    if (a.id !== id) return [a];
    const next = { ...a, ...change };
    return next.color === "none" && !next.underline ? [] : [next];
  });
}

export function removeAnnotation(list: readonly Annotation[], id: string): Annotation[] {
  return list.filter((a) => a.id !== id);
}

/** Reading order: the passage, then the question, each from its first character. */
export function sortAnnotations(list: readonly Annotation[]): Annotation[] {
  return [...list].sort((a, b) => (a.area === b.area ? a.start - b.start : a.area === "stimulus" ? -1 : 1));
}

/** The span in an area holding a character, if any. */
export function annotationAt(list: readonly Annotation[], area: AnnotationArea, offset: number): Annotation | null {
  return list.find((a) => a.area === area && a.start <= offset && offset < a.end) ?? null;
}

/**
 * Where a text run of `length` characters at `from` is cut by the spans: each piece that belongs to
 * a span, last first. Working from the end means splitting a DOM text node leaves the earlier
 * offsets valid.
 */
export function piecesIn(list: readonly Annotation[], from: number, length: number): { start: number; end: number; annotation: Annotation }[] {
  const to = from + length;
  return list
    .filter((a) => a.start < to && a.end > from)
    .sort((a, b) => b.start - a.start)
    .map((annotation) => ({
      start: Math.max(annotation.start, from) - from,
      end: Math.min(annotation.end, to) - from,
      annotation,
    }));
}

/** An annotation read back from storage, or null when it isn't one. */
export function readAnnotation(value: unknown): Annotation | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const { id, area, start, end, quote, color, underline, note } = v;
  if (typeof id !== "string" || !id) return null;
  if (area !== "stimulus" && area !== "stem") return null;
  if (!Number.isInteger(start) || !Number.isInteger(end) || (start as number) < 0 || (end as number) <= (start as number)) return null;
  if (typeof quote !== "string" || typeof note !== "string") return null;
  if (color !== "yellow" && color !== "blue" && color !== "pink" && color !== "none") return null;
  return { id, area, start: start as number, end: end as number, quote, color, underline: underline === true, note: note.slice(0, MAX_NOTE) };
}
