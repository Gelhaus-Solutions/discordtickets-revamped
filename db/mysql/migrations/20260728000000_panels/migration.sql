-- Migration: 20260728000000_panels
-- Adds:   panels                      (tracked ticket panels; `layout` is a Components v2 block layout)
--         categories.messageLayout    (the same block-layout shape, for the ticket opening message)
--
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS`, and its DDL auto-commits per
-- statement, so the information_schema guard below keeps the column add
-- re-runnable — the same pattern as 20260726000000_restore_bot_banner.
--
-- Note there is no `DEFAULT` on `panels.categories`: MySQL forbids a literal
-- default on a JSON column, so `@default("[]")` is applied client-side by
-- Prisma, exactly as it already is for `categories.pingRoles`. Adding one here
-- would make `prisma migrate diff` report drift.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'messageLayout') = 0,
    'ALTER TABLE `categories` ADD COLUMN `messageLayout` JSON NULL',
    'DO 0'
);
PREPARE add_message_layout FROM @stmt;
EXECUTE add_message_layout;
DEALLOCATE PREPARE add_message_layout;

-- CreateTable
CREATE TABLE `panels` (
    `categories` JSON NOT NULL,
    `channelId` VARCHAR(19) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(19) NULL,
    `guildId` VARCHAR(19) NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `layout` JSON NOT NULL,
    `messageId` VARCHAR(19) NULL,
    `name` VARCHAR(100) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `panels_guildId_idx`(`guildId`),
    UNIQUE INDEX `panels_messageId_key`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `panels` ADD CONSTRAINT `panels_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guilds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing opening messages into the equivalent block layout. See the
-- postgresql copy for what the shape means; `openingMessage` is left in place
-- and a NULL `messageLayout` remains a supported state at runtime.
UPDATE `categories` SET `messageLayout` = JSON_OBJECT(
    'version', 1,
    'blocks', JSON_MERGE_PRESERVE(
        JSON_ARRAY(
            JSON_OBJECT('id', 'mig-mentions', 'type', 'mentions'),
            JSON_OBJECT(
                'id', 'mig-container',
                'type', 'container',
                'accentColour', NULL,
                'blocks', JSON_MERGE_PRESERVE(
                    JSON_ARRAY(
                        JSON_OBJECT(
                            'id', 'mig-section',
                            'type', 'section',
                            'text', JSON_ARRAY(COALESCE(NULLIF(`openingMessage`, ''), ' ')),
                            'accessory', JSON_OBJECT(
                                'kind', 'thumbnail',
                                'url', '{avatar}',
                                'description', 'Ticket creator'
                            )
                        )
                    ),
                    IF(`image` IS NULL OR `image` = '',
                        JSON_ARRAY(),
                        JSON_ARRAY(JSON_OBJECT(
                            'id', 'mig-image',
                            'type', 'gallery',
                            'items', JSON_ARRAY(JSON_OBJECT('url', `image`))
                        ))
                    ),
                    JSON_ARRAY(
                        JSON_OBJECT('id', 'mig-answers', 'type', 'answers'),
                        JSON_OBJECT('id', 'mig-separator', 'type', 'separator', 'divider', TRUE, 'spacing', 'small'),
                        JSON_OBJECT('id', 'mig-footer', 'type', 'footer')
                    )
                )
            )
        ),
        JSON_ARRAY(JSON_OBJECT('id', 'mig-controls', 'type', 'controls'))
    )
)
WHERE `messageLayout` IS NULL;
