# Publication checklist

The public repository is `https://github.com/justhandledlabs/justhandled-agent-client`. The package metadata now points to that exact source.

1. Confirm the public GitHub repository remains `justhandledlabs/justhandled-agent-client`. Completed 2026-07-31.
2. Confirm `package.json` and `server.json` point to that exact repository. Completed 2026-07-31.
3. Confirm the free npm organization `justhandledlabs` owns the empty `@justhandledlabs` scope. Completed 2026-07-31.
4. Push the reviewed source and confirm GitHub Actions CI passes.
5. Confirm npm user `fairysquadmother` remains an owner of the `justhandledlabs` organization. Completed 2026-07-31.
6. Configure npm trusted publishing for the exact public repository and `.github/workflows/publish.yml`.
7. Publish a GitHub release for `v0.1.0`; confirm npm provenance appears.
8. Run `npm run smoke:mcp`, then verify the package from a clean temporary directory before announcing it.
9. Authenticate `com.justhandledlabs/agent-gateway` through the approved domain-based MCP Registry flow.
10. Validate and publish `server.json`, then query the Registry API for the exact name and version.

Public repository creation, npm ownership, trusted-publisher setup, package publication, and MCP Registry authentication are owner/account boundaries.
