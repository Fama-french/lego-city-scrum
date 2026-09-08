-- Relax name-claiming from a hard, exclusive lock to a soft "in use" indicator.
--
-- Originally, once a browser claimed a name, no other browser could claim it
-- until a reset. In practice, classrooms need people to switch devices mid-
-- exercise (a laptop dies, someone opens it on their phone, etc.), so this
-- now allows re-claiming an already-claimed name from a different browser.
-- The UI still shows "(in use)" and asks for confirmation before taking over
-- an active session — this is a courtesy prompt, not a security boundary.
--
-- Note: whichever browser claims a name last "is" that person for write
-- purposes (submitting rankings/estimates, and — for Leo — facilitator
-- actions). This is intentional: a name represents one person, who may
-- reasonably use more than one device over the course of the exercise.
drop policy if exists "team_members_claim_self" on team_members;
create policy "team_members_claim_self" on team_members
  for update
  using (true)
  with check (auth_user_id = auth.uid());
