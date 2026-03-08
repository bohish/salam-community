import { useQuery } from "@tanstack/react-query";
import { fetchPlayers } from "@/lib/api";

export function usePlayers(params: {
  limit?: number;
  offset?: number;
  gender?: string;
}) {
  return useQuery({
    queryKey: ["players", params],
    queryFn: () => fetchPlayers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
