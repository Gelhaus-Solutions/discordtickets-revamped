/**
 * Checks the panel sync contract in `src/lib/panels.js` against a stubbed
 * Discord client. These are the behaviours the dashboard depends on:
 *
 *   - a panel with no message is posted and its id recorded
 *   - a panel with a live message is edited *in place* (same message id)
 *   - a panel whose message was deleted in Discord is reposted (self-healing)
 *   - a message the bot does not own is never edited or deleted
 *   - a panel whose channel is gone reports `channel_missing` instead of throwing
 *   - deleting a panel never deletes a channel
 */
const assert = require('assert');
const path = require('path');
const { MessageFlags } = require('discord.js');
const panels = require(path.join(__dirname, '..', 'src', 'lib', 'panels'));
const opening = require(path.join(__dirname, '..', 'src', 'lib', 'tickets', 'opening-message'));

let pass = 0;
const t = async (name, fn) => {
	try {
		await fn();
		pass++;
		console.log('  ok  ', name);
	} catch (e) {
		console.log('  FAIL', name, '\n       ', e.message);
		process.exitCode = 1;
	}
};

const BOT_ID = '999';

/** Builds a fake client whose channels/messages behave like the cases we care about. */
function makeClient({
	channelMissing = false, messageMissing = false, messageAuthor = BOT_ID, editThrows = null,
} = {}) {
	const sent = [];
	const edited = [];
	const deleted = [];
	const channelDeletes = [];

	const message = {
		author: { id: messageAuthor },
		delete: async () => {
			deleted.push('m1');
		},
		edit: async payload => {
			if (editThrows) {
				const err = new Error('boom');
				err.code = editThrows;
				throw err;
			}
			edited.push(payload);
			return message;
		},
		id: 'm1',
	};

	const channel = {
		delete: async () => {
			channelDeletes.push('c1');
		},
		id: 'c1',
		messages: { fetch: async () => (messageMissing ? Promise.reject(new Error('Unknown Message')) : message) },
		name: 'create-a-ticket',
		send: async payload => {
			sent.push(payload);
			return {
				...message,
				id: 'm-new',
			};
		},
	};

	return {
		channelDeletes,
		client: {
			channels: { fetch: async () => (channelMissing ? Promise.reject(new Error('Unknown Channel')) : channel) },
			guilds: { cache: { get: () => ({ iconURL: () => null }) } },
			i18n: {
				getLocale: () => ((key, vars = {}) => {
					// Mirrors the real locale file: this one interpolates.
					if (key === 'ticket.opening_message.content') {
						return `${vars.staff}\n${vars.creator} has created a new ticket`;
					}
					return {
						'buttons.claim.emoji': '🙌',
						'buttons.claim.text': 'Claim',
						'buttons.close.emoji': '✖️',
						'buttons.close.text': 'Close',
						'buttons.create.emoji': '🎫',
						'buttons.create.text': 'Create a ticket',
						'buttons.edit.emoji': '✏️',
						'buttons.edit.text': 'Edit',
						'buttons.unclaim.emoji': '🙌',
						'buttons.unclaim.text': 'Unclaim',
						'menus.category.placeholder': 'Pick one',
					}[key] ?? `<<${key}>>`;
				}),
			},
			prisma: {
				guild: {
					findUnique: async () => ({
						categories: [{
							description: 'Get help',
							emoji: '💁',
							id: 1,
							name: 'Support',
						}],
						footer: 'Discord Tickets',
						locale: 'en-GB',
						primaryColour: '#009999',
					}),
				},
			},
			user: { id: BOT_ID },
		},
		deleted,
		edited,
		sent,
	};
}

const layout = {
	blocks: [{
		accentColour: null,
		blocks: [
			{
				content: '## Support',
				id: 'a',
				type: 'text',
			},
			{
				buttons: [{
					categoryId: 1,
					kind: 'ticket',
				}],
				id: 'b',
				type: 'buttons',
			},
		],
		id: 'root',
		type: 'container',
	}],
	version: 1,
};

const panelRow = extra => ({
	channelId: 'c1',
	guildId: 'g1',
	id: 1,
	layout,
	messageId: null,
	name: 'Test panel',
	...extra,
});

(async () => {
	console.log('\n== panel sync ==');

	await t('an unposted panel is sent and its message id returned', async () => {
		const h = makeClient();
		const r = await panels.syncPanel(h.client, panelRow());
		assert.strictEqual(r.synced, true);
		assert.strictEqual(r.messageId, 'm-new');
		assert.strictEqual(h.sent.length, 1);
		assert.strictEqual(h.sent[0].flags, MessageFlags.IsComponentsV2, 'v2 flag set on send');
	});

	await t('a live panel is edited in place, keeping its message id', async () => {
		const h = makeClient();
		const r = await panels.syncPanel(h.client, panelRow({ messageId: 'm1' }));
		assert.strictEqual(r.synced, true);
		assert.strictEqual(r.messageId, 'm1', 'same message id');
		assert.strictEqual(h.sent.length, 0, 'nothing reposted');
		assert.strictEqual(h.edited.length, 1);
		assert.strictEqual(h.edited[0].flags, MessageFlags.IsComponentsV2, 'v2 flag re-asserted on edit');
	});

	await t('a panel whose message was deleted is reposted', async () => {
		const h = makeClient({ messageMissing: true });
		const r = await panels.syncPanel(h.client, panelRow({ messageId: 'm1' }));
		assert.strictEqual(r.synced, true);
		assert.strictEqual(r.messageId, 'm-new', 'new message id');
		assert.strictEqual(r.recreated, true);
		assert.strictEqual(h.sent.length, 1);
	});

	await t('a message deleted mid-edit (10008) is reposted rather than thrown', async () => {
		const h = makeClient({ editThrows: 10008 });
		const r = await panels.syncPanel(h.client, panelRow({ messageId: 'm1' }));
		assert.strictEqual(r.synced, true);
		assert.strictEqual(r.messageId, 'm-new');
	});

	await t('an edit failure that is not 10008 propagates', async () => {
		const h = makeClient({ editThrows: 50013 });
		await assert.rejects(() => panels.syncPanel(h.client, panelRow({ messageId: 'm1' })));
	});

	await t('a message the bot does not own is never edited', async () => {
		const h = makeClient({ messageAuthor: 'someone-else' });
		const r = await panels.syncPanel(h.client, panelRow({ messageId: 'm1' }));
		assert.strictEqual(h.edited.length, 0, 'not edited');
		assert.strictEqual(r.messageId, 'm-new', 'a fresh panel is posted instead');
	});

	await t('a missing channel reports channel_missing and creates nothing', async () => {
		const h = makeClient({ channelMissing: true });
		const r = await panels.syncPanel(h.client, panelRow({ messageId: 'm1' }));
		assert.strictEqual(r.synced, false);
		assert.strictEqual(r.reason, 'channel_missing');
		assert.strictEqual(r.messageId, null);
		assert.strictEqual(h.sent.length, 0);
	});

	console.log('\n== panel delete ==');

	await t('deletes the message but never the channel', async () => {
		const h = makeClient();
		const ok = await panels.deletePanelMessage(h.client, panelRow({ messageId: 'm1' }));
		assert.strictEqual(ok, true);
		assert.deepStrictEqual(h.deleted, ['m1']);
		assert.deepStrictEqual(h.channelDeletes, [], 'channel untouched');
	});

	await t('a message owned by someone else is not deleted', async () => {
		const h = makeClient({ messageAuthor: 'someone-else' });
		assert.strictEqual(await panels.deletePanelMessage(h.client, panelRow({ messageId: 'm1' })), false);
		assert.deepStrictEqual(h.deleted, []);
	});

	await t('an already-deleted message is not an error', async () => {
		const h = makeClient({ messageMissing: true });
		assert.strictEqual(await panels.deletePanelMessage(h.client, panelRow({ messageId: 'm1' })), false);
	});

	console.log('\n== derived categories ==');

	await t('category ids are collected from buttons, sections and selects', () => {
		assert.deepStrictEqual(panels.collectCategoryIds(layout), [1]);
		assert.deepStrictEqual(
			panels.collectCategoryIds({
				blocks: [{
					categoryIds: [4, 5],
					id: 's',
					type: 'select',
				}],
				version: 1,
			}),
			[4, 5],
		);
		// A select covering "all" resolves against the guild's categories.
		assert.deepStrictEqual(
			panels.collectCategoryIds({
				blocks: [{
					categoryIds: null,
					id: 's',
					type: 'select',
				}],
				version: 1,
			}, [7, 8]),
			[7, 8],
		);
		assert.deepStrictEqual(
			panels.collectCategoryIds({
				blocks: [{
					accessory: {
						button: {
							categoryId: 3,
							kind: 'ticket',
						},
						kind: 'button',
					},
					id: 'sec',
					text: ['hi'],
					type: 'section',
				}],
				version: 1,
			}),
			[3],
		);
	});

	console.log('\n== opening message ==');

	const openingClient = makeClient().client;
	const category = ({
		claiming = true,
		claimButton = true,
		closeButton = true,
		closeReasonButton = true,
		messageLayout = null,
	} = {}) => ({
		guild: {
			claimButton,
			closeButton,
			closeReasonButton,
			footer: 'Discord Tickets',
			locale: 'en-GB',
			primaryColour: '#009999',
		},
		claiming,
		image: null,
		messageLayout,
		openingMessage: 'Hello {name}, ticket #{num}',
		pingRoles: ['222'],
	});

	const openingActions = (opts, extra = {}) => {
		const payload = opening.buildOpeningMessage(openingClient, {
			category: category(opts),
			creatorId: '111',
			guild: { iconURL: () => null },
			number: 3,
			...extra,
		});
		const row = payload.components.map(c => c.toJSON()).find(c => c.type === 1);
		return row ? row.components.map(c => JSON.parse(c.custom_id).action) : [];
	};

	await t('all controls render when every button is enabled', () => {
		assert.deepStrictEqual(
			openingActions({}, { topic: 'Help me' }),
			['edit', 'claim', 'close', 'close-reason'],
		);
	});

	await t('claimed tickets show Unclaim', () => {
		assert.deepStrictEqual(
			openingActions({}, {
				claimed: true,
				topic: 'Help me',
			}),
			['edit', 'unclaim', 'close', 'close-reason'],
		);
	});

	await t('Close with Reason survives claiming (it used to be dropped)', () => {
		// claim()/release() rebuilt the row without closeReasonButton, so claiming
		// a ticket silently removed the button until the ticket was reopened.
		assert.ok(openingActions({}, {
			claimed: true,
			topic: 't',
		}).includes('close-reason'));
	});

	await t('Edit only appears when there is something to edit', () => {
		assert.deepStrictEqual(openingActions({}), ['claim', 'close', 'close-reason']);
		assert.ok(openingActions({}, {
			answers: [{
				label: 'Q',
				value: 'A',
			}],
		}).includes('edit'));
	});

	await t('claiming enabled but the claim button disabled shows no claim control', () => {
		assert.deepStrictEqual(openingActions({ claimButton: false }), ['close', 'close-reason']);
	});

	await t('the ping line is a component, and mentions are allowed explicitly', () => {
		const payload = opening.buildOpeningMessage(openingClient, {
			category: category(),
			creatorId: '111',
			guild: { iconURL: () => null },
			number: 3,
		});
		assert.strictEqual(payload.flags, MessageFlags.IsComponentsV2);
		const json = payload.components.map(c => c.toJSON());
		assert.strictEqual(json[0].type, 10, 'ping line is a text display, not `content`');
		assert.ok(json[0].content.includes('<@&222>'), 'role ping present');
		// Without this, pings in a v2 message notify nobody.
		assert.deepStrictEqual(payload.allowedMentions, {
			roles: ['222'],
			users: ['111'],
		});
	});

	await t('a stored messageLayout overrides the derived one', () => {
		const payload = opening.buildOpeningMessage(openingClient, {
			category: category({
				messageLayout: {
					blocks: [{
						content: 'Custom layout',
						id: 'x',
						type: 'text',
					}],
					version: 1,
				},
			}),
			creatorId: '111',
			guild: { iconURL: () => null },
			number: 3,
		});
		const json = payload.components.map(c => c.toJSON());
		assert.strictEqual(json.length, 1);
		assert.strictEqual(json[0].content, 'Custom layout');
	});

	await t('categoryNeedsStats reads the layout, not just openingMessage', () => {
		assert.strictEqual(opening.categoryNeedsStats(category()), false);
		assert.strictEqual(opening.categoryNeedsStats({
			...category(),
			openingMessage: 'Average reply: {avgResponseTime}',
		}), true);
		assert.strictEqual(opening.categoryNeedsStats(category({
			messageLayout: {
				blocks: [{
					content: '{avgRating}',
					id: 'x',
					type: 'text',
				}],
				version: 1,
			},
		})), true);
	});

	console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
})();
