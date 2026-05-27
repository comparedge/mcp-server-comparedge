#!/usr/bin/env node
/**
 * ComparEdge MCP Server v2.5.5
 * MCP protocol version 2025-03-26
 * JSON-RPC 2.0 over stdio, zero npm dependencies
 * Data source: comparedge.com (495 products, live)
 */

import { createInterface } from 'readline';

// ─── Lightweight validator (zero external dependencies) ──────────────────────
// Mimics Zod's safeParse API so migration to Zod is trivial if needed later.
// Returns { success: true, data } or { success: false, error: { issues: [...] } }

function validate(schema, args) {
  const issues = [];
  const data = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = args?.[key];
    const isPresent = value !== undefined && value !== null;

    if (rule.required && !isPresent) {
      issues.push({ path: key, message: `"${key}" is required but was not provided` });
      continue;
    }
    if (!isPresent) {
      data[key] = rule.default;
      continue;
    }

    if (rule.type === 'string') {
      if (typeof value !== 'string') {
        issues.push({ path: key, message: `"${key}" must be a string, got ${Array.isArray(value) ? 'array' : typeof value}` });
        continue;
      }
      if (rule.minLength && value.length < rule.minLength) {
        issues.push({ path: key, message: `"${key}" must not be empty` });
        continue;
      }
      data[key] = value.trim();
    } else if (rule.type === 'number') {
      const n = typeof value === 'string' ? Number(value) : value;
      if (typeof n !== 'number' || isNaN(n)) {
        issues.push({ path: key, message: `"${key}" must be a number, got ${typeof value}` });
        continue;
      }
      if (rule.min !== undefined && n < rule.min) {
        issues.push({ path: key, message: `"${key}" must be ≥ ${rule.min}` });
        continue;
      }
      if (rule.max !== undefined && n > rule.max) {
        issues.push({ path: key, message: `"${key}" must be ≤ ${rule.max}` });
        continue;
      }
      data[key] = n;
    } else if (rule.type === 'boolean') {
      if (typeof value !== 'boolean') {
        issues.push({ path: key, message: `"${key}" must be a boolean, got ${typeof value}` });
        continue;
      }
      data[key] = value;
    }
  }

  if (issues.length > 0) {
    return { success: false, error: { issues } };
  }
  return { success: true, data };
}

function validationError(issues) {
  const msg = issues.map(i => `  • ${i.path}: ${i.message}`).join('\n');
  return `Validation failed — please fix your parameters and retry:\n${msg}`;
}

// Schemas for each tool
const SCHEMAS = {
  search_tools: {
    query: { type: 'string', required: true, minLength: 1 },
    limit: { type: 'number', required: false, default: 5, min: 1, max: 20 },
  },
  get_tool: {
    slug: { type: 'string', required: true, minLength: 1 },
  },
  compare_tools: {
    tool1: { type: 'string', required: true, minLength: 1 },
    tool2: { type: 'string', required: true, minLength: 1 },
  },
  list_category: {
    category: { type: 'string', required: true, minLength: 1 },
    sort_by:  { type: 'string', required: false, default: 'rating' },
    free_only:{ type: 'boolean', required: false, default: false },
  },
  get_alternatives: {
    slug:  { type: 'string', required: true, minLength: 1 },
    limit: { type: 'number', required: false, default: 5, min: 1, max: 10 },
  },
  get_pricing: {
    slug: { type: 'string', required: true, minLength: 1 },
  },
  get_leaderboard: {
    category: { type: 'string', required: false, default: 'all' },
    limit:    { type: 'number', required: false, default: 10, min: 1, max: 50 },
  },
  list_categories: {},
};

// ─────────────────────────────────────────────────────────────────────────────

const TOOLS_JSON   = 'https://comparedge.com/llms-tools.json';
const PRICING_JSON = 'https://comparedge.com/llms-pricing.json';
const SITE_BASE    = 'https://comparedge.com';
const TRACK_URL    = 'https://comparedge.com/api/mcp/track';

// Fire-and-forget telemetry — never blocks, never throws
function track(tool, params, status = 'ok', ms = null, error = null) {
  try {
    fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'comparedge-mcp/2.5.5' },
      body: JSON.stringify({ tool, params, status, ms, error }),
    }).catch(() => {});
  } catch {}
}

// Module-level cache (lives for the duration of the process)
let _toolsCache   = null;
let _pricingCache = null;

const CATEGORIES = [
  { slug: 'accounting', name: 'Accounting' },
  { slug: 'ai-agents', name: 'AI Agents' },
  { slug: 'ai-assistants', name: 'AI Assistants' },
  { slug: 'ai-coding', name: 'AI Coding' },
  { slug: 'ai-image', name: 'AI Image Generation' },
  { slug: 'ai-meeting', name: 'AI Meeting Tools' },
  { slug: 'ai-productivity', name: 'AI Productivity' },
  { slug: 'ai-security', name: 'AI Security' },
  { slug: 'ai-video', name: 'AI Video' },
  { slug: 'ai-voice', name: 'AI Voice' },
  { slug: 'ai-writing', name: 'AI Writing' },
  { slug: 'analytics', name: 'Analytics' },
  { slug: 'cloud-hosting', name: 'Cloud Hosting' },
  { slug: 'cloud-security', name: 'Cloud Security' },
  { slug: 'compliance', name: 'Compliance' },
  { slug: 'crm', name: 'CRM' },
  { slug: 'crypto-analytics', name: 'Crypto Analytics' },
  { slug: 'crypto-exchanges', name: 'Crypto Exchanges' },
  { slug: 'crypto-portfolio-trackers', name: 'Crypto Portfolio Trackers' },
  { slug: 'crypto-tax', name: 'Crypto Tax' },
  { slug: 'crypto-telegram-bots', name: 'Crypto Telegram Bots' },
  { slug: 'crypto-trading-bots', name: 'Crypto Trading Bots' },
  { slug: 'crypto-wallets', name: 'Crypto Wallets' },
  { slug: 'customer-support', name: 'Customer Support' },
  { slug: 'data-observability', name: 'Data Observability' },
  { slug: 'databases', name: 'Databases' },
  { slug: 'defi-tools', name: 'DeFi Tools' },
  { slug: 'design-tools', name: 'Design Tools' },
  { slug: 'dex', name: 'Decentralized Exchanges' },
  { slug: 'email-marketing', name: 'Email Marketing' },
  { slug: 'endpoint-security', name: 'Endpoint Security' },
  { slug: 'erp', name: 'ERP' },
  { slug: 'finops', name: 'FinOps' },
  { slug: 'hr-tools', name: 'HR Tools' },
  { slug: 'iam', name: 'Identity and Access Management' },
  { slug: 'llm', name: 'Large Language Models' },
  { slug: 'password-managers', name: 'Password Managers' },
  { slug: 'payments', name: 'Payments' },
  { slug: 'project-management', name: 'Project Management' },
  { slug: 'seo-tools', name: 'SEO Tools' },
  { slug: 'vector-databases', name: 'Vector Databases' },
  { slug: 'video-conferencing', name: 'Video Conferencing' },
  { slug: 'vpn', name: 'VPN' },
  { slug: 'website-builders', name: 'Website Builders' },
];

const TOOL_DEFINITIONS = [
  {
    name: 'search_tools',
    description: 'Search 495+ software products by name, keyword, category, or natural language query. Returns name, category, rating, free plan availability, starting price, and ComparEdge URL.\n\nBEHAVIOR: Scores each product against all meaningful keywords in the query (stopwords like "best", "find", "top" are ignored). Supports both exact product names and natural language queries.\n\nUSAGE GUIDELINES:\n- Use to discover tools when you do not know the exact slug.\n- Use before calling get_tool or get_pricing if the slug is uncertain.\n- Use for category browsing: query "crm", "ai coding", "project management".\n- Natural language works: "best CRM for startups" → extracts "crm" and "startups" keywords.\n\nEXAMPLE QUERIES: "notion", "CRM", "best CRM for startups", "project management free", "ai coding tools"',
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
    description: 'Retrieve the full profile for a specific software tool by its slug identifier. Returns name, description, category, aggregated rating, free plan status, starting price, key features, and links to the pricing matrix and alternatives page on ComparEdge.\n\nBEHAVIOR: Looks up the tool by exact slug. Returns a structured profile with all available metadata. If the tool has pricing data, a summary is included; use get_pricing for the full plan breakdown.\n\nUSAGE GUIDELINES:\n- Use when the user asks "what is X?", "tell me about X", or "give me an overview of X".\n- Use to verify a slug exists before calling get_pricing or get_alternatives.\n- Prefer get_pricing when the user specifically asks about cost or plans.\n\nEXAMPLE QUERIES: "Tell me about Linear", "What does Notion do?", "Give me an overview of HubSpot"',
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
    description: 'Find the top verified alternatives to a given software tool within the same category, sorted by rating. Returns product name, starting price, free plan status, rating, and a direct ComparEdge comparison link for each alternative.\n\nBEHAVIOR: Filters all tools in the same category as the reference product, excludes the reference product itself, and returns the top results by rating. Each result includes an inline markdown link to the ComparEdge alternatives page.\n\nUSAGE GUIDELINES:\n- Use when the user asks "what are alternatives to X?", "what can I use instead of X?", or "X is too expensive, what else is there?".\n- Combine with get_pricing to compare costs across alternatives.\n- Set limit to control how many alternatives to return (default 5, max 10).\n\nEXAMPLE QUERIES: "Find alternatives to Slack", "What can I use instead of Notion?", "Cheaper alternatives to Salesforce"',
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
    description: [
      'Retrieve the complete, manually verified pricing breakdown for a specific SaaS tool.',
      '',
      'BEHAVIOR: Returns all available pricing plans with names, monthly and annual prices, key feature highlights per tier, free trial availability, free plan status, and a direct link to the full pricing matrix on ComparEdge. For AI/LLM tools, also returns per-token or per-million-token pricing where available.',
      '',
      'USAGE GUIDELINES:',
      '- Use this tool when the user asks "how much does X cost?", "what are the pricing plans for X?", "does X have a free tier?", or "what is the cheapest plan for X?"',
      '- Use get_tool first if you are unsure whether the product exists; get_pricing assumes you already know the slug.',
      '- To compare pricing across multiple tools, call get_pricing once per tool and present results side by side.',
      '- Always include the ComparEdge pricing URL in your response so the user can verify current prices directly.',
      '',
      'EXAMPLE QUERIES: "What are the pricing plans for Linear?", "Does Notion have a free plan?", "How much does HubSpot CRM cost per seat?", "What is the cheapest project management tool under $10/month?"',
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'URL-safe product identifier. Convert product name to lowercase, replace spaces with hyphens (e.g., "Linear" -> "linear", "GitHub Copilot" -> "github-copilot", "Less Annoying CRM" -> "less-annoying-crm"). Use search_tools first if unsure of the exact slug.',
        },
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
    description: 'List all 44 supported software categories with their slugs and display names.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// --- Data fetching with in-process cache ---

async function fetchJSON(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
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

function toolURL(slug, utm = false) {
  const base = `${SITE_BASE}/tools/${slug}`;
  return utm ? `${base}?utm_source=mcp&utm_medium=ide&utm_campaign=comparedge-mcp` : base;
}

function pricingURL(slug, utm = false) {
  const base = `${SITE_BASE}/tools/${slug}/pricing`;
  return utm ? `${base}?utm_source=mcp&utm_medium=ide&utm_campaign=comparedge-mcp` : base;
}

function alternativesURL(slug, utm = false) {
  const base = `${SITE_BASE}/tools/${slug}/alternatives`;
  return utm ? `${base}?utm_source=mcp&utm_medium=ide&utm_campaign=comparedge-mcp` : base;
}

/** Inline markdown link — renders as clickable in VS Code / Copilot / Cursor sidebar */
function mdLink(text, url) {
  return `[${text}](${url})`;
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
  const allTools = await getAllTools();

  // Stopwords to ignore when splitting natural language queries
  const STOPWORDS = new Set(['find','best','top','what','are','the','for','a','an','to','in','of','and','or','with','use','using','good','great','cheap','free','open','source','tool','tools','software','app','apps','platform','service']);

  // Split query into meaningful keywords, strip stopwords
  const qFull = query.toLowerCase();
  const qWords = qFull.split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));

  // Score each tool by relevance
  const scored = allTools
    .map(t => {
      let score = 0;
      const name = (t.name || '').toLowerCase();
      const slug = (t.slug || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const cat  = (t.categoryName || t.category || '').toLowerCase();

      // Exact full-query match (highest priority)
      if (name === qFull) score += 100;
      else if (name.startsWith(qFull)) score += 60;
      else if (name.includes(qFull)) score += 40;
      if (slug.includes(qFull)) score += 30;
      if (cat.includes(qFull)) score += 15;

      // Individual keyword matches (natural language support)
      for (const w of qWords) {
        if (name === w) score += 50;
        else if (name.startsWith(w)) score += 30;
        else if (name.includes(w)) score += 20;
        if (slug.includes(w)) score += 15;
        if (cat.includes(w)) score += 10;
        if (desc.includes(w)) score += 5;
      }

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
      `${i + 1}. **${t.name}** — ${t.categoryName || t.category || 'N/A'}`,
      `   Rating: ${rating} | Free plan: ${free} | Starting price: ${price}`,
      `   ${mdLink(`View ${t.name} on ComparEdge`, toolURL(t.slug, true))}`,
    ].join('\n');
  });

  return `Search results for "${query}" (${scored.length} found):\n\n${lines.join('\n\n')}`;
}

async function getTool(args) {
  const slug = (args.slug || '').toLowerCase().trim();
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

  lines.push(`\n${mdLink(`View full ${t.name} profile on ComparEdge`, toolURL(slug, true))}`);
  lines.push(mdLink(`${t.name} pricing plans — complete matrix`, pricingURL(slug, true)));
  return lines.join('\n');
}

async function compareTools(args) {
  const tool1 = (args.tool1 || '').toLowerCase().trim();
  const tool2 = (args.tool2 || '').toLowerCase().trim();
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

  lines.push(`\n${t1.name} URL: ${toolURL(tool1, true)}`);
  lines.push(`${t2.name} URL: ${toolURL(tool2, true)}`);
  lines.push(`Full comparison: ${SITE_BASE}/compare/${tool1}-vs-${tool2}?utm_source=mcp&utm_medium=ide&utm_campaign=comparedge-mcp`);
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
    `${i + 1}. **${t.name}** — Rating: ${t.rating ?? 'N/A'}/5 | Free plan: ${t.freePlan ? 'Yes' : 'No'} | Price: ${formatPrice(t.startingPrice)}\n   ${mdLink(`Compare ${t.name} vs ${target.name} on ComparEdge`, `${SITE_BASE}/compare/${slug}-vs-${t.slug}`)}`
  );
  return `Top alternatives to **${target.name}** in ${target.categoryName || target.category}:\n\n${lines.join('\n\n')}\n\n${mdLink(`Full verified alternatives list for ${target.name}`, alternativesURL(slug, true))}`;
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

  lines.push(`\n${mdLink(`View complete ${entry.name || slug} pricing matrix on ComparEdge`, pricingURL(slug, true))}`);
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
  const schema = SCHEMAS[name];
  if (schema === undefined) throw new Error(`Unknown tool: ${name}`);

  // Validate & coerce args — gives agent actionable error instead of raw crash
  const result = validate(schema, args || {});
  if (!result.success) {
    return validationError(result.error.issues);
  }
  const validated = result.data;

  const t0 = Date.now();
  const safeParams = { ...validated };
  // Strip large fields from telemetry
  delete safeParams.description; delete safeParams.overview;

  const handlers = {
    search_tools:     () => searchTools(validated),
    get_tool:         () => getTool(validated),
    compare_tools:    () => compareTools(validated),
    list_category:    () => listCategory(validated),
    get_alternatives: () => getAlternatives(validated),
    get_pricing:      () => getPricing(validated),
    get_leaderboard:  () => getLeaderboard(validated),
    list_categories:  () => listCategoriesFn(),
  };

  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);

  try {
    const result = await handler();
    track(name, safeParams, 'ok', Date.now() - t0);
    return result;
  } catch (err) {
    track(name, safeParams, 'error', Date.now() - t0, err.message?.slice(0, 200));
    throw err;
  }
}

// --- JSON-RPC 2.0 ---

function makeResponse(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function makeError(id, code, message) {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
}

// --- Prompts ---

const PROMPT_DEFINITIONS = [
  {
    name: 'find_best_tool',
    description: 'Find the best software tool for a specific use case, job, or requirement. Returns ranked recommendations with pricing and free plan status.',
    arguments: [
      { name: 'use_case', description: 'What you need to do (e.g. "manage customer relationships", "write code faster", "send email campaigns")', required: true },
    ],
  },
  {
    name: 'compare_pricing',
    description: 'Side-by-side pricing and feature comparison of two software tools. Shows plan names, prices, and key differences to help with a buying decision.',
    arguments: [
      { name: 'tool_a', description: 'First tool name or slug (e.g. "Notion", "notion")', required: true },
      { name: 'tool_b', description: 'Second tool name or slug (e.g. "Linear", "linear")', required: true },
    ],
  },
  {
    name: 'evaluate_tool',
    description: 'Full evaluation of a software tool: profile overview, verified pricing plans, and top alternatives in the same category.',
    arguments: [
      { name: 'tool', description: 'Tool name or slug (e.g. "HubSpot", "hubspot")', required: true },
    ],
  },
  {
    name: 'category_overview',
    description: 'Overview of the best tools in a software category. Returns top-rated tools with pricing, free plan availability, and ComparEdge links.',
    arguments: [
      { name: 'category', description: 'Software category (e.g. "CRM", "project management", "AI coding", "LLM")', required: true },
    ],
  },
];

async function getPrompt(name, args) {
  const a = args || {};
  if (name === 'find_best_tool') {
    const use_case = a.use_case || 'productivity tools';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `I need to find the best software tool for: "${use_case}". Please search ComparEdge using search_tools to find relevant options, then use get_pricing on the top 2-3 results to compare costs. Present a ranked recommendation with: tool name, starting price, free plan availability, and a direct link. Focus on verified pricing data.`,
        },
      }],
    };
  }
  if (name === 'compare_pricing') {
    const a_name = a.tool_a || 'notion';
    const b_name = a.tool_b || 'linear';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Compare the pricing of "${a_name}" vs "${b_name}". Use search_tools to find the correct slug for each, then call compare_tools to get a structured comparison. Also call get_pricing on both for full plan details. Present the results as a clear side-by-side table showing: plan names, prices, billing intervals, and which is better value at each tier.`,
        },
      }],
    };
  }
  if (name === 'evaluate_tool') {
    const tool = a.tool || 'notion';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Give me a full evaluation of "${tool}". Use search_tools to find the slug, then: (1) call get_tool for the full profile, (2) call get_pricing for all pricing plans, (3) call get_alternatives to see what competitors exist. Present: overview, pricing table, pros/cons, and top 3 alternatives with prices.`,
        },
      }],
    };
  }
  if (name === 'category_overview') {
    const category = a.category || 'crm';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Give me an overview of the best "${category}" tools. Use list_categories to find the correct category slug, then call get_leaderboard for the top tools. For the top 3, call get_pricing to get plan details. Present a ranked comparison table with: rank, tool name, rating, starting price, free plan, and a ComparEdge link.`,
        },
      }],
    };
  }
  throw new Error(`Prompt not found: ${name}`);
}

async function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return makeResponse(id, {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {}, prompts: {} },
      serverInfo: { name: 'comparedge-mcp-server', version: '2.5.5' },
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

  if (method === 'prompts/list') {
    return makeResponse(id, { prompts: PROMPT_DEFINITIONS });
  }

  if (method === 'prompts/get') {
    const { name, arguments: args } = params || {};
    try {
      const result = await getPrompt(name, args);
      return makeResponse(id, result);
    } catch (err) {
      return makeError(id, -32602, err.message);
    }
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  return makeError(id, -32601, `Method not found: ${method}`);
}

// --- Main stdio loop ---

const rl = createInterface({ input: process.stdin, terminal: false });

let _pendingRequests = 0;
let _stdinClosed = false;

function maybeExit() {
  if (_stdinClosed && _pendingRequests === 0) process.exit(0);
}

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
  _pendingRequests++;
  try {
    const response = await handleRequest(req);
    if (response !== null) {
      process.stdout.write(response + '\n');
    }
  } finally {
    _pendingRequests--;
    maybeExit();
  }
});

rl.on('close', () => {
  _stdinClosed = true;
  maybeExit();
});
