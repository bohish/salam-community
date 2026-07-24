import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { futggApi, groupByPromo, type PromoGroup, type FutGgPlayer } from "@/services/futggApi";


const MIN = 60 * 1000;

// Events/promo cards change frequently (weekly EA drops, mid-week TOTW).
// Keep cache short and refetch when the user returns to the tab.
const EVENT_OPTS = {
  staleTime: 5 * MIN,
  refetchOnWindowFocus: true as const,
  refetchOnReconnect: true as const,
};

export const useUpgradeHub = (page = 1) =>
  useQuery({
    queryKey: ["futgg", "upgrade-hub", page],
    queryFn: ({ signal }) => futggApi.upgradeHub(page, signal),
    ...EVENT_OPTS,
  });

export const useLatestPlayers = (page = 1) =>
  useQuery({
    queryKey: ["futgg", "players", page],
    queryFn: ({ signal }) => futggApi.listPlayers(page, signal),
    ...EVENT_OPTS,
  });

/** Aggregate the first N pages of latest player items, sorted by createdAt desc. */
export const useNewPlayers = (maxPages = 4) => {
  const q = useQuery({
    queryKey: ["futgg", "new-players", maxPages],
    queryFn: async ({ signal }) => {
      const pages = await Promise.all(
        Array.from({ length: maxPages }, (_, i) =>
          futggApi.listPlayers(i + 1, signal).catch(() => null)
        )
      );
      const seen = new Set<number>();
      const out: FutGgPlayer[] = [];
      for (const p of pages) {
        if (!p?.data) continue;
        for (const pl of p.data) {
          if (seen.has(pl.id)) continue;
          seen.add(pl.id);
          out.push(pl);
        }
      }
      return out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    },
    ...EVENT_OPTS,
  });
  return q;
};

export const useSpecialPlayers = (page = 1) =>
  useQuery({
    queryKey: ["futgg", "special", page],
    queryFn: ({ signal }) => futggApi.listSpecialPlayers(page, signal),
    ...EVENT_OPTS,
  });

/** Fetch first N pages of special players and group them by promo. */
export const useAllPromos = (maxPages = 8) => {
  const q = useQuery({
    queryKey: ["futgg", "all-special", maxPages],
    queryFn: ({ signal }) => futggApi.fetchAllSpecial(maxPages, signal),
    ...EVENT_OPTS,
  });
  const promos = useMemo<PromoGroup[]>(
    () => (q.data ? groupByPromo(q.data) : []),
    [q.data]
  );
  return { ...q, promos };
};

export const usePlayersByPromo = (slug: string | undefined, maxPages = 8) => {
  const { promos, ...rest } = useAllPromos(maxPages);
  const group = useMemo(() => promos.find((p) => p.slug === slug), [promos, slug]);
  return { group, ...rest };
};

export const useEvolutions = (page = 1) =>
  useQuery({
    queryKey: ["futgg", "evolutions", page],
    queryFn: ({ signal }) => futggApi.evolutions(page, signal),
    staleTime: 30 * MIN,
  });

export const useSbcs = (page = 1) =>
  useQuery({
    queryKey: ["futgg", "sbcs", page],
    queryFn: ({ signal }) => futggApi.sbcs(page, signal),
    staleTime: 30 * MIN,
  });
