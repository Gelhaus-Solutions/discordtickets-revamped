const { FrameworkClient } = require('@eartharoid/dbf');
const {
	GatewayIntentBits,
	Partials,
} = require('discord.js');
const logger = require('./lib/logger');
const { setLogger: setThreadsLogger } = require('./lib/threads');
const { PrismaClient } = require('@prisma/client');
const Keyv = require('keyv');
const I18n = require('@eartharoid/i18n');
const fs = require('fs');
const { join } = require('path');
const YAML = require('yaml');
const TicketManager = require('./lib/tickets/manager');
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
		Object.assign(this.config, YAML.parse(fs.readFileSync('./user/config.yml', 'utf8')));
		Object.assign(this.log, logger(this.config));

		// Worker-pool diagnostics default to the console, which never reaches the
		// configured log files. Hand them the real logger now that it exists.
		setThreadsLogger(this.log);

		this.banned_guilds = new Set(
			(() => {
				let array = fs.readFileSync('./user/banned-guilds.txt', 'utf8').trim().split(/\r?\n/);
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
		this.prisma = new PrismaClient(prisma_options);

		this.prisma.$on('error', e => this.log.error.prisma(`${e.target} ${e.message}`));
		this.prisma.$on('info', e => this.log.info.prisma(`${e.target} ${e.message}`));
		this.prisma.$on('warn', e => this.log.warn.prisma(`${e.target} ${e.message}`));
		this.prisma.$on('query', e => this.log.debug.prisma(e));

		// Migrations are applied by scripts/postinstall.js before the process
		// starts, which fails the boot if they don't succeed. There used to be a
		// second runner here, but it resolved `prisma/schema.prisma` relative to
		// the working directory — `/home/container` in Docker, where the schema
		// lives at `/app` — so it silently skipped, and its catch-all swallowed
		// every real failure anyway.
		return super.login(token);
	}

	async destroy() {
		try {
			await temporal.stopWorker();
			await temporal.closeTemporalClient();
		} catch (error) {
			this.log.error(error);
		}
		await this.prisma.$disconnect();
		return super.destroy();
	}
};
