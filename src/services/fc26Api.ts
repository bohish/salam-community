import { normalizePlayer, type Player, type RawPlayer } from "@/types/player";

const BASE = "https://api.msmc.cc/api/fc26";

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
  /** Top N players by rank (batched with limited concurrency). */
  async getTopRanked(count: number, signal?: AbortSignal): Promise<Player[]> {
    const ranks = Array.from({ length: count }, (_, i) => i + 1);
    return pool(ranks, 12, (r) => req<RawPlayer>(`/player/rank/${r}`, signal).then(toPlayer));
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
