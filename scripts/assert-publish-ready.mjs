import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const serialized = JSON.stringify(pkg);
if (serialized.includes("REPLACE_ME")) {
  throw new Error("publication blocked: replace the GitHub owner placeholders in package.json first");
}
if (pkg.name !== "@justhandledlabs/agent-client") {
  throw new Error("publication blocked: package must publish under the @justhandledlabs scope");
}
if (pkg.mcpName !== "io.github.justhandledlabs/agent-gateway") {
  throw new Error("publication blocked: unexpected MCP registry name");
}
