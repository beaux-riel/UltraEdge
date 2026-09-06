import { Event, Checkpoint } from '../lib/database.types';
import { emptyOperations, projectRace, projectedDistance, durationMinutes, putTimeReport, reportAverage, raceStart, changeOperations, loadOperations, OPERATIONS_KEY } from '../lib/raceOperations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteLocalEvent } from '../lib/localPlanStorage';
const event = { id: 'race', event_date: '2025-01-01', event_time: '08:00', total_distance: 100, target_time: '10:00' } as Event;
const cp = (id: string, distance: number, index: number): Checkpoint => ({ id, distance_from_start: distance, order_index: index, name: id, event_id: 'race', estimated_duration: null } as Checkpoint);
const checkpoints = [cp('half', 50, 0), cp('finish', 100, 1)];
const start = raceStart(event, emptyOperations('race'))!;
const time = (minutes: number) => new Date(start + minutes * 60000).toISOString();
const report = (checkpointId: string, source: 'runner' | 'crew', kind: 'in' | 'out', minutes: number) => ({ checkpointId, source, kind, at: time(minutes), recordedAt: time(minutes) });

test('accepts ultra durations over 24h and rejects ambiguous durations', () => {
  expect(durationMinutes('36:30')).toBe(2190);
  expect(durationMinutes('24:00:30')).toBe(1440.5);
  expect(durationMinutes('10:99')).toBeNull(); expect(durationMinutes('fast')).toBeNull();
});
test('planned dwell adds to downstream arrival and finish but not uncertainty', () => {
  const plan = projectRace(event, checkpoints, { ...emptyOperations('race'), stops: { half: 30 } })!;
  expect(plan.rows[0].arrival).toBe(start + 300 * 60000);
  expect(plan.rows[0].departure).toBe(start + 330 * 60000);
  expect(plan.finish).toBe(start + 630 * 60000);
  expect(plan.bestFinish).toBe(start + 570 * 60000);
  expect(plan.slowFinish).toBe(start + 690 * 60000);
});
test('runner and crew receive equal weight and a correction replaces the same source', () => {
  let ops = putTimeReport(emptyOperations('race'), report('half', 'runner', 'in', 300), checkpoints, start);
  ops = putTimeReport(ops, report('half', 'crew', 'in', 320), checkpoints, start);
  expect(reportAverage(ops.reports, 'half', 'in')).toBe(start + 310 * 60000);
  ops = putTimeReport(ops, report('half', 'runner', 'in', 310), checkpoints, start);
  expect(ops.reports).toHaveLength(2);
  expect(reportAverage(ops.reports, 'half', 'in')).toBe(start + 315 * 60000);
});
test('live departure excludes real dwell from observed moving pace', () => {
  const ops = { ...emptyOperations('race'), stops: { half: 30 }, reports: [report('half','runner','in',360),report('half','runner','out',420)] };
  const plan = projectRace(event, checkpoints, ops)!;
  expect(plan.finish).toBe(start + 780 * 60000);
  expect(plan.rows[0].departure).toBe(start + 420 * 60000);
});
test('arrival-only anchor preserves planned dwell before next travel', () => {
  const ops = { ...emptyOperations('race'), stops: { half: 30 }, reports: [report('half','runner','in',360)] };
  expect(projectRace(event, checkpoints, ops)!.finish).toBe(start + 750 * 60000);
});
test('rejects reversed reports, future observations and missing start', () => {
  const ops = putTimeReport(emptyOperations('race'), report('half','runner','in',300),checkpoints,start);
  expect(() => putTimeReport(ops,report('half','runner','out',299),checkpoints,start)).toThrow();
  expect(() => putTimeReport(ops,report('finish','crew','in',200),checkpoints,start)).toThrow();
  expect(() => putTimeReport(ops,{...report('finish','crew','in',200),at:new Date(Date.now()+3600000).toISOString()},checkpoints,start)).toThrow();
  expect(() => putTimeReport(ops,report('half','runner','in',300),checkpoints,null)).toThrow();
});
test('missing distance and decreasing station distances do not invent ETAs', () => {
  expect(projectRace(event,[cp('a',80,0),cp('b',40,1)],emptyOperations('race'))).toBeNull();
  expect(projectRace(event,[{...checkpoints[0],distance_from_start:null}],emptyOperations('race'))).toBeNull();
});
test('progress remains stationary through dwell and respects uncertainty', () => {
  const plan = projectRace(event, checkpoints, { ...emptyOperations('race'), stops: { half: 30 } })!;
  expect(projectedDistance(plan,100,start+315*60000)).toBe(50);
  expect(projectedDistance(plan,100,start+150*60000)).toBe(25);
  expect(projectedDistance(plan,100,start+150*60000,'best')).toBeGreaterThan(25);
  expect(projectedDistance(plan,100,start+150*60000,'slow')).toBeLessThan(25);
  expect(projectedDistance(plan,100,start+900*60000)).toBe(100);
});
test('zero-distance start dwell is included, multi-day rollover remains absolute', () => {
  const long = { ...event, target_time: '30:00' };
  const plan = projectRace(long,[cp('start',0,0),...checkpoints.map(c=>({...c,order_index:c.order_index+1}))],{...emptyOperations('race'),stops:{start:10}})!;
  expect(plan.finish-start).toBe(1810*60000);
});
test('two colocated stations each retain their own stop', () => {
  const plan = projectRace(event,[cp('a',50,0),cp('b',50,1),cp('finish',100,2)],{...emptyOperations('race'),stops:{a:10,b:20},reports:[report('a','runner','in',300)]})!;
  expect(plan.rows[1].arrival).toBe(start+310*60000);
  expect(plan.finish).toBe(start+630*60000);
});
test('serialized changes preserve parallel station and vehicle edits and survive reload', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events',JSON.stringify([event]));
  await AsyncStorage.setItem('ultraedge_checkpoints',JSON.stringify({race:checkpoints}));
  await Promise.all([
    changeOperations('race', current=>({...current,stops:{half:20}})),
    changeOperations('race', current=>({...current,vehicles:[{id:'v',name:'Van',ownerId:null,crewIds:[]}]})),
  ]);
  const saved = await loadOperations('race');
  expect(saved.stops.half).toBe(20);expect(saved.vehicles[0].name).toBe('Van');
  await deleteLocalEvent('race');
  expect(JSON.parse((await AsyncStorage.getItem(OPERATIONS_KEY))!)).toEqual([]);
});
test('deleted station and crew references are excluded without deleting vehicles', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events',JSON.stringify([event]));
  await AsyncStorage.setItem(OPERATIONS_KEY,JSON.stringify([{...emptyOperations('race'),stops:{deleted:30},duties:[{checkpointId:'deleted',crewMemberId:'missing',role:'support'}],vehicles:[{id:'v',name:'Van',ownerId:'missing',crewIds:['missing']}],reports:[report('deleted','runner','in',300)]}]));
  const saved = await loadOperations('race');
  expect(saved.stops).toEqual({});expect(saved.duties).toEqual([]);expect(saved.reports).toEqual([]);expect(saved.vehicles[0]).toMatchObject({ownerId:null,crewIds:[]});
});

test('different race logistics stay independent and invalid settings never persist', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([event,{...event,id:'second'}]));
  await changeOperations('race',current=>({...current,variation:20}));
  await expect(changeOperations('race',current=>({...current,variation:99}))).rejects.toThrow();
  expect((await loadOperations('race')).variation).toBe(20);
  expect((await loadOperations('second')).variation).toBe(10);
});
