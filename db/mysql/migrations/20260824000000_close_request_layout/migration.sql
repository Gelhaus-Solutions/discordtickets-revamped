-- Migration: 20260824000000_close_request_layout
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so each add carries an information_schema guard to stay re-runnable.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'closeRequestLayout') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `closeRequestLayout` JSON NULL',
    'DO 0'
);
PREPARE add_guilds_closerequestlayout FROM @stmt;
EXECUTE add_guilds_closerequestlayout;
DEALLOCATE PREPARE add_guilds_closerequestlayout;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'closeRequestLayout') = 0,
    'ALTER TABLE `categories` ADD COLUMN `closeRequestLayout` JSON NULL',
    'DO 0'
);
PREPARE add_categories_closerequestlayout FROM @stmt;
EXECUTE add_categories_closerequestlayout;
DEALLOCATE PREPARE add_categories_closerequestlayout;
