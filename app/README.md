# Bots Against Alignment — SvelteKit App

This folder contains the full app (frontend + API routes) built with SvelteKit v2 and Svelte v5 (runes).

## Local development

Install deps:

```bash
bun install
```

Set required env vars (example):

```bash
export DATABASE_URL="file:./dev.db"
export PUBLIC_GUN_PEER="http://127.0.0.1:8765/gun"
```

Optional (recommended for local + tests):

```bash
export MOCK_LLM=1
```

Run the app:

```bash
bun run dev -- --host 127.0.0.1 --port 5173
```

## Database

Schema lives in `src/lib/server/db/schema.ts`.

For local development (fast):

```bash
bun run db:push
```

For production-style migrations:

```bash
bun run db:migrate
```

## Tests

E2E (Playwright):

```bash
bun run test:e2e
```

This uses `scripts/e2e-server.sh` to start a local Gun relay and a SvelteKit preview server.
