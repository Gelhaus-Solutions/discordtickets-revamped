/**
 * Node presentation for the automation editor.
 *
 * This mirrors `src/lib/automations/registry.js` on the bot side. The two cannot
 * share a module — the bot is CommonJS and the dashboard is an independent ESM
 * app with its own package.json — so this copy is deliberately as thin as it can
 * be: **icons, colours and a fallback limits table, and nothing else.**
 *
 * Labels, descriptions, outputs and the whole parameter schema come from
 * `GET /api/admin/guilds/:guild/automations/nodes`, which renders the bot's
 * registry directly. That way adding a node type is a backend change plus one
 * icon here, rather than two parallel definitions that drift.
 *
 * If you add a node type there, add its icon here. `npm test` runs
 * `scripts/check-automations`, which fails if the two sets of type ids differ,
 * if GRAPH_VERSION differs, or if the limits below differ from the bot's
 * public-bot numbers.
 */

export const GRAPH_VERSION = 1;

/**
 * Fallback limits, matching the bot's **public-bot** values.
 *
 * Only used before the catalogue has loaded. At runtime the editor uses
 * `catalogue.limits`, which on a self-hosted bot has most of these as Infinity —
 * a private instance is not rationing its own CPU.
 */
export const LIMITS = {
	branches: 5,
	clauses: 10,
	edges: 80,
	nodes: 40,
	perGuild: 25,
	steps: 50
};

/**
 * Per-category styling.
 *
 * Every class is a complete literal string. Tailwind's JIT scanner cannot see
 * `bg-${category}-400`, so an interpolated class silently renders unstyled.
 */
export const CATEGORY_META = {
	action: {
		border: 'border-emerald-300 dark:border-emerald-500/60',
		chip: 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300',
		handle: '!bg-emerald-500',
		icon: 'text-emerald-600 dark:text-emerald-400',
		label: 'Actions'
	},
	condition: {
		border: 'border-sky-300 dark:border-sky-500/60',
		chip: 'bg-sky-400/20 text-sky-700 dark:text-sky-300',
		handle: '!bg-sky-500',
		icon: 'text-sky-600 dark:text-sky-400',
		label: 'Conditions'
	},
	flow: {
		border: 'border-violet-300 dark:border-violet-500/60',
		chip: 'bg-violet-400/20 text-violet-700 dark:text-violet-300',
		handle: '!bg-violet-500',
		icon: 'text-violet-600 dark:text-violet-400',
		label: 'Flow'
	},
	trigger: {
		border: 'border-amber-300 dark:border-amber-500/60',
		chip: 'bg-amber-400/20 text-amber-700 dark:text-amber-300',
		handle: '!bg-amber-500',
		icon: 'text-amber-600 dark:text-amber-400',
		label: 'Triggers'
	}
};

export const CATEGORY_ORDER = ['trigger', 'condition', 'flow', 'action'];

/** Font Awesome icon per node type. The one thing the server catalogue does not carry. */
export const NODE_ICONS = {
	'action.automation.run': 'fa-diagram-project',
	'action.log': 'fa-file-lines',
	'action.message.dm': 'fa-envelope',
	'action.message.react': 'fa-face-smile',
	'action.message.reply': 'fa-reply',
	'action.message.send': 'fa-paper-plane',
	'action.role.add': 'fa-user-plus',
	'action.role.remove': 'fa-user-minus',
	'action.ticket.addMember': 'fa-user-check',
	'action.ticket.claim': 'fa-hands-holding',
	'action.ticket.close': 'fa-circle-xmark',
	'action.ticket.move': 'fa-folder-tree',
	'action.ticket.removeMember': 'fa-user-xmark',
	'action.ticket.rename': 'fa-i-cursor',
	'action.ticket.setPriority': 'fa-flag',
	'action.ticket.setTopic': 'fa-pen',
	'condition.filter': 'fa-filter',
	'flow.if': 'fa-code-branch',
	'flow.noop': 'fa-arrow-right',
	'flow.stop': 'fa-ban',
	'flow.wait': 'fa-stopwatch',
	'trigger.button.pressed': 'fa-hand-pointer',
	'trigger.member.joined': 'fa-door-open',
	'trigger.member.left': 'fa-door-closed',
	'trigger.member.roleAdded': 'fa-user-tag',
	'trigger.member.roleRemoved': 'fa-user-slash',
	'trigger.menu.selected': 'fa-list-ul',
	'trigger.message.created': 'fa-comment',
	'trigger.schedule.cron': 'fa-clock',
	'trigger.ticket.claimed': 'fa-hand',
	'trigger.ticket.closeRequested': 'fa-circle-question',
	'trigger.ticket.closed': 'fa-circle-xmark',
	'trigger.ticket.created': 'fa-ticket',
	'trigger.ticket.feedback': 'fa-star',
	'trigger.ticket.memberAdded': 'fa-user-plus',
	'trigger.ticket.moved': 'fa-folder-tree',
	'trigger.ticket.priorityChanged': 'fa-flag',
	'trigger.ticket.released': 'fa-hand-back-fist',
	'trigger.ticket.reopened': 'fa-rotate-left',
	'trigger.ticket.stale': 'fa-hourglass-half'
};

export const iconFor = (type) => NODE_ICONS[type] ?? 'fa-circle-nodes';

export const categoryOf = (type) => String(type).split('.')[0];

/** A one-line summary for a node card, so the canvas is readable at a glance. */
export function summarise(node, catalogue) {
	const definition = catalogue?.types?.find((t) => t.type === node.type);
	const params = node.params ?? {};

	if (node.type === 'flow.wait') return humanDuration(params.ms);
	if (node.type === 'flow.if' || node.type === 'condition.filter') {
		const n = params.clauses?.length ?? 0;
		return `${n} condition${n === 1 ? '' : 's'}`;
	}
	if (node.type === 'trigger.schedule.cron')
		return `${params.cron ?? ''} (${params.timezone ?? 'UTC'})`;
	if (params.content) return String(params.content).slice(0, 60);
	if (params.name) return String(params.name).slice(0, 60);

	return definition?.description ?? '';
}

/** Milliseconds as something a person would say. */
export function humanDuration(ms) {
	const value = Number(ms);
	if (!Number.isFinite(value) || value <= 0) return '—';
	const units = [
		['day', 86_400_000],
		['hour', 3_600_000],
		['minute', 60_000],
		['second', 1000]
	];
	for (const [name, size] of units) {
		if (value >= size) {
			const n = Math.round((value / size) * 10) / 10;
			return `${n} ${name}${n === 1 ? '' : 's'}`;
		}
	}
	return `${value} ms`;
}

/** Parse `10m` / `2h` / `1d 6h` into milliseconds. */
export function parseDuration(input) {
	if (typeof input === 'number') return input;
	const text = String(input ?? '')
		.trim()
		.toLowerCase();
	if (!text) return null;
	if (/^\d+$/.test(text)) return Number(text) * 1000;

	const sizes = {
		d: 86_400_000,
		h: 3_600_000,
		m: 60_000,
		s: 1000,
		w: 604_800_000
	};
	let total = 0;
	let matched = false;
	for (const [, amount, unit] of text.matchAll(/(\d+(?:\.\d+)?)\s*([wdhms])/g)) {
		total += Number(amount) * sizes[unit];
		matched = true;
	}
	return matched ? Math.round(total) : null;
}
