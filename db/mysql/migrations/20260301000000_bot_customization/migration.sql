-- Migration: 20260301000000_bot_customization
-- Adds: Per-server bot appearance customization (username, avatar, banner, bio)
-- Adds: Close with Reason button toggle

-- Add bot customization columns to guilds
ALTER TABLE `guilds` ADD COLUMN `botAvatar` LONGTEXT NULL;
ALTER TABLE `guilds` ADD COLUMN `botBio` LONGTEXT NULL;
ALTER TABLE `guilds` ADD COLUMN `botBanner` LONGTEXT NULL;
ALTER TABLE `guilds` ADD COLUMN `botUsername` VARCHAR(255) NULL;

-- Add closeReasonButton toggle to guilds
ALTER TABLE `guilds` ADD COLUMN `closeReasonButton` BOOLEAN NOT NULL DEFAULT FALSE;
