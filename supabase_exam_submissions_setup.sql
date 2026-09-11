create table if not exists public.curriculum_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id text not null,
  subject_id text not null,
  chapter_number integer not null,
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.curriculum_exam_submissions enable row level security;

drop policy if exists "Students can submit chapter exam answers" on public.curriculum_exam_submissions;
create policy "Students can submit chapter exam answers"
on public.curriculum_exam_submissions
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated users can read chapter exam submissions" on public.curriculum_exam_submissions;
create policy "Authenticated users can read chapter exam submissions"
on public.curriculum_exam_submissions
for select
to authenticated
using (true);

create index if not exists curriculum_exam_submissions_exam_idx
on public.curriculum_exam_submissions (exam_id, subject_id, chapter_number);

create index if not exists curriculum_exam_submissions_submitted_at_idx
on public.curriculum_exam_submissions (submitted_at desc);
