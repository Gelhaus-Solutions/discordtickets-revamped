/**
 * Bridge from the JavaScript bot to the compiled TypeScript Temporal layer.
 *
 * The source lives in `src/temporal/*.ts` and is compiled to `dist/temporal`
 * by `npm run temporal.build` (and during the Docker build). Keeping the ugly
 * relative path in one place means the rest of the bot can simply
 * `require('.../lib/temporal')`.
 */
module.exports = require('../../dist/temporal');
