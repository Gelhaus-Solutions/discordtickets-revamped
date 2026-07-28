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
		client: {start:"_app/immutable/entry/start.CYP0xSSe.js",app:"_app/immutable/entry/app.CTxhlBOf.js",imports:["_app/immutable/entry/start.CYP0xSSe.js","_app/immutable/chunks/DNREuzDQ.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B4_oswaU.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/entry/app.CTxhlBOf.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/CgJC5Yow.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/9vMhiHWs.js","_app/immutable/chunks/CuqbR5yU.js","_app/immutable/chunks/BV_ssYUv.js","_app/immutable/chunks/C-oaICqf.js","_app/immutable/chunks/C0vmHbms.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-BhpGgLOQ.js')),
			__memo(() => import('./chunks/1-CrY9JxlV.js')),
			__memo(() => import('./chunks/2-BpK3E09a.js')),
			__memo(() => import('./chunks/3-DMvRfMGK.js')),
			__memo(() => import('./chunks/4-CnuMscnY.js')),
			__memo(() => import('./chunks/5-CDX4yAH0.js')),
			__memo(() => import('./chunks/6-CF4ZCDry.js')),
			__memo(() => import('./chunks/7-B6n8FVZV.js')),
			__memo(() => import('./chunks/8-BuLwwJRn.js')),
			__memo(() => import('./chunks/9-CY4f2T8r.js')),
			__memo(() => import('./chunks/10-CW8CHKmW.js')),
			__memo(() => import('./chunks/11-CnBLA4vw.js')),
			__memo(() => import('./chunks/12-CKF1cLBh.js')),
			__memo(() => import('./chunks/13-B2fpklDH.js')),
			__memo(() => import('./chunks/14-Cc_wGIhQ.js')),
			__memo(() => import('./chunks/15-Ch7vl38Z.js')),
			__memo(() => import('./chunks/16-Dkm5Gm8W.js')),
			__memo(() => import('./chunks/17-H11MRU7S.js')),
			__memo(() => import('./chunks/18-VlVpMxIr.js')),
			__memo(() => import('./chunks/19-D_I-GRzG.js')),
			__memo(() => import('./chunks/20-BAri8WpH.js')),
			__memo(() => import('./chunks/21-DuPBFSB5.js')),
			__memo(() => import('./chunks/22-nCGXektk.js')),
			__memo(() => import('./chunks/23-CD2MwkNI.js')),
			__memo(() => import('./chunks/24-CAATLwtN.js')),
			__memo(() => import('./chunks/25-BmvSwOVq.js')),
			__memo(() => import('./chunks/26-BE73qtAy.js'))
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
