# Paper — design guideline

The site's one look: a newspaper, after The New York Times (owner, 2026-10-28: "exactly like the
New York Times — reMarkable normally looks like it"). It began as a remarkable.com look on
2026-10-27. Read this before adding or changing anything that shows on the site.

- **Where it is built:** `scripts/palette.mjs` → `app/palette.css` (colours), `app/design.css`
  (type, corners, shells). Fonts are loaded in `app/layout.tsx`. Components keep using plain
  Tailwind utilities.

## The idea

A front page. A near-white page, black ink, hairline rules, and two typefaces: a serif for
headlines and text, a Franklin Gothic sans for everything you click or scan. Hierarchy comes from
type size and weight and from rules, not from colour or boxes.

## Rules

1. **Colour is ink on paper.** Use the gray ramp: `bg-gray-50` page, `bg-white` sheet,
   `border-gray-200` hairline, `text-gray-600` secondary, `text-gray-900` ink. Colour only when it
   means something: red for danger and errors, green for done, amber for a warning. Every other hue
   is drained to near-grey by the palette.
2. **Two typefaces.** Source Serif 4 (`--font-body`) for headlines and running text; Libre Franklin
   (`--font-ui`) for buttons, fields, menus, labels and small print. `app/design.css` assigns them —
   `h1`–`h3` serif bold, `button`/`input`/`label`/`legend`/`nav`/`.text-xs`/`.uppercase` Franklin. Don't set
   fonts in components.
3. **Headlines are bold serif,** large and tight. Section labels are kickers: small, bold, spaced
   Franklin caps (`text-xs font-bold uppercase tracking-wide`).
4. **Rules, not cards.** Prefer hairline rules (`border-gray-200`) to divide things; a strong rule
   (`border-gray-900`) or the masthead's double rule (`.masthead-rule`) to open a page. When a box
   is needed it is `bg-white border border-gray-200`, nearly square (`rounded-lg` is 4px). No
   shadows; only what floats — a dialog, a menu, the drawer — gets `shadow-xl`.
5. **Buttons are small black blocks** with bold Franklin text (`bg-gray-900 text-white`); secondary
   ones a hairline outline. One main action per view.
6. **Links in text are underlined** on hover with a thin offset underline.
7. **Space and columns.** A centred column (`max-w-5xl mx-auto`), generous gutters, grids divided by
   rules like newspaper columns.
8. **Icons are thin outlines** (lucide, `strokeWidth={1.5}` where large), in ink or grey.
9. **Motion is short and functional.** Respect reduced motion. **Focus** is a thin ink ring.

## Changing the look

- A colour: edit `scripts/palette.mjs`, run `node scripts/palette.mjs`, commit both files.
- Anything else: `app/design.css`. Prefer a rule there over restyling components one by one.
