grant usage on schema public to authenticated;
grant select on public.plan_days to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.day_progress,
  public.note_entries,
  public.note_items,
  public.groups,
  public.group_members,
  public.posts
to authenticated;
grant execute on function
  public.open_note_entry(integer),
  public.join_group(text),
  public.is_group_member(uuid),
  public.group_member_names(uuid)
to authenticated;

revoke all on all tables in schema public from anon;
revoke execute on function public.open_note_entry(integer), public.join_group(text), public.group_member_names(uuid) from anon, public;