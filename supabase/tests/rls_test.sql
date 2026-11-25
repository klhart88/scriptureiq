\set ON_ERROR_STOP 1
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
insert into auth.users values ('11111111-1111-1111-1111-111111111111','a@x.com'),('22222222-2222-2222-2222-222222222222','b@x.com'),('33333333-3333-3333-3333-333333333333','c@x.com');
select count(*) as profiles from public.profiles;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.open_note_entry(5) is not null as opened;
select public.open_note_entry(5) = (select id from note_entries where day=5) as idempotent;
select source_key, left(question,40), left(coalesce(question_2,''),40) from note_items order by position;
update note_items set answer='private A' where source_key='q1';
insert into day_progress(day, segments) values (5,'{"0":{"done":3,"total":9}}');
insert into groups(name) values ('Tuesday group');
select invite_token as tok from groups \gset
insert into posts(group_id, day, body) select id, 5, 'hello from A' from groups;

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) as b_sees_a_notes from note_items;
select count(*) as b_sees_a_progress from day_progress;
select count(*) as b_sees_posts_before_join from posts;
select public.join_group(:'tok') is not null as b_joined;
select count(*) as b_sees_posts_after_join from posts;
select count(*) as b_member_names from public.group_member_names((select id from groups));
do $$ begin
  begin update note_items set answer='hacked'; exception when others then null; end;
end $$;
do $$ begin
  begin insert into note_items(entry_id, kind, question) select id,'own','x' from note_entries; exception when others then raise notice 'blocked'; end;
end $$;

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select count(*) as c_sees_posts from posts;
do $$ begin
  insert into posts(group_id, day, body) select id, 5, 'intruder' from groups;
  raise notice 'c inserted %', (select count(*) from posts);
exception when others then raise notice 'c blocked: %', sqlerrm; end $$;
do $$ begin
  insert into group_members(group_id,user_id) values ((select id from public.groups limit 1),'33333333-3333-3333-3333-333333333333');
  raise notice 'c self-added';
exception when others then raise notice 'c membership blocked: %', sqlerrm; end $$;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select answer from note_items where source_key='q1';
select count(*) as plan_days from plan_days;
reset role;
