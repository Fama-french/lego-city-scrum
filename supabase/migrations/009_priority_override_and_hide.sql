-- Two additions, mirroring the existing points-override pattern:
--
-- 1. Priority override: Ayush (Scrum Master), Gbenro (Product Owner), and
--    Leo can set a story's priority directly, same trio as points override.
--    Shown in the top-right corner of each story card.
--
-- 2. Deprioritize/hide: the same trio can tuck a story out of the main
--    backlog view without deleting it - reversible, not destructive.

alter table stories add column if not exists priority_override integer;
alter table stories add constraint stories_priority_override_positive check (priority_override is null or priority_override > 0);

alter table stories add column if not exists deprioritized boolean not null default false;

create or replace function set_priority_override(p_story_id uuid, p_priority integer)
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
    raise exception 'Only Ayush, Gbenro, or Leo can override a story''s priority.';
  end if;

  if p_priority is not null and p_priority <= 0 then
    raise exception 'Priority must be a positive number.';
  end if;

  update stories set priority_override = p_priority where id = p_story_id
  returning * into v_story;

  if v_story.id is null then
    raise exception 'Story not found.';
  end if;

  return v_story;
end;
$$;

grant execute on function set_priority_override(uuid, integer) to authenticated;

create or replace function set_story_deprioritized(p_story_id uuid, p_deprioritized boolean)
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
    raise exception 'Only Ayush, Gbenro, or Leo can hide/deprioritize a story.';
  end if;

  update stories set deprioritized = p_deprioritized where id = p_story_id
  returning * into v_story;

  if v_story.id is null then
    raise exception 'Story not found.';
  end if;

  return v_story;
end;
$$;

grant execute on function set_story_deprioritized(uuid, boolean) to authenticated;
