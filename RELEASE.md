# Release checklist — @comparedge/mcp-server

Каналы НЕ подтягивают новую версию сами вовремя (официальный MCP Registry застревал на 2.1.7 полтора месяца). При каждом релизе прогнать вручную:

## 1. Bump + commit + tag
- Единый bump: `index.js` (шапка + `VERSION`), `package.json`, `server.json` (все вхождения), `glama.json`, README-бейдж. На сайте: `comparestack-remaster/src/lib/constants.js` → `MCP_VERSION` (тянут /mcp, /mcp/docs, /open-data, llms-full, админ-чип).
- `node --check index.js` + stdio-смоук (initialize → tools/list → пара tools/call).
- Commit автором imkemit-ops, `git tag vX.Y.Z`.

## 2. npm
`npm config set //registry.npmjs.org/:_authToken <comparedgecom token из TOOLS.md>` → `npm publish --access public`. Проверка: `npm view @comparedge/mcp-server version`.

## 3. GitHub
`git push origin main --tags`. ⚠️ Рабочий PAT для org-репо — из remote `comparestack-remaster` (не тот, что в TOOLS.md §GitHub, у него нет write в org comparedge).

## 4. Официальный MCP Registry (КРИТИЧНО — кормит GitHub MCP Registry, VS Code, Zed, Cursor)
Не подтягивается сам. Publisher CLI (github release modelcontextprotocol/registry, бинарь `mcp-publisher`):
```
mcp-publisher validate
mcp-publisher login github -token <PAT imkemit-ops>   # -token, НЕ device-flow; namespace io.github.imkemit-ops = владелец PAT
mcp-publisher publish
```
Проверка: `curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.imkemit-ops"` → isLatest на новой версии.

## 5. Smithery / Glama
Авто-рескан из npm/GitHub (~48ч). Форс — через их дашборд-deploy. Проверять появление версии; Smithery-скан бывает неполный (пустой description) — тогда передеплой по smithery.yaml.

## 6. Docker Hub (опц.)
Образ `ai-market-analyzer`. Требует docker CLI (локально нет) или CI. Не блокер для листингов.
