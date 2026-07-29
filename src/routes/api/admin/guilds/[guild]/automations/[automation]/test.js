const { Context } = require('../../../../../../../lib/automations/context');
const { runAutomation } = require('../../../../../../../lib/automations/runtime');
const { loadAutomation } = require('../../../../../../../lib/automations/http');

/**
 * Dry-run an automation and return the trace.
 *
 * Every action reports success without touching Discord (`ctx.dryRun`), so this
 * is safe to press repeatedly. What it *does* exercise is the part that is hard
 * to reason about on a canvas: which branch a condition takes and therefore
 * which nodes are reached.
 *
 * Conditions are evaluated for real against whatever context the caller
 * supplies — a ticket id, a member id — so "why does this never reach the role
 * step" has an answer that does not involve closing a real ticket to find out.
 *
 * No run row is written: a test is not a run, and putting it in the log would
 * make the log lie about what the automation has actually done.
 */
module.exports.post = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const automation = await loadAutomation(client, req, res);
		if (!automation) return;

		const body = req.body ?? {};
		const ctx = new Context(client, {
			actorId: typeof body.userId === 'string' ? body.userId : req.user.id,
			channelId: typeof body.channelId === 'string' ? body.channelId : null,
			guildId: automation.guildId,
			ticketId: typeof body.ticketId === 'string' ? body.ticketId : null,
			triggerType: automation.triggerType,
			vars: {
				displayname: req.user.username,
				name: req.user.username,
			},
		});
		ctx.dryRun = true;

		const started = Date.now();
		const result = await runAutomation(automation.graph, ctx, { runners: client.automations.runners });

		return {
			durationMs: Date.now() - started,
			error: result.error ?? null,
			status: result.status,
			steps: result.steps,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
