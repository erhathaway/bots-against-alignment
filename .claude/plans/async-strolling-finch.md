# Remove Legacy Directories & Update All References

## Overview

Remove `frontend/` and `backend/` directories (legacy, replaced by `app/`). Update all documentation and config files to reflect the unified `app/` structure. E2E tests in `app/` are already self-contained and require no changes.

---

## Step 1 — Delete legacy directories

```bash
rm -rf frontend/ backend/
```

## Step 2 — Delete obsolete CI/CD and deployment files

- **Delete `.github/workflows/api.yml`** — FastAPI CI workflow that references `backend/`
- **Delete `render.yml`** (root) — FastAPI deployment config for Render

## Step 3 — Update `.gitignore`

Remove the `frontend/radata/` line (directory no longer exists).

## Step 4 — Rewrite `AGENTS.md`

Complete rewrite to describe the current `app/` architecture. Key sections:

- **Architecture**: SvelteKit v2 + Svelte 5 (runes) monolith in `app/`, SQLite via Drizzle ORM, GunJS chat
- **Repo map**: `app/src/routes/` (pages + API), `app/src/lib/server/` (game service, LLM, DB), `app/src/lib/` (client state, chat, types), `app/scripts/` (gun relay, E2E server)
- **Running locally**: `bun run dev`, `bun run dev:gun`, `bun run dev:app` (matching root `package.json`)
- **Install deps**: `cd app && bun install`
- **Env vars**: Server-side (`DATABASE_URL`, `OPENAI_API_KEY`, `MOCK_LLM`) + Client-side (`PUBLIC_GUN_PEER`, `PUBLIC_E2E`)
- **API routes**: SvelteKit server routes in `app/src/routes/api/game/`
- **Tests**: `cd app && bun run test` (unit + E2E), `cd app && bun run check` (typecheck)
- **Quality gates**: `cd app && bun run check && bun run test`
- Keep: agent operating rules, refactor guidelines, TypeScript discipline, Playwright guidelines, documentation discipline (all still relevant, just update paths)

## Step 5 — Sync `CLAUDE.md`

Copy `AGENTS.md` content to `CLAUDE.md` (per the sync requirement in the header).

## Step 6 — Remove architecture diagram reference

`boa-devops-arch.png` depicts the old frontend+backend split. Remove the reference from AGENTS.md. (Keep the image file for historical reference unless user wants it deleted.)

---

## Files modified

| File | Action |
|------|--------|
| `frontend/` | Delete entire directory |
| `backend/` | Delete entire directory |
| `.github/workflows/api.yml` | Delete |
| `render.yml` | Delete |
| `.gitignore` | Remove `frontend/radata/` line |
| `AGENTS.md` | Complete rewrite for `app/` |
| `CLAUDE.md` | Sync with AGENTS.md |

## Files NOT modified (already correct)

- `README.md` — already references `app/`, no frontend/backend mentions
- `RULES.md` — pure gameplay rules, no technical references
- `package.json` (root) — already references `app/`, no legacy scripts
- `scripts/dev-all.ts` — already references `app/`
- `app/**` — all self-contained, no references to legacy dirs

## Verification

1. `cd app && bun run check` — typecheck still passes
2. `cd app && bun run test` — all tests still pass (E2E + unit)
3. `grep -r "frontend/" . --include="*.md" --include="*.ts" --include="*.json" --include="*.yml" --include="*.yaml"` — no stale references remain
4. `grep -r "backend/" . --include="*.md" --include="*.ts" --include="*.json" --include="*.yml" --include="*.yaml"` — no stale references remain
