/**
 * Checks how ticket channels are named.
 *
 * The prefix convention used to live in six places, two of which were wrong for
 * any emoji that is not exactly one UTF-16 code unit — `.slice(1)` on release
 * and `/^\p{Emoji_Presentation}/u` on close. Both happened to work for `✅` and
 * would have started corrupting names the moment the emoji became configurable,
 * so most of what follows exists to keep that from coming back.
 *
 * The single most important case is the last one: a category with nothing
 * configured must produce exactly the name the bot produced before any of this
 * existed. That is the whole claim the migration rests on.
 *
 * No database, no Discord, no Temporal — `naming.js` is dependency-free on
 * purpose, and this suite must import it rather than `mutations.js`, which
 * requires the Temporal layer at load time.
 */
const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');
const N = require(path.join(root, 'src', 'lib', 'tickets', 'naming'));
const { resolveEmojiSettings } = require(path.join(root, 'src', 'lib', 'tickets', 'emoji-settings'));
const CD = require(path.join(root, 'src', 'lib', 'tickets', 'cooldown'));

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

/** Settings for a category and guild that configure nothing at all. */
const defaults = () => resolveEmojiSettings({
	category: {},
	guild: {},
});

const settingsFor = (category = {}, guild = {}) => resolveEmojiSettings({
	category,
	guild,
});

const ticket = (over = {}) => ({
	claimedById: null,
	emojiOverride: null,
	emojiOverrideScope: null,
	number: 1,
	open: true,
	priority: null,
	...over,
});

(async () => {
	console.log('\nTicket channel naming\n');

	/* ─────────────────────────── the precedence table ─────────────────────────── */

	await t('an open unclaimed ticket has no prefix by default', () => {
		assert.strictEqual(N.managedPrefix(ticket(), defaults()), '');
	});

	await t('a claimed ticket gets the claim tick', () => {
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), defaults()), '✅');
	});

	await t('a closed ticket has no prefix by default', () => {
		assert.strictEqual(N.managedPrefix(ticket({ open: false }), defaults()), '');
	});

	await t('closed beats claimed', () => {
		const settings = settingsFor({
			claimedEmoji: '✅',
			closedEmoji: '🔒',
		});
		assert.strictEqual(
			N.managedPrefix(ticket({
				claimedById: '1',
				open: false,
			}), settings),
			'🔒',
		);
	});

	await t('the priority emoji follows the state emoji', () => {
		assert.strictEqual(
			N.managedPrefix(ticket({
				claimedById: '1',
				priority: 'HIGH',
			}), defaults()),
			'✅🔴',
		);
	});

	await t('no priority means no priority emoji', () => {
		assert.strictEqual(N.managedPrefix(ticket({ priority: null }), defaults()), '');
	});

	/* ───────────────────────────── the override ───────────────────────────── */

	await t('an override replaces the state emoji but keeps the priority one', () => {
		assert.strictEqual(
			N.managedPrefix(ticket({
				claimedById: '1',
				emojiOverride: '🔥',
				emojiOverrideScope: 'state',
				priority: 'HIGH',
			}), defaults()),
			'🔥🔴',
		);
	});

	await t('scope \'all\' replaces the whole prefix', () => {
		assert.strictEqual(
			N.managedPrefix(ticket({
				claimedById: '1',
				emojiOverride: '🔥',
				emojiOverrideScope: 'all',
				priority: 'HIGH',
			}), defaults()),
			'🔥',
		);
	});

	await t('an unrecognised scope behaves as state, so a hand-edited row degrades safely', () => {
		assert.strictEqual(
			N.managedPrefix(ticket({
				emojiOverride: '🔥',
				emojiOverrideScope: 'nonsense',
				priority: 'LOW',
			}), defaults()),
			'🔥🟢',
		);
	});

	await t('a custom server emoji override resolves to nothing rather than leaking a tag', () => {
		const name = N.managedPrefix(ticket({
			emojiOverride: '<:urgent:123456789012345678>',
			emojiOverrideScope: 'state',
		}), defaults());
		assert.strictEqual(name, '');
	});

	/* ───────────────────────── configuration and inheritance ───────────────────────── */

	await t('a category emoji beats the guild one', () => {
		const settings = settingsFor({ claimedEmoji: '👀' }, { claimedEmoji: '🙌' });
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), settings), '👀');
	});

	await t('a guild emoji reaches a category that sets none', () => {
		const settings = settingsFor({}, { claimedEmoji: '🙌' });
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), settings), '🙌');
	});

	await t('an empty string turns the claim tick off without inheriting it', () => {
		const settings = settingsFor({ claimedEmoji: '' }, { claimedEmoji: '🙌' });
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), settings), '');
	});

	await t('an unclaimed emoji shows on a new ticket once configured', () => {
		const settings = settingsFor({ unclaimedEmoji: '🟡' });
		assert.strictEqual(N.managedPrefix(ticket(), settings), '🟡');
	});

	/* ───────────────────────────── stripping ───────────────────────────── */

	await t('a surrogate pair is stripped whole', () => {
		// The regression test for `.slice(1)`, which would cut 🔴 in half and leave
		// a lone surrogate in the channel name.
		const settings = defaults();
		assert.strictEqual(N.stripManagedPrefix('🔴ticket-1', ticket(), settings), 'ticket-1');
	});

	await t('a ZWJ sequence is stripped whole', () => {
		const settings = settingsFor({ claimedEmoji: '🏳️‍🌈' });
		assert.strictEqual(N.stripManagedPrefix('🏳️‍🌈ticket-1', ticket(), settings), 'ticket-1');
	});

	await t('a skin-tone sequence is stripped whole', () => {
		const settings = settingsFor({ claimedEmoji: '👍🏽' });
		assert.strictEqual(N.stripManagedPrefix('👍🏽ticket-1', ticket(), settings), 'ticket-1');
	});

	await t('the longer of two overlapping emojis is stripped first', () => {
		// `👍` is a prefix of `👍🏽`; stripping it first would strand the modifier.
		const settings = settingsFor({ claimedEmoji: '👍🏽' }, { claimedEmoji: '👍' });
		assert.strictEqual(N.stripManagedPrefix('👍🏽ticket-1', ticket(), settings), 'ticket-1');
	});

	await t('a legacy claim tick still strips after the category changes its emoji', () => {
		// The channel was named before the guild configured anything, so it is
		// wearing ✅ while the category now says 👀.
		const settings = settingsFor({ claimedEmoji: '👀' });
		assert.strictEqual(N.stripManagedPrefix('✅ticket-1', ticket(), settings), 'ticket-1');
	});

	await t('a guild\'s emoji strips even when a category overrides it', () => {
		// The channel predates the category override and carries the guild value.
		const settings = settingsFor({ claimedEmoji: '👀' }, { claimedEmoji: '🙌' });
		assert.strictEqual(N.stripManagedPrefix('🙌ticket-1', ticket(), settings), 'ticket-1');
	});

	await t('both slots strip together', () => {
		assert.strictEqual(N.stripManagedPrefix('✅🔴ticket-1', ticket(), defaults()), 'ticket-1');
	});

	await t('the legacy neutral-priority emoji still strips', () => {
		assert.strictEqual(N.stripManagedPrefix('🔵ticket-1', ticket(), defaults()), 'ticket-1');
	});

	await t('a user-authored emoji in the middle of a name is left alone', () => {
		assert.strictEqual(N.stripManagedPrefix('ticket-🎫-1', ticket(), defaults()), 'ticket-🎫-1');
	});

	/* ───────────────────────────── rebuilding ───────────────────────────── */

	await t('managedName is idempotent', () => {
		const settings = settingsFor({ claimedEmoji: '✅' });
		const t1 = ticket({
			claimedById: '1',
			priority: 'HIGH',
		});
		const once = N.managedName('ticket-1', t1, settings);
		assert.strictEqual(once, '✅🔴ticket-1');
		assert.strictEqual(N.managedName(once, t1, settings), once);
		assert.strictEqual(N.managedName(N.managedName(once, t1, settings), t1, settings), once);
	});

	await t('a rename from claimed to released drops only the claim tick', () => {
		const settings = defaults();
		const claimed = N.managedName('ticket-1', ticket({
			claimedById: '1',
			priority: 'LOW',
		}), settings);
		assert.strictEqual(claimed, '✅🟢ticket-1');
		assert.strictEqual(N.managedName(claimed, ticket({ priority: 'LOW' }), settings), '🟢ticket-1');
	});

	await t('clampName keeps a name within Discord\'s limit without splitting an emoji', () => {
		const long = '🔴'.repeat(120);
		const clamped = N.clampName(long);
		assert.strictEqual([...clamped].length, 100);
		// A split surrogate pair would leave a lone high surrogate here.
		assert.ok(!/[\uD800-\uDBFF]$/.test(clamped), 'clamped name ends in a lone surrogate');
	});

	await t('managedName clamps, so a maximal template cannot break channel creation', () => {
		const settings = settingsFor({ unclaimedEmoji: '🟡' });
		const name = N.managedName('a'.repeat(100), ticket(), settings);
		assert.ok([...name].length <= 100, `${[...name].length} code points`);
	});

	/* ───────────────────────────── the template ───────────────────────────── */

	await t('renderChannelName fills in the supported placeholders', () => {
		const rendered = N.renderChannelName('{name}-{num}', {
			creator: {
				displayName: 'Alexa',
				user: { username: 'alex' },
			},
			number: 7,
		});
		assert.strictEqual(rendered, 'alex-7');
	});

	await t('renderChannelName keeps the 1488 guard', () => {
		assert.strictEqual(N.renderChannelName('ticket-{num}', { number: 1488 }), 'ticket-1487b');
	});

	await t('renderChannelName falls back for a creator who has left', () => {
		assert.strictEqual(
			N.renderChannelName('{name}-{num}', {
				fallback: '123',
				number: 2,
			}),
			'123-2',
		);
	});

	/* ─────────────────── the property the migration rests on ─────────────────── */

	await t('a category with no configuration produces exactly the old name', () => {
		const settings = defaults();
		const template = N.renderChannelName('ticket-{num}', { number: 42 });

		// Open and unclaimed: no prefix at all, as before.
		assert.strictEqual(N.managedName(template, ticket({ number: 42 }), settings), 'ticket-42');

		// Claimed: the claim tick, as before.
		assert.strictEqual(
			N.managedName(template, ticket({
				claimedById: '1',
				number: 42,
			}), settings),
			'✅ticket-42',
		);

		// Claimed and prioritised: tick then colour, in that order, as before.
		for (const [priority, emoji] of [['HIGH', '🔴'], ['MEDIUM', '🟠'], ['LOW', '🟢']]) {
			assert.strictEqual(
				N.managedName(template, ticket({
					claimedById: '1',
					number: 42,
					priority,
				}), settings),
				`✅${emoji}ticket-42`,
				priority,
			);
		}
	});

	/* ───────────────────── the waiting-on-staff state ────────────────────── */

	// `awaitingResponseFrom` outranks the claim states but loses to `closed`.
	// The case that matters most is the second one: an install that never
	// configures `awaitingStaffEmoji` must behave exactly as it did before the
	// state existed, because the migration backfills nothing and every open
	// ticket starts flipping this column the moment the feature ships.

	const awaiting = over => ticket({
		awaitingResponseFrom: 'STAFF',
		...over,
	});

	await t('a configured awaiting emoji beats the claim tick', () => {
		const settings = settingsFor({ awaitingStaffEmoji: '⏳' });
		assert.strictEqual(N.managedName('ticket-1', awaiting({ claimedById: '1' }), settings), '⏳ticket-1');
		assert.strictEqual(N.managedName('ticket-1', awaiting(), settings), '⏳ticket-1');
	});

	await t('an unconfigured awaiting emoji falls back to what the ticket showed before', () => {
		const settings = defaults();
		// Claimed and waiting: still the claim tick, NOT nothing.
		assert.strictEqual(N.managedName('ticket-1', awaiting({ claimedById: '1' }), settings), '✅ticket-1');
		// Unclaimed and waiting: still nothing, as an unclaimed ticket always was.
		assert.strictEqual(N.managedName('ticket-1', awaiting(), settings), 'ticket-1');
		// And the priority slot is untouched by any of it.
		assert.strictEqual(
			N.managedName('ticket-1', awaiting({
				claimedById: '1',
				priority: 'HIGH',
			}), settings),
			'✅🔴ticket-1',
		);
	});

	await t('an explicitly emptied claim tick stays empty while waiting', () => {
		// '' on claimedEmoji is still a deliberate "no emoji": the awaiting
		// fallback defers to the claim setting, it does not resurrect a default.
		const settings = settingsFor({}, { claimedEmoji: '' });
		assert.strictEqual(N.managedName('ticket-1', awaiting({ claimedById: '1' }), settings), 'ticket-1');
	});

	await t('closed still beats awaiting', () => {
		const settings = settingsFor({
			awaitingStaffEmoji: '⏳',
			closedEmoji: '🔒',
		});
		assert.strictEqual(
			N.managedName('ticket-1', awaiting({
				claimedById: '1',
				open: false,
			}), settings),
			'🔒ticket-1',
		);
	});

	await t('an emoji override still beats awaiting, in both scopes', () => {
		const settings = settingsFor({ awaitingStaffEmoji: '⏳' });
		assert.strictEqual(
			N.managedName('ticket-1', awaiting({
				emojiOverride: '🚨',
				emojiOverrideScope: 'state',
				priority: 'HIGH',
			}), settings),
			'🚨🔴ticket-1',
		);
		assert.strictEqual(
			N.managedName('ticket-1', awaiting({
				emojiOverride: '🚨',
				emojiOverrideScope: 'all',
				priority: 'HIGH',
			}), settings),
			'🚨ticket-1',
		);
	});

	await t('the prefix is still exactly two slots while awaiting', () => {
		const settings = settingsFor({ awaitingStaffEmoji: '⏳' });
		assert.strictEqual(
			N.managedName('ticket-1', awaiting({
				claimedById: '1',
				priority: 'HIGH',
			}), settings),
			'⏳🔴ticket-1',
		);
	});

	await t('waiting on the user is indistinguishable from the old behaviour', () => {
		const settings = settingsFor({ awaitingStaffEmoji: '⏳' });
		for (const value of ['USER', null, undefined]) {
			assert.strictEqual(
				N.managedName('ticket-1', ticket({
					awaitingResponseFrom: value,
					claimedById: '1',
				}), settings),
				'✅ticket-1',
				String(value),
			);
		}
	});

	await t('a lowercase value from an import or a hand edit still reads as awaiting', () => {
		const settings = settingsFor({ awaitingStaffEmoji: '⏳' });
		assert.strictEqual(N.managedName('ticket-1', ticket({ awaitingResponseFrom: 'staff' }), settings), '⏳ticket-1');
		// Anything else is "not waiting on us", which is the safe direction.
		assert.strictEqual(N.managedName('ticket-1', ticket({ awaitingResponseFrom: 'nonsense' }), settings), 'ticket-1');
	});

	await t('a newly created ticket names itself the same way it always did', () => {
		// `manager.js#create` composes the name from a hand-built literal rather
		// than a row, because the channel does not exist yet. That literal now
		// says `awaitingResponseFrom: 'STAFF'` to match the row it is about to
		// write, so this pins the two things that could go wrong: with nothing
		// configured the prefix must still be empty, and with an emoji set the
		// channel must be created already wearing it rather than paying a rename
		// on the first message.
		const atCreation = {
			awaitingResponseFrom: 'STAFF',
			claimedById: null,
			open: true,
			priority: null,
		};

		assert.strictEqual(N.managedPrefix(atCreation, defaults()), '');
		assert.strictEqual(N.managedPrefix(atCreation, settingsFor({ awaitingStaffEmoji: '⏳' })), '⏳');

		// And the literal must agree with what the row produces a moment later,
		// or the first message renames a channel that was already correct.
		const settings = settingsFor({ awaitingStaffEmoji: '⏳' });
		assert.strictEqual(
			N.managedPrefix(atCreation, settings),
			N.managedPrefix(ticket({ awaitingResponseFrom: 'STAFF' }), settings),
		);
	});

	await t('an awaiting emoji strips when a category overrides the guild default', () => {
		// The channel is wearing the guild's value and the category now overrides
		// it. Strippable only because `historicalEmojis` keeps the raw value at
		// every level, not just the one currently in force.
		const overridden = settingsFor({ awaitingStaffEmoji: '⌛' }, { awaitingStaffEmoji: '⏳' });
		assert.strictEqual(N.managedName('⏳ticket-1', awaiting(), overridden), '⌛ticket-1');

		// And the other direction: the category drops its override, so the
		// guild's value takes over and the category's old one still strips.
		const inherited = settingsFor({ awaitingStaffEmoji: null }, { awaitingStaffEmoji: '⏳' });
		assert.strictEqual(N.managedName('⏳ticket-1', awaiting(), inherited), '⏳ticket-1');
	});

	await t('an awaiting emoji cleared at every level is left on the channel', () => {
		// Not a regression, and not new: no level records what an emoji *used to*
		// be, so once '⏳' is gone from both the category and the guild there is
		// nothing to match it against. Exactly how claimedEmoji, unclaimedEmoji
		// and priorityEmojis have always behaved. Pinned here so that if someone
		// ever adds previous-value tracking, this test tells them where to look.
		const cleared = settingsFor({ awaitingStaffEmoji: null }, { awaitingStaffEmoji: null });
		assert.strictEqual(N.managedName('⏳ticket-1', awaiting(), cleared), '⏳ticket-1');
	});

	await t('managedName is idempotent across a STAFF -> USER -> STAFF flip', () => {
		const settings = settingsFor({ awaitingStaffEmoji: '⏳' });
		const claimed = { claimedById: '1' };

		let name = N.managedName('ticket-1', ticket({
			...claimed,
			awaitingResponseFrom: 'STAFF',
		}), settings);
		assert.strictEqual(name, '⏳ticket-1');

		name = N.managedName(name, ticket({
			...claimed,
			awaitingResponseFrom: 'USER',
		}), settings);
		assert.strictEqual(name, '✅ticket-1');

		name = N.managedName(name, ticket({
			...claimed,
			awaitingResponseFrom: 'STAFF',
		}), settings);
		assert.strictEqual(name, '⏳ticket-1');

		// Running the same rebuild twice must not double the prefix.
		assert.strictEqual(
			N.managedName(name, ticket({
				...claimed,
				awaitingResponseFrom: 'STAFF',
			}), settings),
			'⏳ticket-1',
		);
	});

	/* ─────────────────────────── channel creation ─────────────────────────── */

	// `channels.js` is dependency-free for the same reason `naming.js` is, so it
	// can be driven here with hand-rolled fakes rather than a gateway. What these
	// cases pin is the part four call sites used to each get slightly wrong: the
	// shape of the overwrite array, the clamp, and the rule that once the channel
	// exists nothing may report failure.
	const C = require(path.join(root, 'src', 'lib', 'tickets', 'channels'));

	const role = (id, memberIds = []) => [id, {
		id,
		members: new Map(memberIds.map(m => [m, { id: m }])),
	}];

	const fakeGuild = (roles = []) => ({
		channels: {
			create: async options => ({
				...options,
				id: 'new1',
			}),
		},
		id: 'g1',
		roles: {
			cache: new Map(roles),
			everyone: { id: 'g1' },
		},
	});

	const fakeClient = (channels = []) => ({
		channels: { cache: new Map(channels.map(c => [c.id, c])) },
		log: {
			error: () => undefined,
			warn: () => undefined,
		},
		user: { id: 'bot' },
	});

	await t('a name is clamped after the prefix is added, not before', () => {
		const long = 'a'.repeat(100);
		assert.strictEqual(C.resolveName({
			prefix: '🔴',
			text: long,
		}).length, 101); // 100 code points, one of them a surrogate pair
		assert.strictEqual([...C.resolveName({
			prefix: '🔴',
			text: long,
		})].length, 100);
	});

	await t('a name renders the category template', () => {
		assert.strictEqual(C.resolveName({
			number: 7,
			template: 'ticket-{num}',
		}), 'ticket-7');
	});

	await t('overwrites are everyone-deny, bot, users, then roles', () => {
		const overwrites = C.buildOverwrites({
			access: {
				roleIds: ['r1', 'r2'],
				userIds: ['u1'],
			},
			clientId: 'bot',
			guild: fakeGuild(),
		});
		assert.deepStrictEqual(overwrites.map(o => o.id), ['g1', 'bot', 'u1', 'r1', 'r2']);
		assert.deepStrictEqual(overwrites[0].deny, ['ViewChannel']);
		assert.deepStrictEqual(overwrites[1].allow, C.PARTICIPANT_ALLOW);
	});

	await t('a public channel keeps no everyone-deny', () => {
		const overwrites = C.buildOverwrites({
			clientId: 'bot',
			everyoneDenied: false,
			guild: fakeGuild(),
		});
		assert.deepStrictEqual(overwrites.map(o => o.id), ['bot']);
	});

	await t('thread members expand from roles and stop at the cap', () => {
		const guild = fakeGuild([role('r1', ['a', 'b', 'c', 'd'])]);
		const capped = C.threadMemberIds({
			access: { roleIds: ['r1'] },
			clientId: 'bot',
			guild,
			memberCap: 3,
		});
		assert.strictEqual(capped.ids.length, 3);
		assert.ok(capped.truncated, 'a truncated expansion has to say so');

		// Uncapped, the bot is always in and an unknown role is skipped rather
		// than throwing: a role deleted between the settings write and the
		// create must not cost somebody their ticket.
		const all = C.threadMemberIds({
			access: { roleIds: ['r1', 'gone'] },
			clientId: 'bot',
			guild,
			memberCap: 50,
		});
		assert.deepStrictEqual(all.ids, ['bot', 'a', 'b', 'c', 'd']);
		assert.strictEqual(all.truncated, false);
	});

	await t('a full category is not reported as a bad name', () => {
		// The 50-children limit has no code of its own; it arrives as a form-body
		// rejection naming parent_id. Reading it generically would tell an admin
		// their name was wrong when their category is full.
		assert.strictEqual(C.classifyError({
			code: 50035,
			rawError: { errors: { parent_id: {} } },
		}), 'channel_limit');
		assert.strictEqual(C.classifyError({
			code: 50035,
			rawError: { errors: { name: {} } },
		}), 'invalid_name');
		assert.strictEqual(C.classifyError({ code: 50013 }), 'missing_permission');
		assert.strictEqual(C.classifyError({ code: 50001 }), 'missing_permission');
		assert.strictEqual(C.classifyError({ code: 30013 }), 'channel_limit');
		assert.strictEqual(C.classifyError({ code: 160006 }), 'channel_limit');
		assert.strictEqual(C.classifyError(new Error('nope')), 'create_failed');
	});

	await t('a parent in another guild is not a parent', () => {
		const client = fakeClient([{
			guildId: 'other',
			id: 'c1',
			type: 4,
		}]);
		assert.deepStrictEqual(C.resolveParent(client, {
			guild: fakeGuild(),
			mode: 'CHANNEL',
			parentId: 'c1',
		}), {
			ok: false,
			reason: 'no_parent',
		});
	});

	await t('a thread asked for on a thread is created beside it', () => {
		const parent = {
			guildId: 'g1',
			id: 'c1',
			type: 0,
		};
		const client = fakeClient([{
			guildId: 'g1',
			id: 't1',
			isThread: () => true,
			parent,
			type: 12,
		}]);
		const climbed = C.resolveParent(client, {
			climbToParent: true,
			guild: fakeGuild(),
			mode: 'THREAD',
			parentId: 't1',
		});
		assert.strictEqual(climbed.parent, parent);

		// With the option off it is an error rather than a surprise placement.
		assert.strictEqual(C.resolveParent(client, {
			climbToParent: false,
			guild: fakeGuild(),
			mode: 'THREAD',
			parentId: 't1',
		}).reason, 'wrong_parent_type');
	});

	await t('a forum post without a message is refused before anything is created', async () => {
		const result = await C.createChannel(fakeClient(), {
			guild: fakeGuild(),
			mode: 'FORUM',
			name: { text: 'x' },
			parentId: 'f1',
			reason: 'test',
		});
		assert.deepStrictEqual(result, {
			ok: false,
			reason: 'no_message',
		});
	});

	await t('a failed create is returned, not thrown', async () => {
		const guild = fakeGuild();
		guild.channels.create = async () => {
			const error = new Error('Missing Permissions');
			error.code = 50013;
			throw error;
		};
		const result = await C.createChannel(fakeClient(), {
			guild,
			mode: 'CHANNEL',
			name: { text: 'x' },
			reason: 'test',
		});
		assert.strictEqual(result.ok, false);
		assert.strictEqual(result.reason, 'missing_permission');
		assert.ok(result.error, 'the caller may still want to log the original');
	});

	await t('a created channel is never reported as a failure', async () => {
		// The rule the whole return shape exists for: once Discord has made the
		// channel, a caller that reads `ok: false` as "nothing happened" would
		// abandon a real channel with no row pointing at it. Every failure after
		// creation is a soft reason instead.
		const guild = fakeGuild([role('r1', ['a'])]);
		const created = {
			id: 'th1',
			members: {
				add: async () => {
					throw new Error('cannot add');
				},
			},
		};
		const parent = {
			guildId: 'g1',
			id: 'c1',
			threads: { create: async () => created },
			type: 0,
		};
		const result = await C.createChannel(fakeClient([parent]), {
			access: { roleIds: ['r1'] },
			guild,
			mode: 'THREAD',
			name: { text: 'staff' },
			parentId: 'c1',
			reason: 'test',
		});
		assert.strictEqual(result.ok, true);
		assert.strictEqual(result.channel, created);
	});

	await t('a private thread nobody could be added to says so', async () => {
		const created = {
			id: 'th1',
			members: { add: async () => undefined },
		};
		const parent = {
			guildId: 'g1',
			id: 'c1',
			threads: { create: async () => created },
			type: 0,
		};
		const result = await C.createChannel(fakeClient([parent]), {
			// A role whose members were never cached expands to nothing, which
			// produces a thread only the bot can see. Worth a reason in a run log.
			access: { roleIds: ['uncached'] },
			guild: fakeGuild(),
			mode: 'THREAD',
			name: { text: 'staff' },
			parentId: 'c1',
			reason: 'test',
		});
		assert.strictEqual(result.reason, 'no_members_resolved');
	});

	await t('a channel is created with the clamped name and the built overwrites', async () => {
		const guild = fakeGuild([role('r1')]);
		const parent = {
			guildId: 'g1',
			id: 'cat1',
			type: 4,
		};
		const result = await C.createChannel(fakeClient([parent]), {
			access: { roleIds: ['r1'] },
			guild,
			mode: 'CHANNEL',
			name: {
				number: 42,
				template: 'ticket-{num}',
			},
			parentId: 'cat1',
			rateLimitPerUser: 10,
			reason: 'test',
		});
		assert.strictEqual(result.ok, true);
		assert.strictEqual(result.name, 'ticket-42');
		assert.strictEqual(result.channel.parent, 'cat1');
		assert.strictEqual(result.channel.rateLimitPerUser, 10);
		assert.deepStrictEqual(result.channel.permissionOverwrites.map(o => o.id), ['g1', 'bot', 'r1']);
	});

	/* ──────────────────── finding a post that already exists ──────────────── */

	// "We already have threads with the user id as the title": a forum used as a
	// per-member record. The name is all an automation has to go on, since it
	// renders one and never learns an id.

	/** A parent whose threads live in three places, as Discord serves them. */
	const forum = ({
		active = [], archived = [], cached = [],
	}) => ({
		id: 'f1',
		threads: {
			cache: new Map(cached.map(t => [t.id, t])),
			fetchActive: async () => ({ threads: new Map(active.map(t => [t.id, t])) }),
			fetchArchived: async () => ({ threads: new Map(archived.map(t => [t.id, t])) }),
		},
		type: 15,
	});
	const thread = (id, name) => ({
		id,
		name,
	});

	await t('an existing post is found in the cache without a request', async () => {
		const parent = forum({ cached: [thread('t1', '319709731168223234')] });
		parent.threads.fetchActive = async () => {
			throw new Error('the cache should have answered this');
		};
		const found = await C.findThreadByName({
			name: '319709731168223234',
			parent,
		});
		assert.strictEqual(found?.id, 't1');
	});

	await t('an archived post is found, because that is where old ones are', async () => {
		// The case that matters most: a per-member record is archived far more
		// often than not, so a search that stopped at the active threads would
		// open a duplicate every time.
		const found = await C.findThreadByName({
			parent: forum({
				active: [thread('t1', 'someone else')],
				archived: [thread('t2', 'wanted')],
			}),
			name: 'wanted',
		});
		assert.strictEqual(found?.id, 't2');
	});

	await t('the archived list can be left out', async () => {
		const found = await C.findThreadByName({
			includeArchived: false,
			name: 'wanted',
			parent: forum({ archived: [thread('t2', 'wanted')] }),
		});
		assert.strictEqual(found, null);
	});

	await t('a name matches whatever its case and spacing', async () => {
		const found = await C.findThreadByName({
			name: 'Ticket-7',
			parent: forum({ active: [thread('t1', ' ticket-7 ')] }),
		});
		assert.strictEqual(found?.id, 't1');
	});

	await t('nothing matching is null, not the first thread', async () => {
		const found = await C.findThreadByName({
			name: 'wanted',
			parent: forum({ active: [thread('t1', 'something')] }),
		});
		assert.strictEqual(found, null);
	});

	await t('an empty name matches nothing, rather than everything', async () => {
		// A name template that renders empty must not adopt an unrelated post.
		const found = await C.findThreadByName({
			name: '  ',
			parent: forum({ active: [thread('t1', '')] }),
		});
		assert.strictEqual(found, null);
	});

	await t('a parent that cannot hold threads is not an error', async () => {
		assert.strictEqual(await C.findThreadByName({
			name: 'x',
			parent: { id: 'c1' },
		}), null);
		assert.strictEqual(await C.findThreadByName({
			name: 'x',
			parent: null,
		}), null);
	});

	await t('a failed lookup reads as "no match", so the post is still created', async () => {
		const parent = forum({});
		parent.threads.fetchActive = async () => {
			throw new Error('missing access');
		};
		parent.threads.fetchArchived = async () => {
			throw new Error('missing access');
		};
		assert.strictEqual(await C.findThreadByName({
			name: 'wanted',
			parent,
		}), null);
	});

	/* ────────────────────────── the deferred rename ──────────────────────── */

	// `syncChannelName` lives in `mutations.js`, which reaches the Temporal layer.
	// That layer is compiled, and a fresh checkout has not built it yet — so these
	// cases skip rather than turning `npm test` into something that needs
	// `npm run temporal.build` first.
	const fs = require('fs');
	if (!fs.existsSync(path.join(root, 'dist', 'temporal'))) {
		console.log('  skip  deferred rename (run `npm run temporal.build` to include these)');
	} else {
		// Stubbed on the gateway module rather than on `lib/temporal`, which
		// re-exports it through TypeScript's getter-only `export *` bindings —
		// assigning to one of those throws, and the throw would be swallowed by
		// the very try/catch these cases are here to exercise.
		const gateway = require(path.join(root, 'dist', 'temporal', 'gateway'));
		const { syncChannelName } = require(path.join(root, 'src', 'lib', 'tickets', 'mutations'));

		/** A client whose rename budget is already spent. */
		const exhausted = (log = []) => ({
			keyv: {
				get: async () => [Date.now(), Date.now()],
				set: async () => undefined,
			},
			log: { warn: (...args) => log.push(args) },
		});

		const renameable = () => ({
			name: 'ticket-42',
			setName: async () => undefined,
		});

		const openTicket = {
			claimedById: '1',
			guildId: 'g1',
			id: 't1',
			open: true,
		};

		await t('an exhausted budget parks the rename rather than dropping it', async () => {
			const parked = [];
			const original = gateway.deferChannelRename;
			gateway.deferChannelRename = async input => parked.push(input);
			try {
				const result = await syncChannelName(exhausted(), {
					channel: renameable(),
					settings: defaults(),
					ticket: openTicket,
				});
				assert.strictEqual(result.reason, 'rename_deferred');
				assert.strictEqual(parked.length, 1);
				assert.strictEqual(parked[0].ticketId, 't1');
				assert.strictEqual(parked[0].guildId, 'g1');
				assert.ok(parked[0].notBefore > Date.now(), 'the deadline must be in the future');
				// The parked request carries no name: the activity recomputes it, so
				// a claim or a move in the meantime is reflected rather than
				// overwritten by a stale opinion.
				assert.strictEqual(parked[0].name, undefined);
			} finally {
				gateway.deferChannelRename = original;
			}
		});

		await t('a Temporal outage degrades to the old behaviour', async () => {
			const original = gateway.deferChannelRename;
			gateway.deferChannelRename = async () => {
				throw new Error('no connection');
			};
			const warnings = [];
			try {
				const result = await syncChannelName(exhausted(warnings), {
					channel: renameable(),
					settings: defaults(),
					ticket: openTicket,
				});
				// Still `ok`: the database is right and only the visible name lags,
				// which is exactly what this branch did before deferral existed.
				assert.strictEqual(result.ok, true);
				assert.strictEqual(result.reason, 'rate_limited');
				assert.strictEqual(warnings.length, 1, 'the outage should be logged, not swallowed');
			} finally {
				gateway.deferChannelRename = original;
			}
		});

		await t('a deferral inside a deferral is refused', async () => {
			// The workflow owns the retry; deferring again from the activity that
			// the workflow just ran would race it.
			const parked = [];
			const original = gateway.deferChannelRename;
			gateway.deferChannelRename = async input => parked.push(input);
			try {
				const result = await syncChannelName(exhausted(), {
					channel: renameable(),
					defer: false,
					settings: defaults(),
					ticket: openTicket,
				});
				assert.strictEqual(result.reason, 'rate_limited');
				assert.ok(result.freesAt > Date.now(), 'the workflow needs a retry time');
				assert.strictEqual(parked.length, 0);
			} finally {
				gateway.deferChannelRename = original;
			}
		});

		await t('a name that is already right spends no budget and parks nothing', async () => {
			const parked = [];
			const original = gateway.deferChannelRename;
			gateway.deferChannelRename = async input => parked.push(input);
			try {
				const result = await syncChannelName(exhausted(), {
					channel: { name: '✅ticket-42' },
					settings: defaults(),
					ticket: openTicket,
				});
				assert.strictEqual(result.reason, 'noop');
				assert.strictEqual(parked.length, 0);
			} finally {
				gateway.deferChannelRename = original;
			}
		});

		/* ─────────────────── remembering a created channel ─────────────────── */

		const { recordTicketChannel } = require(path.join(root, 'src', 'lib', 'tickets', 'mutations'));

		/** A client whose ticket row is a plain object, and which counts refreshes. */
		const recordingClient = (createdChannelIds, refreshed = []) => {
			let row = createdChannelIds;
			return {
				prisma: {
					ticket: {
						findUnique: async () => (row === undefined ? null : { createdChannelIds: row }),
						update: async ({ data }) => {
							row = data.createdChannelIds;
							return { createdChannelIds: row };
						},
					},
				},
				read: () => row,
				tickets: { getTicket: async (id, force) => refreshed.push([id, force]) },
			};
		};

		await t('a created channel is remembered against the ticket', async () => {
			const refreshed = [];
			const client = recordingClient([], refreshed);
			assert.deepStrictEqual(await recordTicketChannel(client, 't1', '999'), { ok: true });
			assert.deepStrictEqual(client.read(), ['999']);
			// The ticket cache is keyed for three minutes and nothing else clears
			// it, so a later step in the same run would read the pre-write row.
			assert.deepStrictEqual(refreshed, [['t1', true]]);
		});

		await t('a NULL column reads as an empty list', async () => {
			// The column has no default, because MySQL cannot give a JSON column
			// one. Every read has to cope with that rather than assume an array.
			const client = recordingClient(null);
			await recordTicketChannel(client, 't1', '999');
			assert.deepStrictEqual(client.read(), ['999']);
		});

		await t('recording the same channel twice writes nothing', async () => {
			const refreshed = [];
			const client = recordingClient(['999'], refreshed);
			assert.deepStrictEqual(await recordTicketChannel(client, 't1', '999'), {
				ok: true,
				reason: 'noop',
			});
			assert.deepStrictEqual(refreshed, [], 'a no-op must not bust the cache');
		});

		await t('the list is capped, oldest first', async () => {
			// Cleanup state, not a log: a runaway automation must not grow the row
			// without bound, and the oldest ids are the likeliest to be dead.
			const client = recordingClient(Array.from({ length: 25 }, (_, i) => `c${i}`));
			await recordTicketChannel(client, 't1', 'new');
			const stored = client.read();
			assert.strictEqual(stored.length, 25);
			assert.strictEqual(stored[24], 'new');
			assert.strictEqual(stored[0], 'c1', 'the oldest entry should have been dropped');
		});

		await t('a ticket that has gone is reported, not thrown', async () => {
			const client = recordingClient(undefined);
			assert.deepStrictEqual(await recordTicketChannel(client, 't1', '999'), {
				ok: false,
				reason: 'unknown_ticket',
			});
		});
	}

	/* ────────────────────────────── the cooldown ────────────────────────────── */

	console.log('\nCategory cooldowns\n');

	// The bug these exist for: an admin shortened a category's cooldown to test
	// something and went on being told to wait three days, because the expiry
	// had been computed at creation and cached. Deriving it at read time is the
	// fix, and every case below is a way of asking "against which cooldown?".

	const HOUR = 3_600_000;
	const now = 1_770_000_000_000;

	await t('a cooldown is measured against the category as it is now, not as it was', () => {
		const created = now - 2 * HOUR;
		// Opened under a three-day cooldown, which has since been cut to one hour.
		assert.strictEqual(CD.cooldownExpiry(created, HOUR, now), null);
	});

	await t('lengthening a cooldown extends an existing wait', () => {
		const created = now - 2 * HOUR;
		assert.strictEqual(CD.cooldownExpiry(created, 5 * HOUR, now), created + 5 * HOUR);
	});

	await t('the expiry is when the wait ends, so the member is told how long is left', () => {
		const created = now - HOUR;
		assert.strictEqual(CD.cooldownExpiry(created, 3 * HOUR, now) - now, 2 * HOUR);
	});

	await t('a category with no cooldown never holds anybody up', () => {
		assert.strictEqual(CD.cooldownExpiry(now, 0, now), null);
		assert.strictEqual(CD.cooldownExpiry(now, null, now), null);
	});

	await t('a member who has never opened one here is not on cooldown', () => {
		assert.strictEqual(CD.cooldownExpiry(null, HOUR, now), null);
	});

	await t('a Date reads the same as epoch milliseconds', () => {
		const created = now - HOUR;
		assert.strictEqual(CD.cooldownExpiry(new Date(created), 3 * HOUR, now), created + 3 * HOUR);
	});

	await t('a cache entry that is not a time is ignored rather than trusted', () => {
		assert.strictEqual(CD.cooldownExpiry('later', HOUR, now), null);
	});

	await t('the key names the category and the member, and not the old shape', () => {
		// The old key held an expiry. Both shapes are epoch milliseconds, so
		// reading one as the other would silently double somebody's wait — which
		// is why the fix moved namespace instead of reusing it.
		assert.strictEqual(CD.cooldownKey(4, '123'), 'cooldowns/category-member-created:4-123');
		assert.ok(!CD.cooldownKey(4, '123').startsWith('cooldowns/category-member:'));
	});

	/* ─────────────────── closing when Temporal is unreachable ───────────── */

	// The reason this suite grew a section that needs the compiled layer: a
	// Temporal that was unreachable answered every close with "an unexpected
	// error occurred" and left the ticket open. Closing is the one thing that
	// has to work whether or not the durable machinery is up.
	if (!fs.existsSync(path.join(root, 'dist', 'temporal'))) {
		console.log('  skip  closing during a Temporal outage (run `npm run temporal.build` to include these)');
	} else {
		const gateway = require(path.join(root, 'dist', 'temporal', 'gateway'));
		const TicketManager = require(path.join(root, 'src', 'lib', 'tickets', 'manager'));

		const closingTicket = (over = {}) => ({
			categoryId: 1,
			createdById: 'u1',
			guild: {
				errorColour: '#ff0000',
				footer: 'footer',
				locale: 'en-GB',
				primaryColour: '#0000ff',
				reopenWindow: 0,
				successColour: '#00ff00',
			},
			guildId: 'g1',
			id: 'c1',
			...over,
		});

		/** Enough of a manager for `acceptClose`, plus a record of what it did. */
		const managerFor = ticket => {
			const record = {
				closed: [],
				replies: [],
				warnings: [],
			};
			const self = {
				$closeRequests: new Map(),
				client: {
					i18n: { getLocale: () => (key => key) },
					log: {
						error: (...args) => record.warnings.push(args),
						warn: (...args) => record.warnings.push(args),
					},
				},
				finallyClose: async (ticketId, opts) => {
					record.closed.push({
						ticketId,
						...opts,
					});
				},
				getTicket: async () => ticket,
			};
			const interaction = {
				channel: { id: ticket.id },
				editReply: async payload => record.replies.push(payload),
				guild: { iconURL: () => null },
				user: { id: 'u2' },
			};
			return {
				interaction,
				record,
				self,
			};
		};

		const withGateway = async (stubs, fn) => {
			const originals = {};
			for (const [name, impl] of Object.entries(stubs)) {
				originals[name] = gateway[name];
				gateway[name] = impl;
			}
			try {
				return await fn();
			} finally {
				for (const [name, impl] of Object.entries(originals)) gateway[name] = impl;
			}
		};

		await t('an unreachable Temporal closes the ticket here instead of erroring', async () => {
			const {
				interaction, record, self,
			} = managerFor(closingTicket());
			self.$closeRequests.set('c1', {
				closedBy: 'u9',
				reason: 'solved',
			});
			await withGateway({
				cancelCloseRequestTimeout: async () => {
					throw new Error('Temporal client has not been initialised. Call initTemporalClient() first.');
				},
				startCloseTicket: async () => {
					throw new Error('unreachable');
				},
			}, () => TicketManager.prototype.acceptClose.call(self, interaction));

			assert.strictEqual(record.closed.length, 1, 'the ticket must still be closed');
			assert.deepStrictEqual(record.closed[0], {
				closedBy: 'u9',
				reason: 'solved',
				ticketId: 'c1',
			});
			assert.strictEqual(record.replies.length, 1);
			// The success embed, not `misc.error.title`.
			assert.strictEqual(record.replies[0].embeds[0].data.title, 'ticket.close.closed.title');
			assert.strictEqual(record.warnings.length, 1, 'the outage should be logged, not swallowed');
			assert.strictEqual(self.$closeRequests.has('c1'), false);
		});

		await t('a reachable Temporal still owns the close', async () => {
			const {
				interaction, record, self,
			} = managerFor(closingTicket());
			const started = [];
			await withGateway({
				cancelCloseRequestTimeout: async () => undefined,
				startCloseTicket: async input => started.push(input),
			}, () => TicketManager.prototype.acceptClose.call(self, interaction));

			assert.strictEqual(started.length, 1);
			assert.strictEqual(started[0].ticketId, 'c1');
			// Closing twice is what the in-process fallback must not do when the
			// workflow has it.
			assert.strictEqual(record.closed.length, 0);
			assert.strictEqual(record.replies[0].embeds[0].data.title, 'ticket.close.closed.title');
		});

		await t('a grace window falls back to closing now, not to staying open', async () => {
			const {
				interaction, record, self,
			} = managerFor(closingTicket({
				guild: {
					...closingTicket().guild,
					reopenWindow: 60_000,
				},
			}));
			await withGateway({
				cancelCloseRequestTimeout: async () => undefined,
				startReopenWindow: async () => {
					throw new Error('unreachable');
				},
			}, () => TicketManager.prototype.acceptClose.call(self, interaction));

			assert.strictEqual(record.closed.length, 1);
			assert.strictEqual(record.closed[0].closedBy, 'u2', 'the presser closes it when no request is pending');
		});
	}

	console.log(`\n${pass} passed\n`);
})();
