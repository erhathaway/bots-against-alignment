# Bots Against Alignment — Agent Guide (AGENTS.md)

This repo is a turn-based multiplayer web game where players create “bots” and a shared “aligner” prompt. Each turn, an LLM (or a mock) judges which bot response best matches the aligner’s instruction.

## Before you start

- Read `README.md` for local run commands and hardcoded ports.
- If working in a subproject, also skim `frontend/README.md` and `backend/README.md`.

## Architecture

- Frontend: SvelteKit (Svelte 3 + Vite) in `frontend/`
- Backend: FastAPI in `backend/`
- Realtime chat: GunJS peer (default production peer is `https://bots-against-alignment.herokuapp.com/gun`)
  - The frontend peer is configurable via `VITE_GUN_PEER` (see `frontend/src/lib/chat_manager.ts`).

For a diagram, see `boa-devops-arch.png`.

## Repo map (high-signal)

### Frontend (`frontend/`)

- `frontend/src/routes/+page.svelte` — home (join vs new game)
- `frontend/src/routes/game/+page.js` — game loader (create/validate game)
- `frontend/src/routes/game/*.svelte` — game screens + gameplay flow
- `frontend/src/lib/store.ts` — persisted client state (localStorage)
- `frontend/src/lib/chat_manager.ts`, `frontend/src/lib/chat_game.ts` — Gun chat client
- `frontend/scripts/gun-relay.js` — local Gun relay (used by E2E + root dev)

### Backend (`backend/`)

- `backend/src/__init__.py` — FastAPI app + routes
- `backend/src/game.py` — game state
- `backend/src/game_state.py` — global in-memory registry
- `backend/src/data.py` — prompt pools / random generation helpers

## Running locally

Ports are hardcoded by the root dev scripts:

- Gun relay: `http://127.0.0.1:8765/gun`
- Backend API: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

The dev scripts will attempt to free ports first (SIGTERM with a short timeout, then SIGKILL).

### Install deps (first time)

```bash
cd backend
poetry install

cd ../frontend
npm install
```

### Run everything (Gun + backend + frontend)

```bash
npm run dev
```

Then open `http://127.0.0.1:5173/`.

### Run separately

```bash
npm run dev:gun
npm run dev:backend
npm run dev:frontend
```

## Environment variables

### Backend (`backend/.env` or shell env)

- `OPENAI_API_KEY` — optional (if absent, the backend will use mock behavior)
- `MOCK_LLM=1` — force mock LLM responses (useful for local dev/tests)

### Frontend (`frontend/.env` or shell env)

- `VITE_BACKEND_API` — backend base URL (e.g. `http://127.0.0.1:8000`)
- `VITE_GUN_PEER` — Gun relay URL (e.g. `http://127.0.0.1:8765/gun`)
- `VITE_ENABLE_VERCEL_ANALYTICS=false` — disables analytics injection locally

## Backend API (high level)

All routes are in `backend/src/__init__.py`.

- Game lifecycle: `POST /game`, `GET /game/{game_id}`, `POST /join_game`, `POST /start`
- Turn flow: `GET /turn`, `POST /alignment`, `POST /completeturn`, `GET /turn_finale`, `POST /process/turn`
- Misc: `GET /health_check`, `GET /api/image_and_text`

Note: games are in-memory (backend restart wipes games).

## Tests

- Frontend E2E (real UI + real dev servers): `cd frontend && npm test`
  - Uses `frontend/scripts/e2e-server.sh` (starts backend with `MOCK_LLM=1`, starts a local Gun relay, then runs `vite preview`).

## Agent operating rules (repo-wide)

- Fail loudly. Prefer explicit errors over silent fallbacks that mask broken state.
- Ask clarifying questions when requirements are ambiguous or risky (ports, env, deploy target, etc.).
- Keep diffs focused and easy to verify end-to-end.
- If you change an API contract, update backend + frontend together and add/adjust E2E coverage.
- Don’t introduce proxy/pass-through re-export files during refactors; update import sites.
- Do not commit secrets; use `.env` locally and hosted env vars in production.
- Never run git commands that alter repo state (`git commit`, `git reset`, `git clean`, etc.).
- Assume other work may be in progress; avoid overwriting changes you didn’t author.

## TypeScript discipline (frontend)

- Treat `cd frontend && npm run check` as the type/source-of-truth signal.
- Prefer explicit types over `any`; avoid type assertions/casts unless paired with runtime guards.
- If `npm run check` already has failures, do not introduce new ones.

## Quality gates (when touching code)

- Frontend (minimum): `cd frontend && npm test`
- Frontend (best): `cd frontend && npm run check && npm test`
- Backend (if tests are green): `cd backend && poetry run pytest -q`
- Backend (minimum): start `uvicorn` and verify `/health_check`
