import { liveOperations, liveProjection, makeLiveSnapshot, nextReportRevision, LiveRoom } from '../lib/liveRaceModel';
import {emptyOperations} from '../lib/raceOperations';
import {Event,Checkpoint} from '../lib/database.types';
const start='2026-01-01T08:00:00Z';
const event={id:'race',name:'Test',event_date:'2026-01-01',event_time:'08:00',target_time:'10:00',total_distance:100,distance_unit:'kilometers',description:'private',gpx_file_url:'private'} as Event;
const cps=[{id:'half',name:'Half',order_index:0,distance_from_start:50},{id:'finish',name:'Finish',order_index:1,distance_from_start:100}] as Checkpoint[];
const snapshot=makeLiveSnapshot(event,cps,{...emptyOperations('race'),startAt:start,stops:{half:30}},['A van']);
const room=():LiveRoom=>({id:'room',ownerId:'runner',revision:1,invite:null,snapshot,serverTime:start,members:[],reports:[]});
const report=(authorId:string,kind:'in'|'out',at:string|null,checkpointId='half')=>({authorId,checkpointId,kind,at,revision:1,receivedAt:'2026-01-01T14:00:00Z'});
test('shared snapshot excludes contact details, notes and local time reports',()=>{
 expect(snapshot.event).not.toHaveProperty('description');expect(snapshot.event).not.toHaveProperty('gpx_file_url');expect(snapshot.operations.reports).toEqual([]);expect(Date.parse(snapshot.startAt)).toBe(Date.parse(start));
});
test('multiple crew reports do not outweigh runner and tombstones do not affect average',()=>{
 const r=room();r.reports=[report('runner','in','2026-01-01T13:00:00Z'),report('crew1','in','2026-01-01T13:10:00Z'),report('crew2','in','2026-01-01T13:30:00Z'),report('crew3','in',null)];
 const ops=liveOperations(r);expect(ops.reports).toHaveLength(2);expect(ops.reports.find(r=>r.source==='crew')!.at).toBe('2026-01-01T13:20:00.000Z');expect(liveProjection(r)!.rows[0].arrival).toBe(Date.parse('2026-01-01T13:10:00Z'));
});
test('conflicting cross-author observations remain visible but suppress impossible ETAs',()=>{
 const r=room();r.reports=[report('runner','in','2026-01-01T14:00:00Z'),report('crew','out','2026-01-01T13:00:00Z')];expect(liveProjection(r)).toBeNull();expect(r.reports).toHaveLength(2);
});
test('outbox correction revisions follow pending operations and isolate actors/stations',()=>{
 const r=room();r.reports=[report('runner','in','2026-01-01T13:00:00Z')];
 const p={roomId:'room',authorId:'runner',checkpointId:'half',kind:'in' as const,at:null,revision:1,requestId:'one'};
 expect(nextReportRevision(r,[p],'runner','half','in')).toBe(2);expect(nextReportRevision(r,[p],'crew','half','in')).toBe(0);expect(nextReportRevision(r,[p],'runner','finish','in')).toBe(0);
});
test('absolute start produces the same timeline regardless of event date formatting',()=>{
 const r=room();r.snapshot={...snapshot,event:{...event,event_time:'19:30'}};expect(liveProjection(r)!.start).toBe(Date.parse(start));
});
