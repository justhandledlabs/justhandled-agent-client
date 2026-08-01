# JustHandled Agent Client

A guarded CLI, JavaScript client, and local MCP server for the [JustHandled Agent Utility Gateway](https://justhandled-agent-gateway.netlify.app). The package exposes ten deterministic preflights. Each paid call costs exactly $0.05 USDC on Base mainnet and returns a versioned evidence receipt.

The client fails closed before signing. It accepts only the pinned JustHandled gateway, Base mainnet, the canonical Base USDC contract, a 50,000-base-unit price, and the published merchant receiver. Customer inputs are not persisted by the gateway.

## Inspect without a wallet

```bash
npx --package justhandled-agent-client justhandled-agent catalog
npx --package justhandled-agent-client justhandled-agent preview filename-portability-preflight --json '{"paths":["CON.txt"]}'
```

Preview performs an unpaid request and validates the returned x402 terms. It does not sign or spend.

## Execute one paid utility

Use a dedicated low-balance Base wallet. Never provide a primary wallet key.

```bash
export JH_EVM_PRIVATE_KEY=0x...
npx --package justhandled-agent-client justhandled-agent call filename-portability-preflight --json '{"paths":["CON.txt"]}'
```

PowerShell:

```powershell
$env:JH_EVM_PRIVATE_KEY = "0x..."
npx.cmd --package justhandled-agent-client justhandled-agent call filename-portability-preflight --json '{"paths":["CON.txt"]}'
```

## MCP configuration

```json
{
  "mcpServers": {
    "justhandled": {
      "command": "npx",
      "args": ["-y", "justhandled-agent-client"],
      "env": {
        "JH_EVM_PRIVATE_KEY": "0xDEDICATED_LOW_BALANCE_WALLET_KEY"
      }
    }
  }
}
```

The MCP server exposes a free catalog tool plus one paid tool per gateway utility. Missing wallet configuration produces an error instead of a payment attempt.

## Security model

- Price, chain, asset, receiver, and gateway origin are pinned in code.
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
