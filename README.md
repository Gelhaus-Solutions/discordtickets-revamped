# Discord Tickets (revamped)

> A fork of [discord-tickets/bot](https://github.com/discord-tickets/bot), with more features, and less bugs.

## Changes
A quick overview of what has changed:
- Thread mode, for unlimited tickets, and better overview.
- Forum mode, for creating tickets in a forum channel. (Used for public support, uncommon use-case)
- A feedback portal with all the feedback given by the users.
- Merged the UI (discordtickets-portal) into this repo for better overview, and easier changes.
- HTML Transcripts, alongside a central dashboard for all of them for admins.
- Auto-Assign feature. (The first to comment staff member will get assigned)
- Backup categories. (for the standard ticket method, channel)
- "Close with Reason" button.
- No "total limit" for Threads / Forum tickets.
- Bot appearance customization, per-server.
- All async and scheduled work (stale-ticket handling, auto-close, transcript export/import, cron) runs on [Temporal](https://temporal.io) instead of in-process timers.
- And much more!

## Requirements
- **Docker + Docker Compose.** Nothing else is supported (see the disclaimer below).
- **MySQL or PostgreSQL.** SQLite support has been removed — `DB_PROVIDER` must be `mysql` or `postgresql`.
- **A Temporal cluster.** This is **not optional**: the bot validates `TEMPORAL_ADDRESS` and `TEMPORAL_PORT` at startup and exits if they are missing. The provided [docker-compose.yml](docker-compose.yml) brings up a self-hosted Temporal server plus its own PostgreSQL and the Temporal Web UI.

## Here's how to use it:

### Disclaimer
**We do not support bare-metal, Pterodactyl, Pelican, or any other installation method, other than docker-compose.**
This repo is also **not** production ready, so we are not responsible for any damages.
Use at your own risk.

### New Instance
Use our [docker-compose.yml](https://github.com/Gelhaus-Solutions/discordtickets-revamped/blob/main/docker-compose.yml) to install a new instance with stable releases. Read it in full before deploying — it ships with insecure placeholder passwords and an insecure (plaintext) Temporal connection that are fine for local testing and **not** fine for production.

Image tags:

| Tag | Published by | Contents |
| --- | --- | --- |
| `:latest`, `:1`, `:1.4`, `:1.4.x` | [release-docker.yml](.github/workflows/release-docker.yml) on GitHub release | Stable releases |
| `:main` | [docker.yml](.github/workflows/docker.yml) on every push to `main` | Development builds |

### Old Instance
**Read [MIGRATING.md](MIGRATING.md) — it has the full procedure, including the SQLite path and how to recover a half-applied MySQL migration.**

The short version, for an existing MySQL or PostgreSQL install:

1. Take a backup of your bot volume **and** your database before touching anything. Note your existing `ENCRYPTION_KEY`.
2. Change your bot image in your `docker-compose.yml` to `ghcr.io/gelhaus-solutions/discordtickets-revamped:latest` (or `:main` for development builds).
3. **Add a Temporal cluster to your stack.** Copy the `temporal`, `temporal-postgresql` and `temporal-ui` services and the `temporal-postgresql` volume out of our [docker-compose.yml](docker-compose.yml) into yours, and add the `TEMPORAL_*` environment variables to your `bot` service (see the table below). Without these, the bot will refuse to start.
4. Set `ENCRYPTION_KEY` and `DB_PROVIDER` explicitly on the `bot` service.
5. Run `docker compose up -d`, then watch `docker compose logs -f bot` for the `[postinstall]` migration output and `Listening at …`.
6. Go into your dashboard to check that everything went right. If not, restore your backup and try again.

There is no script to run by hand — your database is migrated in place on startup.

> [!IMPORTANT]
> Set `ENCRYPTION_KEY` yourself. Ticket topics, close reasons, feedback comments and archived messages are encrypted with it, and it is not recoverable. The bot now refuses to start in a container when it is unset, rather than generating a throwaway key that would be different after every recreate.

> Database migrations run automatically at startup (`scripts/postinstall.js` runs `prisma migrate deploy`), for both MySQL and PostgreSQL. A failed migration now stops the boot instead of letting the bot run against a half-migrated schema.

## Environment variables

The bot-specific variables are documented upstream at <https://discordtickets.app/self-hosting/configuration/#environment-variables>. These are the ones this fork adds or changes — see [src/env.js](src/env.js) for the authoritative validation.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DB_PROVIDER` | yes | — | `mysql` or `postgresql`. SQLite is no longer supported. |
| `TEMPORAL_ADDRESS` | yes | — | Host/IP of the Temporal frontend. |
| `TEMPORAL_PORT` | yes | — | Temporal frontend port, usually `7233`. |
| `TEMPORAL_NAMESPACE` | no | `default` | |
| `TEMPORAL_TASK_QUEUE` | no | `discord-tickets` | |
| `TEMPORAL_DEPLOYMENT_NAME` | no | `discord-tickets` | Worker Deployment name used for versioning. |
| `TEMPORAL_TLS_ENABLED` | no | **`true`** | Defaults to on. Set to `false` for an insecure local/dev connection. |
| `TEMPORAL_TLS_CERT_PATH` | when TLS on | — | Client certificate (mTLS). |
| `TEMPORAL_TLS_KEY_PATH` | when TLS on | — | Client private key (mTLS). |
| `TEMPORAL_TLS_CA_PATH` | no | — | Server root CA, if it isn't publicly trusted. |
| `TEMPORAL_TLS_SERVER_NAME` | no | — | SNI override. |
| `TEMPORAL_WORKER_BUILD_ID` | no | injected git SHA | Identifies the worker build; set automatically by the Docker build. |
| `TEMPORAL_SET_CURRENT_ON_START` | no | `true` | Promote this build to the deployment's Current Version on startup. |
| `JWT_SECRET` | no | derived | If unset, the JWT signing key is derived from `ENCRYPTION_KEY` via HKDF and the bot logs a warning. **Upgrading from upstream invalidates existing dashboard sessions and service API keys**, because upstream signed with the raw `ENCRYPTION_KEY`. To keep them valid, set `JWT_SECRET` to your `ENCRYPTION_KEY` value. Otherwise users simply log in again and service keys must be reissued. |
| `SENTRY_DSN` | no | — | Enables Sentry. `SENTRY_LOGGING`, `SENTRY_SAMPLE_RATE` and `SENTRY_PROFILING_RATE` tune it. |
| `STATS_URL` | no | — | Houston-compatible endpoint for anonymous usage stats. Unlike upstream, **nothing is reported unless you set this** — it is not sent to `stats.discordtickets.app`. |

## Development

The bot itself is plain JavaScript (CommonJS) run by Node; the Temporal layer in [src/temporal/](src/temporal/) is TypeScript that has to be compiled before the bot will start. Dependencies are managed with [bun](https://bun.sh).

```sh
bun install                 # also runs scripts/preinstall + postinstall (writes .env, runs prisma)
bun run temporal.build      # compile src/temporal -> dist/temporal + bundle workflows
bun run temporal.typecheck  # type-check only
bun run lint                # eslint (JS only; src/temporal and dist are excluded)
bun run test                # validate the i18n files
node .                      # start the bot
```

`scripts/start.sh` (the Docker entrypoint) builds the Temporal layer automatically if `dist/temporal/index.js` is missing.

The dashboard is a separate SvelteKit app in [src/dashboard/](src/dashboard/) with its own dependencies, and its compiled output in `src/dashboard/build` is committed. After changing any `.svelte` file you must rebuild it:

```sh
cd src/dashboard && npm install && npm run build
```

## Security

See [SECURITY.md](.github/SECURITY.md) for how to report a vulnerability.

## License

GPL-3.0-or-later, inherited from the upstream project by [eartharoid](https://github.com/eartharoid). See [LICENSE](LICENSE).
