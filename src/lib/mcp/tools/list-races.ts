import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchSeasonRaces } from "@/lib/f1-data";

export default defineTool({
  name: "list_races",
  title: "List races",
  description: "List all races in a given F1 season (Jolpica/Ergast).",
  inputSchema: {
    season: z.number().int().describe("Season year, e.g. 2025 or 2026."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ season }) => {
    const races = await fetchSeasonRaces(season);
    return {
      content: [{ type: "text", text: JSON.stringify(races, null, 2) }],
      structuredContent: { races },
    };
  },
});
