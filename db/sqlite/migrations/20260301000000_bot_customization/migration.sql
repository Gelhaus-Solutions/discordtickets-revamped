-- Migration: 20260301000000_bot_customization
-- Adds: Per-server bot appearance customization (username, avatar, banner, bio)
-- Adds: Close with Reason button toggle

-- Add bot customization columns to guilds
ALTER TABLE "guilds" ADD COLUMN "botAvatar" TEXT;
ALTER TABLE "guilds" ADD COLUMN "botBio" TEXT;
ALTER TABLE "guilds" ADD COLUMN "botBanner" TEXT;
ALTER TABLE "guilds" ADD COLUMN "botUsername" TEXT;

-- Add closeReasonButton toggle to guilds
ALTER TABLE "guilds" ADD COLUMN "closeReasonButton" INTEGER NOT NULL DEFAULT 0;
