# Installing Discord Tickets (revamped)

Four supported methods. They differ only in how the code gets onto the machine
and who starts it — the requirements, the environment variables and the upgrade
story are the same for all of them.

| Method | Pick this if | Section |
| --- | --- | --- |
| Docker Compose | You want the database and Temporal brought up for you | [Docker Compose](#docker-compose) |
| Bare metal | You run your own machine and want a systemd service | [Bare metal](#bare-metal) |
| Pterodactyl | You use a Pterodactyl panel | [Pterodactyl and Pelican](#pterodactyl-and-pelican) |
| Pelican | You use a Pelican panel | [Pterodactyl and Pelican](#pterodactyl-and-pelican) |

---

## Requirements

**Node.js 20 or newer** (22 LTS recommended). Set by `engines` in
`package.json` and enforced at startup.

**A glibc platform.** Linux x64/arm64 on a glibc distribution (Debian, Ubuntu,
Rocky, …), macOS x64/arm64, or Windows x64. **Alpine and other musl distributions
do not work**: Temporal's native `@temporalio/core-bridge` addon ships no musl
build. The bot checks for this at startup and says so, rather than failing at
`dlopen` with a relocation error.

**MySQL 8 or PostgreSQL 14+.** SQLite is not supported — see
[MIGRATING.md](../MIGRATING.md) if you are coming from a SQLite install.

**A Temporal cluster.** This is not optional. Every scheduled or long-running
job — inactivity warnings, auto-close, the reopen grace window, guild
export/import, cron automations, stats — runs as a Temporal workflow. The bot
refuses to start without `TEMPORAL_ADDRESS` and `TEMPORAL_PORT`. See
[Reaching Temporal](#reaching-temporal).

**Disk:** about 500 MB installed, most of it Temporal's prebuilt native addon.

---

## Where things live

Two directories, and nothing depends on the working directory:

| | Contents | Override |
| --- | --- | --- |
| **App directory** | The code. Only written to when the schema changes. | `DT_APP_DIR` |
| **Data directory** | `.env`, `user/` (config, transcripts, dumps), `logs/`. | `DT_DATA_DIR` |

They are the same directory by default. Docker sets `DT_DATA_DIR=/home/container`
(the volume) while the code lives in `/app`. The environment file is
`<data dir>/.env` unless `DT_ENV_FILE` says otherwise.

> An environment variable set to an **empty string counts as unset**, so a blank
> panel variable or a bare `KEY:` in a compose file never shadows the value in
> `.env`.

---

## Docker Compose

Use [docker-compose.yml](../docker-compose.yml). It brings up MySQL, a Temporal
cluster with its own PostgreSQL, the Temporal Web UI and the bot.

```sh
curl -O https://raw.githubusercontent.com/Gelhaus-Solutions/discordtickets-revamped/main/docker-compose.yml
# read it, then set ENCRYPTION_KEY, DISCORD_TOKEN, DISCORD_SECRET, SUPER
docker compose up -d
docker compose logs -f bot
```

Read it in full before deploying: it ships with placeholder passwords and an
insecure (plaintext) Temporal connection that are fine for local testing and not
fine for production.

Generate the encryption key **once** and keep it:

```sh
openssl rand -hex 24
```

Image tags:

| Tag | Contents |
| --- | --- |
| `:latest`, `:1`, `:1.4`, `:1.4.x` | Stable releases |
| `:main` | Built from every push to `main` |

---

## Bare metal

Install from the release tarball. It ships the compiled Temporal layer and the
dashboard build, so no build step is needed on the target machine.

```sh
# A user to run it as, and somewhere for its state
sudo useradd --system --home /var/lib/discord-tickets --create-home discord-tickets
sudo install -d -o discord-tickets -g discord-tickets -m 0750 /opt/discord-tickets

# The application
curl -fsSL -o /tmp/dt.tar.gz \
  https://github.com/Gelhaus-Solutions/discordtickets-revamped/releases/latest/download/discordtickets-revamped.tar.gz
sudo -u discord-tickets tar -xzf /tmp/dt.tar.gz --strip-components=1 -C /opt/discord-tickets
cd /opt/discord-tickets
sudo -u discord-tickets npm ci --omit=dev --omit=optional

# The environment
sudo -u discord-tickets cp .env.example /var/lib/discord-tickets/.env
sudo -u discord-tickets chmod 600 /var/lib/discord-tickets/.env
sudoedit -u discord-tickets /var/lib/discord-tickets/.env   # fill it in
```

First run in the foreground, so you can watch the migrations:

```sh
sudo -u discord-tickets DT_DATA_DIR=/var/lib/discord-tickets sh scripts/start.sh
```

You are looking for the `[postinstall]` block applying migrations, then
`Listening at …`. Stop it with Ctrl-C and install the service:

```ini
# /etc/systemd/system/discord-tickets.service
[Unit]
Description=Discord Tickets (revamped)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=discord-tickets
WorkingDirectory=/opt/discord-tickets
Environment=NODE_ENV=production
Environment=DT_DATA_DIR=/var/lib/discord-tickets
ExecStart=/usr/bin/env sh /opt/discord-tickets/scripts/start.sh
Restart=on-failure
RestartSec=10
KillSignal=SIGTERM
# The shutdown sequence drains the Temporal worker; give it room.
TimeoutStopSec=45
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/var/lib/discord-tickets /opt/discord-tickets
UMask=0077

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now discord-tickets
journalctl -u discord-tickets -f
```

`/opt/discord-tickets` stays writable because the Prisma client is regenerated
there whenever the schema changes (a no-op on ordinary restarts).

### Upgrading

```sh
sudo systemctl stop discord-tickets
# back up the database and /var/lib/discord-tickets first
curl -fsSL -o /tmp/dt.tar.gz \
  https://github.com/Gelhaus-Solutions/discordtickets-revamped/releases/latest/download/discordtickets-revamped.tar.gz
sudo -u discord-tickets tar -xzf /tmp/dt.tar.gz --strip-components=1 -C /opt/discord-tickets
cd /opt/discord-tickets && sudo -u discord-tickets npm ci --omit=dev --omit=optional
sudo systemctl start discord-tickets
```

Migrations run automatically at startup and a failure stops the boot rather than
letting the bot run against a half-migrated schema.

### Installing from git instead

Only needed if you want to modify the code. The Temporal layer has to be
compiled, which needs devDependencies:

```sh
git clone https://github.com/Gelhaus-Solutions/discordtickets-revamped.git
cd discordtickets-revamped
npm install --include=dev
npm run temporal.build
```

> Exporting `NODE_ENV=production` before `npm install` makes npm skip
> devDependencies — including TypeScript — and the Temporal build then cannot
> run. This is the single most common bare-metal install failure; the bot names
> it explicitly when it happens.

`npm install` also builds the dashboard, which the bot serves from
`src/dashboard/build` — that directory is generated, not committed. After
changing the dashboard, rebuild it with `npm run dashboard.build`. Set
`DT_SKIP_DASHBOARD_BUILD=true` to skip the build during install (the bot then
starts without a dashboard, and says so).

---

## Pterodactyl and Pelican

Import the egg for your panel:

- Pterodactyl: [eggs/pterodactyl.json](../eggs/pterodactyl.json)
- Pelican: [eggs/pelican.json](../eggs/pelican.json)

Then create a server with it:

1. Pick a **Debian** Node image (`ghcr.io/parkervcp/yolks:nodejs_22`). Alpine
   images cannot run Temporal's native addon.
2. Allocate at least **1 GB of disk**.
3. Install the server. The install script downloads the release tarball,
   installs production dependencies, and generates an encryption key into
   `/home/container/.env`.
4. On the **Startup** tab, set at minimum:
   - `DISCORD_TOKEN`, `DISCORD_SECRET`
   - `DB_PROVIDER` (`mysql` or `postgresql`) and `DB_CONNECTION_URL` — create
     the database through the panel's Databases tab, or point at an external one
   - `TEMPORAL_ADDRESS`, and the `TEMPORAL_TLS_*` variables unless the cluster
     is on a private network you control
   - `SUPER` — your own Discord user ID
   - Leave `ENCRYPTION_KEY` **empty** to keep the key generated at install time.
5. Start it. The console is ready when it prints `Listening at …`.

`HTTP_PORT` and `HTTP_HOST` come from the allocation automatically, and
`HTTP_EXTERNAL` defaults to `http://<server ip>:<port>` — set it explicitly once
the bot is behind a domain, because it must match the OAuth redirect URI
configured in the Discord developer portal.

### Upgrading

**Reinstall Server.** The install script replaces the code and leaves `.env`,
`user/` and `logs/` alone, so your encryption key, transcripts and config
survive. Pin a specific release by setting `BOT_VERSION` to a tag first.

> Back up `/home/container/.env` before any reinstall. Without that key, every
> encrypted ticket topic, close reason, feedback comment and archived message is
> unreadable — including in your database backups.

### Tight on disk?

Temporal's addon ships prebuilt binaries for five platforms and only one is
used. Removing the rest saves ~110 MB:

```sh
cd /home/container/node_modules/@temporalio/core-bridge/releases
ls   # keep the one matching your platform, e.g. x86_64-unknown-linux-gnu
```

---

## Reaching Temporal

Three options, in the order most people should consider them.

**1. Temporal Cloud.** Simplest for panel and bare-metal users.

```
TEMPORAL_ADDRESS=<namespace>.<account>.tmprl.cloud
TEMPORAL_PORT=7233
TEMPORAL_NAMESPACE=<namespace>.<account>
TEMPORAL_TLS_ENABLED=true
TEMPORAL_TLS_CERT_PATH=/home/container/certs/client.pem
TEMPORAL_TLS_KEY_PATH=/home/container/certs/client.key
```

Upload the certificate and key with the panel's file manager (or `scp` them on
bare metal) and `chmod 600` them. The bot checks at startup that both files
exist, instead of failing later inside the native addon.

**2. Self-hosted, on your own machine.** Copy the `temporal`,
`temporal-postgresql` and `temporal-ui` services out of
[docker-compose.yml](../docker-compose.yml) and run them alongside your bot,
then point `TEMPORAL_ADDRESS` at that host.

> Plaintext gRPC on port 7233 has **no authentication whatsoever**. Anyone who
> can reach that port can read and modify workflow state, which contains ticket
> data. `TEMPORAL_TLS_ENABLED=false` is only acceptable when the port is bound
> to loopback or a private interface and firewalled. Otherwise terminate it with
> mTLS and set the `TEMPORAL_TLS_*` variables.

**3. Running Temporal as a second panel server is not supported.** It needs its
own database plus schema tooling, and the egg does not provide it.

---

## Environment variables

[.env.example](../.env.example) is the annotated reference and
[src/env.js](../src/env.js) is what actually validates them. The variables this
fork adds or changes:

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DB_PROVIDER` | yes | — | `mysql` or `postgresql`. |
| `TEMPORAL_ADDRESS` | yes | — | Host/IP of the Temporal frontend. |
| `TEMPORAL_PORT` | yes | — | Usually `7233`. |
| `TEMPORAL_NAMESPACE` | no | `default` | |
| `TEMPORAL_TASK_QUEUE` | no | `discord-tickets` | |
| `TEMPORAL_DEPLOYMENT_NAME` | no | `discord-tickets` | Worker Deployment name used for versioning. |
| `TEMPORAL_TLS_ENABLED` | no | **`true`** | Set `false` only for a private/local cluster. |
| `TEMPORAL_TLS_CERT_PATH` | when TLS on | — | Client certificate (mTLS). Must exist. |
| `TEMPORAL_TLS_KEY_PATH` | when TLS on | — | Client private key. Must exist. |
| `TEMPORAL_TLS_CA_PATH` | no | — | Server root CA, if it is not publicly trusted. |
| `TEMPORAL_TLS_SERVER_NAME` | no | — | SNI override. |
| `TEMPORAL_WORKER_BUILD_ID` | no | build id from the release | Identifies the worker build. |
| `TEMPORAL_SET_CURRENT_ON_START` | no | `true` | Promote this build to Current on startup. |
| `JWT_SECRET` | no | derived | Derived from `ENCRYPTION_KEY` via HKDF when unset. Set it to your old `ENCRYPTION_KEY` when upgrading from upstream to keep sessions valid. |
| `SUPER` | no | — | Comma-separated operator IDs. Also gates service API keys. |
| `STATS_URL` | no | — | Nothing is reported unless you set this. |
| `SENTRY_DSN` | no | — | Enables Sentry. |
| `DT_DATA_DIR` | no | app directory | Where `.env`, `user/` and `logs/` live. |
| `DT_APP_DIR` | no | auto-detected | Where the code lives. |
| `DT_ENV_FILE` | no | `<data dir>/.env` | |
| `DT_SKIP_MIGRATIONS` | no | — | `true` skips `prisma migrate deploy` at boot. Use when you migrate out of band or run several replicas — `migrate deploy` is not concurrency-safe. |

Everything else is documented upstream at
<https://discordtickets.app/self-hosting/configuration/#environment-variables>.

---

## Health checks

```sh
npm run healthcheck     # exit 0 when the HTTP server answers
```

The Docker image uses this for its `HEALTHCHECK`. `GET /status` returns 200 with
a body describing each subsystem; Temporal being unreachable reports
`"degraded"` rather than failing the check, deliberately — the bot still serves
Discord and the dashboard, and restarting it would not bring Temporal back.
Alert on the body, not the status code.

---

## Troubleshooting

**`The Temporal layer (dist/temporal) is missing and TypeScript is not
installed.`** You are running from a git checkout without devDependencies.
`npm install --include=dev && npm run temporal.build`. If you exported
`NODE_ENV=production`, unset it for the install.

**`This platform is not supported.`** Alpine/musl. Use a Debian or Ubuntu image.

**`The "DB_CONNECTION_URL" environment variable is required`, but it is in my
`.env`.** The error names the file the bot actually read. If that is not the
file you edited, set `DT_DATA_DIR` (or `DT_ENV_FILE`) to the right place.

**`The data directory … is not writable.`** The bot needs somewhere to put
`user/` and `logs/`. Fix the permissions or point `DT_DATA_DIR` elsewhere.

**Migrations fail with P3005.** Your database has tables but no migration
history (an old `prisma db push` install, or a dump that excluded
`_prisma_migrations`). The bot baselines it automatically; if it cannot, the
error explains what to do.

**Dashboard login loops.** `HTTP_EXTERNAL` must exactly match the OAuth redirect
URI in the Discord developer portal, with no trailing slash.
