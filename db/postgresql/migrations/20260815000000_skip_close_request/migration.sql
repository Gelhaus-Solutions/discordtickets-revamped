-- Migration: 20260815000000_skip_close_request
-- Adds: guilds.skipCloseRequest    — the server-wide default
--       categories.skipCloseRequest — the per-category override
--
-- Closing a ticket has always gone through a *request*: staff ask, the member
-- who opened it accepts, and only then does it close. This turns that off for
-- staff, who instead confirm privately and close there and then. The member is
-- never asked.
--
-- Nullable on both, with no default, which is the shape every inheritable
-- setting in this schema has (see `src/lib/settings/inheritance.js`). NULL means
-- "ask the level above" and false means "no, keep asking the member" — two
-- different answers that a NOT NULL column could not tell apart, and a @default
-- would make "inherit" unreachable for every category created afterwards.
--
-- Existing rows get NULL at both levels, which resolves to the built-in false:
-- exactly the close-request behaviour every server has today.

ALTER TABLE "guilds"     ADD COLUMN IF NOT EXISTS "skipCloseRequest" BOOLEAN;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "skipCloseRequest" BOOLEAN;
