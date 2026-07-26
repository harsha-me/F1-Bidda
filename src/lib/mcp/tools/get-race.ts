import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchRace } from "@/lib/f1-data";

export default defineTool({
  name: "get_race",
  title: "Get race",
  description: "Get details for a single race by ID '<season>-<round>' (Jolpica).",
  inputSchema: {
    raceId: z.string().describe("Race ID, e.g. '2025-7'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ raceId }) => {
    const race = await fetchRace(raceId);
    if (!race) {
      return { content: [{ type: "text", text: `Race not found: ${raceId}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(race, null, 2) }],
      structuredContent: { race },
    };
  },
});
