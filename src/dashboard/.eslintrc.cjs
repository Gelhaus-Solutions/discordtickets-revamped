/**
 * The dashboard's own ESLint setup.
 *
 * The root `eslint.config.mjs` deliberately ignores `src/dashboard/**` and points
 * here instead — but this file was missing, so `npm run lint` died with "all of
 * the files matching the glob pattern '.' are ignored" rather than linting
 * anything. `eslint`, `eslint-plugin-svelte` and `eslint-config-prettier` were
 * already devDependencies waiting for it.
 *
 * `prettier` goes last so formatting rules defer to `.prettierrc`, which is what
 * actually decides layout here.
 */
module.exports = {
	root: true,
	extends: ['eslint:recommended', 'plugin:svelte/recommended', 'prettier'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		// 2022, not 2017: the portal turns guild snowflakes into base36 slugs with
		// `BigInt`, which es2017 does not know about and reported as an undefined
		// global.
		es2022: true,
		node: true
	},
	rules: {
		// `_` is the conventional throwaway, and Svelte's `{#each Array(5) as _, i}`
		// needs a binding it will never read. Reporting those trained people to
		// scroll past the rule rather than act on it.
		'no-unused-vars': [
			'error',
			{
				args: 'after-used',
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
				varsIgnorePattern: '^_'
			}
		]
	},
	// Runes are compiler intrinsics, not imports. `.svelte` files get them from
	// svelte-eslint-parser; a `.svelte.js` module does not, so they are declared.
	globals: {
		$bindable: 'readonly',
		$derived: 'readonly',
		$effect: 'readonly',
		$inspect: 'readonly',
		$props: 'readonly',
		$state: 'readonly'
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser'
		}
	]
};
