<script>
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {'bar'|'doughnut'|'line'} type
	 * @property {object} data Chart.js data object
	 * @property {object} [options] Chart.js options object
	 * @property {string} [height] height class for the sizing wrapper
	 * @property {number} [heightPx] explicit height, for charts that grow with
	 *   their row count — Tailwind cannot generate a class from a runtime value
	 * @property {string} label accessible name for the canvas
	 */

	/** @type {Props} */
	let { data, height = 'h-72', heightPx = null, label, options = {}, type } = $props();

	let canvas;
	/** Not `$state`: nothing renders from it, and Chart.js mutates it heavily. */
	let chart = null;

	// Creation lives in `onMount` rather than an `$effect` because it must happen
	// exactly once per canvas element. Chart.js refuses a canvas that already
	// carries a chart, and every instance registers a global entry and a
	// ResizeObserver that only `destroy()` releases — so without the teardown
	// below, leaving this page and coming back leaks both and eventually throws.
	onMount(() => {
		let disposed = false;

		import('./chart-core.js').then(({ Chart }) => {
			if (disposed || !canvas) return;
			// `data` is read here rather than captured at mount, so if the range
			// changed while the import was in flight this picks up the newer value
			// and the effect below correctly does nothing.
			chart = new Chart(canvas, {
				data,
				options: {
					...options,
					// Honoured at construction rather than in theme.js, which is
					// statically imported and therefore also evaluated on the server.
					...(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
						? { animation: false }
						: {})
				},
				type
			});
		});

		return () => {
			disposed = true;
			chart?.destroy();
			chart = null;
		};
	});

	// Effects never run during SSR, so this needs no `browser` guard. Mutating
	// the live instance instead of recreating it keeps the canvas and its resize
	// observer intact when a new date range arrives.
	$effect(() => {
		const nextData = data;
		const nextOptions = options;
		if (!chart) return;
		chart.data = nextData;
		chart.options = nextOptions;
		chart.update();
	});
</script>

<!--
	Chart.js sizes itself to its parent when `maintainAspectRatio` is false, so
	the parent needs a real height — without one the canvas grows on every resize
	tick until the page scrolls forever.
-->
<!--
	The name goes on the wrapper rather than the canvas itself: a <canvas> is an
	interactive element and cannot carry `role="img"`. The pixels are hidden
	outright — `aria-label` is a name, not a fallback, and every chart on the
	statistics page is accompanied by the same numbers as a stat card or a table,
	which is the real alternative for anyone not looking at it.
-->
<div
	class="relative w-full {heightPx ? '' : height}"
	style={heightPx ? `height: ${heightPx}px` : undefined}
	role="img"
	aria-label={label}
>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>
