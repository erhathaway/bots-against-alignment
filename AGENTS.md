
> **CRITICAL: After making ANY changes to this file (AGENTS.md), you MUST immediately copy it and replace CLAUDE.md with the updated content. CLAUDE.md is the source file for Claude Code and must stay in sync with AGENTS.md at all times.**

> **CRITICAL: When designing new components or updating UI make sure the style matches:**
"""
Minimalist ritual-console UI design system with selective yellow highlights, stark black and white interface dominated by white negative space, thick black rounded outlines, precise geometric UI components, muted warm yellow used sparingly for focus states, active indicators, selection rings, and system status accents, calm ceremonial mood, software that feels like an instrument or protocol terminal, deliberate modern sans-serif typography, buttons and inputs framed like physical modules, alignment and initiation metaphors, empty states emphasizing silence and readiness, high-contrast ethical console aesthetic, subtle shadows and depth, modern web UI screens for configuration, onboarding, and system control, authoritative but minimal visual language

Futuristic ritual-console UI design system with luminous yellow highlights, stark black and white interface with expansive white negative space, thick black rounded outlines framing components, high-tech yellow accents used as glow lines, signal traces, focus rings, and activation markers, subtle neon yellow illumination suggesting energy and intent, calm but authoritative mood, software that feels like a control instrument or alignment terminal, modern restrained sans-serif typography, UI components arranged like modular hardware panels, buttons and inputs resembling calibrated devices, alignment and initiation metaphors, empty states that feel charged rather than blank, ethical sci-fi console aesthetic, soft shadows, precise spacing, modern web UI screens for configuration, onboarding, and system orchestration
"""

# Bots Against Alignment — Agent Guide (AGENTS.md)

This repo is a turn-based multiplayer web game where players create "bots" and a shared "aligner" prompt. Each turn, an LLM (or a mock) judges which bot response best matches the aligner's instruction.

For full game rules (setup, turn flow, scoring, winning conditions), see [`RULES.md`](RULES.md).

## Before you start

- Read `README.md` for local run commands and hardcoded ports.
- Prefer the root `bun` scripts for local dev (`bun run dev`, `bun run dev:*`) so ports/env stay consistent.

## Architecture

- **Full-stack app**: SvelteKit v2 + Svelte 5 (runes) in `app/`
- **Database**: SQLite via LibSQL + Drizzle ORM (single `dev.db` file for local development)
- **LLM**: Vercel AI SDK (`@ai-sdk/openai`), with mock mode via `MOCK_LLM=1`
- **Message-Driven Game Flow**: Dual-channel message queue system (stored in SQLite `gameMessages` table)
  - **Instant Channel**: Player joins/leaves, countdown starts, chat messages - published immediately
  - **Buffered Channel**: Bot responses (5s), aligner deliberation (2s), round winner (7s), standings (5s), game over (10s) - queued with time windows for dramatic pacing
  - Messages carry metadata that triggers game state changes, creating a declarative event-driven architecture
  - Player messages sent via `POST /api/game/[gameId]/chat`, polled via `GET /api/game/[gameId]/chat?after=<id>` every 1.5s
  - Game events flow through `messageQueue.publish()` and are processed by `StateChangeProcessor`

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

**Message System:**
- `server/messages/types.ts` — Message types, channels (instant/buffered), state actions
- `server/messages/service.ts` — Message CRUD operations (insert, publish, query)
- `server/messages/queue.ts` — MessageQueue orchestrator & BufferedQueue for time-windowed messages
- `server/messages/processor.ts` — StateChangeProcessor handling all game state transitions
- `server/messages/index.ts` — Entry point with initialization

**Game Logic:**
- `server/game/service.ts` — Core game logic (create, join, start, turn management, scoring) - uses message queue
- `server/game/data.ts` — Random prompt generation and data pools

**Database:**
- `server/db/schema.ts` — Drizzle schema (games, players, turns, turnResponses, alignerPrompts, gameMessages)
- `server/db/index.ts` — Database connection (LibSQL)

**LLM:**
- `server/llm/aligner.ts` — Turn judging (picks winner via LLM, streams buffered deliberation messages)
- `server/llm/bot.ts` — Bot response generation
- `server/llm/config.ts` — Model selection and env var config
- `server/llm/mock.ts` — Mock LLM for dev/tests

**Utilities:**
- `server/errors.ts` — Error types (badRequest, forbidden, notFound)
- `server/rate-limit.ts` — Rate limiting

### Client state (`app/src/lib/`)

- `state/store.svelte.ts` — global game state (Svelte 5 `$state` rune, localStorage persisted)
- `types.ts` — TypeScript types (GlobalState, AlignmentResponse, Notification, etc.)
- `components/messages/MessageFeed.svelte` — Message rendering with `FeedMessage` type
  - `FeedMessage` type uses `content` field (not `message`) and new message types
  - Renders different components based on message `type` (e.g., `turn_started`, `bot_response`, `aligner_deliberation`)

### API routes (`app/src/routes/api/`)

Game lifecycle:
- `POST /api/game` — create new game
- `GET /api/game/[gameId]` — get game info
- `POST /api/game/[gameId]/join` — join game
- `POST /api/game/[gameId]/start` — start game
- `GET /api/game/[gameId]/status` — poll game status
- `GET /api/game/[gameId]/me` — get current player data

Messages (unified message system):
- `POST /api/game/[gameId]/chat` — send a chat message (publishes instant message)
- `GET /api/game/[gameId]/chat?after=<id>` — poll for new messages (alias for /messages)
- `GET /api/game/[gameId]/messages?after=<id>` — poll for published messages (incremental)

Turn flow:
- `POST /api/game/[gameId]/turn/ensure` — ensure current turn exists (publishes buffered turn_started message)
- `POST /api/game/[gameId]/turn/[turnId]/submit` — submit bot response (publishes buffered bot_response message)
- `POST /api/game/[gameId]/turn/[turnId]/process` — judge turn (triggers buffered aligner deliberation, winner, standings messages)
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

- `DATABASE_URL` — required, `file:dev.db` for local SQLite (uses single `dev.db` file for development)
- `OPENAI_API_KEY` — optional (required for real LLM calls)
- `MOCK_LLM=1` — force mock LLM responses (recommended for tests and local dev)

### Client-side (SvelteKit public, `app/.env`)

- `PUBLIC_E2E=1` — disables auto-randomization in E2E runs

## Message-Driven Game Flow

See `/docs/game-flow.md` for complete specification.

### Key Concepts

**Dual-Channel System:**
- **Instant messages**: Published immediately to database, clients see them on next poll
- **Buffered messages**: Queued with time windows (5s for bot responses, 2s for aligner, etc.)
  - While one buffered message is active (within its window), no other buffered messages publish
  - Instant messages can interrupt/interleave at any time
  - Creates dramatic pacing for turn results and aligner deliberation

**Message-Driven State:**
- Messages carry `metadata.stateChange` with an `action` and `payload`
- `StateChangeProcessor` processes these after messages are published
- Game state updates (turn creation, point awards, game end) happen via message metadata
- Declarative event-driven architecture: publish message → state changes automatically

### Message Types

Instant: `player_joined`, `player_left`, `countdown_started`, `game_started`, `aligner_prompt_submitted`, `chat`

Buffered: `turn_started` (5s), `bot_response` (5s), `aligner_deliberation` (2s), `round_winner` (7s), `standings` (5s), `game_over` (10s)

### Example Flow

```typescript
// User submits bot response → publish buffered message
await messageQueue.publish({
  gameId,
  channel: 'buffered',
  type: 'bot_response',
  senderName: 'Bot Response',
  content: JSON.stringify({ name, text }),
  bufferDuration: 5000,
  metadata: {
    stateChange: {
      action: 'submit_bot_response',
      payload: { playerId, turnId, responseText }
    }
  }
});

// After 5s: message published to DB, StateChangeProcessor runs
// → Updates player.turnComplete = true
// → Stores response in turnResponses
// → Checks if all players submitted
// → If yes, triggers turn judging
```

## Local dev gotchas

- Client state is persisted in localStorage (key `boa:state`); if the UI seems "stuck" between runs, clear site data/localStorage.
- Messages are stored in SQLite `gameMessages` table and persist between restarts.
- The `/game` route is client-only (`ssr = false` in `app/src/routes/game/+page.ts`), so debugging should focus on browser-side behavior.
- Games are stored in SQLite; **single `dev.db` file is used for all local development** (set via `DATABASE_URL=file:dev.db` in `app/.env`).
- If you need to reset the database, delete `dev.db` and run `bun run dev` to recreate it with migrations.
- All database schema changes must go through Drizzle migrations: `bunx drizzle-kit generate` then `bun run db:migrate`.

## Documentation discipline

- If you add or change env vars, ports, or local dev entrypoints, update `README.md`.
- If you change user-visible behavior (gameplay flow, message behavior, API contracts), update docs and tests so the change stays discoverable.
- Keep the agent guide focused on stable, repo-wide guidance (avoid personal TODO lists here).
- **Message system changes**: If modifying message types, channels, or buffer durations, update `/docs/game-flow.md` specification.

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

- Required: `cd app && bun run lint && bunx tsc --noEmit && bun run test:unit && bun run test:e2e`
- Shortcut: `cd app && bun run lint && bunx tsc --noEmit && bun run test` (runs unit tests then E2E)
