-- Migration: 20260726000000_restore_bot_banner
-- Restores: guilds.botBanner
--
-- 20260301000001_remove_bot_banner dropped this column on the premise that
-- Discord does not support per-guild bot banners. That is incorrect: the
-- Modify Current Member endpoint (PATCH /guilds/{guild.id}/members/@me)
-- accepts `nick`, `avatar`, `banner` and `bio`. The column is restored here
-- rather than by editing the earlier migrations, whose checksums are already
-- recorded in `_prisma_migrations` on deployed databases.

ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "botBanner" TEXT;
