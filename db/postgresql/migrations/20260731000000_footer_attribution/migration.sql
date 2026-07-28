-- Migration: 20260731000000_footer_attribution
-- Changes: guilds.footer default from "Discord Tickets by eartharoid" to
--          "Discord Tickets by eartharoid™ & egelhaus™" (new guilds only), and
--          migrates guilds still carrying the old untouched default so the fork
--          attribution is consistent. Guilds with a custom footer are untouched.

ALTER TABLE "guilds" ALTER COLUMN "footer" SET DEFAULT 'Discord Tickets by eartharoid™ & egelhaus™';

UPDATE "guilds"
SET "footer" = 'Discord Tickets by eartharoid™ & egelhaus™'
WHERE "footer" = 'Discord Tickets by eartharoid';
