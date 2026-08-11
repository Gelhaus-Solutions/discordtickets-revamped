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
		/** `trigger.button.pressed` nodes in the graph being edited. */
		buttonTriggers: [],
		categories: initial.categories ?? [],
		channels: initial.channels ?? [],
		/** Guild footer and accent colour, for the message previews. */
		footer: initial.footer ?? '',
		primaryColour: initial.primaryColour ?? '#009999',
		problems: [],
		questions: initial.questions ?? [],
		roles: initial.roles ?? [],
		selected: null
	});
	setContext(KEY, editor);
	return editor;
}

export const editorState = () => getContext(KEY);
