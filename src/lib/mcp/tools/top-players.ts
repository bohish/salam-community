import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API = "https://api.msmc.cc/api/fc26";

export default defineTool({
  name: "top_players",
  title: "Top players",
  description:
    "Get the top N EA Sports FC 26 players by global rank (rank 1 = highest rated).",
  inputSchema: {
    count: z.number().int().min(1).max(50).describe("How many top players to return (max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ count }) => {
    const ranks = Array.from({ length: count }, (_, i) => i + 1);
    const results = await Promise.all(
      ranks.map((r) =>
        fetch(`${API}/player/rank/${r}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ),
    );
    const players = results
      .filter(Boolean)
      .map((p: any) => ({
        id: Number(p.ID),
        rank: Number(p.Rank),
        name: p.Name,
        rating: Number(p.OVR),
        position: p.Position,
        club: p.Team,
        nation: p.Nation,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify(players, null, 2) }],
      structuredContent: { players },
    };
  },
});
