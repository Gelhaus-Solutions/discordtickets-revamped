/**
 * Chart.js, with only the pieces this dashboard actually draws registered.
 *
 * `chart.js/auto` would be one import instead of thirteen, but it registers
 * every controller, scale, element and plugin the library ships — roughly twice
 * the bytes, for chart types nothing here renders.
 *
 * This module is only ever reached through the dynamic import in Chart.svelte,
 * which is what keeps it in a client-only chunk. Settings pages are server
 * rendered, `src/http.js` loads the resulting server bundle directly, and there
 * is nothing a canvas library can do there — so a static import of this file
 * would cost every request a couple of hundred kilobytes to render nothing.
 */
import {
	ArcElement,
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	DoughnutController,
	Filler,
	Legend,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip
} from 'chart.js';

Chart.register(
	ArcElement,
	BarController,
	BarElement,
	CategoryScale,
	DoughnutController,
	Filler,
	Legend,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip
);

export { Chart };
