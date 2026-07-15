import { Link } from "react-router-dom";
import { Heart, GitCompare } from "lucide-react";
import type { Player } from "@/types/player";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { playerSlug } from "@/lib/slug";

interface Props {
  player: Player;
  size?: "sm" | "md";
  showFavorite?: boolean;
}

const PlayerCard = ({ player, size = "md", showFavorite = true }: Props) => {
  const { isFavorite, toggle } = useFavorites();
  const compare = useCompare();
  const fav = isFavorite(player.id);
  const inCmp = compare.has(player.id);

  return (
    <Link
      to={`/player/${playerSlug(player.name, player.id)}`}
      className="group card-premium relative flex flex-col items-center rounded-2xl p-3 overflow-hidden animate-in"
    >
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {showFavorite && (
          <button type="button" onClick={(e) => { e.preventDefault(); toggle(player); }}
            className="p-1.5 rounded-full glass-subtle hover:scale-110 transition-fluid"
            aria-label={fav ? "إزالة من المفضلة" : "أضف للمفضلة"}>
            <Heart className={`w-3.5 h-3.5 ${fav ? "fill-destructive text-destructive" : "text-foreground/70"}`} />
          </button>
        )}
        <button type="button" onClick={(e) => { e.preventDefault(); compare.toggle(player.id); }}
          className={`p-1.5 rounded-full glass-subtle hover:scale-110 transition-fluid ${inCmp ? "text-primary" : ""}`}
          aria-label={inCmp ? "إزالة من المقارنة" : "أضف للمقارنة"}>
          <GitCompare className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className={`relative ${size === "sm" ? "w-24 h-32" : "w-32 h-44"} flex items-center justify-center`}>
        {player.cardUrl ? (
          <img src={player.cardUrl} alt={player.name} loading="lazy"
            className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-fluid" />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-lg bg-muted text-4xl font-black text-muted-foreground">
            {player.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="mt-2 w-full flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{player.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{player.club}</p>
        </div>
        <span className={`rating-chip ${player.rating >= 87 ? "rating-chip-elite" : ""}`}>
          {player.rating} {player.position}
        </span>
      </div>
    </Link>
  );
};

export default PlayerCard;
