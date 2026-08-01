export const GATEWAY_ORIGIN = "https://justhandled-agent-gateway.netlify.app";
export const BASE_MAINNET = "eip155:8453";
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const JUSTHANDLED_RECEIVER = "0xd7edc83c55c994850a14604a628639c3599665bc";
export const PRICE_BASE_UNITS = "50000";
export const PRICE_USDC = "$0.05";

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
}

export interface UtilityCatalog {
  schemaVersion: string;
  count: number;
  utilities: UtilityCatalogItem[];
}
