import { useQuery } from "@tanstack/react-query";
import { futggApi } from "@/services/futggApi";

const MIN = 60 * 1000;

export const useUpgradeHub = (page = 1) =>
  useQuery({
    queryKey: ["futgg", "upgrade-hub", page],
    queryFn: ({ signal }) => futggApi.upgradeHub(page, signal),
    staleTime: 10 * MIN,
  });

export const useLatestPlayers = (page = 1) =>
  useQuery({
    queryKey: ["futgg", "players", page],
    queryFn: ({ signal }) => futggApi.listPlayers(page, signal),
    staleTime: 10 * MIN,
  });

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
