-- Migration: 20260814000001_category_staff_channel
-- Adds: categories.staffChannel — open a private staff-only thread or channel
--         alongside every ticket in this category
--       categories.staffChannelMode — how to make it, NULL meaning "the
--         sensible default for the ticket's own mode"
--       categories.staffChannelParent — where to put it, overriding that default
--
-- `staffChannel` is NOT NULL DEFAULT false rather than nullable-and-inheritable.
-- That is the one place this feature deviates from the surrounding columns, and
-- deliberately: the three-state trap `src/lib/settings/inheritance.js` exists to
-- police — NULL asks the level above, false is a decision, and only the resolver
-- can tell them apart — does not arise when there is no NULL. Nothing here needs
-- a `Guild` column, an INHERITED entry or a settings-page field, and adding a
-- server-wide default later is purely additive.
--
-- Existing categories get false, which is exactly what they do today.
--
-- The other two are nullable with no default: NULL is a real value for both
-- ("work it out from the ticket's own mode", "use the category's own parent"),
-- not an absence standing in for something else.

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "staffChannel"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "staffChannelMode"   "ChannelMode";
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "staffChannelParent" VARCHAR(19);
