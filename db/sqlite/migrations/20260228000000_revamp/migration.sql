-- AlterTable: Add channelMode, threadChannelId, backupCategoryId to categories
ALTER TABLE "categories" ADD COLUMN "channelMode" TEXT NOT NULL DEFAULT 'CHANNEL';
ALTER TABLE "categories" ADD COLUMN "threadChannelId" TEXT;
ALTER TABLE "categories" ADD COLUMN "backupCategoryId" INTEGER REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add htmlTranscript to tickets
ALTER TABLE "tickets" ADD COLUMN "htmlTranscript" TEXT;
