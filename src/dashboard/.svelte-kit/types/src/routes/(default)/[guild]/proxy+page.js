// @ts-nocheck
import { importJSON } from '$lib/i18n';

/** @param {Parameters<import('./$types').PageLoad>[0]} event */
export async function load({ parent }) {
	const { locale } = await parent();
	return {
		translations: importJSON(await import(`../../../lib/locales/${locale}/_common.json`))
	};
}
