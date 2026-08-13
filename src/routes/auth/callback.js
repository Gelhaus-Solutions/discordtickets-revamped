const { isSafeRedirect } = require('../../lib/misc');

module.exports.get = () => ({
	handler: async function (req, res) {
		const cookie = req.cookies['oauth2-state'];
		if (!cookie) {
			return res.code(400).send({
				error: 'Bad Request',
				message: 'State is missing.',
				statusCode: 400,

			});
		}

		const state = new URLSearchParams(cookie);
		if (state.get('secret') !== req.query.state) {
			return res.code(400).send({
				error: 'Bad Request',
				message: 'Invalid state.',
				statusCode: 400,

			});
		}

		// TODO: check if req.query.permissions are correct

		const data = await (await fetch('https://discord.com/api/oauth2/token', {
			body: new URLSearchParams({
				client_id: req.routeOptions.config.client.user.id,
				client_secret: process.env.DISCORD_SECRET,
				code: req.query.code,
				grant_type: 'authorization_code',
				redirect_uri: `${process.env.HTTP_EXTERNAL}/auth/callback`,
			}).toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			method: 'POST',
		})).json();

		// A failed exchange (expired/replayed `code`) still returns 200 with an
		// `error` body. Without this the flow carried on and issued a cookie whose
		// `expiresAt` was `NaN` — serialised to null, rejected by every subsequent
		// request, leaving the user in a login loop with no explanation.
		if (!data.access_token) {
			req.routeOptions.config.client.log.warn('OAuth token exchange failed: %s', data.error_description ?? data.error ?? 'no access_token');
			return res.code(400).send({
				error: 'Bad Request',
				message: 'Discord rejected that login attempt. Please try again.',
				statusCode: 400,
			});
		}

		const rawRedirect = (data.guild?.id && `/settings/${data.guild?.id}`) || state.get('redirect') || '/';
		const redirect = isSafeRedirect(rawRedirect) ? rawRedirect : '/';

		const bearerOptions = { headers: { 'Authorization': `Bearer ${data.access_token}` } };
		const user = await (await fetch('https://discordapp.com/api/users/@me', bearerOptions)).json();
		if (!user?.id) {
			req.routeOptions.config.client.log.warn('OAuth user lookup failed: %s', user?.message ?? 'no id');
			return res.code(502).send({
				error: 'Bad Gateway',
				message: 'Could not read your Discord account. Please try again.',
				statusCode: 502,
			});
		}

		let scopes;
		if (data.scope) {
			scopes = data.scope.split(' ');
		} else {
			const auth = await (await fetch('https://discordapp.com/api/oauth2/@me', bearerOptions)).json();
			scopes = auth.scopes;
		}

		const token = this.jwt.sign({
			accessToken: data.access_token,
			avatar: user.avatar,
			createdAt: Date.now(),
			expiresAt: Date.now() + (data.expires_in * 1000),
			id: user.id,
			locale: user.locale,
			scopes,
			username: user.username,
		});

		res.setCookie('token', token, {
			httpOnly: true,
			maxAge: data.expires_in,
			path: '/',
			// Lax (not Strict): the cookie is set during the Discord OAuth redirect
			// chain (cross-site initiated), and a Strict cookie is withheld by the
			// browser on the subsequent 302 to the dashboard — which 401s and boots
			// the user back to login. Lax still sends on top-level GET navigations.
			sameSite: 'Lax',
			secure: process.env.HTTP_EXTERNAL?.startsWith('https://') ?? true,
		});
		return res.redirect(redirect);
	},
});
