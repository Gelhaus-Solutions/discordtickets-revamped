/**
 * Checks `src/lib/tickets/retention.js`, which deletes a closed ticket's
 * transcript 24 months after it closed.
 *
 * Nothing here talks to a database: the Prisma client is a small in-memory
 * fake that understands exactly the filters the sweep uses. What is under test
 * is which tickets are due, that the ticket row itself stays, that batching
 * visits every ticket once, and that the log carries counts and nothing else.
 *
 * Not wired into `npm test`: run it with `node scripts/check-retention.js`.
 */
const assert = require('assert');
const path = require('path');

const {
	TRANSCRIPT_RETENTION_MONTHS, purgeExpiredTranscripts, retentionCutoff,
} = require(path.join(__dirname, '..', 'src', 'lib', 'tickets', 'retention'));

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

const NOW = new Date('2026-10-02T12:00:00Z');
const monthsAgo = (months, extraDays = 0) => {
	const d = new Date(NOW);
	d.setUTCMonth(d.getUTCMonth() - months);
	d.setUTCDate(d.getUTCDate() - extraDays);
	return d;
};

/** A client whose tables are arrays, with only the calls the sweep makes. */
function fakeClient(tickets, { failFileDelete = false } = {}) {
	const tables = {
		archivedChannel: [],
		archivedMessage: [],
		archivedRole: [],
		archivedUser: [],
		feedback: [],
		questionAnswer: [],
	};
	const logs = [];
	const deletedFiles = [];
	const has = (table, id) => tables[table].some(row => row.ticketId === id);
	const matches = (ticket, where) => {
		if (where.open !== undefined && ticket.open !== where.open) return false;
		if (where.closedAt && !(ticket.closedAt && ticket.closedAt < where.closedAt.lt)) return false;
		if (where.id.gt !== undefined && !(ticket.id > where.id.gt)) return false;
		return where.OR.some(cond => {
			if (cond.archivedChannels) return has('archivedChannel', ticket.id);
			if (cond.archivedMessages) return has('archivedMessage', ticket.id);
			if (cond.archivedRoles) return has('archivedRole', ticket.id);
			if (cond.archivedUsers) return has('archivedUser', ticket.id);
			if (cond.feedback) return has('feedback', ticket.id);
			if (cond.questionAnswers) return has('questionAnswer', ticket.id);
			if (cond.htmlTranscript) return ticket.htmlTranscript !== null;
			throw new Error('unexpected condition');
		});
	};
	const del = table => ({
		deleteMany: ({ where }) => ({
			run: () => {
				const before = tables[table].length;
				tables[table] = tables[table].filter(row => !where.ticketId.in.includes(row.ticketId));
				return { count: before - tables[table].length };
			},
		}),
	});
	const prisma = {
		$transaction: async ops => ops.map(op => op.run()),
		archivedChannel: del('archivedChannel'),
		archivedMessage: del('archivedMessage'),
		archivedRole: del('archivedRole'),
		archivedUser: del('archivedUser'),
		feedback: del('feedback'),
		questionAnswer: del('questionAnswer'),
		ticket: {
			findMany: async ({
				where, take,
			}) => tickets
				.filter(ticket => matches(ticket, where))
				.sort((a, b) => (a.id < b.id ? -1 : 1))
				.slice(0, take)
				.map(({
					htmlTranscript, id,
				}) => ({
					htmlTranscript,
					id,
				})),
			updateMany: ({ where }) => ({
				run: () => {
					let count = 0;
					for (const ticket of tickets) {
						if (where.id.in.includes(ticket.id) && ticket.htmlTranscript !== null) {
							ticket.htmlTranscript = null;
							count++;
						}
					}
					return { count };
				},
			}),
		},
	};
	const client = {
		log: { info: (...args) => logs.push(args) },
		prisma,
		storage: {
			for: () => ({
				delete: async key => {
					if (failFileDelete) throw new Error('disk on fire');
					deletedFiles.push(key);
					return true;
				},
			}),
		},
	};
	return {
		client,
		deletedFiles,
		logs,
		tables,
	};
}

/** Gives a ticket one row in every transcript table. */
const fill = (tables, id, userId = 'u1') => {
	tables.archivedChannel.push({
		channelId: 'c',
		ticketId: id,
	});
	tables.archivedRole.push({
		roleId: 'r',
		ticketId: id,
	});
	tables.archivedUser.push({
		ticketId: id,
		userId,
	});
	tables.archivedMessage.push({
		id: `${id}-m1`,
		ticketId: id,
	});
	tables.archivedMessage.push({
		id: `${id}-m2`,
		ticketId: id,
	});
	tables.questionAnswer.push({ ticketId: id });
	tables.feedback.push({ ticketId: id });
};

const ticket = (id, closedAt, extra = {}) => ({
	closedAt,
	htmlTranscript: null,
	id,
	open: false,
	...extra,
});

(async () => {
	console.log('\nTranscript retention\n');

	await t('the window is 24 months', () => assert.strictEqual(TRANSCRIPT_RETENTION_MONTHS, 24));

	await t('the cutoff is the same date 24 months back, clamped to a short month', () => {
		assert.strictEqual(retentionCutoff(new Date('2026-10-02T12:00:00Z')).toISOString(), '2024-10-02T12:00:00.000Z');
		assert.strictEqual(retentionCutoff(new Date('2026-02-28T00:00:00Z')).toISOString(), '2024-02-28T00:00:00.000Z');
		// 2028-02-29 minus 24 months is 2026-02, which has no 29th.
		assert.strictEqual(retentionCutoff(new Date('2028-02-29T00:00:00Z')).toISOString(), '2026-02-28T00:00:00.000Z');
	});

	await t('deletes the transcript of a ticket closed 24 months ago and keeps the ticket', async () => {
		const tickets = [ticket('t1', monthsAgo(24, 1), { htmlTranscript: 'local:transcripts/ticket-t1.html' })];
		const f = fakeClient(tickets);
		fill(f.tables, 't1');
		const totals = await purgeExpiredTranscripts(f.client, { now: NOW });
		assert.deepStrictEqual(totals, {
			answers: 1,
			channels: 1,
			feedback: 1,
			files: 1,
			messages: 2,
			roles: 1,
			tickets: 1,
			users: 1,
		});
		for (const rows of Object.values(f.tables)) assert.strictEqual(rows.length, 0);
		assert.strictEqual(tickets.length, 1);
		assert.strictEqual(tickets[0].htmlTranscript, null);
		assert.deepStrictEqual(f.deletedFiles, ['transcripts/ticket-t1.html']);
	});

	await t('leaves tickets closed under 24 months ago, open tickets and never-closed ones alone', async () => {
		const tickets = [
			ticket('recent', monthsAgo(23)),
			ticket('open', monthsAgo(30), { open: true }),
			ticket('never', null),
		];
		const f = fakeClient(tickets);
		for (const { id } of tickets) fill(f.tables, id);
		const totals = await purgeExpiredTranscripts(f.client, { now: NOW });
		assert.strictEqual(totals.tickets, 0);
		assert.strictEqual(f.tables.archivedMessage.length, 6);
	});

	await t('batches visit every due ticket once, whatever the batch size', async () => {
		const tickets = [];
		const f = fakeClient(tickets);
		for (let i = 0; i < 7; i++) {
			const id = `t${i}`;
			tickets.push(ticket(id, monthsAgo(25 + i)));
			fill(f.tables, id);
		}
		tickets.push(ticket('keep', monthsAgo(1)));
		fill(f.tables, 'keep');
		const totals = await purgeExpiredTranscripts(f.client, {
			batchSize: 3,
			now: NOW,
		});
		assert.strictEqual(totals.tickets, 7);
		assert.strictEqual(totals.messages, 14);
		assert.strictEqual(f.tables.archivedMessage.length, 2);
		assert.strictEqual(f.tables.feedback[0].ticketId, 'keep');
		// A second run has nothing left to do.
		assert.strictEqual((await purgeExpiredTranscripts(f.client, {
			batchSize: 3,
			now: NOW,
		})).tickets, 0);
	});

	await t('a ticket with only feedback or only a stored file is still due', async () => {
		const tickets = [
			ticket('fb', monthsAgo(30)),
			ticket('file', monthsAgo(30), { htmlTranscript: 'local:transcripts/ticket-file.html' }),
		];
		const f = fakeClient(tickets);
		f.tables.feedback.push({ ticketId: 'fb' });
		const totals = await purgeExpiredTranscripts(f.client, { now: NOW });
		assert.strictEqual(totals.tickets, 2);
		assert.strictEqual(totals.feedback, 1);
		assert.strictEqual(tickets[1].htmlTranscript, null);
	});

	await t('a file that cannot be deleted does not stop the sweep', async () => {
		const tickets = [ticket('t1', monthsAgo(30), { htmlTranscript: 'local:transcripts/ticket-t1.html' })];
		const f = fakeClient(tickets, { failFileDelete: true });
		f.client.log.warn = () => { };
		const totals = await purgeExpiredTranscripts(f.client, { now: NOW });
		assert.strictEqual(totals.tickets, 1);
		assert.strictEqual(totals.files, 0);
	});

	await t('the log carries counts and nothing about a ticket', async () => {
		const tickets = [ticket('secret-ticket-id', monthsAgo(30))];
		const f = fakeClient(tickets);
		fill(f.tables, 'secret-ticket-id', 'secret-user-id');
		await purgeExpiredTranscripts(f.client, { now: NOW });
		const line = JSON.stringify(f.logs);
		assert.ok(!line.includes('secret'), line);
		assert.ok(f.logs.every(args => args.slice(1).every(arg => typeof arg === 'number' || /^\d{4}-\d{2}-\d{2}$/.test(arg))));
	});

	console.log(`\n${pass} passed${process.exitCode ? ', some FAILED' : ''}\n`);
})();
