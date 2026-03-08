import { useQuery } from "@tanstack/react-query";

interface PromoPlayer {
  name: string;
  rating: number;
  position: string;
  club: string;
  nation: string;
  isNew?: boolean;
}

interface Promo {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr?: string;
  startDate: string;
  endDate: string;
  color: string;
  players?: PromoPlayer[];
  playerCount?: number;
  topPlayer?: { name: string; rating: number };
}

interface TOTWData {
  week: number;
  players: { name: string; rating: number; position: string; club: string }[];
}

export interface PromosData {
  currentPromo?: Promo;
  recentPromos?: Promo[];
  upcomingPromos?: { name: string; nameAr: string; expectedDate: string; description: string }[];
  totw?: TOTWData;
  error?: string;
}

async function fetchPromos(): Promise<PromosData> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/fetch-promos`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch promos: ${response.statusText}`);
  }

  return response.json();
}

export function usePromos() {
  return useQuery({
    queryKey: ["promos"],
    queryFn: fetchPromos,
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
  });
}
