-- Extend the story-point scale with 21 (the biggest/most complex builds,
-- per the teaching team's guidance), continuing the Fibonacci-ish sequence.

alter table estimates drop constraint if exists estimates_points_check;
alter table estimates add constraint estimates_points_check check (points in (1, 2, 3, 5, 8, 13, 21));
