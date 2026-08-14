-- Migration: 20260814000001_category_staff_channel
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so each add carries an information_schema guard to stay re-runnable.
--
-- `staffChannelMode` is an inline ENUM rather than a named type, which is how
-- this schema has always carried ChannelMode (see 20260228000000_revamp) — MySQL
-- has no CREATE TYPE. It is nullable here, unlike `channelMode`, because NULL is
-- a real value meaning "work it out from the ticket's own mode".

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'staffChannel') = 0,
    'ALTER TABLE `categories` ADD COLUMN `staffChannel` BOOLEAN NOT NULL DEFAULT false',
    'DO 0'
);
PREPARE add_categories_staffchannel FROM @stmt;
EXECUTE add_categories_staffchannel;
DEALLOCATE PREPARE add_categories_staffchannel;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'staffChannelMode') = 0,
    'ALTER TABLE `categories` ADD COLUMN `staffChannelMode` ENUM(''CHANNEL'', ''THREAD'', ''FORUM'') NULL',
    'DO 0'
);
PREPARE add_categories_staffchannelmode FROM @stmt;
EXECUTE add_categories_staffchannelmode;
DEALLOCATE PREPARE add_categories_staffchannelmode;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'staffChannelParent') = 0,
    'ALTER TABLE `categories` ADD COLUMN `staffChannelParent` VARCHAR(19) NULL',
    'DO 0'
);
PREPARE add_categories_staffchannelparent FROM @stmt;
EXECUTE add_categories_staffchannelparent;
DEALLOCATE PREPARE add_categories_staffchannelparent;
