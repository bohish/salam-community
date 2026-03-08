import type { Player } from "@/types/player";
import { X } from "lucide-react";

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

interface PlayerDetailProps {
  player: Player;
  onClose: () => void;
}

const PlayerDetail = ({ player, onClose }: PlayerDetailProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-md mx-4 p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {player.nationImage ? (
              <img src={player.nationImage} alt={player.nation} className="w-8 h-6 object-contain" />
            ) : (
              <span className="text-3xl">{player.nation}</span>
            )}
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">{player.name}</h2>
              <p className="text-xs text-muted-foreground">{player.club} • {player.league}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Player image */}
        {player.avatarUrl && (
          <div className="flex justify-center mb-4">
            <img src={player.avatarUrl} alt={player.name} className="w-32 h-32 object-cover rounded-full bg-secondary" />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-heading font-bold text-primary">{player.rating}</span>
            <span className="text-sm font-semibold text-muted-foreground">{player.position}</span>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <p>⭐ {player.skillMoves} Skill Moves</p>
            <p>🦶 {player.weakFoot} Weak Foot</p>
            <p>📏 {player.height}cm • {player.weight}kg</p>
          </div>
        </div>

        {/* Alternate positions */}
        {player.alternatePositions.length > 0 && (
          <div className="flex gap-1 mb-4">
            <span className="text-xs text-muted-foreground">Alt:</span>
            {player.alternatePositions.map((pos) => (
              <span key={pos} className="text-xs bg-secondary px-2 py-0.5 rounded text-foreground">{pos}</span>
            ))}
          </div>
        )}

        <div className="space-y-2.5 mb-4">
          <StatBar label="PAC" value={player.pace} />
          <StatBar label="SHO" value={player.shooting} />
          <StatBar label="PAS" value={player.passing} />
          <StatBar label="DRI" value={player.dribbling} />
          <StatBar label="DEF" value={player.defending} />
          <StatBar label="PHY" value={player.physical} />
        </div>

        {/* Play Styles */}
        {player.playStyles.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Play Styles</p>
            <div className="flex flex-wrap gap-1">
              {player.playStyles.map((ps) => (
                <span key={ps.name} className="text-[10px] bg-secondary text-foreground px-2 py-1 rounded flex items-center gap-1">
                  {ps.icon && <img src={ps.icon} alt="" className="w-3 h-3" />}
                  {ps.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {player.playStylesPlus.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-primary mb-2">Play Styles+</p>
            <div className="flex flex-wrap gap-1">
              {player.playStylesPlus.map((ps) => (
                <span key={ps.name} className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded flex items-center gap-1">
                  {ps.icon && <img src={ps.icon} alt="" className="w-3 h-3" />}
                  {ps.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetail;
