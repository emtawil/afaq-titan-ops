'use client';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownUp, Eye, MapPinOff, Radar, ScanEye, Siren, WifiOff, Info } from 'lucide-react';
import type { AlertItem, AuditItem, Snapshot, Task, TaskStatus, Unit } from '@/lib/simulation/types';
import { BarChart, LineChart } from './Charts';
import { statusColor, statusLabel } from './status';
import { fmtAgo, fmtTime, toIndic } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useNow } from '@/lib/useNow';

const TABS = ['التنبيهات', 'المهام', 'الوحدات النشطة', 'سجل التدقيق', 'التقارير'] as const;
type Tab = (typeof TABS)[number];

const alertIcon = (k: AlertItem['kind']) => {
  switch (k) {
    case 'sos': return <Siren size={16} className="text-[#ff5a5a]" />;
    case 'ai': return <ScanEye size={16} className="text-[#EA6600]" />;
    case 'speed': return <AlertTriangle size={16} className="text-[#EA6600]" />;
    case 'geofence': return <MapPinOff size={16} className="text-copper" />;
    case 'offline': return <WifiOff size={16} className="text-[#8a8a8a]" />;
    default: return <Info size={16} className="text-[#9b948a]" />;
  }
};
const taskColor: Record<TaskStatus, string> = { 'جديدة': '#EA6600', 'مستلمة': '#d9c27a', 'جاري التنفيذ': '#4ade80', 'منجزة': '#8a8a8a' };

function Alerts({ items }: { items: AlertItem[] }) {
  const now = useNow();
  return (
    <ul>
      {items.map((a, i) => (
        <li key={a.id} className={cn('flex items-center gap-3 border-b border-steel/50 px-4 py-2 text-sm', a.kind === 'sos' && 'bg-[#ef4444]/10', i === 0 && now - a.ts < 5000 && 'row-flash')}>
          {alertIcon(a.kind)}
          <span dir="ltr" className="w-16 text-xs tabular-nums text-[#9b948a]">{fmtTime(a.ts)}</span>
          <span className={cn('flex-1', a.kind === 'sos' && 'font-bold text-[#ff8a8a]')}>{a.text}{a.meta && <span className="mr-2 text-xs text-copper">· {a.meta}</span>}</span>
          {a.unit && <span className="border border-steel px-2 py-0.5 text-xs text-[#b9b2a8]">{a.unit}</span>}
        </li>
      ))}
    </ul>
  );
}

function Tasks({ items }: { items: Task[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-ink text-xs text-[#9b948a]"><tr>{['رقم المهمة', 'المهمة', 'المنفِّذ', 'الوقت', 'الحالة'].map((h) => <th key={h} className="px-4 py-2 text-start font-normal">{h}</th>)}</tr></thead>
      <tbody>
        {items.map((t) => (
          <tr key={t.id} className="border-b border-steel/50">
            <td className="px-4 py-2 text-xs text-[#9b948a]">{t.id}</td><td className="px-4 py-2">{t.title}</td><td className="px-4 py-2">{t.unit}</td>
            <td dir="ltr" className="px-4 py-2 text-end text-xs tabular-nums text-[#9b948a]">{fmtTime(t.ts)}</td>
            <td className="px-4 py-2"><span className="border px-2 py-0.5 text-xs font-semibold" style={{ color: taskColor[t.status], borderColor: taskColor[t.status] }}>{t.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type SortKey = 'name' | 'status' | 'speed' | 'lastUpdate';
function Units({ units, onSelect, selectedId }: { units: Unit[]; onSelect: (id: string) => void; selectedId: string }) {
  const [key, setKey] = useState<SortKey>('name');
  const [asc, setAsc] = useState(true);
  const now = useNow();
  const rows = useMemo(() => {
    const r = [...units].sort((a, b) => {
      const av = key === 'status' ? statusLabel(a) : a[key], bv = key === 'status' ? statusLabel(b) : b[key];
      return (av > bv ? 1 : av < bv ? -1 : 0) * (asc ? 1 : -1);
    });
    return r;
  }, [units, key, asc]);
  const H = ({ k, children }: { k: SortKey; children: string }) => (
    <th className="px-4 py-2 text-start font-normal"><button onClick={() => { key === k ? setAsc(!asc) : (setKey(k), setAsc(true)); }} className="flex items-center gap-1 hover:text-copper">{children}<ArrowDownUp size={12} className={key === k ? 'text-copper' : ''} /></button></th>
  );
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-ink text-xs text-[#9b948a]"><tr><H k="name">الوحدة</H><th className="px-4 py-2 text-start font-normal">النوع</th><H k="status">الحالة</H><H k="speed">السرعة</H><th className="px-4 py-2 text-start font-normal">المسؤول</th><H k="lastUpdate">آخر تحديث</H></tr></thead>
      <tbody>
        {rows.map((u) => (
          <tr key={u.id} onClick={() => onSelect(u.id)} className={cn('cursor-pointer border-b border-steel/50 hover:bg-steel/30', u.id === selectedId && 'bg-copper/10')}>
            <td className="px-4 py-2 font-semibold">{u.name}</td>
            <td className="px-4 py-2 text-[#b9b2a8]">{u.kind === 'car' ? 'دورية' : 'ضابط'}</td>
            <td className="px-4 py-2"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: statusColor(u.status) }} />{statusLabel(u)}</span></td>
            <td dir="ltr" className="px-4 py-2 text-end tabular-nums">{u.status === 'offline' ? '—' : `${Math.round(u.speed)} كم/س`}</td>
            <td className="px-4 py-2 text-[#b9b2a8]">{u.driver ?? u.rank}</td>
            <td className="px-4 py-2 text-xs text-[#9b948a]">{u.status === 'offline' ? `منذ ${toIndic(Math.floor((now - (u.offlineSince ?? now)) / 60000))} دقيقة` : fmtAgo(now - u.lastUpdate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Audit({ items }: { items: AuditItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-ink text-xs text-[#9b948a]"><tr>{['الوقت', 'المستخدم', 'الإجراء'].map((h) => <th key={h} className="px-4 py-2 text-start font-normal">{h}</th>)}</tr></thead>
      <tbody>
        {items.map((a) => (
          <tr key={a.id} className="border-b border-steel/50">
            <td dir="ltr" className="px-4 py-2 text-end text-xs tabular-nums text-[#9b948a]">{fmtTime(a.ts)}</td>
            <td className="px-4 py-2 text-copper">{a.user}</td>
            <td className="px-4 py-2"><span className="flex items-center gap-2"><Eye size={14} className="text-[#7d776f]" />{a.action}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Reports() {
  const card = (title: string, sub: string, c: React.ReactNode) => (
    <div className="flex min-w-0 flex-1 flex-col border border-steel bg-ink/50 p-3">
      <div className="mb-1 font-kufi text-sm font-semibold text-copper">{title}</div>
      <div className="mb-2 text-[11px] text-[#9b948a]">{sub}</div>
      <div className="relative min-h-0 flex-1">{c}</div>
    </div>
  );
  return (
    <div className="absolute inset-0 flex gap-3 p-3">
      {card('البلاغات المعالجة', 'آخر سبعة أيام', <BarChart />)}
      {card('المسافة المقطوعة للدوريات (كم)', 'آخر سبعة أيام', <LineChart />)}
      <div className="flex w-56 flex-col justify-center gap-3 border border-steel bg-ink/50 p-4">
        <div><div className="font-kufi text-3xl font-bold text-copper">٩٢٪</div><div className="text-xs text-[#9b948a]">نسبة الاستجابة خلال المدة المستهدفة</div></div>
        <div><div className="font-kufi text-3xl font-bold text-copper">٤ د ١٢ ث</div><div className="text-xs text-[#9b948a]">متوسط زمن الوصول إلى البلاغ</div></div>
      </div>
    </div>
  );
}

export function BottomTabs({ snap, selectedId, onSelect }: { snap: Snapshot; selectedId: string; onSelect: (id: string) => void }) {
  const [tab, setTab] = useState<Tab>('التنبيهات');
  const unread = snap.alerts.filter((a) => a.kind === 'sos' || a.kind === 'ai').length;
  return (
    <section className="flex h-full min-h-0 flex-col border-t border-copper/60 bg-charcoal">
      <div className="flex shrink-0 items-center border-b border-steel bg-ink">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex items-center gap-2 border-b-2 px-5 py-2.5 font-kufi text-sm font-semibold transition-colors', tab === t ? 'border-copper bg-charcoal text-copper' : 'border-transparent text-[#9b948a] hover:text-[#e6e1da]')}>
            {t === 'التنبيهات' && <Radar size={15} />}{t}
            {t === 'التنبيهات' && unread > 0 && <span className="bg-[#EA6600] px-1.5 text-[11px] text-ink">{toIndic(unread)}</span>}
          </button>
        ))}
      </div>
      <div className="scroll-dark relative min-h-0 flex-1 overflow-y-auto">
        {tab === 'التنبيهات' && <Alerts items={snap.alerts} />}
        {tab === 'المهام' && <Tasks items={snap.tasks} />}
        {tab === 'الوحدات النشطة' && <Units units={snap.units} onSelect={onSelect} selectedId={selectedId} />}
        {tab === 'سجل التدقيق' && <Audit items={snap.audit} />}
        {tab === 'التقارير' && <Reports />}
      </div>
    </section>
  );
}
