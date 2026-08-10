# Migrating to discordtickets-revamped

This fork changes the database schema and adds a required Temporal cluster.
The database steps are the same for every install method; where the mechanics
differ (Docker, bare metal, Pterodactyl/Pelican) that is called out. See
[docs/installation.md](docs/installation.md) for installing from scratch.

> [!CAUTION]
> **Back up your database and your bot volume before you start.** Also make a
> note of your `ENCRYPTION_KEY`. Ticket topics, close reasons, feedback comments
> and archived messages are encrypted at rest with it — without the original key
> that data is unrecoverable, and no migration can bring it back.

---

## Before you begin: pin `ENCRYPTION_KEY` explicitly

Set `ENCRYPTION_KEY` in your compose file's `bot` environment, using the value
your current install already uses.

Earlier versions generated a key into a `.env` file resolved against the
working directory. In Docker that path is not on a mounted volume, so a new key
was silently generated on **every container recreate** — quietly orphaning all
previously encrypted data. The bot now refuses to start in a container when
`ENCRYPTION_KEY` is unset rather than inventing one.

To generate a key for a brand-new install:

```sh
openssl rand -hex 24
```

## Other behaviour changes in this release

**Service API keys are now operator-only.** `GET /api/users/@me/key` used to
issue a 90-day token to any logged-in dashboard user, and that token skipped
several authorization checks. Only user IDs listed in `SUPER` can issue one now,
and the claim is only honoured while the ID is still in that list. Existing
service keys held by non-operators stop working; reissue them as a `SUPER` user.

**`SUPER` no longer has a default.** It used to default to the upstream
author's Discord ID. Set it to your own ID — it grants settings access to every
guild, access to any transcript, and the ability to issue service keys.

**An empty environment variable now counts as unset.** A blank panel variable or
a bare `KEY:` in a compose file no longer shadows the value in `.env` (it used
to, which produced "ENCRYPTION_KEY is required" while the key sat in the file
being read).

---

## Sessions and API keys are invalidated on upgrade

Upstream signed dashboard sessions and service API keys with the raw
`ENCRYPTION_KEY`. This fork derives a separate JWT signing key from it via HKDF,
so on upgrade every existing session and service API key stops verifying. Users
log in again; **service API keys must be reissued.**

To avoid that entirely, set `JWT_SECRET` to your existing `ENCRYPTION_KEY`
value — the signing key then matches what upstream used and existing tokens keep
working.

Service keys minted by upstream also lacked an expiry claim, which this fork
requires, so those need reissuing regardless.

---

## If you already use Sentry: PII is no longer sent by default

Only relevant if you set `SENTRY_DSN`. Skip this section otherwise.

Sentry previously ran with `sendDefaultPii: true` hardcoded, which attached
Discord user IDs and IP addresses to every event. That data identifies **your
members**, not you, and nothing in the UI ever said it was being collected — so
it is now off unless you ask for it:

```yaml
SENTRY_SEND_PII: "true"   # only if you actually want it back
```

Leaving it off means events no longer carry a user, which mostly affects
"how many people did this affect" style queries. Errors, traces and stack traces
are unchanged.

Two other things changed at the same time:

- **Sample rates now tolerate empty values.** `SENTRY_SAMPLE_RATE=""` used to
  parse to `NaN` and silently disable tracing altogether — which was the default
  on Docker and Pterodactyl/Pelican, so most installs were not tracing at all
  despite appearing configured. Empty now means the documented default.
- **Unhandled promise rejections are reported.** They never were before. The
  known sources have been fixed rather than left to flood your inbox: event
  listeners are now wrapped so a rejecting `async run()` is logged and attributed
  to its event instead of escaping to the process, and the presence updater and
  Temporal deployment promotion both catch their own failures. Anything that
  still arrives is a real pre-existing bug that was previously invisible, not a
  new one.

Everything added since — the log bridge (`SENTRY_LOGGING`), metrics
(`SENTRY_METRICS`) and dashboard replay (`PUBLIC_SENTRY_*`) — is off or
conservative by default and needs no action. See
[docs/installation.md](docs/installation.md#a-note-on-sentry-and-your-members-data).

---

## From upstream Discord Tickets on MySQL or PostgreSQL

Your existing database is migrated in place. No dump/restore is needed.

1. Back up your database and bot volume.
2. Point the `bot` image at
   `ghcr.io/gelhaus-solutions/discordtickets-revamped:latest`
   (or `:main` for development builds).
3. **Add a Temporal cluster.** Copy the `temporal`, `temporal-postgresql` and
   `temporal-ui` services plus the `temporal-postgresql` volume from
   [docker-compose.yml](docker-compose.yml) into yours, and add the `TEMPORAL_*`
   variables to your `bot` service. The bot will not start without them.
4. Make sure `ENCRYPTION_KEY` and `DB_PROVIDER` are set explicitly on the `bot`
   service.
5. `docker compose up -d`
6. Watch the logs: `docker compose logs -f bot`

   You are looking for the `[postinstall]` block running `prisma migrate deploy`
   and reporting the new migrations as applied, followed by `Listening at …`.
   A failed migration now stops the boot instead of letting the bot run against
   a half-migrated schema, so if the container exits, read the error — it is the
   real one.
7. Open the dashboard and confirm your categories, tags and panels are intact.

That is the whole procedure. There is no script to run by hand.

> **Databases with no migration history are baselined automatically.** Very old
> upstream installs created their schema with `prisma db push`, which records
> nothing in `_prisma_migrations`; a database restored from a dump that excluded
> that table looks the same. `prisma migrate deploy` refuses those with
> `Error: P3005 — The database schema is not empty`. On that error postinstall
> inspects the schema, marks the migrations it already satisfies as applied, and
> deploys the rest, so the boot recovers by itself. Nothing is dropped or
> rewritten. If the database is not empty but is not a Discord Tickets database
> either, postinstall says so and stops rather than guessing.

> Earlier revisions of this document told you to `docker exec` into the
> container and run `scripts/fix-revamp.js`. That script issued SQL against
> table names that do not exist (the models are `Category`/`Ticket`, but the
> tables are `categories`/`tickets`), so every statement failed — silently on
> MySQL — and it then reported success. Its other job was rewriting source files
> inside the container, which the documented `docker compose down && up -d` in
> the next step discarded. It has been removed, along with the orphaned
> `scripts/migrate-revamp.mjs`.

---

## From upstream Discord Tickets on SQLite

SQLite is no longer supported. Your data moves across with a dump and restore.
The dump **must** be taken on your old install, while it can still read its own
database.

1. **On the old upstream instance**, with it still working:

   ```sh
   npm run db.dump
   ```

   This writes `user/dumps/<timestamp>-db.json` (in the old instance's data
   directory). Copy it somewhere safe, and note the instance's
   `ENCRYPTION_KEY` — the dump stays encrypted with that key.

2. Stand up PostgreSQL (or MySQL) and deploy this fork against it, with:
   - `DB_PROVIDER=postgresql` (or `mysql`)
   - `DB_CONNECTION_URL` pointing at the new database
   - `ENCRYPTION_KEY` set to **the same value as the old instance**
   - the `TEMPORAL_*` variables

3. Start it once and let it create the schema:

   ```sh
   docker compose up -d
   docker compose logs -f bot
   ```

   Wait until it is listening, then stop the bot so nothing writes during the
   restore: `docker compose stop bot`.

4. Restore the dump. This **deletes everything** currently in the target
   database:

   ```sh
   # Docker: the dump has to be readable inside the container, so put it in the
   # bot volume (e.g. /home/container/user/dumps/) first.
   docker compose run --rm --entrypoint sh bot -c \
     'cd /app && npm run db.restore -- -f /home/container/user/dumps/dump.json -y'

   # Bare metal / panel, from the application directory:
   DT_DATA_DIR=/var/lib/discord-tickets npm run db.restore -- -f /path/to/dump.json -y
   ```

   The scripts read the same `.env` the bot does, resolved from `DT_DATA_DIR` —
   they used to read `./.env` relative to wherever you happened to be, which in
   the Docker command above was `/app/.env`, a file that does not exist.

5. Start the bot again and check the dashboard:

   ```sh
   docker compose start bot
   ```

Verify that ticket topics and close reasons are readable in the dashboard — if
they render as base64 noise, the `ENCRYPTION_KEY` does not match the one the
dump was created with. Stop, restore your backup, and correct the key.

> Categories in this fork can reference a backup category, which is a
> self-reference on the `categories` table. `db.restore` inserts categories with
> that link cleared and reapplies it in a second pass, because MySQL checks
> foreign keys per row and would otherwise reject a category pointing at one
> that has not been inserted yet.

---

## Per-method notes

### Docker Compose

The bot volume should now cover the whole data directory, not just `user/`:

```yaml
volumes:
  - tickets-bot:/home/container      # was tickets-bot:/home/container/user
```

`.env`, `user/` and `logs/` all live there (`DT_DATA_DIR=/home/container` in the
image). Also add `init: true` and `stop_grace_period: 45s` to the `bot` service —
without the grace period Docker kills the bot before the Temporal worker has
drained.

### Bare metal

If you previously ran the bot out of a git checkout, install the release
tarball instead — it ships `dist/temporal` prebuilt, so nothing needs a
TypeScript toolchain on the server. Point `DT_DATA_DIR` at wherever you keep
`user/`, and move your `.env` next to it. The bot prints both directories at
startup, and any environment error names the file it actually read.

### Pterodactyl / Pelican (from the upstream egg)

The upstream egg cannot run this fork: it sets `PTERODACTYL=true` with the
encryption key in a file rather than the environment, and the old startup
command copied `/app` over `/home/container/app` on every boot — which wiped
anything written there. The new eggs install into `/home/container` directly.

1. Back up `/home/container/.env` and `/home/container/user/` (and your database).
2. Note your `ENCRYPTION_KEY`.
3. Change the server's egg to [eggs/pterodactyl.json](eggs/pterodactyl.json) or
   [eggs/pelican.json](eggs/pelican.json), and its image to a **Debian** Node
   yolk (`ghcr.io/parkervcp/yolks:nodejs_22`) — Alpine cannot load Temporal's
   native addon.
4. Delete the leftover `/home/container/app` directory.
5. Reinstall the server. The install script keeps an existing `.env`, so your
   key survives; if you had none, put yours in `/home/container/.env` before
   starting.
6. Fill in the Startup tab — `DB_PROVIDER` must be `mysql` or `postgresql`, and
   the `TEMPORAL_*` variables are required.

Reinstalling is also how you upgrade from then on: it replaces the code and
leaves `.env`, `user/` and `logs/` alone.

---

## If a migration fails part-way (MySQL)

PostgreSQL runs each migration file in a transaction, so a failure rolls back
cleanly. MySQL does not — DDL auto-commits per statement, so a migration that
fails half-way leaves some columns created and the migration recorded as failed.
Every later `prisma migrate deploy` then refuses to run at all.

To recover, decide whether the migration's changes are actually present:

```sh
# inspect the table
docker compose exec mysql mysql -u root -p -e 'SHOW COLUMNS FROM tickets;' yourdb

# then either mark it as done (changes are present) …
docker compose run --rm bot sh -c 'cd /app && npx prisma migrate resolve --applied <migration_name>'

# … or mark it as rolled back (you removed the partial changes yourself)
docker compose run --rm bot sh -c 'cd /app && npx prisma migrate resolve --rolled-back <migration_name>'
```

Then start the bot again so `migrate deploy` can continue.

---

## Rolling back

There are no down-migrations. `20260228000001_features` drops the
`TicketPriority` enum type on PostgreSQL (converting the column to text first,
so no data is lost), and returning to upstream would mean recreating that type
and casting the column back by hand. Restore your pre-migration backup instead.
