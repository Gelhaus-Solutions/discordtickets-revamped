const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["assets/wordmark-light.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.B4JCQqt7.js",app:"_app/immutable/entry/app.BEZHIhC9.js",imports:["_app/immutable/entry/start.B4JCQqt7.js","_app/immutable/chunks/DHNylJhs.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/CzVzH3Uh.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/entry/app.BEZHIhC9.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DQa-TWLo.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/D1LahZIy.js","_app/immutable/chunks/CIDipo3b.js","_app/immutable/chunks/BmP4pMmO.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CxJQb7GH.js')),
			__memo(() => import('./chunks/1--PvMRi1o.js')),
			__memo(() => import('./chunks/2-D9cJMWL1.js')),
			__memo(() => import('./chunks/3-CGrPvzkd.js')),
			__memo(() => import('./chunks/4-BRGGCO_4.js')),
			__memo(() => import('./chunks/5-DjGbhXK0.js')),
			__memo(() => import('./chunks/6-BzR4P9SU.js')),
			__memo(() => import('./chunks/7-B5w1M8H0.js')),
			__memo(() => import('./chunks/8-C1KgrpXG.js')),
			__memo(() => import('./chunks/9-DSumCXRj.js')),
			__memo(() => import('./chunks/10-CW8CHKmW.js')),
			__memo(() => import('./chunks/11-CnBLA4vw.js')),
			__memo(() => import('./chunks/12-CKF1cLBh.js')),
			__memo(() => import('./chunks/13-B2fpklDH.js')),
			__memo(() => import('./chunks/14-D2nZPP-p.js')),
			__memo(() => import('./chunks/15-Ch7vl38Z.js')),
			__memo(() => import('./chunks/16-DDEOvlFo.js')),
			__memo(() => import('./chunks/17-CZnCo3on.js')),
			__memo(() => import('./chunks/18-sigPyvg6.js')),
			__memo(() => import('./chunks/19-C208q2ZI.js')),
			__memo(() => import('./chunks/20-BG1CBoXt.js')),
			__memo(() => import('./chunks/21-DTDwyimy.js')),
			__memo(() => import('./chunks/22-CJ_jrDsZ.js')),
			__memo(() => import('./chunks/23-DOwQkLvM.js')),
			__memo(() => import('./chunks/24-PHrHtS-9.js')),
			__memo(() => import('./chunks/25-DKZKI9-S.js')),
			__memo(() => import('./chunks/26-SWx-CB9Y.js')),
			__memo(() => import('./chunks/27-BMsE2UWN.js')),
			__memo(() => import('./chunks/28-63mSzlfH.js')),
			__memo(() => import('./chunks/29-BbgqwkIN.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/(default)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,3,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(default)/invite",
				pattern: /^\/invite\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,3,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/(default)/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,3,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,6,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/settings/[guild]",
				pattern: /^\/settings\/([^/]+?)\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,], errors: [1,6,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/automations",
				pattern: /^\/settings\/([^/]+?)\/automations\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/automations/[automation]",
				pattern: /^\/settings\/([^/]+?)\/automations\/([^/]+?)\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false},{"name":"automation","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/automations/[automation]/runs",
				pattern: /^\/settings\/([^/]+?)\/automations\/([^/]+?)\/runs\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false},{"name":"automation","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/categories",
				pattern: /^\/settings\/([^/]+?)\/categories\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/categories/[category]",
				pattern: /^\/settings\/([^/]+?)\/categories\/([^/]+?)\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false},{"name":"category","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/customization",
				pattern: /^\/settings\/([^/]+?)\/customization\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/feedback",
				pattern: /^\/settings\/([^/]+?)\/feedback\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/general",
				pattern: /^\/settings\/([^/]+?)\/general\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/panels",
				pattern: /^\/settings\/([^/]+?)\/panels\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/panels/[panel]",
				pattern: /^\/settings\/([^/]+?)\/panels\/([^/]+?)\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false},{"name":"panel","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/tags",
				pattern: /^\/settings\/([^/]+?)\/tags\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/transcripts",
				pattern: /^\/settings\/([^/]+?)\/transcripts\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/(default)/view/[ticket]",
				pattern: /^\/view\/([^/]+?)\/?$/,
				params: [{"name":"ticket","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,3,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(default)/[guild]",
				pattern: /^\/([^/]+?)\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,4,], errors: [1,3,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/(default)/[guild]/feedback",
				pattern: /^\/([^/]+?)\/feedback\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,4,], errors: [1,3,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/(default)/[guild]/staff",
				pattern: /^\/([^/]+?)\/staff\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,4,], errors: [1,3,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(default)/[guild]/tickets",
				pattern: /^\/([^/]+?)\/tickets\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,4,], errors: [1,3,,], leaf: 12 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
