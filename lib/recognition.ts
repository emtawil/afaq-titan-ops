// AI recognition simulation engine.
// In a production deployment, every function here would be replaced by a real call
// to a local inference service (face recognition model + ANPR pipeline + ID OCR).
// For this demo, we synthesize realistic outcomes so the UI flow can be evaluated
// without running actual models.
import { WANTED, ID_RECORDS, VEHICLES, type WantedPerson, type IdRecord, type VehicleRecord } from '@/data/wanted';
import type { Unit } from '@/lib/simulation/types';

export type ScanMode = 'face' | 'id' | 'plate';
export type ScanStatus = 'idle' | 'scanning' | 'matched' | 'no-match' | 'error';

export type FaceScanResult = {
  status: 'matched' | 'no-match';
  confidence: number;          // 0..1
  match?: WantedPerson;
  durationMs: number;
  sourceUnit?: string;
  sourceCam?: string;
  candidates: { id: string; name: string; score: number }[];
};

export type IdScanResult = {
  status: 'matched' | 'no-match';
  confidence: number;
  record?: IdRecord;
  wanted?: WantedPerson;        // cross-reference if record.wantedRefId exists
  durationMs: number;
  extractedText: { field: string; value: string }[];
};

export type PlateScanResult = {
  status: 'matched' | 'no-match';
  confidence: number;
  record?: VehicleRecord;
  ownerWanted?: WantedPerson;   // cross-reference if owner is wanted
  durationMs: number;
  plate: string;
};

// Pick a plausible suspect based on which unit is being scanned.
// Cars patrolling near a wanted person's last-seen location get higher
// match probability — this makes the demo feel geographically aware.
function suspectForUnit(unit: Unit): WantedPerson | null {
  const car = unit.kind === 'car';
  if (!car) {
    // Officers on foot — low base rate, but officers near شارع طرابلس see w4 more often
    if (Math.abs(unit.lat - 32.3754) < 0.0015 && Math.abs(unit.lng - 15.0900) < 0.002) {
      return WANTED.find((w) => w.id === 'w4') ?? null;
    }
    return null;
  }
  // Cars: bias by which route the car is on (mapped to its mission text)
  switch (unit.id) {
    case 'c1': return WANTED.find((w) => w.id === 'w2') ?? null;   // downtown
    case 'c2': return WANTED.find((w) => w.id === 'w5') ?? null;   // coastal
    case 'c3': return WANTED.find((w) => w.id === 'w4') ?? null;   // airport
    case 'c4': return WANTED.find((w) => w.id === 'w2') ?? null;   // old city
    case 'c5': return WANTED.find((w) => w.id === 'w3') ?? null;   // eastern road → port
    default: return null;
  }
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Simulate a face-recognition scan against the wanted DB. */
export async function scanFace(unit: Unit, camId: string): Promise<FaceScanResult> {
  const t0 = performance.now();
  // Realistic scan latency: 1.8 – 3.4 s
  await wait(1800 + Math.random() * 1600);

  const suspect = suspectForUnit(unit);
  // Probability of a match depends on:
  //   - whether the suspect's last-seen area overlaps the unit's route
  //   - the suspect's matchBias (their "conspicuousness" in the demo)
  // Demo tuning: ~38% chance of a hit when scanning a relevant car,
  // ~10% chance for officers on foot near landmarks, 0% for offline units.
  let matchProb = 0;
  if (suspect) matchProb = suspect.matchBias * 0.55;
  // Cars have a slightly higher hit rate than officers in this demo
  if (unit.kind === 'car') matchProb = Math.min(0.6, matchProb + 0.08);

  const hit = Math.random() < matchProb;
  if (!hit) {
    return {
      status: 'no-match',
      confidence: 0.92 + Math.random() * 0.07,
      durationMs: performance.now() - t0,
      sourceUnit: unit.id,
      sourceCam: camId,
      candidates: WANTED.slice(0, 3).map((w) => ({
        id: w.id, name: w.name, score: Math.round((0.18 + Math.random() * 0.22) * 100) / 100,
      })),
    };
  }

  // We have a match. Build candidate list with the matched suspect on top.
  const others = WANTED.filter((w) => w.id !== suspect!.id).slice(0, 3);
  const candidates = [
    { id: suspect!.id, name: suspect!.name, score: Math.round((0.86 + Math.random() * 0.11) * 100) / 100 },
    ...others.map((w) => ({ id: w.id, name: w.name, score: Math.round((0.10 + Math.random() * 0.25) * 100) / 100 })),
  ].sort((a, b) => b.score - a.score);

  return {
    status: 'matched',
    confidence: candidates[0].score,
    match: suspect!,
    durationMs: performance.now() - t0,
    sourceUnit: unit.id,
    sourceCam: camId,
    candidates,
  };
}

/** Simulate an ID-card OCR + verification scan. */
export async function scanId(unit: Unit): Promise<IdScanResult> {
  const t0 = performance.now();
  await wait(1500 + Math.random() * 1400);
  // For demo: cycle through ID records so the user sees different cards.
  // Pick one based on a hash of tick + unit id for "feels random but repeatable"
  const idx = Math.floor(Math.random() * (ID_RECORDS.length + 1));
  // ~16% chance of "no ID detected" (card blurred / wrong angle)
  if (idx >= ID_RECORDS.length) {
    return {
      status: 'no-match',
      confidence: 0.0,
      durationMs: performance.now() - t0,
      extractedText: [
        { field: 'الحالة', value: 'تعذّر قراءة البطاقة — العدسة غير واضحة أو الزاوية غير صحيحة' },
      ],
    };
  }
  const r = ID_RECORDS[idx];
  const wanted = r.wantedRefId ? WANTED.find((w) => w.id === r.wantedRefId) : undefined;
  return {
    status: 'matched',
    confidence: 0.94 + Math.random() * 0.05,
    record: r,
    wanted,
    durationMs: performance.now() - t0,
    extractedText: [
      { field: 'الاسم', value: r.name },
      { field: 'الرقم الوطني', value: r.nationalId },
      { field: 'تاريخ الميلاد', value: r.dob },
      { field: 'الجنسية', value: r.nationality },
      { field: 'الجنس', value: r.gender },
      { field: 'العنوان', value: r.address },
      { field: 'تاريخ الإصدار', value: r.issued },
      { field: 'تاريخ الانتهاء', value: r.expiry },
      { field: 'الحالة', value: r.status },
    ],
  };
}

/** Simulate an ANPR (Automatic Number Plate Recognition) scan. */
export async function scanPlate(unit: Unit): Promise<PlateScanResult> {
  const t0 = performance.now();
  await wait(1300 + Math.random() * 1100);
  // For demo: bias toward finding plates that have something interesting.
  const interesting = VEHICLES.filter((v) => v.wanted || v.stolen || v.registrationStatus !== 'سارية');
  const normal = VEHICLES.filter((v) => !v.wanted && !v.stolen && v.registrationStatus === 'سارية');
  // ~70% chance of finding an "interesting" plate when scanning from a patrol car,
  // ~30% from an officer's body cam. ~10% no-read (plate obscured).
  const noRead = Math.random() < 0.10;
  if (noRead) {
    return {
      status: 'no-match',
      confidence: 0.0,
      durationMs: performance.now() - t0,
      plate: '---',
    };
  }
  const useInteresting = Math.random() < (unit.kind === 'car' ? 0.7 : 0.3);
  const pool = useInteresting && interesting.length > 0 ? interesting : normal;
  const v = pool[Math.floor(Math.random() * pool.length)];
  // Cross-reference: if the vehicle is flagged wanted, look up the owner in the WANTED DB by national ID.
  const wantedRef = v.wanted ? WANTED.find((w) => w.nationalId === v.ownerId) : undefined;
  return {
    status: 'matched',
    confidence: 0.93 + Math.random() * 0.06,
    record: v,
    ownerWanted: wantedRef,
    durationMs: performance.now() - t0,
    plate: v.plate,
  };
}
