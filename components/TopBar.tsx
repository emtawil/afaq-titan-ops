'use client';
import { ShieldCheck, Volume2, VolumeX, User, Radio, ScanFace } from 'lucide-react';
import { useNow } from '@/lib/useNow';
import { fmtLongDate, fmtTime, toIndic } from '@/lib/format';

export function TopBar({ muted, onMute, missionCount, onMission, onAi }: {
  muted: boolean;
  onMute: () => void;
  missionCount: number;
  onMission: () => void;
  onAi: () => void;
}) {
  const now = useNow();
  return (
    <header className="flex h-16 shrink-0 items-center gap-6 border-b border-copper/60 bg-ink px-4">
      <div className="flex items-center gap-3">
        <img src="./brand/symbol.png" alt="آفاق تيتان" className="h-[50px] w-auto" />
        <img src="./brand/name.png" alt="آفاق تيتان" className="h-[34px] w-auto" />
      </div>
      <div className="h-8 w-px bg-steel" />
      <h1 className="font-kufi text-xl font-bold text-copper">منصة القيادة والمراقبة — آفاق تيتان</h1>
      <div className="flex-1" />
      <div className="text-end leading-tight">
        <div dir="ltr" className="font-kufi text-xl font-semibold tabular-nums text-[#ece7df]">{fmtTime(now)}</div>
        <div className="text-[11px] text-[#9b948a]">{fmtLongDate(now)}</div>
      </div>
      <button onClick={onAi} title="التعرف بالذكاء الاصطناعي (R)"
        className="flex items-center gap-2 border border-[#EA6600] bg-[#EA6600]/10 px-3 py-1.5 font-kufi text-sm font-semibold text-[#EA6600] transition-colors hover:bg-[#EA6600] hover:text-ink">
        <ScanFace size={16} />
        <span>التعرف الذكي</span>
      </button>
      <button onClick={onMission} title="بثّ مهمة خاصة جماعي"
        className="flex items-center gap-2 border border-copper bg-copper/10 px-3 py-1.5 font-kufi text-sm font-semibold text-copper transition-colors hover:bg-copper hover:text-ink">
        <Radio size={16} className={missionCount > 0 ? 'animate-pulse' : ''} />
        <span>وضع المهمة</span>
        {missionCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center bg-copper px-1 text-[11px] font-bold text-ink">{toIndic(missionCount)}</span>
        )}
      </button>
      <div className="flex items-center gap-2 border border-steel bg-charcoal px-3 py-1.5 text-sm">
        <User size={16} className="text-copper" />
        <span>مشرف العمليات: م. محمد</span>
      </div>
      <button onClick={onMute} title={muted ? 'تشغيل صوت التنبيهات' : 'كتم صوت التنبيهات'} aria-label="صوت التنبيهات"
        className="flex h-9 w-9 items-center justify-center border border-steel text-[#b9b2a8] hover:border-copper hover:text-copper">
        {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
      <div className="flex items-center gap-2 border border-[#2f7d46] bg-[#4ade80]/10 px-3 py-1.5 text-sm text-[#6ee79a]">
        <ShieldCheck size={16} />
        <span className="font-semibold">شبكة محلية مؤمّنة</span>
      </div>
    </header>
  );
}
