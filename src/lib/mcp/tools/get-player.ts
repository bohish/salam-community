import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API = "https://api.msmc.cc/api/fc26";

export default defineTool({
  name: "get_player",
  title: "Get player details",
  description:
    "Get full EA Sports FC 26 player details by ID: overall rating, six main stats (PAC/SHO/PAS/DRI/DEF/PHY), position, foot, skill moves, weak foot, playstyles, club, nation, league.",
  inputSchema: {
    id: z.number().int().positive().describe("Player ID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ id }) => {
    try {
      const res = await fetch(`${API}/player/id/${id}`);
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      const p = await res.json();
      const player = {
        id: Number(p.ID),
        name: p.Name,
        rating: Number(p.OVR),
        position: p.Position,
        altPositions: p["Alternative positions"] ?? [],
        pace: Number(p.PAC),
        shooting: Number(p.SHO),
        passing: Number(p.PAS),
        dribbling: Number(p.DRI),
        defending: Number(p.DEF),
        physical: Number(p.PHY),
        weakFoot: Number(p["Weak foot"]),
        skillMoves: Number(p["Skill moves"]),
        preferredFoot: p["Preferred foot"],
        height: p.Height,
        weight: p.Weight,
        age: Number(p.Age),
        nation: p.Nation,
        league: p.League,
        club: p.Team,
        playStyles: p["play style"] ?? [],
        cardUrl: p.card,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(player, null, 2) }],
        structuredContent: { player },
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Fetch failed: ${(e as Error).message}` }],
        isError: true,
      };
    }
  },
});
