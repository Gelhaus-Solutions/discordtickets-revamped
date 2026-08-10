const { logAdminEvent } = require('../../../../../../lib/logging');
const {
	LIMITS,
	describeError,
} = require('../../../../../../lib/automations/errors');
const {
	deriveTriggers,
	validateGraph,
} = require('../../../../../../lib/automations/validate');
const {
	loadAutomation,
	loadRefs,
	syncSchedule,
} = require('../../../../../../lib/automations/http');
const { upgradeGraph } = require('../../../../../../lib/automations/upgrade');

/** The only fields a caller may change, mirroring `ALLOWED_SETTINGS_FIELDS`. */
const ALLOWED = ['enabled', 'graph', 'name'];

module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		return await loadAutomation(client, req, res);
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const original = await loadAutomation(client, req, res);
		if (!original) return;

		const body = req.body ?? {};
		const data = {};
		for (const field of ALLOWED) {
			if (body[field] === undefined) continue;
			if (field === 'name') data.name = String(body.name).slice(0, LIMITS.nameLength).trim();
			else if (field === 'enabled') data.enabled = Boolean(body.enabled);
			// Upgraded before validation, so a dashboard tab left open on the old
			// code saves cleanly instead of being rejected for its version.
			else data.graph = upgradeGraph(body.graph);
		}

		if (data.graph !== undefined) {
			const refs = await loadRefs(client, original.guildId, original.id);
			try {
				validateGraph(data.graph, refs);
			} catch (error) {
				const described = describeError(error);
				if (described) return res.code(described.status).send(described.body);
				throw error;
			}
			// Re-derived, never taken from the body, so the dispatcher's index
			// cannot drift from the canvas.
			Object.assign(data, deriveTriggers(data.graph));
		}

		const updated = await client.prisma.automation.update({
			data,
			where: { id: original.id },
		});

		await client.automations.invalidate(original.guildId);
		// `original` so a cron trigger removed from the graph loses its schedule.
		syncSchedule(client, updated, original);

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original,
				updated,
			},
			guildId: original.guildId,
			target: {
				id: updated.id,
				name: updated.name,
				type: 'automation',
			},
			userId: req.user.id,
		});

		return updated;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.delete = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const automation = await loadAutomation(client, req, res);
		if (!automation) return;

		// Runs cascade with the row; the schedule does not, so it is torn down
		// explicitly before the row it is named after disappears.
		const deleted = await client.prisma.automation.delete({ where: { id: automation.id } });
		await client.automations.invalidate(automation.guildId);
		syncSchedule(client, {
			...deleted,
			enabled: false,
		}, deleted);

		logAdminEvent(client, {
			action: 'delete',
			guildId: automation.guildId,
			target: {
				id: deleted.id,
				name: deleted.name,
				type: 'automation',
			},
			userId: req.user.id,
		});

		return deleted;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
