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
		es2017: true,
		node: true
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
