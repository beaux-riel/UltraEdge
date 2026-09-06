import { resolveLocalGpxUri } from '../lib/localGpxUri';
const documents = 'file:///new-container/Documents/';
it('finds the preserved course after an iOS update relocates its data container', () => {
  const old = 'file:///old-container/Documents/gpx/race-123.gpx';
  expect(resolveLocalGpxUri(old, documents)).toBe('file:///new-container/Documents/gpx/race-123.gpx');
});
it('is stable for current-container URIs and preserves encoded filenames', () => {
  const current = 'file:///new-container/Documents/gpx/race%20day.gpx';
  expect(resolveLocalGpxUri(current, documents)).toBe(current);
});
it.each([
  'file:///old-container/Library/Caches/course.gpx',
  'file:///old-container/Documents/other/course.gpx',
  'file:///old-container/Documents/gpx/../secret',
  'file:///old-container/Documents/gpx/%2E%2E',
  'file:///old-container/Documents/gpx/a%2Fb.gpx',
  'file:///old-container/Documents/gpx/%GG',
])('does not reinterpret files outside the app-owned GPX directory: %s', uri => {
  expect(resolveLocalGpxUri(uri, documents)).toBe(uri);
});
