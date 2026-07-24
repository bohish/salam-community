// Lightweight chemistry model inspired by EA FC 26 rules.
// - A player only contributes/receives chemistry when placed at one of their positions.
// - Points come from teammates sharing club / league / nation, capped per source (0-3).
// - Player chem is capped at 3; team chem is the sum (0-33).
import type { SquadPlayer } from "@/types/squad";

const CLUB_BREAKS = [0, 2, 4, 7];      // required teammates for 1/2/3 club points
const LEAGUE_BREAKS = [0, 3, 5, 8];    // for 1/2/3 league points
const NATION_BREAKS = [0, 2, 5, 8];    // for 1/2/3 nation points

const level = (n: number, breaks: number[]) => {
  let lvl = 0;
  for (let i = 1; i < breaks.length; i++) if (n >= breaks[i]) lvl = i;
  return lvl;
};

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

const positionMatches = (p: SquadPlayer, slot: string): boolean => {
  if (!p.position) return false;
  if (p.position === slot) return true;
  return (p.altPositions ?? []).includes(slot);
};

export interface ChemistryReport {
  perSlot: Record<string, number>;         // slotId -> 0..3
  team: number;                            // 0..33
  outOfPosition: string[];                 // slotIds with position mismatch
}

export function computeChemistry(
  slots: { id: string; position: string; player: SquadPlayer | null }[],
): ChemistryReport {
  const filled = slots.filter((s) => s.player) as {
    id: string; position: string; player: SquadPlayer;
  }[];

  // Tallies across the entire squad (all filled slots, regardless of position match).
  const clubTally = new Map<string, number>();
  const leagueTally = new Map<string, number>();
  const nationTally = new Map<string, number>();
  for (const s of filled) {
    const p = s.player;
    if (p.club) clubTally.set(norm(p.club), (clubTally.get(norm(p.club)) ?? 0) + 1);
    if (p.league) leagueTally.set(norm(p.league), (leagueTally.get(norm(p.league)) ?? 0) + 1);
    if (p.nation) nationTally.set(norm(p.nation), (nationTally.get(norm(p.nation)) ?? 0) + 1);
  }

  const perSlot: Record<string, number> = {};
  const outOfPosition: string[] = [];

  for (const s of slots) {
    if (!s.player) { perSlot[s.id] = 0; continue; }
    if (!positionMatches(s.player, s.position)) {
      perSlot[s.id] = 0;
      outOfPosition.push(s.id);
      continue;
    }
    const p = s.player;
    const c = level((clubTally.get(norm(p.club)) ?? 1) - 0, CLUB_BREAKS);
    const l = level((leagueTally.get(norm(p.league)) ?? 1) - 0, LEAGUE_BREAKS);
    const n = level((nationTally.get(norm(p.nation)) ?? 1) - 0, NATION_BREAKS);
    perSlot[s.id] = Math.min(3, c + l + n);
  }

  const team = Object.values(perSlot).reduce((a, b) => a + b, 0);
  return { perSlot, team: Math.min(33, team), outOfPosition };
}

export function computeSquadRating(players: (SquadPlayer | null)[]): number {
  const rated = players.filter(Boolean) as SquadPlayer[];
  if (rated.length === 0) return 0;
  // Simple average (rounded down) — good enough for a live HUD without EA's proprietary curve.
  const avg = rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length;
  return Math.round(avg);
}

export function computeTotalPrice(players: (SquadPlayer | null)[]): { total: number; missing: number } {
  let total = 0, missing = 0;
  for (const p of players) {
    if (!p) continue;
    if (typeof p.price === "number" && p.price > 0) total += p.price;
    else missing++;
  }
  return { total, missing };
}
