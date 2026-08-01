# JustHandled Agent Client

A guarded CLI, JavaScript client, and local MCP server for the [JustHandled Agent Utility Gateway](https://justhandledlabs.com/agent-gateway/). The package exposes twenty-eight deterministic preflights, maintained-data lookups, and evidence products. Twenty-two products cost $0.05 USDC; six evidence-heavy products cost $0.25, including Agent Distribution Readiness, Community Rule & Credibility Preflight, and Qualified Demand Ledger. Every paid call returns a versioned evidence receipt.

The client fails closed before signing. It accepts only the pinned JustHandled gateway, Base mainnet, canonical Base USDC, the exact per-product price, and the published merchant receiver. Customer inputs are not persisted by the gateway.

## Inspect without a wallet

```bash
npx --package @justhandledlabs/agent-client justhandled-agent catalog
npx --package @justhandledlabs/agent-client justhandled-agent preview filename-portability-preflight --json '{"paths":["CON.txt"]}'
npx --package @justhandledlabs/agent-client justhandled-agent preview agent-run-evidence-pack --file agent-run-evidence-pack.sample.json
npx --package @justhandledlabs/agent-client justhandled-agent preview agent-distribution-readiness-pack --file agent-distribution-readiness-pack.sample.json
npx --package @justhandledlabs/agent-client justhandled-agent preview community-rule-credibility-preflight --file community-rule-credibility-preflight.sample.json
npx --package @justhandledlabs/agent-client justhandled-agent preview qualified-demand-ledger --file qualified-demand-ledger.sample.json
```

Preview performs an unpaid request and validates the returned x402 terms. It does not sign or spend.

The catalog includes API-response contract drift, webhook contract and replay, and policy-change evidence products. Packaged example inputs are available in `examples/`.

Machine-readable products, exact payment terms, and free deterministic fixtures are available from the gateway's [product catalog](https://justhandled-agent-gateway.netlify.app/api/product-catalog), [OpenAPI document](https://justhandled-agent-gateway.netlify.app/openapi.json), and [sandbox index](https://justhandled-agent-gateway.netlify.app/sandbox/index.json).

## Execute one paid utility

Use a dedicated low-balance Base wallet. Never provide a primary wallet key.

```bash
export JH_EVM_PRIVATE_KEY=0x...
npx --package @justhandledlabs/agent-client justhandled-agent call filename-portability-preflight --json '{"paths":["CON.txt"]}'
```

PowerShell:

```powershell
$env:JH_EVM_PRIVATE_KEY = "0x..."
npx.cmd --package @justhandledlabs/agent-client justhandled-agent call filename-portability-preflight --json '{"paths":["CON.txt"]}'
```

## MCP configuration

```json
{
  "mcpServers": {
    "justhandled": {
      "command": "npx",
      "args": ["-y", "@justhandledlabs/agent-client"],
      "env": {
        "JH_EVM_PRIVATE_KEY": "0xDEDICATED_LOW_BALANCE_WALLET_KEY"
      }
    }
  }
}
```

The MCP server exposes a free catalog tool plus one paid tool per gateway utility. Missing wallet configuration produces an error instead of a payment attempt.

The package declares the official MCP Registry identity `io.github.justhandledlabs/agent-gateway`. Registry identity is discovery metadata only: installing or listing the server does not spend funds, and paid execution still requires a dedicated wallet plus the client's exact-term checks.

## Security model

- Price, chain, asset, receiver, and gateway origin are pinned in code.
- The six $0.25 products' 250,000-base-unit price is pinned separately from 50,000-base-unit checks.
- Every execution starts with an unpaid 402 preview.
- A mismatched term aborts before signing.
- The package never prints the private key.
- The gateway does not persist raw inputs or results.
- Treat all crypto transfers as irreversible and fund only a dedicated wallet.

## Development

```bash
npm install
npm run check
```

The gateway implementation is intentionally not included in this client repository.
