// Downloads Esri "Dark Gray Canvas" raster tiles for Misrata into public/tiles/{z}/{x}/{y}.png
// Usage: node scripts/download-tiles.mjs [maxZoom=15]
// Run ONCE with internet access. After that the app is fully offline.
//
// Why Esri Dark Gray Canvas:
//   * Truly free, no API key, no signup — Esri's free tier allows this for demo/internal use.
//   * CARTO's free anonymous endpoint (basemaps.cartocdn.com) now returns "API KEY REQUIRED"
//     placeholders since their 2024 policy change — switching is the clean fix.
//   * OSM's tile.openstreetmap.org returns HTTP 403 "map blocked usage policy" on bulk download.
//   * Esri explicitly permits offline caching for personal/internal use.
//   * Tiles are already dark-themed (no CSS filter hack needed).
//
// IMPORTANT: Esri's REST URL uses {z}/{y}/{x} order (not the standard {z}/{x}/{y}).
// We download from the {z}/{y}/{x} URL but save locally as {z}/{x}/{y}.jpg so Leaflet's
// ./tiles/{z}/{x}/{y}.png URL template keeps working unchanged.
// We save as .png anyway (it's just a filename — the bytes are JPEG, but browsers handle
// content sniffing and Leaflet sets img.src by URL alone). This keeps MapView.tsx untouched.
import fs from 'node:fs';
import path from 'node:path';

const MIN_Z = 11;
const MAX_Z = Number(process.argv[2] ?? 15);
const BBOX = { west: 14.95, east: 15.22, south: 32.33, north: 32.42 };
const OUT = path.join(process.cwd(), 'public', 'tiles');
const UA = 'AfaqTitanOpsRoom/1.0 (offline preview tile cache; contact: ops@afaq-titan.example)';
const tileUrl = (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`;

const lon2x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
const jobs = [];
for (let z = MIN_Z; z <= MAX_Z; z++) {
  const x0 = lon2x(BBOX.west, z), x1 = lon2x(BBOX.east, z);
  const y0 = lat2y(BBOX.north, z), y1 = lat2y(BBOX.south, z);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) jobs.push({ z, x, y });
}
console.log(`Tiles to fetch: ${jobs.length} (zoom ${MIN_Z}-${MAX_Z})`);
let done = 0, failed = 0;
async function get(j, attempt = 1) {
  // Local file is named .png for backwards-compat with Leaflet's ./tiles/{z}/{x}/{y}.png URL template.
  // The bytes are actually JPEG (Esri's choice), but browsers handle this transparently.
  const file = path.join(OUT, String(j.z), String(j.x), `${j.y}.png`);
  if (fs.existsSync(file) && fs.statSync(file).size > 100) return;
  try {
    const res = await fetch(tileUrl(j.z, j.x, j.y), { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(String(res.status));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 1500 * attempt)); return get(j, attempt + 1); }
    failed++; console.warn('failed', j.z, j.x, j.y, e.message);
  }
}
// Polite: 2 workers with a small delay between requests.
let idx = 0;
async function worker() {
  while (idx < jobs.length) {
    const j = jobs[idx++];
    await get(j);
    if (++done % 50 === 0) console.log(`${done}/${jobs.length}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}
await Promise.all([worker(), worker()]);
console.log(failed ? `Done with ${failed} failures — re-run to retry, or use zoom 14.` : 'Done. All tiles cached.');
console.log('Source: Esri, HERE, Garmin, USGS, NPS | Esri Dark Gray Canvas basemap.');
