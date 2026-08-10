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
const t = (name, fn) => {
	try {
		fn();
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

(() => {
	console.log('\nTicket channel naming\n');

	/* ─────────────────────────── the precedence table ─────────────────────────── */

	t('an open unclaimed ticket has no prefix by default', () => {
		assert.strictEqual(N.managedPrefix(ticket(), defaults()), '');
	});

	t('a claimed ticket gets the claim tick', () => {
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), defaults()), '✅');
	});

	t('a closed ticket has no prefix by default', () => {
		assert.strictEqual(N.managedPrefix(ticket({ open: false }), defaults()), '');
	});

	t('closed beats claimed', () => {
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

	t('the priority emoji follows the state emoji', () => {
		assert.strictEqual(
			N.managedPrefix(ticket({
				claimedById: '1',
				priority: 'HIGH',
			}), defaults()),
			'✅🔴',
		);
	});

	t('no priority means no priority emoji', () => {
		assert.strictEqual(N.managedPrefix(ticket({ priority: null }), defaults()), '');
	});

	/* ───────────────────────────── the override ───────────────────────────── */

	t('an override replaces the state emoji but keeps the priority one', () => {
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

	t('scope \'all\' replaces the whole prefix', () => {
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

	t('an unrecognised scope behaves as state, so a hand-edited row degrades safely', () => {
		assert.strictEqual(
			N.managedPrefix(ticket({
				emojiOverride: '🔥',
				emojiOverrideScope: 'nonsense',
				priority: 'LOW',
			}), defaults()),
			'🔥🟢',
		);
	});

	t('a custom server emoji override resolves to nothing rather than leaking a tag', () => {
		const name = N.managedPrefix(ticket({
			emojiOverride: '<:urgent:123456789012345678>',
			emojiOverrideScope: 'state',
		}), defaults());
		assert.strictEqual(name, '');
	});

	/* ───────────────────────── configuration and inheritance ───────────────────────── */

	t('a category emoji beats the guild one', () => {
		const settings = settingsFor({ claimedEmoji: '👀' }, { claimedEmoji: '🙌' });
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), settings), '👀');
	});

	t('a guild emoji reaches a category that sets none', () => {
		const settings = settingsFor({}, { claimedEmoji: '🙌' });
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), settings), '🙌');
	});

	t('an empty string turns the claim tick off without inheriting it', () => {
		const settings = settingsFor({ claimedEmoji: '' }, { claimedEmoji: '🙌' });
		assert.strictEqual(N.managedPrefix(ticket({ claimedById: '1' }), settings), '');
	});

	t('an unclaimed emoji shows on a new ticket once configured', () => {
		const settings = settingsFor({ unclaimedEmoji: '🟡' });
		assert.strictEqual(N.managedPrefix(ticket(), settings), '🟡');
	});

	/* ───────────────────────────── stripping ───────────────────────────── */

	t('a surrogate pair is stripped whole', () => {
		// The regression test for `.slice(1)`, which would cut 🔴 in half and leave
		// a lone surrogate in the channel name.
		const settings = defaults();
		assert.strictEqual(N.stripManagedPrefix('🔴ticket-1', ticket(), settings), 'ticket-1');
	});

	t('a ZWJ sequence is stripped whole', () => {
		const settings = settingsFor({ claimedEmoji: '🏳️‍🌈' });
		assert.strictEqual(N.stripManagedPrefix('🏳️‍🌈ticket-1', ticket(), settings), 'ticket-1');
	});

	t('a skin-tone sequence is stripped whole', () => {
		const settings = settingsFor({ claimedEmoji: '👍🏽' });
		assert.strictEqual(N.stripManagedPrefix('👍🏽ticket-1', ticket(), settings), 'ticket-1');
	});

	t('the longer of two overlapping emojis is stripped first', () => {
		// `👍` is a prefix of `👍🏽`; stripping it first would strand the modifier.
		const settings = settingsFor({ claimedEmoji: '👍🏽' }, { claimedEmoji: '👍' });
		assert.strictEqual(N.stripManagedPrefix('👍🏽ticket-1', ticket(), settings), 'ticket-1');
	});

	t('a legacy claim tick still strips after the category changes its emoji', () => {
		// The channel was named before the guild configured anything, so it is
		// wearing ✅ while the category now says 👀.
		const settings = settingsFor({ claimedEmoji: '👀' });
		assert.strictEqual(N.stripManagedPrefix('✅ticket-1', ticket(), settings), 'ticket-1');
	});

	t('a guild\'s emoji strips even when a category overrides it', () => {
		// The channel predates the category override and carries the guild value.
		const settings = settingsFor({ claimedEmoji: '👀' }, { claimedEmoji: '🙌' });
		assert.strictEqual(N.stripManagedPrefix('🙌ticket-1', ticket(), settings), 'ticket-1');
	});

	t('both slots strip together', () => {
		assert.strictEqual(N.stripManagedPrefix('✅🔴ticket-1', ticket(), defaults()), 'ticket-1');
	});

	t('the legacy neutral-priority emoji still strips', () => {
		assert.strictEqual(N.stripManagedPrefix('🔵ticket-1', ticket(), defaults()), 'ticket-1');
	});

	t('a user-authored emoji in the middle of a name is left alone', () => {
		assert.strictEqual(N.stripManagedPrefix('ticket-🎫-1', ticket(), defaults()), 'ticket-🎫-1');
	});

	/* ───────────────────────────── rebuilding ───────────────────────────── */

	t('managedName is idempotent', () => {
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

	t('a rename from claimed to released drops only the claim tick', () => {
		const settings = defaults();
		const claimed = N.managedName('ticket-1', ticket({
			claimedById: '1',
			priority: 'LOW',
		}), settings);
		assert.strictEqual(claimed, '✅🟢ticket-1');
		assert.strictEqual(N.managedName(claimed, ticket({ priority: 'LOW' }), settings), '🟢ticket-1');
	});

	t('clampName keeps a name within Discord\'s limit without splitting an emoji', () => {
		const long = '🔴'.repeat(120);
		const clamped = N.clampName(long);
		assert.strictEqual([...clamped].length, 100);
		// A split surrogate pair would leave a lone high surrogate here.
		assert.ok(!/[\uD800-\uDBFF]$/.test(clamped), 'clamped name ends in a lone surrogate');
	});

	t('managedName clamps, so a maximal template cannot break channel creation', () => {
		const settings = settingsFor({ unclaimedEmoji: '🟡' });
		const name = N.managedName('a'.repeat(100), ticket(), settings);
		assert.ok([...name].length <= 100, `${[...name].length} code points`);
	});

	/* ───────────────────────────── the template ───────────────────────────── */

	t('renderChannelName fills in the supported placeholders', () => {
		const rendered = N.renderChannelName('{name}-{num}', {
			creator: {
				displayName: 'Alexa',
				user: { username: 'alex' },
			},
			number: 7,
		});
		assert.strictEqual(rendered, 'alex-7');
	});

	t('renderChannelName keeps the 1488 guard', () => {
		assert.strictEqual(N.renderChannelName('ticket-{num}', { number: 1488 }), 'ticket-1487b');
	});

	t('renderChannelName falls back for a creator who has left', () => {
		assert.strictEqual(
			N.renderChannelName('{name}-{num}', {
				fallback: '123',
				number: 2,
			}),
			'123-2',
		);
	});

	/* ─────────────────── the property the migration rests on ─────────────────── */

	t('a category with no configuration produces exactly the old name', () => {
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

	console.log(`\n${pass} passed\n`);
})();
