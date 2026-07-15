import type { Player } from "@/types/player";
import PlayerCardGlass from "./PlayerCardGlass";

interface PlayerMiniCardProps {
  player: Player;
  onClick?: () => void;
}

// Backwards-compat wrapper: renders the new premium glass card.
const PlayerMiniCard = ({ player }: PlayerMiniCardProps) => {
  return <PlayerCardGlass player={player} compact />;
};

export default PlayerMiniCard;
