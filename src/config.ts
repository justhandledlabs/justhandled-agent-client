export const GATEWAY_ORIGIN = "https://justhandled-agent-gateway.netlify.app";
export const BASE_MAINNET = "eip155:8453";
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const JUSTHANDLED_RECEIVER = "0xd7edc83c55c994850a14604a628639c3599665bc";
export const PRICE_BASE_UNITS = "50000";
export const PRICE_USDC = "$0.05";
export const AGENT_RUN_EVIDENCE_PACK = "agent-run-evidence-pack";
export const AGENT_RUN_EVIDENCE_PACK_BASE_UNITS = "250000";
export const AGENT_RUN_EVIDENCE_PACK_PRICE_USDC = "$0.25";

export function expectedPriceForUtility(utility: string): string {
  return utility === AGENT_RUN_EVIDENCE_PACK ? AGENT_RUN_EVIDENCE_PACK_PRICE_USDC : PRICE_USDC;
}

export function expectedBaseUnitsForUtility(utility: string): string {
  return utility === AGENT_RUN_EVIDENCE_PACK ? AGENT_RUN_EVIDENCE_PACK_BASE_UNITS : PRICE_BASE_UNITS;
}

export interface UtilityCatalogItem {
  id: string;
  title: string;
  version: string;
  category: string;
  summary: string;
  price: string;
  docsUrl: string;
  limitations: string[];
  inputSchema: Record<string, unknown>;
  sampleInput: Record<string, unknown>;
  endpoint: string;
  priceBaseUnits?: string;
}

export interface UtilityCatalog {
  schemaVersion: string;
  count: number;
  utilities: UtilityCatalogItem[];
}
