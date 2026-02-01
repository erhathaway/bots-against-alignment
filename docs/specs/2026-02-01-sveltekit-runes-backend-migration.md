# Bots Against Alignment — SvelteKit + Svelte 5 (Runes) Migration Spec

Status: **Draft**  
Date: **2026-02-01**  
Owners: (fill in)  
Reviewers: (fill in)  

## Executive summary

We will migrate the current production app from:

- `frontend/` (SvelteKit v1 + Svelte v3, legacy syntax) and
- `backend/` (FastAPI, in-memory game state)

…into a single, latest-generation SvelteKit app located at `app/`:

- SvelteKit v2 + Svelte v5, **runes syntax everywhere**
- All Python backend behavior reimplemented as **idiomatic SvelteKit server code** (`+server.ts`, `+page.server.ts`, server-only modules)
- Preserve existing component **visual design**; only adjust UI when broken or not responsive/adaptive
- Replace in-memory backend state with **durable persistence** appropriate for serverless deployments (Vercel), using the existing Drizzle + LibSQL scaffold in `app/`

The migration will be executed in phases with parity checks (E2E) and a safe cutover plan that keeps production usable throughout.

---

## Goals

### Product goals
- Preserve current gameplay flow and UI appearance (except responsive fixes / obvious bugs).
- Keep shareable game links working (existing `/game?game_id=...` format must continue to work).
- Maintain GunJS chat behavior (same peer configuration, same UX).

### Engineering goals
- Consolidate frontend + backend into `app/` using idiomatic SvelteKit patterns.
- Use **Svelte 5 runes mode in all `.svelte` and `.svelte.ts` modules** (no legacy Svelte 3/4 syntax).
- Remove Python/Render backend from the critical path; enable single-deploy architecture (ideally Vercel-only for the web app).
- Introduce durable storage for game state (serverless-safe), with migrations and local/dev parity.
- Improve type-safety and runtime validation for all server inputs.

## Non-goals
- Redesigning the game UI or changing art direction.
- Replacing GunJS chat with a different realtime system.
- Changing the core rules/scoring logic (unless we find a correctness bug).
- Adding accounts/authentication (unless required for rate limiting abuse control; see “Open questions”).

---

## Current system (inventory)

### Frontend (`frontend/`)
- SvelteKit v1 + Svelte v3
- Client-side page load (`ssr = false`) for `/game`
- Local state stored via `svelte-local-storage-store` in `frontend/src/lib/store.ts`
- Game state polling via `fetch()` calls to `VITE_BACKEND_API`
- GunJS chat via `VITE_GUN_PEER` (defaults to the Heroku peer)
- E2E harness starts local Gun relay + FastAPI + `vite preview`

### Backend (`backend/`)
- FastAPI with in-memory game registry (`backend/src/game_state.py`)
- Game endpoints primarily use query params (not JSON bodies)
- Rate limiting via `slowapi`
- LLM calls via Python OpenAI SDK; mock mode via `MOCK_LLM`
- Game state resets on server restart; production relies on a long-lived Render process

### Problems / constraints
- SvelteKit v1 + Svelte v3 is far behind current ecosystem.
- Cross-origin frontend→backend calls add complexity (CORS, envs, deploys).
- In-memory backend state blocks moving to serverless or autoscaling.
- No shared, versioned contract for API inputs/outputs.

---

## Target stack and version targets (as of 2026-02-01)

The `app/` project is the migration target. We will keep it on the latest stable versions and re-check before final cutover.

### Runtime
- Node.js: **v22.x (LTS)** (development and production)
- Bun: **latest stable** (repo currently pins `bun@1.1.34`; update as part of migration hardening)

### Core packages (npm registry “latest”)
- `svelte`: **5.49.1**
- `@sveltejs/kit`: **2.50.1**
- `vite`: **7.3.1**
- `@sveltejs/adapter-auto`: **7.0.0**
- `@sveltejs/adapter-vercel` (if we pin): **6.3.1**

### Server/DB/tooling (already scaffolded in `app/`)
- `drizzle-orm`: **0.45.1**
- `drizzle-kit`: **0.31.8**
- `@libsql/client`: (use latest compatible with drizzle-orm; currently present in `app/`)
- `ai` (Vercel AI SDK): **6.0.66**
- `@ai-sdk/openai`: **3.0.24**

---

## Target architecture

### Repository structure (end state)
- `app/` becomes the only web application (frontend + backend).
- `frontend/` and `backend/` are removed after cutover (kept during migration for parity + rollback).
- Root scripts (`bun run dev`) are updated to start:
  - local Gun relay (unchanged)
  - `app/` dev server

### Deployment model
Primary target: **Vercel** (keep current “SvelteKit app on Vercel” deployment).

Implications:
- No reliance on in-memory server state.
- All durable state in a remote DB (LibSQL/Turso or equivalent), plus optional cache/kv for rate limiting.

### Server responsibilities (SvelteKit)
Implement all backend behavior in `app/` via:
- **Route endpoints**: `src/routes/api/**/+server.ts`
- **Form actions** (where they map cleanly): `+page.server.ts`
- **Domain logic**: `src/lib/server/**` (server-only modules)
- **Shared types**: `src/lib/shared/**` (pure TS types and runtime schemas)

### Client responsibilities
Client components:
- Remain mostly unchanged in markup/CSS; migrate reactivity to runes.
- Stop calling `VITE_BACKEND_API`; call same-origin `/api/...` endpoints (or use actions + `invalidate()`).
- Continue using GunJS for chat (client-only).

### State model
We will replace ad-hoc localStorage state and backend in-memory state with a clear split:

**Server state (durable)**
- Game, players, bots, turns, responses, scores, status transitions
- Stored in LibSQL via Drizzle

**Client state (ephemeral / UX)**
- UI routing state (which “screen” the user is on)
- Local “draft” fields for bot/aligner prompts before submit
- “My identity” for a game (player id) stored in localStorage or cookie (see next)

Identity storage decision:
- Preferred: store a signed, HttpOnly cookie session for `player_id` scoped to a `game_id`
- Fallback for parity with today: localStorage (`player_id`, `game_id`) plus server validation

---

## API and route design

### Compatibility principle
We will preserve link compatibility and gameplay behavior. Internally, we can change API shapes, but we will:
- keep `/game?game_id=...` working (either as the primary route or as a redirect)
- keep server error semantics predictable (typed error payloads, stable status codes)

### Proposed SvelteKit API surface (new)
All game endpoints live under `app/src/routes/api/game/**`.

Example structure:

- `POST /api/game` → create game
- `POST /api/game/{gameId}/join` → join game
- `POST /api/game/{gameId}/start` → start game (creator only)
- `POST /api/game/{gameId}/turn/ensure` → ensure turn is created (idempotent)
- `GET /api/game/{gameId}/status` → game + bots summary
- `GET /api/game/{gameId}/me` → my points/prompts remaining
- `POST /api/game/{gameId}/turn/{turnId}/submit` → submit bot prompt/suggestion + mark complete
- `POST /api/game/{gameId}/turn/{turnId}/process` → pick winner (creator only)
- `GET /api/game/{gameId}/turn/{turnId}/finale` → bots submitted / totals
- `POST /api/game/{gameId}/random/bot-name`
- `POST /api/game/{gameId}/random/bot-prompt`
- `POST /api/game/{gameId}/random/aligner-prompt`

Notes:
- Prefer JSON bodies for `POST` requests.
- Prefer route params over query params.
- Make mutation endpoints **idempotent** where possible (important for retries in serverless).

### FastAPI → SvelteKit mapping (parity checklist)
We will implement equivalently named behavior, even if route names differ:

| FastAPI route | Purpose | SvelteKit replacement |
|---|---|---|
| `POST /game` | create game | `POST /api/game` |
| `GET /game/{game_id}` | validate game exists | `GET /api/game/{gameId}` (or folded into `/status`) |
| `POST /join_game` | join, create user | `POST /api/game/{gameId}/join` |
| `POST /start` | start game, add bots | `POST /api/game/{gameId}/start` |
| `GET /turn` | read/seed turn prompt | `POST /api/game/{gameId}/turn/ensure` + `GET /status` |
| `POST /alignment` | generate response for player | included in `POST /turn/{turnId}/submit` |
| `POST /completeturn` | mark player complete | included in `POST /turn/{turnId}/submit` |
| `GET /turn_finale` | count completions | `GET /api/game/{gameId}/turn/{turnId}/finale` |
| `POST /process/turn` | choose winner, score | `POST /api/game/{gameId}/turn/{turnId}/process` |
| `GET /game_status` | status + bots list | `GET /api/game/{gameId}/status` |
| `GET /user_status` | points + prompts remaining | `GET /api/game/{gameId}/me` |
| `GET /randomize_*` | LLM random suggestions | `POST /api/game/{gameId}/random/*` |
| `GET /api/image_and_text` | finale text | `GET /api/misc/image-and-text` (or inline client) |

---

## Database design (Drizzle + LibSQL)

### Why a DB?
Moving backend logic into SvelteKit on Vercel requires state to survive:
- cold starts
- multi-instance deployments
- retries/duplicate requests

Therefore, all game state must be persisted.

### Schema proposal (v1)

**games**
- `id` (uuid text, pk)
- `creator_id` (uuid text)
- `status` (`LOBBY` | `STARTED` | `ENDED`)
- `points_to_win` (int, default 10)
- `aligner_type` (text enum)
- `max_auto_players` (int, default 0)
- `turn_id` (int, default 1)
- `turn_started` (bool/int)
- `turn_prompt` (text nullable)
- `aligner_prompt_full` (text) — concatenated from submitted aligner prompts
- `created_at`, `updated_at` (int timestamps)

**players**
- `id` (uuid text, pk) — corresponds to current `user_id`
- `game_id` (fk → games.id)
- `bot_name` (text)
- `bot_prompt` (text)
- `submitted_bot_prompt` (text) — last submitted
- `prompts_remaining` (int)
- `score` (int)
- `is_auto` (bool/int)
- `turn_complete` (bool/int)
- `created_at`, `updated_at`

**aligner_prompts**
- `game_id` (fk)
- `player_id` (fk)
- `prompt` (text)
- unique `(game_id, player_id)`

**turns**
- `(game_id, turn_id)` (composite pk)
- `prompt` (text)
- `status` (`OPEN` | `PROCESSED`)
- `winner_player_id` (nullable fk)
- `processed_at`

**turn_responses**
- `game_id` (fk)
- `turn_id` (fk)
- `player_id` (fk)
- `response_text` (text)
- unique `(game_id, turn_id, player_id)`

### Concurrency + idempotency
Key operations must be transactionally safe:
- “ensure turn prompt exists” should atomically set `turn_started=true` and assign a prompt once.
- “submit response” should be safe to retry without duplicating.
- “process turn” must ensure all players complete and that a turn is processed only once.

Implementation approach:
- Use Drizzle transactions where supported by LibSQL.
- Use conditional updates (`WHERE status = 'OPEN'`) and check affected row counts.

---

## LLM integration (AI SDK + OpenAI) and mock mode

### Requirements
- Keep OpenAI API key server-side only.
- Maintain `MOCK_LLM=1` behavior for local dev and tests.
- Make model selection configurable and future-proof.
- Ensure timeouts and retries are safe in serverless.

### Proposed design
Create `src/lib/server/llm/`:
- `provider.ts`: AI SDK OpenAI provider wiring
- `bot.ts`: `generateBotResponse({ botPrompt, turnPrompt, extraContext })` (AI SDK `generateText`)
- `aligner.ts`: `pickWinner({ alignerPrompt, turnPrompt, responsesByPlayer })` (AI SDK `generateText` or `generateObject` for structured output)
- `mock.ts`: deterministic mocks (hash-based), plus “always pick first option” for aligner parity

Config via env:
- `OPENAI_API_KEY` (required in production)
- `OPENAI_MODEL_BOT` (default: `gpt-5.2-nano`)
- `OPENAI_MODEL_ALIGNER` (default: `gpt-5.2-nano`)
- `MOCK_LLM` (boolean)

### Rate limiting
LLM-triggering endpoints must be protected.
Recommended (serverless-safe) approach:
- Use Upstash Redis / Vercel KV counters keyed by `(ip, route)` with fixed windows
- Return `429` with a stable error shape

---

## Svelte 5 runes migration guidelines

### Rules (hard requirements)
- No `export let`, no `$:` reactive statements, no legacy stores-in-template auto-subscription.
- Use:
  - `$props()` for props and children snippets
  - `$state()` for local state
  - `$derived()` for derived values
  - `$effect()` for side effects
  - event attributes (`onclick=...`) instead of `on:click=...` where possible
  - snippets (`{@render ...}`) instead of slots (where applicable outside of SvelteKit conventions)

### Strategy
1. Copy components from `frontend/` into `app/` preserving markup/CSS.
2. Run `sv migrate svelte-5` on the copied files when it provides safe mechanical transforms.
3. Manually review each component for:
   - correct reactivity conversion
   - removal of store auto-subscriptions (replace with explicit state modules)
   - SSR/client-only behavior
4. Keep a strict “visual parity first” rule; only change layout CSS when non-adaptive/broken.

### Shared state in a runes world
Replace `svelte-local-storage-store` with a runes-first state module:
- `src/lib/state/global.svelte.ts` exporting a `$state` object
- add a persistence adapter that hydrates from localStorage on the client and writes on change
- gate localStorage usage behind `browser` checks

This keeps “globalStore” semantics while meeting the “runes everywhere” requirement.

---

## Migration plan (phased)

### Phase 0 — Baseline and scaffolding
- Confirm `app/` builds, tests, and deploys on Vercel in isolation.
- Decide DB provider (Turso/LibSQL recommended given scaffold).
- Establish required env vars in Vercel + local `.env` templates.
- Add CI checks for `app/` (typecheck, unit, E2E).

Deliverable: `app/` is a healthy SvelteKit 2 + Svelte 5 project with DB connectivity.

### Phase 1 — Route and UI parity (no backend changes yet)
- Port the following routes into `app/src/routes`:
  - `/` (home)
  - `/rules`
  - `/game` (shell + UI screens)
- Port shared components and assets from `frontend/src/lib/**`.
- Convert all Svelte files to runes syntax.
- Keep network calls pointing at the existing FastAPI backend initially (to reduce moving parts).

Deliverable: `app/` UI matches current `frontend/` UI and functions against the existing backend.

### Phase 2 — Domain layer port (Python → TypeScript)
- Reimplement game engine logic from `backend/src/game.py` in `app/src/lib/server/game/`.
- Port prompt pools from `backend/src/data.py` into TS modules (or JSON).
- Implement persistence with the DB schema proposed above.
- Implement LLM and mock behaviors in Node (match current semantics and limits, e.g. 281-char prompt truncation).

Deliverable: Game logic can be exercised via unit tests without the UI.

### Phase 3 — SvelteKit API implementation + client cutover
- Implement `/api/game/**` endpoints to match FastAPI behavior.
- Update `app/` UI to call same-origin endpoints.
- Remove CORS and `VITE_BACKEND_API` dependency from the migrated UI.

Deliverable: `app/` runs end-to-end with no Python backend.

### Phase 4 — Testing parity
- Port and/or rewrite Playwright E2E tests to target `app/`.
- Ensure `MOCK_LLM=1` provides deterministic gameplay in CI.
- Add unit tests for game engine + DB repository.

#### Concrete E2E plan (recommended)
Current E2E lives in `frontend/tests/*.test.ts` and relies on `frontend/scripts/e2e-server.sh` to start:
- Gun relay (local)
- FastAPI (local)
- SvelteKit preview server

End state E2E should start:
- Gun relay (local; unchanged)
- SvelteKit preview server for `app/`
- **No Python**

Implementation tasks:
- Create `app/scripts/e2e-server.sh` that:
  - sets `MOCK_LLM=1`
  - sets `PUBLIC_GUN_PEER=http://127.0.0.1:8765/gun`
  - sets `PUBLIC_E2E=1` (replaces `VITE_E2E`) so the UI doesn’t auto-randomize inputs
  - sets `DATABASE_URL=file:${TMPDIR}/boa-e2e.db` (per-run ephemeral DB)
  - runs `bun run db:migrate` (or `db:push`) against the temp DB
  - runs `bun run build` then `bun run preview -- --host 127.0.0.1 --port 4173`
- Update `app/playwright.config.ts` to use the script above, plus the same “system Chrome on macOS” safeguard used in `frontend/playwright.config.ts` (optional but recommended).
- Move tests:
  - `frontend/tests/game-flow.test.ts` → `app/e2e/game-flow.test.ts`
  - `frontend/tests/gun-chat.test.ts` → `app/e2e/gun-chat.test.ts`
- Update assertions that currently look for requests to `127.0.0.1:8000` to instead assert calls to the new same-origin routes (e.g. `/api/game/...`).

Deliverable: Green `app/` checks locally and in CI; regression coverage exists.

### Phase 5 — Production cutover and cleanup
- Deploy `app/` to production (Vercel) behind a staged rollout (preview → canary → full).
- Monitor error rates, latency, and LLM spend.
- Decommission Render FastAPI service after stable period.
- Remove `frontend/` and `backend/` from repo; update root scripts + README.

Deliverable: Single-app deployment, simplified infra, modern Svelte codebase.

---

## Rollout, monitoring, and rollback

### Rollout plan
- Use Vercel Preview deployments for each phase.
- For production cutover:
  - Keep old backend live for at least one release cycle
  - Add a feature flag or env toggle to switch between old backend and new `/api` routes (until stable)

### Monitoring
- Add structured logging for:
  - game lifecycle operations
  - LLM calls (model, duration, status; no prompts in logs by default)
  - DB query failures and transaction retries
- Add basic request IDs (correlate client errors to server logs).

### Rollback plan
- Keep the old `frontend/` deploy and backend service available.
- If critical issues appear post-cutover:
  - revert traffic to old frontend/backends via Vercel rollback
  - keep DB migrations forward-only; avoid destructive migrations until stable

---

## Acceptance criteria

### Functional
- Users can create and join games; lobby/start works.
- Turn flow works end-to-end: prompt → submit → process → score increments → game ends.
- Auto-player filling (bots) works when <4 users join (same behavior as today).
- Chat works with configured peer; local relay works for dev/E2E.
- `/game?game_id=...` links still work.

### Non-functional
- All `.svelte` and `.svelte.ts` files in `app/` use runes syntax (no legacy mode).
- No secrets shipped to the browser (OpenAI key stays server-side).
- LLM calls use AI SDK, defaulting to `gpt-5.2-nano` (configurable via env).
- DB migrations are repeatable; local dev has a documented DB story.
- E2E tests cover core flows; `MOCK_LLM=1` makes them deterministic.
- UI is at least as responsive as current; fix obvious non-adaptive layouts (e.g. split-screen on small viewports).

---

## Open questions
- Should player identity be cookie-based sessions (recommended) or localStorage (parity)?
- Do we need an abuse-control mechanism beyond rate limiting (CAPTCHA, login)?
- Should we maintain backward-compatible endpoints for any external clients (unlikely)?
- Do we keep the GunJS peer on Heroku, or move it (Heroku changes and cost)?
- Which DB provider is the final choice (Turso vs something else) and what are the operational constraints?
