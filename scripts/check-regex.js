/**
 * Checks `src/lib/regex.js`, the guard on admin-supplied patterns.
 *
 * Two failure modes matter, in opposite directions:
 *
 *   - a catastrophic-backtracking pattern that gets through blocks the whole
 *     process (single-threaded: gateway, HTTP and every other guild with it);
 *   - an over-eager check refuses ordinary patterns that admins actually use,
 *     which silently stops their auto-tags and message triggers from matching.
 *
 * So the safe cases are asserted as loudly as the dangerous ones, and the
 * timing case at the end is the real proof: a known-bad pattern against a
 * pathological input must not be able to spend seconds inside `test`.
 */
const assert = require('assert');
const path = require('path');
const regex = require(path.join(__dirname, '..', 'src', 'lib', 'regex'));

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

// Shapes that backtrack catastrophically.
const DANGEROUS = [
	'(a+)+$',
	'(a*)*b',
	'(a|aa)+$',
	'(\\s+)*$',
	'^(([a-z])+.)+[A-Z]([a-z])+$', // the classic "validate an identifier" bomb
	'((a+)+)+b',
	'(x+x+)+y',
	'(a{1,})+b',
];

// Patterns a real admin would write. None of these may be refused.
const SAFE = [
	'hello',
	'^!help$',
	'\\brefund\\b',
	'(cat|dog)',
	'https?://\\S+',
	'[a-z]+',
	'a+b+c+',
	'^(one|two|three)$',
	'\\d{3}-\\d{4}',
	'(?:foo)+',
	'^ticket #\\d+$',
	'.*',
];

(() => {
	console.log('\nRegex safety\n');

	for (const pattern of DANGEROUS) {
		t(`rejects ${pattern}`, () => {
			assert.strictEqual(regex.isSafePattern(pattern), false);
			assert.strictEqual(regex.isValidPattern(pattern, 'i'), false);
			assert.strictEqual(regex.compile(pattern, 'i'), null);
			assert.strictEqual(regex.test(pattern, 'i', 'aaaaaaaaaaaaaaaaaaaaaaaa!'), false);
		});
	}

	for (const pattern of SAFE) {
		t(`allows ${pattern}`, () => {
			assert.strictEqual(regex.isSafePattern(pattern), true, 'refused a reasonable pattern');
			assert.strictEqual(regex.isValidPattern(pattern, 'i'), true);
			assert.ok(regex.compile(pattern, 'i') instanceof RegExp);
		});
	}

	t('safe patterns still match what they should', () => {
		assert.strictEqual(regex.test('^!help$', 'i', '!HELP'), true);
		assert.strictEqual(regex.test('\\brefund\\b', 'i', 'can I get a refund please'), true);
		assert.strictEqual(regex.test('\\brefund\\b', 'i', 'refunded'), false);
		assert.strictEqual(regex.test('(cat|dog)', 'i', 'my Dog'), true);
	});

	t('an uncompilable pattern is false, not a throw', () => {
		assert.strictEqual(regex.isValidPattern('([a-z]', 'i'), false);
		assert.strictEqual(regex.test('([a-z]', 'i', 'abc'), false);
	});

	t('a pattern longer than the cap is refused', () => {
		assert.strictEqual(regex.isSafePattern('a'.repeat(regex.MAX_PATTERN_LENGTH + 1)), false);
		assert.strictEqual(regex.isSafePattern('a'.repeat(regex.MAX_PATTERN_LENGTH)), true);
	});

	t('input is truncated before matching', () => {
		// The pattern only matches beyond the truncation point.
		const long = 'x'.repeat(regex.MAX_INPUT_LENGTH) + 'needle';
		assert.strictEqual(regex.test('needle', 'i', long), false);
		assert.strictEqual(regex.test('needle', 'i', 'needle'), true);
	});

	t('global patterns do not carry lastIndex between calls', () => {
		assert.strictEqual(regex.test('a', 'g', 'a'), true);
		assert.strictEqual(regex.test('a', 'g', 'a'), true);
	});

	t('a repeated pattern is compiled once', () => {
		const first = regex.compile('cache-me', 'i');
		assert.strictEqual(regex.compile('cache-me', 'i'), first);
	});

	t('matching a known bomb cannot block the event loop', () => {
		const started = process.hrtime.bigint();
		// 40 a's against `(a+)+$` is minutes of backtracking if it compiles.
		assert.strictEqual(regex.test('(a+)+$', 'i', 'a'.repeat(40) + '!'), false);
		const ms = Number(process.hrtime.bigint() - started) / 1e6;
		assert.ok(ms < 50, `took ${ms.toFixed(1)}ms`);
	});

	console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
})();
