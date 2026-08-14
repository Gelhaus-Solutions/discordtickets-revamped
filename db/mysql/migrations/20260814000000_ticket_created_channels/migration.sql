-- Migration: 20260814000000_ticket_created_channels
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so each add carries an information_schema guard to stay re-runnable — the
-- same pattern as 20260811000000_awaiting_response.
--
-- Both columns are nullable with no DEFAULT, so there is nothing to backfill
-- and no NOT NULL tightening step. JSON is the one type MySQL refuses to give
-- a DEFAULT at all, which is why the postgresql copy does not have one either.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'createdChannelIds') = 0,
    'ALTER TABLE `tickets` ADD COLUMN `createdChannelIds` JSON NULL',
    'DO 0'
);
PREPARE add_tickets_createdchannelids FROM @stmt;
EXECUTE add_tickets_createdchannelids;
DEALLOCATE PREPARE add_tickets_createdchannelids;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'staffChannelId') = 0,
    'ALTER TABLE `tickets` ADD COLUMN `staffChannelId` VARCHAR(19) NULL',
    'DO 0'
);
PREPARE add_tickets_staffchannelid FROM @stmt;
EXECUTE add_tickets_staffchannelid;
DEALLOCATE PREPARE add_tickets_staffchannelid;
