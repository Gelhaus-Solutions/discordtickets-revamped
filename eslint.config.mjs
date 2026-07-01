import globals from 'globals';
import pluginJs from '@eslint/js';
import eartharoid from '@eartharoid/eslint-rules-js';

/** @type {import('eslint').Linter.Config[]} */
export default [
	// The Temporal layer is TypeScript (type-checked via `npm run temporal.typecheck`)
	// and `dist/` is its compiled output — neither should be linted by this JS config.
	{ ignores: ['dist/**', 'src/temporal/**'] },
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
