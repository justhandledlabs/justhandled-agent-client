import test from "node:test";
import assert from "node:assert/strict";
import { getCatalog, previewUtility, selectGuardedRequirement } from "../src/client.js";
import { BASE_MAINNET, BASE_USDC, GATEWAY_ORIGIN, JUSTHANDLED_RECEIVER, PRICE_BASE_UNITS } from "../src/config.js";

test("catalog client validates count, endpoint, and price", async () => {
  const fakeFetch = async () => new Response(JSON.stringify({
    schemaVersion: "1.0",
    count: 1,
    utilities: [{ id: "example", endpoint: `${GATEWAY_ORIGIN}/api/run/example`, price: "$0.05" }],
  }), { status: 200 });
  const catalog = await getCatalog(fakeFetch as typeof fetch);
  assert.equal(catalog.count, 1);
  const evilFetch = async () => new Response(JSON.stringify({
    schemaVersion: "1.0",
    count: 1,
    utilities: [{ id: "example", endpoint: "https://evil.example/run", price: "$0.05" }],
  }), { status: 200 });
  await assert.rejects(getCatalog(evilFetch as typeof fetch), /untrusted/);
});

test("client refuses malformed attribution labels before sending", async () => {
  const shouldNotRun = async () => { throw new Error("fetch should not run"); };
  await assert.rejects(previewUtility("example", {}, shouldNotRun as typeof fetch, "Bad Source"), /source must be/);
});

test("payment guard accepts only pinned commercial terms", () => {
  const resourceUrl = `${GATEWAY_ORIGIN}/api/run/example`;
  const requirement = selectGuardedRequirement({
    x402Version: 2,
    resource: { url: resourceUrl, description: "example", mimeType: "application/json" },
    accepts: [{ scheme: "exact", network: BASE_MAINNET, asset: BASE_USDC, amount: PRICE_BASE_UNITS, payTo: JUSTHANDLED_RECEIVER, maxTimeoutSeconds: 60, extra: {} }],
  }, resourceUrl);
  assert.equal(requirement.amount, "50000");
  assert.throws(() => selectGuardedRequirement({
    x402Version: 2,
    resource: { url: "https://evil.example/run", description: "example", mimeType: "application/json" },
    accepts: [{ ...requirement, amount: "500000" }],
  }), /refusing payment/);
  assert.throws(() => selectGuardedRequirement({
    x402Version: 2,
    resource: { url: "https://evil.example/run", description: "example", mimeType: "application/json" },
    accepts: [requirement],
  }, resourceUrl), /resource does not match/);
});
