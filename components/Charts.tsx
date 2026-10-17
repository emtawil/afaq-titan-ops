const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const calls = [42, 38, 51, 47, 44, 58, 36];
const km = [820, 790, 905, 860, 840, 940, 710];

export function BarChart() {
  const max = 64, w = 640, h = 78, bw = 46, gap = (w - 7 * bw) / 8;
  return (
    <svg viewBox={`0 0 ${w} ${h + 28}`} className="absolute inset-0 h-full w-full" role="img" aria-label="البلاغات المعالجة خلال الأسبوع">
      {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={w} y1={(h / 4) * i + 4} y2={(h / 4) * i + 4} stroke="#3A3A3A" strokeWidth="0.6" />)}
      {calls.map((v, i) => {
        const x = w - gap * (i + 1) - bw * (i + 1);
        const bh = (v / max) * h;
        return (
          <g key={i}>
            <rect x={x} y={h + 4 - bh} width={bw} height={bh} fill={i === 5 ? '#B87333' : '#6b4521'} />
            <text x={x + bw / 2} y={h + 4 - bh - 4} textAnchor="middle" fontSize="10" fill="#e6e1da">{v}</text>
            <text x={x + bw / 2} y={h + 20} textAnchor="middle" fontSize="9.5" fill="#9b948a">{days[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
export function LineChart() {
  const w = 640, h = 78, min = 650, max = 1000;
  const pts = km.map((v, i) => [w - 30 - i * ((w - 60) / 6), h + 4 - ((v - min) / (max - min)) * h] as const);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h + 28}`} className="absolute inset-0 h-full w-full" role="img" aria-label="المسافة المقطوعة للدوريات خلال الأسبوع">
      {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={w} y1={(h / 4) * i + 4} y2={(h / 4) * i + 4} stroke="#3A3A3A" strokeWidth="0.6" />)}
      <path d={`${d} L${pts[6][0]},${h + 4} L${pts[0][0]},${h + 4} Z`} fill="#B8733322" />
      <path d={d} fill="none" stroke="#B87333" strokeWidth="2.2" />
      {pts.map((p, i) => (
        <g key={i}>
          <rect x={p[0] - 3} y={p[1] - 3} width="6" height="6" fill="#0D0D0D" stroke="#B87333" strokeWidth="1.5" />
          <text x={p[0]} y={h + 20} textAnchor="middle" fontSize="9.5" fill="#9b948a">{days[i]}</text>
          <text x={p[0]} y={p[1] - 8} textAnchor="middle" fontSize="9.5" fill="#e6e1da">{km[i]}</text>
        </g>
      ))}
    </svg>
  );
}
