# LEGO City Scrum

A small, collaborative Scrum/Kanban board built for a live MBA classroom exercise: six students use it
simultaneously, on their own laptops, to turn a vague product vision into a prioritized backlog and then
build a LEGO city across three ~20-minute Scrum sprints.

## What is this?

The class ("Scrum and Agile Project Management — LEGO City") gives students this prompt:

> It should be a safe place, where families of diverse incomes can live. They should be able to get around
> easily and have access to standard public resources. In particular, citizens of all variety should have
> the opportunity to be educated, entertained, and enlightened.

Students turn that prompt into concrete user stories, prioritize and estimate them as a team, and then use
the resulting backlog to run three real Scrum sprints while physically building a LEGO city. This app is the
shared digital tool for that exercise: everyone sees the same backlog, the same Kanban board, and the same
workflow stage, updating live as people work.

It is intentionally minimal — six predefined participants, no passwords, no chat, no admin panel. See
"Do not overbuild" in the project brief this was built from: the goal is a tool that is instantly readable in
a 20-minute sprint, not a general-purpose project management product.

## Features

- **Join by name.** Six predefined participants (Gbenro, Ayush, Austin, Sije, Leo, Jessica), no passwords.
  Picking an already-active name is allowed (with a confirmation prompt) rather than hard-blocked — see
  "Identity claiming is soft" below.
- **User story creation** with the "As a / I want / so that" template and an auto-generated sentence. The
  list of stories written so far is shown right alongside the form, so people don't duplicate each other.
- **Shared, realtime product backlog.**
- **Self-paced ordering and estimating.** As soon as you've written at least one story, you can start
  dragging the backlog into your own priority order and picking story points — no need to wait for Leo or
  for everyone else to finish writing. A short help panel explains the point scale with LEGO comparisons
  (a house is 1 point, a school is 5, a hospital is 8, ...).
- **Private until validated.** Your order and estimates are yours alone until you click "Validate" — then
  everyone can see *that* you're done (a name + checkmark), never your actual choices. Once every
  participant has validated, Leo can reveal the aggregated team order and point totals.
- **A minimal 3-column Kanban board** (Backlog / In Progress / Done). More than one person can be assigned
  to the same story (pairing on a build). Anyone can assign or unassign themselves; **Leo, Gbenro, and
  Austin** can additionally assign or remove *anyone* on any story.
- **Three-sprint workflow** (Planning → Sprint → Demo → Retrospective/Grooming) driven by Leo, the
  facilitator.
- **Retrospective notes** and mid-exercise backlog grooming (add stories, edit category/status, and
  re-open ordering/estimating so newly added stories get a priority and points before the next sprint).
- **Leo-only classroom reset**, enforced in the database — not just hidden in the UI.
- **Realtime sync** via Supabase so nobody has to refresh.
- Black-and-white, Comic Sans, no-frills "classroom worksheet" visual design.

## Scrum Workflow

The app is one shared state machine. Writing stories, ordering the backlog, and estimating points all happen
in one open, self-paced phase — nobody needs to wait for Leo to "start" it. Leo's role kicks in once
everyone has validated their order and estimates, and again at the end of each sprint:

```
Join (pick your name)
 └─ Write, Order & Estimate   (open immediately; self-paced; validate when ready)
     │                        (Leo reveals the aggregated order + points once everyone has validated)
     └─ Final Product Backlog   (sorted, sortable, this is the team's source of truth)
         └─ Sprint 1: Planning → Sprint → Demo → Retrospective/Grooming
             └─ Sprint 2: Planning → Sprint → Demo → Retrospective/Grooming
                 └─ Sprint 3: Planning → Sprint → Demo → Retrospective/Grooming
                     └─ Complete (final backlog / final city)
```

From any Retrospective screen, Leo can click "Re-open Backlog Building" — useful if new stories were added
during grooming and need a priority/estimate before the next sprint. This briefly reopens the
write/order/estimate phase and returns to the Retrospective once revealed again.

## Team

| Name    | Role                     |
| ------- | ------------------------ |
| Gbenro  | Product Owner            |
| Ayush   | Scrum Master             |
| Austin  | Developer                |
| Sije    | Developer                |
| Leo     | Developer / Facilitator  |
| Jessica | Developer                |

Roles are fixed and seeded directly in the database — there is no role-management UI. **Leo** is the only
participant who can advance the workflow stage or reset the classroom.

## Architecture

```
Browser (each student's laptop)
        │
        ▼
   React + TypeScript (Vite)
        │  supabase-js: auth, queries, RPC calls, realtime subscriptions
        ▼
      Supabase
        ├── PostgreSQL          (team_members, session, stories, rankings, estimates, retro_notes)
        ├── Realtime            (postgres_changes on session/stories/retro_notes/team_members)
        ├── Row Level Security  (who can read/write which rows)
        └── SQL functions       (add_assignee, remove_assignee, get_team_priority, get_team_estimates, reset_classroom)
```

No custom backend server — the browser talks to Supabase directly using the public anon key. All
business rules that matter (identity, aggregation, atomic claiming, reset) live in Postgres, not just in the
React code, so a technically curious student poking at the browser console can't bypass them by skipping the
UI. See "Security model" below for the one deliberate exception.

**Tech stack:** React 19, TypeScript, Vite, Supabase (Postgres + Auth + Realtime), plain CSS. No Redux, no
Next.js, no GraphQL, no custom drag-and-drop library — drag-and-drop is native HTML5 `draggable`, with
up/down buttons as a keyboard-accessible alternative.

## Database Schema

All of this is created by [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).

| Table          | Purpose                                                                          |
| -------------- | --------------------------------------------------------------------------------- |
| `team_members` | The six fixed participants, plus `auth_user_id` binding a browser to a name.       |
| `session`      | One row: current workflow stage, current sprint (0–3), and two "revealed" flags.   |
| `stories`      | User stories: actor/want/benefit + generated sentence, categories (array), assignees (array), status. |
| `rankings`     | One row per (story, participant): that participant's private rank for that story.  |
| `estimates`    | One row per (story, participant): that participant's private point estimate.       |
| `retro_notes`  | Free-text retrospective notes, tagged by sprint and author.                         |

Two views (`v_ranking_progress`, `v_estimate_progress`) expose *only* whether each person has submitted —
never their actual values — so the UI can show "4 / 6 submitted" without leaking anyone's vote.

### Aggregation (calculated, never hand-entered)

Per the exercise design, team priority and team estimate are **always calculated from individual
submissions** — nobody types in "the" priority or "the" estimate.

- **Priority** = average of each story's rank across everyone who ranked it. Lower average = higher
  priority. Ties break on story creation time (earlier story wins), so ordering is always deterministic.
  Example: ranks `1, 2, 1, 3, 1, 2` → average `1.67`.
- **Estimate** = **median** of submitted story points, e.g. `3, 5, 5, 8, 5` → `5`. Median is used instead of
  a mean because story points are ordinal, and the median resists one outlier estimate skewing the result.

Both calculations exist in two places that are meant to agree:
- [`src/lib/aggregation.ts`](src/lib/aggregation.ts) — a small, dependency-free, unit-tested TypeScript
  version used for client-side display logic.
- `get_team_priority()` / `get_team_estimates()` SQL functions — the authoritative server-side calculation,
  which also enforces that results aren't returned until Leo has revealed them.

Run `npm test` to see the aggregation tests, including the worked examples above.

## Security Model

There are no passwords — a student "logs in" by picking their name from six buttons. To get *real*
server-side identity anyway (not just hiding buttons in the UI), the app uses **Supabase Anonymous Auth**:

1. On first load, the browser silently calls `supabase.auth.signInAnonymously()`, producing a stable,
   persistent `auth.uid()` for that browser (persisted in local storage by supabase-js, so refreshing or
   closing the tab doesn't lose it).
2. Picking a name runs a database update that binds that `auth.uid()` to one `team_members` row.
3. From then on, Postgres Row Level Security policies can check "is the caller really who they claim to
   be?" via `auth_user_id = auth.uid()`, not just trust a value the client sends.

This gives real, database-enforced guarantees for the things that matter most:

- **Only Leo can advance the workflow stage or reset the classroom** — enforced by an RLS policy on
  `session` and a check inside the `reset_classroom()` function, not just a hidden button.
- **A participant can only submit their own ranking/estimate** — nobody can vote as someone else, since
  writes are checked against whichever `team_members` row the caller's `auth.uid()` is currently bound to.
- **Assignment respects the admin tier** — `add_assignee()`/`remove_assignee()` check, server-side, that a
  caller assigning or removing someone *other than themselves* is bound to Leo, Gbenro, or Austin; everyone
  else can only add/remove themselves. A story can have multiple assignees (pairing on a build) — adding the
  first one flips an otherwise-backlog story to in_progress, and removing the last one flips it back.

**Identity claiming is soft, by design.** Unlike the guarantees above, claiming a name is *not* an exclusive
lock — clicking an already-claimed name re-binds it to your browser instead of being blocked, after a
confirmation prompt ("X is currently in use on another device — join here anyway?"). Whoever claimed a name
most recently is that person for write purposes; the previous browser will find itself back at the join
screen next time it syncs. This trades a small amount of collision-safety for the classroom reality that
someone's laptop dies, or they open a second tab on their phone, and none of that should require Leo to
reset the whole room. The "(in use)" label is a courtesy heads-up, not a security boundary.

**Accepted tradeoff:** stories themselves (their text, category, status) are updatable by any signed-in
participant, not locked down field-by-field. This is a small, trusted team collaboratively editing one
shared backlog for about an hour — over-restricting who can edit which field would fight the classroom
workflow (e.g., Leo re-categorizing a story someone else wrote, or a teammate fixing a typo). This is called
out explicitly, in a comment, at the relevant policy in the migration file — it is a deliberate design
choice, not an oversight, and it would need Supabase Auth with real per-user login (not just anonymous
sessions) to close entirely.

**Never in the frontend:** the Supabase *service role* key is never used or referenced in client code — only
the public URL and anon/publishable key, which are safe to expose (see Environment Variables below).

## Realtime & Privacy

The frontend subscribes to Postgres changes on `session`, `stories`, `retro_notes`, and `team_members`, so
stage changes, new/updated stories, retro notes, and name claims all appear on every screen without a
refresh.

`rankings` and `estimates` are deliberately **not** added to the realtime publication. Their RLS policies
only let a participant see their own row, so a `postgres_changes` subscription on them wouldn't tell anyone
about anyone else's vote anyway — it would only ever fire for your own submissions. Instead, the "N / 6
submitted" progress indicators poll the non-sensitive progress views every few seconds while you're on the
Prioritization or Estimation screen. This is a deliberate, small tradeoff to keep individual votes private
while still using Supabase Realtime everywhere it makes sense.

## Local Setup

### Prerequisites

- Node.js 20+ and npm
- A free [Supabase](https://supabase.com) project

### 1. Install dependencies

```bash
npm install
```

### 2. Create your Supabase project and database

See "Supabase Setup" below — do this once before running the app.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Both values are on your Supabase project's **Settings → API** page. Only the public URL and the
**anon/public** key belong here — never the `service_role` secret key.

### 4. Run it

```bash
npm run dev
```

Open the printed `http://localhost:5173` URL. Open it in multiple browser tabs (or have classmates open the
deployed URL) to see the collaborative behavior.

### 5. Run tests / type-check / build

```bash
npm test        # aggregation, permissions, and story-text unit tests
npx tsc -b      # type-check
npm run build   # production build
```

## Environment Variables

| Variable                 | Where to find it                              | Safe to expose in a browser? |
| ------------------------- | ---------------------------------------------- | ----------------------------- |
| `VITE_SUPABASE_URL`       | Supabase → Settings → API → Project URL         | Yes                            |
| `VITE_SUPABASE_ANON_KEY`  | Supabase → Settings → API → anon / public key   | Yes                            |

Do **not** put the `service_role` key anywhere in this project — it bypasses Row Level Security entirely and
must never reach the browser.

## Supabase Setup

1. **Create a project** at [supabase.com](https://supabase.com) (the free tier is plenty for a classroom).
2. **Run the migrations.** Open the SQL Editor in your Supabase dashboard and run, in order, every file in
   [`supabase/migrations/`](supabase/migrations/) (currently `001_initial_schema.sql` then
   `002_relax_identity_claiming.sql`). Together they create every table, seed the six team members and the
   initial session row, and set up Row Level Security, the realtime publication, and the SQL functions.
   They're written to be safe to re-run.
   - If you use the Supabase CLI instead: `supabase link` then `supabase db push` applies all of them.
3. **Enable Anonymous Sign-ins.** Go to **Authentication → Sign In / Providers → Anonymous Sign-Ins** and
   turn it on. This is required — the app cannot bind a browser to a name without it (see Security Model
   above). This is the one manual dashboard toggle the SQL migration can't set for you.
4. **Confirm Realtime is on** for the project (it is by default on new projects). The migration adds
   `session`, `stories`, `retro_notes`, and `team_members` to the `supabase_realtime` publication.
5. **Team members are already seeded** by the migration — you don't need to add them manually. If you ever
   need to re-seed after an accidental delete, re-run the `insert into team_members ...` block from the
   migration file (it's idempotent, using `on conflict do nothing`).

## Deployment

This is a static site — deploy the `dist/` folder (from `npm run build`) to any static host, for example
[Vercel](https://vercel.com), [Netlify](https://netlify.com), Cloudflare Pages, or GitHub Pages.

For Vercel/Netlify: import the GitHub repo, set the build command to `npm run build`, the output directory
to `dist`, and add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as project environment variables (same
values as your `.env.local`). No server-side runtime is needed — Supabase is the entire backend.

## Roles

Roles are fixed, seeded directly into `team_members`, and never assigned through the UI. Everyone — regardless
of role — writes stories, orders/estimates the backlog, and assigns/unassigns *themselves* on the Kanban
board. Two extra permission layers sit on top of that baseline:

- **Facilitator** (Leo only) — the only participant who sees the Facilitator panel, can advance the workflow
  stage, reveal the team order/points, and reset the classroom.
- **Kanban admins** (Leo, Gbenro, Austin) — can additionally assign or remove *anyone* on any story, not just
  themselves (e.g. Gbenro, as Product Owner, moving a story to a specific developer; Austin helping
  rebalance the board mid-sprint). Ayush, Sije, and Jessica can only manage their own assignment.

This mapping (which three names get admin rights) is hardcoded in `KANBAN_ADMIN_NAMES` in
[`src/lib/permissions.ts`](src/lib/permissions.ts) and mirrored in the `add_assignee`/`remove_assignee` SQL
functions — change both together if your class wants a different set of people to have it.

## How to Reset the Classroom

Only Leo sees the **RESET CLASSROOM** button (in the Facilitator panel). It requires a confirmation step
explaining exactly what will happen before anything is deleted:

> Reset the classroom? This will delete all stories, rankings, estimates, assignments, sprint progress and
> retrospective notes. The six team members will remain.

Resetting:
- Deletes all stories, rankings, estimates, and retrospective notes.
- Un-claims every name (so a new class section can join fresh).
- Resets the session back to `join`, sprint `0`, with nothing revealed.
- **Keeps** the six `team_members` rows and their roles.

This is enforced by the `reset_classroom()` Postgres function, which checks the caller is bound to "Leo"
before doing anything — see Security Model.

## Troubleshooting

- **"Could not start an anonymous session."** — Anonymous Sign-ins are disabled on your Supabase project.
  Go to Authentication → Sign In / Providers and enable Anonymous Sign-Ins (step 3 above).
- **Names never show as "in use" / everyone can grab the same name.** — Same cause as above; without
  anonymous auth working, identity binding can't happen. Check the browser console for auth errors.
- **A student is locked out of their name after refreshing on a different device/browser.** — Anonymous
  auth sessions are per-browser. If someone genuinely needs to move devices mid-class, the only clean fix is
  Leo resetting the classroom (this also clears all name claims). For a single mid-class hiccup, having them
  use "Switch user" on the *original* browser and letting a teammate temporarily relay updates is usually
  faster than a full reset.
- **Nothing updates in real time.** Confirm Realtime is enabled for your Supabase project and that the
  migration's `alter publication supabase_realtime add table ...` statements ran without error. Also check
  you're not hitting a browser extension or corporate proxy that blocks WebSockets.
- **"Something went wrong saving your story" / similar generic errors.** These are intentionally
  user-friendly wrappers — open the browser devtools console for the underlying Supabase error, which is
  logged there for debugging without being shown to the whole class.
- **Blank white screen on load.** Almost always missing/incorrect `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` in `.env.local`. Check the browser console.
- **"Reveal Team Priority" / "Reveal Estimates" button stays disabled.** It only enables once all six
  participants have submitted — check the progress list right above the button to see who's missing.

## Project Structure

```
src/
  components/     Small, reusable, typed UI pieces (StoryForm, KanbanBoard, RankingBoard, PointsHelp, ...)
  pages/          One component per workflow stage (JoinPage, StoriesPage, SprintPage, ...) — StoriesPage
                  covers the merged write/order/estimate/validate phase
  hooks/          Data + realtime wiring to Supabase (useSession, useStories, useRankings, useOrderState, ...)
  lib/            Pure logic: aggregation.ts, storyText.ts, permissions.ts, supabase.ts client
  types/          TypeScript types mirroring the database schema
  styles/         global.css (the entire visual design)
supabase/
  migrations/     001_initial_schema.sql (full schema, seed data, RLS, SQL functions), plus later migrations
```

## Manual Test Checklist

Since this app has no automated end-to-end test suite (matching the "don't overbuild" spirit of the
project), verify the full flow manually before class:

1. Join as Austin, add three stories. Confirm ordering/estimating stay locked until the first story is
   added, then unlock.
2. Switch user, join as Jessica, add three stories, confirm Austin's stories are visible above the form.
3. As Jessica, drag stories into an order and pick a point value for each; confirm Austin can't see
   Jessica's choices (query the `rankings`/`estimates` tables directly, or just note the UI never shows them).
4. Click "Validate" as Jessica with an estimate missing; confirm it's rejected with a clear message, then
   fill in the last estimate and validate successfully — confirm Jessica now shows a checkmark in the
   shared progress list visible to everyone.
5. Have all six participants write at least one story and validate; confirm Leo's "Reveal Order & Points"
   button only enables once all six show complete.
6. Reveal as Leo; confirm the aggregated order (lower average rank first) and median points look right, then
   confirm the app moves to the Final Product Backlog.
7. Try joining as a name that's already active from another browser/tab; confirm you get a confirmation
   prompt (not a silent takeover), and that the original browser is bumped back to the join screen.
8. Start Sprint 1 → Sprint Planning; have two participants assign themselves to the same story and confirm
   both show up as assignees. Have Jessica (not an admin) try to assign Sije to a story and confirm it's
   blocked; have Gbenro or Austin do the same and confirm it succeeds. Confirm Jessica can still remove
   herself, and only an admin can remove Sije.
9. Move a story to Done; start Demo, then Retrospective.
10. Add a note and a new story during Retrospective; confirm both appear for everyone, then use "Re-open
    Backlog Building" and confirm the new story can be ordered/estimated without disturbing the others'
    already-validated status until they include it too.
11. Start Sprint 2, then Sprint 3, then Finish Exercise.
12. As Leo, reset the classroom; confirm everything clears and all six names become available again.
13. Confirm a non-Leo participant never sees the Facilitator panel or reset button, and that calling the
    `reset_classroom` / `session` update from the browser console as a non-Leo user fails.
