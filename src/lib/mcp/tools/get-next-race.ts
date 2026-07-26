import { defineTool } from "@lovable.dev/mcp-js";
import { fetchNextRace } from "@/lib/f1-data";

export default defineTool({
  name: "get_next_race",
  title: "Get next race",
  description: "Get the next upcoming F1 race in the current season (Jolpica/Ergast).",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async () => {
    const race = await fetchNextRace();
    return {
      content: [{ type: "text", text: JSON.stringify(race, null, 2) }],
      structuredContent: { race },
    };
  },
});
