-- Migration: 20260801000000_automations
-- Adds:   automations     (per-guild user-defined trigger/condition/action graphs)
--         automationRuns  (one row per execution, for the dashboard run log)
--
-- Everything the bot automated until now was hard-coded: the auto-tag regex,
-- auto-claim, the stale/auto-close pipeline, cascade-close on leave. Each was a
-- bespoke feature. `automations.graph` is the generic version of all of them —
-- a JSON `{ version, nodes[], edges[] }` document authored on the dashboard's
-- node canvas and executed by src/lib/automations/runtime.js.
--
-- `triggerType` and `triggerKey` are *derived* from the graph server-side on
-- every write (deriveTrigger in src/lib/automations/validate.js), never sent by
-- the client. They exist because the dispatcher has to answer "which
-- automations listen to X in guild Y" on the hot path of every message, and
-- nothing in this codebase queries inside a JSON column — the same
-- derived-column trick `panels.categories` already uses.
--
-- `key` is a short per-guild-unique handle rather than the pk because it is
-- embedded in button custom_ids, where Discord's 100-char budget is already
-- tight (see the note in src/lib/tickets/manager.js on the feedback modal).
--
-- The IF NOT EXISTS / duplicate_object guards follow the re-runnable convention
-- set by 20260701000000_reopen_window and 20260726000000_restore_bot_banner: a
-- migration that died half-way through must be safe to re-run.
--
-- Note the enum is created with a DO block rather than the plain CREATE TYPE
-- Prisma would emit: the `ALTER TYPE ... ADD VALUE IF NOT EXISTS` idiom used by
-- 20260730000000_question_types does not apply here, because this migration
-- *uses* the type in the same transaction.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AutomationRunStatus" AS ENUM ('RUNNING', 'SUSPENDED', 'SUCCESS', 'FAILED', 'SKIPPED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "automations" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" VARCHAR(19),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "graph" JSONB NOT NULL,
    "guildId" VARCHAR(19) NOT NULL,
    "id" SERIAL NOT NULL,
    "key" VARCHAR(12) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "triggerKey" VARCHAR(100),
    "triggerType" VARCHAR(64) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "automationRuns" (
    "automationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "error" TEXT,
    "finishedAt" TIMESTAMP(3),
    "guildId" VARCHAR(19) NOT NULL,
    "id" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'RUNNING',
    "steps" JSONB NOT NULL,
    "ticketId" VARCHAR(19),
    "triggerType" VARCHAR(64) NOT NULL,
    "userId" VARCHAR(19),

    CONSTRAINT "automationRuns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "automations_guildId_key_key" ON "automations"("guildId", "key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "automations_guildId_enabled_idx" ON "automations"("guildId", "enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "automations_guildId_triggerType_enabled_idx" ON "automations"("guildId", "triggerType", "enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "automationRuns_guildId_createdAt_idx" ON "automationRuns"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "automationRuns_automationId_createdAt_idx" ON "automationRuns"("automationId", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "automations" ADD CONSTRAINT "automations_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "automationRuns" ADD CONSTRAINT "automationRuns_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
