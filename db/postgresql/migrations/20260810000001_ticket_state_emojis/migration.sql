-- Migration: 20260810000001_ticket_state_emojis
-- Adds: categories/guilds.claimedEmoji, .closedEmoji, .unclaimedEmoji,
--         .priorityEmojis  — the channel-name prefix, now configurable per
--         category with a server-wide default behind it
--       tickets.emojiOverride, .emojiOverrideScope — an emoji pinned to one
--         ticket by an automation or /emoji
--
-- Every column is nullable with no default and nothing is backfilled, so this
-- migration changes no behaviour at all. NULL means "ask the level above", and
-- with both levels unset the built-ins in src/lib/tickets/naming.js reproduce
-- exactly what the bot did before: no emoji while a ticket is open, the claim
-- tick once it is claimed, nothing once it closes, and the priority circles.
--
-- An empty string is the *deliberate* "no emoji" a guild sets to turn the claim
-- tick off. That distinction is the reason these are nullable columns rather
-- than NOT NULL with a DEFAULT — and the reason the resolver uses `??`, not
-- `||`, all the way down.
--
-- closedEmoji only ever shows on THREAD and FORUM categories: a CHANNEL-mode
-- ticket has its channel deleted on close, so there is no name left to prefix.

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "claimedEmoji"   TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "closedEmoji"    TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "unclaimedEmoji" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "priorityEmojis" JSONB;

ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "claimedEmoji"   TEXT;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "closedEmoji"    TEXT;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "unclaimedEmoji" TEXT;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "priorityEmojis" JSONB;

ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "emojiOverride"      TEXT;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "emojiOverrideScope" TEXT;
