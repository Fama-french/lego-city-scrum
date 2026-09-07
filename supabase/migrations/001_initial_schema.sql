-- LEGO City Scrum — initial schema
--
-- Run this once in the Supabase SQL editor (or via `supabase db push`) on a
-- fresh project. It creates every table, seeds the six team members and the
-- single classroom session row, and configures Row Level Security.
--
-- SECURITY MODEL (read this before changing policies)
-- ----------------------------------------------------
-- There is no email/password login — a student "logs in" by picking their
-- name. To still get *real* server-side identity (not just UI hiding) we use
-- Supabase Anonymous Auth: the browser silently calls
-- `supabase.auth.signInAnonymously()` once, producing a stable `auth.uid()`
-- for that browser. Picking a name calls a claim function that binds that
-- browser's auth.uid() to one `team_members` row. From then on, RLS policies
-- can check "is the caller the person they claim to be" via
-- `auth_user_id = auth.uid()`.
--
-- This gives us real guarantees for the things that matter most in the
-- exercise:
--   * Only Leo can advance the workflow stage or reset the classroom.
--   * A participant can only write their own ranking/estimate (no one can
--     submit a fake vote as someone else).
--   * A name can only be claimed by one browser at a time.
--
-- What it does NOT give us: strong protection against a technically savvy
-- student opening devtools and calling the Supabase client directly to, say,
-- edit another team's story text. That risk is accepted deliberately — this
-- is a trusted, supervised, single-classroom-hour exercise, not a
-- multi-tenant production app. Where the tradeoff was made, it's called out
-- in a comment below.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  role text not null,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists session (
  id uuid primary key default gen_random_uuid(),
  current_stage text not null default 'join' check (
    current_stage in (
      'join', 'stories', 'prioritization', 'estimation', 'backlog',
      'sprint_planning', 'sprint', 'demo', 'retrospective', 'complete'
    )
  ),
  current_sprint integer not null default 0 check (current_sprint between 0 and 3),
  priority_revealed boolean not null default false,
  estimates_revealed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  want text not null,
  benefit text not null,
  full_story text not null,
  category text not null check (
    category in (
      'Safety', 'Housing', 'Transportation', 'Education', 'Entertainment',
      'Public Services', 'Community', 'Environment', 'Other'
    )
  ),
  created_by uuid not null references team_members (id),
  assigned_to uuid references team_members (id),
  status text not null default 'backlog' check (status in ('backlog', 'in_progress', 'done')),
  sprint integer check (sprint between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_status_idx on stories (status);
create index if not exists stories_created_by_idx on stories (created_by);

create table if not exists rankings (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories (id) on delete cascade,
  participant_id uuid not null references team_members (id),
  rank integer not null check (rank > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, participant_id)
);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories (id) on delete cascade,
  participant_id uuid not null references team_members (id),
  points integer not null check (points in (1, 2, 3, 5, 8, 13)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, participant_id)
);

create table if not exists retro_notes (
  id uuid primary key default gen_random_uuid(),
  sprint integer not null check (sprint between 1 and 3),
  author_id uuid not null references team_members (id),
  note text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at helper trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger session_set_updated_at before update on session
  for each row execute function set_updated_at();
create trigger stories_set_updated_at before update on stories
  for each row execute function set_updated_at();
create trigger rankings_set_updated_at before update on rankings
  for each row execute function set_updated_at();
create trigger estimates_set_updated_at before update on estimates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed data (safe to re-run)
-- ---------------------------------------------------------------------------
insert into team_members (name, role) values
  ('Gbenro', 'Product Owner'),
  ('Ayush', 'Scrum Master'),
  ('Austin', 'Developer'),
  ('Sije', 'Developer'),
  ('Leo', 'Developer / Facilitator'),
  ('Jessica', 'Developer')
on conflict (name) do nothing;

insert into session (current_stage, current_sprint)
select 'join', 0
where not exists (select 1 from session);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table team_members enable row level security;
alter table session enable row level security;
alter table stories enable row level security;
alter table rankings enable row level security;
alter table estimates enable row level security;
alter table retro_notes enable row level security;

-- team_members: everyone can read the roster (needed for the join screen,
-- before anyone has claimed an identity).
create policy "team_members_select_all" on team_members
  for select using (true);

-- team_members: a browser may claim an unclaimed row as itself, or re-claim
-- a row it already owns. It can never take over someone else's claim.
-- NOTE (accepted tradeoff): this policy only constrains the auth_user_id
-- column via WITH CHECK, but Postgres RLS is row-level, not column-level, so
-- a claimed browser could technically also rewrite `name`/`role` on its own
-- row in the same statement. The app only ever sends `{ auth_user_id }`
-- updates, so this does not happen in practice; tightening it further would
-- require a trigger, which we skip in the name of keeping the schema simple.
create policy "team_members_claim_self" on team_members
  for update
  using (auth_user_id is null or auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- session: everyone can read the current stage/sprint.
create policy "session_select_all" on session
  for select using (true);

-- session: only the row bound to "Leo" may advance the workflow or reset it.
create policy "session_update_leo_only" on session
  for update
  using (exists (select 1 from team_members where auth_user_id = auth.uid() and name = 'Leo'))
  with check (exists (select 1 from team_members where auth_user_id = auth.uid() and name = 'Leo'));

-- stories: shared, readable backlog.
create policy "stories_select_all" on stories
  for select using (true);

-- stories: any claimed participant can add a story, attributed to themselves.
create policy "stories_insert_own" on stories
  for insert
  with check (
    created_by in (select id from team_members where auth_user_id = auth.uid())
  );

-- stories: any claimed participant can update shared backlog fields
-- (grooming, dragging cards on the Kanban board, marking work done).
-- NOTE (accepted tradeoff): this is intentionally permissive — the exercise
-- is a small trusted team collaboratively editing one shared backlog, and
-- over-restricting who can edit which field would fight the classroom
-- workflow (e.g. Leo re-categorizing a story someone else wrote). The one
-- place we *do* enforce a real invariant — no two people claiming the same
-- story — is handled atomically by claim_story() below, not by this policy.
create policy "stories_update_authenticated" on stories
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- rankings: a participant may only ever see their own ranking values, so
-- that priorities stay private until Leo reveals the aggregate.
create policy "rankings_select_own" on rankings
  for select using (participant_id in (select id from team_members where auth_user_id = auth.uid()));

create policy "rankings_upsert_own" on rankings
  for insert
  with check (participant_id in (select id from team_members where auth_user_id = auth.uid()));

create policy "rankings_update_own" on rankings
  for update
  using (participant_id in (select id from team_members where auth_user_id = auth.uid()))
  with check (participant_id in (select id from team_members where auth_user_id = auth.uid()));

-- estimates: same privacy rule as rankings.
create policy "estimates_select_own" on estimates
  for select using (participant_id in (select id from team_members where auth_user_id = auth.uid()));

create policy "estimates_upsert_own" on estimates
  for insert
  with check (participant_id in (select id from team_members where auth_user_id = auth.uid()));

create policy "estimates_update_own" on estimates
  for update
  using (participant_id in (select id from team_members where auth_user_id = auth.uid()))
  with check (participant_id in (select id from team_members where auth_user_id = auth.uid()));

-- retro_notes: open discussion, readable by everyone, written as yourself.
create policy "retro_notes_select_all" on retro_notes
  for select using (true);

create policy "retro_notes_insert_own" on retro_notes
  for insert
  with check (author_id in (select id from team_members where auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Non-sensitive progress views (expose "who has submitted", never the values)
-- ---------------------------------------------------------------------------

-- security_invoker = false (the default for views owned by a superuser-ish
-- role in Supabase, i.e. `postgres`) means these views run with the view
-- owner's privileges and therefore bypass the owning tables' RLS — that is
-- exactly what lets us safely expose an aggregate ("has this person
-- submitted?") without exposing the private ranking/estimate values
-- themselves, which stay locked down by the policies above.
create or replace view v_ranking_progress as
select
  tm.id as participant_id,
  tm.name,
  (count(r.id) = (select count(*) from stories)) and (select count(*) from stories) > 0 as complete
from team_members tm
left join rankings r on r.participant_id = tm.id
group by tm.id, tm.name;

create or replace view v_estimate_progress as
select
  tm.id as participant_id,
  tm.name,
  (count(e.id) = (select count(*) from stories)) and (select count(*) from stories) > 0 as complete
from team_members tm
left join estimates e on e.participant_id = tm.id
group by tm.id, tm.name;

grant select on v_ranking_progress to anon, authenticated;
grant select on v_estimate_progress to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

-- Atomically assign a story to the calling participant. A single UPDATE with
-- a WHERE guard is already race-free in Postgres (row lock ensures only one
-- concurrent request wins); wrapping it in a SECURITY DEFINER function lets
-- us also resolve "who is calling" server-side instead of trusting a
-- participant_id argument from the client.
create or replace function claim_story(p_story_id uuid)
returns stories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id uuid;
  v_sprint integer;
  v_story stories;
begin
  select id into v_participant_id from team_members where auth_user_id = auth.uid();
  if v_participant_id is null then
    raise exception 'You must select your name before claiming a story.';
  end if;

  select current_sprint into v_sprint from session limit 1;

  update stories
  set assigned_to = v_participant_id,
      status = 'in_progress',
      sprint = coalesce(nullif(v_sprint, 0), sprint)
  where id = p_story_id and assigned_to is null
  returning * into v_story;

  if v_story.id is null then
    raise exception 'Someone else just claimed this story.';
  end if;

  return v_story;
end;
$$;

grant execute on function claim_story(uuid) to authenticated;

-- Team priority, computed from *all* rankings (bypassing the own-row-only
-- RLS via SECURITY DEFINER) but only once Leo has revealed it, and only
-- returning the aggregate — never the individual submissions.
create or replace function get_team_priority()
returns table (story_id uuid, average_rank numeric, submissions integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select priority_revealed from session limit 1) then
    raise exception 'Priority has not been revealed yet.';
  end if;

  return query
  select r.story_id, avg(r.rank)::numeric as average_rank, count(*)::integer as submissions
  from rankings r
  group by r.story_id;
end;
$$;

grant execute on function get_team_priority() to authenticated;

-- Team estimate, computed as the median of submitted points, gated the same
-- way as get_team_priority().
create or replace function get_team_estimates()
returns table (story_id uuid, median_points numeric, submissions integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select estimates_revealed from session limit 1) then
    raise exception 'Estimates have not been revealed yet.';
  end if;

  return query
  select
    e.story_id,
    percentile_cont(0.5) within group (order by e.points)::numeric as median_points,
    count(*)::integer as submissions
  from estimates e
  group by e.story_id;
end;
$$;

grant execute on function get_team_estimates() to authenticated;

-- Full classroom reset. Only callable by the participant bound to "Leo".
-- Clears every table of classroom-generated data, unlocks all name claims
-- (so a fresh class can join from scratch), and resets the session row.
-- Team members themselves are kept, per spec.
create or replace function reset_classroom()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from team_members where auth_user_id = auth.uid() and name = 'Leo') then
    raise exception 'Only Leo can reset the classroom.';
  end if;

  delete from retro_notes;
  delete from estimates;
  delete from rankings;
  delete from stories;
  update team_members set auth_user_id = null;
  update session set
    current_stage = 'join',
    current_sprint = 0,
    priority_revealed = false,
    estimates_revealed = false;
end;
$$;

grant execute on function reset_classroom() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
-- Add the tables clients subscribe to directly. (rankings/estimates are
-- deliberately left off — see the README "Realtime & privacy" note: their
-- RLS is own-row-only, so postgres_changes on them wouldn't tell anyone
-- about anyone else's submission anyway; progress is polled instead.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'session'
  ) then
    alter publication supabase_realtime add table session;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'stories'
  ) then
    alter publication supabase_realtime add table stories;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'retro_notes'
  ) then
    alter publication supabase_realtime add table retro_notes;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table team_members;
  end if;
end $$;
