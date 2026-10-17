'use client';
import { useState } from 'react';
import { Car, ChevronDown, Search, UserRound } from 'lucide-react';
import { Input } from './ui/input';
import type { Unit } from '@/lib/simulation/types';
import { statusColor, statusLabel } from './status';
import { cn } from '@/lib/utils';
import { toIndic } from '@/lib/format';

function Group({ title, units, selectedId, onSelect }: { title: string; units: Unit[]; selectedId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-steel/70">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between bg-ink/60 px-3 py-2 font-kufi text-sm font-semibold text-copper">
        <span>{title} ({toIndic(units.length)})</span>
        <ChevronDown size={16} className={cn('transition-transform', !open && '-rotate-90')} />
      </button>
      {open && units.map((u) => {
        const sel = u.id === selectedId;
        return (
          <button key={u.id} onClick={() => onSelect(u.id)}
            className={cn('flex w-full items-center gap-3 border-r-2 px-3 py-2.5 text-start transition-colors', sel ? 'border-copper bg-copper/10' : 'border-transparent hover:bg-steel/40', u.status === 'offline' && 'opacity-60')}>
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center border', sel ? 'border-copper text-copper' : 'border-steel text-[#b9b2a8]')}>
              {u.kind === 'car' ? <Car size={16} /> : <UserRound size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{u.name}</span>
              <span className="block truncate text-[11px] text-[#9b948a]">{u.kind === 'car' ? u.driver : statusLabel(u)}</span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor(u.status), boxShadow: u.status === 'sos' ? '0 0 8px #ef4444' : undefined }} />
              <span dir="ltr" className="text-[11px] tabular-nums text-[#9b948a]">{u.status === 'offline' ? '—' : `${Math.round(u.speed)} km/h`.replace('km/h', 'كم/س')}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function UnitTree({ units, selectedId, onSelect }: { units: Unit[]; selectedId: string; onSelect: (id: string) => void }) {
  const [q, setQ] = useState('');
  const f = (u: Unit) => !q || u.name.includes(q) || u.label.includes(q) || (u.driver ?? '').includes(q);
  return (
    <aside className="flex min-h-0 flex-col border-l border-steel bg-charcoal">
      <div className="border-b border-steel p-3">
        <h2 className="mb-2 font-kufi text-base font-bold text-copper">الوحدات الميدانية</h2>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7d776f]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الدورية أو الاسم" className="pr-9" />
        </div>
      </div>
      <div className="scroll-dark min-h-0 flex-1 overflow-y-auto">
        <Group title="الدوريات" units={units.filter((u) => u.kind === 'car' && f(u))} selectedId={selectedId} onSelect={onSelect} />
        <Group title="الضباط" units={units.filter((u) => u.kind === 'officer' && f(u))} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </aside>
  );
}
