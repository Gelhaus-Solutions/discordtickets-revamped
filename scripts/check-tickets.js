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
	}

	console.log(`\n${pass} passed\n`);
})();
