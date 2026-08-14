-- Migration: 20260814000000_ticket_created_channels
-- Adds: tickets.createdChannelIds — the channels an automation's "create a
--         channel" node made while working on this ticket, so closing it can
--         take them down instead of leaving them behind
--       tickets.staffChannelId — the private staff thread or channel for this
--         ticket, if it has one
--
-- Both are nullable with no default and nothing is backfilled, so this
-- migration changes no behaviour. A ticket that predates it has neither, and
-- the close path treats NULL exactly as it treats an empty list.
--
-- createdChannelIds is JSONB rather than NOT NULL DEFAULT '[]' because the
-- MySQL copy cannot put a DEFAULT on a JSON column, and a schema that is only
-- expressible in one provider is a schema that drifts. NULL reads as [] at
-- every call site.
--
-- staffChannelId gets its own column rather than an entry in the list above:
-- /private-channel has to find an existing staff channel by id to be
-- idempotent, and hunting it inside a JSON array would mean the id's meaning
-- lived in whichever code path last wrote it.

ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "createdChannelIds" JSONB;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "staffChannelId"    VARCHAR(19);
