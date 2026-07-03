/**
 * Race Plan PDF generation.
 *
 * Builds a print-ready HTML race guide (cover, route map + elevation profile,
 * checkpoints, crew roster, gear checklist, drop bags) and renders it to PDF
 * via expo-print, then hands it to the OS share sheet via expo-sharing.
 *
 * The HTML builder is pure (data in, string out) so it stays unit-testable;
 * only `loadGpxXmlForEvent` / `exportRacePlan` touch the filesystem.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';

import { Checkpoint, DistanceUnit, ElevationUnit, Event } from './database.types';
import {
  computeRouteMetrics,
  elevationSamples,
  formatFeet,
  formatMiles,
  niceTicks,
  parseGpx,
  RouteMetrics,
} from './gpx';
import { downloadGpx, isRemoteGpxPath } from './gpxStorage';

// ============================================================================
// TYPES
// ============================================================================

/** Crew member shaped for the plan (already resolved to display strings). */
export interface RacePlanCrewMember {
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

/** Gear item shaped for the checklist. */
export interface RacePlanGearItem {
  name: string;
  brand?: string | null;
  category: string;
  quantity: number;
  isWorn?: boolean;
  isCarried?: boolean;
  notes?: string | null;
}

export interface RacePlanDropBagItem {
  name: string;
  quantity: number;
  notes?: string | null;
}

export interface RacePlanDropBag {
  name: string;
  checkpointName?: string | null;
  items: RacePlanDropBagItem[];
  notes?: string | null;
}

export interface RacePlanData {
  event: Event;
  checkpoints: Checkpoint[];
  crew: RacePlanCrewMember[];
  gear: RacePlanGearItem[];
  dropBags: RacePlanDropBag[];
  /** Raw GPX XML for the course, when the event has one. */
  gpxXml?: string | null;
}

// ============================================================================
// PALETTE (UltraEdge organic light palette — print is always light)
// ============================================================================

const FOREST = '#2D5A3D';
const TRAIL = '#8B6F47';
const SUNRISE = '#E07B4C';
const PARCHMENT = '#FAF7F2';
const CREAM = '#F5F0E6';
const BIRCH = '#EDE6D9';
const BARK = '#2C2416';
const STONE = '#6B5D4D';
const BORDER = '#E5DED3';

// ============================================================================
// UNIT HELPERS
// ============================================================================

const MILES_TO_KM = 1.609344;
const FEET_TO_M = 0.3048;

const distanceSuffix = (unit: DistanceUnit): string => (unit === 'kilometers' ? 'km' : 'mi');
const elevationSuffix = (unit: ElevationUnit): string => (unit === 'meters' ? 'm' : 'ft');

/** Format a distance measured in miles into the event's display unit. */
function fmtDistanceFromMiles(miles: number, unit: DistanceUnit): string {
  const value = unit === 'kilometers' ? miles * MILES_TO_KM : miles;
  return `${formatMiles(value)} ${distanceSuffix(unit)}`;
}

/** Format an elevation measured in feet into the event's display unit. */
function fmtElevationFromFeet(feet: number, unit: ElevationUnit): string {
  const value = unit === 'meters' ? feet * FEET_TO_M : feet;
  return `${formatFeet(value)} ${elevationSuffix(unit)}`;
}

/** Format a value already stored in the event's own unit. */
function fmtStoredDistance(value: number, unit: DistanceUnit): string {
  return `${formatMiles(value)} ${distanceSuffix(unit)}`;
}

function fmtStoredElevation(value: number, unit: ElevationUnit): string {
  return `${formatFeet(value)} ${elevationSuffix(unit)}`;
}

function fmtEventDate(eventDate: string | null): string | null {
  if (!eventDate) {return null;}
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? `${eventDate}T00:00:00` : eventDate;
  const date = new Date(iso);
  if (isNaN(date.getTime())) {return eventDate;}
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// HTML HELPERS
// ============================================================================

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const esc = (value: string | null | undefined): string => (value ? escapeHtml(value) : '');

/** 16px stroke icon used in section headers. */
function sectionIcon(paths: string): string {
  return (
    `<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="${FOREST}" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  );
}

const ICONS = {
  route: sectionIcon(
    '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>' +
      '<line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  ),
  elevation: sectionIcon(
    '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  ),
  checkpoint: sectionIcon(
    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  ),
  crew: sectionIcon(
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' +
      '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  ),
  gear: sectionIcon(
    '<polyline points="9 11 12 14 22 4"/>' +
      '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  ),
  dropBag: sectionIcon(
    '<rect x="2" y="7" width="20" height="14" rx="2"/>' +
      '<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  ),
};

function sectionHeader(icon: string, title: string): string {
  return `<div class="section-header">${icon}<h2>${escapeHtml(title)}</h2></div>`;
}

const check = '<span class="check">&#10003;</span>';
const dash = '<span class="dash">&ndash;</span>';

// ============================================================================
// ROUTE MAP SVG
// ============================================================================

/**
 * Inline SVG of the course drawn from GPX track points. Longitude is scaled
 * by cos(mid-latitude) so the shape is not horizontally distorted.
 */
export function buildRouteMapSvg(metrics: RouteMetrics, checkpoints: Checkpoint[]): string {
  const { points, bounds } = metrics;
  if (points.length < 2) {return '';}

  const midLat = ((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180);
  const lonScale = Math.max(Math.cos(midLat), 0.05);

  const spanX = Math.max((bounds.maxLon - bounds.minLon) * lonScale, 1e-6);
  const spanY = Math.max(bounds.maxLat - bounds.minLat, 1e-6);

  const width = 680;
  const pad = 20;
  const drawWidth = width - pad * 2;
  const rawHeight = drawWidth * (spanY / spanX);
  const drawHeight = Math.min(Math.max(rawHeight, 140), 420);
  const height = drawHeight + pad * 2;
  // Preserve aspect: fit inside the draw box using a single scale factor.
  const scale = Math.min(drawWidth / spanX, drawHeight / spanY);
  const offsetX = pad + (drawWidth - spanX * scale) / 2;
  const offsetY = pad + (drawHeight - spanY * scale) / 2;

  const project = (lat: number, lon: number): [number, number] => [
    offsetX + (lon - bounds.minLon) * lonScale * scale,
    offsetY + (bounds.maxLat - lat) * scale,
  ];

  const step = Math.max(1, Math.floor(points.length / 600));
  const coords: string[] = [];
  for (let i = 0; i < points.length; i += step) {
    const [x, y] = project(points[i].lat, points[i].lon);
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const last = points[points.length - 1];
  const [endX, endY] = project(last.lat, last.lon);
  coords.push(`${endX.toFixed(1)},${endY.toFixed(1)}`);
  const [startX, startY] = project(points[0].lat, points[0].lon);

  const cpDots = checkpoints
    .filter(cp => cp.latitude !== null && cp.longitude !== null)
    .map(cp => {
      const [x, y] = project(cp.latitude as number, cp.longitude as number);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${TRAIL}" stroke="#FFFFFF" stroke-width="1.5"/>`;
    })
    .join('');

  return (
    `<svg class="route-map" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="${CREAM}"/>` +
    `<polyline points="${coords.join(' ')}" fill="none" stroke="${FOREST}" stroke-width="2.5" ` +
    'stroke-linecap="round" stroke-linejoin="round"/>' +
    cpDots +
    `<circle cx="${startX.toFixed(1)}" cy="${startY.toFixed(1)}" r="6" fill="${FOREST}" stroke="#FFFFFF" stroke-width="2"/>` +
    `<circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="6" fill="${SUNRISE}" stroke="#FFFFFF" stroke-width="2"/>` +
    '</svg>'
  );
}

// ============================================================================
// ELEVATION PROFILE SVG
// ============================================================================

/** Elevation profile with distance / elevation axis labels in event units. */
export function buildElevationSvg(
  metrics: RouteMetrics,
  distanceUnit: DistanceUnit,
  elevationUnit: ElevationUnit,
): string {
  const samples = elevationSamples(metrics.points, 160);
  if (samples.length < 2) {return '';}

  const toDist = (mi: number) => (distanceUnit === 'kilometers' ? mi * MILES_TO_KM : mi);
  const toEle = (ft: number) => (elevationUnit === 'meters' ? ft * FEET_TO_M : ft);

  const width = 680;
  const height = 220;
  const left = 52;
  const right = 16;
  const top = 14;
  const bottom = 34;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const maxDist = toDist(samples[samples.length - 1].distanceMi);
  const eleValues = samples.map(s => toEle(s.eleFt));
  let minEle = Math.min(...eleValues);
  let maxEle = Math.max(...eleValues);
  if (maxEle - minEle < 1) {
    minEle -= 10;
    maxEle += 10;
  }

  const x = (dist: number) => left + (maxDist > 0 ? (dist / maxDist) * plotW : 0);
  const y = (ele: number) => top + plotH - ((ele - minEle) / (maxEle - minEle)) * plotH;

  const linePts = samples
    .map(s => `${x(toDist(s.distanceMi)).toFixed(1)},${y(toEle(s.eleFt)).toFixed(1)}`)
    .join(' ');
  const areaPts =
    `${left.toFixed(1)},${(top + plotH).toFixed(1)} ` +
    linePts +
    ` ${(left + plotW).toFixed(1)},${(top + plotH).toFixed(1)}`;

  const xTicks = niceTicks(0, maxDist, 6).filter(t => t >= 0 && t <= maxDist);
  const yTicks = niceTicks(minEle, maxEle, 4).filter(t => t >= minEle && t <= maxEle);

  const gridAndLabels = [
    ...yTicks.map(t => {
      const yy = y(t).toFixed(1);
      return (
        `<line x1="${left}" y1="${yy}" x2="${left + plotW}" y2="${yy}" stroke="${BORDER}" stroke-width="1"/>` +
        `<text x="${left - 8}" y="${yy}" text-anchor="end" dominant-baseline="middle" class="axis">${formatFeet(t)}</text>`
      );
    }),
    ...xTicks.map(t => {
      const xx = x(t).toFixed(1);
      return `<text x="${xx}" y="${height - 12}" text-anchor="middle" class="axis">${formatMiles(t)}</text>`;
    }),
  ].join('');

  const distLabel = distanceUnit === 'kilometers' ? 'Distance (km)' : 'Distance (mi)';
  const eleLabel = elevationUnit === 'meters' ? 'm' : 'ft';

  return (
    `<svg class="elevation-chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">` +
    `<style>.axis{font:10px -apple-system,'Helvetica Neue',Arial,sans-serif;fill:${STONE};}</style>` +
    `<rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="${CREAM}"/>` +
    gridAndLabels +
    `<polygon points="${areaPts}" fill="${FOREST}" fill-opacity="0.16"/>` +
    `<polyline points="${linePts}" fill="none" stroke="${FOREST}" stroke-width="2" ` +
    'stroke-linecap="round" stroke-linejoin="round"/>' +
    `<text x="${left + plotW / 2}" y="${height - 2}" text-anchor="middle" class="axis">${distLabel}</text>` +
    `<text x="14" y="${top + 2}" class="axis">${eleLabel}</text>` +
    '</svg>'
  );
}

// ============================================================================
// SECTION BUILDERS
// ============================================================================

function buildCover(data: RacePlanData, metrics: RouteMetrics | null): string {
  const { event } = data;
  const dateLine = fmtEventDate(event.event_date);
  const meta: string[] = [];
  if (dateLine) {meta.push(escapeHtml(dateLine));}
  if (event.event_time) {meta.push(`Start ${escapeHtml(event.event_time)}`);}
  if (event.location) {meta.push(escapeHtml(event.location));}

  const stats: { label: string; value: string }[] = [];
  if (event.total_distance !== null) {
    stats.push({ label: 'Distance', value: fmtStoredDistance(event.total_distance, event.distance_unit) });
  } else if (metrics) {
    stats.push({ label: 'Distance', value: fmtDistanceFromMiles(metrics.totalDistanceMi, event.distance_unit) });
  }
  if (event.total_elevation_gain !== null) {
    stats.push({ label: 'Climb', value: fmtStoredElevation(event.total_elevation_gain, event.elevation_unit) });
  } else if (metrics?.elevationGainFt != null) {
    stats.push({ label: 'Climb', value: fmtElevationFromFeet(metrics.elevationGainFt, event.elevation_unit) });
  }
  if (event.cutoff_time) {stats.push({ label: 'Cutoff', value: escapeHtml(event.cutoff_time) });}
  if (event.target_time) {stats.push({ label: 'Goal', value: escapeHtml(event.target_time) });}
  if (data.checkpoints.length > 0) {
    stats.push({ label: 'Checkpoints', value: String(data.checkpoints.length) });
  }
  if (data.crew.length > 0) {stats.push({ label: 'Crew', value: String(data.crew.length) });}

  const statChips = stats
    .map(s => `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`)
    .join('');

  const routeLine =
    event.start_location || event.finish_location
      ? `<div class="cover-route">${esc(event.start_location) || 'Start'} &rarr; ${esc(event.finish_location) || 'Finish'}</div>`
      : '';

  return `
  <header class="cover">
    <div class="cover-brand">
      <svg viewBox="0 0 24 24" class="brand-mark" fill="#FFFFFF"><path d="M3 20L9 7l4 7 2.5-3.5L21 20H3z"/></svg>
      <span>ULTRAEDGE &middot; RACE DAY PLAN</span>
    </div>
    <h1>${escapeHtml(event.name)}</h1>
    ${meta.length > 0 ? `<div class="cover-meta">${meta.join(' &middot; ')}</div>` : ''}
    ${routeLine}
    ${event.description ? `<div class="cover-desc">${escapeHtml(event.description)}</div>` : ''}
    ${statChips ? `<div class="stats">${statChips}</div>` : ''}
  </header>`;
}

function buildRouteSection(data: RacePlanData, metrics: RouteMetrics | null): string {
  if (!metrics) {return '';}
  const { event } = data;
  const map = buildRouteMapSvg(metrics, data.checkpoints);
  const profile = buildElevationSvg(metrics, event.distance_unit, event.elevation_unit);
  if (!map && !profile) {return '';}

  const legend =
    '<div class="map-legend">' +
    `<span><span class="dot" style="background:${FOREST}"></span>Start</span>` +
    `<span><span class="dot" style="background:${SUNRISE}"></span>Finish</span>` +
    `<span><span class="dot" style="background:${TRAIL}"></span>Checkpoint</span>` +
    '</div>';

  return `
  <section class="section">
    ${sectionHeader(ICONS.route, 'Course Route')}
    ${map}${map ? legend : ''}
    ${profile ? `${sectionHeader(ICONS.elevation, 'Elevation Profile')}${profile}` : ''}
  </section>`;
}

const CHECKPOINT_TYPE_LABELS: Record<string, string> = {
  start: 'Start',
  aid_station: 'Aid Station',
  crew_access: 'Crew Access',
  drop_bag: 'Drop Bag',
  gear_check: 'Gear Check',
  timing: 'Timing Mat',
  finish: 'Finish',
  other: 'Checkpoint',
};

function buildCheckpointsSection(data: RacePlanData): string {
  const { checkpoints, event } = data;
  if (checkpoints.length === 0) {return '';}

  const showEta = checkpoints.some(cp => cp.estimated_arrival);

  const rows = checkpoints
    .map((cp, i) => {
      const distance =
        cp.distance_from_start !== null
          ? fmtStoredDistance(cp.distance_from_start, event.distance_unit)
          : '';
      const cutoff = cp.cutoff_time || cp.cutoff_duration || '';
      const noteBits: string[] = [];
      if (cp.location_description) {noteBits.push(esc(cp.location_description));}
      if (cp.has_pacer_pickup) {noteBits.push('Pacer pickup');}
      if (cp.has_pacer_dropoff) {noteBits.push('Pacer drop-off');}
      if (cp.aid_supplies.length > 0) {noteBits.push(`Aid: ${esc(cp.aid_supplies.join(', '))}`);}
      if (cp.notes) {noteBits.push(esc(cp.notes));}

      return `<tr>
        <td class="num">${i + 1}</td>
        <td><strong>${escapeHtml(cp.name)}</strong><br/><span class="sub">${CHECKPOINT_TYPE_LABELS[cp.checkpoint_type] ?? 'Checkpoint'}</span></td>
        <td>${distance || dash}</td>
        ${showEta ? `<td>${esc(cp.estimated_arrival) || dash}</td>` : ''}
        <td>${cutoff ? escapeHtml(cutoff) : dash}</td>
        <td class="center">${cp.has_crew_access ? check : dash}</td>
        <td class="center">${cp.has_drop_bag ? check : dash}</td>
        <td class="notes">${noteBits.join(' &middot; ') || dash}</td>
      </tr>`;
    })
    .join('');

  return `
  <section class="section">
    ${sectionHeader(ICONS.checkpoint, 'Checkpoints & Aid Stations')}
    <table>
      <thead><tr>
        <th class="num">#</th><th>Checkpoint</th><th>Distance</th>
        ${showEta ? '<th>ETA</th>' : ''}
        <th>Cutoff</th><th class="center">Crew</th><th class="center">Drop Bag</th><th>Notes</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function buildCrewSection(data: RacePlanData): string {
  if (data.crew.length === 0) {return '';}
  const rows = data.crew
    .map(
      member => `<tr>
        <td><strong>${escapeHtml(member.name)}</strong></td>
        <td>${esc(member.role) || dash}</td>
        <td>${esc(member.phone) || dash}</td>
        <td>${esc(member.email) || dash}</td>
        <td class="notes">${esc(member.notes) || dash}</td>
      </tr>`,
    )
    .join('');

  return `
  <section class="section">
    ${sectionHeader(ICONS.crew, 'Crew Roster')}
    <table>
      <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function buildGearSection(data: RacePlanData): string {
  if (data.gear.length === 0) {return '';}

  const byCategory = new Map<string, RacePlanGearItem[]>();
  for (const item of data.gear) {
    const key = item.category || 'other';
    const list = byCategory.get(key) ?? [];
    list.push(item);
    byCategory.set(key, list);
  }

  const groups = [...byCategory.entries()]
    .map(([category, items]) => {
      const rows = items
        .map(item => {
          const tags: string[] = [];
          if (item.isWorn) {tags.push('worn');}
          if (item.isCarried) {tags.push('carried');}
          const qty = item.quantity > 1 ? ` &times;${item.quantity}` : '';
          return (
            '<div class="gear-item"><span class="checkbox"></span>' +
            `<span class="gear-name">${escapeHtml(item.name)}${item.brand ? ` <span class="sub">${escapeHtml(item.brand)}</span>` : ''}${qty}` +
            `${tags.length > 0 ? ` <span class="tag">${tags.join(' &middot; ')}</span>` : ''}</span></div>`
          );
        })
        .join('');
      const label = category.charAt(0).toUpperCase() + category.slice(1);
      return `<div class="gear-group"><h3>${escapeHtml(label)}</h3>${rows}</div>`;
    })
    .join('');

  return `
  <section class="section">
    ${sectionHeader(ICONS.gear, 'Gear Checklist')}
    <div class="gear-grid">${groups}</div>
  </section>`;
}

function buildDropBagsSection(data: RacePlanData): string {
  const bags = data.dropBags.filter(bag => bag.items.length > 0 || bag.notes);
  if (bags.length === 0) {return '';}

  const cards = bags
    .map(bag => {
      const items = bag.items
        .map(
          item =>
            `<li>${escapeHtml(item.name)}${item.quantity > 1 ? ` &times;${item.quantity}` : ''}` +
            `${item.notes ? ` <span class="sub">${escapeHtml(item.notes)}</span>` : ''}</li>`,
        )
        .join('');
      return `<div class="bag-card">
        <div class="bag-title">${escapeHtml(bag.name)}</div>
        ${bag.checkpointName ? `<div class="bag-location">at ${escapeHtml(bag.checkpointName)}</div>` : ''}
        ${items ? `<ul>${items}</ul>` : ''}
        ${bag.notes ? `<div class="sub">${escapeHtml(bag.notes)}</div>` : ''}
      </div>`;
    })
    .join('');

  return `
  <section class="section">
    ${sectionHeader(ICONS.dropBag, 'Drop Bags')}
    <div class="bag-grid">${cards}</div>
  </section>`;
}

// ============================================================================
// DOCUMENT
// ============================================================================

const STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px 32px;
    background: ${PARCHMENT};
    color: ${BARK};
    font: 12px/1.5 -apple-system, 'Helvetica Neue', Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { margin: 24px; }

  .cover {
    background: linear-gradient(135deg, ${FOREST} 0%, #4A8B5C 100%);
    border-radius: 16px;
    color: #FFFFFF;
    padding: 28px 30px;
    margin-bottom: 26px;
  }
  .cover-brand {
    display: flex; align-items: center; gap: 8px;
    font-size: 10px; font-weight: 700; letter-spacing: 2px; opacity: 0.9;
  }
  .brand-mark { width: 18px; height: 18px; }
  .cover h1 {
    margin: 10px 0 6px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 32px; line-height: 1.15; font-weight: 700;
  }
  .cover-meta { font-size: 13px; opacity: 0.95; }
  .cover-route { margin-top: 4px; font-size: 12px; opacity: 0.85; }
  .cover-desc { margin-top: 10px; font-size: 11px; opacity: 0.85; max-width: 480px; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
  .stat {
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 10px; padding: 8px 14px; min-width: 74px; text-align: center;
  }
  .stat-value { font-size: 15px; font-weight: 700; }
  .stat-label { font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.85; margin-top: 2px; }

  .section { margin-bottom: 26px; }
  .section-header {
    display: flex; align-items: center; gap: 8px;
    border-bottom: 2px solid ${FOREST};
    padding-bottom: 6px; margin-bottom: 12px;
    break-after: avoid; page-break-after: avoid;
  }
  .section-icon { width: 16px; height: 16px; flex: none; }
  .section-header h2 {
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 17px; color: ${FOREST}; font-weight: 700;
  }
  h3 { font-size: 12px; color: ${TRAIL}; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 1px; }

  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th {
    background: ${FOREST}; color: #FFFFFF; text-align: left;
    font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase;
    padding: 7px 9px;
  }
  th:first-child { border-radius: 6px 0 0 6px; }
  th:last-child { border-radius: 0 6px 6px 0; }
  td { padding: 7px 9px; border-bottom: 1px solid ${BORDER}; vertical-align: top; font-size: 11px; }
  tbody tr:nth-child(even) { background: ${CREAM}; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .num { width: 22px; color: ${STONE}; }
  .center { text-align: center; }
  .notes { color: ${STONE}; font-size: 10px; }
  .sub { color: ${STONE}; font-size: 10px; font-weight: 400; }
  .check { color: ${FOREST}; font-weight: 700; }
  .dash { color: ${BORDER}; }

  .route-map, .elevation-chart { width: 100%; height: auto; display: block; margin-bottom: 8px; }
  .elevation-chart { margin-top: 2px; }
  .map-legend { display: flex; gap: 16px; font-size: 10px; color: ${STONE}; margin-bottom: 14px; }
  .map-legend span { display: flex; align-items: center; gap: 5px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  .gear-grid { column-count: 2; column-gap: 24px; }
  .gear-group { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; }
  .gear-item { display: flex; align-items: flex-start; gap: 7px; padding: 3px 0; font-size: 11px; }
  .checkbox {
    width: 11px; height: 11px; flex: none; margin-top: 2px;
    border: 1.5px solid ${TRAIL}; border-radius: 3px; background: #FFFFFF;
  }
  .tag {
    background: ${BIRCH}; color: ${STONE}; border-radius: 8px;
    font-size: 9px; padding: 1px 7px; white-space: nowrap;
  }

  .bag-grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .bag-card {
    background: ${CREAM}; border: 1px solid ${BORDER}; border-radius: 10px;
    padding: 12px 14px; width: calc(50% - 6px);
    break-inside: avoid; page-break-inside: avoid;
  }
  .bag-title { font-weight: 700; color: ${BARK}; font-size: 12px; }
  .bag-location { color: ${SUNRISE}; font-size: 10px; font-weight: 600; margin: 2px 0 4px; }
  .bag-card ul { margin: 6px 0 0; padding-left: 16px; font-size: 11px; }
  .bag-card li { margin-bottom: 2px; }

  .footer {
    margin-top: 30px; padding-top: 10px;
    border-top: 1px solid ${BORDER};
    display: flex; justify-content: space-between;
    font-size: 9px; color: ${STONE}; letter-spacing: 0.5px;
  }
`;

/** Assemble the complete printable HTML document. */
export function buildRacePlanHtml(data: RacePlanData): string {
  let metrics: RouteMetrics | null = null;
  if (data.gpxXml) {
    try {
      metrics = computeRouteMetrics(parseGpx(data.gpxXml));
    } catch {
      metrics = null; // malformed GPX — skip the route section gracefully
    }
  }

  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(data.event.name)} — Race Day Plan</title>
<style>${STYLES}</style>
</head>
<body>
${buildCover(data, metrics)}
${buildRouteSection(data, metrics)}
${buildCheckpointsSection(data)}
${buildCrewSection(data)}
${buildGearSection(data)}
${buildDropBagsSection(data)}
<div class="footer">
  <span>Prepared with UltraEdge</span>
  <span>Generated ${generated}</span>
</div>
</body>
</html>`;
}

// ============================================================================
// GPX LOADING
// ============================================================================

/**
 * Best-effort load of the event's GPX XML: device cache first, then a local
 * `file:` URI, then a fresh download for remote storage paths. Returns null
 * when unavailable so the PDF simply omits the route section.
 */
export async function loadGpxXmlForEvent(
  eventId: string,
  gpxFileUrl: string | null,
): Promise<string | null> {
  if (!gpxFileUrl) {return null;}
  try {
    if (!isRemoteGpxPath(gpxFileUrl)) {
      const local = new File(gpxFileUrl);
      return local.exists ? await local.text() : null;
    }

    const dir = new Directory(Paths.document, 'gpx');
    dir.create({ intermediates: true, idempotent: true });
    const cached = new File(dir, `${eventId}.gpx`);
    if (cached.exists) {return await cached.text();}

    await downloadGpx(gpxFileUrl, cached);
    return await cached.text();
  } catch {
    return null;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'race';

/** Render the race plan to a PDF file. Returns the file URI. */
export async function generateRacePlanPdf(data: RacePlanData): Promise<string> {
  const html = buildRacePlanHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // Give the share sheet a friendly filename instead of a random temp name.
  try {
    const named = new File(Paths.cache, `${slugify(data.event.name)}-race-plan.pdf`);
    if (named.exists) {named.delete();}
    new File(uri).move(named);
    return named.uri;
  } catch {
    return uri;
  }
}

/** Generate the PDF and open the OS share sheet. */
export async function exportRacePlan(data: RacePlanData): Promise<void> {
  const uri = await generateRacePlanPdf(data);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `${data.event.name} — Race Day Plan`,
    UTI: 'com.adobe.pdf',
  });
}
