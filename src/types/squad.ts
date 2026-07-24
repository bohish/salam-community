// Types for the Squad Builder feature. Kept minimal and independent from the raw MSMC / FUT.GG shapes.
export interface SquadPlayer {
  id: number;
  name: string;
  rating: number;
  position: string;
  altPositions: string[];
  club: string | null;
  nation: string | null;
  league: string | null;
  price: number | null;
  cardUrl: string | null;
  isSpecial?: boolean;
  rarity?: string | null;
}

export interface SquadSlotState {
  id: string;
  position: string;
  x: number;
  y: number;
  player: SquadPlayer | null;
  reason?: string;
}

export interface Squad {
  formation: string;
  slots: SquadSlotState[];
}

export interface BuildFilters {
  budget?: number;
  minRating?: number;
  nation?: string;
  league?: string;
  club?: string;
  preferSpecial?: boolean;
}

export type SquadCommand =
  | { action: "build"; formation: string; filters?: BuildFilters }
  | { action: "cheaper"; targetBudget?: number }
  | { action: "improve_chem" }
  | { action: "change_formation"; formation: string }
  | { action: "candidates"; slotId: string; filters?: BuildFilters };
