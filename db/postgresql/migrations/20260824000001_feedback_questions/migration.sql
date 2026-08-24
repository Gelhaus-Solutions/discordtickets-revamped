-- Migration: 20260824000001_feedback_questions
-- Adds: guilds.feedbackQuestions     — the server-wide feedback form
--       categories.feedbackQuestions — the per-category override
--       feedbackAnswers              — one row per answered question
--       QuestionType.RATING          — a 1-to-N scale
-- Alters: feedback.rating is now nullable
--
-- The feedback form was two hard-coded text inputs: a 1-5 rating and an optional
-- comment, labelled from i18n rather than from the database. A server could not
-- ask anything else. It is now a question set of the same shape a category's
-- ticket questions use, so the whole builder, validator and modal renderer in
-- `src/lib/tickets/questions.js` are reused rather than duplicated.
--
-- Both columns are nullable JSON with no default, the shape every inheritable
-- setting in this schema has (see `src/lib/settings/inheritance.js`). NULL means
-- "ask the level above", and NULL at both levels resolves to the built-in
-- rating-and-comment form — which is exactly what every existing server has, so
-- nothing changes on upgrade and no row needs backfilling. An empty array is a
-- different answer, and a deliberate one: ask nothing at all.
--
-- ## Why feedback.rating becomes nullable
--
-- A form need not contain a rating question any more, so "no rating" has to be
-- expressible. It is not the same as zero, and every reader has to keep the two
-- apart — `getAvgRating` already filters on `typeof r === 'number'`, and the
-- `ratingBelow` automation filter had to grow the same guard, because
-- `null < 3` is true.
--
-- Existing rows all have a rating and keep it: dropping NOT NULL never rewrites
-- data, and no default is added, so a row written before this migration and one
-- written after are indistinguishable.
--
-- ## Why feedbackAnswers has no foreign key to a question
--
-- The questions live in a JSON column, so there is no row to point at. `label`
-- and `type` are snapshotted instead, which is also what makes an answer outlive
-- the question being reworded or deleted — a stored answer records what somebody
-- was actually asked, and editing the form must not rewrite history.
--
-- The cascade is from `feedback`, whose primary key is `ticketId`, so deleting a
-- submission takes its answers with it.

ALTER TABLE "guilds"     ADD COLUMN IF NOT EXISTS "feedbackQuestions" JSONB;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "feedbackQuestions" JSONB;

ALTER TABLE "feedback" ALTER COLUMN "rating" DROP NOT NULL;

ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'RATING';

CREATE TABLE IF NOT EXISTS "feedbackAnswers" (
    "id"         SERIAL       NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label"      VARCHAR(45)  NOT NULL,
    "questionId" TEXT         NOT NULL,
    "ticketId"   VARCHAR(19)  NOT NULL,
    "type"       "QuestionType" NOT NULL,
    "value"      TEXT,

    CONSTRAINT "feedbackAnswers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "feedbackAnswers_ticketId_idx" ON "feedbackAnswers"("ticketId");

DO $$
BEGIN
    ALTER TABLE "feedbackAnswers"
        ADD CONSTRAINT "feedbackAnswers_ticketId_fkey"
        FOREIGN KEY ("ticketId") REFERENCES "feedback"("ticketId")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
