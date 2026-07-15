import { useQuery } from "@tanstack/react-query";
import { fc26Api } from "@/services/fc26Api";

const HOUR = 60 * 60 * 1000;

export const usePlayerById = (id?: number | string | null) =>
  useQuery({
    queryKey: ["fc26", "player", "id", id],
    queryFn: ({ signal }) => fc26Api.getById(id!, signal),
    enabled: id != null && id !== "",
    staleTime: HOUR,
  });

export const usePlayerByName = (name: string) =>
  useQuery({
    queryKey: ["fc26", "player", "name", name.trim().toLowerCase()],
    queryFn: ({ signal }) => fc26Api.getByName(name.trim(), signal),
    enabled: name.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

export const useTopRanked = (count = 24) =>
  useQuery({
    queryKey: ["fc26", "top", count],
    queryFn: ({ signal }) => fc26Api.getTopRanked(count, signal),
    staleTime: HOUR,
  });

export const useRandomBatch = (count = 12, key = "featured") =>
  useQuery({
    queryKey: ["fc26", "random", key, count],
    queryFn: ({ signal }) => fc26Api.getRandomBatch(count, undefined, signal),
    staleTime: 15 * 60 * 1000,
  });

export const useTeamPlayers = (team?: string) =>
  useQuery({
    queryKey: ["fc26", "team", team],
    queryFn: ({ signal }) => fc26Api.getByTeam(team!, signal),
    enabled: !!team,
    staleTime: HOUR,
  });

export const useNationPlayers = (nation?: string) =>
  useQuery({
    queryKey: ["fc26", "nation", nation],
    queryFn: ({ signal }) => fc26Api.getByNation(nation!, signal),
    enabled: !!nation,
    staleTime: HOUR,
  });
