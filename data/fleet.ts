import type { LL } from '@/lib/geo';

// ── Misrata (مصراتة) geography ───────────────────────────────────────────────
// Center: 32.3754° N, 15.0920° E. Coastal city on the Mediterranean, ~210 km east of Tripoli.
// Port of Misrata (Qasr Ahmed): ~32.344° N, 15.15° E. The city's main commercial artery is
// شارع طرابلس (Tripoli Street), running through the downtown core next to المدينة القديمة.
// ──────────────────────────────────────────────────────────────────────────────

export const GEOFENCE_NAME = 'منطقة وسط مصراتة';
export const GEOFENCE: LL[] = [
  [32.3810, 15.0830], [32.3810, 15.1000], [32.3720, 15.1000], [32.3720, 15.0830],
];
export const MAP_CENTER: LL = [32.3754, 15.0920];

export const LANDMARKS: { name: string; pos: LL }[] = [
  { name: 'ميدان الشهداء', pos: [32.3775, 15.0920] },       // central square, downtown
  { name: 'المدينة القديمة', pos: [32.3785, 15.0885] },     // old city, NW of center
  { name: 'شارع طرابلس', pos: [32.3754, 15.0900] },          // main commercial artery
  { name: 'الطريق الساحلي', pos: [32.3850, 15.0700] },      // coastal road, NW approach
  { name: 'طريق المطار', pos: [32.3550, 15.1000] },         // southern approach toward airport
  { name: 'ميناء مصراتة', pos: [32.3440, 15.1500] },        // Port of Misrata (Qasr Ahmed)
  { name: 'حي قصر أحمد', pos: [32.3800, 15.0800] },        // Qasr Ahmed neighborhood
];

export type FleetDef = {
  id: string; kind: 'car' | 'officer'; label: string; name: string; org?: string; driver?: string; rank?: string;
  route: LL[]; mode: 'pingpong' | 'loop'; cruise: number; mission: string; odometer?: number; offline?: boolean;
};

const loop = (c: LL, dy: number, dx: number): LL[] => [
  [c[0] + dy, c[1] - dx], [c[0] + dy, c[1] + dx], [c[0] - dy, c[1] + dx], [c[0] - dy, c[1] - dx],
];

export const FLEET: FleetDef[] = [
  // c1 — downtown preventive patrol, slow loop through the city core
  { id: 'c1', kind: 'car', label: '4471', name: 'دورية 4471', org: 'مديرية أمن مصراتة — النجدة', driver: 'الرقيب سالم الورفلي',
    route: [[32.3775, 15.0920], [32.3755, 15.0955], [32.3730, 15.0935], [32.3720, 15.0885], [32.3750, 15.0850], [32.3785, 15.0870]],
    mode: 'loop', cruise: 38, mission: 'دورية وقائية — وسط مصراتة', odometer: 48213 },
  // c2 — coastal road patrol, NW toward the city then SE toward the port
  { id: 'c2', kind: 'car', label: '4472', name: 'دورية 4472', org: 'مديرية أمن مصراتة — النجدة', driver: 'العريف عمر المصراتي',
    route: [[32.3850, 15.0700], [32.3800, 15.0850], [32.3750, 15.1100], [32.3650, 15.1350], [32.3500, 15.1500]],
    mode: 'pingpong', cruise: 62, mission: 'تأمين الطريق الساحلي', odometer: 61877 },
  // c3 — airport road south, traffic monitoring
  { id: 'c3', kind: 'car', label: '4473', name: 'دورية 4473', org: 'إدارة المرور والتراخيص', driver: 'الملازم أول يوسف الزنتاني',
    route: [[32.3700, 15.0900], [32.3550, 15.0980], [32.3450, 15.1080], [32.3350, 15.1180]],
    mode: 'pingpong', cruise: 55, mission: 'مراقبة حركة السير — طريق المطار', odometer: 35540 },
  // c4 — old city coverage, tight loop
  { id: 'c4', kind: 'car', label: '4474', name: 'دورية 4474', org: 'مديرية أمن مصراتة — الدوريات الراجلة', driver: 'العريف خالد الترهوني',
    route: [[32.3780, 15.0880], [32.3785, 15.0895], [32.3775, 15.0900], [32.3770, 15.0888], [32.3778, 15.0875]],
    mode: 'loop', cruise: 22, mission: 'تغطية المدينة القديمة', odometer: 27304 },
  // c5 — eastern road toward the port
  { id: 'c5', kind: 'car', label: '4475', name: 'دورية 4475', org: 'مديرية أمن مصراتة — النجدة', driver: 'الرقيب أول ناصر العبيدي',
    route: [[32.3780, 15.0950], [32.3720, 15.1150], [32.3600, 15.1400], [32.3480, 15.1550]],
    mode: 'pingpong', cruise: 58, mission: 'دورية الطريق الشرقي', odometer: 72960 },
  // c6 — offline unit, parked in Qasr Ahmed neighborhood
  { id: 'c6', kind: 'car', label: '4476', name: 'دورية 4476', org: 'مديرية أمن مصراتة — النجدة', driver: 'العريف إبراهيم الغرياني',
    route: [[32.3800, 15.0800], [32.3795, 15.0805]], mode: 'pingpong', cruise: 0, mission: 'دورية وقائية — حي قصر أحمد', odometer: 54118, offline: true },
  // Officers — small loops around downtown landmarks
  { id: 'o1', kind: 'officer', label: 'الملازم أحمد الفيتوري', name: 'الملازم أحمد الفيتوري', rank: 'ملازم', org: 'مديرية أمن مصراتة',
    route: loop([32.3775, 15.0920], 0.0007, 0.0009), mode: 'loop', cruise: 4, mission: 'تأمين محيط ميدان الشهداء' },
  { id: 'o2', kind: 'officer', label: 'العريف محمد الككلي', name: 'العريف محمد الككلي', rank: 'عريف', org: 'مديرية أمن مصراتة',
    route: loop([32.3785, 15.0885], 0.0005, 0.0007), mode: 'loop', cruise: 4, mission: 'دورية راجلة — المدينة القديمة' },
  { id: 'o3', kind: 'officer', label: 'الرقيب فتحي الشريف', name: 'الرقيب فتحي الشريف', rank: 'رقيب', org: 'مديرية أمن مصراتة',
    route: loop([32.3754, 15.0900], 0.0006, 0.0008), mode: 'loop', cruise: 4, mission: 'مراقبة التقاطعات — شارع طرابلس' },
  { id: 'o4', kind: 'officer', label: 'الملازم ياسر الدردي', name: 'الملازم ياسر الدردي', rank: 'ملازم', org: 'مديرية أمن مصراتة',
    route: loop([32.3810, 15.0820], 0.0004, 0.0012), mode: 'loop', cruise: 4, mission: 'تأمين الواجهة البحرية' },
];

export const MISSION_LOG = [
  { t: '07:30', text: 'استلام التكليف من غرفة العمليات' },
  { t: '07:42', text: 'الوصول إلى نقطة التمركز المحددة' },
  { t: '08:55', text: 'تفتيش روتيني — لا ملاحظات' },
  { t: '10:10', text: 'تبليغ عن ازدحام مروري — تمت المعالجة' },
  { t: '11:25', text: 'تسليم النقطة وبدء جولة التفقد' },
];
