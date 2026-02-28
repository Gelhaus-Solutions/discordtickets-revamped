import * as client_hooks from '../../../src/hooks.client.js';


export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24')
];

export const server_loads = [0];

export const dictionary = {
		"/(default)": [8,[2],[3]],
		"/(default)/invite": [13,[2],[3]],
		"/(default)/login": [14,[2],[3]],
		"/settings": [16,[5],[6]],
		"/settings/[guild]": [17,[5],[6]],
		"/settings/[guild]/categories": [18,[5,7],[6]],
		"/settings/[guild]/categories/[category]": [19,[5,7],[6]],
		"/settings/[guild]/feedback": [20,[5,7],[6]],
		"/settings/[guild]/general": [21,[5,7],[6]],
		"/settings/[guild]/panels": [22,[5,7],[6]],
		"/settings/[guild]/tags": [23,[5,7],[6]],
		"/settings/[guild]/transcripts": [24,[5,7],[6]],
		"/(default)/view/[ticket]": [15,[2],[3]],
		"/(default)/[guild]": [9,[2,4],[3]],
		"/(default)/[guild]/feedback": [10,[2,4],[3]],
		"/(default)/[guild]/staff": [11,[2,4],[3]],
		"/(default)/[guild]/tickets": [12,[2,4],[3]]
	};

export const hooks = {
	handleError: client_hooks.handleError || (({ error }) => { console.error(error) }),
	init: client_hooks.init,
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';