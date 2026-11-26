-- Study Aggregate: lets Claude search a member's OWN answered notes, and keeps that member's past questions.
-- Every function runs as the signed-in member (security invoker), so row-level security limits it to their notes.

-- What the member has written so far (answered reflections only).
create or replace function public.my_notes_overview()
returns table (answered integer, days integer, first_day integer, last_day integer, books text)
language sql stable security invoker set search_path = '' as $$
  select count(*)::int,
         count(distinct e.day)::int,
         min(e.day)::int,
         max(e.day)::int,
         coalesce(string_agg(distinct coalesce(p.book, split_part(p.reading, ' ', 1)), ', '), '')
  from public.note_items i
  join public.note_entries e on e.id = i.entry_id
  join public.plan_days p on p.day = e.day
  where i.user_id = auth.uid() and btrim(i.answer) <> '';
$$;

-- Searches the member's answered notes. Any word may match; best matches first.
-- With no words, returns the most recent answers. Optional book name and day range narrow it.
create or replace function public.search_my_notes(
  p_query text default null, p_book text default null,
  p_from integer default null, p_to integer default null, p_limit integer default 12)
returns table (day integer, reading text, kind text, question text, answer text, rank real)
language plpgsql stable security invoker set search_path = '' as $$
declare
  q tsquery := null;
  w text;
begin
  foreach w in array regexp_split_to_array(lower(regexp_replace(coalesce(p_query, ''), '[^[:alnum:] ]', ' ', 'g')), '\s+') loop
    if length(w) > 2 and plainto_tsquery('english', w)::text <> '' then
      q := case when q is null then plainto_tsquery('english', w) else q || plainto_tsquery('english', w) end;
    end if;
  end loop;
  return query
    select e.day::int, p.reading, i.kind,
           concat_ws(' ', i.question, i.question_2), i.answer,
           case when q is null then 0::real
                else ts_rank(to_tsvector('english', concat_ws(' ', i.question, i.question_2, i.answer)), q) end
    from public.note_items i
    join public.note_entries e on e.id = i.entry_id
    join public.plan_days p on p.day = e.day
    where i.user_id = auth.uid()
      and btrim(i.answer) <> ''
      and (q is null or to_tsvector('english', concat_ws(' ', i.question, i.question_2, i.answer)) @@ q)
      and (p_book is null or p.book ilike '%' || p_book || '%' or p.reading ilike '%' || p_book || '%')
      and (p_from is null or e.day >= p_from)
      and (p_to is null or e.day <= p_to)
    order by 6 desc, i.updated_at desc
    limit least(greatest(coalesce(p_limit, 12), 1), 25);
end $$;

-- The member's past Study Aggregate questions and answers (private).
create table if not exists public.aggregate_asks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  question   text not null check (length(question) between 1 and 500),
  answer     text not null,
  cited_days integer[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists aggregate_asks_user on public.aggregate_asks (user_id, created_at desc);
alter table public.aggregate_asks enable row level security;
drop policy if exists "own asks" on public.aggregate_asks;
create policy "own asks" on public.aggregate_asks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on public.aggregate_asks to authenticated;
revoke all on public.aggregate_asks from anon;
grant execute on function public.my_notes_overview() to authenticated;
grant execute on function public.search_my_notes(text, text, integer, integer, integer) to authenticated;
revoke execute on function public.my_notes_overview() from anon, public;
revoke execute on function public.search_my_notes(text, text, integer, integer, integer) from anon, public;
