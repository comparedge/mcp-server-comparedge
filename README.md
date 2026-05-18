# @comparedge/mcp-server

[![mcp-server-comparedge MCP server](https://glama.ai/mcp/servers/comparedge/mcp-server-comparedge/badges/score.svg)](https://glama.ai/mcp/servers/comparedge/mcp-server-comparedge)
[![npm version](https://img.shields.io/npm/v/@comparedge/mcp-server.svg)](https://www.npmjs.com/package/@comparedge/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

Relevant hubs: [Best AI Tools](https://comparedge.com/best/ai-tools) | [LLM Comparison](https://comparedge.com/best/llm) | [AI Coding Tools](https://comparedge.com/best/ai-coding) | [AI Writing Tools](https://comparedge.com/best/ai-writing)

### Business Software

CRM platforms, project management, HR tools, accounting software, legal tech, ERP systems, email marketing, customer support, analytics, design tools, video conferencing, and B2B SaaS across all major verticals.

Relevant hubs: [CRM Comparison](https://comparedge.com/best/crm) | [Project Management](https://comparedge.com/best/project-management) | [Email Marketing](https://comparedge.com/best/email-marketing) | [Analytics Tools](https://comparedge.com/best/analytics)

### Security and Infrastructure

Identity and access management (IAM), SIEM platforms, endpoint detection and response (EDR), vulnerability management, cloud security, compliance tools, VPN services, and password managers.

Relevant hubs: [Security Tools](https://comparedge.com/best/security) | [IAM Platforms](https://comparedge.com/best/iam) | [Cloud Security](https://comparedge.com/best/cloud-security) | [Password Managers](https://comparedge.com/best/password-managers)

### Developer Infrastructure

Cloud hosting, DevOps tooling, databases, vector databases, API management, monitoring, logging, feature flags, A/B testing, and email infrastructure.

Relevant hubs: [Cloud Hosting](https://comparedge.com/best/cloud-hosting) | [DevOps Tools](https://comparedge.com/best/devops) | [Database Comparison](https://comparedge.com/best/database) | [Vector Databases](https://comparedge.com/best/vector-db) | [Monitoring Tools](https://comparedge.com/best/monitoring)

### Finance and Commerce

Payment processing, e-commerce platforms, crypto exchanges, crypto trading bots, DeFi tools, decentralized exchanges, and NFT tools.

Relevant hubs: [Payment Processing](https://comparedge.com/best/payment-processing) | [E-Commerce Platforms](https://comparedge.com/best/e-commerce) | [Crypto Exchanges](https://comparedge.com/best/crypto-exchanges)

### Data and Analytics

Business intelligence, data visualization, data science tools, and BI platforms across enterprise and mid-market segments.

Relevant hubs: [BI Tools](https://comparedge.com/best/bi-tools) | [Data Visualization](https://comparedge.com/best/data-visualization)

## Supported Categories

`ai-tools` `llm` `ai-coding` `ai-writing` `ai-image` `ai-video` `ai-audio` `project-management` `crm` `email-marketing` `customer-support` `analytics` `design-tools` `video-conferencing` `cloud-hosting` `devops` `security` `cloud-security` `iam` `siem` `edr` `vulnerability-management` `compliance` `erp` `hr-tools` `accounting` `legal-tech` `data-visualization` `bi-tools` `database` `vector-db` `api-management` `payment-processing` `e-commerce` `email-infrastructure` `monitoring` `logging` `feature-flags` `a-b-testing` `crypto-exchanges` `crypto-trading-bots` `defi-tools` `dex` `nft-tools` `vpn` `password-managers`

Use `list_categories` to retrieve the full list with display names at runtime.

## Data Quality

ComparEdge applies a multi-layer verification process to every product record. Pricing is verified directly against vendor pricing pages on a weekly rotation cycle. Each product includes a `verifiedAt` field reflecting the date of last verification. User ratings are aggregated independently across multiple review sources and normalized to a consistent 0-5 scale. The dataset covers 506 active products and 2 discontinued products (flagged as such).

Data source: [ComparEdge Software Intelligence](https://comparedge.com) | [Pricing Guide](https://comparedge.com/pricing) | [Tool Directory](https://comparedge.com/tools) | [Alternatives](https://comparedge.com/alternatives) | [Comparisons](https://comparedge.com/compare)

## Browser Extension

For users who prefer a browser-based interface, the [ComparEdge Advisor Chrome Extension](https://comparedge.com/extension) surfaces ratings, pricing summaries, and alternatives directly in the browser without requiring an AI assistant.

Extension documentation: [comparedge.com/extension/docs](https://comparedge.com/extension/docs)

## Technical Details

- Protocol: MCP 2024-11-05, JSON-RPC 2.0 over stdio
- Runtime: Node.js 18+
- Dependencies: zero (Node.js built-ins only)
- Data transport: HTTPS fetch to comparedge.com (live, updated daily)
- In-process caching: tool and pricing data are cached for the duration of the server process

## Repository

[github.com/comparedge/mcp-server-comparedge](https://github.com/comparedge/mcp-server-comparedge)

## License

MIT
