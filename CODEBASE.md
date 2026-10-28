# MyPortal — architecture

A personal hub: **Self Care** (diet), **Finances**, **Study** (APs, GPA, SAT, UCAT) and **Shopping**, behind one
password. Next.js App Router on Vercel, Prisma against Supabase Postgres, Tailwind.

This file covers how the pieces fit and the conventions that hold across them. For what is done
and what is pending, read `.claude/PROGRESS.md`.

---

## Conventions

These hold everywhere; breaking one is usually a bug.

**Pages are server components and query Prisma directly.** Anything touching the database sets
`export const dynamic = "force-dynamic"`. A production build must succeed with **no reachable
database** — if it doesn't, a page is being prerendered that shouldn't be.

**Mutations go through route handlers,** not server actions. The client `fetch`es, then calls
`router.refresh()`. Handlers are wrapped in `withErrors` (`lib/api-errors.ts`) so every failure
path still returns JSON — a bare 500 with an HTML body makes clients throw inside `res.json()`.

**Bodies are validated with zod.** Invalid input is a 400 with `{ error, issues }`, never a 500.

**Client components must not import anything that reaches `lib/db`.** That pulls `pg` into the
browser bundle and fails at build. Pure rules live apart from their database access for exactly
this reason: `lib/study.ts` (rules, importable anywhere) vs `lib/study-service.ts` (Prisma).

**Dates are date-only, and local.** Dates are `"YYYY-MM-DD"` keys in code and Postgres
`date` columns, converted only through `lib/dates.ts`, which pins everything to
`APP_TIME_ZONE` (`Europe/Istanbul`). The server runs in another zone, so "today" is never
`new Date()` on the server. Weeks start Monday.

**Schema changes are hand-written SQL.** `prisma db push` cannot reach this Supabase instance.
See `prisma/manual-migrations/README.md`. Every new table needs
`ENABLE ROW LEVEL SECURITY` — Supabase serves `public` over REST, and new tables do not inherit it.

---

## Authentication

`proxy.ts` (the Next 16 name for what used to be `middleware.ts`, and now on the Node.js
runtime) guards every route except `/login`, `/api/auth` and the PWA install assets iOS fetches
unauthenticated. `/api/*` gets a 401 JSON rather than a redirect — redirecting an API caller
produced a 200 that `fetch()` read as success, so forms hung on "Saving…" forever.

The session cookie holds an **HMAC-signed token** (`lib/session.ts`): a payload of issued-at,
expiry and a random `jti`, signed with `AUTH_SECRET` via Web Crypto. The cookie must never
contain `AUTH_SECRET` itself — a leaked cookie would then *be* the environment secret,
unrevocable and shared by every session. `POST /api/auth` checks the password against
`AUTH_PASSWORD`, rate-limited; `DELETE /api/auth` logs out.

One exception to "everything needs a session": the nightly review job has none, so it reads
`GET /api/study/review` with `Authorization: Bearer <REPORT_TOKEN>` instead. The proxy lets that
through for **that exact path and method only** — any other path, POST, or a sibling like
`/api/study/review/x` is still a 401. The token is read-only by construction and fails closed:
unset or under 32 characters, nothing matches, so a missing variable cannot open the endpoint.
It is compared over SHA-256 digests with no early exit.

The second exception is the phone widgets (`scriptable/`, run by the Scriptable app), with their
own `Authorization: Bearer <WIDGET_TOKEN>`: the same fail-closed check, for exactly the calls in
`WIDGET_ROUTES` (`lib/session.ts`) — `GET /api/self-care/day`, `PUT /api/self-care/meals` and
`POST /api/self-care/water` — so a widget can read the day, tick a meal and log water, and nothing
else. A token of their own rather than the site password: Scriptable's Keychain is shared by every
script on the phone.

---

## Data model

29 models, 8 enums. The shape by area:

**Library** was removed on 2026-10-28 (Books, Anime, TV and the Wardrobe the day before); 041 and
045 drop its tables.

**Finances.** `FinanceConfig` (budget), `Expense`, `AdditionalIncome`, `Subscription`. Expenses
carry a unique `clientId` so the offline logger can retry without duplicating — a client-side
lock cannot prevent double submission across two tabs, so idempotency is enforced in the database.

**Two pots (money sources).** Every expense and subscription has a `source` (`FundSource`:
`BASE` or `EXTRA`, default `BASE`). It says which card paid: the monthly budget or additional
income. Each pot carries over on its own. Base gains the budget and Extra gains the additional
income, and each pays what was charged to it (`rollCarryover` and `monthBalances` in
`lib/fund-sources.ts`, tested). Base + Extra always equals the single carryover and remaining the
page showed before, including the old rule that only a month with something recorded gets the
budget. `loadMonth` in `lib/finances.ts` feeds both the month page and `GET /api/finances/[y]/[m]`,
which returns `balances` per pot. The quick log (`/finances/log`) reads them to show what's left on
each card as you pick one, and warns when an amount is more than that card has. It keeps the last
figures in localStorage for offline use, minus whatever is still queued (`leftAfterPending`). The
last-used card is remembered (`useStoredSource`). On the month page, tapping an entry's
Base/Extra tag moves it (`PATCH` expenses or subscriptions `{ source }`).

The carryover cache key is `finance-carryover-by-source`, because the value changed from a number
to an object. Writes expire the `finance-stats` tag with `{ expire: 0 }`, not `"max"`: "max"
serves the stale carryover once more, which showed the wrong balance right after moving or
deleting an earlier month's expense.

**Installment purchases (taksit).** `Installment` (name, `total`, `count` 2–60, first
`startYear`/`startMonth`, `source`; 033) is a subscription that ends by itself. Only the price is
stored. `lib/installments.ts` (tested) derives each month's share in kuruş, with the rounding
difference on the first, as banks do: 1.000 ₺ in 3 is 333,34 + 333,33 + 333,33. So the
installments always add up to the price. `schedule` feeds `computeCarryover`, and `chargesInMonth`
adds this month's installments to the month page's and the month API's charges, so the
quick log's "left on each card" includes them. On the month page, the "Installments" section
shows each purchase being paid with k/N, this month's share, a progress bar, what's left and
the last month. Upcoming ones show as "from <month>"; paid-off ones are folded under a
`<details>`. The add form takes a total or a per-installment amount (`totalFromEach`), the
count, a first month (36 back to 3 ahead, for one already being paid), and a card. The form
previews "N × X · until <month>". Tapping the tag moves every installment, past ones too
(`PATCH { source }`). Delete asks first, since it rewrites past months' balances.

**Shopping.** `Shop`: a website, a name, a free-text `category`, and what you `liked` and
`disliked`. A category is made by filing a shop under it. The API files a typed category with an
existing one whatever the case ("clothing" → "Clothing", via `canonicalCategory`), so near-duplicates
never split a line. Addresses go through `normaliseShopUrl`, which adds https when missing and
**refuses anything that is not http(s)**, since the address becomes a link: a `javascript:` URL
would run on click. Links open in a new tab with `noopener noreferrer`. The page draws every
category as a line and every shop as a station on it (`ShopLines`). The line's colour is a
palette hue (`lineHue`) passed as `--line`, so each look recolours it. Each line has a letter code
(`lineCodes`: first letter, more letters if taken), and stations are numbered along it (C01, C02).
Codes come from the whole map, not the filtered view, so a shop keeps its code while searching.
Filtering by category and search (name, address, category, notes, products) is done in memory over
one query. **Products** (`ShopProduct`: name and a comment of its own; cascade-deleted with the
shop) sit under a shop, beside its own liked / didn't-like notes. They are managed on the shop's
page `/shopping/[id]` (`ProductList`: add, edit and delete in place) and listed on its card on the
map. Product writes go through `/api/shopping/[id]/products/[productId]` and are scoped to that shop
(`where: { id, shopId }`), so a product can't be changed through another shop's address. Saving a
new or edited shop lands on its page.

**Study** keeps four parts (owner, 2026-10-28): APs, GPA, SAT and UCAT. The session timer,
modules, planner, daily review and stats pages were removed then. Their tables (`Module`,
`StudySession`, `XpAward`, `StudyConfig`, `StudyTask`…), libs and API routes stay: the 23:15
scheduled Claude routine still reads `/api/study/review` (now with nothing new to report), and the
data is kept should the pages come back.

**Study.** `VocabWord` has one or more `VocabMeaning`s, and every meaning becomes one question.
A `VocabRun` is a sitting of the test, holding a `VocabQuestion` per meaning with its shuffled
options. The three categories are the verdicts on the current run's questions, so starting a new
run is what resets them. The rule that keeps the test honest: a question's distractors never
include another sense of the same word, which would be a second correct answer.

**Quick tests** (`/study/sat/vocab/quick`) are `VocabRun`s with `kind = QUICK`: up to 10–50 questions
from one pool — all words, the full run's To Review or Ambiguous, meanings the full run hasn't asked
yet, or words whose flashcard was forgotten (`lapses > 0`). Wrong answers still come from the whole
list (`buildQuestions`' `ask`). `currentRun()` and the daily review only ever read `kind = FULL`, so a
quick test never moves the full test or its three lists.

**Flashcards** (`/study/sat/vocab/flashcards`): one `VocabCard` per word, made on first visit
(`ensureCards`, new cards in a random fixed order). Scheduling is Anki's classic SM-2 with its
defaults, pure in `lib/flashcards.ts`: learning steps 1m/10m, graduate at 1 day (Easy 4), Hard ×1.2,
Good ×ease (half the lateness counted), Easy ×ease×1.3; Again on a review → relearn 10m, ease −0.2
(min 1.3), interval back to 1 day. Study days start at 4am Istanbul. Queue: due learning cards, then
reviews, then new cards (daily limits in `StudyConfig`), then learning cards due within 20 minutes.
Each answer writes a `VocabReview` with the card as it was — for the daily counts and for Undo. An
answer carries the card's `reps`, so a double tap is refused (counted once).

**APs.** `ApCourse` and `ApUnit`, seeded from College Board CEDs: Statistics, Computer Science A,
Biology, Chemistry, Calculus BC (043 replaced the earlier set). Courses sharing a `series` render as
one continuously-numbered sequence (none do now). Ticking a unit stores a timestamp, so it doubles
as "finished on".

**SAT** (`/study/sat`; `/sat` and `/study/sat-vocab` redirect).
The Question Bank lists College Board's SAT Suite Question Bank, fetched server-side from its public
but undocumented API (`lib/sat-qbank-service.ts`: `get-questions` per section, cached 12 h;
`get-question {external_id}` or `saic.collegeboard.org/disclosed/{ibn}.json` per question, cached
30 days). `lib/sat-qbank.ts` reads both question shapes into one, de-duplicates the index and marks
answers (a typed answer is right if it equals, or is worth the same number as, any accepted one);
`lib/sat-html.ts` cleans the HTML (MathML and SVG kept, scripts/handlers/links dropped) before it is
cached or sent. Filters (domain, skill, difficulty, last result) live in the address. A practice set
is `/study/sat/practice?ids=…` (outside Study's `(shell)` route group, full-window): Bluebook's frame — clock at
Bluebook's pace (32 min/27 R&W, 35 min/22 Math), directions, Desmos's SAT calculator in an iframe, a
reference sheet, Mark for Review, the answer eliminator, the navigator, Check Your Work, Submit, then
results with explanations. Only answers are stored (`SatAttempt`, 042), marked on the server.

**GPA** (`/study/gpa`). A `GpaLesson` is a lesson's weekly hours plus, for each half of the year,
two exams, two performances and a project. Averages are not stored. A half's lesson average is
the mean of the marks filled in (a blank is skipped, not a zero); the half weights those lessons
by hours; the year is the average of the two halves. One half with no marks yet leaves the year
as the other half.

**UCAT** (`/study/ucat`). No question bank: the official UCAT material lives behind its own player
at practice.ucat.ac.uk with no public feed, so the page links there, lists the four subtests, and
logs practice-test scores (`UcatScore`, 044; three subtests 300–900, SJT band 1–4; `lib/ucat.ts`).

**UCAT lessons** (`/study/ucat/[subtest]/[lesson]`). A course per subtest — VR 5 lessons, DM 7, QR 6,
SJT 5 — written in code: `lib/ucat-lessons.ts` holds the types, the registry and the marking
(drag-and-drop 2/1/0 for five/four/fewer right; SJT full credit for the key, half for one step
away), `lib/ucat-content/{vr,dm,qr,sjt}.ts` the lessons. A lesson is teaching blocks, key terms,
worked examples (answer at a click) and practice (answered, then marked). The teaching follows
*Mastering the UCAT* (2019), retold and updated to the 2025 format; every question is original —
`scripts/test-ucat.mjs` checks every key points at a real answer. The only stored state is which
lessons are done (`UcatLessonDone`, 046; `POST /api/study/ucat/lessons` accepts only ids in
`allLessonIds()`).

---

## Look

One look, a newspaper after The New York Times (owner, 2026-10-28; first drawn after
remarkable.com on 2026-10-27, it replaced Soft Club, Acid, Early
Cyber, Cyberdelia and Classic, and the picker that chose between them). Two stylesheets, imported by
the root layout after Tailwind's:

- `app/palette.css`, generated by `node scripts/palette.mjs`, redefines Tailwind's colour variables:
  a near-white gray ramp (`gray-50` the page, `white` a sheet, `gray-900` the ink) and hues drained
  to near-grey, except red, green, amber and rose, which keep enough colour to mean something.
  Every page is restyled through the utilities it already uses.
- `app/design.css` adds what a palette can't: Source Serif 4 for headlines and text, Libre Franklin
  for controls and small print, near-square corners, no shadows except on what floats, and the
  shells' details via the hook classes (`theme-sidebar`, `theme-header`, `theme-tile`, …).

The rules are in `docs/design/paper.md`.

## Layout

```
app/
  (portal)          app/page.tsx — the section cards under a masthead
  self-care/…       the day's meals from the diet plan (/self-care, installable as "Diet", works offline)
  finances/…        month view, plus /log (installable PWA)
  study/…           APs, GPA, SAT (question bank, practice screen, vocabulary), UCAT
  shopping/…        shops by category (a metro map); a shop's page with its products; new / edit
  api/…             route handlers, grouped by section
components/<section>/   client components, one folder per section
lib/                    rules, database access, helpers
prisma/
  schema.prisma
  manual-migrations/    idempotent SQL, applied by hand
scripts/                node test scripts, graph sealing
scriptable/             the phone widgets (Diet, Water) for the Scriptable app, and how to set them up
```

### `lib/` worth knowing

| Module | What it holds |
|---|---|
| `db.ts` | The Prisma singleton and its connection guard |
| `session.ts` | HMAC session tokens, shared by middleware and route handlers |
| `api-errors.ts` | `withErrors`, `readJson` |
| `dates.ts` | Date keys and the app timezone |
| `study.ts` / `study-service.ts` | Session and XP rules (client-safe) / Prisma side |
| `goals.ts` / `goal-schema.ts` | Weekly-goal arithmetic and its wording / the zod rule both goal routes share |
| `review.ts` / `review-service.ts` | The daily review's rules — day boundaries, streaks, level-ups / its queries |
| `leveling.ts` | The XP curve: `level = floor(k · ln(1 + xp/30k))`, k = 10 |
| `vocab.ts` / `vocab-service.ts` | Parsing a pasted word list, and building the test / its Prisma side |
| `stats.ts` | The fourteen stats and their presentation |
| `shopping.ts` / `shopping-service.ts` | Shop addresses, names from domains, categories, line codes and colours / categories in use |
| `wash-calculator.ts` | Care labels → machine settings |
| `meal-plan.ts` / `meal-plans/*.ts` / `meal-plan-service.ts` | The diet plan's shape, which plan covers a day, how a tick names a meal and what the ticked meals add up to / one file per month, transcribed from the user's plan (a new month is a new file added to `MEAL_PLANS`; `npm test` checks its sums) / a day's ticks and water entries, null until migration 038 has run |
| `finances.ts` / `finances-utils.ts` | Month maths and carryover |
| `fund-sources.ts` / `fund-source-client.ts` | The Base / Extra pots: carryover, balances, queued-expense adjustment / the remembered card |
| `installments.ts` | Installment purchases: the per-month split to the kuruş, which installment a month is, paid / left |
| `expense-queue.ts` | The offline logger's IndexedDB queue |
| `diet-queue.ts` | The Diet page's offline queue (ticks and water made without the site) and each day's last word from the site, in IndexedDB; `overlay` lays the one over the other |

---

## Testing

`npm test` runs plain node scripts over the pure modules — date maths, the XP rule, the level
curve, the vocabulary parser and question builder, the daily review, the report token, the SAT
Question Bank reader and marking, UCAT scores and lessons, the shopping
rules (addresses, categories, line codes), the finance pots (carryover per source, balances), installment splits, and the meal plans' sums. `scripts/alias.mjs` teaches node the `@/` import alias, so a pure module can
import another the same way the app does. There is no browser test suite; UI and schema changes are verified by running the app
against a throwaway Postgres and driving it, because the bugs that mattered here were only
visible in the **database**, not on screen. The offline expense logger passed every browser
check while writing four rows for three expenses.
