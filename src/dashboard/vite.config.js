import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { I18nPlugin } from '@eartharoid/vite-plugin-i18n';

/**
 * Source maps are only produced when they are going to be uploaded, which in
 * practice means the vendor's own CI build.
 *
 * `sentrySvelteKit()` defaults to `autoUploadSourceMaps: true`, and that forces
 * `build.sourcemap = 'hidden'` — which writes .map files into
 * build/client/_app/immutable/, where the Fastify `/*` catch-all serves them to
 * anyone who asks. Today the client build emits none, so this would be a new
 * leak rather than an existing one. Worse, the plugin's upload failure path is
 * a bare console.warn, so a missing or invalid token would leave the maps on
 * disk and in the published image.
 */
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

/** @type {import('vite').UserConfig} */
const config = {
	build: {
		// Explicit in both directions rather than letting the plugin decide.
		sourcemap: uploadSourceMaps ? 'hidden' : false
	},
	plugins: [
		...(uploadSourceMaps
			? [
					sentrySvelteKit({
						// Must stay off. The default rewrites +page.server.js load
						// functions to import wrapServerLoadWithSentry from
						// '@sentry/sveltekit', which would pull the Node SDK into
						// the adapter-node server bundle — the exact thing
						// hooks.server.js goes out of its way to avoid.
						autoInstrument: false,
						sourceMapsUploadOptions: {
							authToken: process.env.SENTRY_AUTH_TOKEN,
							// Nothing is left behind for the image to ship.
							filesToDeleteAfterUpload: ['./build/client/**/*.map'],
							org: process.env.SENTRY_ORG,
							project: process.env.SENTRY_PROJECT
						}
					})
				]
			: []),
		sveltekit(),
		I18nPlugin({
			id_regex:
				/((?<locale>[a-z0-9-_]+)\/)((_(?<namespace>[a-z0-9-_]+))|[a-z0-9-_]+)\.[a-z]+/i,
			include: 'src/lib/locales/*/*.json'
		})
	],
	server: {
		host: '127.0.0.1',
		proxy: {
			'/api': {
				target: 'http://127.0.0.1',
				changeOrigin: true
			},
			'/attachments': {
				target: 'http://127.0.0.1',
				changeOrigin: true
			},
			'/auth': {
				target: 'http://127.0.0.1',
				changeOrigin: true
			},
			'/avatars': {
				target: 'http://127.0.0.1',
				changeOrigin: true
			},
			'/invite': {
				target: 'http://127.0.0.1',
				changeOrigin: true
			}
		}
	}
};

export default config;
