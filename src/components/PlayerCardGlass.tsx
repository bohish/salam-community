import type { Player } from "@/types/player";
import { Heart, GitCompare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";

interface PlayerCardGlassProps {
  player: Player;
  compact?: boolean;
}

const cardTint = (rating: number): { grad: string; ring: string } => {
  if (rating >= 90) return {
    grad: "from-cyan-400/20 via-primary/15 to-transparent",
    ring: "ring-primary/50",
  };
  if (rating >= 85) return {
    grad: "from-primary/20 via-primary/10 to-transparent",
    ring: "ring-primary/40",
  };
  if (rating >= 80) return {
    grad: "from-yellow-500/25 via-amber-500/10 to-transparent",
    ring: "ring-yellow-500/40",
  };
  return {
    grad: "from-muted-foreground/15 via-transparent to-transparent",
    ring: "ring-border",
  };
};

const PlayerCardGlass = ({ player, compact }: PlayerCardGlassProps) => {
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorites();
  const { has: inCompare, add: addCompare, remove: removeCompare } = useCompare();
  const tint = cardTint(player.rating);
  const fav = isFavorite(player.id);
  const cmp = inCompare(player.id);

  const size = compact ? "w-[110px]" : "w-[132px]";
  const imgSize = compact ? "w-16 h-16" : "w-20 h-20";

  return (
    <div
      onClick={() => navigate(`/player/${player.id}`)}
      className={`group relative shrink-0 ${size} cursor-pointer animate-in`}
    >
      {/* Backdrop glow */}
      <div className={`absolute -inset-1 bg-gradient-to-br ${tint.grad} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-fluid`} />

      {/* Card */}
      <div className={`relative glass-strong rounded-2xl p-2.5 ring-1 ${tint.ring} transition-fluid group-hover:-translate-y-1`}>
        {/* Rating */}
        <div className="flex items-start justify-between mb-2">
          <span className={player.rating >= 86 ? "rating-chip rating-chip-elite" : "rating-chip"}>
            {player.rating}
          </span>
          <span className="text-[9px] font-black text-muted-foreground bg-secondary/70 px-1.5 py-0.5 rounded">
            {player.position}
          </span>
        </div>

        {/* Avatar */}
        <div className={`mx-auto ${imgSize} rounded-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center overflow-hidden mb-2`}>
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-2xl font-black text-muted-foreground/30">{player.name.charAt(0)}</span>
          )}
        </div>

        {/* Name */}
        <p className="text-xs font-bold text-foreground text-center truncate mb-1">
          {player.name.split(" ").pop()}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-center gap-1 mb-2">
          {player.nationImage && <img src={player.nationImage} alt="" className="w-3.5 h-2.5 object-contain" loading="lazy" />}
          {player.clubImage && <img src={player.clubImage} alt="" className="w-3.5 h-3.5 object-contain" loading="lazy" />}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-fluid">
          <button
            onClick={(e) => { e.stopPropagation(); toggle(player); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-fluid ${
              fav ? "bg-destructive/20 text-destructive" : "bg-secondary/70 text-muted-foreground hover:text-destructive"
            }`}
          >
            <Heart size={12} fill={fav ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); cmp ? removeCompare(player.id) : addCompare(player); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-fluid ${
              cmp ? "bg-primary/20 text-primary" : "bg-secondary/70 text-muted-foreground hover:text-primary"
            }`}
          >
            <GitCompare size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerCardGlass;
