import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { haversineMiles } from './gpx';

/** Normalize supported KML course geometry into the GPX used by storage and preview. */
export function normalizeCourseXml(xml: string): string {
  const doc = new DOMParser({ onError: () => { throw new Error('The course file contains malformed XML.'); } }).parseFromString(xml, 'text/xml');
  if (doc.documentElement?.localName === 'gpx') return xml;
  if (doc.documentElement?.localName !== 'kml') throw new Error('Choose a GPX or KML course file.');
  const ns = 'http://www.opengis.net/kml/2.2';
  const output = new DOMParser().parseFromString('<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="UltraEdge"><rte/></gpx>', 'text/xml');
  const root = output.documentElement!;
  const route = root.firstChild!;
  const gp = 'http://www.topografix.com/GPX/1/1';
  const tuple = (raw: string) => {
    const values = raw.split(',');
    const lon = Number(values[0]?.trim() || NaN), lat = Number(values[1]?.trim() || NaN);
    const ele = Number(values[2]?.trim() || NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('The KML contains invalid course coordinates.');
    return { lat, lon, ele };
  };
  const addPoint = (raw: string, tag: string, name = '', description = '') => {
    const p = tuple(raw), node = output.createElementNS(gp, tag);
    node.setAttribute('lat', String(p.lat)); node.setAttribute('lon', String(p.lon));
    for (const [key, value] of [['ele', Number.isFinite(p.ele) ? String(p.ele) : ''], ['name', name], ['desc', description]]) {
      if (!value) continue;
      const child = output.createElementNS(gp, key); child.appendChild(output.createTextNode(value)); node.appendChild(child);
    }
    if (tag === 'wpt') root.insertBefore(node, route); else route.appendChild(node);
    return p;
  };
  const placemarks = doc.getElementsByTagNameNS(ns, 'Placemark');
  let courseCount = 0;
  let previous: ReturnType<typeof tuple> | undefined;
  for (let i = 0; i < placemarks.length; i++) {
    const mark = placemarks[i];
    const field = (name: string) => {
      for (let child = mark.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 1 && (child as typeof mark).localName === name) return child.textContent?.trim() || '';
      }
      return '';
    };
    const points = mark.getElementsByTagNameNS(ns, 'Point');
    for (let j = 0; j < points.length; j++) {
      const raw = points[j].getElementsByTagNameNS(ns, 'coordinates')[0]?.textContent?.trim();
      if (raw) addPoint(raw, 'wpt', field('name'), field('description'));
    }
    const lines = mark.getElementsByTagNameNS(ns, 'LineString');
    if (lines.length && ++courseCount > 1) throw new Error('This KML contains multiple courses. Export one course at a time.');
    for (let j = 0; j < lines.length; j++) {
      const raw = lines[j].getElementsByTagNameNS(ns, 'coordinates')[0]?.textContent?.trim();
      if (!raw) continue;
      const samples = raw.split(/\s+/), first = tuple(samples[0]);
      if (previous && haversineMiles(previous.lat, previous.lon, first.lat, first.lon) * 1609.344 > 50) {
        throw new Error('The KML course sections are disconnected. Export a continuous course.');
      }
      for (const sample of samples) previous = addPoint(sample, 'rtept');
    }
  }
  if (!previous) throw new Error('This KML has no supported course line. Export a course with LineString geometry.');
  return new XMLSerializer().serializeToString(output);
}
