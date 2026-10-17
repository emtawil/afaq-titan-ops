export type UnitStatus = 'active' | 'available' | 'stopped' | 'offline' | 'sos' | 'responding';
export type Unit = {
  id: string; kind: 'car' | 'officer'; label: string; name: string; org?: string; driver?: string; rank?: string;
  lat: number; lng: number; heading: number; speed: number; status: UnitStatus; mission: string;
  lastUpdate: number; odometer: number; battery: number; signal: number; offlineSince?: number;
};
export type AlertKind = 'sos' | 'ai' | 'speed' | 'geofence' | 'offline' | 'info';
export type AlertItem = { id: number; ts: number; kind: AlertKind; text: string; unit?: string; meta?: string };
export type TaskStatus = 'جديدة' | 'مستلمة' | 'جاري التنفيذ' | 'منجزة';
export type Task = { id: string; title: string; unit: string; status: TaskStatus; ts: number };
export type AuditItem = { id: number; ts: number; user: string; action: string };
export type Sos = { officerId: string; since: number; status: 'waiting' | 'received' | 'dispatched' | 'arrived'; carId?: string };
export type Snapshot = {
  units: Unit[]; alerts: AlertItem[]; tasks: Task[]; audit: AuditItem[]; sos: Sos | null; tick: number;
};
