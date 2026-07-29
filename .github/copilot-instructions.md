# Copilot Instructions

This document contains important guidelines for AI assistants working on this project.

This repository is a fork of [discord-tickets/bot](https://github.com/discord-tickets/bot). It has diverged: SQLite support was removed, all async/scheduled work moved to Temporal, and the dashboard (formerly `discordtickets-portal`) is vendored in.

## Frontend Build Requirements

**CRITICAL**: After making ANY changes to Svelte components (`.svelte` files), you MUST build the frontend:

```bash
cd src/dashboard
npm run build
```

This includes changes to:
- UI pages (`src/dashboard/src/routes/**/*.svelte`)
- Components (`src/dashboard/src/components/**/*.svelte`)
- Layouts (`src/dashboard/src/routes/**/+layout.svelte`)
- CSS or styling changes

The frontend build compiles the SvelteKit application into production assets in `src/dashboard/build`, which **is committed to the repository** — the Dockerfile does not build the dashboard. Without building, changes made to `.svelte` files will not be reflected in the actual application.

Note that the dashboard has its own dependency tree (`src/dashboard/package-lock.json`), separate from the bot's own `package-lock.json`. Both use npm.

## Temporal Layer (TypeScript)

All async and scheduled work (stale tickets, auto-close, cron, transcript export/import) runs on Temporal. The code lives in `src/temporal/**/*.ts` and is the only TypeScript in the bot.

**CRITICAL**: After changing anything under `src/temporal/`, you MUST rebuild it:

```bash
npm run temporal.build      # tsc -> dist/temporal, then bundles the workflows
npm run temporal.typecheck  # type-check without emitting
```

- `dist/` is generated output — never edit it, never commit it (it is gitignored).
- `src/temporal/**` and `dist/**` are excluded from eslint (see `eslint.config.mjs`), so `npm run temporal.typecheck` is the only check covering them. Run it before considering a Temporal change done.
- Workflow code is deterministic and pre-bundled by `scripts/bundle-workflows.mjs`; side-effecting work belongs in activities (`src/temporal/activities/`), not workflows.
- The JS side talks to Temporal through `src/lib/temporal.js`; configuration and defaults are in `src/temporal/config.ts`.
- A Temporal cluster is **required** at runtime: `src/env.js` exits the process if `TEMPORAL_ADDRESS`/`TEMPORAL_PORT` are missing, and mTLS is on by default (`TEMPORAL_TLS_ENABLED` defaults to `true`).

## Database Migrations

SQLite is **not** supported. `DB_PROVIDER` must be `mysql` or `postgresql` (enforced in `src/env.js` and `scripts/postinstall.js`).

All database schema changes should:
1. Update both schema files in parallel:
   - `db/postgresql/schema.prisma`
   - `db/mysql/schema.prisma`

2. Create migration files for both database providers:
   - `db/postgresql/migrations/{timestamp}_description/migration.sql`
   - `db/mysql/migrations/{timestamp}_description/migration.sql`

Migrations run automatically at bot startup without manual intervention (`scripts/postinstall.js` copies `db/{provider}` to `prisma/` and runs `prisma migrate deploy`).

## Code Organization

- Entry point: `src/index.js`, client in `src/client.js`, HTTP server in `src/http.js`
- Environment validation: `src/env.js` (add new variables here)
- API endpoints: `src/routes/api/**/*.js`
- Frontend pages: `src/dashboard/src/routes/**/*.svelte`
- Components: `src/dashboard/src/components/**/*.svelte`
- Database schemas: `db/{mysql,postgresql}/schema.prisma`
- Utilities: `src/lib/**/*.js`
- Temporal workflows/activities: `src/temporal/**/*.ts` (compiled to `dist/temporal`)
- Localisations: `src/i18n/*.yml` (`en-GB` and `en-US` are the sources of truth)

## Testing

After making changes:
- `npm run lint` — eslint over `src` and `scripts` (JS only)
- `npm run temporal.typecheck` — if you touched `src/temporal/`
- `npm run test` — validates that every locale in `src/i18n/` matches the English keys; run it after changing any `.yml` there
- Test the functionality locally if possible
- Verify no console errors or warnings
- Check responsive design on mobile and desktop

## Git Workflow

- Keep commits focused and well-described
- Commits are linted with commitlint (conventional commits, config in `package.json`)
- Don't force-push to main without explicit user request
