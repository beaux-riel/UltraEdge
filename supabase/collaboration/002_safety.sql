begin;

create table public.ue_live_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id)
);
create index ue_live_blocks_blocked on public.ue_live_blocks(blocked_id);

create table public.ue_live_abuse_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 subject_id uuid not null references auth.users(id) on delete cascade,
 room_id uuid references public.ue_live_rooms(id) on delete set null,
 request_id uuid not null,
 reason text not null check(reason in ('harassment','hate','sexual_content','threats','other')),
 details text not null check(length(details)<=1000),
 evidence jsonb not null check(octet_length(evidence::text)<=600000),
 status text not null default 'pending' check(status in ('pending','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(), reviewed_at timestamptz,
 unique(reporter_id,request_id), check(reporter_id<>subject_id)
);
create index ue_live_abuse_pending on public.ue_live_abuse_reports(created_at) where status='pending';
create index ue_live_abuse_reporter on public.ue_live_abuse_reports(reporter_id,created_at);
create table public.ue_live_content_terms (
 phrase text primary key check(length(phrase) between 2 and 100)
);
insert into public.ue_live_content_terms values ('fuck'),('shit'),('kill yourself'),('i will kill you');

alter table public.ue_live_blocks enable row level security;
alter table public.ue_live_abuse_reports enable row level security;
alter table public.ue_live_content_terms enable row level security;
revoke all on public.ue_live_blocks,public.ue_live_abuse_reports,public.ue_live_content_terms from public,anon,authenticated;

create function public.ue_live_check_content(content text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare normalized text;
begin
 normalized:=' '||regexp_replace(lower(normalize(content,NFKC)),'[^[:alnum:]]+',' ','g')||' ';
 if exists(select 1 from ue_live_content_terms where strpos(normalized,' '||phrase||' ')>0)
 then raise exception 'Shared text contains language that is not allowed. Edit the display name or plan before sharing.' using errcode='22023'; end if;
end $$;
revoke all on function public.ue_live_check_content(text) from public,anon,authenticated;

create function public.ue_live_filter_content() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare item jsonb;
begin
 if tg_table_name='ue_live_members' then perform ue_live_check_content(new.name);
 else
  for item in select jsonb_path_query(new.snapshot,'$.** ? (@.type() == "string")') loop
   perform ue_live_check_content(item #>> '{}');
  end loop;
 end if;
 return new;
end $$;
revoke all on function public.ue_live_filter_content() from public,anon,authenticated;
create trigger ue_live_member_content before insert or update on public.ue_live_members for each row execute function public.ue_live_filter_content();
create trigger ue_live_plan_content before insert or update of snapshot on public.ue_live_rooms for each row execute function public.ue_live_filter_content();

create or replace function public.ue_live_core(action text, args jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
 actor uuid := auth.uid(); room public.ue_live_rooms; rid uuid; answer jsonb; checkpoint text; k text;
 observed timestamptz; existing public.ue_live_reports; opposite timestamptz; expected integer; request uuid;
 plan_snapshot jsonb; start_time timestamptz;
begin
 if actor is null then raise exception 'Sign in before sharing.' using errcode='42501'; end if;
 if action='delete_identity' then
  if coalesce(auth.jwt()->>'is_anonymous','false')<>'true' then raise exception 'Only collaboration guest identities can be removed here.'; end if;
  delete from auth.users where id=actor; return '{}'::jsonb;
 elsif action='create' then
  plan_snapshot := args->'snapshot';
  perform ue_live_validate(plan_snapshot);
  if coalesce(jsonb_typeof(plan_snapshot),'null') <> 'object' or coalesce(jsonb_typeof(plan_snapshot->'checkpoints'),'null') <> 'array' or length(coalesce(args->>'localId','')) not between 1 and 200 then raise exception 'Invalid plan'; end if;
  if (select count(*) from ue_live_rooms where owner_id=actor) >= 20 then raise exception 'Limit of 20 shared races reached.'; end if;
  insert into ue_live_rooms(owner_id,local_id,snapshot) values(actor,args->>'localId',plan_snapshot)
   on conflict(owner_id,local_id) do nothing;
  select * into room from ue_live_rooms where owner_id=actor and local_id=args->>'localId';
  insert into ue_live_members values(room.id,actor,left(coalesce(nullif(trim(args->>'name'),''),'Runner'),80)) on conflict do nothing;
  return jsonb_build_object('id',room.id);
 elsif action='join' then
  select * into room from ue_live_rooms where invite=args->>'code' and created_at > now()-interval '1 year';
  if room.id is null then raise exception 'Invite is invalid or expired.' using errcode='42501'; end if;
  if (select count(*) from ue_live_members where room_id=room.id)>=50 then raise exception 'Team is full.'; end if;
  insert into ue_live_members values(room.id,actor,left(coalesce(nullif(trim(args->>'name'),''),'Crew'),80)) on conflict do nothing;
  return jsonb_build_object('id',room.id);
 elsif action='list' then
  return coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.snapshot->'event'->>'name')) from ue_live_rooms r join ue_live_members m on m.room_id=r.id where m.user_id=actor),'[]'::jsonb);
 end if;
 rid := (args->>'roomId')::uuid;
 select * into room from ue_live_rooms where id=rid for update;
 if room.id is null or not exists(select 1 from ue_live_members where room_id=rid and user_id=actor) then raise exception 'Shared race is unavailable or access was removed.' using errcode='42501'; end if;
 if action='read' then
  return jsonb_build_object('id',rid,'ownerId',room.owner_id,'snapshot',room.snapshot,'revision',room.revision,
   'invite',case when actor=room.owner_id then room.invite else null end,'serverTime',now(),
   'members',coalesce((select jsonb_agg(jsonb_build_object('id',user_id,'name',name)) from ue_live_members where room_id=rid),'[]'::jsonb),
   'reports',coalesce((select jsonb_agg(jsonb_build_object('authorId',user_id,'checkpointId',checkpoint_id,'kind',kind,'at',observed_at,'revision',revision,'receivedAt',received_at)) from ue_live_reports where room_id=rid),'[]'::jsonb));
 elsif action='report' then
  request := (args->>'requestId')::uuid;
  select result into answer from ue_live_requests where room_id=rid and user_id=actor and request_id=request;
  if found then return answer; end if;
  checkpoint:=args->>'checkpointId'; k:=args->>'kind'; observed:=(args->>'at')::timestamptz;
  if k not in ('in','out') or not exists(select 1 from jsonb_array_elements(room.snapshot->'checkpoints') cp where cp->>'id'=checkpoint) then raise exception 'Invalid checkpoint or report type'; end if;
  start_time := (room.snapshot->>'startAt')::timestamptz;
  if start_time is null or observed < start_time or observed > now()+interval '1 minute' then raise exception 'Observation must be between race start and now.'; end if;
  select * into existing from ue_live_reports where room_id=rid and user_id=actor and checkpoint_id=checkpoint and kind=k;
  expected:=coalesce((args->>'revision')::integer,0);
  if coalesce(existing.revision,0) <> expected then raise exception 'Report changed on another device. Refresh and correct it again.' using errcode='PT409'; end if;
  select observed_at into opposite from ue_live_reports where room_id=rid and user_id=actor and checkpoint_id=checkpoint and kind=case when k='in' then 'out' else 'in' end;
  if observed is not null and opposite is not null and ((k='in' and observed>opposite) or (k='out' and observed<opposite)) then raise exception 'Departure cannot precede arrival.'; end if;
  insert into ue_live_reports values(rid,actor,checkpoint,k,observed,expected+1,now())
   on conflict(room_id,user_id,checkpoint_id,kind) do update set observed_at=excluded.observed_at,revision=excluded.revision,received_at=excluded.received_at;
  answer:=jsonb_build_object('revision',expected+1);
  insert into ue_live_requests values(rid,actor,request,answer);
  return answer;
 elsif action='publish' then
  if actor<>room.owner_id then raise exception 'Only the owner can publish the plan.' using errcode='42501'; end if;
  if coalesce((args->>'revision')::integer,-1)<>room.revision then raise exception 'Plan changed. Refresh before publishing.' using errcode='PT409'; end if;
  plan_snapshot:=args->'snapshot';
  perform ue_live_validate(plan_snapshot);
  if coalesce(jsonb_typeof(plan_snapshot),'null')<>'object' or coalesce(jsonb_typeof(plan_snapshot->'checkpoints'),'null')<>'array' then raise exception 'Invalid plan'; end if;
  update ue_live_rooms set snapshot=plan_snapshot,revision=revision+1 where id=rid;
  return jsonb_build_object('revision',room.revision+1);
 elsif action='revoke' then
  if actor<>room.owner_id or (args->>'userId')::uuid=actor then raise exception 'Only the owner can remove another member.' using errcode='42501'; end if;
  delete from ue_live_members where room_id=rid and user_id=(args->>'userId')::uuid;
  -- Rotate invite so removed members cannot rejoin with the old code.
  update ue_live_rooms set invite=replace(gen_random_uuid()::text,'-','') where id=rid;
  return '{}'::jsonb;
 elsif action='close' then
  if actor<>room.owner_id then raise exception 'Only the owner can stop sharing.' using errcode='42501'; end if;
  delete from ue_live_rooms where id=rid; return '{}'::jsonb;
 elsif action='leave' then
  if actor=room.owner_id then raise exception 'Stop sharing to remove the owner.'; end if;
  delete from ue_live_members where room_id=rid and user_id=actor; return '{}'::jsonb;
 end if;
 raise exception 'Unknown action';
end $$;

revoke all on function public.ue_live_core(text,jsonb) from public,anon,authenticated;

create or replace function public.ue_live(action text,args jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
 actor uuid:=auth.uid(); subject uuid; room public.ue_live_rooms; shared public.ue_live_rooms;
 answer jsonb; removed jsonb:='[]'::jsonb; report_id uuid; requested uuid; reason text; details text;
 report_evidence jsonb; plan_bytes integer; evidence_observations jsonb; next_observations jsonb;
 subject_observation public.ue_live_reports; observation_total bigint;
begin
 if actor is null or (action<>'delete_identity' and not exists(select 1 from auth.users where id=actor))
 then raise exception 'Sign in before sharing.' using errcode='42501'; end if;
 if action in ('join','block_user','abuse_report','delete_identity') then
  perform pg_advisory_xact_lock(827461,1);
 end if;
 if action='join' then
  select * into room from ue_live_rooms where invite=args->>'code' for update;
  if exists(select 1 from ue_live_members member join ue_live_blocks blocked
   on (blocked.blocker_id=actor and blocked.blocked_id=member.user_id)
   or (blocked.blocked_id=actor and blocked.blocker_id=member.user_id) where member.room_id=room.id)
  then raise exception 'This team is unavailable because of a user block.' using errcode='42501'; end if;
 elsif action in ('block_user','abuse_report') then
  select * into room from ue_live_rooms where id=(args->>'roomId')::uuid for update;
  subject:=(args->>'userId')::uuid;
  if room.id is null or subject is null or subject=actor
   or not exists(select 1 from ue_live_members where room_id=room.id and user_id=actor)
   or not exists(select 1 from ue_live_members where room_id=room.id and user_id=subject)
  then raise exception 'Choose another current member of your team.' using errcode='42501'; end if;
  if action='abuse_report' then
   requested:=(args->>'requestId')::uuid;
   select id into report_id from ue_live_abuse_reports where reporter_id=actor and request_id=requested;
   if found then return jsonb_build_object('id',report_id); end if;
   reason:=args->>'reason'; details:=coalesce(args->>'details','');
   if requested is null or reason is null or reason not in ('harassment','hate','sexual_content','threats','other') or length(details)>1000
   then raise exception 'Choose a reason and keep details under 1,000 characters.'; end if;
   if (select count(*) from ue_live_abuse_reports where reporter_id=actor and created_at>now()-interval '24 hours')>=10
   then raise exception 'Report limit reached. Use the support page for further help.'; end if;
   plan_bytes:=case when subject=room.owner_id then octet_length(room.snapshot::text) else null end;
   evidence_observations:='[]'::jsonb;
   select count(*) into observation_total from ue_live_reports where room_id=room.id and user_id=subject;
   for subject_observation in select * from ue_live_reports where room_id=room.id and user_id=subject
    order by received_at desc,checkpoint_id,kind limit 100 loop
    next_observations:=evidence_observations||jsonb_build_array(to_jsonb(subject_observation)-'room_id');
    exit when octet_length(next_observations::text)>131072;
    evidence_observations:=next_observations;
   end loop;
   report_evidence:=jsonb_build_object(
    'version',1,'roomId',room.id,'subjectId',subject,'planRevision',room.revision,
    'eventName',room.snapshot->'event'->'name','subjectName',(select name from ue_live_members where room_id=room.id and user_id=subject),
    'plan',case when plan_bytes<=262144 then room.snapshot else null end,
    'planExcerpt',case when plan_bytes>262144 then left(room.snapshot::text,16000) else null end,
    'observations',evidence_observations,
    'truncation',jsonb_build_object('planTruncated',coalesce(plan_bytes>262144,false),'originalPlanBytes',plan_bytes,
     'planByteLimit',262144,'planExcerptCharacterLimit',16000,'observationsTotal',observation_total,
     'observationsIncluded',jsonb_array_length(evidence_observations),'observationsTruncated',observation_total>jsonb_array_length(evidence_observations),
     'observationCountLimit',100,'observationByteLimit',131072));
   insert into ue_live_abuse_reports(reporter_id,subject_id,room_id,request_id,reason,details,evidence)
   values(actor,subject,room.id,requested,reason,details,report_evidence)
   returning id into report_id;
   return jsonb_build_object('id',report_id);
  end if;
  insert into ue_live_blocks(blocker_id,blocked_id) values(actor,subject) on conflict do nothing;
  for shared in select owned.* from ue_live_rooms owned
   where exists(select 1 from ue_live_members where room_id=owned.id and user_id=actor)
   and exists(select 1 from ue_live_members where room_id=owned.id and user_id=subject) order by owned.id for update loop
   if shared.owner_id=actor then
    delete from ue_live_members where room_id=shared.id and user_id=subject;
    update ue_live_rooms set invite=replace(gen_random_uuid()::text,'-','') where id=shared.id;
   else
    delete from ue_live_members where room_id=shared.id and user_id=actor;
    removed:=removed||jsonb_build_array(shared.id);
   end if;
  end loop;
  return jsonb_build_object('removedRoomIds',removed);
 end if;
 answer:=ue_live_core(action,args);
 if action='read' then
  answer:=jsonb_set(answer,'{reports}',coalesce((select jsonb_agg(observation) from jsonb_array_elements(answer->'reports') observation
   where not exists(select 1 from ue_live_blocks where
    (blocker_id=actor and blocked_id=(observation->>'authorId')::uuid)
    or (blocked_id=actor and blocker_id=(observation->>'authorId')::uuid))),'[]'::jsonb));
 end if;
 return answer;
end $$;
revoke all on function public.ue_live(text,jsonb) from public,anon;
grant execute on function public.ue_live(text,jsonb) to authenticated;
commit;
