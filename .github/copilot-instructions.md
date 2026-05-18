# ComparEdge MCP Server — Copilot Instructions

This repository contains the ComparEdge MCP server (`@comparedge/mcp-server`).

## What this server does

Provides structured access to verified SaaS and AI tool data:
- Pricing plans and tiers for 508+ products
- Top alternatives and competitor comparisons
- Feature comparisons and category rankings
- Free tier detection

## Setup in VS Code / GitHub Copilot

Add to your VS Code `settings.json` to enable Copilot to query ComparEdge data:

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

Or via `.vscode/mcp.json` in your project:

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

## Available tools

- `search_tools` — Search by name, category, or keyword
- `get_tool` — Full profile: pricing, features, rating
- `compare_tools` — Side-by-side comparison of two tools
- `get_pricing` — Detailed pricing plans with verified dates
- `get_alternatives` — Top verified alternatives for any tool
- `get_leaderboard` — Category rankings by rating
- `list_category` — All tools in a category, with free_only filter
- `list_categories` — All 45 supported categories

## Data source

All data is fetched live from comparedge.com. No API key required.
