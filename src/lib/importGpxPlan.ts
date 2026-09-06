import type { Checkpoint, Event } from './database.types';
import { eventStatsFromRoute, FEET_PER_METER, GpxRouteStats } from './gpx';
import { commitPlanWrites, readArray, readCheckpointMap, runLocalPlanOperation } from './localPlanStorage';

/** Save route and extracted checkpoints together, preserving all existing planning details. */
export async function saveGpxPlan(eventId: string, uri: string, stats: GpxRouteStats): Promise<number> {
  return runLocalPlanOperation(async () => {
    const events = await readArray<Event>('@ultraedge/events');
    const event = events.find(e => e.id === eventId);
    if (!event) throw new Error('This event was deleted. Refresh before importing.');
    const map = await readCheckpointMap<Checkpoint>();
    const existing = map[eventId] || [];
    const next = [...existing];
    const now = new Date().toISOString();
    for (const marker of stats.checkpoints || []) {
      if (next.some(cp => cp.name === marker.name && cp.latitude != null && cp.longitude != null && Math.abs(cp.latitude - marker.lat) < 0.00001 && Math.abs(cp.longitude - marker.lon) < 0.00001)) continue;
      next.push({
        id: `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
        event_id: eventId, name: marker.name, checkpoint_type: 'other', order_index: Math.max(-1, ...next.map(cp => cp.order_index)) + 1,
        distance_from_start: marker.distanceMi, elevation: marker.ele == null ? null : marker.ele * FEET_PER_METER,
        latitude: marker.lat, longitude: marker.lon, location_description: marker.description,
        cutoff_time: null, cutoff_duration: null, estimated_arrival: null, estimated_duration: null,
        has_crew_access: false, has_drop_bag: false, has_pacer_pickup: false, has_pacer_dropoff: false,
        aid_supplies: [], notes: 'Imported from GPX. Course distance is estimated; verify the correct visit on loops or out-and-back routes. Confirm checkpoint type, access and cutoffs with the race organizer.',
        created_at: now, updated_at: now,
      });
    }
    // Preserve established checkpoint ordering; new markers arrive in course order.
    map[eventId] = next;
    await commitPlanWrites([
      ['ultraedge_checkpoints', JSON.stringify(map)],
      ['@ultraedge/events', JSON.stringify(events.map(e => e.id === eventId ? {
        ...e, ...eventStatsFromRoute(stats, e.distance_unit, e.elevation_unit), gpx_file_url: uri, updated_at: now,
      } : e))],
    ]);
    return next.length - existing.length;
  });
}
