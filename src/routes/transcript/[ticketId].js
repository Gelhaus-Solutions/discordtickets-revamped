const { getPrivilegeLevel } = require('../../lib/users');

module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const { ticketId } = req.params;

		// Every failure below answers with the same 404. This route is reachable
		// by any authenticated user, and the redirect target embeds the ticket's
		// guild id — distinguishing "no such ticket" from "not your ticket" would
		// turn it into an oracle for enumerating ticket ids and mapping them to
		// guilds. The transcript content itself is behind isAdmin on the target.
		const notFound = () => res.code(404).send({
			error: 'Not Found',
			message: 'Ticket not found.',
			statusCode: 404,
		});

		// Reject obviously malformed ids before touching the DB; ticket ids are
		// short-unique-id strings (alphanumeric).
		if (typeof ticketId !== 'string' || !/^[A-Za-z0-9]{1,32}$/.test(ticketId)) {
			return notFound();
		}

		// Fetch the ticket to get its guild ID
		try {
			const ticket = await client.prisma.ticket.findUnique({
				select: {
					guildId: true,
					id: true,
				},
				where: { id: ticketId },
			});

			if (!ticket) return notFound();

			// Confirm the caller actually administrates the ticket's guild.
			if (!req.user.service) {
				const guild = client.guilds.cache.get(ticket.guildId);
				if (!guild) return notFound();
				const member = await guild.members.fetch(req.user.id).catch(() => null);
				if (!member || await getPrivilegeLevel(member) < 2) return notFound();
			}

			// Redirect to the API endpoint
			const url = `/api/admin/guilds/${ticket.guildId}/tickets/${ticketId}/transcript`;
			return res.redirect(302, url);
		} catch (err) {
			client.log.error('Failed to fetch ticket for transcript:', err);
			return res.code(500).send({
				error: 'Internal Server Error',
				message: 'Failed to fetch transcript.',
				statusCode: 500,
			});
		}
	},
	onRequest: [fastify.authenticate],
});
