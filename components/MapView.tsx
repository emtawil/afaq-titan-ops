'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Unit } from '@/lib/simulation/types';
import { GEOFENCE, GEOFENCE_NAME, MAP_CENTER, FLEET } from '@/data/fleet';
import { pingPong, type LL } from '@/lib/geo';

const carSvg = (stroke: string, fill: string) =>
  `<svg width="26" height="34" viewBox="0 0 26 34"><polygon points="13,1 24,10 24,30 19,33 7,33 2,30 2,10" fill="${fill}" stroke="${stroke}" stroke-width="2"/><polygon points="13,6 20,12 6,12" fill="${stroke}"/></svg>`;
const offSvg = (stroke: string, fill: string) =>
  `<svg width="22" height="22" viewBox="0 0 22 22"><polygon points="11,1 21,11 11,21 1,11" fill="${fill}" stroke="${stroke}" stroke-width="2"/><circle cx="11" cy="11" r="3" fill="#0D0D0D"/></svg>`;

function iconFor(u: Unit, selected: boolean) {
  const off = u.status === 'offline';
  const sos = u.status === 'sos';
  const stroke = sos ? '#ef4444' : off ? '#6b6b6b' : '#B87333';
  const fill = off ? '#2a2a2a' : u.kind === 'car' ? '#0D0D0D' : sos ? '#ef4444' : '#B87333';
  const svg = u.kind === 'car' ? carSvg(stroke, fill) : offSvg(sos ? '#7f1d1d' : '#0D0D0D', fill);
  const ring = sos ? '<div class="pulse pulse-red"></div>' : selected ? '<div class="pulse"></div>' : '';
  return L.divIcon({
    className: '', iconSize: [44, 44], iconAnchor: [22, 22],
    html: `<div class="mk ${off ? 'mk-off' : ''}">${ring}<div class="rot">${svg}</div><div class="lbl">${u.kind === 'car' ? u.label : ''}</div></div>`,
  });
}

type M = { m: L.Marker; from: LL; to: LL; t0: number; key: string; heading: number };

function Markers({ units, selectedId, onSelect }: { units: Unit[]; selectedId: string; onSelect: (id: string) => void }) {
  const map = useMap();
  const ms = useRef(new Map<string, M>());
  const onSel = useRef(onSelect);
  onSel.current = onSelect;

  useEffect(() => {
    const now = performance.now();
    for (const u of units) {
      const key = `${u.kind}|${u.status === 'offline' ? 'off' : u.status === 'sos' ? 'sos' : 'ok'}|${u.id === selectedId}`;
      let e = ms.current.get(u.id);
      if (!e) {
        const m = L.marker([u.lat, u.lng], { icon: iconFor(u, u.id === selectedId), keyboard: false, zIndexOffset: u.kind === 'car' ? 100 : 200 }).addTo(map);
        m.on('click', () => onSel.current(u.id));
        e = { m, from: [u.lat, u.lng], to: [u.lat, u.lng], t0: now, key, heading: u.heading };
        ms.current.set(u.id, e);
      } else {
        const cur = e.m.getLatLng();
        e.from = [cur.lat, cur.lng]; e.to = [u.lat, u.lng]; e.t0 = now; e.heading = u.heading;
        if (e.key !== key) { e.key = key; e.m.setIcon(iconFor(u, u.id === selectedId)); }
      }
      e.m.setZIndexOffset(u.id === selectedId ? 1000 : u.kind === 'car' ? 100 : 200);
    }
  }, [units, selectedId, map]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      ms.current.forEach((e) => {
        const f = Math.min(1, (now - e.t0) / 1000);
        e.m.setLatLng([e.from[0] + (e.to[0] - e.from[0]) * f, e.from[1] + (e.to[1] - e.from[1]) * f]);
        const rot = e.m.getElement()?.querySelector('.rot') as HTMLElement | null;
        if (rot) rot.style.transform = `rotate(${e.heading}deg)`;
      });
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => { ms.current.forEach((e) => e.m.remove()); ms.current.clear(); }, []);
  return null;
}

function FlyTo({ units, selectedId }: { units: Unit[]; selectedId: string }) {
  const map = useMap();
  const ref = useRef(units);
  ref.current = units;
  useEffect(() => {
    const u = ref.current.find((x) => x.id === selectedId);
    if (u) map.flyTo([u.lat, u.lng], Math.max(map.getZoom(), 14), { duration: 0.9 });
  }, [selectedId, map]);
  return null;
}

export default function MapView({ units, selectedId, onSelect, showTrack }: { units: Unit[]; selectedId: string; onSelect: (id: string) => void; showTrack: boolean }) {
  const def = FLEET.find((f) => f.id === selectedId);
  const track: LL[] = def ? (def.mode === 'pingpong' ? pingPong(def.route) : [...def.route, def.route[0]]) : [];
  return (
    <MapContainer center={MAP_CENTER} zoom={13} minZoom={11} maxZoom={15} zoomControl={false} attributionControl={false}
      maxBounds={[[32.30, 14.92], [32.45, 15.25]]} className="h-full w-full" preferCanvas>
      <TileLayer url="./tiles/{z}/{x}/{y}.png" minZoom={11} maxZoom={15} errorTileUrl="" />
      <Polygon positions={GEOFENCE} pathOptions={{ color: '#B87333', weight: 2, dashArray: '8 6', fillColor: '#B87333', fillOpacity: 0.07 }}>
        <Tooltip sticky direction="top">{GEOFENCE_NAME}</Tooltip>
      </Polygon>
      {showTrack && track.length > 0 && <Polyline positions={track} pathOptions={{ color: '#EA6600', weight: 3, opacity: 0.85 }} />}
      <Markers units={units} selectedId={selectedId} onSelect={onSelect} />
      <FlyTo units={units} selectedId={selectedId} />
      <div className="osm-credit">© Esri · HERE · Garmin · USGS</div>
    </MapContainer>
  );
}
