-- Migration: 20260810000000_inheritable_category_defaults
-- Adds:    guilds.<9 category-default columns> — the server-wide values a
--          category falls back to.
-- Changes: the matching categories.* columns become nullable and lose their
--          defaults, where NULL now means "inherit from the guild" (and the
--          guild's own NULL means "use the built-in", which lives in
--          src/lib/settings/inheritance.js).
--
-- Nothing about an existing install changes. Every guild row gets NULL on the
-- new columns, which resolves to the same built-in the code has always used.
-- Every existing category row already holds a concrete value for each of the
-- columns below, so none of them start inheriting: an admin has to clear a
-- field before a server default reaches it. That is deliberate — a category
-- whose pingRoles is `[]` today chose to ping nobody, and an upgrade must not
-- turn that into "ping whatever the server default becomes".
--
-- The DEFAULTs are dropped as well as the NOT NULLs. A column that keeps its
-- default is filled in by Prisma on every create, so "inherit" would be
-- unreachable for new categories — the one failure here that has no other
-- symptom.

ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "blockedRoles"  JSONB;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "channelName"   TEXT;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "cooldown"      INTEGER;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "memberLimit"   INTEGER;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "pingRoles"     JSONB;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "ratelimit"     INTEGER;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "requiredRoles" JSONB;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "staffRoles"    JSONB;
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "totalLimit"    INTEGER;

-- DROP NOT NULL and DROP DEFAULT are both no-ops when already applied, so this
-- half needs no guard to stay re-runnable.
ALTER TABLE "categories" ALTER COLUMN "channelName"   DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "staffRoles"    DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "memberLimit"   DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "memberLimit"   DROP DEFAULT;
ALTER TABLE "categories" ALTER COLUMN "totalLimit"    DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "totalLimit"    DROP DEFAULT;
ALTER TABLE "categories" ALTER COLUMN "pingRoles"     DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "pingRoles"     DROP DEFAULT;
ALTER TABLE "categories" ALTER COLUMN "requiredRoles" DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "requiredRoles" DROP DEFAULT;
ALTER TABLE "categories" ALTER COLUMN "blockedRoles"  DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "blockedRoles"  DROP DEFAULT;

-- cooldown and ratelimit were already nullable, and NULL meant "no cooldown" /
-- "slow mode off" — a choice, not an absence. Under the new rules NULL means
-- inherit, so without this an admin setting a server-wide cooldown would give
-- one to every category that had deliberately gone without. 0 is the same
-- effective value (see the `if (category.cooldown)` in src/lib/tickets/manager.js
-- and the rateLimitPerUser it passes to Discord) but is an override rather than
-- an inherit.
--
-- This is the one statement in this file that would do damage if the migration
-- were replayed against a database where someone has since chosen to inherit.
-- `prisma migrate deploy` never re-runs an applied migration; the guards
-- elsewhere here are for the partially-applied case, not for replay.
UPDATE "categories" SET "cooldown"  = 0 WHERE "cooldown"  IS NULL;
UPDATE "categories" SET "ratelimit" = 0 WHERE "ratelimit" IS NULL;
