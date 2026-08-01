import { decodePaymentRequiredHeader, decodePaymentResponseHeader } from "@x402/core/http";
import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";
import {
  BASE_MAINNET,
  BASE_USDC,
  GATEWAY_ORIGIN,
  JUSTHANDLED_RECEIVER,
  expectedBaseUnitsForUtility,
  expectedPriceForUtility,
  type UtilityCatalog,
} from "./config.js";

const UTILITY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface PaidUtilityResult {
  result: Record<string, unknown>;
  payment: ReturnType<typeof decodePaymentResponseHeader>;
}

function endpointFor(utility: string): string {
  if (!UTILITY_ID.test(utility)) throw new Error("utility id must be lowercase kebab-case");
  return `${GATEWAY_ORIGIN}/api/run/${utility}`;
}

function utilityFromEndpoint(resourceUrl: string): string {
  const url = new URL(resourceUrl);
  if (url.origin !== GATEWAY_ORIGIN || url.search || url.hash || url.username || url.password) {
    throw new Error("refusing payment: payment resource is not a canonical JustHandled endpoint");
  }
  const match = /^\/api\/run\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(url.pathname);
  if (!match) throw new Error("refusing payment: payment resource is not a canonical JustHandled endpoint");
  return match[1]!;
}

function requestFor(input: unknown, source: string): RequestInit {
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(source)) throw new Error("source must be a bounded lowercase attribution slug");
  return {
    method: "POST",
    headers: { "content-type": "application/json", "x-jh-source": source },
    body: JSON.stringify(input),
  };
}

export async function getCatalog(fetchImpl: typeof fetch = fetch): Promise<UtilityCatalog> {
  const response = await fetchImpl(`${GATEWAY_ORIGIN}/api/catalog`);
  if (!response.ok) throw new Error(`catalog request failed with HTTP ${response.status}`);
  const catalog = await response.json() as UtilityCatalog;
  if (!Array.isArray(catalog.utilities) || catalog.count !== catalog.utilities.length) throw new Error("gateway returned a malformed catalog");
  for (const utility of catalog.utilities) {
    const expectedEndpoint = `${GATEWAY_ORIGIN}/api/run/${utility.id}`;
    if (!UTILITY_ID.test(utility.id) || utility.endpoint !== expectedEndpoint || utility.price !== expectedPriceForUtility(utility.id)) {
      throw new Error("gateway catalog contains an untrusted utility endpoint or price");
    }
  }
  return catalog;
}

export function selectGuardedRequirement(required: PaymentRequired, expectedResourceUrl?: string): PaymentRequirements {
  if (expectedResourceUrl && required.resource?.url !== expectedResourceUrl) {
    throw new Error("refusing payment: payment resource does not match the requested JustHandled endpoint");
  }
  const resourceUrl = expectedResourceUrl ?? required.resource?.url;
  if (!resourceUrl) throw new Error("refusing payment: payment resource is missing");
  const utility = utilityFromEndpoint(resourceUrl);
  const expectedAmount = expectedBaseUnitsForUtility(utility);
  const expectedDisplay = expectedPriceForUtility(utility);
  const requirement = required.accepts.find((candidate) =>
    candidate.scheme === "exact" &&
    candidate.network === BASE_MAINNET &&
    candidate.asset.toLowerCase() === BASE_USDC.toLowerCase() &&
    candidate.amount === expectedAmount &&
    candidate.payTo.toLowerCase() === JUSTHANDLED_RECEIVER.toLowerCase()
  );
  if (!requirement) {
    throw new Error(`refusing payment: gateway requirements do not match the pinned Base network, USDC asset, ${expectedDisplay} amount, and JustHandled receiver`);
  }
  return requirement;
}

export async function previewUtility(utility: string, input: unknown, fetchImpl: typeof fetch = fetch, source = "npm-client"): Promise<PaymentRequirements> {
  const endpoint = endpointFor(utility);
  const response = await fetchImpl(endpoint, requestFor(input, source));
  if (response.status !== 402) throw new Error(`expected an unpaid 402 preview, received HTTP ${response.status}`);
  const header = response.headers.get("payment-required");
  if (!header) throw new Error("gateway omitted the Payment-Required header");
  return selectGuardedRequirement(decodePaymentRequiredHeader(header), endpoint);
}

export async function runPaidUtility(
  utility: string,
  input: unknown,
  privateKey: `0x${string}`,
  fetchImpl: typeof fetch = fetch,
  source = "npm-client",
): Promise<PaidUtilityResult> {
  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) throw new Error("JH_EVM_PRIVATE_KEY must be a 32-byte hex private key");
  await previewUtility(utility, input, fetchImpl, source);
  const account = privateKeyToAccount(privateKey);
  const paidFetch = wrapFetchWithPaymentFromConfig(fetchImpl, {
    schemes: [{ network: BASE_MAINNET, client: new ExactEvmScheme(account) }],
  });
  const response = await paidFetch(endpointFor(utility), requestFor(input, source));
  const paymentHeader = response.headers.get("payment-response") ?? response.headers.get("x-payment-response");
  if (response.status !== 200 || !paymentHeader) {
    const detail = await response.text();
    throw new Error(`paid request failed with HTTP ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }
  return {
    result: await response.json() as Record<string, unknown>,
    payment: decodePaymentResponseHeader(paymentHeader),
  };
}
