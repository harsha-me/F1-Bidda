import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchRaceLaps, fetchStints } from "@/lib/f1-data";

export default defineTool({
  name: "get_race_laps",
  title: "Get race laps",
  description:
    "Get lap-by-lap timing data (Jolpica) for the given drivers in a race, plus tyre stints (OpenF1 when available).",
  inputSchema: {
    raceId: z.string().describe("Race ID, e.g. '2025-7'."),
    drivers: z.array(z.string()).min(1).describe("Driver codes (e.g. ['VER','LEC'])."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ raceId, drivers }) => {
    const [laps, stints] = await Promise.all([
      fetchRaceLaps(raceId, drivers),
      fetchStints(raceId).catch(() => []),
    ]);
    return {
      content: [{ type: "text", text: `${laps.length} laps across ${drivers.length} drivers.` }],
      structuredContent: { laps, stints },
    };
  },
});
