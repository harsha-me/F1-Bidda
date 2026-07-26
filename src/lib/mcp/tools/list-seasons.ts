import { defineTool } from "@lovable.dev/mcp-js";
import { SEASONS } from "@/lib/f1-data";

export default defineTool({
  name: "list_seasons",
  title: "List seasons",
  description: "List F1 seasons available in f1Bidda.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(SEASONS) }],
    structuredContent: { seasons: SEASONS },
  }),
});
