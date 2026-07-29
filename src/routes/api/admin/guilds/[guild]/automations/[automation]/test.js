const { Context } = require('../../../../../../../lib/automations/context');
const { runAutomation } = require('../../../../../../../lib/automations/runtime');
const {
	badRequest, loadAutomation, resolveTestContext,
} = require('../../../../../../../lib/automations/http');
const { triggerNodes } = require('../../../../../../../lib/automations/validate');

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
		// A graph may hold several triggers; the caller can say which branch to
		// exercise, otherwise the first one is used.
		const triggers = triggerNodes(automation.graph);
		const trigger = (typeof body.nodeId === 'string' && triggers.find(n => n.id === body.nodeId)) || triggers[0];
		if (!trigger) return res.code(400).send(badRequest('no_trigger', 'This automation has no trigger to run from.'));

		// Conditions are evaluated for real, so every id has to be this guild's
		// before it reaches the Context — see resolveTestContext.
		const scope = await resolveTestContext(client, automation, body, req.user.id);
		if (scope.error) return res.code(400).send(scope.error);

		const ctx = new Context(client, {
			actorId: scope.actorId,
			channelId: scope.channelId,
			guildId: automation.guildId,
			ticketId: scope.ticketId,
			triggerType: trigger?.type ?? null,
			vars: {
				displayname: req.user.username,
				name: req.user.username,
			},
		});
		ctx.dryRun = true;

		const started = Date.now();
		const result = await runAutomation(automation.graph, ctx, {
			runners: client.automations.runners,
			startNodeId: trigger.id,
		});

		return {
			durationMs: Date.now() - started,
			error: result.error ?? null,
			status: result.status,
			steps: result.steps,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
