import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const links = ["/Users/yvez/Desktop/github.com/vscode_ext/f4data/src/dics"];

const server = new McpServer(
  {
    name: "f4data-mcp",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  }
);

server.registerTool(
  "All schemas",
  {
    title: "Get all available schemas",
    description: "Get all available schemas",
    inputSchema: {
      schema: z.string(),
    },
  },
  async ({ schema }) => {
    try {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve schema data",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve schema data",
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
