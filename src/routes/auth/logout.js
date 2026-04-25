module.exports.get = fastify => ({
	handler: async function (req, res) {
		const { accessToken } = req.user;

		await fetch('https://discord.com/api/oauth2/token/revoke', {
			body: new URLSearchParams({
				client_id: req.routeOptions.config.client.user.id,
				client_secret: process.env.DISCORD_SECRET,
				token: accessToken,
			}).toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			method: 'POST',
		});

		res.clearCookie('token', {
			httpOnly: true,
			path: '/',
			sameSite: 'Strict',
			secure: process.env.HTTP_EXTERNAL?.startsWith('https://') ?? true,
		});
		return res.redirect('/');
	},
	onRequest: [fastify.authenticate],
});
