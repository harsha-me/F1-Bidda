import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchDriverStandings } from "@/lib/f1-data";

export default defineTool({
  name: "get_driver_standings",
  title: "Get driver standings",
  description: "Get the driver championship standings for a season (Jolpica/Ergast).",
  inputSchema: { season: z.number().int().describe("Season year, e.g. 2025.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ season }) => {
    const standings = await fetchDriverStandings(season);
    return {
      content: [{ type: "text", text: JSON.stringify(standings, null, 2) }],
      structuredContent: { standings },
    };
  },
});
