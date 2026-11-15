-- Run this migration in the Supabase SQL Editor to enable private questions and admin replies.
create table if not exists public.gck_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text not null check (char_length(user_email) between 3 and 254),
  user_name text not null check (char_length(btrim(user_name)) between 2 and 100),
  category text not null check (
    category in ('Environment', 'Peace & governance', 'Social justice', 'Youth & democracy', 'Other')
  ),
  question text not null check (char_length(btrim(question)) between 5 and 500),
  admin_reply text check (
    admin_reply is null or char_length(btrim(admin_reply)) between 1 and 1000
  ),
  created_at timestamptz not null default now(),
  replied_at timestamptz,
  constraint gck_questions_reply_timestamp_match check (
    (admin_reply is null) = (replied_at is null)
  )
);

create index if not exists gck_questions_user_created_idx
  on public.gck_questions (user_id, created_at desc);

alter table public.gck_questions enable row level security;

revoke all on table public.gck_questions from public, anon, authenticated;
grant select, insert, update on table public.gck_questions to authenticated;

drop policy if exists "Askers and administrator can read questions" on public.gck_questions;
create policy "Askers and administrator can read questions"
  on public.gck_questions
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'nato.nato@aol.com'
  );

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
  );

drop policy if exists "Only the administrator can answer questions" on public.gck_questions;
create policy "Only the administrator can answer questions"
  on public.gck_questions
  for update
  to authenticated
  using (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'nato.nato@aol.com'
  )
  with check (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'nato.nato@aol.com'
  );
