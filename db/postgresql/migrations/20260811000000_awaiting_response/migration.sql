-- Migration: 20260811000000_awaiting_response
-- Adds: tickets.awaitingResponseFrom — 'STAFF' or 'USER', flipped by whoever
--         sent the last human message, so the dashboard can show which tickets
--         are actually waiting on the team
--       categories/guilds.awaitingStaffEmoji — the channel-name prefix while a
--         ticket is waiting on staff, per category with a server-wide default
--
-- Every column is nullable with no default and nothing is backfilled, so this
-- migration changes no behaviour. A ticket that predates it stays NULL until
-- its next message, and `naming.js#ticketState` treats anything other than
-- 'STAFF' as "not waiting on us" — so a NULL row names itself exactly as it
-- did before.
--
-- awaitingStaffEmoji is nullable rather than NOT NULL DEFAULT '' for the same
-- reason as the other state emojis: NULL means "ask the level above" and ''
-- is a deliberate "no emoji", and only the resolver's `??` chain can tell them
-- apart. Its built-in is '', which the naming layer reads as "this guild does
-- not use the feature" and falls back to the claimed/unclaimed emoji — so an
-- install that never touches these settings keeps its claim tick.
--
-- awaitingResponseFrom is a free-form string, matching `tickets.priority`
-- rather than introducing an enum: the values are written by exactly one code
-- path, and a foreign value arriving through an import reads as "not STAFF",
-- which is the safe direction to fail.

ALTER TABLE "tickets"    ADD COLUMN IF NOT EXISTS "awaitingResponseFrom" TEXT;

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "awaitingStaffEmoji"   TEXT;
ALTER TABLE "guilds"     ADD COLUMN IF NOT EXISTS "awaitingStaffEmoji"   TEXT;
