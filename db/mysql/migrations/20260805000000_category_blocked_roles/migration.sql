-- Migration: 20260805000000_category_blocked_roles
-- Adds:   categories.blockedRoles   (per-category deny list of role IDs)
--
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS`, and its DDL auto-commits per
-- statement, so the information_schema guard below keeps the column add
-- re-runnable — the same pattern as 20260728000000_panels.
--
-- Note there is no `DEFAULT` on the column: MySQL forbids a literal default on
-- a JSON column, so `@default("[]")` is applied client-side by Prisma, exactly
-- as it already is for `categories.requiredRoles`. Adding one here would make
-- `prisma migrate diff` report drift.
--
-- Added NULL, backfilled, then tightened to NOT NULL. Adding a NOT NULL JSON
-- column in one step fails on a table that already has rows, because JSON has
-- no implicit default to fill them with — and every existing install has
-- categories.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'blockedRoles') = 0,
    'ALTER TABLE `categories` ADD COLUMN `blockedRoles` JSON NULL',
    'DO 0'
);
PREPARE add_blocked_roles FROM @stmt;
EXECUTE add_blocked_roles;
DEALLOCATE PREPARE add_blocked_roles;

UPDATE `categories` SET `blockedRoles` = '[]' WHERE `blockedRoles` IS NULL;

ALTER TABLE `categories` MODIFY `blockedRoles` JSON NOT NULL;
