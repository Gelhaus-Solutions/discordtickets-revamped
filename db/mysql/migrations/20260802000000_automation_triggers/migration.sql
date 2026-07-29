-- Migration: 20260802000000_automation_triggers
-- Changes: automations.triggerType/triggerKey -> automations.triggerTypes (a list)
--
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS` / `DROP COLUMN IF EXISTS`, so each
-- step goes through the information_schema + PREPARE guard established by
-- 20260726000000_restore_bot_banner, keeping the file re-runnable. The index
-- has to go before the column it covers.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'automations' AND COLUMN_NAME = 'triggerTypes') = 0,
    'ALTER TABLE `automations` ADD COLUMN `triggerTypes` JSON NULL',
    'DO 0'
);
PREPARE add_trigger_types FROM @stmt; EXECUTE add_trigger_types; DEALLOCATE PREPARE add_trigger_types;

-- Backfill: one trigger becomes a one-element list.
SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'automations' AND COLUMN_NAME = 'triggerType') = 1,
    'UPDATE `automations` SET `triggerTypes` = JSON_ARRAY(`triggerType`) WHERE `triggerTypes` IS NULL',
    'DO 0'
);
PREPARE backfill_trigger_types FROM @stmt; EXECUTE backfill_trigger_types; DEALLOCATE PREPARE backfill_trigger_types;

ALTER TABLE `automations` MODIFY `triggerTypes` JSON NOT NULL;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'automations'
       AND INDEX_NAME = 'automations_guildId_triggerType_enabled_idx') > 0,
    'DROP INDEX `automations_guildId_triggerType_enabled_idx` ON `automations`',
    'DO 0'
);
PREPARE drop_trigger_idx FROM @stmt; EXECUTE drop_trigger_idx; DEALLOCATE PREPARE drop_trigger_idx;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'automations' AND COLUMN_NAME = 'triggerType') = 1,
    'ALTER TABLE `automations` DROP COLUMN `triggerType`',
    'DO 0'
);
PREPARE drop_trigger_type FROM @stmt; EXECUTE drop_trigger_type; DEALLOCATE PREPARE drop_trigger_type;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'automations' AND COLUMN_NAME = 'triggerKey') = 1,
    'ALTER TABLE `automations` DROP COLUMN `triggerKey`',
    'DO 0'
);
PREPARE drop_trigger_key FROM @stmt; EXECUTE drop_trigger_key; DEALLOCATE PREPARE drop_trigger_key;
