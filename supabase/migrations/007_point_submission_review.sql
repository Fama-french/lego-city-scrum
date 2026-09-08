-- Add a way for Ayush (Scrum Master), Gbenro (Product Owner), and Leo to see
-- every individual point submission for a story (not just the aggregate
-- median from get_team_estimates()), so they can arbitrate when the
-- automatic result doesn't seem right - paired with the points-override
-- control they already have.

create or replace function get_point_submissions()
returns table (story_id uuid, participant_id uuid, participant_name text, points integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_allowed boolean;
begin
  select id into v_caller_id from team_members where auth_user_id = auth.uid();
  if v_caller_id is null then
    raise exception 'You must select your name first.';
  end if;

  select exists(
    select 1 from team_members where id = v_caller_id and name in ('Ayush', 'Gbenro', 'Leo')
  ) into v_allowed;

  if not v_allowed then
    raise exception 'Only Ayush, Gbenro, or Leo can view individual point submissions.';
  end if;

  return query
  select e.story_id, e.participant_id, tm.name, e.points
  from estimates e
  join team_members tm on tm.id = e.participant_id;
end;
$$;

grant execute on function get_point_submissions() to authenticated;
