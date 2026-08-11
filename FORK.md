# How this fork differs from upstream

This is a fork of [discord-tickets/bot](https://github.com/discord-tickets/bot)
by [eartharoid](https://github.com/eartharoid), still GPL-3.0-or-later and still
recognisably the same bot. Anything not described here behaves as upstream does
and is documented at <https://discordtickets.app>.

This page is the full list. The [README](README.md) links here rather than
repeating it.

## At a glance

| | What it does | Upstream |
| --- | --- | --- |
| [Thread tickets](#ticket-channel-modes) | Tickets as threads in one channel, so a server is not limited to 50 open tickets | — |
| [Forum tickets](#ticket-channel-modes) | Tickets as forum posts, for public support | — |
| [Backup categories](#backup-categories) | Overflow into another category when a Discord category is full | — |
| [Auto-assign](#auto-assign) | The first staff member to reply claims the ticket | — |
| [Close with a reason](#closing) | A button, not just the slash command | — |
| [Ticket priorities](#priorities-and-channel-name-emoji) | High / medium / low, shown in the channel name | Partial |
| [Channel-name emoji](#priorities-and-channel-name-emoji) | Configurable per state and priority, per category | — |
| [Waiting-on-staff status](#waiting-on-staff) | Tracks whether a ticket is waiting on staff or on its author | — |
| [Automations](#automations) | A visual rule builder: 15 triggers, 13 actions, conditions, cron | — |
| [Panels](#panels-and-the-block-editor) | Multiple ticket panels per server, edited visually | Partial |
| [Block editor](#panels-and-the-block-editor) | Compose Discord Components V2 messages without JSON | — |
| [Settings dashboard](#the-dashboard) | In-repo, not a separate deployment | Separate repo |
| [Member portal](#the-portal) | Members see their own tickets; staff get a queue | — |
| [Feedback portal](#feedback) | Every rating and comment, filterable | Partial |
| [HTML transcripts](#transcripts) | Rendered transcripts with a searchable archive | Text only |
| [Bot customisation](#bot-customisation) | Per-server bot name, avatar, banner and bio | — |
| [Inheritable settings](#inheritable-settings) | Server-wide defaults each category can override | — |
| [Temporal](#temporal) | Scheduled and durable work survives restarts | In-process timers |
| [Encryption at rest](#encryption) | Required, not optional | Optional |

"Partial" means upstream has something in the area, but not in this form.

---

## Tickets

### Ticket channel modes

Upstream creates one channel per ticket. Discord caps a category at 50 channels,
which is the practical ceiling on how many tickets a server can have open.

A category here picks one of three modes:

- **Channel** — one channel per ticket, as upstream.
- **Thread** — a thread in a single parent channel. No category limit, and the
  channel list stays readable.
- **Forum** — a post in a forum channel. Suited to public support, where the
  point is that other members can read the answers.

Thread and forum tickets have no total limit, because the limit exists to avoid
the 50-channel cap and it does not apply to them.

### Backup categories

When a channel-mode category's Discord category is full, the ticket is created
in a nominated backup category instead of failing. The backup is validated to
belong to the same server.

### Auto-assign

Per category. The first staff member to send a message in an unclaimed ticket
claims it, so tickets stop sitting unowned while someone is already answering.

### Closing

Alongside the slash command there is a close-with-reason button, an
optional close request the ticket author can accept, and a configurable reopen
window during which a closed ticket can be brought back. The window is durable —
see [Temporal](#temporal).

### Priorities and channel-name emoji

Tickets have a priority, and the channel name carries a prefix built from the
ticket's state and priority. Which emoji those are is configurable per category
with a server-wide default behind it, and the prefix is rebuilt by a single
idempotent function rather than by string surgery at each call site.

An automation or `/emoji` can also pin a specific emoji to one ticket.

### Waiting on staff

A ticket records whether it is waiting on staff or on its author, flipped by
whoever sent the last message. It drives the staff queue and, optionally, an
emoji in the channel name — debounced, because Discord allows two channel
renames per ten minutes.

## Automations

A visual rule builder in the dashboard, with no counterpart upstream. Rules are
graphs of nodes, validated before they are saved and executed with a bounded
runtime.

- **15 triggers** — ticket created, claimed, released, closed, reopened, moved,
  stale, feedback received; message created; button pressed; menu selected;
  member joined or left; bot command; cron schedule.
- **13 actions** — send, reply, DM, ephemeral reply, react; add or remove a
  role; claim, close, move or rename a ticket; write to the log; run another
  automation.
- **Conditions** for branching, an HTTP action for outbound calls, and cron
  triggers backed by Temporal schedules rather than an in-process timer.

Runs are recorded, so a rule that misfires can be inspected after the fact.

## The dashboard

Upstream ships its settings UI as a separate project. Here it lives in
[src/dashboard/](src/dashboard/) and is served by the bot, so there is one thing
to deploy and one version to keep straight. It is built during install and
shipped prebuilt in releases.

### Panels and the block editor

A server can have several ticket panels, each edited visually and re-sent to
Discord from the dashboard. Panel and opening messages are composed in a block
editor that produces Discord Components V2 layouts — containers, sections,
buttons, select menus, separators — with a live preview, rather than requiring
hand-written JSON.

### The portal

The member-facing side. Members see the tickets they have opened; staff get a
queue of what needs attention — unclaimed, never answered, gone quiet, or
waiting on staff — without needing the admin permissions the settings panel
requires.

### Feedback

Ratings and comments collected on close, with a filterable view: date range,
category, rating distribution and trend over time.

### Bot customisation

Per-server bot username, avatar, banner and bio, so one instance serving several
communities can present differently in each.

### Inheritable settings

Most category settings can be left unset and inherited from a server-wide
default: channel name, limits, cooldown, slowmode, staff/ping/required/blocked
roles, and the emoji settings. `null` means inherit and an empty value means a
deliberate "none", and the two are kept distinct all the way down.

## Data

### Transcripts

Upstream produces text transcripts on request. This fork also renders HTML
transcripts — message content, embeds, components, attachments and replies — and
gives admins a searchable archive of them in the dashboard. Transcripts are
written to disk with only a reference in the database.

### Encryption

`ENCRYPTION_KEY` is required and the bot refuses to start without it. Ticket
topics, close reasons, feedback comments and archived messages are encrypted at
rest. It is not recoverable: losing it means losing that data, so it must be set
deliberately and never changed.

### Import and export

A server's configuration and tickets can be exported to an archive and imported
into another instance. Both run as durable jobs, so a large export survives a
restart, and the importer validates against an explicit allow-list rather than
trusting the archive.

## Infrastructure

### Temporal

Every scheduled or long-running job — stale-ticket handling, auto-close, the
reopen window, deferred channel renames, transcript generation, import/export,
cron automations — runs on [Temporal](https://temporal.io) instead of
`setTimeout`.

This is not a preference. In-process timers are lost on restart, and a deploy
inside a ticket's stale window silently cancels it; with more than one process
every timer fires. Durable workflows survive restarts and are idempotent.

The cost is a hard dependency: **Temporal is required**, and the bot exits at
startup without it. The provided [docker-compose.yml](docker-compose.yml) brings
up a cluster.

### Databases

SQLite support has been **removed**. `DB_PROVIDER` must be `mysql` or
`postgresql`. Both are kept in step — the schema and every migration exist for
each, and the test suite checks they agree.

Migrations run automatically at startup, and a failed migration stops the boot
rather than letting the bot run against a half-migrated schema.

### Platform

Node.js 20+ (22 LTS recommended) on **glibc**. Alpine and musl are not
supported, because Temporal's native addon has no musl build.

---

## Removed or changed

| | |
| --- | --- |
| SQLite | Removed. Use MySQL or PostgreSQL. |
| Optional encryption | `ENCRYPTION_KEY` is now required. |
| In-process scheduling | Replaced by Temporal, which is a required dependency. |
| Separate dashboard deployment | Merged into this repo and served by the bot. |
| Alpine / musl images | Unsupported. |

Upstream configuration that this fork does not change is still documented at
<https://discordtickets.app>. What it does add or change is in
[docs/installation.md](docs/installation.md#environment-variables), with
[src/env.js](src/env.js) as the authoritative validation.

## Upgrading from upstream

See [MIGRATING.md](MIGRATING.md). It covers each install method, moving off
SQLite, and recovering a half-applied migration.
