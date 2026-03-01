module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const { ticketId } = req.params;

		// Fetch the ticket to get its guild ID
		try {
			const ticket = await client.prisma.ticket.findUnique({
				select: {
					guildId: true,
					id: true,
				},
				where: { id: ticketId },
			});

			if (!ticket) {
				return res.code(404).send({
					error: 'Not Found',
					message: 'Ticket not found.',
					statusCode: 404,
				});
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
});
