-- Supabase's hosted Postgres enforces "DELETE/UPDATE requires a WHERE
-- clause" even inside SECURITY DEFINER functions, not just through the
-- PostgREST API as originally assumed. reset_classroom() had unqualified
-- DELETE/UPDATE statements (intentionally, since a full reset means "clear
-- everything"), which made every reset attempt fail with:
--   ERROR: DELETE requires a WHERE clause (SQLSTATE 21000)
-- Fix: add a tautological `WHERE true` to each one - still clears every row,
-- satisfies the guard.

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

  delete from retro_notes where true;
  delete from estimates where true;
  delete from rankings where true;
  delete from stories where true;
  update team_members set auth_user_id = null where true;
  update session set
    current_stage = 'join',
    current_sprint = 0,
    priority_revealed = false,
    estimates_revealed = false
  where true;
end;
$$;
