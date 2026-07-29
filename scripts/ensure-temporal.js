/* eslint-disable no-console */
/**
 * Make sure the compiled Temporal layer exists before the bot starts.
 *
 * Temporal is required — the bot cannot run a single scheduled or durable job
 * without it — but `dist/temporal` is build output, not source. Release
 * tarballs ship it prebuilt (it is ~2 MB of plain JavaScript, portable to every
 * platform); a git checkout has to compile it, which needs the TypeScript
 * compiler from devDependencies.
 *
 * That last part is the trap this script exists to explain: `npm install` with
 * `NODE_ENV=production` set silently skips devDependencies, so `tsc` is absent
 * and the build fails with an error about a missing binary rather than about
 * the actual cause.
 *
 * Also the right place for the libc check: `@temporalio/core-bridge` is a
 * native addon with no musl build, and on Alpine it fails at `dlopen` with a
 * relocation error that says nothing about Alpine.
 */
const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const {
	APP_DIR, appPath,
} = require('./lib/paths');

const colour = (code, string) => (process.stdout.isTTY ? `\x1b[${code}m${string}\x1b[0m` : string);
const log = (...strings) => console.log(colour(34, '[temporal]'), ...strings);
const error = (...strings) => console.error(colour(31, '[temporal]'), ...strings);

/** Node reports the runtime glibc version; on musl the field is absent. */
function checkLibc() {
	if (process.platform !== 'linux') return;
	const header = process.report?.getReport?.()?.header;
	if (header && !header.glibcVersionRuntime) {
		error('This platform is not supported.');
		console.error('Temporal\'s native addon (@temporalio/core-bridge) ships no musl/Alpine build,');
		console.error('so it cannot be loaded here. Use a glibc distribution (Debian, Ubuntu, ...).');
		process.exit(1);
	}
}

const artefacts = [
	appPath('dist/temporal/index.js'),
	appPath('dist/temporal/workflow-bundle.js'),
];

checkLibc();

if (artefacts.every(existsSync)) {
	log('build is present');
	process.exit(0);
}

// `tsc` compiles src/temporal -> dist/temporal. (The workflow *bundle* is built
// by @temporalio/worker, which brings its own swc, so TypeScript is the only
// piece that can be missing.)
if (!existsSync(appPath('node_modules/typescript/package.json'))) {
	error('The Temporal layer (dist/temporal) is missing and TypeScript is not installed.');
	console.error('');
	console.error('Release tarballs ship dist/temporal prebuilt, so this is a source checkout.');
	console.error('Build it with:');
	console.error('');
	console.error(`    cd ${APP_DIR}`);
	console.error('    npm install --include=dev');
	console.error('    npm run temporal.build');
	console.error('    npm prune --omit=dev        # optional, once the build succeeded');
	console.error('');
	console.error('Note: exporting NODE_ENV=production makes npm skip devDependencies,');
	console.error('which is why the TypeScript compiler is not here.');
	process.exit(1);
}

log('building (this only happens once)');
const result = spawnSync('npm', ['run', 'temporal.build'], {
	cwd: APP_DIR,
	shell: process.platform === 'win32',
	stdio: 'inherit',
});

if (result.error) {
	error(`Could not run the build: ${result.error.message}`);
	process.exit(1);
}
if (result.status !== 0) {
	error('The Temporal build failed — see the output above.');
	process.exit(result.status ?? 1);
}
if (!artefacts.every(existsSync)) {
	error('The build reported success but dist/temporal is still incomplete.');
	process.exit(1);
}
log('build complete');
