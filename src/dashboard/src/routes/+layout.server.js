import {
	error, redirect,
} from '@sveltejs/kit';
import Negotiator from 'negotiator';
import { getSupportedLocales } from '$lib/i18n';
import ms from 'ms';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({
	cookies, fetch, request, url,
}) {
	if (url.pathname === '/invite') {
		redirect(307, `/auth/login?invite&guild=${url.searchParams.get('guild') || ''}`);
	}
	const response = await fetch('/api/users/@me');
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	if (url.pathname !== '/login') {
		if (response.status === 401) {
			let qs = `r=${encodeURIComponent(url.pathname + url.search)}`;
			if (url.pathname.startsWith('/settings')) {
				qs += '&role=admin';
			}
			redirect(307, `/login?${qs}`);
		} else if (!response.ok) {
			error(response.status, isJSON ? JSON.stringify(body) : body);
		}
	}
	let locale = cookies.get('locale');
	if (!locale) {
		const supportedLocales = getSupportedLocales();
		if (supportedLocales.includes(body.locale)) {
			locale = body.locale;
		} else {
			const negotiator = new Negotiator(request);
			locale = negotiator.language(supportedLocales);
		}
		cookies.set('locale', locale, {
			maxAge: ms('1y') / 1000,
			path: '/',
			sameSite: 'lax',
			secure: false,
			httpOnly: false,
		});
	}
	// A reverse proxy sitting between us and our own API answers with an HTML
	// error page rather than JSON when the loopback is misconfigured. Parsing
	// that blindly threw `Unexpected token '<'` out of the root layout, which
	// 500s *every* page including /login — leaving no way to sign in. Degrade to
	// an empty object instead (pages read `client.username`, `client.public` and
	// friends unguarded, so `null` would only move the crash) and let the page
	// render.
	const clientResponse = await fetch('/api/client', { credentials: 'include' });
	let clientInfo = {};
	if (clientResponse.headers.get('Content-Type')?.includes('json')) {
		clientInfo = await clientResponse.json();
	} else {
		console.error(`GET /api/client returned ${clientResponse.status} ${clientResponse.headers.get('Content-Type')} instead of JSON — check HTTP_INTERNAL/HTTP_EXTERNAL`);
	}

	return {
		client: clientInfo,
		locale,
		theme: cookies.get('theme'),
		user: body,
	};
}
