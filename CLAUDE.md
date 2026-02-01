
> **CRITICAL: After making ANY changes to this file (AGENTS.md), you MUST immediately copy it and replace CLAUDE.md with the updated content. CLAUDE.md is the source file for Claude Code and must stay in sync with AGENTS.md at all times.**

# Bots Against Alignment — Agent Guide (AGENTS.md)

This repo is a turn-based multiplayer web game where players create "bots" and a shared "aligner" prompt. Each turn, an LLM (or a mock) judges which bot response best matches the aligner's instruction.

For full game rules (setup, turn flow, scoring, winning conditions), see [`RULES.md`](RULES.md).

## Before you start

- Read `README.md` for local run commands and hardcoded ports.
- Prefer the root `bun` scripts for local dev (`bun run dev`, `bun run dev:*`) so ports/env stay consistent.

## Architecture

- **Full-stack app**: SvelteKit v2 + Svelte 5 (runes) in `app/`
- **Database**: SQLite via LibSQL + Drizzle ORM
- **LLM**: Vercel AI SDK (`@ai-sdk/openai`), with mock mode via `MOCK_LLM=1`
- **Realtime chat**: GunJS peer (default production peer is `https://bots-against-alignment.herokuapp.com/gun`)
  - The peer URL is configurable via `PUBLIC_GUN_PEER` (see `app/src/lib/chat_manager.ts`).

## Repo map (high-signal)

### Pages (`app/src/routes/`)

- `src/routes/+page.svelte` — home (join vs new game)
- `src/routes/game/+page.svelte` — main game screen (client-only, SSR disabled)
- `src/routes/game/+page.ts` — game loader (create/validate game)
- `src/routes/game/PreGame.svelte` — bot name, bot prompt, aligner prompt setup
- `src/routes/game/Lobby.svelte` — waiting for players + start button
- `src/routes/game/AlignerSays.svelte` — turn gameplay (aligner prompt, bot prompt edit, submit)
- `src/routes/game/TurnFinale.svelte` — end-of-turn judging + results
- `src/routes/game/GameFinale.svelte` — game over / winner screen
- `src/routes/game/Chat.svelte` — realtime GunJS chat sidebar

### Server (`app/src/lib/server/`)

- `server/game/service.ts` — core game logic (create, join, start, turn management, scoring)
- `server/game/data.ts` — random prompt generation and data pools
- `server/db/schema.ts` — Drizzle schema (games, players, turns, turnResponses, alignerPrompts)
- `server/db/index.ts` — database connection (LibSQL)
- `server/llm/aligner.ts` — turn judging (picks winner via LLM)
- `server/llm/bot.ts` — bot response generation
- `server/llm/config.ts` — model selection and env var config
- `server/llm/mock.ts` — mock LLM for dev/tests
- `server/errors.ts` — error types (badRequest, forbidden, notFound)
- `server/rate-limit.ts` — rate limiting

### Client state (`app/src/lib/`)

- `state/store.svelte.ts` — global game state (Svelte 5 `$state` rune, localStorage persisted)
- `types.ts` — TypeScript types (GlobalState, AlignmentResponse, Notification, etc.)
- `chat_manager.ts` — GunJS peer manager (singleton)
- `chat_game.ts` — per-game chat instance

### API routes (`app/src/routes/api/`)

Game lifecycle:
- `POST /api/game` — create new game
- `GET /api/game/[gameId]` — get game info
- `POST /api/game/[gameId]/join` — join game
- `POST /api/game/[gameId]/start` — start game
- `GET /api/game/[gameId]/status` — poll game status
- `GET /api/game/[gameId]/me` — get current player data

Turn flow:
- `POST /api/game/[gameId]/turn/ensure` — ensure current turn exists
- `POST /api/game/[gameId]/turn/[turnId]/submit` — submit bot response
- `POST /api/game/[gameId]/turn/[turnId]/process` — judge turn (LLM picks winner)
- `GET /api/game/[gameId]/turn/[turnId]/finale` — get turn results

Random generators (UI suggestion buttons):
- `GET /api/game/[gameId]/random/bot-prompt`
- `GET /api/game/[gameId]/random/bot-name`
- `GET /api/game/[gameId]/random/aligner-prompt`

### Scripts (`app/scripts/`)

- `gun-relay.ts` — local GunJS relay (Bun WebSocket server, in-memory)
- `e2e-server.sh` — E2E test bootstrap (Gun relay + DB migrate + build + preview)

## Running locally

Ports are hardcoded by the root dev scripts:

- Gun relay: `http://127.0.0.1:8765/gun`
- SvelteKit app: `http://127.0.0.1:5173`

The dev scripts will attempt to free ports first (SIGTERM with a short timeout, then SIGKILL).

### Safety note (port freeing)

The `dev` scripts are intentionally aggressive: they will kill *any* process bound to the hardcoded ports.
Avoid running them on shared machines where those ports may be in use by unrelated services.

### Root dev scripts

- `bun run dev` — starts Gun relay + SvelteKit app together
- `bun run dev:gun` — starts only the local Gun relay (in-memory; restart to reset chat state)
- `bun run dev:app` — starts only the SvelteKit app (wired to local Gun relay)

### Install deps (first time)

```bash
cd app
bun install
```

### Run everything (Gun + SvelteKit app)

```bash
bun run dev
```

Then open `http://127.0.0.1:5173/`.

### Run separately

```bash
bun run dev:gun
bun run dev:app
```

## Environment variables

### Server-side (SvelteKit, `app/.env`)

- `DATABASE_URL` — required, e.g. `file:./dev.db` for local SQLite
- `OPENAI_API_KEY` — optional (required for real LLM calls)
- `MOCK_LLM=1` — force mock LLM responses (recommended for tests and local dev)

### Client-side (SvelteKit public, `app/.env`)

- `PUBLIC_GUN_PEER` — Gun relay URL (e.g. `http://127.0.0.1:8765/gun`)
- `PUBLIC_E2E=1` — disables auto-randomization in E2E runs

## Local dev gotchas

- Client state is persisted in localStorage (key `boa:state`); if the UI seems "stuck" between runs, clear site data/localStorage.
- The local Gun relay is in-memory; restarting it resets the chat graph.
- The `/game` route is client-only (`ssr = false` in `app/src/routes/game/+page.ts`), so debugging should focus on browser-side behavior.
- Games are stored in SQLite; the DB file persists between restarts (unlike the old in-memory backend).

## Documentation discipline

- If you add or change env vars, ports, or local dev entrypoints, update `README.md`.
- If you change user-visible behavior (gameplay flow, chat behavior, API contracts), update docs and tests so the change stays discoverable.
- Keep the agent guide focused on stable, repo-wide guidance (avoid personal TODO lists here).

## Tests

- All tests: `cd app && bun run test` (runs unit tests then E2E)
- Unit only: `cd app && bun run test:unit`
- E2E only: `cd app && bun run test:e2e`

### E2E harness notes

- If Playwright browsers aren't installed: `cd app && bunx playwright install chromium`
- The E2E server script (`app/scripts/e2e-server.sh`) starts:
  - A local Gun relay on port 8765
  - Runs DB migrations against a temp SQLite file
  - Builds the app and runs `vite preview` on port 4173
- E2E env vars:
  - `MOCK_LLM=1` (no OpenAI needed)
  - `PUBLIC_GUN_PEER=http://127.0.0.1:8765/gun` (local relay)
  - `PUBLIC_E2E=1` (disables random prefill; tests fill inputs explicitly)

### Playwright E2E guidelines (this repo)

- Tests use real servers (SvelteKit preview + Gun relay) and interact through the real UI.
- Avoid relying on randomized UI state; explicitly fill inputs in tests.
- Prefer deterministic waits (`expect(...).toBeVisible(...)`, `waitForResponse`) over arbitrary timeouts.
- When validating realtime behavior, use two browser contexts (creator + joiner) and assert state sync across both.

## Agent operating rules (repo-wide)

- Fail loudly. Prefer explicit errors over silent fallbacks that mask broken state.
- Ask clarifying questions when requirements are ambiguous or risky (ports, env, deploy target, etc.) — don't rely on unchecked assumptions.
- Keep diffs focused and easy to verify end-to-end.
- If you change an API contract, update server routes + client together and add/adjust E2E coverage.
- Don't introduce proxy/pass-through re-export files during refactors; update import sites.
- Do not commit secrets; use `.env` locally and hosted env vars in production.
- Never run git commands that alter repo state (`git commit`, `git reset`, `git clean`, etc.).
- Assume other work may be in progress; avoid overwriting changes you didn't author.
- Always add tests alongside behavior changes (prefer E2E for user-visible flows; unit tests where appropriate).
- Before calling work "done", run the relevant quality gates (tests/typecheck) or explicitly state what you did not run and why.
- Always leave the repo in a runnable state (or clearly explain what is broken and why).

## Refactor guidelines

- Don't introduce proxy/pass-through re-export files; update import sites instead.
- Keep refactors separate from behavior changes when possible (smaller reviewable diffs).

## TypeScript discipline

- Treat `cd app && bun run check` as the type/source-of-truth signal.
- Prefer explicit types over `any`; avoid type assertions/casts unless paired with runtime guards.
- Don't "fix" type errors by weakening types or casting away safety; fix the root cause and keep runtime checks aligned.
- When handling untrusted runtime data (API responses, Gun messages, `localStorage`), validate it (guards/tests) instead of relying on casts.
- If `bun run check` already has failures, do not introduce new ones.

## Quality gates (when touching code)

- Minimum: `cd app && bun run test`
- Best: `cd app && bun run check && bun run test`
