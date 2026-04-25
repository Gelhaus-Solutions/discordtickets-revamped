const manifest = (() => {
	function __memo(fn) {
		let value;
		return () => value ??= (value = fn());
	}

	return {
		appDir: '_app',
		appPath: '_app',
		assets: new Set(['assets/wordmark-light.png']),
		mimeTypes: { '.png':'image/png' },
		_: {
			client: {
				start:'_app/immutable/entry/start.BsaJujw5.js',
				app:'_app/immutable/entry/app.DKJBdlYW.js',
				imports:['_app/immutable/entry/start.BsaJujw5.js', '_app/immutable/chunks/BS1CIRWV.js', '_app/immutable/chunks/BAc9Nw6w.js', '_app/immutable/chunks/CWXCXDbJ.js', '_app/immutable/chunks/DIeogL5L.js', '_app/immutable/chunks/BTVB6o0Y.js', '_app/immutable/chunks/CYgJF_JY.js', '_app/immutable/chunks/sEf5ZZCZ.js', '_app/immutable/chunks/J_wX4PLQ.js', '_app/immutable/chunks/B17Q6ahh.js', '_app/immutable/entry/app.DKJBdlYW.js', '_app/immutable/chunks/Dp1pzeXC.js', '_app/immutable/chunks/CTNvJ3TN.js', '_app/immutable/chunks/CWXCXDbJ.js', '_app/immutable/chunks/DIeogL5L.js', '_app/immutable/chunks/BTVB6o0Y.js', '_app/immutable/chunks/Bzak7iHL.js', '_app/immutable/chunks/BAc9Nw6w.js', '_app/immutable/chunks/BnKh12PZ.js', '_app/immutable/chunks/DU73alKZ.js', '_app/immutable/chunks/DPC9nAAJ.js', '_app/immutable/chunks/BOws-f3s.js', '_app/immutable/chunks/D8EB0mrL.js', '_app/immutable/chunks/DeGpVRd_.js', '_app/immutable/chunks/J_wX4PLQ.js'],
				stylesheets:[],
				fonts:[],
				uses_env_dynamic_public:false,
			},
			nodes: [
				__memo(() => import('./chunks/0-b9F3GkE7.js')),
				__memo(() => import('./chunks/1-D3i7WSGC.js')),
				__memo(() => import('./chunks/2-CjH7NbsJ.js')),
				__memo(() => import('./chunks/3-DyRrERma.js')),
				__memo(() => import('./chunks/4-BJlCpamg.js')),
				__memo(() => import('./chunks/5-D3iC3eeS.js')),
				__memo(() => import('./chunks/6-B3T3Sxj4.js')),
				__memo(() => import('./chunks/7-Txy_3zQ-.js')),
				__memo(() => import('./chunks/8-DO_KUPbE.js')),
				__memo(() => import('./chunks/9-BrpO2JGX.js')),
				__memo(() => import('./chunks/10-CW8CHKmW.js')),
				__memo(() => import('./chunks/11-CnBLA4vw.js')),
				__memo(() => import('./chunks/12-CKF1cLBh.js')),
				__memo(() => import('./chunks/13-lDv8tL55.js')),
				__memo(() => import('./chunks/14-BdhLW934.js')),
				__memo(() => import('./chunks/15-Ch7vl38Z.js')),
				__memo(() => import('./chunks/16-JjDYt4R3.js')),
				__memo(() => import('./chunks/17-CEP3tRSv.js')),
				__memo(() => import('./chunks/18-CP540K6y.js')),
				__memo(() => import('./chunks/19-BYhe3O2E.js')),
				__memo(() => import('./chunks/20-qf15DPUB.js')),
				__memo(() => import('./chunks/21-BbeDA-aD.js')),
				__memo(() => import('./chunks/22-CL8T0Ckn.js')),
				__memo(() => import('./chunks/23-By4P7Aqs.js')),
				__memo(() => import('./chunks/24-DctNDaNH.js')),
				__memo(() => import('./chunks/25-Bsgp6eff.js')),
			],
			remotes: {},
			routes: [
				{
					id: '/(default)',
					pattern: /^\/?$/,
					params: [],
					page: {
						layouts: [0, 2],
						errors: [1, 3],
						leaf: 8,
					},
					endpoint: null,
				},
				{
					id: '/(default)/invite',
					pattern: /^\/invite\/?$/,
					params: [],
					page: {
						layouts: [0, 2],
						errors: [1, 3],
						leaf: 13,
					},
					endpoint: null,
				},
				{
					id: '/(default)/login',
					pattern: /^\/login\/?$/,
					params: [],
					page: {
						layouts: [0, 2],
						errors: [1, 3],
						leaf: 14,
					},
					endpoint: null,
				},
				{
					id: '/settings',
					pattern: /^\/settings\/?$/,
					params: [],
					page: {
						layouts: [0, 5],
						errors: [1, 6],
						leaf: 16,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]',
					pattern: /^\/settings\/([^/]+?)\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5],
						errors: [1, 6],
						leaf: 17,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/categories',
					pattern: /^\/settings\/([^/]+?)\/categories\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 18,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/categories/[category]',
					pattern: /^\/settings\/([^/]+?)\/categories\/([^/]+?)\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}, {
						'name':'category',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 19,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/customization',
					pattern: /^\/settings\/([^/]+?)\/customization\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 20,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/feedback',
					pattern: /^\/settings\/([^/]+?)\/feedback\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 21,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/general',
					pattern: /^\/settings\/([^/]+?)\/general\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 22,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/panels',
					pattern: /^\/settings\/([^/]+?)\/panels\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 23,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/tags',
					pattern: /^\/settings\/([^/]+?)\/tags\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 24,
					},
					endpoint: null,
				},
				{
					id: '/settings/[guild]/transcripts',
					pattern: /^\/settings\/([^/]+?)\/transcripts\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 5, 7],
						errors: [1, 6,,],
						leaf: 25,
					},
					endpoint: null,
				},
				{
					id: '/(default)/view/[ticket]',
					pattern: /^\/view\/([^/]+?)\/?$/,
					params: [{
						'name':'ticket',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 2],
						errors: [1, 3],
						leaf: 15,
					},
					endpoint: null,
				},
				{
					id: '/(default)/[guild]',
					pattern: /^\/([^/]+?)\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 2, 4],
						errors: [1, 3,,],
						leaf: 9,
					},
					endpoint: null,
				},
				{
					id: '/(default)/[guild]/feedback',
					pattern: /^\/([^/]+?)\/feedback\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 2, 4],
						errors: [1, 3,,],
						leaf: 10,
					},
					endpoint: null,
				},
				{
					id: '/(default)/[guild]/staff',
					pattern: /^\/([^/]+?)\/staff\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 2, 4],
						errors: [1, 3,,],
						leaf: 11,
					},
					endpoint: null,
				},
				{
					id: '/(default)/[guild]/tickets',
					pattern: /^\/([^/]+?)\/tickets\/?$/,
					params: [{
						'name':'guild',
						'optional':false,
						'rest':false,
						'chained':false,
					}],
					page: {
						layouts: [0, 2, 4],
						errors: [1, 3,,],
						leaf: 12,
					},
					endpoint: null,
				},
			],
			prerendered_routes: new Set([]),
			matchers: async () => ({  }),
			server_assets: {},
		},
	};
})();

const prerendered = new Set([]);

const base = '';

export {
	base, manifest, prerendered,
};
// # sourceMappingURL=manifest.js.map
