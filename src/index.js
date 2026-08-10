/**
 * Discord Tickets
 * Copyright (C) 2022 Isaac Saunders
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @name discord-tickets/bot
 * @description An open-source Discord bot for ticket management
 * @copyright 2022 Isaac Saunders
 * @license GNU-GPLv3
 */

/* eslint-disable no-console */

const pkg = require('../package.json');
const banner = require('./lib/banner');
banner(pkg.version); // print big title

const semver = require('semver');
const { colours } = require('leeks.js');
const path = require('path');

// check node version
if (!semver.satisfies(process.versions.node, pkg.engines.node)) {
	console.log('\x07' + colours.redBright(`Error: Your current Node.js version, ${process.versions.node}, does not meet the requirement "${pkg.engines.node}". Please update to version ${semver.minVersion(pkg.engines.node).version} or higher.`));
	process.exit(1);
}

process.env.NODE_ENV ??= 'production'; // make sure NODE_ENV is set

// The working directory no longer decides anything: code is resolved against
// APP_DIR and state against DATA_DIR, both of which come from the file's own
// location unless DT_APP_DIR/DT_DATA_DIR say otherwise. This replaces a warning
// that told the operator their cwd was "wrong" without doing anything about it.
const {
	APP_DIR, DATA_DIR, ENV_FILE,
} = require('./env');
require('./env').load(); // load and check environment variables
console.log(colours.gray(`  app: ${APP_DIR}`));
console.log(colours.gray(` data: ${DATA_DIR}  (env: ${ENV_FILE})`));

// Sentry has to be initialised before anything it auto-instruments is required
// — that includes the logger (leekslazylogger), Prisma, discord.js and Fastify.
// It only needs the environment, which is loaded above, so it goes here rather
// than further down where a logger would be available to announce it.
const { isEnabled: sentryEnabled } = require('./sentry-init.js');
if (sentryEnabled()) console.log(colours.gray(' sentry: enabled'));

const fs = require('fs');
const YAML = require('yaml');
const logger = require('./lib/logger');

// create a Logger using the default config
// and set listeners as early as possible.
const { dataPath } = require('./lib/paths');
let config = YAML.parse(fs.readFileSync(path.join(__dirname, 'user/config.yml'), 'utf8'));
let log = logger(config);

// `client.destroy()` is async — it drains the Temporal worker and disconnects
// Prisma. Calling process.exit() on the same tick abandoned in-flight
// activities, which Temporal then had to wait out (up to the 60-minute
// startToCloseTimeout on export/import) before retrying them elsewhere.
// The timeout keeps a stuck shutdown from hanging the container forever.
const SHUTDOWN_TIMEOUT_MS = 20_000;
let exiting = false;

async function exit(signal) {
	if (exiting) return;
	exiting = true;
	log.notice(`Received ${signal}`);
	try {
		await Promise.race([
			client.destroy(),
			new Promise(resolve => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS).unref()),
		]);
	} catch (error) {
		log.error(error);
	}
	// After the catch, so anything client.destroy() logged on its way out is
	// included. Bounded, because the shutdown budget is already tight: docker
	// stop allows 10s by default (docker-compose.yml raises it), and this runs
	// after the race above.
	if (sentryEnabled()) await require('@sentry/node').flush(2000).catch(() => {});
	process.exit(0);
}

process.on('SIGTERM', () => exit('SIGTERM'));

process.on('SIGINT', () => exit('SIGINT'));

process.on('uncaughtException', (error, origin) => {
	log.notice(`Discord Tickets v${pkg.version} on Node.js ${process.version} (${process.platform})`);
	log.warn(`Uncaught exception (${origin})`);
	log.error(error);
	// No Sentry.flush() here: onUncaughtExceptionIntegration captures this
	// automatically, and because this listener is registered the SDK does not
	// force-exit, so the event drains normally.
});

// This used to be conflated with the handler above, whose message claimed to
// cover rejections while nothing actually listened for them. Sentry's
// onUnhandledRejection integration reports these from v10 onwards, so they may
// as well be logged too.
process.on('unhandledRejection', reason => {
	log.warn('Unhandled promise rejection');
	log.error(reason);
});

process.on('warning', warning => log.warn(warning.stack || warning));

const Client = require('./client');
const http = require('./http');

// Seed the data directory with the default config/templates, without ever
// overwriting an operator's edits.
fs.cpSync(path.join(__dirname, 'user'), dataPath('user'), {
	force: false,
	recursive: true,
});

// initialise the framework and client,
// which also loads the custom config and creates a new Logger.
const client = new Client(config, log);

// allow any config changes to affect the above listeners
// as long as these `client` properties are not reassigned.
config = client.config;
log = client.log;

// start the bot and then the web server
client.login().then(() => {
	http(client);
});
