-- CreateEnum
CREATE TYPE "ChannelMode" AS ENUM ('CHANNEL', 'THREAD', 'FORUM');

-- AlterTable: Add channelMode, threadChannelId, backupCategoryId to categories
ALTER TABLE "categories"
    ADD COLUMN "channelMode" "ChannelMode" NOT NULL DEFAULT 'CHANNEL',
    ADD COLUMN "threadChannelId" VARCHAR(19),
    ADD COLUMN "backupCategoryId" INTEGER;

-- AlterTable: Add htmlTranscript to tickets
ALTER TABLE "tickets"
    ADD COLUMN "htmlTranscript" TEXT;

-- AddForeignKey: Category backup self-reference
ALTER TABLE "categories" ADD CONSTRAINT "categories_backupCategoryId_fkey"
    FOREIGN KEY ("backupCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
