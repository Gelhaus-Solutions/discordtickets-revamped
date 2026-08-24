-- Migration: 20260824000000_close_request_layout
-- Adds: guilds.closeRequestLayout     — the server-wide default
--       categories.closeRequestLayout — the per-category override
--
-- The close request is the message staff send asking the member who opened a
-- ticket to confirm closing it. Panels, the ticket opening message and the
-- automation message nodes all have a Components v2 block editor behind them;
-- this was the last message in the close flow still hard-coded as an embed in
-- `manager.js`, so a server could not change its wording or branding.
--
-- Nullable JSON on both, with no default, which is the shape every inheritable
-- setting in this schema has (see `src/lib/settings/inheritance.js`). NULL means
-- "ask the level above", and NULL at both levels resolves to the built-in
-- embed — exactly the close request every server has today. A @default would
-- make "inherit" unreachable for every category created afterwards, because
-- Prisma fills defaults in on create.
--
-- Note the distinction the JSON type makes possible and that the resolver
-- relies on: NULL is an absence, but a stored layout with an empty `blocks`
-- array is a *choice*, and only the choice survives a server-wide default being
-- set later.
--
-- Existing rows get NULL at both levels, so nothing changes on upgrade.

ALTER TABLE "guilds"     ADD COLUMN IF NOT EXISTS "closeRequestLayout" JSONB;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "closeRequestLayout" JSONB;
