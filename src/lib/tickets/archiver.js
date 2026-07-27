const { pools } = require('../threads');

const { crypto } = pools;

/**
 * Returns highest (roles.highest) hoisted role, or everyone
 * @param {import("discord.js").GuildMember} member
 * @returns {import("discord.js").Role}
 */
const hoistedRole = member => member.roles.hoist || member.guild.roles.everyone;

module.exports = class TicketArchiver {
	constructor(client) {
		/** @type {import("client")} */
		this.client = client;
	}

	/** Add or update a message
	 * @param {string} ticketId
	 * @param {import("discord.js").Message} message
	 * @param {boolean?} external
	 * @returns {import("@prisma/client").ArchivedMessage|boolean}
	 */
	async saveMessage(ticketId, message, external = false) {
		if (process.env.OVERRIDE_ARCHIVE === 'false') return false;

		if (!message.member) {
			try {
				message.member = await message.guild.members.fetch(message.author.id);
			} catch {
				this.client.log.verbose('Failed to fetch member %s of %s', message.author.id, message.guild.id);
			}
		}

		const channels = new Set(message.mentions.channels.values());
		const members = new Set(message.mentions.members.values());
		const roles = new Set(message.mentions.roles.values());

		try {
			const queries = [];

			members.add(message.member);

			for (const member of members) {
				roles.add(hoistedRole(member));
			}

			for (const role of roles) {
				const data = {
					colour: role.hexColor.slice(1),
					name: role.name,
				};
				queries.push(
					this.client.prisma.archivedRole.upsert({
						create: {
							...data,
							roleId: role.id,
							ticketId,
						},
						select: { ticketId: true },
						update: data,
						where: {
							ticketId_roleId: {
								roleId: role.id,
								ticketId,
							},
						},
					}),
				);
			}

			for (const member of members) {
				const data = {
					avatar: member.avatar || member.user.avatar, // TODO: save avatar in user/avatars/
					bot: member.user.bot,
					discriminator: member.user.discriminator,
					displayName: member.displayName ? await crypto.queue(w => w.encrypt(member.displayName)) : null,
					roleId: !!member && hoistedRole(member).id,
					username: await crypto.queue(w => w.encrypt(member.user.username)),
				};
				queries.push(
					this.client.prisma.archivedUser.upsert({
						create: {
							...data,
							ticketId,
							userId: member.user.id,
						},
						select: { ticketId: true },
						update: data,
						where: {
							ticketId_userId: {
								ticketId,
								userId: member.user.id,
							},
						},
					}),
				);
			}

			for (const channel of channels) {
				const data = {
					channelId: channel.id,
					name: channel.name,
					ticketId,
				};
				queries.push(
					this.client.prisma.archivedChannel.upsert({
						create: data,
						select: { ticketId: true },
						update: data,
						where: {
							ticketId_channelId: {
								channelId: channel.id,
								ticketId,
							},
						},
					}),
				);
			}

			const data = {
				content: await crypto.queue(w => w.encrypt(
					JSON.stringify({
						attachments: [...message.attachments.values()],
						components: [...message.components.values()],
						content: message.content,
						// `{ ...embed }` produced `{ data: { … } }`: discord.js keeps an
						// embed's fields in a private `data` object and exposes them
						// through prototype getters, which a spread does not copy. Every
						// embed archived that way rendered as an empty box in the HTML
						// transcript — so a bot message with no text of its own vanished
						// completely. `toJSON()` gives the flat API shape.
						embeds: message.embeds.map(embed => (typeof embed?.toJSON === 'function' ? embed.toJSON() : embed)),
						reference: message.reference?.messageId ?? null,
					}),
				)),
				createdAt: message.createdAt,
				edited: !!message.editedAt,
				external,
			};

			queries.push(
				this.client.prisma.archivedMessage.upsert({
					create: {
						...data,
						authorId: message.author?.id || 'default',
						id: message.id,
						ticketId,
					},
					select: { ticketId: true },
					update: data,
					where: { id: message.id },
				}),
			);

			return await this.client.prisma.$transaction(queries);
		} catch (error) {
			this.client.log.error('Failed to archive message %s', message.id);
			this.client.log.error(error);
			return false;
		}
	}
};
