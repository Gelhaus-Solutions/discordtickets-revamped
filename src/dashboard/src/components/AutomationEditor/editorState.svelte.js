import { getContext, setContext } from 'svelte';

/**
 * Shared editor editor.
 *
 * Node components read `problems` and `selected` from here rather than from
 * `node.data`. That matters: Svelte Flow holds nodes in `$state.raw`, so putting
 * validation results into node data would mean rebuilding the whole nodes array
 * on every keystroke and re-rendering the entire canvas.
 */
const KEY = Symbol('automation-editor');

export function createEditorState(initial = {}) {
	const editor = $state({
		catalogue: initial.catalogue ?? null,
		/** Automations a button may start: those triggered by a button press. */
		buttonAutomations: initial.buttonAutomations ?? [],
		categories: initial.categories ?? [],
		channels: initial.channels ?? [],
		problems: [],
		questions: initial.questions ?? [],
		roles: initial.roles ?? [],
		selected: null
	});
	setContext(KEY, editor);
	return editor;
}

export const editorState = () => getContext(KEY);
