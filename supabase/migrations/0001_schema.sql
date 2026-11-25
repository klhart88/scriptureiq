-- ScriptureIQ schema: plan content, private study records, and Talk It Over groups.
-- Privacy model: every private row carries user_id and is readable/writable only by that user (RLS).
-- Talk It Over rows are visible only to members of the group. Nothing links a post back to a private note.

-- ---------------------------------------------------------------------------
-- Plan content (shared, read-only to members)
-- ---------------------------------------------------------------------------
create table public.plan_days (
  day                smallint primary key check (day between 1 and 358),
  reading            text not null,
  reading_code       text not null,          -- USFM, e.g. GEN.1-3, PSA.119.1-32, 2JN.1+3JN.1
  psalm              text not null,
  psalm_code         text not null,
  section            text,
  book               text,
  video_title        text,
  video_url          text,
  guide_title        text,
  guide_url          text,
  article_title      text,
  article_url        text,
  main_theme         text,
  primary_threads    text,
  supporting_threads text,
  pre_where          text not null,          -- pre-read: where we are
  pre_watch          text not null,          -- pre-read: watch for
  q1                 text not null,
  q2_connect         text not null,          -- Q2 line 1
  q2_reveal          text,                   -- Q2 line 2
  q3                 text not null,
  practice           text,
  identity           text,
  q2_link            text
);
alter table public.plan_days enable row level security;
create policy "members read plan" on public.plan_days for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  start_date   date,                          -- plan Day 1; set by the member
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Module 1: Today — reading progress (private)
-- ---------------------------------------------------------------------------
create table public.day_progress (
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day          smallint not null references public.plan_days (day),
  segments     jsonb not null default '{}'::jsonb,  -- { "<segment index>": { "done": n, "total": n } }
  position     jsonb,                               -- { "segment": i, "block": j } to resume
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.day_progress enable row level security;
create policy "own progress" on public.day_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Module 2: My Study Notes (private)
-- ---------------------------------------------------------------------------
create table public.note_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day        smallint not null references public.plan_days (day),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);
alter table public.note_entries enable row level security;
create policy "own entries" on public.note_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.note_items (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.note_entries (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind       text not null check (kind in ('generated', 'own')),
  source_key text check (source_key in ('q1', 'q2', 'q3')),  -- for generated questions
  question   text not null,                                   -- snapshot of the question as shown
  question_2 text,                                            -- Q2's second line
  answer     text not null default '',
  position   integer not null default 0,
  updated_at timestamptz not null default now()
);
create index note_items_entry on public.note_items (entry_id, position);
alter table public.note_items enable row level security;
create policy "own items" on public.note_items for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
    and exists (select 1 from public.note_entries e where e.id = entry_id and e.user_id = auth.uid()));

-- Creates the day's entry with Q1–Q3 loaded, or returns the existing one.
create function public.open_note_entry(p_day integer) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; d public.plan_days;
begin
  select id into v_id from public.note_entries where user_id = auth.uid() and day = p_day;
  if v_id is not null then return v_id; end if;
  select * into d from public.plan_days where day = p_day;
  if not found then raise exception 'No plan day %', p_day; end if;
  insert into public.note_entries (user_id, day) values (auth.uid(), p_day)
    on conflict (user_id, day) do nothing returning id into v_id;
  if v_id is null then  -- created concurrently
    select id into v_id from public.note_entries where user_id = auth.uid() and day = p_day;
    return v_id;
  end if;
  insert into public.note_items (entry_id, user_id, kind, source_key, question, question_2, position) values
    (v_id, auth.uid(), 'generated', 'q1', d.q1, null, 0),
    (v_id, auth.uid(), 'generated', 'q2', d.q2_connect, nullif(d.q2_reveal, ''), 1),
    (v_id, auth.uid(), 'generated', 'q3', d.q3, null, 2);
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Module 4: Talk It Over (shared within a group only)
-- ---------------------------------------------------------------------------
create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  owner_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  invite_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at   timestamptz not null default now()
);
create table public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  day        smallint not null references public.plan_days (day),
  author_id  uuid not null references auth.users (id) on delete cascade default auth.uid(),
  body       text not null check (length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_thread on public.posts (group_id, day, created_at);

create function public.is_group_member(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = p_group and user_id = auth.uid());
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.posts enable row level security;

create policy "members see group" on public.groups for select to authenticated
  using (public.is_group_member(id) or owner_id = auth.uid());
create policy "create group" on public.groups for insert to authenticated with check (owner_id = auth.uid());
create policy "owner edits group" on public.groups for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes group" on public.groups for delete to authenticated using (owner_id = auth.uid());

create policy "members see members" on public.group_members for select to authenticated
  using (public.is_group_member(group_id));
create policy "leave or owner removes" on public.group_members for delete to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid()));

create policy "members read posts" on public.posts for select to authenticated
  using (public.is_group_member(group_id));
create policy "members write posts" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_group_member(group_id));
create policy "authors edit posts" on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors or owner delete posts" on public.posts for delete to authenticated
  using (author_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid()));

-- Owner becomes a member when a group is created.
create function public.add_owner_as_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.owner_id);
  return new;
end $$;
create trigger on_group_created after insert on public.groups
  for each row execute function public.add_owner_as_member();

-- Join by invite link. Membership is only ever created through this function or the owner trigger.
create function public.join_group(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_group uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into v_group from public.groups where invite_token = p_token;
  if v_group is null then raise exception 'Invite not found'; end if;
  insert into public.group_members (group_id, user_id) values (v_group, auth.uid())
    on conflict do nothing;
  return v_group;
end $$;

-- Members' display names, visible only to people who share a group with them.
create function public.group_member_names(p_group uuid)
returns table (user_id uuid, display_name text)
language sql stable security definer set search_path = '' as $$
  select m.user_id, p.display_name
  from public.group_members m join public.profiles p on p.id = m.user_id
  where m.group_id = p_group and public.is_group_member(p_group);
$$;

-- Keep updated_at current.
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_progress before update on public.day_progress for each row execute function public.touch_updated_at();
create trigger t_entries  before update on public.note_entries for each row execute function public.touch_updated_at();
create trigger t_items    before update on public.note_items   for each row execute function public.touch_updated_at();
create trigger t_posts    before update on public.posts        for each row execute function public.touch_updated_at();
