import { requirementStatus } from '../lib/mandatoryGear';
import { EventGearAllocation } from '../lib/eventGear';
import { emptyOperations, projectRace, raceStart } from '../lib/raceOperations';
import { Event, Checkpoint } from '../lib/database.types';
const requirement = { id: 'lights', name: 'Light sources', quantity: 2, gearIds: ['lamp', 'torch'] };
const allocation = (id: string, quantity: number, packed: boolean): EventGearAllocation => ({ eventId: 'race', gearItemId: id, quantity, isPacked: packed, isCarried: true, isWorn: false });
test('mandatory quantity counts distinct assigned items and packing; removed or retired gear never satisfies it', () => {
 const rows = [allocation('lamp', 1, true), allocation('torch', 1, false)];
 expect(requirementStatus(requirement, rows, ['lamp','torch'])).toEqual({ assigned: 2, packed: 1, missing: 1, ready: false });
 rows[1].isPacked = true;
 expect(requirementStatus(requirement, rows, ['lamp','torch']).ready).toBe(true);
 expect(requirementStatus(requirement, rows, ['lamp']).ready).toBe(false);
 expect(requirementStatus(requirement, [], ['lamp','torch']).missing).toBe(2);
 expect(requirementStatus(requirement, [{...rows[0],isCarried:false}], ['lamp']).assigned).toBe(0);
});
test('a two-minute versus ten-minute stop shifts downstream ETAs and finish eight minutes, without changing arrival at that stop', () => {
 const event = {id:'race',event_date:'2027-08-13',event_time:'08:00',target_time:'30:00',total_distance:120} as Event;
 const checkpoints = [{id:'a',name:'A',distance_from_start:40,order_index:0},{id:'b',name:'B',distance_from_start:80,order_index:1}] as Checkpoint[];
 const ops = emptyOperations('race');
 const short = projectRace(event,checkpoints,{...ops,stops:{a:2}})!;
 const long = projectRace(event,checkpoints,{...ops,stops:{a:10}})!;
 expect(long.rows[0].arrival).toBe(short.rows[0].arrival);
 expect(long.rows[1].arrival-short.rows[1].arrival).toBe(8*60000);
 expect(long.finish-short.finish).toBe(8*60000);
 // A local actual observation must not move the original planning projection.
 const recorded = {...ops,stops:{a:10},startAt:new Date(raceStart(event,ops)!+60000).toISOString(),reports:[{checkpointId:'a',kind:'in' as const,source:'runner' as const,at:new Date(short.rows[0].arrival+30*60000).toISOString(),recordedAt:new Date().toISOString()}]};
 expect(projectRace(event,checkpoints,{...recorded,startAt:null,reports:[]})!.finish).toBe(long.finish);
});
