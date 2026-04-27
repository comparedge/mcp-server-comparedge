#!/usr/bin/env node
/**
 * ComparEdge MCP Server
 * Exposes SaaS pricing data from comparedge.com as MCP tools for Claude and other AI assistants.
 * Protocol: JSON-RPC 2.0 over stdin/stdout (MCP spec 2024-11-05)
 * Zero external dependencies — pure Node.js built-ins only.
 */

import { createInterface } from 'readline';
import https from 'https';

const API_BASE = 'https://comparedge-api.up.railway.app/api/v1';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const TOOLS = [
  {
    name: "search_products",
    description: "Search SaaS products by name or keyword. Returns matching products with pricing and ratings from comparedge.com",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (product name or keyword)" },
        limit: { type: "number", description: "Max results (default 5)", default: 5 }
      },
      required: ["query"]
    }
  },
  {
    name: "get_product",
    description: "Get detailed info about a specific SaaS product including all pricing plans, features, and ratings",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Product slug (e.g., 'notion', 'slack', 'figma')" }
      },
      required: ["slug"]
    }
  },
  {
    name: "compare_products",
    description: "Compare two SaaS products side by side on pricing, features, and ratings",
    inputSchema: {
      type: "object",
      properties: {
        product1: { type: "string", description: "First product slug" },
        product2: { type: "string", description: "Second product slug" }
      },
      required: ["product1", "product2"]
    }
  },
  {
    name: "list_category",
    description: "List all SaaS products in a category with pricing overview",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Category slug (e.g., 'crm', 'llm', 'project-management', 'email-marketing')" },
        sort_by: { type: "string", description: "Sort by: price, rating, name", default: "rating" }
      },
      required: ["category"]
    }
  },
  {
    name: "find_free_alternatives",
    description: "Find SaaS products with free tiers in a given category",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Category slug" }
      },
      required: ["category"]
    }
  }
];

async function handleTool(name, args) {
  switch (name) {
    case "search_products": {
      const data = await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(args.query)}&limit=${args.limit || 5}`);
      const products = data.products || data.results || [];
      if (!products.length) return 'No products found for that query.';
      return products.map(p => {
        const pricing = p.pricing || {};
        const plans = pricing.plans || [];
        const paid = plans.filter(pl => pl.price > 0);
        const starting = paid.length ? Math.min(...paid.map(pl => pl.price)) : null;
        return `${p.name} (${p.category}) - ${starting ? '$' + starting + '/mo' : 'Free'} - G2: ${(p.rating || {}).g2 || 'N/A'} - https://comparedge.com/tools/${p.slug}`;
      }).join('\n');
    }

    case "get_product": {
      const data = await fetchJSON(`${API_BASE}/products?limit=500`);
      const product = (data.products || []).find(p => p.slug === args.slug);
      if (!product) return `Product "${args.slug}" not found. Try searching with search_products.`;
      const pricing = product.pricing || {};
      const plans = (pricing.plans || []).map(pl =>
        `  ${pl.name}: ${pl.price ? '$' + pl.price + '/' + (pl.period || 'mo') : 'Free'}`
      ).join('\n');
      return [
        `${product.name}`,
        `Category: ${product.category}`,
        `Description: ${product.description || 'N/A'}`,
        `Free tier: ${pricing.free ? 'Yes' : 'No'}`,
        `G2 Rating: ${(product.rating || {}).g2 || 'N/A'}`,
        `Plans:\n${plans || '  N/A'}`,
        `More: https://comparedge.com/tools/${product.slug}`
      ].join('\n');
    }

    case "compare_products": {
      const data = await fetchJSON(`${API_BASE}/compare/${args.product1}/${args.product2}`);
      if (data.error) return `Comparison not available. Check slugs: ${args.product1}, ${args.product2}`;
      return JSON.stringify(data, null, 2);
    }

    case "list_category": {
      const data = await fetchJSON(`${API_BASE}/products?category=${encodeURIComponent(args.category)}&limit=50`);
      const products = data.products || [];
      if (!products.length) return `No products found in category "${args.category}".`;
      const lines = products.map(p => {
        const pricing = p.pricing || {};
        const plans = pricing.plans || [];
        const paid = plans.filter(pl => pl.price > 0);
        const starting = paid.length ? Math.min(...paid.map(pl => pl.price)) : null;
        return `${p.name}: ${starting ? '$' + starting + '/mo' : 'Free only'} | Free tier: ${pricing.free ? 'Yes' : 'No'} | G2: ${(p.rating || {}).g2 || '-'}`;
      });
      return lines.join('\n') + `\n\nFull comparison: https://comparedge.com/category/${args.category}`;
    }

    case "find_free_alternatives": {
      const data = await fetchJSON(`${API_BASE}/products?category=${encodeURIComponent(args.category)}&limit=50`);
      const free = (data.products || []).filter(p => (p.pricing || {}).free);
      if (!free.length) return `No free-tier products found in category "${args.category}".`;
      return free.map(p =>
        `${p.name} - G2: ${(p.rating || {}).g2 || '-'} - https://comparedge.com/tools/${p.slug}`
      ).join('\n');
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// ── JSON-RPC 2.0 transport (MCP over stdio) ───────────────────────────────────

const rl = createInterface({ input: process.stdin, terminal: false });
let buffer = '';

function send(response) {
  const msg = JSON.stringify(response);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(msg, 'utf8')}\r\n\r\n${msg}`);
}

rl.on('line', async (line) => {
  // MCP framing: skip Content-Length header lines, accumulate JSON body
  if (line.startsWith('Content-Length:') || line.trim() === '') return;
  buffer += line;
  try {
    const request = JSON.parse(buffer);
    buffer = '';

    if (request.method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'comparedge', version: '1.0.0' }
        }
      });
    } else if (request.method === 'tools/list') {
      send({ jsonrpc: '2.0', id: request.id, result: { tools: TOOLS } });
    } else if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      try {
        const text = await handleTool(name, args || {});
        send({ jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text }] } });
      } catch (err) {
        send({ jsonrpc: '2.0', id: request.id, error: { code: -32000, message: err.message } });
      }
    } else if (request.method === 'notifications/initialized') {
      // Notification — no response
    } else if (request.id !== undefined) {
      send({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: `Method not found: ${request.method}` } });
    }
  } catch (e) {
    // Incomplete JSON — keep buffering; reset if buffer bloats
    if (buffer.length > 100_000) buffer = '';
  }
});

process.on('uncaughtException', () => {});
