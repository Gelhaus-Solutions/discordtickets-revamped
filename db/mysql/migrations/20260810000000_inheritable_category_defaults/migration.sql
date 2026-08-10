-- Migration: 20260810000000_inheritable_category_defaults
-- Adds:    guilds.<9 category-default columns>
-- Changes: the matching categories.* columns become nullable and lose their
--          defaults.
--
-- See the postgresql copy of this migration for the full rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so each add carries an information_schema guard to stay re-runnable — the
-- same pattern as 20260805000000_category_blocked_roles.
--
-- No DEFAULT on any column. MySQL forbids a literal default on a JSON column,
-- and none of these keep a default anyway: a default would make "inherit"
-- unreachable, because Prisma fills it in on every create.
--
-- Unlike blockedRoles, none of the new JSON columns need the
-- add-NULL / backfill / MODIFY-NOT-NULL dance. They are nullable by design, and
-- NULL is exactly the value existing rows should get.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'blockedRoles') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `blockedRoles` JSON NULL',
    'DO 0'
);
PREPARE add_guild_blocked_roles FROM @stmt;
EXECUTE add_guild_blocked_roles;
DEALLOCATE PREPARE add_guild_blocked_roles;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'channelName') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `channelName` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_guild_channel_name FROM @stmt;
EXECUTE add_guild_channel_name;
DEALLOCATE PREPARE add_guild_channel_name;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'cooldown') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `cooldown` INT NULL',
    'DO 0'
);
PREPARE add_guild_cooldown FROM @stmt;
EXECUTE add_guild_cooldown;
DEALLOCATE PREPARE add_guild_cooldown;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'memberLimit') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `memberLimit` INT NULL',
    'DO 0'
);
PREPARE add_guild_member_limit FROM @stmt;
EXECUTE add_guild_member_limit;
DEALLOCATE PREPARE add_guild_member_limit;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'pingRoles') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `pingRoles` JSON NULL',
    'DO 0'
);
PREPARE add_guild_ping_roles FROM @stmt;
EXECUTE add_guild_ping_roles;
DEALLOCATE PREPARE add_guild_ping_roles;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'ratelimit') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `ratelimit` INT NULL',
    'DO 0'
);
PREPARE add_guild_ratelimit FROM @stmt;
EXECUTE add_guild_ratelimit;
DEALLOCATE PREPARE add_guild_ratelimit;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'requiredRoles') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `requiredRoles` JSON NULL',
    'DO 0'
);
PREPARE add_guild_required_roles FROM @stmt;
EXECUTE add_guild_required_roles;
DEALLOCATE PREPARE add_guild_required_roles;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'staffRoles') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `staffRoles` JSON NULL',
    'DO 0'
);
PREPARE add_guild_staff_roles FROM @stmt;
EXECUTE add_guild_staff_roles;
DEALLOCATE PREPARE add_guild_staff_roles;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'totalLimit') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `totalLimit` INT NULL',
    'DO 0'
);
PREPARE add_guild_total_limit FROM @stmt;
EXECUTE add_guild_total_limit;
DEALLOCATE PREPARE add_guild_total_limit;

-- MODIFY restates the whole column definition, so omitting NOT NULL and DEFAULT
-- drops both. Idempotent: re-running produces the same definition.
ALTER TABLE `categories` MODIFY `channelName`   VARCHAR(191) NULL;
ALTER TABLE `categories` MODIFY `staffRoles`    JSON NULL;
ALTER TABLE `categories` MODIFY `memberLimit`   INT NULL;
ALTER TABLE `categories` MODIFY `totalLimit`    INT NULL;
ALTER TABLE `categories` MODIFY `pingRoles`     JSON NULL;
ALTER TABLE `categories` MODIFY `requiredRoles` JSON NULL;
ALTER TABLE `categories` MODIFY `blockedRoles`  JSON NULL;

-- See the postgresql copy: NULL used to mean "off" for these two, and now means
-- "inherit", so the choice has to be written down as 0 before a server-wide
-- default can exist. The one statement here that replay would damage.
UPDATE `categories` SET `cooldown`  = 0 WHERE `cooldown`  IS NULL;
UPDATE `categories` SET `ratelimit` = 0 WHERE `ratelimit` IS NULL;
