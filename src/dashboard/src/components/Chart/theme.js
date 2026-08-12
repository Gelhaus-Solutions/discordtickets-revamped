/**
 * Colours and base options for the charts on the statistics page.
 *
 * On the theme: `darkMode: 'class'` in tailwind.config.js, but the class sits
 * on a <div> in src/routes/+layout.svelte, not on <html> — so the usual
 * `documentElement.classList.contains('dark')` sniff is always false here. The
 * theme comes from the `theme` context that layout sets from the cookie.
 *
 * Toggling the theme in TopBar.svelte reassigns `window.location`, i.e. a full
 * page load, so a chart is always constructed under the theme it will be looked
 * at in. Nothing needs to re-theme in place.
 */

/** Categorical series colours. First one is the Discord blurple in the palette. */
export const SERIES = ['#5865f2', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#64748b'];

/** Priority is semantic, not categorical — these do not rotate. */
export const PRIORITY = {
	HIGH: '#f43f5e',
	LOW: '#0ea5e9',
	MEDIUM: '#f59e0b',
	NONE: '#64748b'
};

/** 1★ → 5★, graded so colour reinforces the axis rather than replacing it. */
export const RATING = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

/**
 * @param {boolean} dark
 * @returns {{base: object, cartesian: object}}
 *   `base` for the doughnut, `cartesian` for line and bar charts. They are
 *   separate because handing `scales` to a doughnut makes Chart.js build two
 *   scales it will never draw.
 */
export function chartTheme(dark) {
	const text = dark ? '#cbd5e1' : '#475569';
	const grid = dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.15)';

	const base = {
		animation: { duration: 300 },
		maintainAspectRatio: false,
		plugins: {
			legend: { labels: { color: text } },
			tooltip: {
				backgroundColor: dark ? '#0f172a' : '#1e293b',
				bodyColor: '#f8fafc',
				titleColor: '#f8fafc'
			}
		},
		responsive: true
	};

	return {
		base,
		cartesian: {
			...base,
			scales: {
				x: {
					grid: { color: grid },
					ticks: { color: text }
				},
				y: {
					beginAtZero: true,
					grid: { color: grid },
					ticks: {
						color: text,
						precision: 0
					}
				}
			}
		}
	};
}
