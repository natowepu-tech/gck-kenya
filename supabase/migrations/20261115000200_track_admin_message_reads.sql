-- Apply after 20261115000100_create_gck_questions.sql to track unread admin messages.
alter table public.gck_questions
  add column if not exists admin_read_at timestamptz;

drop policy if exists "Authenticated users can submit their own questions" on public.gck_questions;
create policy "Authenticated users can submit their own questions"
  on public.gck_questions
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and lower(user_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and admin_reply is null
    and replied_at is null
    and admin_read_at is null
  );
