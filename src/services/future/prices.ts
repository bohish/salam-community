// Placeholder service — market prices (future integration).
// When a real prices provider is available, implement fetchPrice(id) here
// and expose a `usePrice(id)` hook via React Query. UI layers should import
// only from `@/services/future/prices` so swapping providers is transparent.
export interface PriceSnapshot {
  playerId: string;
  ps: number | null;
  xbox: number | null;
  pc: number | null;
  updatedAt: string;
}

export const fetchPrice = async (_playerId: string): Promise<PriceSnapshot | null> => null;
