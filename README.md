# ComparEdge MCP Server

Model Context Protocol server providing structured access to verified software intelligence for 508+ SaaS, AI, and security products.

## Overview

The ComparEdge MCP Server connects AI assistants to a curated database of software product data. It exposes pricing plans, aggregated G2 and Capterra ratings, feature comparisons, and category rankings across 45 software categories. No API key is required.

The server implements the Model Context Protocol (MCP) specification version 2024-11-05 using JSON-RPC 2.0 over stdio. It has zero npm dependencies and requires only Node.js 18 or later.

Data is sourced from three endpoints: a static tools JSON file, a static pricing JSON file, and a dynamic Railway-hosted API for detailed product and comparison queries.

## Installation: Claude Desktop

The Claude Desktop configuration file is located at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following entry to the `mcpServers` object:

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

Restart Claude Desktop after saving the file.

## Installation: Cursor IDE

Create or edit `.cursor/mcp.json` in your project root or home directory:

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

## Installation: Claude Code

Run the following command in your terminal:

```bash
claude mcp add comparedge npx @comparedge/mcp-server
```

## Tools Reference

| Tool | Parameters | Description |
|---|---|---|
| `search_tools` | `query` (required), `limit` (default: 5) | Search products by name or keyword |
| `get_tool` | `slug` (required) | Full details: description, rating, plans, features |
| `compare_tools` | `tool1` (required), `tool2` (required) | Side-by-side comparison of two products |
| `list_category` | `category` (required), `sort_by` (default: rating), `free_only` (default: false) | Browse all tools in a category |
| `get_alternatives` | `slug` (required), `limit` (default: 5) | Top alternatives in the same category |
| `get_pricing` | `slug` (required) | Complete verified pricing breakdown |
| `get_leaderboard` | `category` (default: all), `limit` (default: 10) | Top-rated tools by category |
| `list_categories` | none | List all 45 supported categories |

## Example Prompts

1. What are the top-rated LLM APIs available right now?
2. Compare OpenAI and Anthropic on pricing and features.
3. Which CRM tools offer a free plan?
4. What are the best alternatives to GitHub Copilot for AI coding?
5. Show me the full pricing breakdown for Notion.
6. What security tools are in the SIEM category?
7. List all AI image generation tools sorted by rating.
8. What is the starting price for Datadog?
9. Show me the top 5 password managers by rating.
10. What categories does ComparEdge cover for DeFi and crypto tools?

## Categories Reference

| # | Category | Slug |
|---|---|---|
| 1 | AI Tools | ai-tools |
| 2 | Large Language Models | llm |
| 3 | AI Coding | ai-coding |
| 4 | AI Writing | ai-writing |
| 5 | AI Image Generation | ai-image |
| 6 | AI Video | ai-video |
| 7 | AI Audio | ai-audio |
| 8 | Project Management | project-management |
| 9 | CRM | crm |
| 10 | Email Marketing | email-marketing |
| 11 | Customer Support | customer-support |
| 12 | Analytics | analytics |
| 13 | Design Tools | design-tools |
| 14 | Video Conferencing | video-conferencing |
| 15 | Cloud Hosting | cloud-hosting |
| 16 | DevOps | devops |
| 17 | Security | security |
| 18 | Cloud Security | cloud-security |
| 19 | Identity and Access Management | iam |
| 20 | SIEM | siem |
| 21 | Endpoint Detection and Response | edr |
| 22 | Vulnerability Management | vulnerability-management |
| 23 | Compliance | compliance |
| 24 | ERP | erp |
| 25 | HR Tools | hr-tools |
| 26 | Accounting | accounting |
| 27 | Legal Tech | legal-tech |
| 28 | Data Visualization | data-visualization |
| 29 | Business Intelligence | bi-tools |
| 30 | Database | database |
| 31 | Vector Database | vector-db |
| 32 | API Management | api-management |
| 33 | Payment Processing | payment-processing |
| 34 | E-Commerce | e-commerce |
| 35 | Email Infrastructure | email-infrastructure |
| 36 | Monitoring | monitoring |
| 37 | Logging | logging |
| 38 | Feature Flags | feature-flags |
| 39 | A/B Testing | a-b-testing |
| 40 | Crypto Exchanges | crypto-exchanges |
| 41 | Crypto Trading Bots | crypto-trading-bots |
| 42 | DeFi Tools | defi-tools |
| 43 | Decentralized Exchanges | dex |
| 44 | NFT Tools | nft-tools |
| 45 | VPN | vpn |
| 46 | Password Managers | password-managers |

## Data Sources

| Source | URL | Contents |
|---|---|---|
| Tools JSON | https://comparedge.com/llms-tools.json | 508+ tools: slug, name, category, rating, freePlan, startingPrice |
| Pricing JSON | https://comparedge.com/llms-pricing.json | 508+ tools: plans, highlights, tokenPricing, verifiedAt |
| Product API | https://comparedge-api.up.railway.app/api/v1/products/{slug} | Full product detail |
| Compare API | https://comparedge-api.up.railway.app/api/v1/compare/{slug1}/{slug2} | Structured comparison |
| Search API | https://comparedge-api.up.railway.app/api/v1/search?q={query}&limit={n} | Keyword search |

## Protocol

- Transport: stdio (standard input/output)
- Protocol: JSON-RPC 2.0
- MCP version: 2024-11-05
- Dependencies: zero (pure Node.js built-ins only)
- Node.js requirement: 18 or later

The server reads newline-delimited JSON requests from stdin and writes newline-delimited JSON responses to stdout, conforming to the MCP specification for stdio-based servers.

## License

MIT License. Copyright (c) ComparEdge. See LICENSE for details.
