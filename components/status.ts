import type { Unit, UnitStatus } from '@/lib/simulation/types';
export function statusLabel(u: Unit): string {
  const map: Record<UnitStatus, string> = u.kind === 'car'
    ? { active: 'في دورية', stopped: 'متوقفة', offline: 'غير متصل', sos: 'استغاثة', responding: 'استجابة لاستغاثة', available: 'متاحة' }
    : { active: 'مهمة نشطة', available: 'متاح', offline: 'غير متصل', sos: 'استغاثة', stopped: 'متوقف', responding: 'استجابة' };
  return map[u.status];
}
export function statusColor(s: UnitStatus): string {
  switch (s) {
    case 'active': return '#4ade80';
    case 'responding': return '#EA6600';
    case 'available': return '#B87333';
    case 'stopped': return '#d9c27a';
    case 'sos': return '#ef4444';
    default: return '#6b6b6b';
  }
}
