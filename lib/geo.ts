export type LL = [number, number];
const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function dist(a: LL, b: LL): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function bearing(a: LL, b: LL): number {
  const y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
  const x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) - Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
export type Path = { pts: LL[]; cum: number[]; total: number };
export function buildPath(pts: LL[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  return { pts, cum, total: cum[cum.length - 1] };
}
/** Out-and-back closed path from a one-way waypoint list. */
export function pingPong(route: LL[]): LL[] {
  return route.concat(route.slice(0, -1).reverse());
}
export function pointAt(p: Path, d: number): { pos: LL; heading: number } {
  const t = ((d % p.total) + p.total) % p.total;
  let i = 1;
  while (i < p.cum.length - 1 && p.cum[i] < t) i++;
  const seg = p.cum[i] - p.cum[i - 1] || 1;
  const f = (t - p.cum[i - 1]) / seg;
  const a = p.pts[i - 1];
  const b = p.pts[i];
  return { pos: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], heading: bearing(a, b) };
}
export function moveToward(from: LL, to: LL, meters: number): LL {
  const d = dist(from, to);
  if (d <= meters || d === 0) return to;
  const f = meters / d;
  return [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f];
}
export function inPolygon(pt: LL, poly: LL[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > pt[0] !== yj > pt[0] && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const DIRS = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
export function compass(h: number): string {
  return DIRS[Math.round(h / 45) % 8];
}
