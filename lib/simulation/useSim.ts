import { useSyncExternalStore } from 'react';
import { sim } from './engine';
export function useSim() {
  return useSyncExternalStore(sim.subscribe, sim.getSnapshot, sim.getSnapshot);
}
