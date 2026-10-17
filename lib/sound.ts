let ctx: AudioContext | null = null;
export function beep(urgent = false) {
  try {
    ctx = ctx ?? new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = urgent ? 880 : 660;
    g.gain.value = 0.04;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (urgent ? 0.35 : 0.15));
  } catch { /* audio unavailable */ }
}
