import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Player } from "@/types/player";
import { toast } from "sonner";

export interface FavoritePlayer {
  id: string;
  user_id: string;
  player_id: number;
  player_name: string;
  player_rating: number;
  player_position: string | null;
  player_avatar_url: string | null;
  player_nation: string | null;
  player_club: string | null;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FavoritePlayer[];
    },
    enabled: !!user,
  });

  const favoriteIds = new Set(favorites.map((f) => f.player_id));

  const addMutation = useMutation({
    mutationFn: async (player: Player) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        player_id: player.id,
        player_name: player.name,
        player_rating: player.rating,
        player_position: player.position,
        player_avatar_url: player.cardUrl,
        player_nation: player.nation,
        player_club: player.club,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("تمت الإضافة إلى المفضلة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (playerId: number) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("player_id", playerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("تمت الإزالة من المفضلة");
    },
  });

  const toggle = (player: Player) => {
    if (!user) {
      toast.error("سجل دخول لحفظ اللاعبين المفضلين");
      return;
    }
    if (favoriteIds.has(player.id)) {
      removeMutation.mutate(player.id);
    } else {
      addMutation.mutate(player);
    }
  };

  return {
    favorites,
    favoriteIds,
    isLoading,
    isFavorite: (id: number) => favoriteIds.has(id),
    toggle,
  };
}
