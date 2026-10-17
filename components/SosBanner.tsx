'use client';
import { Siren } from 'lucide-react';
import { Button } from './ui/button';
import type { Sos, Unit } from '@/lib/simulation/types';
import { nearestLandmark } from '@/lib/simulation/engine';

export function SosBanner({ sos, units, onFocus }: { sos: Sos | null; units: Unit[]; onFocus: (id: string) => void }) {
  if (!sos) return null;
  const o = units.find((u) => u.id === sos.officerId)!;
  const arrived = sos.status === 'arrived';
  return (
    <div className={`flex shrink-0 items-center gap-4 px-5 py-2 text-white ${arrived ? 'bg-[#9a5b1f]' : 'sos-banner bg-[#c62828]'}`}>
      <Siren size={22} className={arrived ? '' : 'animate-pulse'} />
      <span className="font-kufi text-lg font-bold">{arrived ? 'وصلت الدورية إلى موقع الاستغاثة' : 'استغاثة عاجلة'}</span>
      <span className="text-sm">{o.name} — {nearestLandmark(o.lat, o.lng)}</span>
      <div className="flex-1" />
      <Button size="sm" variant="ghost" className="border border-white/60 text-white hover:bg-white/15" onClick={() => onFocus(o.id)}>عرض الموقع</Button>
    </div>
  );
}
