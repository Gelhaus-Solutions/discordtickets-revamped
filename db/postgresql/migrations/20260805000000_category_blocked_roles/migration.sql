-- Migration: 20260805000000_category_blocked_roles
-- Changes: adds categories.blockedRoles, a per-category deny list of role IDs.
--          A member holding any of them cannot open a ticket in the category,
--          even if they also hold every role in requiredRoles.
--
-- Existing categories get an empty list, which is a no-op: the check in
-- src/lib/tickets/manager.js short-circuits on a zero-length list, so nobody's
-- current behaviour changes until they configure one.

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "blockedRoles" JSONB NOT NULL DEFAULT '[]';
