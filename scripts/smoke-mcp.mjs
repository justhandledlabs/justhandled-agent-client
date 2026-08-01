import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["dist/mcp.js"], { stdio: ["pipe", "pipe", "inherit"] });
let buffer = "";
let initialized = false;

const timeout = setTimeout(() => {
  child.kill();
  throw new Error("MCP smoke test timed out");
}, 20_000);

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) continue;
    const message = JSON.parse(line);
    if (message.id === 1 && !initialized) {
      initialized = true;
      send({ jsonrpc: "2.0", method: "notifications/initialized" });
      send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    } else if (message.id === 2) {
      const tools = message.result?.tools;
      if (!Array.isArray(tools) || tools.length !== 26) {
        clearTimeout(timeout);
        child.kill();
        throw new Error(`expected 26 MCP tools, received ${Array.isArray(tools) ? tools.length : "invalid response"}`);
      }
      console.log(`MCP smoke test passed: ${tools.length} tools discovered; no wallet key supplied and no payment attempted.`);
      clearTimeout(timeout);
      child.kill();
    }
  }
});

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "justhandled-smoke-test", version: "0.1.0" },
  },
});
