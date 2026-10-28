# MyPortal — architecture

A personal hub: **Library**, **Self Care** (diet), **Finances**, **Study** and **Shopping**, behind one
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

36 models, 22 enums. The shape by area:

**Library.** Each medium has a status derived from progress counts, never set by hand
(`lib/derive-status.ts`). Two media have parent hierarchies with `SET NULL` foreign keys, so
deleting a parent orphans children rather than destroying them:

- Films — `MovieUniverse → Movie` (no series tier)
- Comics — `ComicPublisher → ComicUniverse → ComicTitle → ComicIssue`, the one hierarchy where
  the leaf is an issue rather than the work itself

Standalone: `Manga`, `Game`, `Article`. (Books, Anime, TV and the Wardrobe were removed on
2026-10-27; migration 041 drops their tables.)

**Comics from Comic Vine.** "Add Comic" searches Comic Vine and imports a whole run: the comic, named
with its start year ("The Amazing Spider-Man (1963)" — Marvel reuses titles), and every issue with its
name and cover. `ComicTitle.comicVineId` remembers the run, unique per universe, so importing it again
— "Check for new issues" on the comic's page — only adds what is missing. The merge rule is in
`planMerge`: an import creates missing issues and fills a blank name or cover, and never writes
read, owned, rating, rereads, notes or anything you set yourself. Issue numbers arrive as strings;
"½", "-1" and "1.5" are placed, "1.MU" and collisions like "1.1"/"1.10" are reported, not guessed.
Covers are hotlinked and rendered `unoptimized`, and excluded from cover mirroring. The key,
`COMICVINE_API_KEY`, is server-only. (marvelreading.com was the first choice; it blocks automated
access with a Cloudflare challenge and its robots.txt disallows ClaudeBot, so it is not used.)

**Movies from TMDB.** "Add Movie" searches TMDB for films, collections ("Harry Potter Collection")
and keyword tags ("marvel cinematic universe (mcu)" — the MCU has no TMDB collection). A film is
added in one tap; a collection or tag opens a preview with checkboxes, listed in release order, and
imports the ticked films — up to 100, six detail requests at a time. Each arrives with director(s),
lead studio, runtime, year, original language and poster. `Movie.tmdbId` is unique (a film is in the
library once, in at most one universe); `imdbId` is kept only to link to IMDb. The merge rule is
`planImport`: match by TMDB id, else once by title + year to a film added by hand (which is then
linked); fill blanks only — never title, status, rating, rewatches, notes or language; a standalone
film moves into the universe being imported into, a film in another universe stays and is reported.
Runtime 0 means "not known yet" (a film imported before release); importing it again fills it.
New rows are stamped a millisecond apart so a universe page (year, then `createdAt`) keeps release
order within a year. Posters are hotlinked from image.tmdb.org, rendered `unoptimized`, and excluded
from cover mirroring — TMDB's terms limit how long its content may be kept. TMDB requires its
attribution notice and logo wherever its data is used (`TMDB_NOTICE`, `public/tmdb-logo.svg`). The key,
`TMDB_API_KEY` (a v3 key or a v4 read token — both work), is server-only. Cards carry a one-tap
Watched toggle. (IMDb was the first choice; its Conditions of Use forbid robots and scraping without
written consent and it has no public API, so it is not used.)

**Manga from MyAnimeList.** The official MAL API, with `MAL_CLIENT_ID` (`/manga?q=`, `/manga/{id}` with
`authors{first_name,last_name}`). On MAL a manga is one entry for the whole series, so there is no
run to walk: one entry, one row, linked by `Manga.malId` (unique, 032). "Add Manga" searches MAL
first (`MangaMalImport`): format from `media_type` (manhwa/manhua, else manga); author from the
Story / Story & Art credits, artist from Art when it is someone else ("Unknown" if nobody is
credited — the column is required); MAL's 0 volumes/chapters = unknown; publishing, on hiatus or
not yet published = `ongoing`. Publisher isn't filled (MAL gives the magazine, not the publisher).
Options: To read / Read (finished series only — counts set to the totals, status derived as
usual), Japanese / English title, and the reading language (starts on the library's most common
one). Light novels and novels are listed but not imported. `matchExisting`:
MAL id, else an unlinked row whose normalised title equals any of the entry's titles → that row is
linked instead of a duplicate; a unique-index clash from a concurrent import reads as "already".
A hand-added manga's page has "Find on MyAnimeList" (links that row whatever its title); a linked
one has "Check MyAnimeList" (`refreshManga`). Linking and checking only fill blanks and grow counts
(`updatesFromManga`) — title, progress, rating, notes, language and publisher are never touched;
status is re-derived so a series that just ended can complete. Covers hotlinked and excluded from
manga mirroring.

**Importing a whole manga list** (`/library/manga/import`, "Import list" on the Manga page). Sources:
a public user's Completed manga list (`/users/{name}/mangalist`), MAL's manga export, or an .xlsx copy
of the list page — each title cell links to `/manga/{id}`, read by `sheetLinks` (or the cover's address
as text), so lines carry their id; a link-less line is matched by exact title (`pickManga`) at import. `lib/mal-manga-list.ts`: novels
and on hold/dropped/planned are left out. A list page copy may be the Completed tab or "All
Manga" (no Type column; "read / total" in Chapters marks one being read, a bare count one finished).
One manga per line, each through the ordinary `/api/manga/mal/import` — finished as read, reading
with `progress` (chapters/volumes, capped at the series' totals); already-linked ones start unticked (`/api/manga/mal/places`, database
only). Requests go through `lib/fetch-retry.ts`: up to 5 tries with
5–45 s pauses on 429/5xx/connection loss; whatever still fails is offered again from the result.

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

**Study sessions.** A `Module` is a thing you study: a title and the one-to-three `Stat`s it
trains. It has no hours and no place in a day — you pick one when you start a `StudySession`, and
stopping pays `XpAward` rows of one XP per whole minute to each of those stats. A session started
without a module rolls three stats at random instead, for one-off work not worth naming.

A session **snapshots** both the stats it pays and the module's title, rather than reading them
back through the relation. That is what makes the history stable: re-pointing a module's stats
cannot rewrite what past sessions earned, and deleting a module (`SetNull`) leaves its sessions
readable by name instead of silently turning them into free ones.

**Weekly goals.** `Module.weeklyGoalMinutes` is a per-module target and `StudyConfig` (one row,
id `global`, like `FinanceConfig`) holds the overall one; both nullable, both in minutes so 7.5h
is exact. Progress is not stored — it is this week's session time, Monday to Sunday in Istanbul,
with a running session added live. Free study counts toward the overall goal only. The per-day
figure counts today as a day left and rounds up, so it never asks for less than what remains.

`ApCourse`/`ApUnit` hold the College Board unit lists; ticking a unit sets `completedAt`.

**Planner.** `/study/tasks` is a list of study tasks (`StudyTask`), separate from sessions: a
session is time you spent, a task is work that is due. A subject is the course and a category is
the kind of work (Homework, Exam Preparation, …); the seven categories are seeded by migration
039 while the table is empty. A task may have no due date. Dates are Istanbul keys on a Postgres
`date`; a due time is `HH:MM` and only exists with a date. Overdue means still open and the
deadline has passed — a bare date lasts the whole day, a time passes at that minute. Completing
a task stamps `completedAt` once; leaving Completed clears it. Steps (`StudySubtask`) are deleted
with the task; deleting a subject or category unfiles the task (`SET NULL`) rather than deleting
it. The rules (views, filters, sort, progress, what a save may say) are pure in `lib/study-tasks.ts`.
The Study page shows how many are due today once 039 has run, and nothing about it before that.

**Daily review.** `/study/review` (and the same thing as JSON at `/api/study/review`) adds up one
day: time per module, XP and level-ups per stat, the study streak, AP units ticked and SAT
questions answered. It has no table of its own — it is assembled from the rows above. The rule
that matters is the day boundary: sessions carry a date, but AP ticks and vocabulary answers are
instants, and 00:30 in Istanbul is still the previous day in UTC. Everything is bucketed through
`todayKey`, the same function that defines "today" everywhere else. A 23:15 scheduled Claude
routine reads the JSON and writes the evening report.

**Study.** `VocabWord` has one or more `VocabMeaning`s, and every meaning becomes one question.
A `VocabRun` is a sitting of the test, holding a `VocabQuestion` per meaning with its shuffled
options. The three categories are the verdicts on the current run's questions, so starting a new
run is what resets them. The rule that keeps the test honest: a question's distractors never
include another sense of the same word, which would be a second correct answer.

**Quick tests** (`/study/sat-vocab/quick`) are `VocabRun`s with `kind = QUICK`: up to 10–50 questions
from one pool — all words, the full run's To Review or Ambiguous, meanings the full run hasn't asked
yet, or words whose flashcard was forgotten (`lapses > 0`). Wrong answers still come from the whole
list (`buildQuestions`' `ask`). `currentRun()` and the daily review only ever read `kind = FULL`, so a
quick test never moves the full test or its three lists.

**Flashcards** (`/study/sat-vocab/flashcards`): one `VocabCard` per word, made on first visit
(`ensureCards`, new cards in a random fixed order). Scheduling is Anki's classic SM-2 with its
defaults, pure in `lib/flashcards.ts`: learning steps 1m/10m, graduate at 1 day (Easy 4), Hard ×1.2,
Good ×ease (half the lateness counted), Easy ×ease×1.3; Again on a review → relearn 10m, ease −0.2
(min 1.3), interval back to 1 day. Study days start at 4am Istanbul. Queue: due learning cards, then
reviews, then new cards (daily limits in `StudyConfig`), then learning cards due within 20 minutes.
Each answer writes a `VocabReview` with the card as it was — for the daily counts and for Undo. An
answer carries the card's `reps`, so a double tap is refused (counted once).

**APs.** `ApCourse` and `ApUnit`, seeded from College Board CEDs. Courses sharing a `series`
(Physics C) render as one continuously-numbered sequence. Ticking a unit stores a timestamp, so
it doubles as "finished on".

**GPA** (`/study/gpa`). A `GpaLesson` is a lesson's weekly hours plus, for each half of the year,
two exams, two performances and a project. Averages are not stored. A half's lesson average is
the mean of the marks filled in (a blank is skipped, not a zero); the half weights those lessons
by hours; the year is the average of the two halves. One half with no marks yet leaves the year
as the other half.

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
  (portal)          app/page.tsx — the four section cards
  library/…         five media types, each list / detail / edit / new
  self-care/…       the day's meals from the diet plan (/self-care, installable as "Diet", works offline)
  finances/…        month view, plus /log (installable PWA)
  study/…           sessions, modules, stats, APs, SAT vocabulary
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
| `derive-status.ts` | Progress counts → status, for every medium |
| `dates.ts` | Date keys and the app timezone |
| `study.ts` / `study-service.ts` | Session and XP rules (client-safe) / Prisma side |
| `comicvine.ts` / `comicvine-service.ts` / `comicvine-import.ts` | Issue numbers, covers and the merge rule / the API client / landing a run in a universe |
| `tmdb.ts` / `tmdb-service.ts` / `tmdb-import.ts` | Reading TMDB's answers and the merge rule / the API client / landing films in the library |
| `mal.ts` / `mal-service.ts` | MAL's image CDN / the MAL API client (manga search, entries, a user's list) |
| `xlsx-lite.ts` | Reading an .xlsx (cells and hyperlinks) without a dependency |
| `mal-manga-list.ts` / `fetch-retry.ts` | Whole manga list import: reading list files and ids, what is left out / the retrying fetch the list import uses |
| `mal-manga.ts` / `mal-manga-import.ts` | Manga: reading MAL entries, format/credits/ongoing and the fill-blanks rules / landing, linking and checking one in the database |
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

`npm test` runs plain node scripts over the pure modules — status derivation, date maths, the
XP rule, the level curve, the vocabulary parser and question builder, the daily review, the
report token, the Comic Vine, TMDB (film) and MyAnimeList (manga) merge rules, the shopping
rules (addresses, categories, line codes), the finance pots (carryover per source, balances), installment splits, and the meal plans' sums. `scripts/alias.mjs` teaches node the `@/` import alias, so a pure module can
import another the same way the app does. There is no browser test suite; UI and schema changes are verified by running the app
against a throwaway Postgres and driving it, because the bugs that mattered here were only
visible in the **database**, not on screen. The offline expense logger passed every browser
check while writing four rows for three expenses.
