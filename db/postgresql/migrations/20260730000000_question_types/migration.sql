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
-- ALTER TYPE ... ADD VALUE is transaction-safe here only because the new values
-- are not *used* anywhere in this migration; PostgreSQL rejects reading a value
-- added in the same transaction. The IF NOT EXISTS guards follow the
-- re-runnable convention set by 20260701000000_reopen_window.

ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'USER_SELECT';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'ROLE_SELECT';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'CHANNEL_SELECT';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'MENTIONABLE_SELECT';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'CHECKBOX';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'CHECKBOX_GROUP';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'RADIO_GROUP';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'FILE_UPLOAD';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'TEXT_DISPLAY';

ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "config" JSONB;
