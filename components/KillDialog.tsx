'use client';
import { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { sim } from '@/lib/simulation/engine';
import type { Unit } from '@/lib/simulation/types';

const REASONS = ['مركبة مسروقة', 'مركبة خرجت عن السيطرة', 'أمر قضائي بالإيقاف'];

export function KillDialog({ open, unit, onClose }: { open: boolean; unit: Unit | null; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState(0);
  const close = () => { onClose(); setTimeout(() => { setStep(1); setReason(0); }, 250); };
  const name = unit?.kind === 'car' ? unit.name : 'دورية 4471';
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="w-[520px] p-0">
        <div className="border-b border-steel p-5 pl-12">
          <DialogTitle className="flex items-center gap-2 font-kufi text-lg font-bold text-copper"><ShieldAlert size={20} />طلب إيقاف المحرك — يتطلب تفويضاً مزدوجاً</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-[#9b948a]">إجراء حساس: لا يُنفَّذ إلا بعد تفويضين مستقلين، ويُسجَّل كاملاً في سجل التدقيق.</DialogDescription>
        </div>
        <div className="flex border-b border-steel text-xs">
          {['الطلب', 'التفويض الثاني', 'الاعتماد'].map((t, i) => (
            <div key={t} className={`flex-1 py-2 text-center font-kufi ${step === i + 1 ? 'bg-copper text-ink' : step > i + 1 ? 'text-copper' : 'text-[#7d776f]'}`}>{i + 1}. {t}</div>
          ))}
        </div>
        <div className="p-5 text-sm">
          {step === 1 && (
            <>
              <p className="mb-3">المركبة المستهدفة: <b className="text-copper">{name}</b></p>
              <div className="mb-4 space-y-2">
                {REASONS.map((r, i) => (
                  <label key={r} className={`flex cursor-pointer items-center gap-3 border p-2.5 ${reason === i ? 'border-copper bg-copper/10' : 'border-steel'}`}>
                    <input type="radio" checked={reason === i} onChange={() => setReason(i)} className="accent-[#B87333]" />{r}
                  </label>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>تأكيد الطلب — التفويض الأول</Button>
            </>
          )}
          {step === 2 && (
            <>
              <p className="mb-1 flex items-center gap-2 text-[#6ee79a]"><Check size={16} />تم التفويض الأول: مشرف العمليات م. محمد</p>
              <p className="mb-4 text-[#cfc8bf]">بانتظار التفويض الثاني من: <b className="text-copper">قائد غرفة العمليات</b></p>
              <Button className="w-full" onClick={() => { setStep(3); sim.addAudit(`إيقاف محرك ${name} — تفويض مزدوج (${REASONS[reason]})`); }}>اعتماد التفويض الثاني</Button>
            </>
          )}
          {step === 3 && (
            <>
              <p className="mb-1 flex items-center gap-2 text-[#6ee79a]"><Check size={16} />اكتمل التفويض المزدوج</p>
              <p className="mb-4 text-[#cfc8bf]">أُرسل أمر الإيقاف الآمن إلى {name} وسُجّل الإجراء بتوقيع المفوِّضَين.</p>
              <Button variant="outline" className="w-full" onClick={close}>إغلاق</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
