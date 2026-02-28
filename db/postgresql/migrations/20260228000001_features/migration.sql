-- Migration: 20260228000001_features
-- Adds: Category.autoAssign
-- Changes: Ticket.priority from TicketPriority enum to TEXT

-- Add autoAssign column to categories
ALTER TABLE "categories" ADD COLUMN "autoAssign" BOOLEAN NOT NULL DEFAULT FALSE;

-- Convert priority from enum to text, then drop the old enum type
ALTER TABLE "tickets" ALTER COLUMN "priority" TYPE TEXT USING "priority"::TEXT;

DROP TYPE IF EXISTS "TicketPriority";
