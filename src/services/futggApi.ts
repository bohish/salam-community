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

  /** All special (promo/TOTW/TOTY/Icon/Hero/SBC) player items — one page. */
  listSpecialPlayers: (page = 1, signal?: AbortSignal) =>
    req<Paginated<FutGgPlayer>>(`/players/v2/26/?isSpecial=1&page=${page}`, signal),

  /** Fetch the first `maxPages` pages of special items concurrently. */
  fetchAllSpecial: async (maxPages = 8, signal?: AbortSignal): Promise<FutGgPlayer[]> => {
    const pages = await Promise.all(
      Array.from({ length: maxPages }, (_, i) =>
        futggApi.listSpecialPlayers(i + 1, signal).catch(() => null)
      )
    );
    const seen = new Set<number>();
    const out: FutGgPlayer[] = [];
    for (const p of pages) {
      if (!p?.data) continue;
      for (const pl of p.data) {
        if (!seen.has(pl.id)) { seen.add(pl.id); out.push(pl); }
      }
    }
    return out;
  },

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

// ----- Promo grouping helpers -----

export interface PromoGroup {
  slug: string;
  name: string;
  count: number;
  topOverall: number;
  preview: FutGgPlayer[]; // up to 3
  players: FutGgPlayer[];
}

export const promoSlug = (name: string): string =>
  name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Bucket special players by their promo name (rarityName). Icons/Heroes get their own bucket. */
export const groupByPromo = (players: FutGgPlayer[]): PromoGroup[] => {
  const buckets = new Map<string, FutGgPlayer[]>();
  for (const p of players) {
    const key = p.isIcon ? "Icons" : p.isHero ? "Heroes" : (p.rarityName || "Special");
    const arr = buckets.get(key) ?? [];
    arr.push(p);
    buckets.set(key, arr);
  }
  const groups: PromoGroup[] = [];
  for (const [name, arr] of buckets.entries()) {
    const sorted = [...arr].sort((a, b) => b.overall - a.overall);
    groups.push({
      slug: promoSlug(name),
      name,
      count: arr.length,
      topOverall: sorted[0]?.overall ?? 0,
      preview: sorted.slice(0, 3),
      players: sorted,
    });
  }
  // Sort: biggest promos first, then by top rating
  return groups.sort((a, b) => b.count - a.count || b.topOverall - a.topOverall);
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
