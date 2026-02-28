// @ts-nocheck
import { error } from '@sveltejs/kit';
import Big from 'big-integer';

/** @param {Parameters<import('./$types').PageLoad>[0]} event */
export async function load({ fetch, params }) {
	if (params.guild.split('.')[0] === 'favicon') error(404, 'Not Found');
	const guildId = new Big(params.guild, 36);
	const response = await fetch(`/api/guilds/${guildId}`);
	const body = await response.json();
	if (!response.ok) error(response.status, JSON.stringify(body));
	return {
		guild: body
	};
}
