-- Migration: 20260228000001_features
-- Adds: Category.autoAssign
-- Changes: Ticket.priority from ENUM to VARCHAR

-- Add autoAssign column to categories
ALTER TABLE `categories` ADD COLUMN `autoAssign` BOOLEAN NOT NULL DEFAULT FALSE;

-- Convert priority ENUM to VARCHAR (existing LOW/MEDIUM/HIGH values are preserved)
ALTER TABLE `tickets` MODIFY `priority` VARCHAR(50) NULL;
