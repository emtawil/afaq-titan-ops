'use client';
import { useState, useEffect } from 'react';
import { X, Maximize2, Plus, Radio, Siren, Volume2, VolumeX } from 'lucide-react';
import { CameraFeed } from './CameraFeed';
import { BODY_CAM, CAR_CAMS } from './cameras';
import { statusColor, statusLabel } from './status';
import { useNow } from '@/lib/useNow';
import { fmtTime, toIndic } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Sos, Unit } from '@/lib/simulation/types';

/**
 * MultiLiveView — fullscreen mission overlay showing a live camera grid for all
 * selected units simultaneously. Used for special operations where the ops room
 * needs simultaneous visibility on multiple patrols and officers.
 *
 * Layout adapts to unit count:
 *   1 unit   → full-screen single feed
 *   2-4 units → 2×2 grid
 *   5-9 units → 3×3 grid
 *   10+ units → 4×N grid
 *
 * Click any tile to expand it into a single large feed with a thumbnail sidebar.
 * ESC returns from expanded → grid → close.
 */
export function MultiLiveView({ units, sos, muted, onToggleMute, onClose, onAdd }: {
  units: Unit[];
  sos: Sos | null;
  muted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const now = useNow();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') {
        if (expanded) setExpanded(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, onClose]);

  if (units.length === 0) return null;

  const cols = units.length <= 1 ? 1 : units.length <= 4 ? 2 : units.length <= 9 ? 3 : 4;
  const expandedUnit = expanded ? units.find((u) => u.id === expanded) ?? null : null;

  // Highlight any unit in SOS state so the ops room notices immediately
  const sosUnit = sos ? units.find((u) => u.id === sos.officerId) : null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-ink">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-4 border-b border-copper/60 bg-ink px-5 py-3">
        <Radio size={22} className={cn('text-copper', !sos && 'animate-pulse')} />
        <div>
          <div className="font-kufi text-lg font-bold text-copper">بثّ المهمة المباشر — {toIndic(units.length)} وحدة</div>
          <div className="text-[11px] text-[#9b948a]">
            <span dir="ltr" className="tabular-nums">{fmtTime(now)}</span> · مراقبة جماعية للمهمة الخاصة
          </div>
        </div>

        {/* Inline SOS banner — keeps critical alerts visible even in mission mode */}
        {sosUnit && (
          <div className="flex items-center gap-2 border border-[#ef4444] bg-[#c62828]/15 px-3 py-1.5 sos-banner">
            <Siren size={16} className="animate-pulse text-[#ff6b6b]" />
            <span className="font-kufi text-xs font-bold text-[#ff8a8a]">استغاثة — {sosUnit.name}</span>
          </div>
        )}

        <div className="flex-1" />

        <span className="hidden items-center gap-2 border border-steel bg-charcoal px-3 py-1.5 text-xs text-[#cfc8bf] sm:flex">
          <span className="text-[#9b948a]">الوحدات:</span>
          <span className="font-bold text-copper">{toIndic(units.length)}</span>
        </span>

        <button onClick={onToggleMute} title={muted ? 'تشغيل الصوت' : 'كتم الصوت'} aria-label="صوت"
          className="flex h-9 w-9 items-center justify-center border border-steel text-[#b9b2a8] hover:border-copper hover:text-copper">
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        <button onClick={onAdd} className="flex items-center gap-1.5 border border-steel px-3 py-2 font-kufi text-xs text-[#cfc8bf] hover:border-copper hover:text-copper">
          <Plus size={14} /> إضافة وحدة
        </button>

        <button onClick={onClose} title="إغلاق (Esc)" aria-label="إغلاق"
          className="flex h-9 w-9 items-center justify-center border border-steel text-[#b9b2a8] hover:border-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444]">
          <X size={18} />
        </button>
      </header>

      {/* Body — either single expanded feed with sidebar, or N×N grid */}
      <div className="relative min-h-0 flex-1 p-3">
        {expandedUnit ? (
          <div className="flex h-full gap-3">
            {/* Main feed */}
            <div className="relative min-w-0 flex-1 border border-copper">
              <CameraFeed
                cam={expandedUnit.kind === 'car' ? CAR_CAMS[0] : BODY_CAM}
                unitLabel={expandedUnit.kind === 'car' ? `دورية ${expandedUnit.label}` : expandedUnit.name}
                seed={expandedUnit.kind === 'car' ? 1 : 4}
                className="aspect-auto h-full"
              />
              <button
                onClick={() => setExpanded(null)}
                className="absolute right-3 top-3 z-20 flex items-center gap-1.5 border border-steel bg-black/70 px-3 py-1.5 font-kufi text-xs text-[#cfc8bf] backdrop-blur-sm hover:border-copper hover:text-copper"
              >
                <Maximize2 size={12} /> العودة إلى الشبكة
              </button>
            </div>
            {/* Sidebar thumbnails */}
            <div className="flex w-56 shrink-0 flex-col gap-2 overflow-y-auto scroll-dark">
              {units.map((u) => (
                <TileThumb
                  key={u.id}
                  u={u}
                  active={u.id === expanded}
                  isSos={sos?.officerId === u.id}
                  onClick={() => setExpanded(u.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid h-full gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {units.map((u) => (
              <TileThumb
                key={u.id}
                u={u}
                active={false}
                isSos={sos?.officerId === u.id}
                onClick={() => setExpanded(u.id)}
                fill
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <footer className="shrink-0 border-t border-steel bg-charcoal px-5 py-2 text-center font-kufi text-[11px] text-[#7d776f]">
        اضغط على أي وحدة لتكبير بثّها · اضغط <kbd className="border border-steel bg-ink px-1.5 py-0.5 text-copper">Esc</kbd> للعودة إلى الشبكة أو الإغلاق
      </footer>
    </div>
  );
}

function TileThumb({ u, active, isSos, onClick, fill }: {
  u: Unit;
  active: boolean;
  isSos: boolean;
  onClick: () => void;
  fill?: boolean;
}) {
  const cam = u.kind === 'car' ? CAR_CAMS[0] : BODY_CAM;
  const label = u.kind === 'car' ? `دورية ${u.label}` : u.name;
  const offline = u.status === 'offline';
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden border transition-colors',
        isSos ? 'border-[#ef4444]'
        : active ? 'border-copper'
        : 'border-steel hover:border-copper/60',
        fill ? 'h-full' : 'aspect-video'
      )}
    >
      {offline ? (
        <div className="flex h-full w-full items-center justify-center bg-ink text-[10px] text-[#7d776f]">
          <span className="flex flex-col items-center gap-1">
            <span className="font-kufi text-copper/70">{cam.label}</span>
            غير متصل
          </span>
        </div>
      ) : (
        <CameraFeed cam={cam} unitLabel={label} seed={u.kind === 'car' ? 1 : 4} compact className={fill ? 'aspect-auto h-full' : undefined} />
      )}

      {/* Status chip */}
      <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1.5 bg-black/70 px-2 py-1 backdrop-blur-sm">
        <span className={cn('h-2 w-2 rounded-full', isSos && 'animate-pulse')} style={{ background: statusColor(u.status) }} />
        <span className="font-kufi text-[10px] font-semibold text-white">{statusLabel(u)}</span>
      </div>

      {/* Speed chip for cars */}
      {u.kind === 'car' && !offline && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 bg-black/70 px-2 py-1 backdrop-blur-sm">
          <span dir="ltr" className="font-kufi text-[10px] font-bold text-copper tabular-nums">{Math.round(u.speed)} كم/س</span>
        </div>
      )}

      {/* Hover hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="font-kufi text-xs font-semibold text-white">{label}</span>
        <Maximize2 size={12} className="text-copper" />
      </div>

      {/* SOS pulse overlay */}
      {isSos && (
        <div className="pointer-events-none absolute inset-0 z-20 border-2 border-[#ef4444] sos-banner" />
      )}
    </button>
  );
}
