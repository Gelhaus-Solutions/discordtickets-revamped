-- Migration: 20260801000000_automations
-- Adds:   automations     (per-guild user-defined trigger/condition/action graphs)
--         automationRuns  (one row per execution, for the dashboard run log)
--
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL differences, all of them forced:
--   * No standalone enum type — the values are inlined on the column, the same
--     way this schema already handles ChannelMode and QuestionType.
--   * No `DEFAULT` on a JSON column, so `automationRuns.steps` has none and
--     Prisma applies the client-side default instead. Adding one would make
--     `prisma migrate diff` report drift — the same trap documented in
--     20260728000000_panels for panels.categories.
--   * `String @id @default(uuid())` maps to VARCHAR(191), not TEXT.
--   * No `ADD CONSTRAINT IF NOT EXISTS`, so the foreign keys go through the
--     information_schema + PREPARE/EXECUTE guard established by
--     20260726000000_restore_bot_banner, keeping this file re-runnable.
--
-- `key` is a reserved word in MySQL. Every reference to it here is backticked;
-- an unquoted one is a syntax error rather than a silent mistake, but it is
-- easy to miss when editing, so: keep the backticks.

-- CreateTable
CREATE TABLE IF NOT EXISTS `automations` (
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(19) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `graph` JSON NOT NULL,
    `guildId` VARCHAR(19) NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(12) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `triggerKey` VARCHAR(100) NULL,
    `triggerType` VARCHAR(64) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `automations_guildId_key_key`(`guildId`, `key`),
    INDEX `automations_guildId_enabled_idx`(`guildId`, `enabled`),
    INDEX `automations_guildId_triggerType_enabled_idx`(`guildId`, `triggerType`, `enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `automationRuns` (
    `automationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `durationMs` INTEGER NULL,
    `error` TEXT NULL,
    `finishedAt` DATETIME(3) NULL,
    `guildId` VARCHAR(19) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('RUNNING', 'SUSPENDED', 'SUCCESS', 'FAILED', 'SKIPPED', 'CANCELLED') NOT NULL DEFAULT 'RUNNING',
    `steps` JSON NOT NULL,
    `ticketId` VARCHAR(19) NULL,
    `triggerType` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(19) NULL,

    INDEX `automationRuns_guildId_createdAt_idx`(`guildId`, `createdAt`),
    INDEX `automationRuns_automationId_createdAt_idx`(`automationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'automations'
       AND CONSTRAINT_NAME = 'automations_guildId_fkey') = 0,
    'ALTER TABLE `automations` ADD CONSTRAINT `automations_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guilds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0'
);
PREPARE add_automations_guild_fk FROM @stmt;
EXECUTE add_automations_guild_fk;
DEALLOCATE PREPARE add_automations_guild_fk;

-- AddForeignKey
SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'automationRuns'
       AND CONSTRAINT_NAME = 'automationRuns_automationId_fkey') = 0,
    'ALTER TABLE `automationRuns` ADD CONSTRAINT `automationRuns_automationId_fkey` FOREIGN KEY (`automationId`) REFERENCES `automations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0'
);
PREPARE add_automation_runs_fk FROM @stmt;
EXECUTE add_automation_runs_fk;
DEALLOCATE PREPARE add_automation_runs_fk;
