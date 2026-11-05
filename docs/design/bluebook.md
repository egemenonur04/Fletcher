# Bluebook — design guideline

The site's one look: the digital SAT's Bluebook test screen, everywhere (owner, 2026-11-05: buttons,
pages and text should all look like the Bluebook interface). It replaced Paper, a newspaper look.
Read this before adding or changing anything that shows on the site.

- **Where it is built:** `scripts/palette.mjs` → `app/palette.css` (colours), `app/design.css`
  (type, corners, shadows, shells, the `--bb-*` tokens and the test screen under `.bb`). Fonts are
  loaded in `app/layout.tsx`. Components keep using plain Tailwind utilities.

## The idea

A calm test screen. A white page, a pale blue bar along the top on a line of black dashes, near-black
text, and one blue that means "this is what you press".

## Rules

1. **Colour.** Use the gray ramp: `bg-gray-50` page, `bg-white` sheet, `border-gray-200` hairline,
   `text-gray-600` secondary, `text-gray-900` ink. Blue (`--bb-blue`, or the `blue-*` utilities) is
   for actions and selection. Red is danger and errors, green is done, amber is a warning. Other
   hues stay drained to near-grey.
2. **Two typefaces.** Roboto (`--font-ui`, `--font-body`) for the site. Noto Serif (`--font-reading`)
   only for what is read closely: SAT passages, questions and explanations (`.sat-content`). Don't
   set fonts in components.
3. **Headings are plain:** medium Roboto, not bold and not serif, as "Check Your Work" is.
4. **The main action is a blue pill.** A button or link with `bg-gray-900` becomes one, so components
   need nothing new. A selected toggle stays blue with a rounded rectangle. Secondary buttons are a
   thin outline.
5. **Top bars are `theme-header`:** pale blue on black dashes. `.bb-banner` is the navy strip under a
   bar: the practice notice in a test, the date on the portal.
6. **Cards float.** A box is white with rounded corners. `theme-tile` adds the review card's shadow
   and a blue edge on hover. What floats over the page gets `shadow-xl`.
7. **Fields** have a thin dark outline and a blue ring on focus.
8. **Icons are thin outlines** (lucide, `strokeWidth={1.5}` where large).
9. **Motion is short and functional.** Respect reduced motion.

## The test screen

`.bb` in `app/design.css` is the practice screen's frame: the strip, choices, divider, navigator,
highlights and panels. Highlight colours are `--bb-yellow`, `--bb-sky` and `--bb-pink`.

Open fonts and our own drawings only: no College Board logos, assets or font files.

## Changing the look

- A colour: edit `scripts/palette.mjs`, run `node scripts/palette.mjs`, commit both files.
- Anything else: `app/design.css`. Prefer a rule there over restyling components one by one.
