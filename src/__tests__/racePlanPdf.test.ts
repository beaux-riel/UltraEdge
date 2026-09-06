import { buildRacePlanHtml, loadGpxXmlForEvent, exportRacePlan, RacePlanData } from '../lib/racePlanPdf';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

let mockXml = '';
const mockOpenedFiles: string[] = [];
jest.mock('expo-file-system', () => ({
  File: class { constructor(uri: string) { mockOpenedFiles.push(uri); } exists = true; uri = 'file:///plan.pdf'; text = async () => mockXml; delete() {} move() {} },
  Directory: class { create() {} }, Paths: { document: { uri: 'file:///new-container/Documents/' }, cache: 'file:///cache' },
}));
jest.mock('expo-print', () => ({ printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///plan.pdf' }) }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('../lib/gpxStorage', () => ({ isRemoteGpxPath: (path: string) => !path.startsWith('file:'), downloadGpx: jest.fn() }));
const plan = {
  event: { name: 'Mountain 100 <Trail>', event_date: '2026-09-05', event_time: '05:00', total_distance: 161,
    distance_unit: 'kilometers', elevation_unit: 'meters', total_elevation_gain: 8000, gpx_file_url: 'file:///course.gpx' },
  checkpoints: [], crew: [],
  gear: [{ name: 'Headlamp', category: 'safety', quantity: 2, notes: 'Spare batteries at km 80 <mandatory>' }],
  dropBags: [{ name: 'Summit bag', checkpointName: 'Summit aid', items: [] }],
} as unknown as RacePlanData;

it('keeps essential packing notes and named empty bags in the exported plan', () => {
  const html = buildRacePlanHtml(plan);
  expect(html).toContain('Spare batteries at km 80 &lt;mandatory&gt;');
  expect(html).toContain('Summit bag'); expect(html).toContain('No items listed.');
  expect(html).toContain('161 km'); expect(html).toContain('8,000 m');
  expect(html).toContain('September 5, 2026');
  expect(html).toContain('Mountain 100 &lt;Trail&gt;');
});
it('labels omitted saved routes in the shared document, including malformed routes', () => {
  expect(buildRacePlanHtml(plan)).toContain('Course Route Unavailable');
  expect(buildRacePlanHtml({ ...plan, gpxXml: '<broken>' })).toContain('Course Route Unavailable');
});
it('treats malformed and one-point cached GPX as unavailable so export can ask first', async () => {
  mockXml = '<broken>';
  expect(await loadGpxXmlForEvent('race', 'file:///course.gpx')).toBeNull();
  mockXml = '<gpx><trk><trkseg><trkpt lat="45" lon="-120"/></trkseg></trk></gpx>';
  expect(await loadGpxXmlForEvent('race', 'file:///course.gpx')).toBeNull();
});
it('surfaces native print failure and does not share an incomplete document', async () => {
  (Print.printToFileAsync as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
  await expect(exportRacePlan(plan)).rejects.toThrow('Disk full');
  expect(Sharing.shareAsync).not.toHaveBeenCalled();
});
it('surfaces unavailable sharing', async () => {
  (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
  await expect(exportRacePlan(plan)).rejects.toThrow('Sharing is not available');
  expect(Sharing.shareAsync).not.toHaveBeenCalled();
});

it('loads the preserved route from the new sandbox after app update', async () => {
  mockXml = '<gpx><trk><trkseg><trkpt lat="45" lon="-120"/><trkpt lat="45.01" lon="-120"/></trkseg></trk></gpx>';
  expect(await loadGpxXmlForEvent('race', 'file:///old-container/Documents/gpx/race.gpx')).toBe(mockXml);
  expect(mockOpenedFiles).toContain('file:///new-container/Documents/gpx/race.gpx');
});
