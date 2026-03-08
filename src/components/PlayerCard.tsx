import type { Player } from "@/types/player";
import { TrendingUp, TrendingDown } from "lucide-react";

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
  const cardClass = player.rating >= 86 ? "card-toty" : player.rating >= 80 ? "card-gold" : "card-totw";

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:glow-gold animate-slide-up ${cardClass}`}
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

        {/* Nation flag */}
        <div className="absolute top-3 right-3">
          {player.nationImage ? (
            <img src={player.nationImage} alt={player.nation} className="w-6 h-4 object-contain" />
          ) : (
            <span className="text-sm">{player.nation}</span>
          )}
        </div>

        {/* Player avatar */}
        <div className="w-20 h-20 rounded-full bg-black/20 flex items-center justify-center mt-2 mb-2 overflow-hidden">
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-heading font-bold text-primary-foreground/40">
              {player.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-heading font-bold text-sm text-primary-foreground tracking-wide text-center uppercase truncate w-full">
          {player.name}
        </h3>

        {/* Club */}
        <div className="flex items-center gap-1 mb-2">
          {player.clubImage && (
            <img src={player.clubImage} alt={player.club} className="w-4 h-4 object-contain" />
          )}
          <p className="text-[10px] text-primary-foreground/60">{player.club}</p>
        </div>

        {/* Stats */}
        <div className="w-full grid grid-cols-2 gap-x-3 gap-y-0.5 text-primary-foreground">
          <StatRow label="PAC" value={player.pace} />
          <StatRow label="SHO" value={player.shooting} />
          <StatRow label="PAS" value={player.passing} />
          <StatRow label="DRI" value={player.dribbling} />
          <StatRow label="DEF" value={player.defending} />
          <StatRow label="PHY" value={player.physical} />
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
