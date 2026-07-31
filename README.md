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

- **Node.js 20+** (22 LTS recommended) on a **glibc** platform. Alpine/musl is not supported — Temporal's native addon has no musl build.
- **MySQL or PostgreSQL.** SQLite support has been removed — `DB_PROVIDER` must be `mysql` or `postgresql`.
- **A Temporal cluster.** This is **not optional**: every scheduled and durable job (stale tickets, auto-close, the reopen window, exports, cron automations) runs on it, and the bot exits at startup without `TEMPORAL_ADDRESS`/`TEMPORAL_PORT`. Use [Temporal Cloud](https://temporal.io/cloud) or self-host — the provided [docker-compose.yml](docker-compose.yml) brings up a cluster with its own PostgreSQL and the Web UI.

## Installing

**[docs/installation.md](docs/installation.md) is the full guide.** In short:

| Method | How |
| --- | --- |
| **Docker Compose** | [docker-compose.yml](docker-compose.yml) — brings up the database and Temporal too. Image tags: `:latest`, `:1`, `:1.4`, `:1.4.x` for releases, `:main` for development builds. |
| **Bare metal** | Extract the [release tarball](https://github.com/Gelhaus-Solutions/discordtickets-revamped/releases/latest), `npm ci --omit=dev --omit=optional`, run under systemd. |
| **Pterodactyl** | Import [eggs/pterodactyl.json](eggs/pterodactyl.json) on a Debian Node yolk. |
| **Pelican** | Import [eggs/pelican.json](eggs/pelican.json) on a Debian Node yolk. |

The release tarball ships the compiled Temporal layer and the dashboard build,
so nothing has to be built on the target machine.

> [!IMPORTANT]
> Set `ENCRYPTION_KEY` yourself (`openssl rand -hex 24`) and never change it.
> Ticket topics, close reasons, feedback comments and archived messages are
> encrypted with it, and it is not recoverable — not even from a database
> backup. The bot refuses to start rather than inventing a throwaway key that
> would differ after every recreate.

### Upgrading an existing instance

**Read [MIGRATING.md](MIGRATING.md)** — it covers each install method, the
SQLite path, and how to recover a half-applied migration.

Database migrations run automatically at startup
(`scripts/postinstall.js` runs `prisma migrate deploy`) for both providers, and
a failed migration stops the boot instead of letting the bot run against a
half-migrated schema. There is no script to run by hand.

## Environment variables

See [docs/installation.md](docs/installation.md#environment-variables) for the
variables this fork adds or changes, [.env.example](.env.example) for an
annotated file to copy, and [src/env.js](src/env.js) for the authoritative
validation. Everything else is documented upstream at
<https://discordtickets.app/self-hosting/configuration/#environment-variables>.

## Development

The bot itself is plain JavaScript (CommonJS) run by Node; the Temporal layer in
[src/temporal/](src/temporal/) is TypeScript that has to be compiled before the
bot will start. Dependencies are managed with npm (`package-lock.json` is the
one lockfile).

```sh
npm install --include=dev    # devDependencies are needed to build the Temporal layer
npm run temporal.build       # compile src/temporal -> dist/temporal + bundle workflows
npm run temporal.typecheck   # type-check only
npm run lint                 # eslint (JS only; src/temporal and dist are excluded)
npm test                     # i18n, components, panels, transcripts, questions,
                             # automations, import allow-lists, regex safety
npm start                    # start the bot (builds the Temporal layer if missing)
```

> Exporting `NODE_ENV=production` before installing makes npm skip
> devDependencies, so the Temporal layer cannot be compiled. `scripts/ensure-temporal.js`
> says so explicitly when it happens.

State (`.env`, `user/`, `logs/`) lives in the *data directory*, which defaults to
the repository and is overridden with `DT_DATA_DIR`. The working directory no
longer affects anything.

The dashboard is a separate SvelteKit app in [src/dashboard/](src/dashboard/)
with its own dependencies. Its compiled output, `src/dashboard/build`, is build
output rather than source: the install above builds it for you if it is missing.
After changing any `.svelte` file, rebuild it:

```sh
npm run dashboard.build
```

Set `DT_SKIP_DASHBOARD_BUILD=true` to skip the automatic build during install.
Releases build it in CI, so nothing has to be committed or built on the target
machine.

## Security

See [SECURITY.md](.github/SECURITY.md) for how to report a vulnerability.

## License

GPL-3.0-or-later, inherited from the upstream project by [eartharoid](https://github.com/eartharoid). See [LICENSE](LICENSE).
