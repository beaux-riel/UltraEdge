import { Directory, File, Paths } from 'expo-file-system';
import { computeRouteMetrics, GpxRouteStats, parseGpx } from './gpx';

/** Stage a validated local route; publish its reference only after persistence succeeds. */
export async function importLocalGpx(
  sourceUri: string,
  eventId: string,
  save: (uri: string, stats: GpxRouteStats) => Promise<void>,
): Promise<string> {
  const source = new File(sourceUri);
  if (source.size > 10 * 1024 * 1024) throw new Error('Choose a GPX file smaller than 10 MB.');
  const metrics = computeRouteMetrics(parseGpx(await source.text()));
  if (!metrics) throw new Error('This GPX needs at least two valid course points.');
  const dir = new Directory(Paths.document, 'gpx');
  dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `${eventId}-${Date.now()}-${Math.random().toString(36).slice(2)}.gpx`);
  try {
    source.copy(dest);
    await save(dest.uri, {
      totalDistanceMi: metrics.totalDistanceMi,
      elevationGainFt: metrics.elevationGainFt,
      elevationLossFt: metrics.elevationLossFt,
    });
  } catch (error) {
    try { if (dest.exists) dest.delete(); } catch { /* Preserve the original save error. */ }
    throw error;
  }
  return dest.uri;
}
