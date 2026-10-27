# Paper — design guideline

The site's one look, after remarkable.com (owner, 2026-10-27): "simpler, close to black and white,
minimalist". Read this before adding or changing anything that shows on the site.

- **Where it is built:** `scripts/palette.mjs` → `app/palette.css` (colours), `app/design.css`
  (type, radii, buttons, shells). Components keep using plain Tailwind utilities.

## The idea

A sheet of paper and a pen. A warm off-white page, white sheets on it, near-black ink. Lots of
room. Nothing glows, nothing is decorated; hierarchy comes from size, weight and space, not colour.

## Rules

1. **Colour is ink on paper.** Use the gray ramp: `bg-gray-50` page, `bg-white` sheet,
   `border-gray-200` hairline, `text-gray-500` secondary, `text-gray-900` ink. Colour only when it
   means something: red for danger and errors, green for done, amber for a warning. Every other hue
   is drained to near-grey by the palette, so a stray `text-blue-600` reads as dark grey, not blue.
2. **Type is Inter, set quietly.** Titles are large and medium weight with tight tracking
   (`font-medium tracking-tight`), never heavy. Labels are small grey sentence case; avoid shouting
   caps except tiny group labels.
3. **Sheets, not boxes.** A card is `bg-white border border-gray-200 rounded-2xl` (or `rounded-xl`
   for small ones). No shadows; only what floats over the page — a dialog, a menu, the drawer —
   gets `shadow-xl`, which is a soft lift.
4. **Buttons are pills.** The main action is ink (`bg-gray-900 text-white`), the others a hairline
   outline. One main action per view.
5. **Space is the layout.** Generous padding (`p-6`/`p-8` on sheets), wide gutters, a narrow
   reading column for text. When a screen feels busy, remove something before restyling it.
6. **Icons are thin outlines** (lucide, `strokeWidth={1.5}` where they are large), always in ink or
   grey.
7. **Motion is short and functional** — a hover, a slide-in. Respect reduced motion.
8. **Focus** is a thin ink ring or outline, always visible on keyboard focus.

## Changing the look

- A colour: edit `scripts/palette.mjs`, run `node scripts/palette.mjs`, commit both files.
- Anything else: `app/design.css`. Prefer a rule there over restyling components one by one.
