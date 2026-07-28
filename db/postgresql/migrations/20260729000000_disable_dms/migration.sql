-- Migration: 20260729000000_disable_dms
-- Adds: guilds.disableDMs (server-wide kill switch for every DM path: the ticket
--       closed notification, the DM ticket-creation flow, and transcript delivery
--       in DMs; false = current behaviour)

ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "disableDMs" BOOLEAN NOT NULL DEFAULT false;
