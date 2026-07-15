import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPlayers from "./tools/search-players";
import getPlayer from "./tools/get-player";
import topPlayers from "./tools/top-players";
import listFavorites from "./tools/list-favorites";
import addFavorite from "./tools/add-favorite";
import removeFavorite from "./tools/remove-favorite";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "futhub-mcp",
  title: "FUTHUB — EA FC 26",
  version: "0.1.0",
  instructions:
    "Tools for the FUTHUB EA Sports FC 26 database. Use `search_players` to look up players by name, `get_player` for full stats, `top_players` for the highest-rated players, and `list_favorites` / `add_favorite` / `remove_favorite` to manage the signed-in user's saved players.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPlayers, getPlayer, topPlayers, listFavorites, addFavorite, removeFavorite],
});
