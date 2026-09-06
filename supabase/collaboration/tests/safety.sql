insert into auth.users values
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002'),
 ('00000000-0000-0000-0000-000000000003');

create function pg_temp.denied(action text,args jsonb,expected text) returns void language plpgsql as $$
begin
 begin
  perform public.ue_live(action,args);
 exception when others then
  if strpos(sqlerrm,expected)=0 then raise exception 'Wrong rejection: % (expected %)',sqlerrm,expected; end if;
  return;
 end;
 raise exception 'Expected rejection for %',action;
end $$;

set role authenticated;
do $$
declare
 owner_id text:='00000000-0000-0000-0000-000000000001';
 crew_id text:='00000000-0000-0000-0000-000000000002';
 other_id text:='00000000-0000-0000-0000-000000000003';
 plan jsonb; room jsonb; owned_room jsonb; other_room jsonb; answer jsonb; report_args jsonb; observation jsonb; old_invite text;
begin
 plan:=jsonb_build_object('event',jsonb_build_object('id','race','name','Quiet trail','target_time','10:00','total_distance',100),
  'startAt',now()-interval '1 day','checkpoints',jsonb_build_array(jsonb_build_object('id','half','name','Halfway','distance_from_start',50,'order_index',0)),
  'operations',jsonb_build_object('variation',10,'stops','{}'::jsonb),'logistics',jsonb_build_array('Blue van'));
 perform set_config('test.actor',owner_id,false);
 perform pg_temp.denied('create',jsonb_build_object('snapshot',plan,'localId','bad','name','ＦＵＣＫ'),'not allowed');
 perform pg_temp.denied('create',jsonb_build_object('snapshot',jsonb_set(plan,'{event,name}','"kill yourself"'),'localId','bad','name','Runner'),'not allowed');
 answer:=public.ue_live('create',jsonb_build_object('snapshot',plan,'localId','race','name','Runner'));
 room:=public.ue_live('read',jsonb_build_object('roomId',answer->>'id'));
 perform set_config('test.room',room->>'id',false);
 old_invite:=room->>'invite';
 perform set_config('test.actor',other_id,false);
 perform pg_temp.denied('read',jsonb_build_object('roomId',room->>'id'),'unavailable');
 perform pg_temp.denied('abuse_report',jsonb_build_object('roomId',room->>'id','userId',owner_id),'current member');
 perform pg_temp.denied('block_user',jsonb_build_object('roomId',room->>'id','userId',owner_id),'current member');
 perform set_config('test.actor',crew_id,false);
 perform pg_temp.denied('join',jsonb_build_object('code',old_invite,'name','SHIT'),'not allowed');
 perform public.ue_live('join',jsonb_build_object('code',old_invite,'name','Crew'));
 perform pg_temp.denied('publish',jsonb_build_object('roomId',room->>'id','snapshot',plan,'revision',1),'Only the owner');
 report_args:=jsonb_build_object('roomId',room->>'id','userId',owner_id,'reason','threats','details','Review the plan','requestId',gen_random_uuid());
 perform pg_temp.denied('abuse_report',report_args||jsonb_build_object('userId',crew_id),'current member');
 perform pg_temp.denied('abuse_report',report_args||jsonb_build_object('reason','unknown'),'Choose a reason');
 perform pg_temp.denied('abuse_report',report_args||jsonb_build_object('details',repeat('a',1001)),'1,000');
 answer:=public.ue_live('abuse_report',report_args);
 assert answer=public.ue_live('abuse_report',report_args),'abuse retry must be idempotent';
 for report_number in 2..10 loop
  perform public.ue_live('abuse_report',report_args||jsonb_build_object('requestId',gen_random_uuid()));
 end loop;
 perform pg_temp.denied('abuse_report',report_args||jsonb_build_object('requestId',gen_random_uuid()),'limit reached');
 assert answer=public.ue_live('abuse_report',report_args),'idempotency survives rate limit';
 observation:=jsonb_build_object('roomId',room->>'id','requestId',gen_random_uuid(),'checkpointId','half','kind','in','at',now()-interval '12 hours','revision',0,'authorId',owner_id);
 perform public.ue_live('report',observation);
 perform public.ue_live('report',observation);
 answer:=public.ue_live('read',jsonb_build_object('roomId',room->>'id'));
 assert jsonb_array_length(answer->'reports')=1,'observation retry must remain idempotent';
 assert answer->'reports'->0->>'authorId'=crew_id,'cannot forge observation author';
 perform pg_temp.denied('report',observation||jsonb_build_object('requestId',gen_random_uuid()),'changed on another device');
 answer:=public.ue_live('create',jsonb_build_object('snapshot',plan,'localId','crew-race','name','Crew'));
 owned_room:=public.ue_live('read',jsonb_build_object('roomId',answer->>'id'));
 perform set_config('test.actor',owner_id,false);
 perform public.ue_live('join',jsonb_build_object('code',owned_room->>'invite','name','Runner'));
 perform pg_temp.denied('publish',jsonb_build_object('roomId',room->>'id','snapshot',jsonb_set(plan,'{logistics}','["I will kill you"]'),'revision',1),'not allowed');
 perform public.ue_live('publish',jsonb_build_object('roomId',room->>'id','snapshot',plan,'revision',1));
 perform pg_temp.denied('publish',jsonb_build_object('roomId',room->>'id','snapshot',plan,'revision',1),'Plan changed');
 perform set_config('test.actor',other_id,false);
 answer:=public.ue_live('create',jsonb_build_object('snapshot',plan,'localId','third-race','name','Third'));
 other_room:=public.ue_live('read',jsonb_build_object('roomId',answer->>'id'));
 perform set_config('test.actor',owner_id,false);
 perform public.ue_live('join',jsonb_build_object('code',other_room->>'invite','name','Runner'));
 perform set_config('test.actor',crew_id,false);
 perform public.ue_live('join',jsonb_build_object('code',other_room->>'invite','name','Crew'));
 answer:=public.ue_live('block_user',jsonb_build_object('roomId',room->>'id','userId',owner_id));
 assert answer->'removedRoomIds' @> jsonb_build_array(room->>'id',other_room->>'id'),'block leaves non-owned common rooms';
 perform pg_temp.denied('read',jsonb_build_object('roomId',room->>'id'),'unavailable');
 perform pg_temp.denied('report',observation||jsonb_build_object('requestId',gen_random_uuid()),'unavailable');
 perform pg_temp.denied('join',jsonb_build_object('code',old_invite,'name','Crew'),'user block');
 answer:=public.ue_live('read',jsonb_build_object('roomId',owned_room->>'id'));
 assert jsonb_array_length(answer->'members')=1,'block removes target from blocker-owned room';
 assert answer->>'invite'<>owned_room->>'invite','block rotates owned-room invitation';
 perform set_config('test.actor',owner_id,false);
 perform pg_temp.denied('join',jsonb_build_object('code',answer->>'invite','name','Runner'),'user block');
 answer:=public.ue_live('read',jsonb_build_object('roomId',room->>'id'));
 assert jsonb_array_length(answer->'reports')=0,'blocked historical observations hidden server-side';
 perform public.ue_live('close',jsonb_build_object('roomId',room->>'id'));
 perform set_config('test.guest','false',false);
 perform pg_temp.denied('delete_identity','{}','Only collaboration guest');
 perform set_config('test.guest','true',false);
end $$;

reset role;
do $$
begin
 assert (select count(*) from public.ue_live_abuse_reports)=10,'private queue holds ten reports';
 assert (select bool_and(room_id is null and evidence->'plan' is not null and not evidence ? 'invite') from public.ue_live_abuse_reports),'room closure retains bounded evidence without invite';
 assert (select bool_and(not (evidence->'truncation'->>'planTruncated')::boolean and not (evidence->'truncation'->>'observationsTruncated')::boolean) from public.ue_live_abuse_reports),'small evidence remains complete';
 assert not has_function_privilege('authenticated','public.ue_live_core(text,jsonb)','execute'),'core RPC inaccessible';
 assert not has_function_privilege('anon','public.ue_live(text,jsonb)','execute'),'anonymous role cannot call RPC';
 assert not has_table_privilege('authenticated','public.ue_live_abuse_reports','select'),'reports private';
 assert not has_table_privilege('authenticated','public.ue_live_blocks','insert'),'blocks RPC-only';
 assert not has_table_privilege('authenticated','public.ue_live_content_terms','update'),'filter configuration private';
 assert (select bool_and(relrowsecurity) from pg_class where oid in ('public.ue_live_abuse_reports'::regclass,'public.ue_live_blocks'::regclass,'public.ue_live_content_terms'::regclass)),'RLS enabled';
end $$;
set role authenticated;
select set_config('test.actor','00000000-0000-0000-0000-000000000002',false);
select public.ue_live('delete_identity');
select public.ue_live('delete_identity');
select pg_temp.denied('list','{}','Sign in');
reset role;
do $$
begin
 assert not exists(select 1 from public.ue_live_abuse_reports),'guest deletion removes associated abuse evidence';
 assert not exists(select 1 from public.ue_live_blocks),'guest deletion removes blocks';
 assert not exists(select 1 from public.ue_live_rooms where owner_id='00000000-0000-0000-0000-000000000002'),'guest deletion removes owned rooms';
 assert not exists(select 1 from public.ue_live_members where user_id='00000000-0000-0000-0000-000000000002'),'guest deletion removes memberships';
 assert not exists(select 1 from public.ue_live_reports where user_id='00000000-0000-0000-0000-000000000002'),'guest deletion removes timing reports';
end $$;
