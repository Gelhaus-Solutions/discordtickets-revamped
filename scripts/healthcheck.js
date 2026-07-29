/* eslint-disable no-console */
/**
 * Is the bot's HTTP server up?
 *
 * Used by the Docker HEALTHCHECK (so the runtime image needs no curl) and
 * available as `npm run healthcheck` for systemd timers, panels and monitoring
 * that has no HTTP probe of its own.
 *
 * Exit 0 = healthy. Note that `/status` deliberately answers 200 with
 * `"temporal": "degraded"` when Temporal is unreachable: the bot still serves
 * Discord and the dashboard, and restarting it would not bring Temporal back —
 * it would just add a restart loop to the outage. Monitor the body for that.
 */
const http = require('http');
const {
	ENV_FILE, loadEnv,
} = require('./lib/paths');

loadEnv();

const port = process.env.HTTP_PORT || 8169;
// 127.0.0.1 rather than HTTP_HOST: the bind address may be 0.0.0.0, which is
// not a valid destination on every platform.
const timeout = Number(process.env.DT_HEALTHCHECK_TIMEOUT_MS) || 5000;

const request = http.get({
	host: '127.0.0.1',
	path: '/status',
	port,
	timeout,
}, res => {
	let body = '';
	res.setEncoding('utf8');
	res.on('data', chunk => (body += chunk));
	res.on('end', () => {
		if (res.statusCode !== 200) {
			console.error(`unhealthy: /status returned ${res.statusCode}`);
			process.exit(1);
		}
		try {
			const status = JSON.parse(body);
			const degraded = Object.entries(status)
				.filter(([, value]) => value === 'degraded' || value === false)
				.map(([key]) => key);
			if (degraded.length) console.log(`healthy (degraded: ${degraded.join(', ')})`);
			else console.log('healthy');
		} catch {
			console.log('healthy');
		}
		process.exit(0);
	});
});

request.on('timeout', () => {
	request.destroy();
	console.error(`unhealthy: no response from 127.0.0.1:${port} within ${timeout}ms`);
	process.exit(1);
});

request.on('error', error => {
	console.error(`unhealthy: ${error.message} (127.0.0.1:${port}, env: ${ENV_FILE})`);
	process.exit(1);
});
