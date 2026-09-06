import AsyncStorage from '@react-native-async-storage/async-storage';
import { Checkpoint, Event } from './database.types';
import { readArray, readCheckpointMap, requireLocalEvent, runLocalPlanOperation } from './localPlanStorage';
import { parseDateOnly } from './dateOnly';

export const OPERATIONS_KEY = '@ultraedge/race-operations';
export interface StationDuty { checkpointId: string; crewMemberId: string; role: 'support' | 'first_aid' | 'pacer'; }
export interface RaceVehicle { id: string; name: string; ownerId: string | null; crewIds: string[]; }
export interface CargoAllocation { key: string; label: string; vehicleId: string; }
export interface TimeReport { checkpointId: string; source: 'runner' | 'crew'; kind: 'in' | 'out'; at: string; recordedAt: string; }
export interface RaceOperations {
  id: string;
  variation: number;
  startAt: string | null;
  stops: Record<string, number>;
  duties: StationDuty[];
  vehicles: RaceVehicle[];
  cargo: CargoAllocation[];
  reports: TimeReport[];
}
export const emptyOperations = (id: string): RaceOperations => ({ id, variation: 10, startAt: null, stops: {}, duties: [], vehicles: [], cargo: [], reports: [] });
async function cleanOperations(ops: RaceOperations): Promise<RaceOperations> {
  const cps = new Set(((await readCheckpointMap<Checkpoint>())[ops.id] ?? []).map(cp => cp.id));
  const crew = new Set((await readArray<{ eventId: string; crewMemberId: string }>('@ultraedge/event-crew')).filter(row => row.eventId === ops.id).map(row => row.crewMemberId));
  const bags = (await readArray<{ id: string; eventId: string; items: { id: string }[] }>('@ultraedge/dropbags')).filter(row => row.eventId === ops.id);
  const gear = (await readArray<{ eventId: string; gearItemId: string }>('@ultraedge/event-gear')).filter(row => row.eventId === ops.id);
  const keys = new Set([...bags.flatMap(bag => [`bag:${bag.id}`, ...bag.items.map(item => `item:${bag.id}:${item.id}`)]), ...gear.map(item => `gear:${item.gearItemId}`)]);
  return { ...ops, stops: Object.fromEntries(Object.entries(ops.stops).filter(([id]) => cps.has(id))),
    reports: ops.reports.filter(row => cps.has(row.checkpointId)), duties: ops.duties.filter(row => cps.has(row.checkpointId) && crew.has(row.crewMemberId)),
    vehicles: ops.vehicles.map(v => ({ ...v, ownerId: v.ownerId && crew.has(v.ownerId) ? v.ownerId : null, crewIds: v.crewIds.filter(id => crew.has(id)) })),
    cargo: ops.cargo.filter(row => keys.has(row.key) && ops.vehicles.some(v => v.id === row.vehicleId)) };
}
export async function loadOperations(id: string): Promise<RaceOperations> {
  return runLocalPlanOperation(async () => cleanOperations((await readArray<RaceOperations>(OPERATIONS_KEY)).find(row => row.id === id) ?? emptyOperations(id)));
}
export async function changeOperations(id: string, change: (current: RaceOperations) => RaceOperations): Promise<RaceOperations> {
  return runLocalPlanOperation(async () => {
    await requireLocalEvent(id);
    const rows = await readArray<RaceOperations>(OPERATIONS_KEY);
    const next = await cleanOperations(change(await cleanOperations(rows.find(row => row.id === id) ?? emptyOperations(id))));
    if (!Number.isFinite(next.variation) || next.variation < 0 || next.variation > 50) throw new Error('Choose a variation from 0 to 50%.');
    if (Object.values(next.stops).some(value => !Number.isFinite(value) || value < 0 || value > 1440)) throw new Error('Stop durations must be between 0 and 1440 minutes.');
    const event = (await readArray<Event>('@ultraedge/events')).find(event => event.id === id)!;
    const start = raceStart(event, next);
    if (next.startAt && (start === null || start > Date.now())) throw new Error('Actual start must be a valid time no later than now.');
    let previous = start;
    for (const cp of [...((await readCheckpointMap<Checkpoint>())[id] ?? [])].sort((a,b) => a.order_index - b.order_index)) {
      for (const kind of ['in', 'out'] as const) {
        const average = reportAverage(next.reports, cp.id, kind);
        if (average !== null) {
          if (!Number.isFinite(average) || previous === null || average < previous) throw new Error('Time reports must follow the start and checkpoint order. Correct the conflicting reports first.');
          previous = average;
        }
      }
    }
    await AsyncStorage.setItem(OPERATIONS_KEY, JSON.stringify([...rows.filter(row => row.id !== id), next]));
    return next;
  });
}
export function durationMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d+):([0-5]\d)(?::([0-5]\d))?$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) + Number(match[3] || 0) / 60 : null;
}
export function raceStart(event: Event, ops: RaceOperations): number | null {
  if (ops.startAt) return Number.isFinite(Date.parse(ops.startAt)) ? Date.parse(ops.startAt) : null;
  const date = parseDateOnly(event.event_date);
  const match = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/.exec(event.event_time || '');
  if (!date || !match || Number(match[1]) > 23) return null;
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.getTime();
}
export function reportAverage(reports: TimeReport[], checkpointId: string, kind: TimeReport['kind']): number | null {
  const rows = reports.filter(row => row.checkpointId === checkpointId && row.kind === kind);
  if (!rows.length) return null;
  return rows.reduce((sum, row) => sum + Date.parse(row.at), 0) / rows.length;
}
export function putTimeReport(ops: RaceOperations, report: TimeReport, checkpoints: Checkpoint[], start: number | null): RaceOperations {
  const at = Date.parse(report.at);
  if (!Number.isFinite(at) || start === null || at < start || at > Date.now() + 60000) throw new Error('Record a time between race start and now.');
  if (!checkpoints.some(cp => cp.id === report.checkpointId)) throw new Error('Checkpoint no longer exists.');
  const reports = [...ops.reports.filter(row => !(row.checkpointId === report.checkpointId && row.source === report.source && row.kind === report.kind)), report];
  for (const source of ['runner', 'crew'] as const) {
    const arrival = reports.find(row => row.checkpointId === report.checkpointId && row.source === source && row.kind === 'in');
    const departure = reports.find(row => row.checkpointId === report.checkpointId && row.source === source && row.kind === 'out');
    if (arrival && departure && Date.parse(departure.at) < Date.parse(arrival.at)) throw new Error('Departure cannot precede arrival for the same reporter.');
  }
  let previous = start;
  for (const cp of [...checkpoints].sort((a,b) => a.order_index - b.order_index)) {
    for (const kind of ['in', 'out'] as const) {
      const average = reportAverage(reports, cp.id, kind);
      if (average !== null) {
        if (average < previous) throw new Error('These times put a departure before arrival or a later station before an earlier one. Correct the report first.');
        previous = average;
      }
    }
  }
  return { ...ops, reports };
}
export interface ProjectionRow { id: string; name: string; distance: number; arrival: number; departure: number; best: number; slow: number; actualIn: number | null; actualOut: number | null; stop: number; }
export interface Projection { rows: ProjectionRow[]; start: number; movingMinutes: number; finish: number; bestFinish: number; slowFinish: number; stopMinutes: number; lastReport: string | null; }
export function projectRace(event: Event, checkpoints: Checkpoint[], ops: RaceOperations): Projection | null {
  const start = raceStart(event, ops);
  const moving = durationMinutes(event.target_time);
  const total = event.total_distance;
  if (start === null || !moving || !total || !Number.isFinite(total) || total <= 0) return null;
  const cps = [...checkpoints].sort((a,b) => a.order_index - b.order_index);
  let lastDistance = 0;
  if (cps.some(cp => { const distance = cp.distance_from_start; const invalid = distance === null || !Number.isFinite(distance) || distance < lastDistance || distance > total; lastDistance = distance ?? lastDistance; return invalid; })) return null;
  // Anchor remaining travel at the latest observation, excluding station dwell from observed moving pace.
  let anchorTime = start, anchorDistance = 0, observedStops = 0, cumulativeStops = 0, anchorStop = 0, anchorIndex = -1;
  let scale = 1;
  cps.forEach((cp, index) => {
    const actualIn = reportAverage(ops.reports, cp.id, 'in');
    const actualOut = reportAverage(ops.reports, cp.id, 'out');
    const stop = ops.stops[cp.id] ?? durationMinutes(cp.estimated_duration) ?? 0;
    const dwell = actualIn !== null && actualOut !== null ? (actualOut - actualIn) / 60000 : stop;
    if (actualIn !== null || actualOut !== null) {
      anchorIndex = index;
      anchorDistance = cp.distance_from_start!;
      anchorTime = actualOut ?? actualIn!;
      anchorStop = actualOut !== null ? 0 : stop;
      const baseline = moving * anchorDistance / total;
      if (baseline > 0) scale = Math.max(0.01, ((anchorTime - start) / 60000 - observedStops - (actualOut !== null ? dwell : 0)) / baseline);
    }
    observedStops += dwell;
  });
  let plannedElapsed = 0, previousDistance = 0;
  let futureStops = anchorStop;
  const rows = cps.map((cp, index) => {
    const distance = cp.distance_from_start!;
    const stop = ops.stops[cp.id] ?? durationMinutes(cp.estimated_duration) ?? 0;
    const actualIn = reportAverage(ops.reports, cp.id, 'in');
    const actualOut = reportAverage(ops.reports, cp.id, 'out');
    plannedElapsed += moving * (distance - previousDistance) / total;
    let arrival = start + plannedElapsed * 60000, best = start + (plannedElapsed - cumulativeStops) * (1 - ops.variation / 100) * 60000 + cumulativeStops * 60000;
    let slow = start + (plannedElapsed - cumulativeStops) * (1 + ops.variation / 100) * 60000 + cumulativeStops * 60000;
    if (index > anchorIndex) {
      const travel = moving * (distance - anchorDistance) / total * scale;
      arrival = anchorTime + (travel + futureStops) * 60000;
      best = anchorTime + (travel * (1 - ops.variation / 100) + futureStops) * 60000;
      slow = anchorTime + (travel * (1 + ops.variation / 100) + futureStops) * 60000;
      futureStops += stop;
    }
    if (actualIn !== null) arrival = best = slow = actualIn;
    const departure = actualOut ?? arrival + stop * 60000;
    plannedElapsed += stop; cumulativeStops += stop; previousDistance = distance;
    return { id: cp.id, name: cp.name, distance, arrival, departure, best, slow, actualIn, actualOut, stop };
  });
  const remainingTravel = moving * (total - anchorDistance) / total * scale;
  const finish = anchorTime + (remainingTravel + futureStops) * 60000;
  return { rows, start, movingMinutes: moving, finish, bestFinish: anchorTime + (remainingTravel * (1 - ops.variation / 100) + futureStops) * 60000, slowFinish: anchorTime + (remainingTravel * (1 + ops.variation / 100) + futureStops) * 60000, stopMinutes: cumulativeStops, lastReport: ops.reports.map(row => row.recordedAt).sort().pop() ?? null };
}
export function clockLabel(time: number): string {
  return new Date(time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Interpolate progress through travel segments; remain at the station during its dwell. */
export function projectedDistance(projection: Projection, total: number, time: number, scenario: 'best' | 'arrival' | 'slow' = 'arrival'): number {
  let previousTime = projection.start, previousDistance = 0;
  for (const row of projection.rows) {
    const arrival = row[scenario];
    if (time < arrival) return Math.max(0, previousDistance + (row.distance - previousDistance) * Math.max(0, time - previousTime) / Math.max(1, arrival - previousTime));
    const departure = row.actualOut ?? arrival + row.stop * 60000;
    if (time <= departure) return row.distance;
    previousTime = departure; previousDistance = row.distance;
  }
  const finish = scenario === 'best' ? projection.bestFinish : scenario === 'slow' ? projection.slowFinish : projection.finish;
  return Math.min(total, previousDistance + (total - previousDistance) * Math.max(0, time - previousTime) / Math.max(1, finish - previousTime));
}

export function parseLocalRaceTime(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  const date = match ? parseDateOnly(match[1]) : null;
  if (!date || !match) throw new Error('Use a valid local time in YYYY-MM-DDTHH:MM format.');
  date.setHours(Number(match[2]), Number(match[3]), 0, 0);
  if (date.getHours() !== Number(match[2]) || date.getMinutes() !== Number(match[3])) throw new Error('That local time does not exist due to a clock change.');
  return date.toISOString();
}
