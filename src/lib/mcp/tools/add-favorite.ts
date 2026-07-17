import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API = "https://api.msmc.cc/api/fc26";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "add_favorite",
  title: "Add favorite player",
  description: "Add an FC 26 player to the signed-in user's FUTMAC favorites.",
  inputSchema: {
    player_id: z.number().int().positive().describe("Player ID to add."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ player_id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const res = await fetch(`${API}/player/id/${player_id}`);
    if (!res.ok)
      return { content: [{ type: "text", text: `Player ${player_id} not found` }], isError: true };
    const p = await res.json();
    const { data, error } = await supabaseForUser(ctx)
      .from("favorites")
      .insert({
        user_id: ctx.getUserId(),
        player_id,
        player_name: p.Name,
        player_rating: Number(p.OVR),
        player_position: p.Position,
        player_club: p.Team,
        player_nation: p.Nation,
        player_avatar_url: p.card ?? null,
      })
      .select()
      .single();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Added ${p.Name} to favorites.` }],
      structuredContent: { favorite: data },
    };
  },
});
