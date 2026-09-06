insert into auth.users values
 ('00000000-0000-0000-0000-000000000004'),
 ('00000000-0000-0000-0000-000000000005');
set role authenticated;
do $$
declare
 owner_id text:='00000000-0000-0000-0000-000000000004';
 reporter_id text:='00000000-0000-0000-0000-000000000005';
 plan jsonb; checkpoints jsonb; room jsonb; answer jsonb; report_args jsonb; observation_kind text;
begin
 select jsonb_agg(jsonb_build_object('id','cp-'||checkpoint_number,'name','Checkpoint '||checkpoint_number,
  'distance_from_start',checkpoint_number,'order_index',checkpoint_number)) into checkpoints from generate_series(1,500) checkpoint_number;
 plan:=jsonb_build_object('event',jsonb_build_object('id','large-race','name','Large valid race','target_time','10:00','total_distance',500),
  'startAt',now()-interval '1 day','checkpoints',checkpoints,
  'operations',jsonb_build_object('variation',10,'stops','{}'::jsonb),'logistics',jsonb_build_array(repeat('a',440000)));
 assert octet_length(plan::text)<=524288,'regression fixture must be a valid-size plan';
 perform set_config('test.actor',owner_id,false);
 answer:=public.ue_live('create',jsonb_build_object('snapshot',plan,'localId','large-race','name','Runner'));
 room:=public.ue_live('read',jsonb_build_object('roomId',answer->>'id'));
 perform set_config('test.large_room',room->>'id',false);
 for checkpoint_number in 1..500 loop
  foreach observation_kind in array array['in','out'] loop
   perform public.ue_live('report',jsonb_build_object('roomId',room->>'id','checkpointId','cp-'||checkpoint_number,
    'kind',observation_kind,'at',now()-interval '12 hours','revision',0,'requestId',gen_random_uuid()));
  end loop;
 end loop;
 perform set_config('test.actor',reporter_id,false);
 perform public.ue_live('join',jsonb_build_object('code',room->>'invite','name','Reporter'));
 report_args:=jsonb_build_object('roomId',room->>'id','userId',owner_id,'reason','harassment',
  'details','Offensive text may be beyond the excerpt; review the identified room.','requestId',gen_random_uuid());
 answer:=public.ue_live('abuse_report',report_args);
 assert answer=public.ue_live('abuse_report',report_args),'oversized evidence report retries are idempotent';
 perform set_config('test.large_receipt',answer->>'id',false);
 perform set_config('test.actor',owner_id,false);
 plan:=jsonb_set(plan,'{logistics}',jsonb_build_array(repeat(chr(1)||'"'||chr(92)||'🚵',24000)));
 assert octet_length(plan::text)<=524288,'escaped multibyte fixture must be valid-size';
 perform public.ue_live('publish',jsonb_build_object('roomId',room->>'id','snapshot',plan,'revision',1));
 perform set_config('test.actor',reporter_id,false);
 answer:=public.ue_live('abuse_report',report_args||jsonb_build_object('requestId',gen_random_uuid()));
 perform set_config('test.escaped_receipt',answer->>'id',false);
end $$;
reset role;
do $$
declare report public.ue_live_abuse_reports; legacy_bytes integer;
begin
 select * into report from public.ue_live_abuse_reports where id=current_setting('test.large_receipt')::uuid;
 select octet_length(jsonb_build_object('plan',jsonb_set(snapshot,'{logistics}',jsonb_build_array(repeat('a',440000))),
  'observations',(select jsonb_agg(to_jsonb(observation)-'room_id') from public.ue_live_reports observation where room_id=rooms.id))::text)
  into legacy_bytes from public.ue_live_rooms rooms where id=current_setting('test.large_room')::uuid;
 assert legacy_bytes>600000,'fixture must exceed the previous evidence constraint';
 assert octet_length(report.evidence::text)<600000,'report evidence stays below constraint';
 assert report.reason='harassment' and length(report.details)>0,'report reason and details preserved';
 assert report.evidence->>'roomId'=current_setting('test.large_room'),'stable room ID retained';
 assert report.evidence->>'subjectId'=report.subject_id::text,'subject ID retained';
 assert report.evidence->'plan'='null'::jsonb and length(report.evidence->>'planExcerpt')=16000,'large plan replaced with bounded excerpt';
 assert (report.evidence->'truncation'->>'planTruncated')::boolean,'plan truncation explicit';
 assert (report.evidence->'truncation'->>'originalPlanBytes')::integer>440000,'original plan size retained';
 assert (report.evidence->'truncation'->>'observationsTotal')::integer=1000,'original observation count retained';
 assert (report.evidence->'truncation'->>'observationsIncluded')::integer=100,'bounded observation sample';
 assert (report.evidence->'truncation'->>'observationsTruncated')::boolean,'observation truncation explicit';
 assert jsonb_array_length(report.evidence->'observations')=100,'latest observation sample retained';
 assert (select count(*) from public.ue_live_abuse_reports where id=report.id)=1,'one report per retry ID';
 select * into report from public.ue_live_abuse_reports where id=current_setting('test.escaped_receipt')::uuid;
 assert octet_length(report.evidence::text)<600000,'JSON escaping and UTF-8 cannot exceed evidence limit';
 assert length(report.evidence->>'planExcerpt')=16000 and (report.evidence->'truncation'->>'planTruncated')::boolean,'escaped plan explicitly excerpted';
 raise notice 'Oversized evidence regression passed; prior evidence would require % bytes',legacy_bytes;
end $$;
