/**
 * Bridge from the JavaScript bot to the compiled TypeScript Temporal layer.
 *
 * The source lives in `src/temporal/*.ts` and is compiled to `dist/temporal`
 * by `npm run temporal.build` (and during the Docker build). Keeping the ugly
 * relative path in one place means the rest of the bot can simply
 * `require('.../lib/temporal')`.
 */
try {
	module.exports = require('../../dist/temporal');
} catch (error) {
	if (error.code !== 'MODULE_NOT_FOUND') throw error;
	// `dist/` is gitignored and only produced by `npm run temporal.build`.
	// scripts/start.sh builds it on demand, but a bare `node .` skips that, and
	// an unguarded require here failed at *module load* — inside four route
	// files and src/client.js — so the bot never even logged in, with a bare
	// MODULE_NOT_FOUND as the only clue.
	throw new Error(
		'The Temporal layer has not been built. Run `npm run temporal.build` ' +
		'(or start via scripts/start.sh, which builds it automatically).',
	);
}
