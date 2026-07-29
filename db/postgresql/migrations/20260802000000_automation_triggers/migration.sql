-- Migration: 20260802000000_automation_triggers
-- Changes: automations.triggerType/triggerKey -> automations.triggerTypes (a list)
--
-- An automation started life with exactly one trigger, which made the entry
-- point unambiguous and let the dispatcher index on a single column. That
-- turned out to be the wrong trade: "when a ticket opens, post two buttons"
-- plus the two "button pressed" branches that answer them is one idea, and
-- forcing it into three automations to satisfy the schema helped nobody.
--
-- `triggerKey` held the cron expression for schedule triggers. With several
-- triggers per graph there can be several crons, so the expression now lives
-- where it belongs — on the node — and the reconciler reads the graph.
--
-- Nothing indexes trigger type any more, and nothing needs to: the dispatcher
-- already holds every enabled automation for a guild in memory and matches
-- against the graph's own trigger nodes. The column that remains is for display
-- and coarse filtering.

ALTER TABLE "automations" ADD COLUMN IF NOT EXISTS "triggerTypes" JSONB;

-- Backfill: one trigger becomes a one-element list.
--
-- Guarded on the source column still existing, because the DROP below has
-- already run on a second pass and a bare UPDATE would fail on the missing
-- column — this file has to stay re-runnable.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'automations' AND column_name = 'triggerType'
    ) THEN
        UPDATE "automations"
        SET "triggerTypes" = jsonb_build_array("triggerType")
        WHERE "triggerTypes" IS NULL;
    END IF;
END $$;

-- Nothing left null: a row that somehow has neither gets an empty list rather
-- than blocking the NOT NULL below.
UPDATE "automations" SET "triggerTypes" = '[]'::jsonb WHERE "triggerTypes" IS NULL;

ALTER TABLE "automations" ALTER COLUMN "triggerTypes" SET NOT NULL;

DROP INDEX IF EXISTS "automations_guildId_triggerType_enabled_idx";
ALTER TABLE "automations" DROP COLUMN IF EXISTS "triggerType";
ALTER TABLE "automations" DROP COLUMN IF EXISTS "triggerKey";
