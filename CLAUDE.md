
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
- **Chat**: DB-backed with HTTP polling (stored in SQLite `chatMessages` table)
  - Player messages are sent via `POST /api/game/[gameId]/chat` and polled via `GET /api/game/[gameId]/chat?after=<id>` every 1.5s.
  - Game events (joins, turn starts, bot responses, judging results, standings, game over) are automatically posted as system/status messages from `server/game/service.ts`.

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
- `src/routes/game/Chat.svelte` — DB-backed chat sidebar (HTTP polling)

### Server (`app/src/lib/server/`)

- `server/game/service.ts` — core game logic (create, join, start, turn management, scoring)
- `server/game/data.ts` — random prompt generation and data pools
- `server/chat/service.ts` — chat message persistence (post + query)
- `server/db/schema.ts` — Drizzle schema (games, players, turns, turnResponses, alignerPrompts, chatMessages)
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

### API routes (`app/src/routes/api/`)

Game lifecycle:
- `POST /api/game` — create new game
- `GET /api/game/[gameId]` — get game info
- `POST /api/game/[gameId]/join` — join game
- `POST /api/game/[gameId]/start` — start game
- `GET /api/game/[gameId]/status` — poll game status
- `GET /api/game/[gameId]/me` — get current player data

Chat:
- `POST /api/game/[gameId]/chat` — send a chat message
- `GET /api/game/[gameId]/chat?after=<id>` — poll for new messages (incremental)

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

- `e2e-server.sh` — E2E test bootstrap (DB migrate + build + preview)

## Running locally

The SvelteKit app runs on `http://127.0.0.1:5173` (hardcoded by the root dev scripts).

The dev scripts will attempt to free the port first (SIGTERM with a short timeout, then SIGKILL).

### Safety note (port freeing)

The `dev` scripts are intentionally aggressive: they will kill *any* process bound to the hardcoded port.
Avoid running them on shared machines where that port may be in use by unrelated services.

### Root dev scripts

- `bun run dev` — starts the SvelteKit app (runs DB migrations first)
- `bun run dev:app` — starts only the SvelteKit app

### Install deps (first time)

```bash
cd app
bun install
```

### Run the app

```bash
bun run dev
```

Then open `http://127.0.0.1:5173/`.

## Environment variables

### Server-side (SvelteKit, `app/.env`)

- `DATABASE_URL` — required, e.g. `file:./dev.db` for local SQLite
- `OPENAI_API_KEY` — optional (required for real LLM calls)
- `MOCK_LLM=1` — force mock LLM responses (recommended for tests and local dev)

### Client-side (SvelteKit public, `app/.env`)

- `PUBLIC_E2E=1` — disables auto-randomization in E2E runs

## Local dev gotchas

- Client state is persisted in localStorage (key `boa:state`); if the UI seems "stuck" between runs, clear site data/localStorage.
- Chat messages are stored in SQLite alongside game data; they persist between restarts.
- The `/game` route is client-only (`ssr = false` in `app/src/routes/game/+page.ts`), so debugging should focus on browser-side behavior.
- Games are stored in SQLite; the DB file persists between restarts.

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
  - Runs DB migrations against a temp SQLite file
  - Builds the app and runs `vite preview` on port 4173
- E2E env vars:
  - `MOCK_LLM=1` (no OpenAI needed)
  - `PUBLIC_E2E=1` (disables random prefill; tests fill inputs explicitly)

### Playwright E2E guidelines (this repo)

- Tests use a real SvelteKit preview server and interact through the real UI.
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
- When handling untrusted runtime data (API responses, `localStorage`), validate it (guards/tests) instead of relying on casts.
- If `bun run check` already has failures, do not introduce new ones.

## Quality gates (when touching code)

- Minimum: `cd app && bun run test`
- Best: `cd app && bun run check && bun run test`
