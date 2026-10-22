import { useSyncExternalStore } from "react";
import type { GeneratedArchitecture } from "./demoTasks";

// Estado compartido entre la demo ("Te lo demuestro" + Arquitectura) y el juego ("Escapá del caos"):
// el juego lee la tarea y la arquitectura que la persona generó arriba (solo lectura, no genera).

type DemoState = {
  task: string | null;
  architecture: GeneratedArchitecture | null;
};

let state: DemoState = { task: null, architecture: null };
const listeners = new Set<() => void>();

export const demoStore = {
  get: () => state,
  set(next: Partial<DemoState>) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useDemoState() {
  return useSyncExternalStore(demoStore.subscribe, demoStore.get, demoStore.get);
}
