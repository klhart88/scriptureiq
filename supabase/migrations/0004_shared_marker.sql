-- Remembers on a private note answer that a copy was shared, so My Study Notes can show "Shared".
-- Stored on the note only (visible to its owner); group posts still keep no link back to notes.
alter table public.note_items
  add column if not exists last_shared_at timestamptz,
  add column if not exists last_shared_group text;
