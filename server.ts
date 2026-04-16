import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Visualization App",
    version: "1.0.0",
  });

  const resourceUri = "ui://show-visualization/mcp-app.html";

  registerAppTool(server,
    "show-visualization",
    {
      title: "Show Visualization",
      description: "Displays a data visualization by its ID.",
      inputSchema: {
        visualizationId: z.string().describe("The ID of the visualization to display"),
      },
      _meta: { ui: { resourceUri } },
    },
    async ({ visualizationId }): Promise<CallToolResult> => {
      // For now, return the visualization ID as-is.
      // This is where you'll add the real data fetching later.
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ visualizationId }),
          },
        ],
      };
    },
  );

  registerAppResource(server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  return server;
}
