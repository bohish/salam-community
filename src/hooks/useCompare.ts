import type { Player } from "@/types/player";

// Simple in-memory store without zustand dependency
type Listener = () => void;
const listeners = new Set<Listener>();
let state: Player[] = [];

const notify = () => listeners.forEach((l) => l());

export function useCompare() {
  const [, setTick] = useReactState(0);

  useReactEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    players: state,
    has: (id: number) => state.some((p) => p.id === id),
    add: (player: Player) => {
      if (state.length >= 4) return;
      if (state.some((p) => p.id === player.id)) return;
      state = [...state, player];
      notify();
    },
    remove: (id: number) => {
      state = state.filter((p) => p.id !== id);
      notify();
    },
    clear: () => { state = []; notify(); },
  };
}

// re-export from react to keep hook rules
import { useState as useReactState, useEffect as useReactEffect } from "react";
