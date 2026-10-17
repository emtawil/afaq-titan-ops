'use client';
import { useState, useRef, useEffect } from 'react';
import { ScanFace, CreditCard, Car, X, Search, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, Camera } from 'lucide-react';
import { CameraFeed } from './CameraFeed';
import { CAR_CAMS, BODY_CAM } from './cameras';
import { statusColor, statusLabel } from './status';
import { scanFace, scanId, scanPlate, type ScanMode, type FaceScanResult, type IdScanResult, type PlateScanResult } from '@/lib/recognition';
import type { Unit } from '@/lib/simulation/types';
import { cn } from '@/lib/utils';
import { toIndic } from '@/lib/format';

type Tab = { id: ScanMode; label: string; icon: typeof ScanFace; desc: string };
const TABS: Tab[] = [
  { id: 'face', label: 'الأشخاص المطلوبون', icon: ScanFace, desc: 'مطابقة الوجوه عبر الكاميرات مع قاعدة بيانات المطلوبين' },
  { id: 'id',   label: 'بطاقات الهوية',     icon: CreditCard, desc: 'قراءة البيانات من بطاقة الهوية الوطنية عبر الكاميرا' },
  { id: 'plate', label: 'لوحات المركبات',   icon: Car, desc: 'التعرف على لوحة المركبة والتحقق من حالتها في السجل' },
];

type Result = { face?: FaceScanResult; id?: IdScanResult; plate?: PlateScanResult; ts: number; mode: ScanMode };

export function AiRecognition({ units, onClose, onAudit }: {
  units: Unit[];
  onClose: () => void;
  onAudit: (action: string) => void;
}) {
  const [mode, setMode] = useState<ScanMode>('face');
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [camId, setCamId] = useState('front');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const abortRef = useRef(false);

  // Ensure selected unit exists
  useEffect(() => {
    if (!units.find((u) => u.id === unitId)) {
      const first = units[0];
      if (first) {
        setUnitId(first.id);
        setCamId(first.kind === 'car' ? 'front' : 'body');
      }
    }
  }, [units, unitId]);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectedUnit = units.find((u) => u.id === unitId) ?? units[0];
  const isCar = selectedUnit?.kind === 'car';
  const cam = isCar ? (CAR_CAMS.find((c) => c.id === camId) ?? CAR_CAMS[0]) : BODY_CAM;
  const unitLabel = selectedUnit ? (isCar ? `دورية ${selectedUnit.label}` : selectedUnit.name) : '';
  const offline = selectedUnit?.status === 'offline';

  async function runScan() {
    if (!selectedUnit || scanning || offline) return;
    abortRef.current = false;
    setScanning(true);
    setResult(null);
    try {
      let r: Result;
      if (mode === 'face') {
        const res = await scanFace(selectedUnit, isCar ? camId : 'body');
        r = { face: res, ts: Date.now(), mode };
        if (res.status === 'matched' && res.match) {
          onAudit(`مطابقة وجه — ${res.match.name} (ثقة ${Math.round(res.confidence * 100)}٪) — من ${selectedUnit.name}`);
        } else {
          onAudit(`فحص وجه — لا مطابقة (ثقة ${Math.round(res.confidence * 100)}٪) — من ${selectedUnit.name}`);
        }
      } else if (mode === 'id') {
        const res = await scanId(selectedUnit);
        r = { id: res, ts: Date.now(), mode };
        if (res.status === 'matched' && res.record) {
          onAudit(`قراءة بطاقة هوية — ${res.record.name} (${res.record.nationalId})${res.wanted ? ' — الشخص مطلوب!' : ''}`);
        } else {
          onAudit(`محاولة قراءة بطاقة هوية — تعذّرت القراءة`);
        }
      } else {
        const res = await scanPlate(selectedUnit);
        r = { plate: res, ts: Date.now(), mode };
        if (res.status === 'matched' && res.record) {
          onAudit(`قراءة لوحة مركبة — ${res.plate} (${res.record.owner})${res.ownerWanted ? ' — المالك مطلوب!' : ''}`);
        } else {
          onAudit(`محاولة قراءة لوحة مركبة — تعذّرت القراءة`);
        }
      }
      if (abortRef.current) return;
      setResult(r);
      setHistory((h) => [r, ...h].slice(0, 12));
    } finally {
      if (!abortRef.current) setScanning(false);
    }
  }

  function switchMode(m: ScanMode) {
    setMode(m);
    setResult(null);
  }

  function switchUnit(id: string) {
    const u = units.find((x) => x.id === id);
    if (!u) return;
    setUnitId(id);
    setCamId(u.kind === 'car' ? 'front' : 'body');
    setResult(null);
  }

  if (!selectedUnit) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/95">
        <div className="text-center">
          <div className="mb-3 font-kufi text-lg text-copper">لا توجد وحدات متاحة</div>
          <button onClick={onClose} className="border border-copper px-4 py-2 font-kufi text-sm text-copper hover:bg-copper hover:text-ink">إغلاق</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-ink">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-4 border-b border-copper/60 bg-ink px-5 py-3">
        <ScanFace size={22} className="text-copper animate-pulse" />
        <div>
          <div className="font-kufi text-lg font-bold text-copper">التعرف بالذكاء الاصطناعي</div>
          <div className="text-[11px] text-[#9b948a]">مطابقة الوجوه · قراءة البطاقات · التعرّف على اللوحات</div>
        </div>
        <div className="flex-1" />
        <button onClick={onClose} title="إغلاق (Esc)" aria-label="إغلاق"
          className="flex h-9 w-9 items-center justify-center border border-steel text-[#b9b2a8] hover:border-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444]">
          <X size={18} />
        </button>
      </header>

      {/* Mode tabs */}
      <div className="flex shrink-0 border-b border-steel bg-charcoal">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = mode === t.id;
          return (
            <button key={t.id} onClick={() => switchMode(t.id)}
              className={cn('flex flex-1 items-center gap-3 border-b-2 px-5 py-3 text-start transition-colors',
                active ? 'border-copper bg-ink text-copper' : 'border-transparent text-[#9b948a] hover:text-[#e6e1da]')}>
              <Icon size={18} />
              <div>
                <div className="font-kufi text-sm font-semibold">{t.label}</div>
                <div className="text-[10px] text-[#7d776f]">{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Body: source picker + camera + result */}
      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Source picker */}
        <aside className="flex min-h-0 flex-col border-l border-steel bg-charcoal">
          <div className="border-b border-steel p-3">
            <h3 className="mb-2 font-kufi text-sm font-bold text-copper">اختر مصدر المسح</h3>
            <p className="text-[10px] text-[#9b948a]">
              {mode === 'face' && 'سيتم فحص البث المباشر للوحدة لاكتشاف الوجوه ومطابقتها.'}
              {mode === 'id' && 'وجّه كاميرا الوحدة نحو البطاقة ثم ابدأ المسح.'}
              {mode === 'plate' && 'وجّه الكاميرا نحو لوحة المركبة ثم ابدأ المسح.'}
            </p>
          </div>
          <div className="scroll-dark min-h-0 flex-1 overflow-y-auto p-2">
            {units.map((u) => {
              const sel = u.id === unitId;
              const off = u.status === 'offline';
              return (
                <button key={u.id} onClick={() => switchUnit(u.id)} disabled={off}
                  className={cn('mb-1.5 flex w-full items-center gap-2.5 border p-2.5 text-start transition-colors',
                    off ? 'cursor-not-allowed border-steel/40 opacity-40'
                    : sel ? 'border-copper bg-copper/10'
                    : 'border-steel hover:border-copper/60')}>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center border text-[10px]',
                    sel ? 'border-copper bg-copper text-ink' : 'border-steel text-[#b9b2a8]')}>
                    {u.kind === 'car' ? <Car size={14} /> : <Camera size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{u.name}</span>
                    <span className="block truncate text-[10px] text-[#9b948a]">{u.kind === 'car' ? u.driver : statusLabel(u)}</span>
                  </span>
                  <span className="h-2 w-2 rounded-full" style={{ background: statusColor(u.status) }} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Camera preview + scan overlay */}
        <main className="relative min-h-0 bg-[#0c0d0f] p-4">
          <div className="relative mx-auto h-full max-w-3xl overflow-hidden border border-steel">
            {offline ? (
              <div className="flex h-full items-center justify-center bg-ink text-[#7d776f]">
                <div className="text-center">
                  <Camera size={32} className="mx-auto mb-2 opacity-50" />
                  <div className="font-kufi text-copper/70">الوحدة غير متصلة</div>
                </div>
              </div>
            ) : (
              <>
                <CameraFeed cam={cam} unitLabel={unitLabel} seed={isCar ? CAR_CAMS.indexOf(cam) + 1 : 4} className="aspect-auto h-full" />

                {/* HUD top-left: source label */}
                <div className="pointer-events-none absolute left-3 top-3 z-10 bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                  <div className="font-kufi text-[10px] text-copper">{isCar ? cam.label : 'كاميرا الصدر'}</div>
                  <div className="font-kufi text-[9px] text-[#cfc8bf]">{unitLabel}</div>
                </div>

                {/* HUD top-right: mode + status */}
                <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                  {scanning ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-copper" />
                      <span className="font-kufi text-[10px] font-bold text-copper animate-pulse">جارٍ المسح...</span>
                    </>
                  ) : (
                    <>
                      <span className={cn('h-2 w-2 rounded-full', result?.face?.status === 'matched' || result?.id?.wanted || result?.plate?.ownerWanted ? 'bg-[#ef4444]' : 'bg-[#4ade80]')} />
                      <span className="font-kufi text-[10px] text-[#cfc8bf]">{scanning ? 'مسح' : 'بث مباشر'}</span>
                    </>
                  )}
                </div>

                {/* Scan overlay */}
                {scanning && (
                  <div className="pointer-events-none absolute inset-0 z-20">
                    {/* Animated scan line */}
                    <div className="scan-line absolute inset-x-0" />
                    {/* Bounding box */}
                    <div className={cn('absolute', mode === 'face' ? 'inset-x-[35%] top-[25%] h-[35%]' : mode === 'id' ? 'inset-x-[20%] top-[30%] h-[40%]' : 'inset-x-[25%] top-[55%] h-[15%]')}>
                      <div className="relative h-full w-full border-2 border-copper">
                        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                        <div className="absolute -top-6 left-0 bg-copper px-2 py-0.5 font-kufi text-[9px] font-bold text-ink">
                          {mode === 'face' ? 'وجه — تحليل' : mode === 'id' ? 'بطاقة — قراءة' : 'لوحة — تحليل'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result overlay flashes when matched */}
                {result && ((result.mode === 'face' && result.face?.status === 'matched') || (result.mode === 'id' && result.id?.wanted) || (result.mode === 'plate' && result.plate?.ownerWanted)) && (
                  <div className="pointer-events-none absolute inset-0 z-15 border-2 border-[#ef4444] sos-banner" />
                )}
              </>
            )}
          </div>

          {/* Scan controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="font-kufi text-xs text-[#9b948a]">
              {isCar ? 'كاميرا المركبة' : 'كاميرا الصدر'} · {cam.label}
              {offline && ' · غير متصل'}
            </div>
            <button onClick={runScan} disabled={scanning || offline}
              className={cn('flex items-center gap-2 border px-5 py-2 font-kufi text-sm font-semibold transition-colors',
                scanning || offline ? 'cursor-not-allowed border-steel text-[#7d776f]'
                : 'border-copper bg-copper text-ink hover:bg-[#c98340]')}>
              {scanning ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {scanning ? 'جارٍ المسح...' : 'بدء المسح'}
            </button>
          </div>

          {/* Inline car camera selector */}
          {isCar && !offline && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CAR_CAMS.map((c) => (
                <button key={c.id} onClick={() => setCamId(c.id)} disabled={scanning}
                  className={cn('border px-2.5 py-1 font-kufi text-[11px] transition-colors disabled:opacity-40',
                    c.id === camId ? 'border-copper bg-copper/10 text-copper' : 'border-steel text-[#cfc8bf] hover:border-copper/60')}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Result panel */}
        <aside className="scroll-dark min-h-0 overflow-y-auto border-r border-steel bg-charcoal p-4">
          <h3 className="mb-3 font-kufi text-sm font-bold text-copper">نتيجة المسح</h3>
          {!result && !scanning && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-[#7d776f]">
              <Search size={32} className="opacity-40" />
              <div className="font-kufi text-xs">لا توجد نتائج بعد — اضغط «بدء المسح»</div>
            </div>
          )}
          {scanning && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 size={32} className="animate-spin text-copper" />
              <div className="font-kufi text-sm text-copper animate-pulse">جارٍ التحليل...</div>
              <div className="font-kufi text-[10px] text-[#9b948a]">قد تستغرق العملية بضع ثوانٍ</div>
            </div>
          )}
          {result && !scanning && <ResultCard result={result} />}

          {/* History */}
          {history.length > 0 && (
            <>
              <h4 className="mb-2 mt-5 border-t border-steel pt-3 font-kufi text-xs font-semibold text-[#9b948a]">آخر العمليات</h4>
              <ul className="space-y-1">
                {history.slice(0, 6).map((h, i) => (
                  <li key={i} className="border-r-2 border-steel bg-ink/50 px-2 py-1.5 text-[10px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-kufi text-[#cfc8bf]">{modeLabel(h.mode)}</span>
                      <span dir="ltr" className="text-[#7d776f] tabular-nums">{new Date(h.ts).toLocaleTimeString('ar-LY-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <div className="mt-0.5 truncate font-kufi text-[#9b948a]">{summary(h)}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = 'absolute h-3 w-3 border-copper';
  const map = {
    tl: 'left-0 top-0 border-l-2 border-t-2',
    tr: 'right-0 top-0 border-r-2 border-t-2',
    bl: 'left-0 bottom-0 border-l-2 border-b-2',
    br: 'right-0 bottom-0 border-r-2 border-b-2',
  };
  return <div className={cn(base, map[pos])} />;
}

function modeLabel(m: ScanMode): string {
  return m === 'face' ? 'مطابقة وجه' : m === 'id' ? 'بطاقة هوية' : 'لوحة مركبة';
}

function summary(r: Result): string {
  if (r.mode === 'face' && r.face) {
    return r.face.status === 'matched' && r.face.match
      ? `مطابقة: ${r.face.match.name} — ${Math.round(r.face.confidence * 100)}٪`
      : `لا مطابقة — ${Math.round(r.face.confidence * 100)}٪`;
  }
  if (r.mode === 'id' && r.id) {
    return r.id.status === 'matched' && r.id.record
      ? `${r.id.record.name} — ${r.id.record.nationalId}${r.id.wanted ? ' — مطلوب!' : ''}`
      : 'تعذّرت القراءة';
  }
  if (r.mode === 'plate' && r.plate) {
    return r.plate.status === 'matched' && r.plate.record
      ? `لوحة ${r.plate.plate} — ${r.plate.record.owner}${r.plate.ownerWanted ? ' — مطلوب!' : ''}`
      : 'تعذّرت القراءة';
  }
  return '';
}

function ResultCard({ result }: { result: Result }) {
  if (result.mode === 'face') return <FaceResult r={result.face!} />;
  if (result.mode === 'id') return <IdResult r={result.id!} />;
  return <PlateResult r={result.plate!} />;
}

function ResultHeader({ icon: Icon, label, danger }: { icon: typeof ShieldAlert; label: string; danger?: boolean }) {
  return (
    <div className={cn('mb-3 flex items-center gap-2 border-b pb-2', danger ? 'border-[#ef4444]' : 'border-steel')}>
      <Icon size={18} className={danger ? 'text-[#ef4444]' : 'text-copper'} />
      <span className={cn('font-kufi text-sm font-bold', danger ? 'text-[#ff6b6b]' : 'text-copper')}>{label}</span>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="font-kufi text-[#9b948a]">درجة الثقة</span>
        <span dir="ltr" className="font-kufi font-bold text-copper tabular-nums">{toIndic(pct)}٪</span>
      </div>
      <div className="h-1.5 bg-steel">
        <div className="h-full bg-copper" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FaceResult({ r }: { r: FaceScanResult }) {
  const matched = r.status === 'matched' && r.match;
  return (
    <div>
      <ResultHeader icon={matched ? ShieldAlert : CheckCircle2} label={matched ? 'مطلوب — مطابقة موجودة!' : 'لا توجد مطابقة'} danger={!!matched} />
      <ConfidenceBar value={r.confidence} />
      {matched && (
        <div className="mb-3 border border-[#ef4444] bg-[#ef4444]/10 p-3">
          <div className="mb-1 font-kufi text-base font-bold text-[#ff8a8a]">{r.match!.name}</div>
          {r.match!.aliases.length > 0 && (
            <div className="mb-1 text-[11px] text-[#e6c1c1]">الأسماء المستعارة: {r.match!.aliases.join('، ')}</div>
          )}
          <div className="space-y-1 text-xs text-[#f3d0d0]">
            <div><span className="text-[#9b948a]">رقم القضية:</span> {r.match!.caseNumber}</div>
            <div><span className="text-[#9b948a]">الجريمة:</span> {r.match!.crime}</div>
            <div><span className="text-[#9b948a]">مستوى الخطورة:</span> <span className="font-bold text-[#ff8a8a]">{r.match!.danger}</span></div>
            <div><span className="text-[#9b948a]">آخر موقع:</span> {r.match!.lastSeen}</div>
            <div><span className="text-[#9b948a]">العمر:</span> {toIndic(r.match!.age)} سنة</div>
            <div><span className="text-[#9b948a]">الرقم الوطني:</span> <span dir="ltr" className="tabular-nums">{r.match!.nationalId}</span></div>
            <div><span className="text-[#9b948a]">الجهة المصدِّرة:</span> {r.match!.issuedBy}</div>
            <div><span className="text-[#9b948a]">الحالة:</span> <span className="font-bold text-copper">{r.match!.status}</span></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 border border-[#ef4444] bg-[#c62828] py-1.5 font-kufi text-xs font-bold text-white hover:bg-[#d93535]">إرسال إنذار</button>
            <button className="flex-1 border border-steel py-1.5 font-kufi text-xs text-[#cfc8bf] hover:border-copper hover:text-copper">عرض الملف الكامل</button>
          </div>
        </div>
      )}
      <div>
        <div className="mb-2 font-kufi text-xs font-semibold text-[#9b948a]">المرشحون ({toIndic(r.candidates.length)})</div>
        <ul className="space-y-1">
          {r.candidates.map((c, i) => (
            <li key={c.id} className={cn('flex items-center justify-between border px-2 py-1.5 text-[11px]',
              i === 0 && matched ? 'border-[#ef4444] bg-[#ef4444]/10' : 'border-steel')}>
              <span className="truncate font-kufi text-[#cfc8bf]">{c.name}</span>
              <span dir="ltr" className="font-kufi font-bold tabular-nums text-copper">{toIndic(Math.round(c.score * 100))}٪</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function IdResult({ r }: { r: IdScanResult }) {
  const matched = r.status === 'matched' && r.record;
  const wanted = !!r.wanted;
  return (
    <div>
      <ResultHeader icon={wanted ? ShieldAlert : matched ? CheckCircle2 : AlertTriangle}
        label={wanted ? 'الهوية لمطلوب!' : matched ? 'تمت القراءة بنجاح' : 'تعذّرت القراءة'} danger={wanted} />
      {matched && <ConfidenceBar value={r.confidence} />}
      {wanted && (
        <div className="mb-3 border border-[#ef4444] bg-[#ef4444]/10 p-3">
          <div className="flex items-center gap-2 font-kufi text-sm font-bold text-[#ff8a8a]">
            <ShieldAlert size={16} /> صاحب البطاقة مطلوب للعدالة!
          </div>
          <div className="mt-1 text-[11px] text-[#f3d0d0]">
            القضية: {r.wanted!.caseNumber} — {r.wanted!.crime}
          </div>
        </div>
      )}
      {matched && (
        <ul className="space-y-1.5 text-xs">
          {r.extractedText.map((f, i) => (
            <li key={i} className="flex items-start justify-between gap-3 border-b border-steel/60 pb-1">
              <span className="shrink-0 text-[#9b948a]">{f.field}</span>
              <span className={cn('text-end font-semibold', f.field === 'الحالة' && r.record!.status !== 'ساري' ? 'text-[#EA6600]' : 'text-[#ece7df]')}>
                {f.value}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!matched && (
        <div className="py-6 text-center text-xs text-[#9b948a]">{r.extractedText[0]?.value}</div>
      )}
    </div>
  );
}

function PlateResult({ r }: { r: PlateScanResult }) {
  const matched = r.status === 'matched' && r.record;
  const danger = !!r.ownerWanted || matched && (r.record!.stolen || r.record!.wanted);
  return (
    <div>
      <ResultHeader icon={danger ? ShieldAlert : matched ? CheckCircle2 : AlertTriangle}
        label={danger ? 'تنبيه — مركبة مشبوهة!' : matched ? 'تمت القراءة بنجاح' : 'تعذّرت القراءة'} danger={danger} />
      {matched && <ConfidenceBar value={r.confidence} />}
      {matched && (
        <>
          <div className={cn('mb-3 border p-3', danger ? 'border-[#ef4444] bg-[#ef4444]/10' : 'border-steel bg-ink/50')}>
            <div className="mb-2 text-center">
              <div className="mb-1 font-kufi text-[10px] text-[#9b948a]">اللوحة المقروءة</div>
              <div dir="ltr" className="mx-auto inline-block border-2 border-copper bg-white px-4 py-1.5 font-mono text-xl font-bold text-black tabular-nums">
                {r.plate}
              </div>
            </div>
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between border-b border-steel/60 pb-1"><span className="text-[#9b948a]">المالك</span><span className="font-semibold text-[#ece7df]">{r.record!.owner}</span></li>
              <li className="flex justify-between border-b border-steel/60 pb-1"><span className="text-[#9b948a]">رقم المالك الوطني</span><span dir="ltr" className="font-semibold tabular-nums text-[#ece7df]">{r.record!.ownerId}</span></li>
              <li className="flex justify-between border-b border-steel/60 pb-1"><span className="text-[#9b948a]">الماركة</span><span className="font-semibold text-[#ece7df]">{r.record!.make} {r.record!.model}</span></li>
              <li className="flex justify-between border-b border-steel/60 pb-1"><span className="text-[#9b948a]">سنة الصنع</span><span dir="ltr" className="font-semibold tabular-nums text-[#ece7df]">{toIndic(r.record!.year)}</span></li>
              <li className="flex justify-between border-b border-steel/60 pb-1"><span className="text-[#9b948a]">اللون</span><span className="font-semibold text-[#ece7df]">{r.record!.color}</span></li>
              <li className="flex justify-between border-b border-steel/60 pb-1"><span className="text-[#9b948a]">حالة الترخيص</span><span className={cn('font-semibold', r.record!.registrationStatus === 'سارية' ? 'text-[#6ee79a]' : 'text-[#EA6600]')}>{r.record!.registrationStatus}</span></li>
            </ul>
          </div>
          {r.ownerWanted && (
            <div className="mb-3 border border-[#ef4444] bg-[#ef4444]/10 p-3">
              <div className="flex items-center gap-2 font-kufi text-sm font-bold text-[#ff8a8a]">
                <ShieldAlert size={16} /> المالك مطلوب للعدالة!
              </div>
              <div className="mt-1 text-[11px] text-[#f3d0d0]">
                {r.ownerWanted.name} — {r.ownerWanted.caseNumber} — {r.ownerWanted.crime}
              </div>
            </div>
          )}
          {r.record!.stolen && (
            <div className="mb-3 flex items-center gap-2 border border-[#EA6600] bg-[#EA6600]/10 p-3 font-kufi text-xs text-[#EA6600]">
              <AlertTriangle size={14} /> المركبة مُبلَّغة كمسروقة منذ {r.record!.stolenSince}
            </div>
          )}
          {r.record!.notes && !r.ownerWanted && (
            <div className="text-[11px] text-[#9b948a]">{r.record!.notes}</div>
          )}
        </>
      )}
      {!matched && (
        <div className="py-6 text-center text-xs text-[#9b948a]">تعذّرت قراءة اللوحة — تأكد من وضوحها وزاوية الكاميرا</div>
      )}
    </div>
  );
}
