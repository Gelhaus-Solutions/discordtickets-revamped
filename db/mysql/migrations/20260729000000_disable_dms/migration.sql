-- Migration: 20260729000000_disable_dms
-- Adds: guilds.disableDMs (server-wide kill switch for every DM path: the ticket
--       closed notification, the DM ticket-creation flow, and transcript delivery
--       in DMs; false = current behaviour)
--
-- MySQL has no `ADD COLUMN IF NOT EXISTS`, and its DDL auto-commits per
-- statement (so a re-run cannot be rolled back the way Postgres would).
-- The information_schema guard below keeps this re-runnable.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'disableDMs') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `disableDMs` BOOLEAN NOT NULL DEFAULT false',
    'DO 0'
);
PREPARE disable_dms FROM @stmt;
EXECUTE disable_dms;
DEALLOCATE PREPARE disable_dms;
