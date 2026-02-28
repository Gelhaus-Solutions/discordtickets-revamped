// @ts-nocheck
import { redirect } from '@sveltejs/kit';

/** @param {Parameters<import('./$types').PageLoad>[0]} event */
export async function load({ url }) {
	redirect(307, `/auth/login?invite&guild=${url.searchParams.get('guild') || ''}`);
}

