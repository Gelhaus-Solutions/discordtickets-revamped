-- Migration: 20260730000000_question_types
-- Adds: the non-TEXT QuestionType values, and questions.config
--
-- Category questions could only ever be text inputs: both modal builders
-- filtered on `type === 'TEXT'` because Discord modals held nothing else. Modals
-- now take Label components wrapping selects, checkboxes, radio groups and file
-- uploads, so the enum grows to cover them.
--
-- MENU keeps its name — it *is* the string select, and renaming it to
-- STRING_SELECT would mean migrating existing rows for no behavioural gain.
--
-- `config` holds the per-type extras that don't warrant a column each: the Label
-- description, CHANNEL_SELECT's allowed channel types, CHECKBOX's default state,
-- TEXT_DISPLAY's markdown. Nullable, so every existing row stays valid.
--
-- MySQL has no standalone enum type: the values live inline on the column, so
-- this is a MODIFY rather than the ALTER TYPE the PostgreSQL migration uses.
-- Widening an enum in place preserves existing rows. MySQL has no
-- `ADD COLUMN IF NOT EXISTS`, so `config` gets a procedure guard instead, to
-- keep the migration re-runnable after a half-completed run.

ALTER TABLE `questions` MODIFY COLUMN `type` ENUM(
    'MENU',
    'TEXT',
    'USER_SELECT',
    'ROLE_SELECT',
    'CHANNEL_SELECT',
    'MENTIONABLE_SELECT',
    'CHECKBOX',
    'CHECKBOX_GROUP',
    'RADIO_GROUP',
    'FILE_UPLOAD',
    'TEXT_DISPLAY'
) NOT NULL DEFAULT 'TEXT';

SET @add_config := (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'questions'
              AND COLUMN_NAME = 'config'
        ),
        'SELECT 1',
        'ALTER TABLE `questions` ADD COLUMN `config` JSON NULL'
    )
);
PREPARE stmt FROM @add_config;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
