# ComparEdge MCP Server

[![npm version](https://img.shields.io/npm/v/@comparedge/mcp-server.svg)](https://www.npmjs.com/package/@comparedge/mcp-server)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-v2.5.5-7c3aed)](https://registry.modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Model Context Protocol server for [ComparEdge](https://comparedge.com) — verified pricing, alternatives, and feature comparisons for 495+ SaaS and AI tools. No API key required.

## Installation

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

Add to your Claude Desktop `claude_desktop_config.json`, Cursor settings, or any MCP-compatible client.

## Tools

| Tool | Description |
|------|-------------|
| `search_tools` | Search 495+ products by name or keyword |
| `get_tool` | Full pricing plans and features for a specific tool |
| `get_pricing` | Complete pricing breakdown with verified plan data |
| `compare_tools` | Side-by-side comparison of two products |
| `get_alternatives` | Top alternatives to a given tool |
| `list_category` | All tools in a category with pricing overview |
| `get_leaderboard` | Top-rated tools by category |
| `list_categories` | All 45 supported category slugs |
| `compare_pricing` | Pricing analysis of two tools side by side |
| `category_overview` | Market overview for a category |

## Examples

```
What's the cheapest CRM with a free plan?
Compare Notion vs Coda pricing
What are the best alternatives to Salesforce under $50/user/mo?
Show me the top-rated password managers
```

## Data

Pricing and feature data is sourced from vendor sites, verified manually, and updated continuously. Coverage includes SaaS, AI tools, security software, databases, and developer tools across 45 categories.

Full dataset: [comparedge.com/tools](https://comparedge.com/tools) — MCP docs: [comparedge.com/mcp](https://comparedge.com/mcp)

**Resources**
- [MCP Protocol Specification](https://modelcontextprotocol.io) — official MCP docs
- [Open Data](https://comparedge.com/open-data) — raw pricing and feature datasets (CC BY 4.0)
- [Data Methodology](https://comparedge.com/methodology) — how pricing data is collected and verified

## License

MIT — [github.com/comparedge/mcp-server-comparedge](https://github.com/comparedge/mcp-server-comparedge)
