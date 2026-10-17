'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { TopBar } from './TopBar';
import { UnitTree } from './UnitTree';
import { DetailsPanel } from './DetailsPanel';
import { BottomTabs } from './BottomTabs';
import { LiveView } from './LiveView';
import { SosBanner } from './SosBanner';
import { KillDialog } from './KillDialog';
import { MissionPicker } from './MissionPicker';
import { MultiLiveView } from './MultiLiveView';
import { AiRecognition } from './AiRecognition';
import { useSim } from '@/lib/simulation/useSim';
import { sim } from '@/lib/simulation/engine';
import { beep } from '@/lib/sound';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

export default function App() {
  const snap = useSim();
  const [selectedId, setSelectedId] = useState('c1');
  const [live, setLive] = useState(false);
  const [camId, setCamId] = useState('front');
  const [track, setTrack] = useState(false);
  const [muted, setMuted] = useState(true);
  const [kill, setKill] = useState(false);
  // Mission state — for multi-unit special-ops live view
  const [mission, setMission] = useState<string[]>([]);          // unit IDs in the active mission
  const [pickerOpen, setPickerOpen] = useState(false);           // picker dialog visibility
  const [multiLive, setMultiLive] = useState(false);             // fullscreen multi-view visibility
  const [aiOpen, setAiOpen] = useState(false);                   // AI recognition overlay visibility

  const mutedRef = useRef(muted); mutedRef.current = muted;
  const snapRef = useRef(snap); snapRef.current = snap;
  const selRef = useRef(selectedId); selRef.current = selectedId;

  const selected = snap.units.find((u) => u.id === selectedId) ?? snap.units[0];

  const select = useCallback((id: string) => { setSelectedId(id); setTrack(false); setCamId(id.startsWith('c') ? 'front' : 'body'); }, []);

  const openLive = useCallback((cam?: string) => {
    const u = snapRef.current.units.find((x) => x.id === selRef.current)!;
    if (cam) setCamId(cam);
    setLive(true);
    sim.addAudit(u.kind === 'car' ? `مشاهدة بث كاميرات ${u.name}` : `مشاهدة بث كاميرا الصدر — ${u.name}`);
  }, []);

  // Start mission: store IDs, write audit log, open fullscreen view
  const startMission = useCallback((ids: string[]) => {
    setMission(ids);
    setPickerOpen(false);
    setMultiLive(true);
    const cars = ids.filter((id) => id.startsWith('c')).length;
    const officers = ids.length - cars;
    sim.addAudit(`بدء بثّ مهمة خاصة — ${ids.length} وحدات (${cars} دورية، ${officers} ضابط)`);
  }, []);

  // Hidden demo triggers — layout-independent key codes, never shown in the UI.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') || e.ctrlKey || e.metaKey || e.altKey) return;
      const u = snapRef.current.units.find((x) => x.id === selRef.current)!;
      if (e.code === 'KeyS') sim.triggerSos([u.lat, u.lng]);
      else if (e.code === 'KeyA') sim.triggerAi();
      else if (e.code === 'KeyK') setKill(true);
      else if (e.code === 'KeyM') setPickerOpen(true);  // M = Mission picker
      else if (e.code === 'KeyR') setAiOpen(true);       // R = AI recognition
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Alert sound (muted by default).
  const lastAlert = useRef(snap.alerts[0]?.id ?? 0);
  useEffect(() => {
    const top = snap.alerts[0];
    if (top && top.id !== lastAlert.current) {
      lastAlert.current = top.id;
      if (!mutedRef.current && (top.kind === 'sos' || top.kind === 'ai')) beep(top.kind === 'sos');
    }
  }, [snap.alerts]);

  // Live-filter mission units (drop any that no longer exist)
  const missionUnits = mission
    .map((id) => snap.units.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => !!u);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink">
      <TopBar
        muted={muted}
        onMute={() => setMuted((m) => !m)}
        missionCount={mission.length}
        onMission={() => setPickerOpen(true)}
        onAi={() => setAiOpen(true)}
      />
      <SosBanner sos={snap.sos} units={snap.units} onFocus={select} />
      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_370px] grid-rows-[minmax(0,1fr)_250px] 2xl:grid-cols-[330px_minmax(0,1fr)_410px] 2xl:grid-rows-[minmax(0,1fr)_270px]">
        <div className="row-span-1 flex min-h-0 flex-col"><UnitTree units={snap.units} selectedId={selectedId} onSelect={select} /></div>
        <div className="relative min-h-0 bg-[#0c0d0f]">
          <MapView units={snap.units} selectedId={selectedId} onSelect={select} showTrack={track} />
        </div>
        <DetailsPanel unit={selected} units={snap.units} sos={snap.sos} onLive={openLive} onCam={setCamId} showTrack={track} onTrack={() => setTrack((t) => !t)} />
        <div className="col-span-3 min-h-0"><BottomTabs snap={snap} selectedId={selectedId} onSelect={select} /></div>
      </div>
      <LiveView unit={live ? selected : null} camId={camId} onCam={setCamId} onClose={() => setLive(false)} />
      <KillDialog open={kill} unit={selected} onClose={() => setKill(false)} />

      {/* Multi-unit mission mode */}
      <MissionPicker
        open={pickerOpen}
        units={snap.units}
        initialSelected={mission}
        onClose={() => setPickerOpen(false)}
        onStart={startMission}
      />
      {multiLive && missionUnits.length > 0 && (
        <MultiLiveView
          units={missionUnits}
          sos={snap.sos}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onClose={() => setMultiLive(false)}
          onAdd={() => setPickerOpen(true)}
        />
      )}

      {/* AI recognition — wanted suspects / ID cards / plates */}
      {aiOpen && (
        <AiRecognition
          units={snap.units}
          onClose={() => setAiOpen(false)}
          onAudit={(action) => sim.addAudit(action)}
        />
      )}
    </div>
  );
}
