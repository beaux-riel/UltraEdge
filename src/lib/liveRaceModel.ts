import { Checkpoint, Event } from './database.types';
import { RaceOperations, TimeReport, projectRace, raceStart } from './raceOperations';
export interface LiveSnapshot { event: Event; checkpoints: Checkpoint[]; operations: RaceOperations; startAt: string; logistics: string[]; }
export interface LiveReport { authorId: string; checkpointId: string; kind: 'in'|'out'; at: string|null; revision: number; receivedAt: string; }
export interface LiveRoom { id: string; ownerId: string; snapshot: LiveSnapshot; revision: number; invite: string|null; serverTime: string; members: {id:string;name:string}[]; reports: LiveReport[]; }
export interface PendingReport { requestId:string; roomId:string; authorId:string; checkpointId:string; kind:'in'|'out'; at:string|null; revision:number; }
export function liveOperations(room: LiveRoom): RaceOperations {
  const reports: TimeReport[] = [];
  for (const cp of room.snapshot.checkpoints) for (const kind of ['in','out'] as const) for (const source of ['runner','crew'] as const) {
    const rows = room.reports.filter(r => r.checkpointId===cp.id && r.kind===kind && r.at && (source==='runner' ? r.authorId===room.ownerId : r.authorId!==room.ownerId));
    if (rows.length) reports.push({checkpointId:cp.id,kind,source,at:new Date(rows.reduce((n,r)=>n+Date.parse(r.at!),0)/rows.length).toISOString(),recordedAt:rows.map(r=>r.receivedAt).sort().pop()!});
  }
  return {...room.snapshot.operations,startAt:room.snapshot.startAt,reports};
}
export function liveProjection(room: LiveRoom) {
  const ops=liveOperations(room);let prior=Date.parse(room.snapshot.startAt);
  const projection=projectRace(room.snapshot.event,room.snapshot.checkpoints,ops);
  // Keep conflicting evidence visible but do not present an impossible itinerary.
  for(const row of projection?.rows??[]) for(const actual of [row.actualIn,row.actualOut]) if(actual!==null) { if(actual<prior)return null; prior=actual; }
  return projection;
}
export function makeLiveSnapshot(event:Event,checkpoints:Checkpoint[],operations:RaceOperations,logistics:string[]):LiveSnapshot {
  const start=raceStart(event,operations);
  if(start===null||!projectRace(event,checkpoints,operations))throw new Error('Complete the start, target duration and checkpoint distances before sharing.');
  // Explicit allowlist: phone numbers, emails, GPX URIs and personal notes are not uploaded.
  const safeEvent={id:event.id,name:event.name,event_date:event.event_date,event_time:event.event_time,target_time:event.target_time,total_distance:event.total_distance,distance_unit:event.distance_unit} as Event;
  const safeCheckpoints=checkpoints.map(cp=>({id:cp.id,event_id:event.id,name:cp.name,order_index:cp.order_index,distance_from_start:cp.distance_from_start,estimated_duration:cp.estimated_duration,has_crew_access:cp.has_crew_access} as Checkpoint));
  return {event:safeEvent,checkpoints:safeCheckpoints,operations:{id:operations.id,variation:operations.variation,startAt:new Date(start).toISOString(),stops:{...operations.stops},duties:[],vehicles:[],cargo:[],reports:[]},startAt:new Date(start).toISOString(),logistics};
}
export function nextReportRevision(room:LiveRoom,pending:PendingReport[],authorId:string,checkpointId:string,kind:'in'|'out'):number {
 return Math.max(room.reports.find(r=>r.authorId===authorId&&r.checkpointId===checkpointId&&r.kind===kind)?.revision??0,...pending.filter(r=>r.roomId===room.id&&r.authorId===authorId&&r.checkpointId===checkpointId&&r.kind===kind).map(r=>r.revision+1));
}
