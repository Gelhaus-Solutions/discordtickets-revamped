-- Migration: 20260728000000_panels
-- Adds:   panels                      (tracked ticket panels; `layout` is a Components v2 block layout)
--         categories.messageLayout    (the same block-layout shape, for the ticket opening message)
--
-- Panels used to be fire-and-forget: the API built a message, sent it, and kept
-- no record, so they could never be listed, edited or deleted. This table is
-- what makes them manageable — `messageId` is the handle used to edit the panel
-- in place, and is set back to NULL when the message disappears from Discord so
-- the dashboard can offer to re-send it.
--
-- The `IF NOT EXISTS` guard on the column matches the convention established by
-- 20260701000000_reopen_window and 20260726000000_restore_bot_banner: a
-- migration that died half-way through must be re-runnable.

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "messageLayout" JSONB;

-- CreateTable
CREATE TABLE "panels" (
    "categories" JSONB NOT NULL DEFAULT '[]',
    "channelId" VARCHAR(19) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" VARCHAR(19),
    "guildId" VARCHAR(19) NOT NULL,
    "id" SERIAL NOT NULL,
    "layout" JSONB NOT NULL,
    "messageId" VARCHAR(19),
    "name" VARCHAR(100) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "panels_guildId_idx" ON "panels"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "panels_messageId_key" ON "panels"("messageId");

-- AddForeignKey
ALTER TABLE "panels" ADD CONSTRAINT "panels_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill every existing category's opening message into the block layout that
-- renders identically to the pre-v2 embed: the ping line, then a coloured
-- container holding the message beside the creator's avatar, the category image
-- (when set), the topic/answers, a separator and the guild footer, then the
-- claim/close controls.
--
-- `openingMessage` is deliberately left in place: it stays the text source of
-- truth, and `messageLayout` being NULL is a supported state that the bot falls
-- back on, so this backfill is a convenience (legible dumps and prisma studio)
-- rather than something the runtime depends on.
UPDATE "categories" SET "messageLayout" = jsonb_build_object(
    'version', 1,
    'blocks', jsonb_build_array(
        jsonb_build_object('id', 'mig-mentions', 'type', 'mentions'),
        jsonb_build_object(
            'id', 'mig-container',
            'type', 'container',
            'accentColour', NULL,
            'blocks',
                jsonb_build_array(
                    jsonb_build_object(
                        'id', 'mig-section',
                        'type', 'section',
                        'text', jsonb_build_array(COALESCE(NULLIF("openingMessage", ''), ' ')),
                        'accessory', jsonb_build_object(
                            'kind', 'thumbnail',
                            'url', '{avatar}',
                            'description', 'Ticket creator'
                        )
                    )
                )
                || CASE
                    WHEN "image" IS NULL OR "image" = '' THEN '[]'::jsonb
                    ELSE jsonb_build_array(jsonb_build_object(
                        'id', 'mig-image',
                        'type', 'gallery',
                        'items', jsonb_build_array(jsonb_build_object('url', "image"))
                    ))
                END
                || jsonb_build_array(
                    jsonb_build_object('id', 'mig-answers', 'type', 'answers'),
                    jsonb_build_object('id', 'mig-separator', 'type', 'separator', 'divider', true, 'spacing', 'small'),
                    jsonb_build_object('id', 'mig-footer', 'type', 'footer')
                )
        ),
        jsonb_build_object('id', 'mig-controls', 'type', 'controls')
    )
)
WHERE "messageLayout" IS NULL;
