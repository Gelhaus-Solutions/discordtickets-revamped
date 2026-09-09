import adapter from '@sveltejs/adapter-node';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ out: 'build' }),
		alias: { $components: './src/components' },
		// A tab left open across an upgrade holds a client router that only knows
		// the previous build's chunk URLs, and a rebuild deletes those, so its
		// next client-side navigation used to break rather than land. Polling
		// `_app/version.json` (five minutes; it is a 27-byte response) makes
		// SvelteKit notice the new build and turn that navigation into a full
		// page load instead. Off by default upstream, and worth nothing until
		// version.json stopped being heuristically cacheable. See src/http.js.
		version: { pollInterval: 300000 }
	},
	preprocess: [sveltePreprocess({ postcss: true })],
	trailingSlash: 'never'
};

export default config;
