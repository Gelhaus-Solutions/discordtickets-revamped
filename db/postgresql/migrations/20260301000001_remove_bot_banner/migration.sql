-- Migration: 20260301000001_remove_bot_banner
-- Removes: botBanner column (per-server banners are not supported by Discord API)

ALTER TABLE "guilds" DROP COLUMN IF EXISTS "botBanner";
