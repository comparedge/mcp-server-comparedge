# @comparedge/mcp-server

[![mcp-server-comparedge MCP server](https://glama.ai/mcp/servers/comparedge/mcp-server-comparedge/badges/score.svg)](https://glama.ai/mcp/servers/comparedge/mcp-server-comparedge)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-v2.5.1-7c3aed)](https://registry.modelcontextprotocol.io)
[![mcpservers.org](https://img.shields.io/badge/mcpservers.org-listed-22c55e)](https://mcpservers.org/servers/comparedge/mcp-server-comparedge)
[![npm version](https://img.shields.io/npm/v/@comparedge/mcp-server.svg)](https://www.npmjs.com/package/@comparedge/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Known Vulnerabilities](https://snyk.io/test/github/comparedge/mcp-server-comparedge/badge.svg)](https://snyk.io/test/github/comparedge/mcp-server-comparedge)

Model Context Protocol server providing structured access to the [ComparEdge](https://comparedge.com) software intelligence database. Covers verified pricing plans, independently aggregated ratings, feature breakdowns, and category rankings for 508+ SaaS, AI, and security products. No API key required.

## Installation

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "comparedge": {
      "command": "npx",
      "args": ["@comparedge/mcp-server"]
    }
  }
}
```

Restart Claude Desktop after saving.

### Cursor IDE

Create or edit `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "comparedge": {
      "command": "npx",
      "args": ["@comparedge/mcp-server"]
    }
  }
}
```

### GitHub Copilot (VS Code)

**Option A — User settings** (`settings.json`):

```json
{
  "github.copilot.chat.mcp.servers": {
    "comparedge": {
      "command": "npx",
      "args": ["-y", "@comparedge/mcp-server"],
      "type": "stdio"
    }
  }
}
```

**Option B — Project-level** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "comparedge": {
      "command": "npx",
      "args": ["-y", "@comparedge/mcp-server"],
      "type": "stdio"
    }
  }
}
```

Once configured, ask Copilot Chat: `What are the best alternatives to Notion under $20/month?`

### Claude Code

```bash
claude mcp add comparedge npx @comparedge/mcp-server
```

### Windsurf, Cline, Continue

Use the `npx @comparedge/mcp-server` command with stdio transport in any MCP-compatible client.

## Tools

| Tool | Required Parameters | Description |
|---|---|---|
| `search_tools` | `query` (string) | Full-text search across 508+ products by name, keyword, or use case. Returns name, category, rating, free plan flag, starting price, and ComparEdge URL. |
| `get_tool` | `slug` (string) | Complete product profile: description, category, rating, all pricing plans with highlights, key features, and verified date. |
| `compare_tools` | `tool1`, `tool2` (strings) | Side-by-side comparison of two products: pricing, ratings, free plan availability, and direct comparison URL. |
| `list_category` | `category` (string) | All tools in a category. Optional: `sort_by` ("rating" or "startingPrice"), `free_only` (boolean). |
| `get_alternatives` | `slug` (string) | Top alternatives within the same category, sorted by rating. Optional: `limit` (default 5). |
| `get_pricing` | `slug` (string) | Complete verified pricing breakdown: all plans, per-plan highlights, token pricing where applicable, and verification date. |
| `get_leaderboard` | `category` (optional) | Top-rated tools by category or overall. Optional: `limit` (default 10). |
| `list_categories` | none | All 45 supported category slugs and display names. |

## Prompts

Pre-built prompt templates that guide AI assistants through structured analysis workflows.

| Prompt | Arguments | Description |
|---|---|---|
| `find_best_tool` | `use_case` (string), `budget` (optional) | Finds the best tool for a specific use case, with budget filtering. Runs a structured search, filters by price, and returns a ranked recommendation with rationale. |
| `compare_pricing` | `tool1`, `tool2` (strings) | Side-by-side pricing analysis of two tools. Breaks down all plans, highlights value differences, and recommends the better option for different user types. |
| `evaluate_tool` | `slug` (string) | Deep evaluation of a single tool: pricing tiers, rating quality, alternatives, and whether it is worth the cost. |
| `category_overview` | `category` (string) | Full market overview for a category: top tools, price range, free plan availability, and which tool leads on value. |

### Usage Examples

```
Find the best LLM API for a developer with a $50/month budget
Compare pricing between Notion and Confluence
Evaluate whether Datadog is worth the cost
Give me a market overview of the CRM category
```

## Usage Examples

```
Search for project management tools with a free plan
Find alternatives to Notion
Compare GitHub Copilot vs Cursor
Get full pricing breakdown for ChatGPT
Show the top 10 CRM tools by rating
List all LLM tools sorted by starting price
```

## Coverage

### Artificial Intelligence

Large language models, AI coding assistants, AI writing tools, AI image generation, AI video generation, AI audio tools, and AI productivity software. Includes pricing for token-based and subscription models across OpenAI, Anthropic, Google, Meta, Mistral, Cohere, and 80+ additional providers.

Relevant hubs: [Best AI Tools](https://comparedge.com/best/ai-tools) | [LLM Comparison](https://comparedge.com/best/llm) | [AI Coding Tools](https://comparedge.com/best/ai-coding) | [AI Writing Tools](https://comparedge.com/best/ai-writing) | [AI Assistants](https://comparedge.com/best/ai-assistants)

### Business Software

CRM platforms, project management, HR tools, accounting software, legal tech, ERP systems, email marketing, customer support, analytics, design tools, video conferencing, and B2B SaaS across all major verticals.

Relevant hubs: [CRM Comparison](https://comparedge.com/best/crm) | [Project Management](https://comparedge.com/best/project-management) | [Email Marketing](https://comparedge.com/best/email-marketing) | [Analytics Tools](https://comparedge.com/best/analytics)

### Security and Infrastructure

Identity and access management (IAM), SIEM platforms, endpoint detection and response (EDR), vulnerability management, cloud security, compliance tools, VPN services, and password managers.

Relevant hubs: [Endpoint Security](https://comparedge.com/best/endpoint-security) | [IAM Platforms](https://comparedge.com/best/iam) | [Cloud Security](https://comparedge.com/best/cloud-security) | [Password Managers](https://comparedge.com/best/password-managers) | [VPN](https://comparedge.com/best/vpn)

### Developer Infrastructure

Cloud hosting, DevOps tooling, databases, vector databases, API management, monitoring, logging, feature flags, A/B testing, and email infrastructure.

Relevant hubs: [Cloud Hosting](https://comparedge.com/best/cloud-hosting) | [Databases](https://comparedge.com/best/databases) | [Vector Databases](https://comparedge.com/best/vector-databases) | [Data Observability](https://comparedge.com/best/data-observability)

### Finance and Commerce

Payment processing, e-commerce platforms, crypto exchanges, crypto trading bots, DeFi tools, decentralized exchanges, and NFT tools.

Relevant hubs: [Payments](https://comparedge.com/best/payments) | [Crypto Exchanges](https://comparedge.com/best/crypto-exchanges) | [Crypto Trading Bots](https://comparedge.com/best/crypto-trading-bots) | [DeFi Tools](https://comparedge.com/best/defi-tools)

### Data and Analytics

Business intelligence, data visualization, data science tools, and BI platforms across enterprise and mid-market segments.

Relevant hubs: [Analytics](https://comparedge.com/best/analytics) | [Data Observability](https://comparedge.com/best/data-observability) | [Finops](https://comparedge.com/best/finops)

## Supported Categories

`accounting` `ai-agents` `ai-assistants` `ai-coding` `ai-image` `ai-meeting` `ai-productivity` `ai-security` `ai-video` `ai-voice` `ai-writing` `analytics` `cloud-hosting` `cloud-security` `compliance` `crm` `crypto-analytics` `crypto-exchanges` `crypto-portfolio-trackers` `crypto-tax` `crypto-trading-bots` `crypto-wallets` `customer-support` `data-observability` `databases` `defi-tools` `design-tools` `dex` `email-marketing` `endpoint-security` `erp` `finops` `hr-tools` `iam` `llm` `password-managers` `payments` `project-management` `seo-tools` `vector-databases` `video-conferencing` `vpn` `website-builders`

Use `list_categories` to retrieve the full list with display names at runtime.

## Data Quality

ComparEdge applies a multi-layer verification process to every product record. Pricing is verified directly against vendor pricing pages on a weekly rotation cycle. Each product includes a `verifiedAt` field reflecting the date of last verification. User ratings are aggregated independently across multiple review sources and normalized to a consistent 0-5 scale.

Data source: [ComparEdge Software Intelligence](https://comparedge.com) | [Pricing Guide](https://comparedge.com/pricing) | [Tool Directory](https://comparedge.com/tools) | [Alternatives](https://comparedge.com/alternatives) | [Comparisons](https://comparedge.com/compare) | [MCP Docs](https://comparedge.com/mcp)

## Browser Extension

For users who prefer a browser-based interface, the [ComparEdge Advisor Chrome Extension](https://comparedge.com/extension) surfaces ratings, pricing summaries, and alternatives directly in the browser without requiring an AI assistant.

Extension documentation: [comparedge.com/extension/docs](https://comparedge.com/extension/docs)

## Technical Details

- Protocol: MCP 2025-03-26, JSON-RPC 2.0 over stdio
- Runtime: Node.js 18+
- Dependencies: zero (Node.js built-ins only)
- Data transport: HTTPS fetch to comparedge.com (live, updated daily)
- In-process caching: tool and pricing data are cached for the duration of the server process
- Capabilities: `tools`, `prompts`

## Repository

[github.com/comparedge/mcp-server-comparedge](https://github.com/comparedge/mcp-server-comparedge)

## License

MIT
