const INDIC = '٠١٢٣٤٥٦٧٨٩';
export const toIndic = (n: number | string) => String(n).replace(/\d/g, (d) => INDIC[+d]);
const LOC = 'ar-LY-u-nu-latn-ca-gregory';
export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
export const fmtHM = (ts: number) =>
  new Date(ts).toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtDateTime = (ts: number) => {
  const d = new Date(ts);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())}  ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};
export const fmtLongDate = (ts: number) =>
  new Date(ts).toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function plural(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${toIndic(n)} ${few}`;
  return `${toIndic(n)} ${many}`;
}
export function fmtAgo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 3) return 'الآن';
  if (s < 60) return 'منذ ' + plural(s, 'ثانية واحدة', 'ثانيتين', 'ثوانٍ', 'ثانية');
  const m = Math.floor(s / 60);
  if (m < 60) return 'منذ ' + plural(m, 'دقيقة واحدة', 'دقيقتين', 'دقائق', 'دقيقة');
  const h = Math.floor(m / 60);
  return 'منذ ' + plural(h, 'ساعة واحدة', 'ساعتين', 'ساعات', 'ساعة');
}
