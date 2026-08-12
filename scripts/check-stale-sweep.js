/**
 * Checks `sweepStaleTickets`, the safety net under the per-ticket inactivity
 * timers.
 *
 * The sweep exists because `staleTicketWorkflow` is the only thing that closes
 * an inactive ticket, and a workflow is not a guarantee — it fails when an
 * activity exhausts its retries, it stops when it is terminated, and it makes
 * no progress at all while no worker polls the version it is assigned to. When
 * that happens the channel is left holding a "will be closed <t:…:R>" message
 * for a deadline nothing is counting down to any more.
 *
 * So the sweep re-derives those deadlines from the database. That arithmetic is
 * duplicated from the workflow by necessity (one runs from a timer, the other
 * from a schedule) and this is what keeps the two honest:
 *
 *   - `staleAfter` then `autoClose`, counted from the last message — or from
 *     `createdAt` on a ticket that never got one, which is what
 *     `getStaleConfig` does;
 *   - `autoClose: 0` means warn and never close, so such a ticket is never
 *     overdue however long it sits there;
 *   - a guild's reopen grace window is honoured, so the sweep performs the
 *     close the workflow would have performed and not a harsher one.
 *
 * The other half is what it must NOT touch. Closing a ticket is destructive and
 * this runs unattended every quarter of an hour, so an over-eager sweep is a
 * worse bug than the one it fixes: active tickets, closed tickets, guilds with
 * the feature off, the public bot (which never arms these timers), and grace
 * windows whose workflow is alive and answering are all asserted here.
 */
const assert = require('assert');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist', 'temporal');

// Patched on the module object, which is how the compiled activity reaches
// them: it calls `gateway.startCloseTicket(...)` rather than holding a binding.
const gateway = require(path.join(DIST, 'gateway'));
const { makeActivities } = require(path.join(DIST, 'activities'));

const calls = [];
let reopenState = null;
gateway.ensureStaleWorkflow = async i => calls.push(['rearm', i.ticketId]);
gateway.startCloseTicket = async i => calls.push(['close', i.ticketId]);
gateway.startReopenWindow = async i => calls.push(['reopen-window', i.ticketId, i.windowMs]);
gateway.queryReopenState = async () => reopenState;

let pass = 0;
const t = async (name, fn) => {
	try {
		calls.length = 0;
		await fn();
		pass++;
		console.log('  ok  ', name);
	} catch (e) {
		console.log('  FAIL', name, '\n       ', e.message);
		process.exitCode = 1;
	}
};

const HOUR = 3600e3;
const now = Date.now();
const ago = hours => new Date(now - hours * HOUR);
const did = (kind, id) => calls.some(c => c[0] === kind && c[1] === id);
const touched = id => calls.some(c => c[1] === id);

/** staleAfter 2h + autoClose 4h: overdue 6h (plus the grace) after the last message. */
const guild = () => ({
	autoClose: 4 * HOUR,
	id: 'g1',
	reopenWindow: 0,
	staleAfter: 2 * HOUR,
});

const tickets = [
	{
		createdAt: ago(20),
		id: 'overdue',
		lastMessageAt: ago(7),
		open: true,
		pendingCloseAt: null,
	},
	{
		createdAt: ago(20),
		id: 'warned-not-due',
		lastMessageAt: ago(3),
		open: true,
		pendingCloseAt: null,
	},
	{
		createdAt: ago(20),
		id: 'active',
		lastMessageAt: ago(1),
		open: true,
		pendingCloseAt: null,
	},
	{
		createdAt: ago(20),
		id: 'never-spoke',
		lastMessageAt: null,
		open: true,
		pendingCloseAt: null,
	},
	{
		createdAt: ago(20),
		id: 'already-closed',
		lastMessageAt: ago(9),
		open: false,
		pendingCloseAt: null,
	},
	{
		createdAt: ago(20),
		id: 'stuck-pending',
		lastMessageAt: ago(9),
		open: true,
		pendingCloseAt: ago(3),
	},
	{
		createdAt: ago(20),
		id: 'fresh-pending',
		lastMessageAt: ago(9),
		open: true,
		pendingCloseAt: new Date(now - 60e3),
	},
];

/** Just enough of Prisma's `where` to answer the two queries the sweep asks. */
const matches = (row, where) => {
	if ('open' in where && row.open !== where.open) return false;
	if ('pendingCloseAt' in where) {
		const clause = where.pendingCloseAt;
		if (clause === null) {
			if (row.pendingCloseAt !== null) return false;
		} else if (!row.pendingCloseAt || row.pendingCloseAt > clause.lte) {
			return false;
		}
	}
	if (where.OR && !where.OR.some(clause => (
		clause.lastMessageAt === null
			? row.lastMessageAt === null && row.createdAt <= clause.createdAt.lte
			: row.lastMessageAt && row.lastMessageAt <= clause.lastMessageAt.lte
	))) return false;
	return true;
};

const sweepWith = async guilds => {
	const client = {
		log: { warn: () => { } },
		prisma: {
			guild: { findMany: async () => guilds },
			ticket: {
				findMany: async ({
					take, where,
				}) => tickets.filter(row => matches(row, where)).slice(0, take),
			},
		},
	};
	return makeActivities({ client }).sweepStaleTickets();
};

(async () => {
	console.log('\n== what the sweep finishes ==');

	await t('a ticket past staleAfter + autoClose is closed', async () => {
		const result = await sweepWith([guild()]);
		assert.ok(did('close', 'overdue'));
		assert.strictEqual(result.closed, 2); // 'overdue' and 'never-spoke'
		assert.strictEqual(result.truncated, false);
	});

	await t('a ticket that never got a message counts from createdAt', async () => {
		await sweepWith([guild()]);
		assert.ok(did('close', 'never-spoke'));
	});

	await t('an inactive ticket that is not due yet is only re-armed', async () => {
		const result = await sweepWith([guild()]);
		assert.ok(did('rearm', 'warned-not-due'));
		assert.strictEqual(result.rearmed, 1);
	});

	await t('a grace window nothing is counting down any more is closed', async () => {
		const result = await sweepWith([guild()]);
		assert.ok(did('close', 'stuck-pending'));
		assert.strictEqual(result.pendingClosed, 1);
	});

	await t('a guild with a reopen window closes through it, not around it', async () => {
		await sweepWith([{
			...guild(),
			reopenWindow: 2 * HOUR,
		}]);
		assert.ok(calls.some(c => c[0] === 'reopen-window' && c[1] === 'overdue' && c[2] === 2 * HOUR));
		assert.ok(!did('close', 'overdue'));
	});

	console.log('\n== what it must leave alone ==');

	await t('a ticket someone is still talking in', async () => {
		await sweepWith([guild()]);
		assert.ok(!touched('active'));
	});

	await t('a ticket that is already closed', async () => {
		await sweepWith([guild()]);
		assert.ok(!touched('already-closed'));
	});

	await t('a grace window that has only just started', async () => {
		await sweepWith([guild()]);
		assert.ok(!touched('fresh-pending'));
	});

	await t('a grace window whose workflow is alive and says so', async () => {
		reopenState = {
			closeAt: now + HOUR,
			reopened: false,
		};
		const result = await sweepWith([guild()]);
		reopenState = null;
		assert.ok(!touched('stuck-pending'), 'a live reopen workflow must be believed over the setting');
		assert.strictEqual(result.pendingClosed, 0);
	});

	await t('autoClose 0 means warn but never close', async () => {
		const result = await sweepWith([{
			...guild(),
			autoClose: 0,
		}]);
		assert.strictEqual(result.closed, 0);
		assert.ok(!did('close', 'overdue'));
	});

	await t('staleAfter unset turns the whole thing off for that guild', async () => {
		const result = await sweepWith([{
			...guild(),
			staleAfter: null,
		}]);
		assert.strictEqual(result.closed, 0);
		assert.strictEqual(result.rearmed, 0);
	});

	await t('the public bot, which never armed these timers, fires nothing', async () => {
		const previous = process.env.PUBLIC_BOT;
		process.env.PUBLIC_BOT = 'true';
		try {
			await sweepWith([guild()]);
		} finally {
			if (previous === undefined) delete process.env.PUBLIC_BOT;
			else process.env.PUBLIC_BOT = previous;
		}
		assert.deepStrictEqual(calls, []);
	});

	console.log(`\n${pass} checks passed`);
})();
