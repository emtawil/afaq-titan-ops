import { FLEET, GEOFENCE, GEOFENCE_NAME, LANDMARKS } from '@/data/fleet';
import { buildPath, dist, inPolygon, moveToward, pingPong, pointAt, bearing, type LL, type Path } from '@/lib/geo';
import type { AlertItem, AlertKind, AuditItem, Snapshot, Sos, Task, TaskStatus, Unit } from './types';

/** Visual time-scale: units advance 3x faster than their displayed speed so motion is readable on screen. */
const SCALE = 3;
const USER = 'مشرف العمليات: م. محمد';

type RT = {
  path: Path; dist: number; cruise: number; target: number; stopLeft: number;
  mode: 'route' | 'goto' | 'hold' | 'return'; goal?: LL; holdLeft: number; statusLeft: number;
  inFence: boolean; lastSpeedAlert: number;
};

export function nearestLandmark(lat: number, lng: number): string {
  let best = LANDMARKS[0];
  let bd = Infinity;
  for (const l of LANDMARKS) {
    const d = dist([lat, lng], l.pos);
    if (d < bd) { bd = d; best = l; }
  }
  return best.name;
}

class Sim {
  private units: Unit[] = [];
  private rt = new Map<string, RT>();
  private alerts: AlertItem[] = [];
  private tasks: Task[] = [];
  private audit: AuditItem[] = [];
  private sos: Sos | null = null;
  private seq = 100;
  private tickN = 0;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private snap: Snapshot;

  constructor() {
    const now = Date.now();
    FLEET.forEach((f, i) => {
      const path = buildPath(f.mode === 'pingpong' ? pingPong(f.route) : [...f.route, f.route[0]]);
      const d0 = (path.total * ((i * 0.37) % 1));
      const p = pointAt(path, d0);
      const car = f.kind === 'car';
      this.units.push({
        id: f.id, kind: f.kind, label: f.label, name: f.name, org: f.org, driver: f.driver, rank: f.rank,
        lat: p.pos[0], lng: p.pos[1], heading: p.heading, speed: f.offline ? 0 : car ? f.cruise : 4,
        status: f.offline ? 'offline' : car ? 'active' : 'active', mission: f.mission, lastUpdate: now,
        odometer: f.odometer ?? 0, battery: 62 + ((i * 7) % 33), signal: 3 + (i % 3),
        offlineSince: f.offline ? now - 12 * 60 * 1000 : undefined,
      });
      this.rt.set(f.id, {
        path, dist: d0, cruise: f.cruise, target: f.cruise, stopLeft: 0, mode: 'route', holdLeft: 0,
        statusLeft: 40 + i * 9, inFence: inPolygon(p.pos, GEOFENCE), lastSpeedAlert: 0,
      });
    });
    const m = 60 * 1000;
    this.alerts = [
      { id: 1, ts: now - 2 * m, kind: 'geofence', text: `دخلت دورية 4474 ${GEOFENCE_NAME}`, unit: 'دورية 4474' },
      { id: 2, ts: now - 5 * m, kind: 'speed', text: 'تجاوز السرعة المحددة — 78 كم/س', unit: 'دورية 4472' },
      { id: 3, ts: now - 12 * m, kind: 'offline', text: 'انقطع الاتصال بالوحدة — آخر موقع محفوظ: حي قصر أحمد', unit: 'دورية 4476' },
      { id: 4, ts: now - 21 * m, kind: 'info', text: 'بدء مهمة: تأمين محيط ميدان الشهداء', unit: 'الملازم أحمد الفيتوري' },
      { id: 5, ts: now - 34 * m, kind: 'info', text: 'اكتمال مزامنة سجلات التسجيل المحلية', unit: 'مركز البيانات' },
      { id: 6, ts: now - 48 * m, kind: 'info', text: 'بدء وردية الدوريات الصباحية — 6 دوريات و4 ضباط', unit: 'غرفة العمليات' },
    ];
    this.tasks = [
      { id: 'م-2038', title: 'تأمين محيط ميدان الشهداء', unit: 'الملازم أحمد الفيتوري', status: 'جاري التنفيذ', ts: now - 55 * m },
      { id: 'م-2039', title: 'مراقبة حركة السير على طريق المطار', unit: 'دورية 4473', status: 'جاري التنفيذ', ts: now - 50 * m },
      { id: 'م-2040', title: 'التحقق من بلاغ تجمّع أمام السوق القديم', unit: 'دورية 4474', status: 'مستلمة', ts: now - 18 * m },
      { id: 'م-2041', title: 'مرافقة ناقلة مواد طبية إلى المستشفى', unit: 'دورية 4472', status: 'جديدة', ts: now - 6 * m },
      { id: 'م-2042', title: 'فحص أمني لنقطة التفتيش الشرقية', unit: 'دورية 4475', status: 'مستلمة', ts: now - 14 * m },
      { id: 'م-2037', title: 'تسليم محضر حادث مروري', unit: 'الرقيب فتحي الشريف', status: 'منجزة', ts: now - 70 * m },
    ];
    this.audit = [
      { id: 1, ts: now - 4 * m, user: USER, action: 'مشاهدة بث الكاميرا الأمامية — دورية 4471' },
      { id: 2, ts: now - 9 * m, user: 'مناوب العمليات: الرقيب هشام', action: 'تصدير تقرير حركة الدوريات اليومي' },
      { id: 3, ts: now - 17 * m, user: USER, action: 'استعراض مسار اليوم — دورية 4473' },
      { id: 4, ts: now - 26 * m, user: 'مدير النظام: م. أنس', action: 'مراجعة سياسة الاحتفاظ بالتسجيلات' },
      { id: 5, ts: now - 41 * m, user: USER, action: 'مشاهدة بث كاميرا الصدر — الملازم أحمد الفيتوري' },
      { id: 6, ts: now - 63 * m, user: 'مناوب العمليات: الرقيب هشام', action: 'إسناد المهمة م-2040 إلى دورية 4474' },
      { id: 7, ts: now - 88 * m, user: 'مدير النظام: م. أنس', action: 'تسجيل دخول إلى لوحة الإدارة' },
    ];
    this.snap = this.build();
  }

  private build(): Snapshot {
    return {
      units: this.units.map((u) => ({ ...u })), alerts: [...this.alerts], tasks: [...this.tasks],
      audit: [...this.audit], sos: this.sos ? { ...this.sos } : null, tick: this.tickN,
    };
  }
  private emit() {
    this.snap = this.build();
    this.listeners.forEach((l) => l());
  }
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 1000);
    return () => {
      this.listeners.delete(l);
    };
  };
  getSnapshot = () => this.snap;

  private addAlert(kind: AlertKind, text: string, unit?: string, meta?: string) {
    this.alerts = [{ id: ++this.seq, ts: Date.now(), kind, text, unit, meta }, ...this.alerts].slice(0, 60);
  }
  addAudit(action: string) {
    this.audit = [{ id: ++this.seq, ts: Date.now(), user: USER, action }, ...this.audit].slice(0, 60);
    this.emit();
  }
  private setTask(id: string, title: string, unit: string, status: TaskStatus) {
    const i = this.tasks.findIndex((t) => t.id === id);
    if (i >= 0) this.tasks[i] = { ...this.tasks[i], status };
    else this.tasks = [{ id, title, unit, status, ts: Date.now() }, ...this.tasks];
  }

  private tick() {
    this.tickN++;
    const now = Date.now();
    for (const u of this.units) {
      const r = this.rt.get(u.id)!;
      const def = FLEET.find((f) => f.id === u.id)!;
      if (u.status === 'offline') continue;
      let moved = 0;
      const from: LL = [u.lat, u.lng];

      if (u.kind === 'car') {
        if (r.mode === 'route') {
          if (r.stopLeft > 0) { r.stopLeft--; u.speed = Math.max(0, u.speed - 14); }
          else {
            if (Math.random() < 0.01) r.stopLeft = 5 + Math.floor(Math.random() * 8);
            if (Math.random() < 0.12) r.target = Math.min(80, r.cruise * (0.6 + Math.random() * 0.6));
            u.speed = Math.round(u.speed + Math.max(-6, Math.min(6, r.target - u.speed)));
          }
          moved = (u.speed / 3.6) * SCALE;
          r.dist += moved;
          const p = pointAt(r.path, r.dist);
          u.lat = p.pos[0]; u.lng = p.pos[1]; u.heading = p.heading;
        } else if (r.mode === 'goto' || r.mode === 'return') {
          const goal = r.mode === 'goto' ? r.goal! : pointAt(r.path, r.dist).pos;
          u.speed = r.mode === 'goto' ? 70 : 55;
          moved = (u.speed / 3.6) * SCALE;
          const np = moveToward(from, goal, moved);
          if (dist(from, np) > 1) u.heading = bearing(from, np);
          u.lat = np[0]; u.lng = np[1];
          if (dist(np, goal) < 25) {
            if (r.mode === 'goto') {
              r.mode = 'hold'; r.holdLeft = 20; u.speed = 0;
              if (this.sos) {
                this.sos.status = 'arrived';
                this.addAlert('info', `وصلت الدورية إلى موقع الاستغاثة`, u.name);
                this.setTask('م-2043', '', '', 'منجزة');
              }
            } else { r.mode = 'route'; u.status = 'active'; u.mission = def.mission; }
          }
        } else if (r.mode === 'hold') {
          u.speed = 0;
          if (--r.holdLeft <= 0) {
            r.mode = 'return';
            if (this.sos) {
              const o = this.units.find((x) => x.id === this.sos!.officerId);
              if (o) { o.status = 'active'; o.mission = FLEET.find((f) => f.id === o.id)!.mission; }
              this.addAlert('info', 'أُغلقت الاستغاثة بعد وصول الدورية وتأمين الموقع', o?.name);
              this.sos = null;
            }
          }
        }
        if (u.status !== 'responding') u.status = u.speed < 1 ? 'stopped' : 'active';
        u.odometer += moved / 1000 / SCALE;
        if (u.speed >= 76 && now - r.lastSpeedAlert > 90000) {
          r.lastSpeedAlert = now;
          this.addAlert('speed', `تجاوز السرعة المحددة — ${u.speed} كم/س`, u.name);
        }
      } else {
        if (u.status !== 'sos') {
          if (--r.statusLeft <= 0) {
            u.status = u.status === 'active' ? 'available' : 'active';
            u.mission = u.status === 'active' ? def.mission : 'بانتظار التكليف التالي';
            r.statusLeft = 40 + Math.floor(Math.random() * 50);
          }
          u.speed = u.status === 'active' ? 4 : 0;
          moved = (u.speed / 3.6) * SCALE;
          r.dist += moved;
          const p = pointAt(r.path, r.dist);
          u.lat = p.pos[0]; u.lng = p.pos[1]; u.heading = p.heading;
        } else u.speed = 0;
        u.battery = Math.max(5, u.battery - 0.004);
        if (Math.random() < 0.08) u.signal = Math.max(2, Math.min(5, u.signal + (Math.random() < 0.5 ? -1 : 1)));
      }

      u.lastUpdate = now;
      const inside = inPolygon([u.lat, u.lng], GEOFENCE);
      if (inside !== r.inFence) {
        r.inFence = inside;
        this.addAlert('geofence', `${inside ? 'دخلت' : 'غادرت'} ${u.kind === 'car' ? 'دورية ' + u.label : u.name} ${GEOFENCE_NAME}`, u.name);
      }
    }
    this.emit();
  }

  /** SOS from the officer nearest to the given reference position. */
  triggerSos(ref: LL) {
    if (this.sos) return;
    const officers = this.units.filter((u) => u.kind === 'officer');
    const o = officers.sort((a, b) => dist([a.lat, a.lng], ref) - dist([b.lat, b.lng], ref))[0];
    o.status = 'sos'; o.speed = 0; o.mission = 'استغاثة — بانتظار الاستجابة';
    this.sos = { officerId: o.id, since: Date.now(), status: 'waiting' };
    this.addAlert('sos', `استغاثة عاجلة من ${o.name} — ${nearestLandmark(o.lat, o.lng)}`, o.name);
    this.emit();
  }
  receiveSos() {
    if (!this.sos || this.sos.status !== 'waiting') return;
    this.sos.status = 'received';
    const o = this.units.find((u) => u.id === this.sos!.officerId)!;
    this.addAlert('info', 'تم استقبال الاستغاثة من غرفة العمليات', o.name);
    this.audit = [{ id: ++this.seq, ts: Date.now(), user: USER, action: `استقبال استغاثة — ${o.name}` }, ...this.audit];
    this.emit();
  }
  dispatchNearest() {
    if (!this.sos || (this.sos.status !== 'waiting' && this.sos.status !== 'received')) return;
    const o = this.units.find((u) => u.id === this.sos!.officerId)!;
    const cars = this.units.filter((u) => u.kind === 'car' && u.status !== 'offline');
    const car = cars.sort((a, b) => dist([a.lat, a.lng], [o.lat, o.lng]) - dist([b.lat, b.lng], [o.lat, o.lng]))[0];
    const r = this.rt.get(car.id)!;
    r.mode = 'goto'; r.goal = [o.lat, o.lng];
    car.status = 'responding'; car.mission = `استجابة لاستغاثة — ${o.name}`;
    this.sos.status = 'dispatched'; this.sos.carId = car.id;
    this.addAlert('info', `إرسال أقرب دورية إلى موقع الاستغاثة`, car.name);
    this.setTask('م-2043', `الاستجابة لاستغاثة ${o.name}`, car.name, 'جاري التنفيذ');
    this.audit = [{ id: ++this.seq, ts: Date.now(), user: USER, action: `إرسال ${car.name} للاستجابة لاستغاثة` }, ...this.audit];
    this.emit();
  }
  triggerAi() {
    const ref = LANDMARKS[2].pos;
    const cars = this.units.filter((u) => u.kind === 'car' && u.status !== 'offline');
    const car = cars.sort((a, b) => dist([a.lat, a.lng], ref) - dist([b.lat, b.lng], ref))[0];
    this.addAlert('ai', 'تم رصد شخص — الكاميرا الأمامية، شارع طرابلس', car.name, 'درجة الثقة ٩٤٪');
    this.emit();
  }
}

export const sim = new Sim();
