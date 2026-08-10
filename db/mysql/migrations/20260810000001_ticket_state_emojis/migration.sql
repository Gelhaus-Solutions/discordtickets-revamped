-- Migration: 20260810000001_ticket_state_emojis
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` and auto-commits per DDL statement,
-- so each add carries an information_schema guard to stay re-runnable — the
-- same pattern as 20260805000000_category_blocked_roles.
--
-- Every column is nullable with no DEFAULT, so unlike blockedRoles there is
-- nothing to backfill and no NOT NULL tightening step. (MySQL would forbid a
-- literal DEFAULT on the JSON columns anyway.)

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'claimedEmoji') = 0,
    'ALTER TABLE `categories` ADD COLUMN `claimedEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_categories_claimedemoji FROM @stmt;
EXECUTE add_categories_claimedemoji;
DEALLOCATE PREPARE add_categories_claimedemoji;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'closedEmoji') = 0,
    'ALTER TABLE `categories` ADD COLUMN `closedEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_categories_closedemoji FROM @stmt;
EXECUTE add_categories_closedemoji;
DEALLOCATE PREPARE add_categories_closedemoji;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'unclaimedEmoji') = 0,
    'ALTER TABLE `categories` ADD COLUMN `unclaimedEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_categories_unclaimedemoji FROM @stmt;
EXECUTE add_categories_unclaimedemoji;
DEALLOCATE PREPARE add_categories_unclaimedemoji;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'priorityEmojis') = 0,
    'ALTER TABLE `categories` ADD COLUMN `priorityEmojis` JSON NULL',
    'DO 0'
);
PREPARE add_categories_priorityemojis FROM @stmt;
EXECUTE add_categories_priorityemojis;
DEALLOCATE PREPARE add_categories_priorityemojis;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'claimedEmoji') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `claimedEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_guilds_claimedemoji FROM @stmt;
EXECUTE add_guilds_claimedemoji;
DEALLOCATE PREPARE add_guilds_claimedemoji;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'closedEmoji') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `closedEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_guilds_closedemoji FROM @stmt;
EXECUTE add_guilds_closedemoji;
DEALLOCATE PREPARE add_guilds_closedemoji;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'unclaimedEmoji') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `unclaimedEmoji` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_guilds_unclaimedemoji FROM @stmt;
EXECUTE add_guilds_unclaimedemoji;
DEALLOCATE PREPARE add_guilds_unclaimedemoji;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'priorityEmojis') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `priorityEmojis` JSON NULL',
    'DO 0'
);
PREPARE add_guilds_priorityemojis FROM @stmt;
EXECUTE add_guilds_priorityemojis;
DEALLOCATE PREPARE add_guilds_priorityemojis;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'emojiOverride') = 0,
    'ALTER TABLE `tickets` ADD COLUMN `emojiOverride` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_tickets_emojioverride FROM @stmt;
EXECUTE add_tickets_emojioverride;
DEALLOCATE PREPARE add_tickets_emojioverride;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'emojiOverrideScope') = 0,
    'ALTER TABLE `tickets` ADD COLUMN `emojiOverrideScope` VARCHAR(191) NULL',
    'DO 0'
);
PREPARE add_tickets_emojioverridescope FROM @stmt;
EXECUTE add_tickets_emojioverridescope;
DEALLOCATE PREPARE add_tickets_emojioverridescope;
