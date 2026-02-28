-- AlterTable: Add channelMode, threadChannelId, backupCategoryId to categories
ALTER TABLE `categories`
    ADD COLUMN `channelMode` ENUM('CHANNEL', 'THREAD', 'FORUM') NOT NULL DEFAULT 'CHANNEL',
    ADD COLUMN `threadChannelId` VARCHAR(19) NULL,
    ADD COLUMN `backupCategoryId` INT NULL;

-- AlterTable: Add htmlTranscript to tickets
ALTER TABLE `tickets`
    ADD COLUMN `htmlTranscript` TEXT NULL;

-- AddForeignKey: Category backup self-reference
ALTER TABLE `categories` ADD CONSTRAINT `categories_backupCategoryId_fkey`
    FOREIGN KEY (`backupCategoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
