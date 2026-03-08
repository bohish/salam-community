import { Player } from "@/data/players";
import { X, TrendingUp, TrendingDown } from "lucide-react";

interface PlayerDetailProps {
  player: Player;
  onClose: () => void;
}

const formatPrice = (price: number): string => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return price.toString();
};

const StatBar = ({ label, value }: { label: string; value: number }) => {
  const width = `${value}%`;
  const barColor =
    value >= 90 ? "bg-accent" : value >= 75 ? "bg-primary" : value >= 60 ? "bg-yellow-500" : "bg-destructive";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-muted-foreground w-8">{label}</span>
      <span className="text-sm font-bold text-foreground w-6 text-right">{value}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width }} />
      </div>
    </div>
  );
};

const PlayerDetail = ({ player, onClose }: PlayerDetailProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-md mx-4 p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{player.nation}</span>
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">{player.name}</h2>
              <p className="text-xs text-muted-foreground">{player.club} • {player.league}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-heading font-bold text-primary">{player.rating}</span>
            <span className="text-sm font-semibold text-muted-foreground">{player.position}</span>
          </div>
          <div className="text-right">
            <p className="font-heading font-bold text-lg text-foreground">{formatPrice(player.price)}</p>
            <span className={`flex items-center gap-1 text-xs font-semibold justify-end ${player.priceChange >= 0 ? "text-accent" : "text-destructive"}`}>
              {player.priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(player.priceChange)}%
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <StatBar label="PAC" value={player.pace} />
          <StatBar label="SHO" value={player.shooting} />
          <StatBar label="PAS" value={player.passing} />
          <StatBar label="DRI" value={player.dribbling} />
          <StatBar label="DEF" value={player.defending} />
          <StatBar label="PHY" value={player.physical} />
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
