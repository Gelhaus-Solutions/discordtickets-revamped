/**
 * Checks `src/lib/config.js`, which fills an operator's config in from the
 * shipped defaults.
 *
 * This runs on every boot and its output is the `client.config` every listener,
 * command and route reads, so a mistake here is not a mistake in one feature —
 * it is a mistake in all of them at once. The three rules asserted below are
 * the ones with teeth:
 *
 *   - arrays replace, so an operator who deleted a presence activity does not
 *     get it back on the next upgrade;
 *   - an explicit `null` beats the default, because writing it is a decision;
 *   - a key the operator has never heard of resolves to the shipped value
 *     rather than `undefined`, which is the whole point.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { mergeDefaults } = require(path.join(__dirname, '..', 'src', 'lib', 'config'));

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

(() => {
	console.log('\nConfig defaults\n');

	console.log('== merging ==');

	t('an absent key takes the shipped default', () => {
		const merged = mergeDefaults({ stats: true }, {});
		assert.strictEqual(merged.stats, true);
	});

	t('a set key wins over the default', () => {
		const merged = mergeDefaults({ stats: true }, { stats: false });
		assert.strictEqual(merged.stats, false);
	});

	t('an absent nested block is filled in whole', () => {
		const merged = mergeDefaults(
			{
				storage: {
					driver: 'local',
					s3: { bucket: '' },
				},
			},
			{ logs: { level: 'debug' } },
		);
		assert.deepStrictEqual(merged.storage, {
			driver: 'local',
			s3: { bucket: '' },
		});
		assert.strictEqual(merged.logs.level, 'debug');
	});

	t('a partially set nested block keeps the untouched defaults', () => {
		const merged = mergeDefaults(
			{
				logs: {
					files: {
						directory: './logs',
						enabled: true,
					},
					level: 'info',
				},
			},
			{ logs: { level: 'debug' } },
		);
		assert.strictEqual(merged.logs.level, 'debug');
		assert.strictEqual(merged.logs.files.directory, './logs');
		assert.strictEqual(merged.logs.files.enabled, true);
	});

	t('an explicit null beats the default', () => {
		const merged = mergeDefaults({ templates: { transcript: 'transcript.md' } }, { templates: { transcript: null } });
		assert.strictEqual(merged.templates.transcript, null);
	});

	t('arrays replace rather than merging element-wise', () => {
		// The operator deleted every activity but one. Merging by index would
		// hand back the four they removed.
		const merged = mergeDefaults(
			{ presence: { activities: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] } },
			{ presence: { activities: [{ name: 'only' }] } },
		);
		assert.deepStrictEqual(merged.presence.activities, [{ name: 'only' }]);
	});

	t('an empty operator config is entirely defaults', () => {
		const defaults = {
			a: 1,
			b: { c: 2 },
		};
		assert.deepStrictEqual(mergeDefaults(defaults, {}), defaults);
	});

	t('the defaults are not mutated', () => {
		const defaults = { logs: { level: 'info' } };
		mergeDefaults(defaults, { logs: { level: 'debug' } });
		assert.strictEqual(defaults.logs.level, 'info');
	});

	t('a scalar replacing an object does not recurse', () => {
		const merged = mergeDefaults({ storage: { driver: 'local' } }, { storage: 'local' });
		assert.strictEqual(merged.storage, 'local');
	});

	console.log('\n== the shipped file ==');

	const shipped = YAML.parse(
		fs.readFileSync(path.join(__dirname, '..', 'src', 'user', 'config.yml'), 'utf8'),
	);

	t('parses', () => {
		assert.ok(shipped && typeof shipped === 'object');
	});

	t('carries every key the storage layer reads', () => {
		// `src/lib/storage` reads these off the merged config. If the shipped file
		// stops declaring them, existing installs get `undefined` back and the
		// driver falls over at the first ticket close rather than at boot.
		assert.ok(shipped.storage, 'no storage block');
		assert.strictEqual(shipped.storage.driver, 'local', 'the default driver must stay local');
		assert.ok(shipped.storage.s3, 'no storage.s3 block');
		for (const key of ['bucket', 'endpoint', 'forcePathStyle', 'prefix', 'region']) {
			assert.ok(key in shipped.storage.s3, `storage.s3.${key} is missing`);
		}
	});

	console.log(`\n${pass} checks passed`);
})();
