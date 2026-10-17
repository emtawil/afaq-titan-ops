'use client';
import { useEffect, useRef } from 'react';
import type { Cam } from './cameras';

const W = 320, H = 180;
export function SyntheticFeed({ kind, seed = 1 }: { kind: Cam['kind']; seed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    let raf = 0, last = 0;
    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (ts - last < 55) return;
      last = ts;
      const t = ts / 1000 + seed * 3.1;
      g.fillStyle = '#0a0b0d'; g.fillRect(0, 0, W, H);
      if (kind === 'front' || kind === 'rear' || kind === 'body') {
        const sway = kind === 'body' ? Math.sin(t * 2.2) * 4 : 0;
        const bob = kind === 'body' ? Math.abs(Math.sin(t * 2.2)) * 3 : 0;
        const hz = 78 + bob;
        const sky = g.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, '#12161c'); sky.addColorStop(1, '#2a2622');
        g.fillStyle = sky; g.fillRect(0, 0, W, hz);
        const dir = kind === 'rear' ? -1 : 1;
        for (let i = 0; i < 9; i++) { // skyline blocks
          const x = ((i * 47 + seed * 13) % 340) - 10; const h = 18 + ((i * 29) % 34);
          g.fillStyle = '#15181c'; g.fillRect(x + sway, hz - h, 30, h);
        }
        g.fillStyle = '#1a1b1d'; g.beginPath();
        g.moveTo(W / 2 - 14 + sway, hz); g.lineTo(W / 2 + 14 + sway, hz); g.lineTo(W + 60, H); g.lineTo(-60, H); g.fill();
        g.fillStyle = '#2b2a28';
        for (let s = -1; s <= 1; s += 2) { // curbs
          g.beginPath(); g.moveTo(W / 2 + s * 14 + sway, hz); g.lineTo(W / 2 + s * 18 + sway, hz); g.lineTo(W / 2 + s * 150, H); g.lineTo(W / 2 + s * 120, H); g.fill();
        }
        g.fillStyle = '#b8a27a';
        for (let i = 0; i < 8; i++) { // lane dashes
          const f = (((i / 8) + dir * t * 0.35) % 1 + 1) % 1; const y = hz + (H - hz) * f * f;
          const wd = 1 + f * 5, hh = 2 + f * 16;
          g.fillRect(W / 2 - wd / 2 + sway * (1 - f), y, wd, hh);
        }
        g.fillStyle = '#d7c9a8'; g.fillRect(0, hz, W, 1);
      } else if (kind === 'side') {
        g.fillStyle = '#16191d'; g.fillRect(0, 0, W, 100);
        for (let i = 0; i < 6; i++) {
          const x = (((i * 90) - t * 70 * (1 + seed * 0.1)) % 540 + 540) % 540 - 100;
          g.fillStyle = i % 2 ? '#201f1d' : '#262421'; g.fillRect(x, 20 + (i % 3) * 8, 84, 100);
          g.fillStyle = '#3b352b';
          for (let w = 0; w < 3; w++) g.fillRect(x + 10 + w * 24, 36 + (i % 3) * 8, 14, 18);
        }
        g.fillStyle = '#202122'; g.fillRect(0, 118, W, 62);
        g.fillStyle = '#3a3a3a'; g.fillRect(0, 118, W, 3);
      } else {
        g.fillStyle = '#0e0f11'; g.fillRect(0, 0, W, H);
        const win = g.createLinearGradient(0, 0, 0, 70); win.addColorStop(0, '#2a2f36'); win.addColorStop(1, '#14171b');
        g.fillStyle = win; g.fillRect(40, 8, 240, 62);
        g.fillStyle = '#d9a35a22'; g.fillRect(40 + ((t * 20) % 200), 8, 30, 62);
        g.fillStyle = '#15171a'; g.fillRect(0, 100, W, 80);
        g.strokeStyle = '#2b2d31'; g.lineWidth = 9; g.beginPath(); g.arc(W / 2 + 40, 175, 52, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        g.fillStyle = '#B8733388'; g.fillRect(70, 112, 40, 3);
      }
      const v = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 190);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = v; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) { // film grain
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`;
        g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [kind, seed]);
  return <canvas ref={ref} width={W} height={H} className="absolute inset-0 h-full w-full object-cover" />;
}
