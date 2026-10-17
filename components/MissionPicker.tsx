'use client';
import { useState, useEffect } from 'react';
import { Search, Check, Car, UserRound, Radio, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { statusColor, statusLabel } from './status';
import type { Unit } from '@/lib/simulation/types';
import { cn } from '@/lib/utils';
import { toIndic } from '@/lib/format';

export function MissionPicker({ open, units, initialSelected, onClose, onStart }: {
  open: boolean;
  units: Unit[];
  initialSelected: string[];
  onClose: () => void;
  onStart: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [q, setQ] = useState('');

  // Re-sync when re-opened with a different initial selection (e.g. user added units mid-mission)
  useEffect(() => {
    if (open) setSelected(new Set(initialSelected));
  }, [open, initialSelected.join(',')]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = units.filter((u) =>
    !q || u.name.includes(q) || u.label.includes(q) || (u.driver ?? '').includes(q)
  );
  const cars = filtered.filter((u) => u.kind === 'car');
  const officers = filtered.filter((u) => u.kind === 'officer');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(760px, 94vw)] p-0">
        <div className="border-b border-steel px-5 py-3 pl-12">
          <DialogTitle className="flex items-center gap-2 font-kufi text-lg font-bold text-copper">
            <Radio size={20} className="text-copper" /> تشكيل المهمة المباشرة
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-[#9b948a]">
            اختر الدوريات والضباط لبثّ جماعي مباشر — يُنصح بـ ٤ إلى ٩ وحدات لأداء أمثل
          </DialogDescription>
        </div>

        <div className="border-b border-steel p-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7d776f]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الدورية أو الاسم أو السائق" className="pr-9" />
          </div>
        </div>

        <div className="scroll-dark max-h-[55vh] overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-kufi text-sm font-semibold text-copper">الدوريات ({toIndic(cars.length)})</span>
            {cars.length > 0 && (
              <button onClick={() => { const ids = cars.map((u) => u.id); setSelected((s) => { const n = new Set(s); ids.forEach((id) => n.add(id)); return n; }); }}
                className="font-kufi text-[11px] text-copper hover:underline">تحديد الكل</button>
            )}
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {cars.map((u) => (
              <UnitChip key={u.id} u={u} checked={selected.has(u.id)} onToggle={() => toggle(u.id)} disabled={u.status === 'offline'} />
            ))}
          </div>
          <div className="mb-2 font-kufi text-sm font-semibold text-copper">الضباط ({toIndic(officers.length)})</div>
          <div className="grid grid-cols-2 gap-2">
            {officers.map((u) => (
              <UnitChip key={u.id} u={u} checked={selected.has(u.id)} onToggle={() => toggle(u.id)} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-steel bg-ink px-5 py-3">
          <span className="font-kufi text-sm text-[#cfc8bf]">
            المحدَّد: <span className="font-bold text-copper">{toIndic(selected.size)}</span> وحدة
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button disabled={selected.size === 0} onClick={() => onStart(Array.from(selected))}>
              <Radio size={16} /> بدء بثّ المهمة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UnitChip({ u, checked, onToggle, disabled }: { u: Unit; checked: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 border p-2.5 text-start transition-colors',
        disabled ? 'cursor-not-allowed border-steel/40 opacity-40'
        : checked ? 'border-copper bg-copper/10'
        : 'border-steel hover:border-copper/60'
      )}
    >
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center border',
        checked ? 'border-copper bg-copper text-ink' : 'border-steel text-[#b9b2a8]')}>
        {checked ? <Check size={16} /> : u.kind === 'car' ? <Car size={16} /> : <UserRound size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{u.name}</span>
        <span className="block truncate text-[11px] text-[#9b948a]">{u.kind === 'car' ? u.driver : statusLabel(u)}</span>
      </span>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor(u.status) }} />
      {disabled && <X size={14} className="text-[#7d776f]" />}
    </button>
  );
}
