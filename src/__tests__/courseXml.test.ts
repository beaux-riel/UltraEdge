import { readFileSync } from 'fs';
import { resolve } from 'path';
import { normalizeCourseXml } from '../lib/courseXml';
import { parseGpx, parseGpxCheckpoints, computeRouteMetrics } from '../lib/gpx';
const fixture = (name: string) => readFileSync(resolve(__dirname, '../../docs/release/fixtures', name), 'utf8');
it('normalizes the original Fat Dog KML to exactly the GPX route and checkpoints', () => {
  const gpx = fixture('fatdog-120-gaia.xml');
  const normalized = normalizeCourseXml(fixture('fatdog-120-gaia.kml'));
  expect(parseGpx(normalized)).toEqual(parseGpx(gpx));
  const metrics = computeRouteMetrics(parseGpx(gpx))!;
  expect(parseGpxCheckpoints(normalized, metrics)).toEqual(parseGpxCheckpoints(gpx, metrics));
});
it('preserves GPX input and rejects unrelated or malformed XML', () => {
  expect(normalizeCourseXml('<gpx/>')).toBe('<gpx/>');
  expect(() => normalizeCourseXml('<document/>')).toThrow('GPX or KML');
  expect(() => normalizeCourseXml('<kml>')).toThrow();
});
const kml = (body: string) => `<kml xmlns="http://www.opengis.net/kml/2.2">${body}</kml>`;
const line = (coords: string) => `<LineString><coordinates>${coords}</coordinates></LineString>`;
it('rejects disconnected sections, competing courses, invalid coordinates and point-only files', () => {
  expect(() => normalizeCourseXml(kml(`<Placemark>${line('0,0 0,1')}${line('10,10 10,11')}</Placemark>`))).toThrow('disconnected');
  expect(() => normalizeCourseXml(kml(`<Placemark>${line('0,0 0,1')}</Placemark><Placemark>${line('0,1 0,2')}</Placemark>`))).toThrow('multiple courses');
  expect(() => normalizeCourseXml(kml(`<Placemark>${line('bad,0 0,1')}</Placemark>`))).toThrow('invalid');
  expect(() => normalizeCourseXml(kml('<Placemark><Point><coordinates>0,0</coordinates></Point></Placemark>'))).toThrow('no supported');
});
it('escapes marker text and preserves optional elevations with prefixed KML', () => {
  const xml = '<k:kml xmlns:k="http://www.opengis.net/kml/2.2"><k:Placemark><k:name>A &amp; B</k:name><k:description><![CDATA[<aid>]]></k:description><k:Point><k:coordinates>0,0</k:coordinates></k:Point></k:Placemark><k:Placemark><k:LineString><k:coordinates>0,0 0,1,100</k:coordinates></k:LineString></k:Placemark></k:kml>';
  const normalized = normalizeCourseXml(xml), points = parseGpx(normalized);
  expect(points[0].ele).toBeUndefined();
  expect(points[1].ele).toBe(100);
  expect(parseGpxCheckpoints(normalized, computeRouteMetrics(points)!)[0]).toMatchObject({ name: 'A & B', description: '<aid>' });
});
