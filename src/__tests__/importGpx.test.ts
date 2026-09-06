import { readFileSync } from 'fs';
import { resolve } from 'path';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveGpxPlan } from '../lib/importGpxPlan';
import { readCheckpointMap } from '../lib/localPlanStorage';
import { importLocalGpx } from '../lib/importGpx';
let mockXml = '';
let mockSize = 100;
const mockCopy = jest.fn();
const mockDelete = jest.fn();
jest.mock('expo-file-system', () => ({
  File: class {
    uri: string; exists = true;
    constructor(base: unknown, name?: string) { this.uri = name ? `file:///gpx/${name}` : String(base); }
    get size() { return mockSize; }
    text = async () => mockXml;
    copy = mockCopy;
    delete() { mockDelete(this.uri); }
  },
  Directory: class { create() {} }, Paths: { document: 'file:///docs' },
}));
beforeEach(() => {
  jest.clearAllMocks(); mockSize = 100;
  mockXml = '<gpx><trk><trkseg><trkpt lat="45" lon="-120"/><trkpt lat="45.01" lon="-120"/></trkseg></trk></gpx>';
});
it('does not copy or change the saved route for invalid or oversized imports', async () => {
  const save = jest.fn(); mockSize = 11 * 1024 * 1024;
  await expect(importLocalGpx('file:///picked.gpx', 'race', save)).rejects.toThrow('10 MB');
  mockSize = 100; mockXml = '<gpx/>';
  await expect(importLocalGpx('file:///picked.gpx', 'race', save)).rejects.toThrow('two valid');
  expect(save).not.toHaveBeenCalled(); expect(mockCopy).not.toHaveBeenCalled();
});
it('keeps the staged file recoverable when a journaled save fails', async () => {
  const save = jest.fn().mockRejectedValue(new Error('Disk full'));
  await expect(importLocalGpx('file:///old.gpx', 'race', save)).rejects.toThrow('Disk full');
  const staged = save.mock.calls[0][0];
  expect(staged).not.toBe('file:///old.gpx');
  expect(mockDelete).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalledWith('file:///old.gpx');
});
it('returns a new file only after the saved reference succeeds', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const uri = await importLocalGpx('file:///picked.gpx', 'race', save);
  expect(save).toHaveBeenCalledWith(uri, expect.objectContaining({ elevationGainFt: null }));
  expect(mockDelete).not.toHaveBeenCalled();
});

it('imports the original Gaia Fat Dog XML into 15 ordered, persistent checkpoints without duplicating reimports', async () => {
  mockXml = readFileSync(resolve(__dirname, '../../docs/release/fixtures/fatdog-120-gaia.xml'), 'utf8');
  mockSize = Buffer.byteLength(mockXml);
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([{ id: 'fatdog', distance_unit: 'miles', elevation_unit: 'feet' }]));
  const save = async (uri: string, stats: Parameters<typeof saveGpxPlan>[2]) => {
    await saveGpxPlan('fatdog', uri, stats);
  };
  await importLocalGpx('file:///fatdog.xml', 'fatdog', save);
  const checkpoints = (await readCheckpointMap<any>()).fatdog;
  expect(checkpoints.map(cp => cp.name)).toEqual([
    'Start Line', 'Cathedral Aid Station', 'Ashnola Aid Station', 'Trapper Aid Station',
    'Calcite Aid Station', 'Pasayten Aid Station', 'Bonnevier Aid Station', 'Heather Aid Station',
    'Nicomen Aid Station', 'Grainger Creek Aid Station', 'Hope Pass Aid Station',
    'Blackwall Peak Aid Station', "Windy Joe's Aid Station", 'Strawberry Flats Aid Station', 'Finish Line',
  ]);
  expect(checkpoints[0].distance_from_start).toBeCloseTo(0, 1);
  expect(checkpoints[14].distance_from_start).toBeCloseTo(122.83, 2);
  expect(checkpoints[4].location_description).toBe('Major Aid Station, drop bags, no crew access');
  expect(checkpoints[4].has_crew_access).toBe(false);
  expect(checkpoints[1].elevation).toBeCloseTo(2141 * 3.28084);
  await importLocalGpx('file:///fatdog.xml', 'fatdog', save);
  expect((await readCheckpointMap<any>()).fatdog.map(cp => cp.id)).toEqual(checkpoints.map(cp => cp.id));
});
it('rejects XML that is not GPX before copying or saving', async () => {
  mockXml = '<document><point lat="45" lon="-120"/></document>';
  const save = jest.fn();
  await expect(importLocalGpx('file:///unrelated.xml', 'race', save)).rejects.toThrow('Choose a GPX');
  expect(save).not.toHaveBeenCalled();
  expect(mockCopy).not.toHaveBeenCalled();
});
