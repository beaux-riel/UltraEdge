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
