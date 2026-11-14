/**
 * Checks `TicketManager#exportGuildToFile`, the archive behind a guild export.
 *
 * No database and no network: the client is a fake with only the calls the
 * export makes, transcripts live in a temporary local storage root, and
 * `fetch` (the guild icon) is stubbed. What is under test is what lands in the
 * ZIP, that a missing transcript is counted rather than failing the export,
 * that transcripts are read one at a time, that cancelling stops it, and that
 * a source stream failing ends the export instead of leaving it open for ever.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const unzipper = require('unzipper');

const TicketManager = require(path.join(__dirname, '..', 'src', 'lib', 'tickets', 'manager'));
const { LocalStorage } = require(path.join(__dirname, '..', 'src', 'lib', 'storage', 'local'));

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

const GUILD = '123';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-export-'));
const root = path.join(dir, 'user');
fs.mkdirSync(path.join(root, 'transcripts'), { recursive: true });
fs.writeFileSync(path.join(root, 'transcripts', 'ticket-ta.html'), '<p>a</p>');
fs.writeFileSync(path.join(root, 'transcripts', 'ticket-tb.html'), '<p>b</p>');
const local = new LocalStorage({ root });

/** A qualified ref, a legacy path, one whose file is gone, and an inline one. */
const STORED = [
	{
		htmlTranscript: 'local:transcripts/ticket-ta.html',
		id: 'ta',
	},
	{
		htmlTranscript: 'user/transcripts/ticket-tb.html',
		id: 'tb',
	},
	{
		htmlTranscript: 'local:transcripts/ticket-tc.html',
		id: 'tc',
	},
	{
		htmlTranscript: '<html>inline</html>',
		id: 'td',
	},
];

function fakeClient(storage = local) {
	const logs = [];
	const client = {
		guilds: {
			cache: new Map([[GUILD, {
				icon: null,
				id: GUILD,
				name: 'G',
			}]]),
		},
		log: {
			info: (...args) => logs.push(['info', ...args]),
			warn: (...args) => logs.push(['warn', ...args]),
		},
		prisma: {
			guild: {
				findUnique: async () => ({
					categories: [],
					id: GUILD,
					tags: [],
				}),
			},
			// The export's own ticket batches come back empty, so no worker
			// thread is ever spawned; the transcript query gets STORED.
			ticket: { findMany: async options => (options.select ? STORED : []) },
		},
		storage: { for: () => storage },
		user: { id: 'bot' },
	};
	return {
		client,
		logs,
	};
}

const icon = () => new Response(new Uint8Array([137, 80, 78, 71]));
let n = 0;
const run = (client, heartbeat = () => { }, signal) => {
	const out = path.join(dir, `export-${n++}.zip`);
	return TicketManager.prototype.exportGuildToFile.call({ client }, GUILD, out, heartbeat, signal);
};

(async () => {
	global.fetch = async () => icon();

	await t('the archive holds settings, tickets and every transcript that exists', async () => {
		const {
			client, logs,
		} = fakeClient();
		let beats = 0;
		const out = await run(client, () => beats++);
		const zip = await unzipper.Open.file(out, { tailSize: 512 });
		const entries = {};
		for (const file of zip.files) entries[file.path] = (await file.buffer()).toString();
		assert.deepStrictEqual(Object.keys(entries).sort(), [
			'icon.png', 'settings.json', 'tickets.jsonl', 'transcripts/ta.html', 'transcripts/tb.html', 'transcripts/td.html',
		]);
		assert.strictEqual(entries['transcripts/ta.html'], '<p>a</p>');
		assert.strictEqual(entries['transcripts/tb.html'], '<p>b</p>');
		assert.strictEqual(entries['transcripts/td.html'], '<html>inline</html>');
		assert.ok(beats > 0, 'heartbeats');
		assert.ok(logs.some(([level, message, count]) => level === 'warn' && /missing from storage/.test(message) && count === 1), JSON.stringify(logs));
		assert.ok(!logs.some(([, message]) => /Could not add/.test(message)), 'a missing transcript is counted, not warned about one by one');
	});

	await t('transcripts are read one at a time, and other storage errors only warn', async () => {
		let open = 0;
		let peak = 0;
		const slow = Object.create(local);
		slow.get = async key => {
			peak = Math.max(peak, ++open);
			await new Promise(resolve => setTimeout(resolve, 10));
			open--;
			if (key.endsWith('ticket-tb.html')) throw Object.assign(new Error('unreachable'), { code: 'UNAVAILABLE' });
			return local.get(key);
		};
		const {
			client, logs,
		} = fakeClient(slow);
		await run(client);
		assert.strictEqual(peak, 1);
		assert.ok(logs.some(([, message, id]) => /Could not add the transcript/.test(message) && id === 'tb'), JSON.stringify(logs));
	});

	await t('an export cancelled before it starts rejects', async () => {
		const controller = new AbortController();
		controller.abort();
		await assert.rejects(run(fakeClient().client, () => { }, controller.signal), /cancelled|aborted/i);
	});

	await t('an export cancelled on its first heartbeat rejects', async () => {
		const controller = new AbortController();
		await assert.rejects(run(fakeClient().client, () => controller.abort(), controller.signal), /cancelled|aborted/i);
	});

	await t('a source stream that fails ends the export instead of hanging it', async () => {
		global.fetch = async () => new Response(new ReadableStream({
			pull(controller) {
				controller.error(new Error('icon broke'));
			},
		}));
		const outcome = await Promise.race([
			run(fakeClient().client).then(() => 'resolved', error => `rejected: ${error.message}`),
			new Promise(resolve => setTimeout(() => resolve('hung'), 3000)),
		]);
		global.fetch = async () => icon();
		assert.match(outcome, /^rejected: .*icon broke/);
	});

	fs.rmSync(dir, {
		force: true,
		recursive: true,
	});
	console.log(`\n${pass} passed${process.exitCode ? ', some FAILED' : ''}\n`);
	// The discord.js and Prisma modules the manager pulls in keep handles open.
	setTimeout(() => process.exit(), 50);
})();
