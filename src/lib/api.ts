import { supabase } from "@/integrations/supabase/client";
import type { Player, PlayersResponse } from "@/types/player";

export async function fetchPlayers(params: {
  limit?: number;
  offset?: number;
  gender?: string;
}): Promise<PlayersResponse> {
  const { limit = 50, offset = 0, gender = "0" } = params;

  const { data, error } = await supabase.functions.invoke("fetch-players", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: undefined,
  });

  // supabase.functions.invoke doesn't support query params well for GET,
  // so we'll use fetch directly
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/fetch-players?limit=${limit}&offset=${offset}&gender=${gender}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.statusText}`);
  }

  return response.json();
}
