-- Talk It Over helpers. Run after 0001 and 0002.

-- What an invite link shows before joining: the group's name and size only. Nothing else is revealed.
create function public.invite_preview(p_token text)
returns table (group_id uuid, name text, member_count integer, already_member boolean)
language sql stable security definer set search_path = '' as $$
  select g.id, g.name,
         (select count(*)::int from public.group_members m where m.group_id = g.id),
         exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid())
  from public.groups g
  where g.invite_token = p_token and auth.uid() is not null;
$$;

-- Owner replaces the invite link (the old link stops working).
create function public.regenerate_invite(p_group uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_token text := replace(gen_random_uuid()::text, '-', '');
begin
  update public.groups set invite_token = v_token where id = p_group and owner_id = auth.uid();
  if not found then raise exception 'Only the group owner can change the invite link'; end if;
  return v_token;
end $$;

-- Days in a group that have posts, newest activity first, for the group's home page.
create function public.group_thread_activity(p_group uuid)
returns table (day smallint, post_count integer, last_post_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.day, count(*)::int, max(p.created_at)
  from public.posts p
  where p.group_id = p_group and public.is_group_member(p_group)
  group by p.day
  order by max(p.created_at) desc
  limit 30;
$$;

-- The owner can't leave their own group (they delete it instead), so a group always has its owner.
drop policy "leave or owner removes" on public.group_members;
create policy "leave or owner removes" on public.group_members for delete to authenticated
  using (
    (user_id = auth.uid() and not exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid()))
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid() and user_id <> g.owner_id)
  );

grant execute on function public.invite_preview(text), public.regenerate_invite(uuid), public.group_thread_activity(uuid) to authenticated;
revoke execute on function public.invite_preview(text), public.regenerate_invite(uuid), public.group_thread_activity(uuid) from anon, public;
