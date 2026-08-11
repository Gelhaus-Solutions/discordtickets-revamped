-- Migration: 20260811000000_awaiting_response
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so each add carries an information_schema guard to stay re-runnable — the
-- same pattern as 20260810000001_ticket_state_emojis.
--
-- Every column is nullable with no DEFAULT, so there is nothing to backfill
-- and no NOT NULL tightening step.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'awaitingResponseFrom') = 0,
    'ALTER TABLE `tickets` ADD COLUMN `awaitingResponseFrom` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_tickets_awaitingresponsefrom FROM @stmt;
EXECUTE add_tickets_awaitingresponsefrom;
DEALLOCATE PREPARE add_tickets_awaitingresponsefrom;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'awaitingStaffEmoji') = 0,
    'ALTER TABLE `categories` ADD COLUMN `awaitingStaffEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_categories_awaitingstaffemoji FROM @stmt;
EXECUTE add_categories_awaitingstaffemoji;
DEALLOCATE PREPARE add_categories_awaitingstaffemoji;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'awaitingStaffEmoji') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `awaitingStaffEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_guilds_awaitingstaffemoji FROM @stmt;
EXECUTE add_guilds_awaitingstaffemoji;
DEALLOCATE PREPARE add_guilds_awaitingstaffemoji;
