-- Talk It Over rules. Run after auth_stub.sql, the three migrations and seed.sql.
\set ON_ERROR_STOP 1
insert into auth.users values
  ('11111111-1111-1111-1111-111111111111','owner@x.com','{"display_name":"Olivia Owner"}'),
  ('22222222-2222-2222-2222-222222222222','member@x.com','{"display_name":"Mark Member"}'),
  ('33333333-3333-3333-3333-333333333333','outsider@x.com','{"display_name":"Oscar Outsider"}');
set role authenticated;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into groups(name) values ('Tuesday group');
select count(*) as owner_is_member from group_members;
select id as gid, invite_token as tok from groups \gset
insert into posts(group_id, day, body) values (:'gid', 3, 'Owner on day 3');

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select name, member_count, already_member from invite_preview(:'tok');
select join_group(:'tok') is not null as member_joined;
insert into posts(group_id, day, body) values (:'gid', 3, 'Member on day 3');
select day, post_count from group_thread_activity(:'gid');
select count(*) as member_names from group_member_names(:'gid');
\set ON_ERROR_STOP 0
select regenerate_invite(:'gid');                           -- member can't change link: error expected
delete from group_members where user_id = '11111111-1111-1111-1111-111111111111';  -- can't remove owner
\set ON_ERROR_STOP 1
select count(*) as owner_still_there from group_members where user_id = '11111111-1111-1111-1111-111111111111';

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select count(*) as outsider_sees_posts from posts;
select count(*) as outsider_sees_activity from group_thread_activity(:'gid');
select count(*) as preview_bad_token from invite_preview('nope');

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select regenerate_invite(:'gid') <> :'tok' as owner_new_link;
select count(*) as old_link_works from invite_preview(:'tok');
delete from group_members where user_id = '11111111-1111-1111-1111-111111111111';
select count(*) as owner_cannot_leave from group_members where user_id = '11111111-1111-1111-1111-111111111111';
delete from posts where body = 'Member on day 3';
select count(*) as owner_removed_member_post from posts where body = 'Member on day 3';
delete from group_members where user_id = '22222222-2222-2222-2222-222222222222';
select count(*) as members_after_removal from group_members;

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) as removed_member_sees_posts from posts;
reset role;
