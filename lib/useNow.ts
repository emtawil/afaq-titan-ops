import { useEffect, useState } from 'react';
const listeners = new Set<(n: number) => void>();
let timer: ReturnType<typeof setInterval> | null = null;
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    listeners.add(setNow);
    if (!timer) timer = setInterval(() => listeners.forEach((l) => l(Date.now())), 1000);
    return () => { listeners.delete(setNow); };
  }, []);
  return now;
}
