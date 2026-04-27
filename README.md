# ComparEdge MCP Server

> **MCP (Model Context Protocol)** is an open standard that lets AI assistants like Claude connect to external data sources and call real tools.

This MCP server connects Claude — or any MCP-compatible AI — to **[ComparEdge](https://comparedge.com)**: a database of 300+ SaaS products with pricing plans, G2 ratings, and feature comparisons.

Ask Claude things like *"What's the cheapest CRM with a free tier?"* and get live, structured answers pulled straight from [comparedge.com](https://comparedge.com).

---

## Installation (Claude Desktop)

**Requirements:** Node.js 18+

### 1. Open Claude Desktop config

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### 2. Add the server

```json
{
  "mcpServers": {
    "comparedge": {
      "command": "npx",
      "args": ["-y", "@comparedge/mcp-server"]
    }
  }
}
```

### 3. Restart Claude Desktop

That's it. No API keys. No accounts. No install step needed — `npx` handles everything automatically.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `search_products` | Search SaaS products by name or keyword |
| `get_product` | Get full details for a specific product (pricing plans, ratings, features) |
| `compare_products` | Side-by-side comparison of two SaaS products |
| `list_category` | Browse all products in a category with pricing overview |
| `find_free_alternatives` | Find products with free tiers in a given category |

**Categories include:** `crm`, `llm`, `project-management`, `email-marketing`, `analytics`, `customer-support`, `design`, `devops`, and more — see [comparedge.com/categories](https://comparedge.com) for the full list.

---

## Example Conversations

**Find affordable CRM tools:**
> "What CRM tools have a free tier? Show me the cheapest paid options too."

**Compare two products:**
> "Compare Notion and Confluence on pricing and ratings."

**Explore a category:**
> "List all LLM API providers with their pricing."

**Find free alternatives:**
> "I need a free alternative to Figma. What's available?"

**Research a specific tool:**
> "Give me full pricing details for Linear."

---

## How It Works

The server runs as a local process and communicates with Claude via **JSON-RPC 2.0 over stdin/stdout** — the MCP wire protocol. It fetches live data from the [ComparEdge API](https://comparedge-api.up.railway.app/api/v1) and formats it for Claude to read.

Zero external npm dependencies. Pure Node.js built-ins only (`https`, `readline`).

---

## Data Source

All pricing and rating data comes from **[ComparEdge](https://comparedge.com)** — updated regularly.

- Browse products: [comparedge.com](https://comparedge.com)
- Source repo: [github.com/comparedge/mcp-server-comparedge](https://github.com/comparedge/mcp-server-comparedge)

---

## License

MIT © [ComparEdge](https://comparedge.com)
