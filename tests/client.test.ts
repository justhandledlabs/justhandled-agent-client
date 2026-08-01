import test from "node:test";
import assert from "node:assert/strict";
import { getCatalog, previewUtility, selectGuardedRequirement } from "../src/client.js";
import { AGENT_RUN_EVIDENCE_PACK_BASE_UNITS, BASE_MAINNET, BASE_USDC, GATEWAY_ORIGIN, JUSTHANDLED_RECEIVER, PRICE_BASE_UNITS } from "../src/config.js";

test("catalog client validates count, endpoint, and price", async () => {
  const fakeFetch = async () => new Response(JSON.stringify({
    schemaVersion: "1.0",
    count: 2,
    utilities: [
      { id: "example", endpoint: `${GATEWAY_ORIGIN}/api/run/example`, price: "$0.05" },
      { id: "agent-run-evidence-pack", endpoint: `${GATEWAY_ORIGIN}/api/run/agent-run-evidence-pack`, price: "$0.25" },
    ],
  }), { status: 200 });
  const catalog = await getCatalog(fakeFetch as typeof fetch);
  assert.equal(catalog.count, 2);
  const evilFetch = async () => new Response(JSON.stringify({
    schemaVersion: "1.0",
    count: 1,
    utilities: [{ id: "example", endpoint: "https://evil.example/run", price: "$0.05" }],
  }), { status: 200 });
  await assert.rejects(getCatalog(evilFetch as typeof fetch), /untrusted/);
});

test("payment guard accepts the separately pinned evidence-pack price", () => {
  const resourceUrl = `${GATEWAY_ORIGIN}/api/run/agent-run-evidence-pack`;
  const requirement = selectGuardedRequirement({
    x402Version: 2,
    resource: { url: resourceUrl, description: "pack", mimeType: "application/json" },
    accepts: [{ scheme: "exact", network: BASE_MAINNET, asset: BASE_USDC, amount: AGENT_RUN_EVIDENCE_PACK_BASE_UNITS, payTo: JUSTHANDLED_RECEIVER, maxTimeoutSeconds: 60, extra: {} }],
  }, resourceUrl);
  assert.equal(requirement.amount, "250000");
  assert.throws(() => selectGuardedRequirement({
    x402Version: 2,
    resource: { url: resourceUrl, description: "pack", mimeType: "application/json" },
    accepts: [{ ...requirement, amount: PRICE_BASE_UNITS }],
  }, resourceUrl), /\$0\.25/);
});

test("payment guard pins maintained-data and evidence-heavy products at $0.25", () => {
  for (const utility of ["chicago-demolition-permit-change-packet", "site-discovery-change-packet", "agent-distribution-readiness-pack", "community-rule-credibility-preflight", "qualified-demand-ledger", "channel-fit-evidence-matrix", "proof-to-channel-evidence-packet", "channel-experiment-postmortem"]) {
    const resourceUrl = `${GATEWAY_ORIGIN}/api/run/${utility}`;
    const requirement = selectGuardedRequirement({
      x402Version: 2,
      resource: { url: resourceUrl, description: utility, mimeType: "application/json" },
      accepts: [{ scheme: "exact", network: BASE_MAINNET, asset: BASE_USDC, amount: AGENT_RUN_EVIDENCE_PACK_BASE_UNITS, payTo: JUSTHANDLED_RECEIVER, maxTimeoutSeconds: 60, extra: {} }],
    }, resourceUrl);
    assert.equal(requirement.amount, "250000");
  }
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
