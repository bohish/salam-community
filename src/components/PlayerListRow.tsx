import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { Player } from "@/types/player";
import { playerSlug } from "@/lib/slug";

const PlayerListRow = ({ player }: { player: Player }) => (
  <Link
    to={`/player/${playerSlug(player.name, player.id)}`}
    className="group glass hover:glass-strong flex items-center gap-3 p-3 rounded-2xl transition-fluid hover-lift"
  >
    <div className="w-12 h-16 flex-shrink-0 flex items-center justify-center">
      {player.cardUrl ? (
        <img src={player.cardUrl} alt={player.name} loading="lazy"
          className="w-full h-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-fluid" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gradient-primary/20 flex items-center justify-center text-sm font-black text-primary">
          {player.name.charAt(0)}
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-bold text-sm truncate">{player.name}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{player.club} · {player.nation}</p>
    </div>
    <div className="flex flex-col items-end gap-1">
      <span className={`rating-chip ${player.rating >= 87 ? "rating-chip-elite" : ""}`}>{player.rating}</span>
      <span className="text-[10px] text-muted-foreground font-bold tracking-wider">{player.position}</span>
    </div>
    <ChevronLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:-translate-x-1 transition-fluid" />
  </Link>
);

export default PlayerListRow;
