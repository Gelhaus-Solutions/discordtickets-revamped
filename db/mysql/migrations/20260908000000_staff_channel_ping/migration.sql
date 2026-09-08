-- Migration: 20260908000000_staff_channel_ping
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so the add carries an information_schema guard to stay re-runnable.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'staffChannelPing') = 0,
    'ALTER TABLE `categories` ADD COLUMN `staffChannelPing` BOOLEAN NOT NULL DEFAULT false',
    'DO 0'
);
PREPARE add_categories_staffchannelping FROM @stmt;
EXECUTE add_categories_staffchannelping;
DEALLOCATE PREPARE add_categories_staffchannelping;
