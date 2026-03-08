import type { Player } from "@/types/player";

interface PlayerMiniCardProps {
  player: Player;
  onClick?: () => void;
}

const PlayerMiniCard = ({ player, onClick }: PlayerMiniCardProps) => {
  const ratingColor = player.rating >= 86 ? "bg-primary text-primary-foreground" 
    : player.rating >= 80 ? "bg-gold text-black" 
    : "bg-secondary text-foreground";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center w-[90px] shrink-0 group"
    >
      <div className="relative w-[80px] h-[100px] rounded-lg overflow-hidden bg-card border border-border group-hover:border-primary/50 transition-colors">
        {/* Rating badge */}
        <div className={`absolute top-1 left-1 text-[11px] font-extrabold px-1.5 py-0.5 rounded ${ratingColor} z-10`}>
          {player.rating}
        </div>
        
        {/* Position */}
        <div className="absolute top-1 right-1 text-[9px] font-bold text-muted-foreground z-10">
          {player.position}
        </div>

        {/* Player image */}
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt={player.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground/30">
            {player.name.charAt(0)}
          </div>
        )}

        {/* Nation + Club overlay */}
        <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
          {player.nationImage && (
            <img src={player.nationImage} alt="" className="w-3 h-2.5 object-contain" loading="lazy" />
          )}
          {player.clubImage && (
            <img src={player.clubImage} alt="" className="w-3 h-3 object-contain" loading="lazy" />
          )}
        </div>
      </div>
      
      <span className="text-[10px] font-semibold text-foreground mt-1 truncate w-full text-center">
        {player.name.split(" ").pop()}
      </span>
    </button>
  );
};

export default PlayerMiniCard;
