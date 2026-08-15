-- Migration: 20260815000000_skip_close_request
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so each add carries an information_schema guard to stay re-runnable.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'skipCloseRequest') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `skipCloseRequest` BOOLEAN NULL',
    'DO 0'
);
PREPARE add_guilds_skipcloserequest FROM @stmt;
EXECUTE add_guilds_skipcloserequest;
DEALLOCATE PREPARE add_guilds_skipcloserequest;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'skipCloseRequest') = 0,
    'ALTER TABLE `categories` ADD COLUMN `skipCloseRequest` BOOLEAN NULL',
    'DO 0'
);
PREPARE add_categories_skipcloserequest FROM @stmt;
EXECUTE add_categories_skipcloserequest;
DEALLOCATE PREPARE add_categories_skipcloserequest;
