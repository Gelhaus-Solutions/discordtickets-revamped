const { FrameworkClient } = require('@eartharoid/dbf');
const {
	GatewayIntentBits,
	Partials,
} = require('discord.js');
const logger = require('./lib/logger');
const { loadConfig } = require('./lib/config');
const { dataPath } = require('./lib/paths');
const { createStorage } = require('./lib/storage');
const { setLogger: setThreadsLogger } = require('./lib/threads');
const {
	guardListeners, instrumentInteractions,
} = require('./lib/sentry-interactions');
const { PrismaClient } = require('@prisma/client');
const Sentry = require('@sentry/node');
const Keyv = require('keyv');
const I18n = require('@eartharoid/i18n');
const fs = require('fs');
const { join } = require('path');
const YAML = require('yaml');
const TicketManager = require('./lib/tickets/manager');
const { AutomationManager } = require('./lib/automations/manager');
const temporal = require('./lib/temporal');
const ms = require('ms');

module.exports = class Client extends FrameworkClient {
	constructor() {
		super(
			{
				intents: [
					...[
						GatewayIntentBits.DirectMessages,
						GatewayIntentBits.DirectMessageReactions,
						GatewayIntentBits.DirectMessageTyping,
						GatewayIntentBits.MessageContent,
						GatewayIntentBits.Guilds,
						GatewayIntentBits.GuildMembers,
						GatewayIntentBits.GuildMessages,
					],
					...(process.env.PUBLIC_BOT !== 'true' ? [GatewayIntentBits.GuildPresences] : []),
				],
				partials: [
					Partials.Channel,
					Partials.Message,
					Partials.Reaction,
				],
				shards: 'auto',
				waitGuildTimeout: ms('1h'),
			},
			{ baseDir: __dirname },
		);

		this.config = {};
		this.log = {};
		this.init();

		// After `super()`, so every module's `loadAll()` has already run and the
		// components exist to be wrapped.
		//
		// Listener guarding is unconditional — it is a robustness fix, not
		// telemetry. Interaction spans only make sense with a DSN configured.
		guardListeners(this);
		if (process.env.SENTRY_DSN) instrumentInteractions(this);
	}

	async init(reload = false) {
		const locales = {};
		fs.readdirSync(join(__dirname, 'i18n'))
			.filter(file => file.endsWith('.yml'))
			.forEach(file => {
				const data = fs.readFileSync(join(__dirname, 'i18n/' + file), { encoding: 'utf8' });
				const name = file.slice(0, file.length - 4);
				locales[name] = YAML.parse(data);
			});

		/** @type {I18n} */
		this.i18n = new I18n('en-GB', locales);

		// to maintain references, these shouldn't be reassigned
		//
		// `loadConfig()` fills the operator's file in from the shipped defaults.
		// Their copy is seeded once and never overwritten, so without this any key
		// added after they installed reads as `undefined` — every consumer would
		// otherwise need its own fallback for a default that already exists.
		Object.assign(this.config, loadConfig());
		Object.assign(this.log, logger(this.config));

		// Worker-pool diagnostics default to the console, which never reaches the
		// configured log files. Hand them the real logger now that it exists.
		setThreadsLogger(this.log);

		// Where transcripts are written and read. Constructed here so that every
		// consumer — the ticket manager, the HTTP routes and the Temporal
		// activities, which all reach the client — shares one configured driver.
		this.storage = createStorage({
			config: this.config,
			log: this.log,
		});

		this.banned_guilds = new Set(
			(() => {
				let array = fs.readFileSync(dataPath('user', 'banned-guilds.txt'), 'utf8').trim().split(/\r?\n/);
				if (array[0] === '') array = [];
				return array;
			})(),
		);
		this.log.info(`${this.banned_guilds.size} guilds are banned`);

		if (reload) {
			await this.initAfterLogin();
		} else {
			this.keyv = new Keyv();

			this.tickets = new TicketManager(this);

			// Beside `tickets` on purpose: the Temporal activities are written as
			// `client.<manager>.<method>`, so the durability layer needs no extra
			// dependency wiring to reach automations.
			this.automations = new AutomationManager(this);

			this.supers = (process.env.SUPER ?? '').split(',');

			/** @param {import('discord.js/typings').Interaction} interaction */
			this.commands.interceptor = async interaction => {
				if (!interaction.inGuild()) return;
				const id = interaction.guildId;
				const cacheKey = `cache/known/guild:${id}`;
				if (await this.keyv.has(cacheKey)) return;
				await this.prisma.guild.upsert({
					create: {
						id,
						locale: this.i18n.locales.find(locale => locale === interaction.guild.preferredLocale), // undefined if not supported
					},
					update: {},
					where: { id },
				});
				await this.keyv.set(cacheKey, true);
			};
		}
	}

	async initAfterLogin() {
		for (const id of this.banned_guilds) {
			if (this.guilds.cache.has(id)) {
				this.log.info(`Leaving banned guild ${id}`);
				await this.guilds.cache.get(id).leave();
			}
		}
	}

	async login(token) {
		const levels = ['error', 'info', 'warn'];
		if (this.config.logs.level === 'debug') levels.push('query');

		const prisma_options = {
			log: levels.map(level => ({
				emit: 'event',
				level,
			})),
		};

		/** @type {PrismaClient} */
		const prisma = new PrismaClient(prisma_options);

		// Attached before `$extends` below: an extended client has no `$on`.
		prisma.$on('error', e => this.log.error.prisma(`${e.target} ${e.message}`));
		prisma.$on('info', e => this.log.info.prisma(`${e.target} ${e.message}`));
		prisma.$on('warn', e => this.log.warn.prisma(`${e.target} ${e.message}`));
		prisma.$on('query', e => this.log.debug.prisma(e));

		// Name each query in traces. This complements the engine-level spans from
		// Sentry's prismaIntegration, which time the actual SQL but cannot say
		// which model/operation asked for it.
		//
		// Only extended when Sentry is on: an extended client drops `$on`, and
		// there is no reason to hand that difference to the majority of installs
		// that never set a DSN.
		this.prisma = process.env.SENTRY_DSN
			? prisma.$extends({
				query: {
					async $allOperations({
						args, model, operation, query,
					}) {
						// Only nest inside an existing trace. Without this every
						// background query — cache warming, the stats schedule,
						// automation retention — would start a transaction of its
						// own and bury the requests that actually matter.
						if (!Sentry.getActiveSpan()) return query(args);
						return Sentry.startSpan({
							attributes: {
								'db.operation.name': operation,
								'db.system.name': 'prisma',
								...(model ? { 'db.collection.name': model } : {}),
							},
							name: model ? `${model}.${operation}` : operation,
							op: 'db',
						}, () => query(args));
					},
				},
			})
			: prisma;

		// Migrations are applied by scripts/postinstall.js before the process
		// starts, which fails the boot if they don't succeed. There used to be a
		// second runner here, but it resolved `prisma/schema.prisma` relative to
		// the working directory — `/home/container` in Docker, where the schema
		// lives at `/app` — so it silently skipped, and its catch-all swallowed
		// every real failure anyway.
		return super.login(token);
	}

	async destroy() {
		// Order matters: stop taking new work, then drain it, then let go of the
		// database. The HTTP server used to keep serving requests while Temporal
		// and Prisma were being torn down underneath it.
		try {
			await this.fastify?.close();
		} catch (error) {
			this.log.error(error);
		}
		try {
			temporal.stopSearchAttributeRetries();
			await temporal.stopWorker();
			await temporal.closeTemporalClient();
		} catch (error) {
			this.log.error(error);
		}
		await this.prisma.$disconnect();
		return super.destroy();
	}
};
