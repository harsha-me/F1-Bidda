import { defineTool } from "@lovable.dev/mcp-js";
import { fetchSessionDrivers } from "@/lib/f1-data";

export default defineTool({
  name: "list_drivers",
  title: "List drivers",
  description: "List drivers in the latest OpenF1 session with team, car number, and team color.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async () => {
    const drivers = await fetchSessionDrivers("latest");
    return {
      content: [{ type: "text", text: JSON.stringify(drivers, null, 2) }],
      structuredContent: { drivers },
    };
  },
});
