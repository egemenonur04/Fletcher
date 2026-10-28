// Question text from the SAT Question Bank, made safe to put in the page.
//
// The bank's HTML carries prose, tables, MathML for the equations and inline SVG for the figures.
// It comes from another site, so it is cleaned on the server before it is ever sent: only the
// tags and attributes below survive — no scripts, no event handlers, no frames, no links out, and
// images only from data URIs or https.

import sanitizeHtml from "sanitize-html";

const PROSE = [
  "p", "br", "hr", "span", "div", "strong", "b", "em", "i", "u", "s", "sub", "sup", "small", "mark",
  "ul", "ol", "li", "blockquote", "figure", "figcaption", "img", "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col", "pre", "code",
];

const MATHML = [
  "math", "semantics", "annotation", "mrow", "mi", "mn", "mo", "ms", "mtext", "mspace", "mfrac",
  "msqrt", "mroot", "msub", "msup", "msubsup", "munder", "mover", "munderover", "mtable", "mtr",
  "mtd", "mlabeledtr", "mstyle", "mpadded", "mphantom", "menclose", "mfenced", "merror", "mmultiscripts",
  "mprescripts", "none",
];

const SVG = [
  "svg", "g", "path", "line", "polyline", "polygon", "rect", "circle", "ellipse", "text", "tspan",
  "defs", "clipPath", "marker", "title", "desc", "pattern", "linearGradient", "radialGradient", "stop",
  "use", "symbol",
];

const COMMON = ["class", "style", "role", "title", "aria-label", "aria-hidden", "aria-describedby", "id", "lang", "dir"];

const ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": COMMON,
  img: ["src", "alt", "width", "height"],
  td: ["colspan", "rowspan", "headers", "scope"],
  th: ["colspan", "rowspan", "headers", "scope"],
  col: ["span"],
  ol: ["start", "type"],
  math: ["display", "xmlns", "alttext"],
  annotation: ["encoding"],
  mo: ["stretchy", "fence", "separator", "lspace", "rspace", "form", "largeop", "movablelimits", "accent"],
  mi: ["mathvariant"],
  mn: ["mathvariant"],
  mtext: ["mathvariant"],
  mstyle: ["mathvariant", "displaystyle", "scriptlevel", "mathsize"],
  mfrac: ["linethickness", "bevelled"],
  mtable: ["columnalign", "rowalign", "columnspacing", "rowspacing", "columnlines", "rowlines", "frame"],
  mtd: ["columnalign", "rowalign", "columnspan", "rowspan"],
  mspace: ["width", "height", "depth"],
  mpadded: ["width", "height", "depth", "lspace", "voffset"],
  menclose: ["notation"],
  mfenced: ["open", "close", "separators"],
  munder: ["accentunder"],
  mover: ["accent"],
  munderover: ["accent", "accentunder"],
  svg: ["xmlns", "viewBox", "width", "height", "preserveAspectRatio", "fill", "stroke", "font-family", "font-size"],
};

// Presentation attributes shared by the SVG shapes.
const SVG_SHAPE = [
  "d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "width", "height",
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap",
  "stroke-linejoin", "stroke-opacity", "opacity", "transform", "font-size", "font-family", "font-weight",
  "font-style", "text-anchor", "dominant-baseline", "dx", "dy", "clip-path", "marker-start", "marker-mid",
  "marker-end", "markerWidth", "markerHeight", "refX", "refY", "orient", "viewBox", "offset",
  "stop-color", "stop-opacity", "gradientUnits", "patternUnits", "href", "xlink:href",
];
for (const tag of SVG) if (tag !== "svg") ATTRIBUTES[tag] = SVG_SHAPE;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...PROSE, ...MATHML, ...SVG],
  allowedAttributes: ATTRIBUTES,
  allowedSchemes: ["https", "data"],
  allowedSchemesByTag: { img: ["https", "data"] },
  // `<use href>` may only point inside the figure itself.
  exclusiveFilter: (frame) => frame.tag === "use" && /^(?!#)/.test(frame.attribs.href ?? frame.attribs["xlink:href"] ?? "#"),
  // SVG's attribute names are case-sensitive (viewBox): keep them as written.
  parser: { lowerCaseAttributeNames: false, lowerCaseTags: false },
  disallowedTagsMode: "discard",
};

export function cleanQuestionHtml(dirty: string): string {
  return dirty ? sanitizeHtml(dirty, OPTIONS) : "";
}
