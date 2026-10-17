// Synthetic in-memory database for the AI recognition demo.
// All names, ID numbers, plates, and case numbers are FICTIONAL.
// In a production deployment this would be replaced by a real backend
// (e.g. a local PostgreSQL instance + a face-recognition model + an ANPR pipeline).

export type DangerLevel = 'منخفض' | 'متوسط' | 'مرتفع' | 'حرج';

export type WantedPerson = {
  id: string;
  name: string;
  aliases: string[];
  caseNumber: string;
  crime: string;
  danger: DangerLevel;
  lastSeen: string;       // location description
  age: number;
  nationalId: string;
  issuedBy: string;      // إصدار
  status: 'مطلوب' | 'مشتبه' | 'تحت المراقبة';
  // Synthesized "face embedding" — used to bias the scan outcome.
  // Higher = more likely to be matched when scanning a car's front camera
  // in the suspect's geographic vicinity. Demo only.
  matchBias: number;
};

export type IdRecord = {
  nationalId: string;
  name: string;
  dob: string;           // YYYY-MM-DD
  nationality: string;
  gender: 'ذكر' | 'أنثى';
  address: string;
  issued: string;        // issue date
  expiry: string;        // expiry date
  status: 'ساري' | 'منتهي' | 'مفقود';
  // If this person is also wanted, link to the WantedPerson
  wantedRefId?: string;
};

export type VehicleRecord = {
  plate: string;          // e.g. "١٢٣٤٥ ب م"
  owner: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationStatus: 'سارية' | 'منتهية' | 'ملغاة';
  wanted: boolean;
  stolen: boolean;
  stolenSince?: string;
  notes?: string;
};

// ── WANTED PERSONS DATABASE ─────────────────────────────────────────────────
export const WANTED: WantedPerson[] = [
  {
    id: 'w1',
    name: 'سالم محمد العبيدي',
    aliases: ['أبو ظريف', 'سالم الميدان'],
    caseNumber: '٢٠٢٤/م/٣٣٤١',
    crime: 'سرقة مسلحة لمؤسسة تجارية — حي قصر أحمد',
    danger: 'مرتفع',
    lastSeen: 'حي قصر أحمد — مصراتة',
    age: 34,
    nationalId: '٢٠٠٠-١٢-٤٤٨٧١',
    issuedBy: 'مديرية أمن مصراتة',
    status: 'مطلوب',
    matchBias: 0.62,
  },
  {
    id: 'w2',
    name: 'خالد المبروك القذافي',
    aliases: ['خالد التكبسة'],
    caseNumber: '٢٠٢٣/م/٧٧١٢',
    crime: 'تزييف أوراق رسمية وهوية مزوّرة',
    danger: 'متوسط',
    lastSeen: 'وسط المدينة — مصراتة',
    age: 41,
    nationalId: '١٩٩٤-٠٣-١٢٠٨٨',
    issuedBy: 'نيابة مصراتة',
    status: 'مطلوب',
    matchBias: 0.45,
  },
  {
    id: 'w3',
    name: 'مصطفى عبد السلام الدرقي',
    aliases: ['أبو سيف'],
    caseNumber: '٢٠٢٥/م/١١٠٢',
    crime: 'تهريب مواد ممنوعة عبر ميناء مصراتة',
    danger: 'حرج',
    lastSeen: 'محيط ميناء مصراتة',
    age: 38,
    nationalId: '١٩٩٧-٠٧-٢٢٠٤١',
    issuedBy: 'الادارة العامة لمكافحة المخدرات',
    status: 'مطلوب',
    matchBias: 0.71,
  },
  {
    id: 'w4',
    name: 'يوسف فرج الورشفاني',
    aliases: [],
    caseNumber: '٢٠٢٤/م/٤٤٨٥',
    crime: 'احتيال إلكتروني واستيلاء على أموال',
    danger: 'منخفض',
    lastSeen: 'شارع طرابلس — مصراتة',
    age: 29,
    nationalId: '٢٠٠٥-٠٩-٣٣١٢٠',
    issuedBy: 'مديرية أمن مصراتة',
    status: 'مشتبه',
    matchBias: 0.38,
  },
  {
    id: 'w5',
    name: 'ناصر سعيد الكوادي',
    aliases: ['أبو عرفة'],
    caseNumber: '٢٠٢٢/م/٩٩٠٤',
    crime: 'سرقة مركبة والاعتداء على سائقها',
    danger: 'مرتفع',
    lastSeen: 'الطريق الساحلي — غرب مصراتة',
    age: 45,
    nationalId: '١٩٨٢-٠٢-٠٧٧٤١',
    issuedBy: 'إدارة المرور والتراخيص',
    status: 'مطلوب',
    matchBias: 0.58,
  },
];

// ── ID CARD DATABASE (synthetic Libyan national ID records) ──────────────────
export const ID_RECORDS: IdRecord[] = [
  {
    nationalId: '٢٠٠٠-١٢-٤٤٨٧١',
    name: 'سالم محمد العبيدي',
    dob: '١٩٨٩-١٢-٠٤',
    nationality: 'ليبية',
    gender: 'ذكر',
    address: 'مصراتة — حي قصر أحمد — شارع ٧',
    issued: '٢٠١٩-٠٣-١٢',
    expiry: '٢٠٢٩-٠٣-١٢',
    status: 'ساري',
    wantedRefId: 'w1',
  },
  {
    nationalId: '١٩٩٤-٠٣-١٢٠٨٨',
    name: 'خالد المبروك القذافي',
    dob: '١٩٨٣-٠٣-٢٢',
    nationality: 'ليبية',
    gender: 'ذكر',
    address: 'مصراتة — وسط المدينة — شارع طرابلس',
    issued: '٢٠١٨-٠٦-٠١',
    expiry: '٢٠٢٤-٠٦-٠١',
    status: 'منتهي',
    wantedRefId: 'w2',
  },
  {
    nationalId: '١٩٨٥-٠٧-١١٠٢٣',
    name: 'أحمد علي الفيتوري',
    dob: '١٩٨٥-٠٧-١١',
    nationality: 'ليبية',
    gender: 'ذكر',
    address: 'مصراتة — حي الدافنية',
    issued: '٢٠٢٠-٠٢-١٥',
    expiry: '٢٠٣٠-٠٢-١٥',
    status: 'ساري',
  },
  {
    nationalId: '١٩٩٢-٠٤-٢٢٤٤١',
    name: 'عمر خليل الشريف',
    dob: '١٩٩٢-٠٤-٢٢',
    nationality: 'ليبية',
    gender: 'ذكر',
    address: 'مصراتة — حي الزروق',
    issued: '٢٠٢١-٠٥-١٠',
    expiry: '٢٠٣١-٠٥-١٠',
    status: 'ساري',
  },
  {
    nationalId: '٢٠٠٢-٠٨-٥٥٦٦٠',
    name: 'محمد عبد الله الككلي',
    dob: '٢٠٠٢-٠٨-١٧',
    nationality: 'ليبية',
    gender: 'ذكر',
    address: 'مصراتة — شارع المطار',
    issued: '٢٠٢٣-٠١-٠٨',
    expiry: '٢٠٣٣-٠١-٠٨',
    status: 'ساري',
  },
];

// ── VEHICLE / PLATE DATABASE ─────────────────────────────────────────────────
export const VEHICLES: VehicleRecord[] = [
  {
    plate: '٤٤٧١٢',
    owner: 'سالم محمد العبيدي',
    ownerId: '٢٠٠٠-١٢-٤٤٨٧١',
    make: 'تويوتا',
    model: 'كورولا',
    year: 2018,
    color: 'فضي',
    registrationStatus: 'سارية',
    wanted: true,
    stolen: false,
    notes: 'المركبة مرتبطة بقضية سرقة مسلحة — انظر ملف w1',
  },
  {
    plate: '١٢٣٤٥',
    owner: 'أحمد علي الفيتوري',
    ownerId: '١٩٨٥-٠٧-١١٠٢٣',
    make: 'هيونداي',
    model: 'إلنترا',
    year: 2020,
    color: 'أبيض',
    registrationStatus: 'سارية',
    wanted: false,
    stolen: false,
  },
  {
    plate: '٧٧٤١٠',
    owner: 'ناصر سعيد الكوادي',
    ownerId: '١٩٨٢-٠٢-٠٧٧٤١',
    make: 'مرسيدس',
    model: 'C200',
    year: 2015,
    color: 'أسود',
    registrationStatus: 'ملغاة',
    wanted: true,
    stolen: true,
    stolenSince: '٢٠٢٤-٠٩-٠٨',
    notes: 'مركبة مسروقة — المالك الحالي مطلوب للعدالة — انظر ملف w5',
  },
  {
    plate: '٣٣٠٠١',
    owner: 'محمد عبد الله الككلي',
    ownerId: '٢٠٠٢-٠٨-٥٥٦٦٠',
    make: 'كيا',
    model: 'سيراتو',
    year: 2022,
    color: 'رمادي',
    registrationStatus: 'سارية',
    wanted: false,
    stolen: false,
  },
  {
    plate: '٩٩٨٧٢',
    owner: 'عمر خليل الشريف',
    ownerId: '١٩٩٢-٠٤-٢٢٤٤١',
    make: 'نيسان',
    model: 'صني',
    year: 2019,
    color: 'أزرق',
    registrationStatus: 'منتهية',
    wanted: false,
    stolen: false,
    notes: 'ترخيص منتهٍ — يستوجب التحديث',
  },
];
