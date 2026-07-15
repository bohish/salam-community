import { normalizePlayer, type Player, type RawPlayer } from "@/types/player";

const BASE = "https://api.msmc.cc/api/fc26";

class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

async function req<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, res.status);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new ApiError("Unexpected response format");
  }
  return res.json() as Promise<T>;
}

const toPlayer = (raw: RawPlayer): Player => normalizePlayer(raw);
const toPlayers = (arr: RawPlayer[]): Player[] =>
  (Array.isArray(arr) ? arr : []).map(toPlayer).sort((a, b) => b.rating - a.rating);

export const fc26Api = {
  async getById(id: number | string, signal?: AbortSignal): Promise<Player> {
    const raw = await req<RawPlayer>(`/player/id/${encodeURIComponent(String(id))}`, signal);
    return toPlayer(raw);
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
  async getTopRanked(count: number, signal?: AbortSignal): Promise<Player[]> {
    const ranks = Array.from({ length: count }, (_, i) => i + 1);
    const results = await Promise.all(
      ranks.map(r => req<RawPlayer>(`/player/rank/${r}`, signal).then(toPlayer).catch(() => null))
    );
    return results.filter((p): p is Player => p !== null);
  },
  async getRandom(gender?: "M" | "F", signal?: AbortSignal): Promise<Player> {
    const raw = await req<RawPlayer>(gender ? `/random/${gender}` : "/random", signal);
    return toPlayer(raw);
  },
  async getRandomBatch(count: number, gender?: "M" | "F", signal?: AbortSignal): Promise<Player[]> {
    const results = await Promise.all(
      Array.from({ length: count }, () =>
        req<RawPlayer>(gender ? `/random/${gender}` : "/random", signal).then(toPlayer).catch(() => null)
      )
    );
    // Dedupe by id
    const seen = new Set<number>();
    return results.filter((p): p is Player => {
      if (!p || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  },
  async getByTeam(team: string, signal?: AbortSignal): Promise<Player[]> {
    const arr = await req<RawPlayer[]>(`/team/${encodeURIComponent(team)}`, signal);
    return toPlayers(arr);
  },
  async getByNation(nation: string, signal?: AbortSignal): Promise<Player[]> {
    const arr = await req<RawPlayer[]>(`/nation/${encodeURIComponent(nation)}`, signal);
    return toPlayers(arr);
  },
};

export { ApiError };
