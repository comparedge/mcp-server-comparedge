# ComparEdge MCP Server

[![npm version](https://img.shields.io/npm/v/@comparedge/mcp-server.svg)](https://www.npmjs.com/package/@comparedge/mcp-server)
[![GitHub Marketplace](https://img.shields.io/badge/GitHub_Marketplace-ComparEdge-2088FF?logo=github)](https://github.com/marketplace/comparedge)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-v2.5.7-7c3aed)](https://registry.modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A zero-dependency [Model Context Protocol](https://comparedge.com/mcp) server providing verified pricing, alternatives, and feature comparisons for 495+ SaaS and AI tools. Compatible with Claude Desktop, Cursor, VS Code, and any MCP-compatible client. No API key required.

## Installation

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "comparedge": {
      "command": "npx",
      "args": ["-y", "@comparedge/mcp-server@latest"]
    }
  }
}
```

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Cursor** — Settings → MCP → Add Server  
**VS Code + GitHub Copilot** — `.vscode/mcp.json`

Full setup guides: [ComparEdge MCP Server docs](https://comparedge.com/mcp/docs)

## Tools

### `search_tools`
Search 495+ software products by name, keyword, category, or natural language query.

```
query    string  required  Search query (product name, keyword, or use case)
limit    number  optional  Max results to return (default: 5, max: 20)
```

**Example prompts:**
- *"Find the best CRM for startups"*
- *"What project management tools have a free plan?"*
- *"Show me AI writing tools"*

---

### `get_tool`
Retrieve the full profile for a specific tool by its slug identifier.

```
slug    string  required  URL-safe product identifier (e.g., "notion", "github-copilot")
```

**Example prompts:**
- *"Tell me about Linear"*
- *"Give me an overview of HubSpot"*
- *"What does Figma do?"*

---

### `get_pricing`
Complete verified pricing breakdown — all plans, prices, features per tier, trial status, and free plan availability. Includes per-token pricing for LLM/AI tools.

```
slug    string  required  Product slug. Use search_tools first if unsure of the exact slug.
```

**Example prompts:**
- *"How much does Notion cost per user?"*
- *"Does Slack have a free plan?"*
- *"What is the cheapest project management tool under $10/month?"*
- *"Show me OpenAI API pricing per million tokens"*

---

### `compare_tools`
Side-by-side structured comparison of two software products — pricing, features, ratings, and key differences.

```
tool1    string  required  Slug of the first product
tool2    string  required  Slug of the second product
```

**Example prompts:**
- *"Compare Notion vs Coda"*
- *"Notion vs Obsidian — which is better for a team?"*
- *"Compare Salesforce and HubSpot pricing"*

---

### `compare_pricing`
Focused pricing analysis of two tools side by side — plan-by-plan cost breakdown with value assessment.

```
tool1    string  required  Slug of the first product
tool2    string  required  Slug of the second product
```

**Example prompts:**
- *"Which is cheaper, Linear or Jira?"*
- *"Compare GitHub Copilot vs Cursor pricing"*

---

### `get_alternatives`
Top verified alternatives to a given tool within the same category, sorted by aggregated rating. Each result includes a direct ComparEdge comparison link.

```
slug     string  required  Slug of the reference product
limit    number  optional  Number of alternatives to return (default: 5, max: 10)
```

**Example prompts:**
- *"What are the best alternatives to Salesforce under $50/user/mo?"*
- *"I want to switch from Slack — what else is there?"*
- *"Find open-source alternatives to Notion"*

---

### `list_category`
Browse all tools in a specific category with pricing overview. Supports sorting and free-only filtering.

```
category    string   required  Category slug (e.g., "crm", "llm", "ai-coding")
sort_by     string   optional  "rating" (default) or "startingPrice"
free_only   boolean  optional  Return only tools with a free plan (default: false)
```

**Example prompts:**
- *"Show me all password managers"*
- *"List CRM tools sorted by price"*
- *"What are the top-rated LLMs with a free tier?"*

---

### `get_leaderboard`
Top-rated software tools by category, ranked by aggregated G2 and Capterra scores.

```
category    string  optional  Category slug, or "all" for overall leaderboard (default: "all")
limit       number  optional  Number of tools to return (default: 10, max: 50)
```

**Example prompts:**
- *"Show me the top-rated password managers"*
- *"What are the highest-rated AI coding tools?"*
- *"Overall top 20 SaaS tools by rating"*

---

### `list_categories`
List all 44 supported software categories with their slugs and display names.

**Example prompts:**
- *"What categories does ComparEdge cover?"*
- *"Show me all available software categories"*

## Supported Categories

`accounting` `ai-agents` `ai-assistants` `ai-coding` `ai-image` `ai-meeting` `ai-productivity` `ai-security` `ai-video` `ai-voice` `ai-writing` `analytics` `cloud-hosting` `cloud-security` `compliance` `crm` `crypto-analytics` `crypto-exchanges` `crypto-portfolio-trackers` `crypto-tax` `crypto-telegram-bots` `crypto-trading-bots` `crypto-wallets` `customer-support` `data-observability` `databases` `defi-tools` `design-tools` `dex` `email-marketing` `endpoint-security` `erp` `finops` `hr-tools` `iam` `llm` `password-managers` `payments` `project-management` `seo-tools` `vector-databases` `video-conferencing` `vpn` `website-builders`

## Data

Pricing and feature data is sourced directly from vendor pricing pages, verified manually against live sources, and updated continuously via an automated pipeline. Coverage spans SaaS, AI tools, security software, databases, and developer infrastructure. Each product record includes pricing plans, feature matrices, aggregated ratings from G2 and Capterra, free plan status, and trial availability.

| | |
|---|---|
| **Documentation** | [MCP Server setup guides and tool reference](https://comparedge.com/mcp/docs) |
| **Open Dataset** | [495+ tools open dataset on ComparEdge](https://comparedge.com/open-data) — CC BY 4.0 |
| **Data Methodology** | [How ComparEdge verifies pricing and ratings](https://comparedge.com/methodology) |
| **MCP Protocol Specification** | [Model Context Protocol official specification](https://modelcontextprotocol.io) |

## License

MIT — [ComparEdge MCP Server source on GitHub](https://github.com/comparedge/mcp-server-comparedge)

