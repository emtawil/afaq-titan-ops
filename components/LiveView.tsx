'use client';
import { useState } from 'react';
import { LayoutGrid, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { CameraFeed } from './CameraFeed';
import { BODY_CAM, CAR_CAMS } from './cameras';
import type { Unit } from '@/lib/simulation/types';
import { cn } from '@/lib/utils';

export function LiveView({ unit, camId, onCam, onClose }: { unit: Unit | null; camId: string; onCam: (id: string) => void; onClose: () => void }) {
  const [grid, setGrid] = useState(false);
  const car = unit?.kind === 'car';
  const cams = car ? CAR_CAMS : [BODY_CAM];
  const cam = cams.find((c) => c.id === camId) ?? cams[0];
  const label = unit ? (car ? `دورية ${unit.label}` : unit.name) : '';
  return (
    <Dialog open={!!unit} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(1180px,94vw)] p-0">
        {unit && (
          <>
            <div className="flex items-center justify-between border-b border-steel px-5 py-3 pl-12">
              <div>
                <DialogTitle className="font-kufi text-lg font-bold text-copper">بث مباشر — {label}</DialogTitle>
                <DialogDescription className="text-xs text-[#9b948a]">{car ? 'كاميرات المركبة' : 'كاميرا الصدر'} · التسجيل المحلي مفعّل</DialogDescription>
              </div>
              {car && (
                <div className="flex border border-steel">
                  <button onClick={() => setGrid(false)} className={cn('flex items-center gap-1.5 px-3 py-1.5 font-kufi text-xs', !grid ? 'bg-copper text-ink' : 'text-[#cfc8bf] hover:bg-steel/60')}><Maximize2 size={14} />كاميرا واحدة</button>
                  <button onClick={() => setGrid(true)} className={cn('flex items-center gap-1.5 px-3 py-1.5 font-kufi text-xs', grid ? 'bg-copper text-ink' : 'text-[#cfc8bf] hover:bg-steel/60')}><LayoutGrid size={14} />الكاميرات الست</button>
                </div>
              )}
            </div>
            <div className="p-4">
              {grid && car ? (
                <div className="grid grid-cols-3 gap-2">
                  {CAR_CAMS.map((c, i) => (
                    <button key={c.id} onClick={() => { onCam(c.id); setGrid(false); }} className="border border-steel hover:border-copper">
                      <CameraFeed cam={c} unitLabel={label} seed={i + 1} compact />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1 border border-steel">
                    <CameraFeed key={cam.id} cam={cam} unitLabel={label} seed={cams.indexOf(cam) + 1} />
                  </div>
                  {car && (
                    <div className="flex w-44 flex-col gap-2">
                      {CAR_CAMS.map((c, i) => (
                        <button key={c.id} onClick={() => onCam(c.id)} className={cn('relative border text-start', c.id === cam.id ? 'border-copper' : 'border-steel hover:border-copper/60')}>
                          <CameraFeed cam={c} unitLabel={label} seed={i + 1} compact />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
