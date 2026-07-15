// FUT.GG public API service — provides special/promo/event cards that the base
// msmc.cc API does not expose (TOTW, TOTY, Hero, Icon, SBC, Objective, etc).
// No auth required. Endpoints discovered from FUT.GG's public web bundle.

const BASE = "https://www.fut.gg/api/fut";

export interface FutGgFaceStats {
  facePace: number; faceShooting: number; facePassing: number;
  faceDribbling: number; faceDefending: number; facePhysicality: number;
}

export interface FutGgPlayer {
  id: number;
  eaId: number;
  slug: string;
  basePlayerSlug: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  commonName?: string | null;
  cardName?: string | null;
  overall: number;
  position: string;
  alternativePositions?: string[] | null;
  faceStatsV2: FutGgFaceStats;
  rarityName: string;
  rarityGroupName?: string | null;
  isSpecial: boolean;
  isIcon: boolean;
  isHero: boolean;
  isSbc: boolean;
  isObjective: boolean;
  isEvolutionPlayerItem?: boolean;
  evolutionName?: string | null;
  foot?: string;
  weakFoot?: number;
  skillMoves?: number;
  height?: number;
  price?: number | null;
  cardImageUrl?: string;
  simpleCardImageUrl?: string;
  socialImageUrl?: string;
  imageUrl?: string;
  club?: { name: string; imageUrl?: string; slug?: string } | null;
  nation?: { name: string; imageUrl?: string; slug?: string } | null;
  league?: { name: string; imageUrl?: string; slug?: string } | null;
  createdAt?: string;
  url?: string;
}

interface Paginated<T> {
  currentPage: number;
  next: number | null;
  totalPages: number;
  data: T[];
}

async function req<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`FUT.GG ${res.status}`);
  return res.json() as Promise<T>;
}

export const futggApi = {
  /** Latest player items (all card versions incl. promos/TOTW/TOTY). */
  listPlayers: (page = 1, signal?: AbortSignal) =>
    req<Paginated<FutGgPlayer>>(`/players/v2/26/?page=${page}`, signal),

  /** Upgrade Hub — newly released / upgraded special cards. */
  upgradeHub: (page = 1, signal?: AbortSignal) =>
    req<Paginated<FutGgPlayer>>(`/upgrade-hub/26/?page=${page}`, signal),

  /** Global search across FUT.GG players. */
  search: (query: string, signal?: AbortSignal) =>
    req<{ data: FutGgPlayer[]; totalCount: number }>(
      `/players/v2/search/?query=${encodeURIComponent(query)}&game=26`,
      signal
    ),

  /** Evolutions catalog (v3). */
  evolutions: (page = 1, signal?: AbortSignal) =>
    req<Paginated<any>>(`/evolutions/v2/26/v3/all/?page=${page}`, signal),

  /** SBC catalog. */
  sbcs: (page = 1, signal?: AbortSignal) =>
    req<Paginated<any>>(`/sbc/26/?page=${page}`, signal),
};

/** Human-friendly display name. */
export const displayName = (p: FutGgPlayer): string =>
  p.commonName || p.nickname || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();

/** Category label for a special card (Arabic). */
export const categoryLabel = (p: FutGgPlayer): string => {
  if (p.isIcon) return "Icon";
  if (p.isHero) return "Hero";
  if (p.isEvolutionPlayerItem) return "Evolution";
  if (p.isSbc) return "SBC";
  if (p.isObjective) return "Objective";
  if (p.isSpecial) return p.rarityGroupName || p.rarityName || "Special";
  return p.rarityName || "Gold";
};
