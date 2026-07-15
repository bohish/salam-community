import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API = "https://api.msmc.cc/api/fc26";

export default defineTool({
  name: "search_players",
  title: "Search players",
  description:
    "Search EA Sports FC 26 players by name. Returns a list of matching players with rating, position, club, nation, and IDs.",
  inputSchema: {
    name: z.string().min(1).describe("Player name (or part of it) to search for."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ name }) => {
    try {
      const res = await fetch(`${API}/player/name/${encodeURIComponent(name)}`);
      if (res.status === 404) {
        return { content: [{ type: "text", text: `No player found matching "${name}".` }] };
      }
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      const raw = await res.json();
      const arr = Array.isArray(raw) ? raw : [raw];
      const players = arr.map((p: any) => ({
        id: Number(p.ID),
        name: p.Name,
        rating: Number(p.OVR),
        position: p.Position,
        club: p.Team,
        nation: p.Nation,
        league: p.League,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(players, null, 2) }],
        structuredContent: { players },
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Search failed: ${(e as Error).message}` }],
        isError: true,
      };
    }
  },
});
