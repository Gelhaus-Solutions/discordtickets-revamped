import globals from 'globals';
import pluginJs from '@eslint/js';
import eartharoid from '@eartharoid/eslint-rules-js';

/** @type {import('eslint').Linter.Config[]} */
export default [
	// The Temporal layer is TypeScript (type-checked via `npm run temporal.typecheck`)
	// and `dist/` is its compiled output — neither should be linted by this JS config.
	// The dashboard is a separate SvelteKit app with its own eslint/prettier setup
	// (`cd src/dashboard && npm run lint`); its `build/` and `.svelte-kit/` are
	// generated bundles, and linting them here produced ~20k errors — and, because
	// `npm run lint` passes `--fix`, rewrote the committed build output.
	{ ignores: ['dist/**', 'src/temporal/**', 'src/dashboard/**'] },
	{ files: ['**/*.{js,mjs,cjs}'] },
	{ languageOptions: { globals: globals.node } },
	pluginJs.configs.recommended,
	eartharoid,
	{
		rules: {
			'no-console': [
				'warn',
			],
		},
	},
];
