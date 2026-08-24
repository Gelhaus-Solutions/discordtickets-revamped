const { logAdminEvent } = require('../../../../../../../lib/logging');
const { updateStaffRoles } = require('../../../../../../../lib/users');
const { STATE_FIELDS } = require('../../../../../../../lib/tickets/emoji-settings');
const {
	LayoutError,
	validateLayout,
} = require('../../../../../../../lib/components-v2');
const {
	isValidChannelEmoji, isValidEmoji,
} = require('../../../../../../../lib/emoji');
const {
	CATEGORY_JSON_NULLABLE,
	INHERITED_FIELDS,
	dbNulls,
	guildDefaults,
} = require('../../../../../../../lib/settings/inheritance');
const { loadRefs } = require('../../../../../../../lib/automations/http');
const {
	QuestionError,
	validateQuestions,
} = require('../../../../../../../lib/questions-validate');
const {
	LIMIT: FEEDBACK_LIMIT,
	defaultFeedbackQuestions,
} = require('../../../../../../../lib/tickets/feedback');
const { ApplicationCommandPermissionType } = require('discord.js');

/**
 * Validate the per-priority emoji map.
 *
 * This column is read on every channel-name write, so a string, an array or a
 * non-emoji value here breaks claim, release, priority and close for every
 * ticket in the category — long after the admin saved it.
 *
 * @param {unknown} value
 * @returns {?string} a message the dashboard shows verbatim, or null
 */
function priorityEmojisError(value) {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'object' || Array.isArray(value)) return 'priorityEmojis must be an object';
	for (const [key, v] of Object.entries(value)) {
		if (!['HIGH', 'LOW', 'MEDIUM', 'NONE'].includes(key)) return `priorityEmojis has an unknown key "${key}"`;
		if (v === null) continue;
		if (typeof v !== 'string') return `priorityEmojis.${key} must be text`;
		// '' is a deliberate "no emoji for this priority".
		if (v !== '' && !isValidChannelEmoji(v)) return `priorityEmojis.${key} cannot be shown in a channel name`;
	}
	return null;
}

/**
 * Validate the three state-emoji columns.
 *
 * `null` (inherit) and `''` (deliberately none) both pass untouched; only a
 * non-empty value has to resolve to something Discord will actually draw.
 *
 * @param {Record<string, unknown>} data
 * @returns {?string}
 */
function stateEmojiError(data) {
	for (const field of STATE_FIELDS) {
		if (!data[field]) continue;
		if (!isValidChannelEmoji(data[field])) {
			return `${field} must be an emoji that can appear in a channel name`;
		}
	}
	return priorityEmojisError(data.priorityEmojis);
}

module.exports.delete = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guild = client.guilds.cache.get(req.params.guild);
		const categoryId = Number(req.params.category);
		const original = categoryId && await client.prisma.category.findUnique({ where: { id: categoryId } });
		if (!original || original.guildId !== guild.id) return res.status(400).send(new Error('Bad Request'));
		const category = await client.prisma.category.delete({ where: { id: categoryId } });

		await updateStaffRoles(guild);

		logAdminEvent(client, {
			action: 'delete',
			guildId: req.params.guild,
			target: {
				id: category.id,
				name: category.name,
				type: 'category',
			},
			userId: req.user.id,
		});

		return category;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const categoryId = Number(req.params.category);
		const category = await client.prisma.category.findUnique({
			include: {
				guild: true,
				questions: {
					select: {
						// createdAt: true,
						config: true,
						id: true,
						label: true,
						maxLength: true,
						minLength: true,
						options: true,
						order: true,
						placeholder: true,
						required: true,
						style: true,
						type: true,
						value: true,
					},
				},
			},
			where: { id: categoryId },
		});

		if (!category || category.guildId !== guildId) return res.status(400).send(new Error('Bad Request'));

		// The row goes back raw — NULL where the category inherits — so the form
		// binds straight onto the stored overrides and a cleared field stays
		// cleared. `inherited` is what each of those NULLs would resolve to, which
		// is what the greyed placeholders show; `inheritable` saves the dashboard
		// from hard-coding the list. Both are derived and are stripped again on
		// the way back in.
		const {
			guild, ...raw
		} = category;
		return {
			...raw,
			// The built-in form in this server's locale, for seeding the builder
			// when neither the category nor the guild has one. Derived, and stripped
			// again on the way back in.
			feedbackDefault: defaultFeedbackQuestions(client.i18n.getLocale(guild.locale)),
			inheritable: INHERITED_FIELDS,
			inherited: guildDefaults(guild),
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const categoryId = Number(req.params.category);
		/** @type {import('discord.js').Guild} */
		const guild = client.guilds.cache.get(req.params.guild);
		const data = req.body;

		const select = {
			autoAssign: true,
			backupCategoryId: true,
			blockedRoles: true,
			channelMode: true,
			channelName: true,
			claiming: true,
			cooldown: true,
			// createdAt: true,
			description: true,
			discordCategory: true,
			emoji: true,
			enableFeedback: true,
			feedbackQuestions: true,
			guildId: true,
			id: true,
			image: true,
			memberLimit: true,
			messageLayout: true,
			name: true,
			openingMessage: true,
			pingRoles: true,
			questions: {
				select: {
					// createdAt: true,
					config: true,
					id: true,
					label: true,
					maxLength: true,
					minLength: true,
					options: true,
					order: true,
					placeholder: true,
					required: true,
					style: true,
					type: true,
					value: true,
				},
			},
			ratelimit: true,
			requireTopic: true,
			requiredRoles: true,
			skipCloseRequest: true,
			staffChannel: true,
			staffChannelMode: true,
			staffChannelParent: true,
			staffRoles: true,
			totalLimit: true,
		};

		const original = req.params.category && await client.prisma.category.findUnique({
			select,
			where: { id: categoryId },
		});

		if (!original || original.guildId !== guildId) return res.status(400).send(new Error('Bad Request'));

		if (Object.prototype.hasOwnProperty.call(data, 'id')) delete data.id;
		if (Object.prototype.hasOwnProperty.call(data, 'createdAt')) delete data.createdAt;
		if (Object.prototype.hasOwnProperty.call(data, 'guildId')) delete data.guildId;
		// Derived, read-only sidecars the GET adds so the dashboard can show what
		// an empty field would inherit. The dashboard round-trips the GET response
		// verbatim, and an unknown key spread into `update` below is an "Unknown
		// arg" throw rather than a quiet drop.
		delete data.inherited;
		delete data.inheritable;
		delete data.feedbackDefault;

		// A malformed opening-message layout must be rejected here: stored, it
		// would break ticket creation for the whole category, and the failure
		// would surface to members rather than to the admin who caused it.
		if (data.messageLayout !== undefined && data.messageLayout !== null) {
			// Only automations a button press can start: the controls block's extra
			// buttons are button triggers, so anything else would be a dead button.
			const { buttonAutomationKeys } = await loadRefs(client, guildId);
			try {
				validateLayout(data.messageLayout, {
					automationKeys: new Set(buttonAutomationKeys),
					kind: 'opening',
				});
			} catch (error) {
				if (error instanceof LayoutError) {
					return res.code(400).send({
						code: 'invalid_layout',
						errors: error.errors.map(e => ({
							message: e.path ? `${e.path}: ${e.message}` : e.message,
							type: e.code,
						})),
						statusCode: 400,
					});
				}
				throw error;
			}
		}

		// The feedback form, same rules and the same validator. NULL means "ask the
		// guild" and is not a form to check; `[]` is a category that deliberately
		// asks nothing, which is valid.
		//
		// Unlike `questions` above, the count cap is enforced: a sixth question
		// makes Discord reject the modal outright, and this form is new, so there
		// is no existing over-long set to start rejecting.
		if (data.feedbackQuestions !== undefined && data.feedbackQuestions !== null) {
			try {
				validateQuestions(data.feedbackQuestions, {
					max: FEEDBACK_LIMIT,
					what: 'feedback questions',
				});
			} catch (error) {
				if (error instanceof QuestionError) {
					return res.code(400).send({
						code: 'invalid_feedback_questions',
						errors: error.errors,
						statusCode: 400,
					});
				}
				throw error;
			}
		}

		// An out-of-range question makes Discord reject the whole modal, so the
		// failure would land on a member opening a ticket rather than on the admin
		// who saved it.
		try {
			validateQuestions(data.questions);
		} catch (error) {
			if (error instanceof QuestionError) {
				return res.code(400).send({
					code: 'invalid_questions',
					errors: error.errors,
					statusCode: 400,
				});
			}
			throw error;
		}

		// An emoji that resolves to nothing is worse than one that fails: Discord
		// accepts it and silently renders a blank space on every button and menu
		// option for this category.
		if (data.emoji !== undefined && data.emoji !== null && data.emoji !== '' && !isValidEmoji(data.emoji)) {
			return res.code(400).send({
				code: 'invalid_emoji',
				errors: [{ message: 'emoji must be a Unicode emoji, a custom emoji ID, or a <:name:id> tag' }],
				statusCode: 400,
			});
		}

		const emojiProblem = stateEmojiError(data);
		if (emojiProblem) {
			return res.code(400).send({
				code: 'invalid_emoji',
				errors: [{ message: emojiProblem }],
				statusCode: 400,
			});
		}

		// These are JSON columns and `data` is spread straight into the update
		// below, so whatever arrives is what gets stored. They are read back in
		// `TicketManager#create` with `.some(...)`, where a string or an object
		// would throw — breaking ticket creation for the whole category, for
		// members, long after the admin saved it.
		//
		// `null` is allowed and means "inherit the server default"; `[]` is an
		// override meaning "none". All four are checked now that all four inherit.
		for (const field of ['blockedRoles', 'pingRoles', 'requiredRoles', 'staffRoles']) {
			if (data[field] === undefined || data[field] === null) continue;
			const valid = Array.isArray(data[field]) &&
				data[field].every(id => typeof id === 'string' && /^\d{17,20}$/.test(id));
			if (!valid) {
				return res.code(400).send({
					code: 'invalid_roles',
					errors: [{ message: `${field} must be an array of role IDs, or null to use the server default` }],
					statusCode: 400,
				});
			}
		}

		// The numeric limits are inheritable too, so `null` is legal here — but a
		// string or a negative number would reach Prisma and then Discord.
		for (const field of ['cooldown', 'memberLimit', 'ratelimit', 'totalLimit']) {
			if (data[field] === undefined || data[field] === null) continue;
			if (!Number.isInteger(data[field]) || data[field] < 0) {
				return res.code(400).send({
					code: 'invalid_limit',
					errors: [{ message: `${field} must be a non-negative whole number, or null to use the server default` }],
					statusCode: 400,
				});
			}
		}

		// Inheritable and three-state: null asks the server, and both booleans are
		// answers. Anything else is a body Prisma would reject with a 500 where a
		// 400 belongs.
		if (
			data.skipCloseRequest !== undefined &&
			data.skipCloseRequest !== null &&
			typeof data.skipCloseRequest !== 'boolean'
		) {
			return res.code(400).send({
				code: 'invalid_setting',
				errors: [{ message: 'skipCloseRequest must be true, false, or null to use the server default' }],
				statusCode: 400,
			});
		}

		// An empty template is meaningless, and the legacy dashboard sends '' for
		// "unset" — which now has a real meaning, so it is normalised rather than
		// stored as a deliberate blank name.
		if (data.channelName === '') data.channelName = null;

		// With `staffRoles` optional, a category can end up resolving to no staff
		// at all — which in CHANNEL mode creates tickets nobody but the opener can
		// see. Checked against the *effective* value, since inheriting a non-empty
		// server default is fine.
		if (data.staffRoles !== undefined) {
			const settings = await client.prisma.guild.findUnique({
				select: { staffRoles: true },
				where: { id: guildId },
			});
			const effective = data.staffRoles ?? settings?.staffRoles ?? [];
			if (effective.length === 0) {
				// Say which value was actually consulted. Clearing a category to
				// inherit is the common way to reach this, and the server default
				// read here is the *saved* one — so a dashboard user who has picked
				// roles but not submitted yet sees a complaint about a field that
				// looks filled in on their screen.
				const inheriting = data.staffRoles === null || data.staffRoles === undefined;
				return res.code(400).send({
					code: 'no_staff_roles',
					errors: [{
						message: inheriting
							? 'A category needs at least one staff role, and the saved server default has none. Set one on this category, or set and save a server default first.'
							: 'A category needs at least one staff role, here or as a server default',
					}],
					statusCode: 400,
				});
			}
		}

		// A forum post is a thread that anyone who can see the forum can read, so
		// there is no such thing as a private staff one. Refused here rather than
		// silently rewritten, because an admin who picked it wants to know it is
		// not a thing rather than find a channel where they expected a post.
		if (data.staffChannelMode === 'FORUM') {
			return res.code(400).send({
				code: 'invalid_staff_channel_mode',
				errors: [{ message: 'A staff channel can be a channel or a thread. Forums cannot hold private posts.' }],
				statusCode: 400,
			});
		}
		// '' arrives from a cleared dashboard select meaning "use the default",
		// which is what NULL means here.
		if (data.staffChannelMode === '') data.staffChannelMode = null;
		if (data.staffChannelParent === '') data.staffChannelParent = null;

		// For THREAD and FORUM modes, don't send totalLimit (it's not applicable)
		if (data.channelMode === 'THREAD' || data.channelMode === 'FORUM') {
			delete data.totalLimit;
		}

		// Handle backupCategory relation.
		//
		// The id is client-supplied and `Category.backupCategoryId` is a bare FK
		// with no guild constraint, so this must verify ownership. Without it, an
		// admin of one guild could point a category's overflow at another guild's
		// category and have tickets created in that guild's Discord category,
		// with its staff roles.
		if (data.backupCategoryId) {
			const backup = await client.prisma.category.findUnique({
				select: { guildId: true },
				where: { id: data.backupCategoryId },
			});
			if (backup?.guildId !== guildId) {
				return res.status(400).send(new Error('backupCategoryId must reference a category in this guild'));
			}
			data.backupCategory = { connect: { id: data.backupCategoryId } };
		} else if (data.backupCategoryId === null) {
			data.backupCategory = { disconnect: true };
		}
		delete data.backupCategoryId;

		const category = await client.prisma.category.update({
			data: {
				...dbNulls(data, CATEGORY_JSON_NULLABLE),
				questions: {
					upsert: data.questions?.map(q => ({
						create: q,
						update: q,
						where: { id: q.id },
					})),
				},
			},
			select,
			where: { id: categoryId },
		});

		// update caches
		const effective = await client.tickets.getCategory(categoryId, true);
		await updateStaffRoles(guild);

		if (req.user.accessToken && JSON.stringify(category.staffRoles) !== JSON.stringify(original.staffRoles)) {
			Promise.all([
				'Create ticket for user',
				'claim',
				'emoji',
				'force-close',
				'move',
				'priority',
				'private-channel',
				'release',
			].map(name =>
				client.application.commands.permissions.set({
					command: client.application.commands.cache.find(cmd => cmd.name === name),
					guild,
					permissions: [
						{
							id: guild.id, // @everyone
							permission: false,
							type: ApplicationCommandPermissionType.Role,
						},
						// The effective list, not the stored one: a category that
						// inherits its staff roles holds NULL here, and granting the
						// staff commands to nobody locks staff out of their own tickets.
						...effective.staffRoles.map(id => ({
							id,
							permission: true,
							type: ApplicationCommandPermissionType.Role,
						})),
					],
					token: req.user.accessToken,
				}),
			))
				.then(() => client.log.success('Updated application command permissions in "%s"', guild.name))
				.catch(error => client.log.error(error));
		}

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original,
				updated: category,
			},
			guildId: guild.id,
			target: {
				id: category.id,
				name: category.name,
				type: 'category',
			},
			userId: req.user.id,
		});

		return category;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
