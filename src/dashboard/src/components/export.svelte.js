/**
 * Guild exports, which run in the background on the server.
 *
 * Kept outside the modals so closing one loses nothing: an export started here
 * keeps being polled while the dashboard is open and downloads itself when it
 * is ready.
 *
 * `state` is `idle`, `running`, `ready` (finished, waiting to be downloaded)
 * or `failed`. `waiting` marks an export this page asked for, which is the
 * only kind that downloads without another click.
 */
const exports = $state({});
const timers = {};

const POLL_MS = 2000;
/** Failed polls in a row before the export is reported as failed. */
const MAX_POLL_ERRORS = 3;

const url = (guild) => `/api/admin/guilds/${guild}/export`;

function download(guild) {
	exports[guild].state = 'idle';
	exports[guild].waiting = false;
	window.location.assign(`${url(guild)}/download`);
}

/**
 * @param {Response} response
 * @returns {Promise<{state: string}>}
 */
async function read(response) {
	const body = await response.json().catch(() => ({}));
	if (response.status === 401 && body.elevate) {
		window.location.href = `/auth/login?r=${encodeURIComponent(window.location.pathname + window.location.search)}&role=${body.elevate}`;
	}
	if (!response.ok) throw new Error(body.message ?? `HTTP ${response.status}`);
	return body;
}

/**
 * @param {string} guild
 * @param {string} state what the server said
 */
function apply(guild, state) {
	const entry = exports[guild];
	entry.errors = 0;
	if (state === 'running') {
		entry.state = 'running';
		timers[guild] = setTimeout(() => poll(guild), POLL_MS);
	} else if (state === 'ready') {
		if (entry.waiting) download(guild);
		else entry.state = 'ready';
	} else if (state === 'failed' && entry.waiting) {
		entry.state = 'failed';
		entry.waiting = false;
	} else {
		// `none`, or a failure this page did not ask for and has no reason to report.
		entry.state = 'idle';
		entry.waiting = false;
	}
}

async function poll(guild) {
	clearTimeout(timers[guild]);
	try {
		apply(guild, (await read(await fetch(url(guild)))).state);
	} catch {
		const entry = exports[guild];
		entry.errors = (entry.errors ?? 0) + 1;
		if (entry.errors < MAX_POLL_ERRORS) {
			timers[guild] = setTimeout(() => poll(guild), POLL_MS);
		} else {
			entry.state = 'failed';
			entry.waiting = false;
		}
	}
}

const IDLE = Object.freeze({ errors: 0, state: 'idle', waiting: false });

/**
 * The export of a guild, reactive. Safe to read inside `$derived`: it never
 * writes, and a guild nobody is watching yet reads as idle.
 * @param {string} guild
 */
export function getExport(guild) {
	return exports[guild] ?? IDLE;
}

/**
 * Start tracking a guild's export. The first call asks the server where it
 * stands, so an export started earlier shows as running or ready.
 * @param {string} guild
 */
export function watchExport(guild) {
	if (!exports[guild]) {
		exports[guild] = { ...IDLE };
		poll(guild);
	}
	return exports[guild];
}

/**
 * The export button: download a ready export, otherwise start one (or join
 * the one already running) and download it when it is ready.
 * @param {string} guild
 */
export async function startExport(guild) {
	const entry = watchExport(guild);
	if (entry.state === 'ready') return download(guild);
	if (entry.state === 'running' && entry.waiting) return;

	entry.state = 'running';
	entry.waiting = true;
	clearTimeout(timers[guild]);
	try {
		apply(guild, (await read(await fetch(url(guild), { method: 'POST' }))).state);
	} catch {
		entry.state = 'failed';
		entry.waiting = false;
	}
}
