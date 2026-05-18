#!/usr/bin/env node
/**
 * ComparEdge MCP Server v2.1.0
 * MCP protocol version 2024-11-05
 * JSON-RPC 2.0 over stdio, zero npm dependencies
 * Data source: comparedge.com (508 products, live)
 */

import { createInterface } from 'readline';

const TOOLS_JSON   = 'https://comparedge.com/llms-tools.json';
const PRICING_JSON = 'https://comparedge.com/llms-pricing.json';
const SITE_BASE    = 'https://comparedge.com';

// Module-level cache (lives for the duration of the process)
let _toolsCache   = null;
let _pricingCache = null;

const CATEGORIES = [
  { slug: 'ai-tools', name: 'AI Tools' },
  { slug: 'llm', name: 'Large Language Models' },
  { slug: 'ai-coding', name: 'AI Coding' },
  { slug: 'ai-writing', name: 'AI Writing' },
  { slug: 'ai-image', name: 'AI Image Generation' },
  { slug: 'ai-video', name: 'AI Video' },
  { slug: 'ai-audio', name: 'AI Audio' },
  { slug: 'project-management', name: 'Project Management' },
  { slug: 'crm', name: 'CRM' },
  { slug: 'email-marketing', name: 'Email Marketing' },
  { slug: 'customer-support', name: 'Customer Support' },
  { slug: 'analytics', name: 'Analytics' },
  { slug: 'design-tools', name: 'Design Tools' },
  { slug: 'video-conferencing', name: 'Video Conferencing' },
  { slug: 'cloud-hosting', name: 'Cloud Hosting' },
  { slug: 'devops', name: 'DevOps' },
  { slug: 'security', name: 'Security' },
  { slug: 'cloud-security', name: 'Cloud Security' },
  { slug: 'iam', name: 'Identity and Access Management' },
  { slug: 'siem', name: 'SIEM' },
  { slug: 'edr', name: 'Endpoint Detection and Response' },
  { slug: 'vulnerability-management', name: 'Vulnerability Management' },
  { slug: 'compliance', name: 'Compliance' },
  { slug: 'erp', name: 'ERP' },
  { slug: 'hr-tools', name: 'HR Tools' },
  { slug: 'accounting', name: 'Accounting' },
  { slug: 'legal-tech', name: 'Legal Tech' },
  { slug: 'data-visualization', name: 'Data Visualization' },
  { slug: 'bi-tools', name: 'Business Intelligence' },
  { slug: 'database', name: 'Database' },
  { slug: 'vector-db', name: 'Vector Database' },
  { slug: 'api-management', name: 'API Management' },
  { slug: 'payment-processing', name: 'Payment Processing' },
  { slug: 'e-commerce', name: 'E-Commerce' },
  { slug: 'email-infrastructure', name: 'Email Infrastructure' },
  { slug: 'monitoring', name: 'Monitoring' },
  { slug: 'logging', name: 'Logging' },
  { slug: 'feature-flags', name: 'Feature Flags' },
  { slug: 'a-b-testing', name: 'A/B Testing' },
  { slug: 'crypto-exchanges', name: 'Crypto Exchanges' },
  { slug: 'crypto-trading-bots', name: 'Crypto Trading Bots' },
  { slug: 'defi-tools', name: 'DeFi Tools' },
  { slug: 'dex', name: 'Decentralized Exchanges' },
  { slug: 'nft-tools', name: 'NFT Tools' },
  { slug: 'vpn', name: 'VPN' },
  { slug: 'password-managers', name: 'Password Managers' },
];

const TOOL_DEFINITIONS = [
  {
    name: 'search_tools',
    description: 'Search 508+ software products by name or keyword. Returns name, category, rating, free plan availability, starting price, and ComparEdge URL.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string (product name, keyword, or use case)' },
        limit: { type: 'number', description: 'Maximum number of results to return (default: 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_tool',
    description: 'Retrieve full details for a specific software tool by its slug. Returns name, description, category, rating, all pricing plans, features, and ComparEdge URL.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Tool slug identifier (e.g., "openai", "notion", "github-copilot")' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'compare_tools',
    description: 'Side-by-side structured comparison of two software products. Returns pricing, features, ratings, and key differences.',
    inputSchema: {
      type: 'object',
      properties: {
        tool1: { type: 'string', description: 'Slug of the first tool to compare' },
        tool2: { type: 'string', description: 'Slug of the second tool to compare' },
      },
      required: ['tool1', 'tool2'],
    },
  },
  {
    name: 'list_category',
    description: 'Browse all tools in a specific software category with pricing overview. Supports sorting and free-only filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category slug (e.g., "llm", "ai-coding", "crm")' },
        sort_by: { type: 'string', description: 'Sort field: "rating" (default) or "startingPrice"' },
        free_only: { type: 'boolean', description: 'If true, return only tools with a free plan (default: false)' },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_alternatives',
    description: 'Find top alternatives to a given software tool within the same category, sorted by rating.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Slug of the tool to find alternatives for' },
        limit: { type: 'number', description: 'Maximum number of alternatives to return (default: 5)' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_pricing',
    description: 'Retrieve complete verified pricing breakdown for a specific tool, including all plans, prices, highlights, and token pricing where applicable.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Tool slug identifier' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_leaderboard',
    description: 'Get top-rated software tools by category, ranked by aggregated G2 and Capterra scores.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category slug to filter by, or "all" for overall leaderboard (default: "all")' },
        limit: { type: 'number', description: 'Number of top tools to return (default: 10)' },
      },
    },
  },
  {
    name: 'list_categories',
    description: 'List all 45 supported software categories with their slugs and display names.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// --- Data fetching with in-process cache ---

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function getAllTools() {
  if (_toolsCache) return _toolsCache;
  const data = await fetchJSON(TOOLS_JSON);
  _toolsCache = Array.isArray(data) ? data : (data.tools || []);
  return _toolsCache;
}

async function getAllPricing() {
  if (_pricingCache) return _pricingCache;
  const data = await fetchJSON(PRICING_JSON);
  _pricingCache = Array.isArray(data) ? data : (data.pricing || []);
  return _pricingCache;
}

// --- Helpers ---

function toolURL(slug) {
  return `${SITE_BASE}/tools/${slug}`;
}

function pricingURL(slug) {
  return `${SITE_BASE}/pricing/${slug}-pricing`;
}

function formatPrice(price) {
  if (price === null || price === undefined) return 'N/A';
  if (price === 0) return 'Free';
  return `$${price}/mo`;
}

function fmtRow(label, v1, v2) {
  return `${label.padEnd(22)} ${String(v1 ?? 'N/A').slice(0, 22).padEnd(22)} ${String(v2 ?? 'N/A').slice(0, 22)}`;
}

// --- Tool handlers ---

async function searchTools(args) {
  const { query, limit = 5 } = args;
  const q = query.toLowerCase();
  const allTools = await getAllTools();

  // Score each tool by relevance
  const scored = allTools
    .map(t => {
      let score = 0;
      const name = (t.name || '').toLowerCase();
      const slug = (t.slug || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const cat  = (t.categoryName || t.category || '').toLowerCase();

      if (name === q) score += 100;
      else if (name.startsWith(q)) score += 60;
      else if (name.includes(q)) score += 40;
      if (slug.includes(q)) score += 30;
      if (desc.includes(q)) score += 20;
      if (cat.includes(q)) score += 15;

      return { t, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.t.rating ?? 0) - (a.t.rating ?? 0))
    .slice(0, limit)
    .map(x => x.t);

  if (scored.length === 0) {
    return `No results found for "${query}".`;
  }

  const lines = scored.map((t, i) => {
    const rating = t.rating ? `${t.rating}/5` : 'N/A';
    const free   = t.freePlan ? 'Yes' : 'No';
    const price  = t.startingPrice !== undefined ? formatPrice(t.startingPrice) : 'N/A';
    return [
      `${i + 1}. ${t.name} (${t.slug})`,
      `   Category: ${t.categoryName || t.category || 'N/A'}`,
      `   Rating: ${rating} | Free plan: ${free} | Starting price: ${price}`,
      `   URL: ${toolURL(t.slug)}`,
    ].join('\n');
  });

  return `Search results for "${query}" (${scored.length} found):\n\n${lines.join('\n\n')}`;
}

async function getTool(args) {
  const { slug } = args;
  const [allTools, allPricing] = await Promise.all([getAllTools(), getAllPricing()]);

  const t = allTools.find(x => x.slug === slug);
  if (!t) return `Tool with slug "${slug}" not found. Use search_tools to find the correct slug.`;

  const pricing = allPricing.find(x => x.slug === slug);

  const lines = [
    `Name: ${t.name}`,
    `Slug: ${t.slug}`,
    `Category: ${t.categoryName || t.category || 'N/A'}`,
    `Description: ${t.description || 'N/A'}`,
    `Rating: ${t.rating ? `${t.rating}/5` : 'N/A'}`,
    `Free plan: ${t.freePlan ? 'Yes' : 'No'}`,
    `Starting price: ${t.startingPrice !== undefined ? formatPrice(t.startingPrice) : 'N/A'}`,
    `Verified at: ${t.verifiedAt || t.lastUpdated || 'N/A'}`,
  ];

  const plans = pricing?.plans || t.plans;
  if (plans && plans.length > 0) {
    lines.push('\nPricing plans:');
    plans.forEach(p => {
      const price = p.price !== undefined ? formatPrice(p.price) : 'N/A';
      const hl = Array.isArray(p.highlights) ? p.highlights.slice(0, 3).join(', ') : '';
      lines.push(`  - ${p.name}: ${price}${hl ? ` | ${hl}` : ''}`);
    });
  }

  if (t.features && t.features.length > 0) {
    lines.push('\nKey features:');
    t.features.slice(0, 10).forEach(f => lines.push(`  - ${f}`));
  }

  lines.push(`\nComparEdge URL: ${toolURL(slug)}`);
  lines.push(`Pricing details: ${pricingURL(slug)}`);
  return lines.join('\n');
}

async function compareTools(args) {
  const { tool1, tool2 } = args;
  const allTools = await getAllTools();

  const t1 = allTools.find(x => x.slug === tool1);
  const t2 = allTools.find(x => x.slug === tool2);

  if (!t1) return `Tool "${tool1}" not found. Use search_tools to find the correct slug.`;
  if (!t2) return `Tool "${tool2}" not found. Use search_tools to find the correct slug.`;

  const lines = [
    `Comparison: ${t1.name} vs ${t2.name}`,
    '',
    fmtRow('Field', t1.name.slice(0, 20), t2.name.slice(0, 20)),
    '-'.repeat(70),
    fmtRow('Category', t1.categoryName || t1.category, t2.categoryName || t2.category),
    fmtRow('Rating', t1.rating ? `${t1.rating}/5` : 'N/A', t2.rating ? `${t2.rating}/5` : 'N/A'),
    fmtRow('Free plan', t1.freePlan ? 'Yes' : 'No', t2.freePlan ? 'Yes' : 'No'),
    fmtRow('Starting price', formatPrice(t1.startingPrice), formatPrice(t2.startingPrice)),
    fmtRow('Verified at', t1.verifiedAt || 'N/A', t2.verifiedAt || 'N/A'),
  ];

  // Plans for t1
  const p1 = t1.plans;
  if (p1 && p1.length > 0) {
    lines.push(`\n${t1.name} plans:`);
    p1.forEach(p => lines.push(`  - ${p.name}: ${formatPrice(p.price)}`));
  }

  // Plans for t2
  const p2 = t2.plans;
  if (p2 && p2.length > 0) {
    lines.push(`\n${t2.name} plans:`);
    p2.forEach(p => lines.push(`  - ${p.name}: ${formatPrice(p.price)}`));
  }

  lines.push(`\n${t1.name} URL: ${toolURL(tool1)}`);
  lines.push(`${t2.name} URL: ${toolURL(tool2)}`);
  lines.push(`Full comparison: ${SITE_BASE}/compare/${tool1}-vs-${tool2}`);
  return lines.join('\n');
}

async function listCategory(args) {
  const { category, sort_by = 'rating', free_only = false } = args;
  const allTools = await getAllTools();

  let filtered = allTools.filter(t => t.category === category || t.categoryName === category);
  if (filtered.length === 0) {
    return `No tools found for category "${category}". Use list_categories to see available category slugs.`;
  }
  if (free_only) filtered = filtered.filter(t => t.freePlan);
  if (sort_by === 'startingPrice') {
    filtered.sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
  } else {
    filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  const header = `Category: ${filtered[0]?.categoryName || category} (${filtered.length} tools${free_only ? ', free only' : ''}, sorted by ${sort_by})`;
  const lines = filtered.map((t, i) =>
    `${i + 1}. ${t.name} | Rating: ${t.rating ?? 'N/A'}/5 | Free: ${t.freePlan ? 'Yes' : 'No'} | Price: ${formatPrice(t.startingPrice)} | ${toolURL(t.slug)}`
  );
  return `${header}\n\n${lines.join('\n')}`;
}

async function getAlternatives(args) {
  const { slug, limit = 5 } = args;
  const allTools = await getAllTools();

  const target = allTools.find(t => t.slug === slug);
  if (!target) return `Tool with slug "${slug}" not found.`;

  const alternatives = allTools
    .filter(t => t.slug !== slug && t.category === target.category)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  if (alternatives.length === 0) {
    return `No alternatives found for "${target.name}" in category "${target.categoryName || target.category}".`;
  }

  const lines = alternatives.map((t, i) =>
    `${i + 1}. ${t.name} | Rating: ${t.rating ?? 'N/A'}/5 | Free: ${t.freePlan ? 'Yes' : 'No'} | Price: ${formatPrice(t.startingPrice)} | ${toolURL(t.slug)}`
  );
  return `Top alternatives to ${target.name} in ${target.categoryName || target.category}:\n\n${lines.join('\n')}\n\nFull list: ${SITE_BASE}/alternatives/${slug}-alternatives`;
}

async function getPricing(args) {
  const { slug } = args;
  const allPricing = await getAllPricing();

  const entry = allPricing.find(t => t.slug === slug);
  if (!entry) return `Pricing data not found for "${slug}".`;

  const lines = [
    `Pricing: ${entry.name || slug}`,
    `Free plan: ${entry.freePlan ? 'Yes' : 'No'}`,
    `Verified at: ${entry.verifiedAt || 'N/A'}`,
  ];

  if (entry.plans && entry.plans.length > 0) {
    lines.push('\nPlans:');
    entry.plans.forEach(p => {
      const price = p.price !== undefined ? formatPrice(p.price) : 'N/A';
      lines.push(`  ${p.name}: ${price}`);
      if (p.highlights && p.highlights.length > 0) {
        const h = Array.isArray(p.highlights) ? p.highlights : [p.highlights];
        h.forEach(hl => lines.push(`    - ${hl}`));
      }
    });
  }

  if (entry.tokenPricing) {
    lines.push('\nToken pricing:');
    if (typeof entry.tokenPricing === 'object') {
      Object.entries(entry.tokenPricing).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
    } else {
      lines.push(`  ${entry.tokenPricing}`);
    }
  }

  lines.push(`\nComparEdge URL: ${pricingURL(slug)}`);
  return lines.join('\n');
}

async function getLeaderboard(args) {
  const { category = 'all', limit = 10 } = args;
  const allTools = await getAllTools();

  let filtered = category === 'all'
    ? allTools
    : allTools.filter(t => t.category === category);

  if (filtered.length === 0) return `No tools found for category "${category}".`;

  filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const top = filtered.slice(0, limit);

  const header = category === 'all'
    ? `Overall leaderboard (top ${top.length} by rating):`
    : `Leaderboard for ${top[0]?.categoryName || category} (top ${top.length} by rating):`;

  const lines = top.map((t, i) =>
    `${String(i + 1).padStart(2)}. ${t.name.padEnd(30)} Rating: ${String(t.rating ?? 'N/A').padEnd(6)} Free: ${t.freePlan ? 'Yes' : 'No'} | ${toolURL(t.slug)}`
  );
  return `${header}\n\n${lines.join('\n')}`;
}

function listCategoriesFn() {
  const lines = CATEGORIES.map((c, i) =>
    `${String(i + 1).padStart(2)}. ${c.name.padEnd(35)} (${c.slug})`
  );
  return `Supported categories (${CATEGORIES.length} total):\n\n${lines.join('\n')}`;
}

// --- Dispatch ---

async function callTool(name, args) {
  switch (name) {
    case 'search_tools':    return searchTools(args);
    case 'get_tool':        return getTool(args);
    case 'compare_tools':   return compareTools(args);
    case 'list_category':   return listCategory(args);
    case 'get_alternatives':return getAlternatives(args);
    case 'get_pricing':     return getPricing(args);
    case 'get_leaderboard': return getLeaderboard(args);
    case 'list_categories': return listCategoriesFn();
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// --- JSON-RPC 2.0 ---

function makeResponse(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function makeError(id, code, message) {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return makeResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'comparedge-mcp-server', version: '2.1.0' },
    });
  }

  if (method === 'tools/list') {
    return makeResponse(id, { tools: TOOL_DEFINITIONS });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      const text = await callTool(name, args || {});
      return makeResponse(id, {
        content: [{ type: 'text', text }],
      });
    } catch (err) {
      return makeResponse(id, {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      });
    }
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  return makeError(id, -32601, `Method not found: ${method}`);
}

// --- Main stdio loop ---

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch (_) {
    process.stdout.write(makeError(null, -32700, 'Parse error') + '\n');
    return;
  }
  const response = await handleRequest(req);
  if (response !== null) {
    process.stdout.write(response + '\n');
  }
});

rl.on('close', () => process.exit(0));
