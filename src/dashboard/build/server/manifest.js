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
		client: {start:"_app/immutable/entry/start.BX3Rcazg.js",app:"_app/immutable/entry/app.BSfSsrT9.js",imports:["_app/immutable/entry/start.BX3Rcazg.js","_app/immutable/chunks/nDzxlPLT.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/Cl0TUqvD.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/entry/app.BSfSsrT9.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/sg6CFjGt.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/Ea2ubrQi.js","_app/immutable/chunks/B9JY1_cP.js","_app/immutable/chunks/D33agL7i.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CeIImlXR.js')),
			__memo(() => import('./chunks/1-DeUDuvN5.js')),
			__memo(() => import('./chunks/2-DQH_IsCv.js')),
			__memo(() => import('./chunks/3-DeTfePBk.js')),
			__memo(() => import('./chunks/4-B4qecEGv.js')),
			__memo(() => import('./chunks/5-BUwavzmy.js')),
			__memo(() => import('./chunks/6-4eH-th3U.js')),
			__memo(() => import('./chunks/7-DbeT47iv.js')),
			__memo(() => import('./chunks/8-CbSIfkqr.js')),
			__memo(() => import('./chunks/9-EkENwuqv.js')),
			__memo(() => import('./chunks/10-CW8CHKmW.js')),
			__memo(() => import('./chunks/11-CnBLA4vw.js')),
			__memo(() => import('./chunks/12-CKF1cLBh.js')),
			__memo(() => import('./chunks/13-B2fpklDH.js')),
			__memo(() => import('./chunks/14-BCbnVe5x.js')),
			__memo(() => import('./chunks/15-Ch7vl38Z.js')),
			__memo(() => import('./chunks/16-C-9tBDOQ.js')),
			__memo(() => import('./chunks/17-BnsQkAWf.js')),
			__memo(() => import('./chunks/18-DKA3W23t.js')),
			__memo(() => import('./chunks/19-BzeJPvNh.js')),
			__memo(() => import('./chunks/20-D9_17rbd.js')),
			__memo(() => import('./chunks/21-C0yC3swY.js')),
			__memo(() => import('./chunks/22-BK2zBUqq.js')),
			__memo(() => import('./chunks/23-ivuHlIIs.js')),
			__memo(() => import('./chunks/24-CUuiKUKl.js')),
			__memo(() => import('./chunks/25-9sX0HjTa.js')),
			__memo(() => import('./chunks/26-DsPsAd18.js'))
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
				id: "/settings/[guild]/categories",
				pattern: /^\/settings\/([^/]+?)\/categories\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/categories/[category]",
				pattern: /^\/settings\/([^/]+?)\/categories\/([^/]+?)\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false},{"name":"category","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/customization",
				pattern: /^\/settings\/([^/]+?)\/customization\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/feedback",
				pattern: /^\/settings\/([^/]+?)\/feedback\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/general",
				pattern: /^\/settings\/([^/]+?)\/general\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/panels",
				pattern: /^\/settings\/([^/]+?)\/panels\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/panels/[panel]",
				pattern: /^\/settings\/([^/]+?)\/panels\/([^/]+?)\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false},{"name":"panel","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/tags",
				pattern: /^\/settings\/([^/]+?)\/tags\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/settings/[guild]/transcripts",
				pattern: /^\/settings\/([^/]+?)\/transcripts\/?$/,
				params: [{"name":"guild","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,7,], errors: [1,6,,], leaf: 26 },
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
