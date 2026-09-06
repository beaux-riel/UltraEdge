import { Directory, File, Paths } from 'expo-file-system';
import { computeRouteMetrics, GpxRouteStats, parseGpx, parseGpxCheckpoints } from './gpx';

/** Stage a validated local route; publish its reference only after persistence succeeds. */
export async function importLocalGpx(
  sourceUri: string,
  eventId: string,
  save: (uri: string, stats: GpxRouteStats) => Promise<void>,
): Promise<string> {
  const source = new File(sourceUri);
  if (source.size > 10 * 1024 * 1024) throw new Error('Choose a GPX file smaller than 10 MB.');
  const xml = await source.text();
  const metrics = computeRouteMetrics(parseGpx(xml));
  if (!metrics) throw new Error('This GPX needs at least two valid course points.');
  const dir = new Directory(Paths.document, 'gpx');
  dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `${eventId}-${Date.now()}-${Math.random().toString(36).slice(2)}.gpx`);
  source.copy(dest);
  // Keep staged data recoverable if a journaled save fails midway.
  await save(dest.uri, {
    checkpoints: parseGpxCheckpoints(xml, metrics),
    totalDistanceMi: metrics.totalDistanceMi,
    elevationGainFt: metrics.elevationGainFt,
    elevationLossFt: metrics.elevationLossFt,
  });
  return dest.uri;
}
