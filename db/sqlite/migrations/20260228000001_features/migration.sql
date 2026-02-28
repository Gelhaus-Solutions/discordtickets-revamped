-- Migration: 20260228000001_features
-- Adds: Category.autoAssign
-- Note: Ticket.priority was already stored as TEXT in SQLite — no change needed.

-- Add autoAssign column to categories
ALTER TABLE "categories" ADD COLUMN "autoAssign" BOOLEAN NOT NULL DEFAULT FALSE;
