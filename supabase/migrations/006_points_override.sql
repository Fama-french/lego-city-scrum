-- Two changes to estimation:
--
-- 1. The team estimate used PERCENTILE_CONT, which interpolates between the
--    two middle values for an even number of submissions (e.g. 3 and 5
--    becomes 4, or worse, 3.5 for an even split) - not a valid point on the
--    Fibonacci-ish scale. Switch to PERCENTILE_DISC, which never
--    interpolates: it always returns one of the actual submitted values
--    (the lower of the two middle ones when there's a tie), so the result
--    is always a real point value.
--
-- 2. Add a manual override: Ayush (Scrum Master), Gbenro (Product Owner),
--    and Leo can set a story's final point value directly, for cases where
--    the calculated median doesn't reflect what the team agrees on. When
--    set, the app uses this instead of the calculated median - the
--    underlying estimates are untouched, so the calculation is still
--    visible/transparent, this is just an explicit override layered on top.

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
    percentile_disc(0.5) within group (order by e.points)::numeric as median_points,
    count(*)::integer as submissions
  from estimates e
  group by e.story_id;
end;
$$;

alter table stories add column if not exists points_override integer;
alter table stories add constraint stories_points_override_positive check (points_override is null or points_override > 0);

create or replace function set_points_override(p_story_id uuid, p_points integer)
returns stories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_allowed boolean;
  v_story stories;
begin
  select id into v_caller_id from team_members where auth_user_id = auth.uid();
  if v_caller_id is null then
    raise exception 'You must select your name first.';
  end if;

  select exists(
    select 1 from team_members where id = v_caller_id and name in ('Ayush', 'Gbenro', 'Leo')
  ) into v_allowed;

  if not v_allowed then
    raise exception 'Only Ayush, Gbenro, or Leo can override a story''s points.';
  end if;

  if p_points is not null and p_points <= 0 then
    raise exception 'Points must be a positive number.';
  end if;

  update stories set points_override = p_points where id = p_story_id
  returning * into v_story;

  if v_story.id is null then
    raise exception 'Story not found.';
  end if;

  return v_story;
end;
$$;

grant execute on function set_points_override(uuid, integer) to authenticated;
