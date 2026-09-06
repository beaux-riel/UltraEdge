import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeRouteMetrics, parseGpx, parseGpxCheckpoints } from '../lib/gpx';
import { saveGpxPlan } from '../lib/importGpxPlan';
import { runLocalPlanOperation, readCheckpointMap } from '../lib/localPlanStorage';

const xml = `<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg><trkpt lat="0" lon="0"/><trkpt lat="0" lon="1"/></trkseg></trk>${Array.from({length:20}, (_, i) => `<wpt lat="0" lon="${(i+1)/21}"><name>CP ${i+1}</name><ele>100</ele><desc>Race marker</desc></wpt>`).join('')}</gpx>`;
const metrics = computeRouteMetrics(parseGpx(xml))!;
const checkpoints = parseGpxCheckpoints(xml, metrics);
beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([{id:'race', distance_unit:'kilometers', elevation_unit:'meters'}, {id:'other'}]));
});
it('extracts all 20 waypoints with interpolated course mileage and metadata', () => {
  expect(checkpoints).toHaveLength(20);
  expect(checkpoints[0]).toMatchObject({name:'CP 1', ele:100, description:'Race marker'});
  expect(checkpoints[0].distanceMi).toBeCloseTo(metrics.totalDistanceMi / 21, 5);
  expect(checkpoints[19].distanceMi).toBeCloseTo(metrics.totalDistanceMi * 20 / 21, 5);
});
it('supports prefixed GPX, named route/track points and skips invalid coordinates and ordinary samples', () => {
  const source = '<g:gpx xmlns:g="http://www.topografix.com/GPX/1/1"><g:trk><g:trkseg><g:trkpt lat="0" lon="0"/><g:trkpt lat="0" lon="1"><g:name>Finish</g:name></g:trkpt></g:trkseg></g:trk><g:wpt lat="999" lon="0"/><g:rte><g:rtept lat="0" lon="0.5"><g:name>Aid</g:name></g:rtept></g:rte></g:gpx>';
  const route = computeRouteMetrics(parseGpx(source))!;
  expect(parseGpxCheckpoints(source, route).map(p => p.name)).toEqual(['Aid', 'Finish']);
  expect(parseGpxCheckpoints('<gpx><trk><trkseg><trkpt lat="0" lon="0"/><trkpt lat="0" lon="1"/></trkseg></trk></gpx>', route)).toEqual([]);
});
it('saves checkpoints and route, deduplicates reimport, preserves edited fields and other races', async () => {
  const stats = {...metrics, checkpoints};
  expect(await saveGpxPlan('race', 'file:///course.gpx', stats)).toBe(20);
  let map = await readCheckpointMap<any>();
  map.race[0].notes = 'Bring gels'; map.race[0].has_drop_bag = true;
  map.other = [{id:'unrelated'}];
  await AsyncStorage.setItem('ultraedge_checkpoints', JSON.stringify(map));
  expect(await saveGpxPlan('race', 'file:///course.gpx', stats)).toBe(0);
  map = await readCheckpointMap<any>();
  expect(map.race).toHaveLength(20);
  expect(map.race[0]).toMatchObject({notes:'Bring gels',has_drop_bag:true});
  expect(map.race[0].elevation).toBeCloseTo(328.084);
  expect(map.other).toEqual([{id:'unrelated'}]);
  const events = JSON.parse((await AsyncStorage.getItem('@ultraedge/events'))!);
  expect(events[0].gpx_file_url).toBe('file:///course.gpx');
  expect(events[0].total_distance).toBeCloseTo(metrics.totalDistanceMi * 1.609344, 0);
});
it('recovers both records after an interrupted write and rejects deleted races', async () => {
  const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(original).mockRejectedValueOnce(new Error('Disk full'));
  await expect(saveGpxPlan('race', 'file:///staged.gpx', {...metrics, checkpoints})).rejects.toThrow('Disk full');
  (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
  await runLocalPlanOperation(async () => {});
  expect((await readCheckpointMap<any>()).race).toHaveLength(20);
  expect(JSON.parse((await AsyncStorage.getItem('@ultraedge/events'))!)[0].gpx_file_url).toBe('file:///staged.gpx');
  await expect(saveGpxPlan('deleted', 'file:///x', {...metrics, checkpoints})).rejects.toThrow('deleted');
});
