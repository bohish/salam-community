import { Link } from "react-router-dom";
import type { Player } from "@/types/player";

const PlayerListRow = ({ player }: { player: Player }) => (
  <Link
    to={`/player/${player.id}`}
    className="glass hover:glass-strong flex items-center gap-3 p-2.5 rounded-xl transition-fluid"
  >
    <div className="w-12 h-16 flex-shrink-0 flex items-center justify-center">
      {player.cardUrl ? (
        <img src={player.cardUrl} alt={player.name} loading="lazy" className="w-full h-full object-contain" />
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-sm font-bold">
          {player.name.charAt(0)}
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-bold text-sm truncate">{player.name}</p>
      <p className="text-xs text-muted-foreground truncate">{player.club} · {player.nation}</p>
    </div>
    <div className="flex flex-col items-end gap-0.5">
      <span className={`rating-chip ${player.rating >= 87 ? "rating-chip-elite" : ""}`}>{player.rating}</span>
      <span className="text-[10px] text-muted-foreground font-semibold">{player.position}</span>
    </div>
  </Link>
);

export default PlayerListRow;
