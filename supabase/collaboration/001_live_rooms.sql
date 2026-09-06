-- Additive, isolated from legacy cloud-backup tables. Apply as a database administrator.
begin;
create table if not exists public.ue_live_rooms (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 local_id text not null, snapshot jsonb not null, revision integer not null default 1,
 invite text not null default replace(gen_random_uuid()::text,'-',''), created_at timestamptz not null default now(),
 unique(owner_id,local_id), check (octet_length(snapshot::text) <= 524288)
);
create table if not exists public.ue_live_members (
 room_id uuid references public.ue_live_rooms(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80), primary key(room_id,user_id)
);
create table if not exists public.ue_live_reports (
 room_id uuid references public.ue_live_rooms(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade,
 checkpoint_id text not null, kind text not null check(kind in ('in','out')), observed_at timestamptz,
 revision integer not null, received_at timestamptz not null default now(),
 primary key(room_id,user_id,checkpoint_id,kind)
);
create table if not exists public.ue_live_requests (
 room_id uuid references public.ue_live_rooms(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade,
 request_id uuid not null, result jsonb not null, primary key(room_id,user_id,request_id)
);
alter table public.ue_live_rooms enable row level security;
alter table public.ue_live_members enable row level security;
alter table public.ue_live_reports enable row level security;
alter table public.ue_live_requests enable row level security;
revoke all on public.ue_live_rooms,public.ue_live_members,public.ue_live_reports,public.ue_live_requests from anon,authenticated;
create or replace function public.ue_live_validate(plan jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare cp jsonb; distance numeric; total numeric; prior numeric:=0; stop jsonb;
begin
 if coalesce(jsonb_typeof(plan),'null')<>'object' or coalesce(jsonb_typeof(plan->'event'),'null')<>'object'
 or coalesce(jsonb_typeof(plan->'checkpoints'),'null')<>'array' or coalesce(jsonb_typeof(plan->'operations'->'stops'),'null')<>'object'
 or coalesce(jsonb_typeof(plan->'logistics'),'null')<>'array' then raise exception 'Invalid shared plan shape'; end if;
 if jsonb_typeof(plan->'event'->'name') is distinct from 'string' or jsonb_typeof(plan->'event'->'target_time') is distinct from 'string' or length(coalesce(plan->'event'->>'name','')) not between 1 and 200 or not coalesce((plan->'event'->>'target_time') ~ '^([0-9]{1,4}):([0-5][0-9])(:[0-5][0-9])?$',false)
 or (plan->>'startAt') is null or not isfinite((plan->>'startAt')::timestamptz)
 or coalesce((plan->'operations'->>'variation')::numeric,-1) not between 0 and 50 then raise exception 'Invalid shared timing'; end if;
 total:=(plan->'event'->>'total_distance')::numeric;
 if total is null or total<=0 or total>1000000 or jsonb_array_length(plan->'checkpoints')>500 then raise exception 'Invalid course distance'; end if;
 for cp in select value from jsonb_array_elements(plan->'checkpoints') order by (value->>'order_index')::integer loop
  distance:=(cp->>'distance_from_start')::numeric;
  if jsonb_typeof(cp->'id') is distinct from 'string' or jsonb_typeof(cp->'name') is distinct from 'string' or cp->>'order_index' is null or length(coalesce(cp->>'id','')) not between 1 and 200 or length(coalesce(cp->>'name','')) not between 1 and 200 or distance is null or distance<prior or distance>total then raise exception 'Invalid checkpoint'; end if;
  prior:=distance;
 end loop;
 for stop in select value from jsonb_each(plan->'operations'->'stops') loop
  if jsonb_typeof(stop)<>'number' or (stop::text)::numeric not between 0 and 1440 then raise exception 'Invalid stop duration'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(plan->'logistics') value where jsonb_typeof(value)<>'string') then raise exception 'Invalid logistics'; end if;
end $$;
revoke all on function public.ue_live_validate(jsonb) from public,anon,authenticated;
-- All access goes through this membership-checked RPC. No direct table grants.
create or replace function public.ue_live(action text, args jsonb default '{}'::jsonb) returns jsonb
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
revoke all on function public.ue_live(text,jsonb) from public,anon;
grant execute on function public.ue_live(text,jsonb) to authenticated;
commit;
