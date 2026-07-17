import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "remove_favorite",
  title: "Remove favorite player",
  description: "Remove a player from the signed-in user's FUTMAC favorites.",
  inputSchema: {
    player_id: z.number().int().positive().describe("Player ID to remove."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  handler: async ({ player_id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { error } = await supabaseForUser(ctx)
      .from("favorites")
      .delete()
      .eq("user_id", ctx.getUserId())
      .eq("player_id", player_id);
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Removed player ${player_id} from favorites.` }] };
  },
});
