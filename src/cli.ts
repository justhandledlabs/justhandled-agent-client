#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { getCatalog, previewUtility, runPaidUtility } from "./client.js";

function value(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function readInput(): Promise<unknown> {
  const json = value("--json");
  const file = value("--file");
  if ((json ? 1 : 0) + (file ? 1 : 0) !== 1) throw new Error("provide exactly one of --json or --file");
  return JSON.parse(json ?? await readFile(file!, "utf8"));
}

const [command, utility] = process.argv.slice(2);
if (command === "catalog") {
  console.log(JSON.stringify(await getCatalog(), null, 2));
} else if (command === "preview" && utility) {
  console.log(JSON.stringify(await previewUtility(utility, await readInput()), null, 2));
} else if (command === "call" && utility) {
  const key = process.env.JH_EVM_PRIVATE_KEY as `0x${string}` | undefined;
  if (!key) throw new Error("JH_EVM_PRIVATE_KEY is required for a paid call");
  console.log(JSON.stringify(await runPaidUtility(utility, await readInput(), key), null, 2));
} else {
  console.error("usage:\n  justhandled-agent catalog\n  justhandled-agent preview <utility> (--json <json> | --file <path>)\n  justhandled-agent call <utility> (--json <json> | --file <path>)");
  process.exitCode = 2;
}
