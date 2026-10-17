'use client';
import { useState } from 'react';
import { Radio, Route, ClipboardList, Battery, WifiOff, Siren, CheckCircle2, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { CameraFeed } from './CameraFeed';
import { CAR_CAMS } from './cameras';
import { statusColor, statusLabel } from './status';
import { nearestLandmark, sim } from '@/lib/simulation/engine';
import type { Sos, Unit } from '@/lib/simulation/types';
import { compass, dist } from '@/lib/geo';
import { fmtAgo, fmtTime, toIndic } from '@/lib/format';
import { MISSION_LOG } from '@/data/fleet';
import { useNow } from '@/lib/useNow';

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-steel/60 py-1.5 text-sm">
      <span className="text-[#9b948a]">{k}</span>
      <span className="font-semibold text-[#ece7df]">{v}</span>
    </div>
  );
}

function SosBox({ sos, units, unit }: { sos: Sos; units: Unit[]; unit: Unit }) {
  const car = units.find((u) => u.id === sos.carId);
  const km = car ? (dist([car.lat, car.lng], [unit.lat, unit.lng]) / 1000).toFixed(1) : '';
  return (
    <div className="mb-3 border border-[#ef4444] bg-[#ef4444]/10 p-3">
      <div className="mb-2 flex items-center gap-2 font-kufi font-bold text-[#ff6b6b]">
        <Siren size={18} className="animate-pulse" />
        {sos.status === 'waiting' && 'استغاثة — بانتظار الاستجابة'}
        {sos.status === 'received' && 'استغاثة — تم الاستقبال'}
        {sos.status === 'dispatched' && 'استغاثة — الدورية في الطريق'}
        {sos.status === 'arrived' && 'استغاثة — وصلت الدورية'}
      </div>
      {sos.status === 'waiting' && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" onClick={() => sim.receiveSos()}>استقبال</Button>
          <Button variant="outline" onClick={() => sim.dispatchNearest()}>إرسال أقرب دورية</Button>
        </div>
      )}
      {sos.status === 'received' && (
        <>
          <p className="mb-2 flex items-center gap-1.5 text-xs text-[#e6c1c1]"><CheckCircle2 size={14} />استلمت غرفة العمليات الاستغاثة</p>
          <Button variant="outline" className="w-full" onClick={() => sim.dispatchNearest()}>إرسال أقرب دورية</Button>
        </>
      )}
      {sos.status === 'dispatched' && car && (
        <p className="flex items-center gap-1.5 text-sm text-[#f3d0d0]"><Truck size={15} />{car.name} — المسافة المتبقية {toIndic(km).replace('.', '٫')} كم</p>
      )}
      {sos.status === 'arrived' && car && <p className="text-sm text-[#f3d0d0]">{car.name} في موقع الاستغاثة وتأمين الموقع جارٍ</p>}
    </div>
  );
}

export function DetailsPanel({ unit, units, sos, onLive, onCam, showTrack, onTrack }: {
  unit: Unit; units: Unit[]; sos: Sos | null;
  onLive: (camId?: string) => void; onCam: (id: string) => void; showTrack: boolean; onTrack: () => void;
}) {
  const now = useNow();
  const [log, setLog] = useState(false);
  const car = unit.kind === 'car';
  const offline = unit.status === 'offline';
  const sosHere = sos && sos.officerId === unit.id;
  const sigBars = Math.max(1, Math.min(5, unit.signal));
  return (
    <aside className="scroll-dark flex min-h-0 flex-col overflow-y-auto border-r border-steel bg-charcoal p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-xs text-[#9b948a]">{car ? 'تفاصيل الدورية' : 'تفاصيل الضابط'}</div>
          <h2 className="font-kufi text-xl font-bold text-copper">{unit.name}</h2>
        </div>
        <span className="flex items-center gap-2 border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: statusColor(unit.status), color: statusColor(unit.status) }}>
          <span className="h-2 w-2 rounded-full" style={{ background: statusColor(unit.status) }} />
          {statusLabel(unit)}
        </span>
      </div>

      {sosHere && <SosBox sos={sos!} units={units} unit={unit} />}

      {offline && (
        <div className="mb-3 flex items-center gap-2 border border-steel bg-ink p-3 text-sm text-[#b9b2a8]">
          <WifiOff size={18} className="text-[#8a8a8a]" />
          <span>آخر اتصال: منذ {toIndic(Math.floor((now - (unit.offlineSince ?? now)) / 60000))} دقيقة — لا يُعرض موقع مباشر</span>
        </div>
      )}

      {car ? (
        <>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Button disabled={offline} onClick={() => onLive()}><Radio size={16} />بث مباشر</Button>
            <Button variant={showTrack ? 'default' : 'outline'} onClick={onTrack}><Route size={16} />مسار اليوم</Button>
          </div>
          <Row k="رقم الدورية" v={unit.label} />
          <Row k="الجهة" v={unit.org} />
          <Row k="السائق" v={unit.driver} />
          <Row k="السرعة" v={offline ? '—' : <span dir="ltr" className="tabular-nums">{Math.round(unit.speed)} كم/س</span>} />
          <Row k="الاتجاه" v={offline ? '—' : `${compass(unit.heading)} (${toIndic(Math.round(unit.heading))}°)`} />
          <Row k="آخر تحديث" v={offline ? `منذ ${toIndic(Math.floor((now - (unit.offlineSince ?? now)) / 60000))} دقيقة` : fmtAgo(now - unit.lastUpdate)} />
          <Row k="العداد" v={<span dir="ltr" className="tabular-nums">{Math.round(unit.odometer).toLocaleString('en-US')} كم</span>} />
          <Row k="الحالة" v={statusLabel(unit)} />
          <h3 className="mb-2 mt-3 font-kufi text-sm font-semibold text-copper">كاميرات المركبة</h3>
          <div className="grid grid-cols-2 gap-2">
            {CAR_CAMS.map((c, i) => (
              <button key={c.id} disabled={offline} onClick={() => { onCam(c.id); onLive(c.id); }}
                className="group relative border border-steel text-start hover:border-copper disabled:cursor-not-allowed">
                {offline ? (
                  <div className="flex aspect-video items-center justify-center bg-ink text-[10px] text-[#7d776f]">
                    <span className="flex flex-col items-center gap-1"><span className="font-kufi text-copper/70">{c.label}</span>غير متصل</span>
                  </div>
                ) : <CameraFeed cam={c} unitLabel={unit.name} seed={i + 1} compact />}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <Button size="lg" className="w-full" onClick={() => onLive()}><Radio size={18} />بث مباشر</Button>
          <Button variant="outline" className="mb-2 mt-2 w-full" onClick={() => setLog(true)}><ClipboardList size={16} />سجل المهمة</Button>
          <Row k="الاسم" v={unit.name} />
          <Row k="الرتبة" v={unit.rank} />
          <Row k="المهمة الحالية" v={<span className="max-w-[210px] text-end">{unit.mission}</span>} />
          <Row k="البطارية" v={<span className="flex items-center gap-1.5"><Battery size={15} className="text-copper" /><span dir="ltr" className="tabular-nums">{Math.round(unit.battery)}٪</span></span>} />
          <Row k="قوة الإشارة" v={
            <span className="flex items-end gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ height: 4 + n * 3 }} className={`w-1.5 ${n <= sigBars ? 'bg-copper' : 'bg-steel'}`} />)}
            </span>} />
          <Row k="آخر موقع" v={nearestLandmark(unit.lat, unit.lng)} />
          <Row k="آخر تحديث" v={`${fmtTime(unit.lastUpdate)} — ${fmtAgo(now - unit.lastUpdate)}`} />
          <h3 className="mb-2 mt-4 font-kufi text-sm font-semibold text-copper">كاميرا الصدر</h3>
          <button onClick={() => onLive()} className="relative block w-full border border-steel hover:border-copper">
            <CameraFeed cam={{ id: 'body', label: 'كاميرا الصدر', src: './feeds/body.mp4', kind: 'body' }} unitLabel={unit.name} compact seed={4} />
          </button>
        </>
      )}

      <Dialog open={log} onOpenChange={setLog}>
        <DialogContent className="w-[460px] p-5">
          <DialogTitle className="mb-1 font-kufi text-lg font-bold text-copper">سجل المهمة — {unit.name}</DialogTitle>
          <DialogDescription className="mb-3 text-xs text-[#9b948a]">{unit.mission}</DialogDescription>
          <ol className="border-r border-copper/60 pr-4">
            {MISSION_LOG.map((l) => (
              <li key={l.t} className="relative mb-3 text-sm">
                <span className="absolute -right-[21px] top-1.5 h-2 w-2 bg-copper" />
                <span dir="ltr" className="ml-2 inline-block w-12 text-xs tabular-nums text-copper">{l.t}</span>{l.text}
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
