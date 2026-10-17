'use client';
import { useState } from 'react';
import { SyntheticFeed } from './SyntheticFeed';
import { useNow } from '@/lib/useNow';
import { fmtDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Cam } from './cameras';

export function CameraFeed({ cam, unitLabel, compact, seed = 1, className }: {
  cam: Cam; unitLabel: string; compact?: boolean; seed?: number; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const now = useNow();
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-black', className)}>
      {failed ? (
        <SyntheticFeed kind={cam.kind} seed={seed} />
      ) : (
        <video src={cam.src} autoPlay muted loop playsInline onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="scanlines pointer-events-none absolute inset-0" />
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent', compact ? 'p-1.5' : 'p-3')}>
        <span className={cn('font-kufi font-semibold text-copper', compact ? 'text-[10px]' : 'text-sm')}>{cam.label}</span>
        <span className="flex items-center gap-1.5">
          <span className={cn('rec-dot rounded-full bg-[#e53935]', compact ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5')} />
          <span className={cn('font-kufi font-semibold text-white', compact ? 'text-[9px]' : 'text-xs')}>{compact ? 'مباشر' : 'بث مباشر'}</span>
        </span>
      </div>
      {!compact && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 to-transparent p-3 text-xs text-[#e6e1da]">
          <span className="font-kufi">{unitLabel}</span>
          <span dir="ltr" className="tabular-nums">{fmtDateTime(now)}</span>
        </div>
      )}
    </div>
  );
}
