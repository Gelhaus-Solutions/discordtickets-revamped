-- Migration: 20260824000001_feedback_questions
-- See the postgresql copy of this migration for the rationale.
--
-- MySQL differences, all mechanical:
--   * no standalone enum type, so the QuestionType values live inline on each
--     column and adding one is a MODIFY. `questions.type` and the new
--     `feedbackAnswers.type` must therefore carry the same value list;
--   * no `ADD COLUMN IF NOT EXISTS`, so each add carries an information_schema
--     guard to stay re-runnable;
--   * DDL auto-commits per statement, so a half-completed run is a real state
--     and every statement here has to tolerate being run again.

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'guilds' AND COLUMN_NAME = 'feedbackQuestions') = 0,
    'ALTER TABLE `guilds` ADD COLUMN `feedbackQuestions` JSON NULL',
    'DO 0'
);
PREPARE add_guilds_feedbackquestions FROM @stmt;
EXECUTE add_guilds_feedbackquestions;
DEALLOCATE PREPARE add_guilds_feedbackquestions;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'feedbackQuestions') = 0,
    'ALTER TABLE `categories` ADD COLUMN `feedbackQuestions` JSON NULL',
    'DO 0'
);
PREPARE add_categories_feedbackquestions FROM @stmt;
EXECUTE add_categories_feedbackquestions;
DEALLOCATE PREPARE add_categories_feedbackquestions;

-- Widening the enum in place preserves every existing row.
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
    'TEXT_DISPLAY',
    'RATING'
) NOT NULL DEFAULT 'TEXT';

-- Dropping NOT NULL never rewrites data, so every existing rating survives.
ALTER TABLE `feedback` MODIFY COLUMN `rating` INT NULL;

CREATE TABLE IF NOT EXISTS `feedbackAnswers` (
    `id`         INTEGER      NOT NULL AUTO_INCREMENT,
    `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `label`      VARCHAR(45)  NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `ticketId`   VARCHAR(19)  NOT NULL,
    `type`       ENUM(
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
        'TEXT_DISPLAY',
        'RATING'
    ) NOT NULL,
    `value`      TEXT NULL,

    INDEX `feedbackAnswers_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @stmt := IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feedbackAnswers'
       AND CONSTRAINT_NAME = 'feedbackAnswers_ticketId_fkey') = 0,
    'ALTER TABLE `feedbackAnswers` ADD CONSTRAINT `feedbackAnswers_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `feedback`(`ticketId`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0'
);
PREPARE add_feedbackanswers_fk FROM @stmt;
EXECUTE add_feedbackanswers_fk;
DEALLOCATE PREPARE add_feedbackanswers_fk;
