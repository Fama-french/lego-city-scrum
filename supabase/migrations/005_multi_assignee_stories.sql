-- Allow a story to have more than one assignee during a sprint (pairing /
-- mobbing on a build), and introduce a small "Kanban admin" tier (Leo,
-- Gbenro, Austin) who can assign or remove *anyone* from a story, not just
-- themselves. Everyone else can still only assign/remove themselves.

alter table stories add column if not exists assignees uuid[] not null default '{}';
update stories set assignees = array[assigned_to] where assignees = '{}' and assigned_to is not null;
alter table stories drop column if exists assigned_to;

-- Add a story assignment for p_participant_id. Self-assignment is always
-- allowed; assigning someone else requires the caller to be a Kanban admin.
-- Adding the first assignee moves an otherwise-backlog story to in_progress.
create or replace function add_assignee(p_story_id uuid, p_participant_id uuid)
returns stories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_is_admin boolean;
  v_story stories;
begin
  select id into v_caller_id from team_members where auth_user_id = auth.uid();
  if v_caller_id is null then
    raise exception 'You must select your name before assigning a story.';
  end if;

  select exists(
    select 1 from team_members where id = v_caller_id and name in ('Leo', 'Gbenro', 'Austin')
  ) into v_is_admin;

  if not v_is_admin and p_participant_id <> v_caller_id then
    raise exception 'Only Leo, Gbenro, or Austin can assign someone else to a story.';
  end if;

  update stories
  set assignees = case when p_participant_id = any(assignees) then assignees else assignees || p_participant_id end,
      status = case when status = 'backlog' then 'in_progress' else status end
  where id = p_story_id
  returning * into v_story;

  if v_story.id is null then
    raise exception 'Story not found.';
  end if;

  return v_story;
end;
$$;

grant execute on function add_assignee(uuid, uuid) to authenticated;

-- Remove p_participant_id from a story's assignees. Removing yourself is
-- always allowed; removing someone else requires the caller to be a Kanban
-- admin. If this empties the assignee list, an in_progress story moves back
-- to backlog.
create or replace function remove_assignee(p_story_id uuid, p_participant_id uuid)
returns stories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_is_admin boolean;
  v_story stories;
  v_next_assignees uuid[];
begin
  select id into v_caller_id from team_members where auth_user_id = auth.uid();
  if v_caller_id is null then
    raise exception 'You must select your name first.';
  end if;

  select exists(
    select 1 from team_members where id = v_caller_id and name in ('Leo', 'Gbenro', 'Austin')
  ) into v_is_admin;

  if not v_is_admin and p_participant_id <> v_caller_id then
    raise exception 'Only Leo, Gbenro, or Austin can remove someone else from a story.';
  end if;

  select array_remove(assignees, p_participant_id) into v_next_assignees from stories where id = p_story_id;

  update stories
  set assignees = v_next_assignees,
      status = case when coalesce(array_length(v_next_assignees, 1), 0) = 0 and status = 'in_progress' then 'backlog' else status end
  where id = p_story_id
  returning * into v_story;

  if v_story.id is null then
    raise exception 'Story not found.';
  end if;

  return v_story;
end;
$$;

grant execute on function remove_assignee(uuid, uuid) to authenticated;

drop function if exists claim_story(uuid);
