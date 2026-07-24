import { normalizePlayer, type Player, type RawPlayer } from "@/types/player";
import { futggApi, displayName, type FutGgPlayer } from "@/services/futggApi";

const BASE = "https://api.msmc.cc/api/fc26";

/** Map a FUT.GG player object into the app's Player shape. */
export const futggToPlayer = (p: FutGgPlayer): Player => {
  const id = p.basePlayerEaId ?? p.eaId;
  const name = displayName(p) || p.cardName || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  const fs = p.faceStatsV2;
  return {
    id,
    rank: 0,
    name,
    gender: "M",
    rating: p.overall,
    position: p.position ?? "",
    altPositions: p.alternativePositions ?? [],
    pace: fs?.facePace ?? 0,
    shooting: fs?.faceShooting ?? 0,
    passing: fs?.facePassing ?? 0,
    dribbling: fs?.faceDribbling ?? 0,
    defending: fs?.faceDefending ?? 0,
    physical: fs?.facePhysicality ?? 0,
    weakFoot: p.weakFoot ?? 0,
    skillMoves: p.skillMoves ?? 0,
    preferredFoot: p.foot ?? "",
    height: p.height ? `${p.height}cm` : "",
    weight: "",
    age: 0,
    nation: p.nation?.name ?? "",
    league: p.league?.name ?? "",
    club: p.club?.name ?? "",
    playStyles: [],
    cardUrl: p.cardImageUrl || p.imageUrl || p.simpleCardImageUrl || "",
    eaUrl: p.url ?? "",
    isGK: (p.position ?? "") === "GK",
    raw: { ID: String(id), Name: name, OVR: String(p.overall), Position: p.position } as unknown as RawPlayer,
  };
};

class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

async function req<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new ApiError("Unexpected response format");
  return res.json() as Promise<T>;
}

const toPlayer = (raw: RawPlayer): Player => normalizePlayer(raw);
const toPlayers = (arr: RawPlayer[]): Player[] =>
  (Array.isArray(arr) ? arr : []).map(toPlayer).sort((a, b) => b.rating - a.rating);

/** Run tasks with limited concurrency to avoid hammering the upstream API. */
async function pool<T>(items: number[], limit: number, worker: (n: number) => Promise<T | null>): Promise<T[]> {
  const results: (T | null)[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try { results[i] = await worker(items[i]); }
      catch { results[i] = null; }
    }
  });
  await Promise.all(runners);
  return results.filter((x): x is T => x != null);
}

/** Try FUT.GG first (stable, richer data), fall back to msmc if nothing matches. */
async function fetchPlayerFromFutgg(id: number | string, signal?: AbortSignal): Promise<Player | null> {
  const idStr = String(id).trim();
  if (!idStr) return null;
  const matches = (p: FutGgPlayer) =>
    [p.id, p.eaId, p.basePlayerEaId].some((candidate) => String(candidate ?? "") === idStr);

  // FUT.GG silently ignores unsupported ID filters and returns the first page.
  // Search the actual lists and validate IDs so a failed lookup can never become Bellingham.
  try {
    const [ranked, specials] = await Promise.all([
      futggApi.fetchTopRated(500, signal),
      futggApi.fetchAllSpecial(8, signal),
    ]);
    const exact = [...ranked, ...specials].filter(matches);
    if (exact.length) {
      const requestedVersion = exact.find((p) => String(p.eaId) === idStr || String(p.id) === idStr);
      return futggToPlayer(requestedVersion ?? exact.sort((a, b) => b.overall - a.overall)[0]);
    }
  } catch { /* fall through to the legacy source */ }
  return null;
}

/** Fetch full detailed player data from MSMC (has every sub-stat). */
async function fetchFromMsmc(id: string, signal?: AbortSignal): Promise<Player | null> {
  try {
    const raw = await req<RawPlayer>(`/player/id/${encodeURIComponent(id)}`, signal);
    if (!raw || !raw.ID) return null;
    return toPlayer(raw);
  } catch {
    return null;
  }
}

/** Merge a FUT.GG player (card art, special face stats) into an MSMC-based player.
 *  MSMC is authoritative for detailed sub-stats. For special/upgraded cards
 *  (fg.rating > msmc.rating) we surface FUT.GG's six face stats + overall so
 *  the header and radar reflect the special card, while sub-stats stay factual. */
function mergeFutgg(base: Player, fg: Player): Player {
  const upgraded = fg.rating > base.rating;
  const pick = (a: number, b: number) => (upgraded && a > 0 ? a : b || a);
  return {
    ...base,
    rating: Math.max(base.rating, fg.rating),
    pace: pick(fg.pace, base.pace),
    shooting: pick(fg.shooting, base.shooting),
    passing: pick(fg.passing, base.passing),
    dribbling: pick(fg.dribbling, base.dribbling),
    defending: pick(fg.defending, base.defending),
    physical: pick(fg.physical, base.physical),
    // Prefer FUT.GG art/URLs when present (higher-quality special-card images).
    cardUrl: fg.cardUrl || base.cardUrl,
    eaUrl: base.eaUrl || fg.eaUrl,
    // Preserve MSMC positions/nation/club (canonical), but fall back if MSMC missing.
    club: base.club || fg.club,
    league: base.league || fg.league,
    nation: base.nation || fg.nation,
    altPositions: base.altPositions.length ? base.altPositions : fg.altPositions,
    weakFoot: base.weakFoot || fg.weakFoot,
    skillMoves: base.skillMoves || fg.skillMoves,
    preferredFoot: base.preferredFoot || fg.preferredFoot,
    height: base.height || fg.height,
  };
}

export const fc26Api = {
  async getById(id: number | string, signal?: AbortSignal): Promise<Player> {
    const idStr = String(id).trim();
    if (!idStr) throw new ApiError("Missing player id");
    // Run MSMC (detailed sub-stats) and FUT.GG (card art / special versions) in parallel.
    // MSMC is authoritative for gameplay stats; FUT.GG fills in special-card visuals.
    const [msmc, fg] = await Promise.all([
      fetchFromMsmc(idStr, signal),
      fetchPlayerFromFutgg(idStr, signal),
    ]);
    if (msmc && fg) return mergeFutgg(msmc, fg);
    if (msmc) return msmc;
    if (fg) return fg;
    throw new ApiError(`Player ${idStr} not found`);
  },

  async getByRank(rank: number, signal?: AbortSignal): Promise<Player> {
    const raw = await req<RawPlayer>(`/player/rank/${rank}`, signal);
    return toPlayer(raw);
  },
  async getByName(name: string, signal?: AbortSignal): Promise<Player | null> {
    try {
      const raw = await req<RawPlayer>(`/player/name/${encodeURIComponent(name)}`, signal);
      return raw && raw.ID ? toPlayer(raw) : null;
    } catch (e) {
      if ((e as ApiError).status === 404) return null;
      throw e;
    }
  },
  /** Top N players — sourced from FUT.GG (msmc's rank API is heavily rate-limited). */
  async getTopRanked(count: number, signal?: AbortSignal): Promise<Player[]> {
    const list = await futggApi.fetchTopRated(count, signal);
    return list.map(futggToPlayer).sort((a, b) => b.rating - a.rating);
  },
  async getRandom(gender?: "M" | "F", signal?: AbortSignal): Promise<Player> {
    const raw = await req<RawPlayer>(gender ? `/random/${gender}` : "/random", signal);
    return toPlayer(raw);
  },
  async getRandomBatch(count: number, gender?: "M" | "F", signal?: AbortSignal): Promise<Player[]> {
    const results = await pool(
      Array.from({ length: count }, () => 0),
      6,
      () => req<RawPlayer>(gender ? `/random/${gender}` : "/random", signal).then(toPlayer)
    );
    const seen = new Set<number>();
    return results.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  },
  async getByTeam(team: string, signal?: AbortSignal): Promise<Player[]> {
    return toPlayers(await req<RawPlayer[]>(`/team/${encodeURIComponent(team)}`, signal));
  },
  async getByNation(nation: string, signal?: AbortSignal): Promise<Player[]> {
    return toPlayers(await req<RawPlayer[]>(`/nation/${encodeURIComponent(nation)}`, signal));
  },
};

export { ApiError };
