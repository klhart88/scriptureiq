-- Lets a member permanently delete their own account and everything in it.
-- Groups they own pass to the longest-standing other member; a group with no other members is deleted.
-- Their notes, progress, Study Aggregate answers, group posts and memberships are removed with the account.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  g record;
  v_next uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  for g in select id from public.groups where owner_id = v_uid loop
    select user_id into v_next from public.group_members
      where group_id = g.id and user_id <> v_uid order by joined_at, user_id limit 1;
    if v_next is null then
      delete from public.groups where id = g.id;
    else
      update public.groups set owner_id = v_next where id = g.id;
    end if;
  end loop;
  delete from auth.users where id = v_uid;  -- everything else is removed by "on delete cascade"
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
