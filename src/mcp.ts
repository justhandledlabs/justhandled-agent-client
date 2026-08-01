#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getCatalog, runPaidUtility } from "./client.js";

const server = new Server(
  { name: "justhandled-agent-gateway", version: "0.2.1" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const catalog = await getCatalog();
  return {
    tools: [
      {
        name: "justhandled_list_utilities",
        description: "List JustHandled deterministic preflights, prices, and limitations.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
      ...catalog.utilities.map((utility) => ({
        name: `justhandled_${utility.id.replace(/-/g, "_")}`,
        description: `${utility.summary} Costs ${utility.price} USDC on Base mainnet.`,
        inputSchema: utility.inputSchema,
      })),
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "justhandled_list_utilities") {
    return { content: [{ type: "text", text: JSON.stringify(await getCatalog()) }] };
  }
  const catalog = await getCatalog();
  const utility = catalog.utilities.find((candidate) => `justhandled_${candidate.id.replace(/-/g, "_")}` === request.params.name);
  if (!utility) return { content: [{ type: "text", text: "Unknown JustHandled utility" }], isError: true };
  const key = process.env.JH_EVM_PRIVATE_KEY as `0x${string}` | undefined;
  if (!key) {
    return {
      content: [{ type: "text", text: `Paid execution requires JH_EVM_PRIVATE_KEY. This tool will spend exactly ${utility.price} USDC only after validating the pinned Base network, USDC contract, price, and receiver.` }],
      isError: true,
    };
  }
  try {
    const output = await runPaidUtility(utility.id, request.params.arguments ?? {}, key, fetch, "npm-mcp");
    return { content: [{ type: "text", text: JSON.stringify(output) }] };
  } catch (error) {
    return { content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
