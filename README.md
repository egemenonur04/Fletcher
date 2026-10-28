# MyPortal

A personal hub, deployed on Vercel and backed by Supabase Postgres. Four sections, one login:

| Section | What it is |
|---|---|
| **Health** | Today's meals from the monthly diet plan, ticked off as you eat them, with a water log toward the day's goal — installable on the home screen as "Diet", and usable offline. Workouts imported from Strava or logged by hand (gym routines set by set), body weight, and a Progress page adding it all up. |
| **Finances** | Monthly budget, expenses, additional income and carryover, in TRY. Includes an installable mobile expense logger that works offline. |
| **Study** | AP unit tracker (Statistics, CS A, Biology, Chemistry, Calculus BC), a GPA calculator, College Board's SAT Question Bank solved in a Bluebook-style practice screen with SAT vocabulary, and UCAT lessons for all four subtests with worked examples and practice, official links and a practice-score log. |

## Running it

```bash
npm install
npx prisma generate     # `npm run build` does this for you
npm run dev
```

Needs a `.env` with at least:

```
DATABASE_URL=postgresql://…     # Supabase Postgres
AUTH_SECRET=…                   # signing key for the session cookie
AUTH_PASSWORD=…                 # the password you log in with
REPORT_TOKEN=…                  # optional: 32+ random chars; lets the nightly review read /api/study/review
WIDGET_TOKEN=…                  # optional: 32+ random chars; the phone widgets in scriptable/ (see its README)
```

Optional: `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` from your own Strava API app
(strava.com/settings/api, Authorization Callback Domain = the site's domain) to import activities.
`SITE_URL` (the site's address, e.g. `https://example.com` — on Vercel the production domain is
used when it is unset), `NEXT_PUBLIC_APP_TIMEZONE` (defaults to `Europe/Istanbul` — this is what "today" means for the
study sessions, and the server runs in a different zone).

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # date maths, XP + level curves, vocabulary, SAT bank, UCAT, health, finances
npm run build       # the real gate — catches what tsc alone misses
```

`npm run build` must pass **without a reachable database**. Nothing is prerendered that touches
Postgres, so a build failing on a database error means a page is missing `force-dynamic`.

## Schema changes

`prisma db push` cannot reach this project's Supabase instance, so schema changes are written as
idempotent SQL in [`prisma/manual-migrations/`](prisma/manual-migrations/) and pasted into the
Supabase SQL editor. **Additive migrations run before the deploy; removals run after it.** See
that directory's README for the run order and the reasoning.

**A new, empty database** (a copy of this site) skips all that: paste
[`prisma/fresh-install.sql`](prisma/fresh-install.sql) into the SQL editor once. It is the whole
schema, row level security on, and can be done entirely in the browser.

Every new table needs `ENABLE ROW LEVEL SECURITY` — Supabase exposes `public` over its REST API,
and a new table does not inherit RLS from its neighbours.

## Finding your way around

- [`CODEBASE.md`](CODEBASE.md) — architecture: the data model, the conventions, how a section hangs together.
- [`.claude/PROGRESS.md`](.claude/PROGRESS.md) — what is done, what is next, and anything waiting on a human.
