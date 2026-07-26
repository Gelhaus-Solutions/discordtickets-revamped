-- Migration: 20260726000000_restore_bot_banner
-- Restores: guilds.botBanner
--
-- 20260301000001_remove_bot_banner dropped this column on the premise that
-- Discord does not support per-guild bot banners. That is incorrect: the
-- Modify Current Member endpoint (PATCH /guilds/{guild.id}/members/@me)
-- accepts `nick`, `avatar`, `banner` and `bio`. The column is restored here
-- rather than by editing the earlier migrations, whose checksums are already
-- recorded in `_prisma_migrations` on deployed databases.
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS`, and its DDL auto-commits per
-- statement (so a re-run cannot be rolled back the way Postgres would).
-- The information_schema guard below keeps this re-runnable.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'botBanner') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `botBanner` LONGTEXT NULL',
    'DO 0'
);
PREPARE restore_bot_banner FROM @stmt;
EXECUTE restore_bot_banner;
DEALLOCATE PREPARE restore_bot_banner;
