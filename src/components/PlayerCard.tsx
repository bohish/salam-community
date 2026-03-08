import { Player } from "@/data/players";
import { TrendingUp, TrendingDown } from "lucide-react";

const cardBgClass: Record<string, string> = {
  gold: "card-gold",
  totw: "card-totw",
  toty: "card-toty",
  icon: "card-icon",
};

const formatPrice = (price: number): string => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return price.toString();
};

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
}

const StatRow = ({ label, value }: { label: string; value: number }) => {
  const color = value >= 90 ? "text-accent" : value >= 75 ? "text-primary" : "text-foreground/70";
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="font-semibold opacity-80">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
};

const PlayerCard = ({ player, onClick }: PlayerCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:glow-gold animate-slide-up ${cardBgClass[player.cardType]}`}
    >
      <div className="p-4 flex flex-col items-center relative">
        {/* Rating & Position */}
        <div className="absolute top-3 left-3 flex flex-col items-center">
          <span className="text-2xl font-heading font-bold text-primary-foreground drop-shadow-lg">
            {player.rating}
          </span>
          <span className="text-[10px] font-bold text-primary-foreground/80 tracking-wider">
            {player.position}
          </span>
        </div>

        {/* Nation */}
        <div className="absolute top-3 right-3 text-2xl">
          {player.nation}
        </div>

        {/* Player silhouette area */}
        <div className="w-20 h-20 rounded-full bg-black/20 flex items-center justify-center mt-2 mb-2">
          <span className="text-4xl font-heading font-bold text-primary-foreground/40">
            {player.name.charAt(0)}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-heading font-bold text-sm text-primary-foreground tracking-wide text-center uppercase truncate w-full">
          {player.name}
        </h3>

        {/* Club */}
        <p className="text-[10px] text-primary-foreground/60 mb-2">{player.club}</p>

        {/* Stats */}
        <div className="w-full grid grid-cols-2 gap-x-3 gap-y-0.5 text-primary-foreground">
          <StatRow label="PAC" value={player.pace} />
          <StatRow label="SHO" value={player.shooting} />
          <StatRow label="PAS" value={player.passing} />
          <StatRow label="DRI" value={player.dribbling} />
          <StatRow label="DEF" value={player.defending} />
          <StatRow label="PHY" value={player.physical} />
        </div>

        {/* Price */}
        <div className="mt-3 pt-2 border-t border-primary-foreground/20 w-full flex items-center justify-between">
          <span className="font-heading font-bold text-sm text-primary-foreground">
            {formatPrice(player.price)}
          </span>
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${player.priceChange >= 0 ? "text-accent" : "text-destructive"}`}>
            {player.priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(player.priceChange)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
