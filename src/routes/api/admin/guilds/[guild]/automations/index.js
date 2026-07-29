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
	loadRefs,
	syncSchedule,
} = require('../../../../../../lib/automations/http');

/**
 * Fields a caller may set.
 *
 * `triggerTypes` is deliberately absent: it is derived from the graph
 * server-side on every write, the same way `Panel.categories` is, so a client
 * cannot make it disagree with the canvas.
 */
function safeAutomationData(body) {
	return {
		enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
		graph: body.graph ?? null,
		name: typeof body.name === 'string' ? body.name.slice(0, LIMITS.nameLength).trim() : '',
	};
}

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;

		const automations = await client.prisma.automation.findMany({
			orderBy: { createdAt: 'asc' },
			where: { guildId },
		});

		// One query for every automation's latest run rather than one per row —
		// the same "a list view must not fan out" rule the panels list follows.
		const latest = new Map();
		if (automations.length) {
			const runs = await client.prisma.automationRun.findMany({
				orderBy: { createdAt: 'desc' },
				select: {
					automationId: true,
					createdAt: true,
					error: true,
					status: true,
				},
				take: 200,
				where: { automationId: { in: automations.map(a => a.id) } },
			});
			for (const run of runs) if (!latest.has(run.automationId)) latest.set(run.automationId, run);
		}

		return automations.map(automation => ({
			createdAt: automation.createdAt,
			enabled: automation.enabled,
			id: automation.id,
			key: automation.key,
			lastRun: latest.get(automation.id) ?? null,
			name: automation.name,
			nodeCount: automation.graph?.nodes?.length ?? 0,
			triggerTypes: automation.triggerTypes ?? [],
			updatedAt: automation.updatedAt,
		}));
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.post = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const data = safeAutomationData(req.body ?? {});

		if (!data.name) {
			return res.code(400).send({
				code: 'invalid_automation',
				errors: [{
					message: 'name: is required',
					type: 'required',
				}],
				statusCode: 400,
			});
		}

		const count = await client.prisma.automation.count({ where: { guildId } });
		if (count >= LIMITS.perGuild) {
			return res.code(409).send({
				code: 'too_many_automations',
				errors: [{
					message: `This server already has the maximum of ${LIMITS.perGuild} automations.`,
					type: 'too_many_automations',
				}],
				statusCode: 409,
			});
		}

		const refs = await loadRefs(client, guildId);
		try {
			validateGraph(data.graph, refs);
		} catch (error) {
			const described = describeError(error);
			if (described) return res.code(described.status).send(described.body);
			throw error;
		}

		const { triggerTypes } = deriveTriggers(data.graph);
		const created = await client.prisma.automation.create({
			data: {
				...data,
				createdById: req.user.id,
				guildId,
				key: await client.automations.uniqueKey(guildId),
				triggerTypes,
			},
		});

		await client.automations.invalidate(guildId);
		syncSchedule(client, created);

		logAdminEvent(client, {
			action: 'create',
			guildId,
			target: {
				id: created.id,
				name: created.name,
				type: 'automation',
			},
			userId: req.user.id,
		});

		return created;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
