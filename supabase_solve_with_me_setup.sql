-- Supabase storage for the interactive "Solve With Me" whiteboard.
-- JSON payloads stay structurally equivalent to the source files; metadata
-- and source-file SHA-256 hashes are stored beside them for deterministic verification.

alter table public.educational_data
  add column if not exists content_sha256 text,
  add column if not exists content_metadata jsonb not null default '{}'::jsonb;

alter table public.educational_data enable row level security;

drop policy if exists "Allow public read " on public.educational_data;
drop policy if exists "Allow public read educational_data" on public.educational_data;
create policy "Public can read educational content"
on public.educational_data
for select
to anon, authenticated
using (true);

create unique index if not exists educational_data_solve_with_me_file_uidx
on public.educational_data (subject_id, section_id, file_name)
where section_id = 'solve_with_me';

create index if not exists educational_data_solve_with_me_lookup_idx
on public.educational_data (
  subject_id,
  section_id,
  ((content_metadata ->> 'chapter_number')::integer),
  ((content_metadata ->> 'lesson_number')::integer)
)
where section_id = 'solve_with_me';

