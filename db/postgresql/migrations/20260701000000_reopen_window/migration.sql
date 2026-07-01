-- Migration: 20260701000000_reopen_window
-- Adds: guilds.reopenWindow (grace period in ms before a close becomes terminal; 0 = disabled)
--       tickets.pendingCloseAt (set while a ticket sits in its reopen grace window)

ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "reopenWindow" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "pendingCloseAt" TIMESTAMP(3);
