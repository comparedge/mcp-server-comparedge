# Changelog

## 2.7.1 (2026-07-10)

- README rewritten from scratch. The first link now points to the ComparEdge MCP hub instead of the protocol spec, every anchor is short plain text instead of naked URLs and ten-word title strings, the dead Compare Hub link is gone, and the resources table that held it was replaced by prose sections. No functional changes to the server itself.

## 2.7.0 (2026-07-10)

- Data fetches now send a proper `User-Agent: comparedge-mcp/<version>` header. Previously they went out as bare `node`, which generic bot filtering at the CDN edge blocked for several days in July 2026; identified requests also make server-side debugging possible.
- Catalog cache gets a 6-hour TTL with serve-stale-on-error. Long-lived MCP processes (Claude Desktop keeps servers alive for days) were serving prices frozen at process start.
- The `initialize` handshake now records `clientInfo` (client name and version) and includes it in telemetry, so the ComparEdge admin can attribute calls to Claude Desktop, Cursor, Cline and other clients.
- README: `compare_pricing` was documented as a tool with wrong parameters; it is a prompt. All four MCP prompts are now documented in their own section.
- Version strings unified across `package.json`, `server.json` (was stale at 2.5.8), `glama.json`, `serverInfo` and the telemetry UA.

## 2.6.0 (2026-07-04)

- 494 products, serverInfo version fix, improved README anchors.
