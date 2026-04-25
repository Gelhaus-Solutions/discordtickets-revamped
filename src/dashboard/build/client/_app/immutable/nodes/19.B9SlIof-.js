const __vite__mapDeps=(i, m=__vite__mapDeps, d=(m.f||(m.f=['../chunks/D2-oBDD7.js', '../chunks/Dp1pzeXC.js'])))=>i.map(i=>d[i]);
import{ e as tr }from'../chunks/Cxx9n8vM.js';import{ _ as ir }from'../chunks/Dp1pzeXC.js';import'../chunks/Bzak7iHL.js';import{ o as ao }from'../chunks/BAc9Nw6w.js';import{
	m as ar, V as or, bG as rr, l as nr, p as Wt, h as ge, c as d, i as c, r as s, aZ as oo, a as T, b as Gt, f as O, aU as Vi, t as M, g, aV as at, d as ze, U as lt, s as Se, aY as lr, j as Ct, e as Ot, u as ki, au as Ya, aT as Ci,
}from'../chunks/CWXCXDbJ.js';import{ s as oe }from'../chunks/BTVB6o0Y.js';import{ i as L }from'../chunks/BnKh12PZ.js';import{ B as sr }from'../chunks/DU73alKZ.js';import{
	e as Ne, i as Pe,
}from'../chunks/DuqOsHh6.js';import{ h as Ba }from'../chunks/CSnVTN25.js';import{
	r as Z, b as Fe, s as Yi, c as Y,
}from'../chunks/DNgBoiT1.js';import{ s as Mt }from'../chunks/C9yEqpEA.js';import{ c as Oi }from'../chunks/CdsDKcub.js';import{ s as Ai }from'../chunks/CUQ3wp6X.js';import{
	b as de, a as vt,
}from'../chunks/C43HmXkP.js';import{ p as dr }from'../chunks/r2wwZTEc.js';import{ r as Ua }from'../chunks/CTNvJ3TN.js';import{ m as Ii }from'../chunks/5EBxWskT.js';import{ e as Ni }from'../chunks/DSwvs_u7.js';import{ m as Wa }from'../chunks/DG6z6l1p.js';import{ b as ur }from'../chunks/BOws-f3s.js';import{
	s as cr, a as fr,
}from'../chunks/DeGpVRd_.js';import{ p as pr }from'../chunks/ckya4THT.js';import{ p as ro }from'../chunks/D8EB0mrL.js';import{ R as qe }from'../chunks/CFD2bbYg.js';import{ m as mr }from'../chunks/BE5_j-nZ.js';import{ q as J }from'../chunks/Cg7R6lrz.js';import{ b as vr }from'../chunks/BS1CIRWV.js';import{ E as hr }from'../chunks/CZwjNc88.js';const gr=Symbol('NaN');function Ga(i, e, t){
	ar&&or();const a=new sr(i), o=!rr();nr(()=>{
		let r=e();r!==r&&(r=gr), o&&r!==null&&typeof r==='object'&&(r={}), a.ensure(r, t);
	});
}async function br({
	fetch:i, params:e,
}){
	let r;const t={ credentials:'include' };let a;if(e.category==='new'){
		a={
			channelName:'',
			claiming:!1,
			description:'',
			discordCategory:'new',
			enableFeedback:!1,
			emoji:'',
			image:'',
			memberLimit:1,
			name:'',
			openingMessage:'',
			pingRoles:[],
			questions:[],
			ratelimit:null,
			requiredRoles:[],
			requireTopic:!1,
			staffRoles:[],
			totalLimit:50,
			channelMode:'CHANNEL',
			backupCategoryId:null,
		};
	}else{
		const n=await i(`/api/admin/guilds/${e.guild}/categories/${e.category}`, t), u=(r=n.headers.get('Content-Type'))==null?void 0:r.includes('json');a=u?await n.json():await n.text(), n.ok||tr(n.status, u?JSON.stringify(a):a);
	}let o=`/api/admin/guilds/${e.guild}/categories`;return e.category!=='new'&&(o+=`/${e.category}`), {
		url:o,
		category:a,
		channels:await(await i(`/api/admin/guilds/${e.guild}/data?query=channels.cache`, t)).json(),
		roles:await(await i(`/api/admin/guilds/${e.guild}/data?query=roles.cache`, t)).json(),
		categories:await(await i(`/api/admin/guilds/${e.guild}/categories`, t)).json(),
		settings:await(await i(`/api/admin/guilds/${e.guild}/settings`, t)).json(),
	};
}const hl=Object.freeze(Object.defineProperty({
	__proto__:null,
	load:br,
}, Symbol.toStringTag, { value:'Module' }));let At;const _r=new Uint8Array(16);function yr(){
	if(!At&&(At=typeof crypto<'u'&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto), !At))throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');return At(_r);
}const ue=[];for(let i=0;i<256;++i)ue.push((i+256).toString(16).slice(1));function xr(i, e=0){
	return ue[i[e+0]]+ue[i[e+1]]+ue[i[e+2]]+ue[i[e+3]]+'-'+ue[i[e+4]]+ue[i[e+5]]+'-'+ue[i[e+6]]+ue[i[e+7]]+'-'+ue[i[e+8]]+ue[i[e+9]]+'-'+ue[i[e+10]]+ue[i[e+11]]+ue[i[e+12]]+ue[i[e+13]]+ue[i[e+14]]+ue[i[e+15]];
}const wr=typeof crypto<'u'&&crypto.randomUUID&&crypto.randomUUID.bind(crypto), za={ randomUUID:wr };function Er(i, e, t){
	if(za.randomUUID&&!i)return za.randomUUID();i=i||{};const a=i.random||(i.rng||yr)();return a[6]=a[6]&15|64, a[8]=a[8]&63|128, xr(a);
}/** !
 * Sortable 1.15.7
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */function Dr(i, e, t){
	return(e=Cr(e))in i?Object.defineProperty(i, e, {
		value:t,
		enumerable:!0,
		configurable:!0,
		writable:!0,
	}):i[e]=t, i;
}function Be(){
	return Be=Object.assign?Object.assign.bind():function(i){
		for(let e=1;e<arguments.length;e++){
			const t=arguments[e];for(const a in t)({}).hasOwnProperty.call(t, a)&&(i[a]=t[a]);
		}return i;
	}, Be.apply(null, arguments);
}function Va(i, e){
	const t=Object.keys(i);if(Object.getOwnPropertySymbols){
		let a=Object.getOwnPropertySymbols(i);e&&(a=a.filter(o =>Object.getOwnPropertyDescriptor(i, o).enumerable)), t.push.apply(t, a);
	}return t;
}function je(i){
	for(let e=1;e<arguments.length;e++){
		var t=arguments[e]!=null?arguments[e]:{};e%2?Va(Object(t), !0).forEach(a =>{
			Dr(i, a, t[a]);
		}):Object.getOwnPropertyDescriptors?Object.defineProperties(i, Object.getOwnPropertyDescriptors(t)):Va(Object(t)).forEach(a =>{
			Object.defineProperty(i, a, Object.getOwnPropertyDescriptor(t, a));
		});
	}return i;
}function Tr(i, e){
	if(i==null)return{};let t, a, o=Sr(i, e);if(Object.getOwnPropertySymbols){
		const r=Object.getOwnPropertySymbols(i);for(a=0;a<r.length;a++)t=r[a], e.indexOf(t)===-1&&{}.propertyIsEnumerable.call(i, t)&&(o[t]=i[t]);
	}return o;
}function Sr(i, e){
	if(i==null)return{};const t={};for(const a in i){
		if({}.hasOwnProperty.call(i, a)){
			if(e.indexOf(a)!==-1)continue;t[a]=i[a];
		}
	}return t;
}function kr(i, e){
	if(typeof i!=='object'||!i)return i;const t=i[Symbol.toPrimitive];if(t!==void 0){
		const a=t.call(i, e);if(typeof a!=='object')return a;throw new TypeError('@@toPrimitive must return a primitive value.');
	}return(e==='string'?String:Number)(i);
}function Cr(i){
	const e=kr(i, 'string');return typeof e==='symbol'?e:e+'';
}function Bi(i){
	'@babel/helpers - typeof';return Bi=typeof Symbol==='function'&&typeof Symbol.iterator==='symbol'?function(e){
		return typeof e;
	}:function(e){
		return e&&typeof Symbol==='function'&&e.constructor===Symbol&&e!==Symbol.prototype?'symbol':typeof e;
	}, Bi(i);
}const Or='1.15.7';function Ye(i){
	if(typeof window<'u'&&window.navigator)return!!navigator.userAgent.match(i);
}const Ue=Ye(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Dt=Ye(/Edge/i), $a=Ye(/firefox/i), _t=Ye(/safari/i)&&!Ye(/chrome/i)&&!Ye(/android/i), $i=Ye(/iP(ad|od|hone)/i), no=Ye(/chrome/i)&&Ye(/android/i), lo={
	capture:!1,
	passive:!1,
};function N(i, e, t){
	i.addEventListener(e, t, !Ue&&lo);
}function I(i, e, t){
	i.removeEventListener(e, t, !Ue&&lo);
}function Xt(i, e){
	if(e){
		if(e[0]==='>'&&(e=e.substring(1)), i){
			try{
				if(i.matches)return i.matches(e);if(i.msMatchesSelector)return i.msMatchesSelector(e);if(i.webkitMatchesSelector)return i.webkitMatchesSelector(e);
			}catch{
				return!1;
			}
		}return!1;
	}
}function so(i){
	return i.host&&i!==document&&i.host.nodeType&&i.host!==i?i.host:i.parentNode;
}function Me(i, e, t, a){
	if(i){
		t=t||document;do{
			if(e!=null&&(e[0]==='>'?i.parentNode===t&&Xt(i, e):Xt(i, e))||a&&i===t)return i;if(i===t)break;
		}while(i=so(i));
	}return null;
}const Qa=/\s+/g;function Ee(i, e, t){
	if(i&&e){
		if(i.classList){
			i.classList[t?'add':'remove'](e);
		}else{
			const a=(' '+i.className+' ').replace(Qa, ' ').replace(' '+e+' ', ' ');i.className=(a+(t?' '+e:'')).replace(Qa, ' ');
		}
	}
}function E(i, e, t){
	const a=i&&i.style;if(a){
		if(t===void 0)return document.defaultView&&document.defaultView.getComputedStyle?t=document.defaultView.getComputedStyle(i, ''):i.currentStyle&&(t=i.currentStyle), e===void 0?t:t[e];!(e in a)&&e.indexOf('webkit')===-1&&(e='-webkit-'+e), a[e]=t+(typeof t==='string'?'':'px');
	}
}function ut(i, e){
	let t='';if(typeof i==='string'){
		t=i;
	}else {
		do{
			const a=E(i, 'transform');a&&a!=='none'&&(t=a+' '+t);
		}while(!e&&(i=i.parentNode));
	}const o=window.DOMMatrix||window.WebKitCSSMatrix||window.CSSMatrix||window.MSCSSMatrix;return o&&new o(t);
}function uo(i, e, t){
	if(i){
		let a=i.getElementsByTagName(e), o=0, r=a.length;if(t)for(;o<r;o++)t(a[o], o);return a;
	}return[];
}function Le(){
	const i=document.scrollingElement;return i||document.documentElement;
}function ie(i, e, t, a, o){
	if(!(!i.getBoundingClientRect&&i!==window)){
		let r, n, u, f, p, b, m;if(i!==window&&i.parentNode&&i!==Le()?(r=i.getBoundingClientRect(), n=r.top, u=r.left, f=r.bottom, p=r.right, b=r.height, m=r.width):(n=0, u=0, f=window.innerHeight, p=window.innerWidth, b=window.innerHeight, m=window.innerWidth), (e||t)&&i!==window&&(o=o||i.parentNode, !Ue)){
			do {
				if(o&&o.getBoundingClientRect&&(E(o, 'transform')!=='none'||t&&E(o, 'position')!=='static')){
					const y=o.getBoundingClientRect();n-=y.top+parseInt(E(o, 'border-top-width')), u-=y.left+parseInt(E(o, 'border-left-width')), f=n+r.height, p=u+r.width;break;
				}
			}while(o=o.parentNode);
		}if(a&&i!==window){
			const w=ut(o||i), x=w&&w.a, S=w&&w.d;w&&(n/=S, u/=x, m/=x, b/=S, f=n+b, p=u+m);
		}return{
			top:n,
			left:u,
			bottom:f,
			right:p,
			width:m,
			height:b,
		};
	}
}function Ja(i, e, t){
	for(let a=$e(i, !0), o=ie(i)[e];a;){
		let r=ie(a)[t], n=void 0;if(n=o>=r, !n)return a;if(a===Le())break;a=$e(a, !1);
	}return!1;
}function ct(i, e, t, a){
	for(let o=0, r=0, n=i.children;r<n.length;){
		if(n[r].style.display!=='none'&&n[r]!==D.ghost&&(a||n[r]!==D.dragged)&&Me(n[r], t.draggable, i, !1)){
			if(o===e)return n[r];o++;
		}r++;
	}return null;
}function Qi(i, e){
	for(var t=i.lastElementChild;t&&(t===D.ghost||E(t, 'display')==='none'||e&&!Xt(t, e));)t=t.previousElementSibling;return t||null;
}function ke(i, e){
	let t=0;if(!i||!i.parentNode)return-1;for(;i=i.previousElementSibling;)i.nodeName.toUpperCase()!=='TEMPLATE'&&i!==D.clone&&(!e||Xt(i, e))&&t++;return t;
}function Ka(i){
	let e=0, t=0, a=Le();if(i){
		do{
			const o=ut(i), r=o.a, n=o.d;e+=i.scrollLeft*r, t+=i.scrollTop*n;
		}while(i!==a&&(i=i.parentNode));
	}return[e, t];
}function Ar(i, e){
	for(const t in i){
		if(i.hasOwnProperty(t)){
			for(const a in e)if(e.hasOwnProperty(a)&&e[a]===i[t][a])return Number(t);
		}
	}return-1;
}function $e(i, e){
	if(!i||!i.getBoundingClientRect)return Le();let t=i, a=!1;do {
		if(t.clientWidth<t.scrollWidth||t.clientHeight<t.scrollHeight){
			const o=E(t);if(t.clientWidth<t.scrollWidth&&(o.overflowX=='auto'||o.overflowX=='scroll')||t.clientHeight<t.scrollHeight&&(o.overflowY=='auto'||o.overflowY=='scroll')){
				if(!t.getBoundingClientRect||t===document.body)return Le();if(a||e)return t;a=!0;
			}
		}
	}while(t=t.parentNode);return Le();
}function Ir(i, e){
	if(i&&e)for(const t in e)e.hasOwnProperty(t)&&(i[t]=e[t]);return i;
}function Pi(i, e){
	return Math.round(i.top)===Math.round(e.top)&&Math.round(i.left)===Math.round(e.left)&&Math.round(i.height)===Math.round(e.height)&&Math.round(i.width)===Math.round(e.width);
}let yt;function co(i, e){
	return function(){
		if(!yt){
			const t=arguments, a=this;t.length===1?i.call(a, t[0]):i.apply(a, t), yt=setTimeout(() =>{
				yt=void 0;
			}, e);
		}
	};
}function Nr(){
	clearTimeout(yt), yt=void 0;
}function fo(i, e, t){
	i.scrollLeft+=e, i.scrollTop+=t;
}function po(i){
	const e=window.Polymer, t=window.jQuery||window.Zepto;return e&&e.dom?e.dom(i).cloneNode(!0):t?t(i).clone(!0)[0]:i.cloneNode(!0);
}function mo(i, e, t){
	const a={};return Array.from(i.children).forEach(o =>{
		let r, n, u, f;if(!(!Me(o, e.draggable, i, !1)||o.animated||o===t)){
			const p=ie(o);a.left=Math.min((r=a.left)!==null&&r!==void 0?r:1/0, p.left), a.top=Math.min((n=a.top)!==null&&n!==void 0?n:1/0, p.top), a.right=Math.max((u=a.right)!==null&&u!==void 0?u:-1/0, p.right), a.bottom=Math.max((f=a.bottom)!==null&&f!==void 0?f:-1/0, p.bottom);
		}
	}), a.width=a.right-a.left, a.height=a.bottom-a.top, a.x=a.left, a.y=a.top, a;
}const ye='Sortable'+new Date().getTime();function Pr(){
	let i=[], e;return{
		captureAnimationState:function(){
			if(i=[], !!this.options.animation){
				const a=[].slice.call(this.el.children);a.forEach(o =>{
					if(!(E(o, 'display')==='none'||o===D.ghost)){
						i.push({
							target:o,
							rect:ie(o),
						});const r=je({}, i[i.length-1].rect);if(o.thisAnimationDuration){
							const n=ut(o, !0);n&&(r.top-=n.f, r.left-=n.e);
						}o.fromRect=r;
					}
				});
			}
		},
		addAnimationState:function(a){
			i.push(a);
		},
		removeAnimationState:function(a){
			i.splice(Ar(i, { target:a }), 1);
		},
		animateAll:function(a){
			const o=this;if(!this.options.animation){
				clearTimeout(e), typeof a==='function'&&a();return;
			}let r=!1, n=0;i.forEach(u =>{
				let f=0, p=u.target, b=p.fromRect, m=ie(p), y=p.prevFromRect, w=p.prevToRect, x=u.rect, S=ut(p, !0);S&&(m.top-=S.f, m.left-=S.e), p.toRect=m, p.thisAnimationDuration&&Pi(y, m)&&!Pi(b, m)&&(x.top-m.top)/(x.left-m.left)===(b.top-m.top)/(b.left-m.left)&&(f=Mr(x, y, w, o.options)), Pi(m, b)||(p.prevFromRect=b, p.prevToRect=m, f||(f=o.options.animation), o.animate(p, x, m, f)), f&&(r=!0, n=Math.max(n, f), clearTimeout(p.animationResetTimer), p.animationResetTimer=setTimeout(() =>{
					p.animationTime=0, p.prevFromRect=null, p.fromRect=null, p.prevToRect=null, p.thisAnimationDuration=null;
				}, f), p.thisAnimationDuration=f);
			}), clearTimeout(e), r?e=setTimeout(() =>{
				typeof a==='function'&&a();
			}, n):typeof a==='function'&&a(), i=[];
		},
		animate:function(a, o, r, n){
			if(n){
				E(a, 'transition', ''), E(a, 'transform', '');const u=ut(this.el), f=u&&u.a, p=u&&u.d, b=(o.left-r.left)/(f||1), m=(o.top-r.top)/(p||1);a.animatingX=!!b, a.animatingY=!!m, E(a, 'transform', 'translate3d('+b+'px,'+m+'px,0)'), this.forRepaintDummy=qr(a), E(a, 'transition', 'transform '+n+'ms'+(this.options.easing?' '+this.options.easing:'')), E(a, 'transform', 'translate3d(0,0,0)'), typeof a.animated==='number'&&clearTimeout(a.animated), a.animated=setTimeout(() =>{
					E(a, 'transition', ''), E(a, 'transform', ''), a.animated=!1, a.animatingX=!1, a.animatingY=!1;
				}, n);
			}
		},
	};
}function qr(i){
	return i.offsetWidth;
}function Mr(i, e, t, a){
	return Math.sqrt(Math.pow(e.top-i.top, 2)+Math.pow(e.left-i.left, 2))/Math.sqrt(Math.pow(e.top-t.top, 2)+Math.pow(e.left-t.left, 2))*a.animation;
}const rt=[], qi={ initializeByDefault:!0 }, Tt={
	mount:function(e){
		for(const t in qi)qi.hasOwnProperty(t)&&!(t in e)&&(e[t]=qi[t]);rt.forEach(a =>{
			if(a.pluginName===e.pluginName)throw'Sortable: Cannot mount plugin '.concat(e.pluginName, ' more than once');
		}), rt.push(e);
	},
	pluginEvent:function(e, t, a){
		const o=this;this.eventCanceled=!1, a.cancel=function(){
			o.eventCanceled=!0;
		};const r=e+'Global';rt.forEach(n =>{
			t[n.pluginName]&&(t[n.pluginName][r]&&t[n.pluginName][r](je({ sortable:t }, a)), t.options[n.pluginName]&&t[n.pluginName][e]&&t[n.pluginName][e](je({ sortable:t }, a)));
		});
	},
	initializePlugins:function(e, t, a, o){
		rt.forEach(u =>{
			const f=u.pluginName;if(!(!e.options[f]&&!u.initializeByDefault)){
				const p=new u(e, t, e.options);p.sortable=e, p.options=e.options, e[f]=p, Be(a, p.defaults);
			}
		});for(const r in e.options){
			if(e.options.hasOwnProperty(r)){
				const n=this.modifyOption(e, r, e.options[r]);typeof n<'u'&&(e.options[r]=n);
			}
		}
	},
	getEventProperties:function(e, t){
		const a={};return rt.forEach(o =>{
			typeof o.eventProperties==='function'&&Be(a, o.eventProperties.call(t[o.pluginName], e));
		}), a;
	},
	modifyOption:function(e, t, a){
		let o;return rt.forEach(r =>{
			e[r.pluginName]&&r.optionListeners&&typeof r.optionListeners[t]==='function'&&(o=r.optionListeners[t].call(e[r.pluginName], a));
		}), o;
	},
};function Rr(i){
	let e=i.sortable, t=i.rootEl, a=i.name, o=i.targetEl, r=i.cloneEl, n=i.toEl, u=i.fromEl, f=i.oldIndex, p=i.newIndex, b=i.oldDraggableIndex, m=i.newDraggableIndex, y=i.originalEvent, w=i.putSortable, x=i.extraEventProperties;if(e=e||t&&t[ye], !!e){
		let S, U=e.options, K='on'+a.charAt(0).toUpperCase()+a.substr(1);window.CustomEvent&&!Ue&&!Dt?S=new CustomEvent(a, {
			bubbles:!0,
			cancelable:!0,
		}):(S=document.createEvent('Event'), S.initEvent(a, !0, !0)), S.to=n||t, S.from=u||t, S.item=o||t, S.clone=r, S.oldIndex=f, S.newIndex=p, S.oldDraggableIndex=b, S.newDraggableIndex=m, S.originalEvent=y, S.pullMode=w?w.lastPutMode:void 0;const q=je(je({}, x), Tt.getEventProperties(a, e));for(const V in q)S[V]=q[V];t&&t.dispatchEvent(S), U[K]&&U[K].call(e, S);
	}
}const Fr=['evt'], _e=function(e, t){
	const a=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{}, o=a.evt, r=Tr(a, Fr);Tt.pluginEvent.bind(D)(e, t, je({
		dragEl:h,
		parentEl:Q,
		ghostEl:C,
		rootEl:B,
		nextEl:it,
		lastDownEl:Rt,
		cloneEl:z,
		cloneHidden:Ve,
		dragStarted:ht,
		putSortable:ce,
		activeSortable:D.active,
		originalEvent:o,
		oldIndex:dt,
		oldDraggableIndex:xt,
		newIndex:De,
		newDraggableIndex:Ge,
		hideGhostForTarget:bo,
		unhideGhostForTarget:_o,
		cloneNowHidden:function(){
			Ve=!0;
		},
		cloneNowShown:function(){
			Ve=!1;
		},
		dispatchSortableEvent:function(u){
			he({
				sortable:t,
				name:u,
				originalEvent:o,
			});
		},
	}, r));
};function he(i){
	Rr(je({
		putSortable:ce,
		cloneEl:z,
		targetEl:h,
		rootEl:B,
		oldIndex:dt,
		oldDraggableIndex:xt,
		newIndex:De,
		newDraggableIndex:Ge,
	}, i));
}var h, Q, C, B, it, Rt, z, Ve, dt, De, xt, Ge, It, ce, st=!1, Ht=!1, Yt=[], et, Ie, Mi, Ri, Za, eo, ht, nt, wt, Et=!1, Nt=!1, Ft, pe, Fi=[], Ui=!1, Bt=[], zt=typeof document<'u', Pt=$i, to=Dt||Ue?'cssFloat':'float', Lr=zt&&!no&&!$i&&'draggable'in document.createElement('div'), vo=(function(){
		if(zt){
			if(Ue)return!1;const i=document.createElement('x');return i.style.cssText='pointer-events:auto', i.style.pointerEvents==='auto';
		}
	})(), ho=function(e, t){
		const a=E(e), o=parseInt(a.width)-parseInt(a.paddingLeft)-parseInt(a.paddingRight)-parseInt(a.borderLeftWidth)-parseInt(a.borderRightWidth), r=ct(e, 0, t), n=ct(e, 1, t), u=r&&E(r), f=n&&E(n), p=u&&parseInt(u.marginLeft)+parseInt(u.marginRight)+ie(r).width, b=f&&parseInt(f.marginLeft)+parseInt(f.marginRight)+ie(n).width;if(a.display==='flex')return a.flexDirection==='column'||a.flexDirection==='column-reverse'?'vertical':'horizontal';if(a.display==='grid')return a.gridTemplateColumns.split(' ').length<=1?'vertical':'horizontal';if(r&&u.float&&u.float!=='none'){
			const m=u.float==='left'?'left':'right';return n&&(f.clear==='both'||f.clear===m)?'vertical':'horizontal';
		}return r&&(u.display==='block'||u.display==='flex'||u.display==='table'||u.display==='grid'||p>=o&&a[to]==='none'||n&&a[to]==='none'&&p+b>o)?'vertical':'horizontal';
	}, jr=function(e, t, a){
		const o=a?e.left:e.top, r=a?e.right:e.bottom, n=a?e.width:e.height, u=a?t.left:t.top, f=a?t.right:t.bottom, p=a?t.width:t.height;return o===u||r===f||o+n/2===u+p/2;
	}, Xr=function(e, t){
		let a;return Yt.some(o =>{
			const r=o[ye].options.emptyInsertThreshold;if(!(!r||Qi(o))){
				const n=ie(o), u=e>=n.left-r&&e<=n.right+r, f=t>=n.top-r&&t<=n.bottom+r;if(u&&f)return a=o;
			}
		}), a;
	}, go=function(e){
		function t(r, n){
			return function(u, f, p, b){
				const m=u.options.group.name&&f.options.group.name&&u.options.group.name===f.options.group.name;if(r==null&&(n||m))return!0;if(r==null||r===!1)return!1;if(n&&r==='clone')return r;if(typeof r==='function')return t(r(u, f, p, b), n)(u, f, p, b);const y=(n?u:f).options.group.name;return r===!0||typeof r==='string'&&r===y||r.join&&r.indexOf(y)>-1;
			};
		}let a={}, o=e.group;(!o||Bi(o)!='object')&&(o={ name:o }), a.name=o.name, a.checkPull=t(o.pull, !0), a.checkPut=t(o.put), a.revertClone=o.revertClone, e.group=a;
	}, bo=function(){
		!vo&&C&&E(C, 'display', 'none');
	}, _o=function(){
		!vo&&C&&E(C, 'display', '');
	};zt&&!no&&document.addEventListener('click', i =>{
	if(Ht)return i.preventDefault(), i.stopPropagation&&i.stopPropagation(), i.stopImmediatePropagation&&i.stopImmediatePropagation(), Ht=!1, !1;
}, !0);const tt=function(e){
		if(h){
			e=e.touches?e.touches[0]:e;const t=Xr(e.clientX, e.clientY);if(t){
				const a={};for(const o in e)e.hasOwnProperty(o)&&(a[o]=e[o]);a.target=a.rootEl=t, a.preventDefault=void 0, a.stopPropagation=void 0, t[ye]._onDragOver(a);
			}
		}
	}, Hr=function(e){
		h&&h.parentNode[ye]._isOutsideThisEl(e.target);
	};function D(i, e){
	if(!(i&&i.nodeType&&i.nodeType===1))throw'Sortable: `el` must be an HTMLElement, not '.concat({}.toString.call(i));this.el=i, this.options=e=Be({}, e), i[ye]=this;const t={
		group:null,
		sort:!0,
		disabled:!1,
		store:null,
		handle:null,
		draggable:/^[uo]l$/i.test(i.nodeName)?'>li':'>*',
		swapThreshold:1,
		invertSwap:!1,
		invertedSwapThreshold:null,
		removeCloneOnHide:!0,
		direction:function(){
			return ho(i, this.options);
		},
		ghostClass:'sortable-ghost',
		chosenClass:'sortable-chosen',
		dragClass:'sortable-drag',
		ignore:'a, img',
		filter:null,
		preventOnFilter:!0,
		animation:0,
		easing:null,
		setData:function(n, u){
			n.setData('Text', u.textContent);
		},
		dropBubble:!1,
		dragoverBubble:!1,
		dataIdAttr:'data-id',
		delay:0,
		delayOnTouchOnly:!1,
		touchStartThreshold:(Number.parseInt?Number:window).parseInt(window.devicePixelRatio, 10)||1,
		forceFallback:!1,
		fallbackClass:'sortable-fallback',
		fallbackOnBody:!1,
		fallbackTolerance:0,
		fallbackOffset:{
			x:0,
			y:0,
		},
		supportPointer:D.supportPointer!==!1&&'PointerEvent'in window&&(!_t||$i),
		emptyInsertThreshold:5,
	};Tt.initializePlugins(this, i, t);for(const a in t)!(a in e)&&(e[a]=t[a]);go(e);for(const o in this)o.charAt(0)==='_'&&typeof this[o]==='function'&&(this[o]=this[o].bind(this));this.nativeDraggable=e.forceFallback?!1:Lr, this.nativeDraggable&&(this.options.touchStartThreshold=1), e.supportPointer?N(i, 'pointerdown', this._onTapStart):(N(i, 'mousedown', this._onTapStart), N(i, 'touchstart', this._onTapStart)), this.nativeDraggable&&(N(i, 'dragover', this), N(i, 'dragenter', this)), Yt.push(this.el), e.store&&e.store.get&&this.sort(e.store.get(this)||[]), Be(this, Pr());
}D.prototype={
	constructor:D,
	_isOutsideThisEl:function(e){
		!this.el.contains(e)&&e!==this.el&&(nt=null);
	},
	_getDirection:function(e, t){
		return typeof this.options.direction==='function'?this.options.direction.call(this, e, t, h):this.options.direction;
	},
	_onTapStart:function(e){
		if(e.cancelable){
			let t=this, a=this.el, o=this.options, r=o.preventOnFilter, n=e.type, u=e.touches&&e.touches[0]||e.pointerType&&e.pointerType==='touch'&&e, f=(u||e).target, p=e.target.shadowRoot&&(e.path&&e.path[0]||e.composedPath&&e.composedPath()[0])||f, b=o.filter;if($r(a), !h&&!(/mousedown|pointerdown/.test(n)&&e.button!==0||o.disabled)&&!p.isContentEditable&&!(!this.nativeDraggable&&_t&&f&&f.tagName.toUpperCase()==='SELECT')&&(f=Me(f, o.draggable, a, !1), !(f&&f.animated)&&Rt!==f)){
				if(dt=ke(f), xt=ke(f, o.draggable), typeof b==='function'){
					if(b.call(this, e, f, this)){
						he({
							sortable:t,
							rootEl:p,
							name:'filter',
							targetEl:f,
							toEl:a,
							fromEl:a,
						}), _e('filter', t, { evt:e }), r&&e.preventDefault();return;
					}
				}else if(b&&(b=b.split(',').some(m =>{
					if(m=Me(p, m.trim(), a, !1), m){
						return he({
							sortable:t,
							rootEl:m,
							name:'filter',
							targetEl:f,
							fromEl:a,
							toEl:a,
						}), _e('filter', t, { evt:e }), !0;
					}
				}), b)){
					r&&e.preventDefault();return;
				}o.handle&&!Me(p, o.handle, a, !1)||this._prepareDragStart(e, u, f);
			}
		}
	},
	_prepareDragStart:function(e, t, a){
		let o=this, r=o.el, n=o.options, u=r.ownerDocument, f;if(a&&!h&&a.parentNode===r){
			const p=ie(a);if(B=r, h=a, Q=h.parentNode, it=h.nextSibling, Rt=a, It=n.group, D.dragged=h, et={
				target:h,
				clientX:(t||e).clientX,
				clientY:(t||e).clientY,
			}, Za=et.clientX-p.left, eo=et.clientY-p.top, this._lastX=(t||e).clientX, this._lastY=(t||e).clientY, h.style['will-change']='all', f=function(){
				if(_e('delayEnded', o, { evt:e }), D.eventCanceled){
					o._onDrop();return;
				}o._disableDelayedDragEvents(), !$a&&o.nativeDraggable&&(h.draggable=!0), o._triggerDragStart(e, t), he({
					sortable:o,
					name:'choose',
					originalEvent:e,
				}), Ee(h, n.chosenClass, !0);
			}, n.ignore.split(',').forEach(b =>{
				uo(h, b.trim(), Li);
			}), N(u, 'dragover', tt), N(u, 'mousemove', tt), N(u, 'touchmove', tt), n.supportPointer?(N(u, 'pointerup', o._onDrop), !this.nativeDraggable&&N(u, 'pointercancel', o._onDrop)):(N(u, 'mouseup', o._onDrop), N(u, 'touchend', o._onDrop), N(u, 'touchcancel', o._onDrop)), $a&&this.nativeDraggable&&(this.options.touchStartThreshold=4, h.draggable=!0), _e('delayStart', this, { evt:e }), n.delay&&(!n.delayOnTouchOnly||t)&&(!this.nativeDraggable||!(Dt||Ue))){
				if(D.eventCanceled){
					this._onDrop();return;
				}n.supportPointer?(N(u, 'pointerup', o._disableDelayedDrag), N(u, 'pointercancel', o._disableDelayedDrag)):(N(u, 'mouseup', o._disableDelayedDrag), N(u, 'touchend', o._disableDelayedDrag), N(u, 'touchcancel', o._disableDelayedDrag)), N(u, 'mousemove', o._delayedDragTouchMoveHandler), N(u, 'touchmove', o._delayedDragTouchMoveHandler), n.supportPointer&&N(u, 'pointermove', o._delayedDragTouchMoveHandler), o._dragStartTimer=setTimeout(f, n.delay);
			}else {
				f();
			}
		}
	},
	_delayedDragTouchMoveHandler:function(e){
		const t=e.touches?e.touches[0]:e;Math.max(Math.abs(t.clientX-this._lastX), Math.abs(t.clientY-this._lastY))>=Math.floor(this.options.touchStartThreshold/(this.nativeDraggable&&window.devicePixelRatio||1))&&this._disableDelayedDrag();
	},
	_disableDelayedDrag:function(){
		h&&Li(h), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
	},
	_disableDelayedDragEvents:function(){
		const e=this.el.ownerDocument;I(e, 'mouseup', this._disableDelayedDrag), I(e, 'touchend', this._disableDelayedDrag), I(e, 'touchcancel', this._disableDelayedDrag), I(e, 'pointerup', this._disableDelayedDrag), I(e, 'pointercancel', this._disableDelayedDrag), I(e, 'mousemove', this._delayedDragTouchMoveHandler), I(e, 'touchmove', this._delayedDragTouchMoveHandler), I(e, 'pointermove', this._delayedDragTouchMoveHandler);
	},
	_triggerDragStart:function(e, t){
		t=t||e.pointerType=='touch'&&e, !this.nativeDraggable||t?this.options.supportPointer?N(document, 'pointermove', this._onTouchMove):t?N(document, 'touchmove', this._onTouchMove):N(document, 'mousemove', this._onTouchMove):(N(h, 'dragend', this), N(B, 'dragstart', this._onDragStart));try{
			document.selection?Lt(() =>{
				document.selection.empty();
			}):window.getSelection().removeAllRanges();
		}catch{}
	},
	_dragStarted:function(e, t){
		if(st=!1, B&&h){
			_e('dragStarted', this, { evt:t }), this.nativeDraggable&&N(document, 'dragover', Hr);const a=this.options;!e&&Ee(h, a.dragClass, !1), Ee(h, a.ghostClass, !0), D.active=this, e&&this._appendGhost(), he({
				sortable:this,
				name:'start',
				originalEvent:t,
			});
		}else {
			this._nulling();
		}
	},
	_emulateDragOver:function(){
		if(Ie){
			this._lastX=Ie.clientX, this._lastY=Ie.clientY, bo();for(var e=document.elementFromPoint(Ie.clientX, Ie.clientY), t=e;e&&e.shadowRoot&&(e=e.shadowRoot.elementFromPoint(Ie.clientX, Ie.clientY), e!==t);)t=e;if(h.parentNode[ye]._isOutsideThisEl(e), t){
				do{
					if(t[ye]){
						let a=void 0;if(a=t[ye]._onDragOver({
							clientX:Ie.clientX,
							clientY:Ie.clientY,
							target:e,
							rootEl:t,
						}), a&&!this.options.dragoverBubble)break;
					}e=t;
				}while(t=so(t));
			}_o();
		}
	},
	_onTouchMove:function(e){
		if(et){
			let t=this.options, a=t.fallbackTolerance, o=t.fallbackOffset, r=e.touches?e.touches[0]:e, n=C&&ut(C, !0), u=C&&n&&n.a, f=C&&n&&n.d, p=Pt&&pe&&Ka(pe), b=(r.clientX-et.clientX+o.x)/(u||1)+(p?p[0]-Fi[0]:0)/(u||1), m=(r.clientY-et.clientY+o.y)/(f||1)+(p?p[1]-Fi[1]:0)/(f||1);if(!D.active&&!st){
				if(a&&Math.max(Math.abs(r.clientX-this._lastX), Math.abs(r.clientY-this._lastY))<a)return;this._onDragStart(e, !0);
			}if(C){
				n?(n.e+=b-(Mi||0), n.f+=m-(Ri||0)):n={
					a:1,
					b:0,
					c:0,
					d:1,
					e:b,
					f:m,
				};const y='matrix('.concat(n.a, ',').concat(n.b, ',').concat(n.c, ',').concat(n.d, ',').concat(n.e, ',').concat(n.f, ')');E(C, 'webkitTransform', y), E(C, 'mozTransform', y), E(C, 'msTransform', y), E(C, 'transform', y), Mi=b, Ri=m, Ie=r;
			}e.cancelable&&e.preventDefault();
		}
	},
	_appendGhost:function(){
		if(!C){
			const e=this.options.fallbackOnBody?document.body:B, t=ie(h, !0, Pt, !0, e), a=this.options;if(Pt){
				for(pe=e;E(pe, 'position')==='static'&&E(pe, 'transform')==='none'&&pe!==document;)pe=pe.parentNode;pe!==document.body&&pe!==document.documentElement?(pe===document&&(pe=Le()), t.top+=pe.scrollTop, t.left+=pe.scrollLeft):pe=Le(), Fi=Ka(pe);
			}C=h.cloneNode(!0), Ee(C, a.ghostClass, !1), Ee(C, a.fallbackClass, !0), Ee(C, a.dragClass, !0), E(C, 'transition', ''), E(C, 'transform', ''), E(C, 'box-sizing', 'border-box'), E(C, 'margin', 0), E(C, 'top', t.top), E(C, 'left', t.left), E(C, 'width', t.width), E(C, 'height', t.height), E(C, 'opacity', '0.8'), E(C, 'position', Pt?'absolute':'fixed'), E(C, 'zIndex', '100000'), E(C, 'pointerEvents', 'none'), D.ghost=C, e.appendChild(C), E(C, 'transform-origin', Za/parseInt(C.style.width)*100+'% '+eo/parseInt(C.style.height)*100+'%');
		}
	},
	_onDragStart:function(e, t){
		const a=this, o=e.dataTransfer, r=a.options;if(_e('dragStart', this, { evt:e }), D.eventCanceled){
			this._onDrop();return;
		}_e('setupClone', this), D.eventCanceled||(z=po(h), z.removeAttribute('id'), z.draggable=!1, z.style['will-change']='', this._hideClone(), Ee(z, this.options.chosenClass, !1), D.clone=z), a.cloneId=Lt(() =>{
			_e('clone', a), !D.eventCanceled&&(a.options.removeCloneOnHide||B.insertBefore(z, h), a._hideClone(), he({
				sortable:a,
				name:'clone',
			}));
		}), !t&&Ee(h, r.dragClass, !0), t?(Ht=!0, a._loopId=setInterval(a._emulateDragOver, 50)):(I(document, 'mouseup', a._onDrop), I(document, 'touchend', a._onDrop), I(document, 'touchcancel', a._onDrop), o&&(o.effectAllowed='move', r.setData&&r.setData.call(a, o, h)), N(document, 'drop', a), E(h, 'transform', 'translateZ(0)')), st=!0, a._dragStartId=Lt(a._dragStarted.bind(a, t, e)), N(document, 'selectstart', a), ht=!0, window.getSelection().removeAllRanges(), _t&&E(document.body, 'user-select', 'none');
	},
	_onDragOver:function(e){
		let t=this.el, a=e.target, o, r, n, u=this.options, f=u.group, p=D.active, b=It===f, m=u.sort, y=ce||p, w, x=this, S=!1;if(Ui)return;function U(we, Qe){
			_e(we, x, je({
				evt:e,
				isOwner:b,
				axis:w?'vertical':'horizontal',
				revert:n,
				dragRect:o,
				targetRect:r,
				canSort:m,
				fromSortable:y,
				target:a,
				completed:q,
				onMove:function(Je, ft){
					return qt(B, t, h, o, Je, ie(Je), e, ft);
				},
				changed:V,
			}, Qe));
		}function K(){
			U('dragOverAnimationCapture'), x.captureAnimationState(), x!==y&&y.captureAnimationState();
		}function q(we){
			return U('dragOverCompleted', { insertion:we }), we&&(b?p._hideClone():p._showClone(x), x!==y&&(Ee(h, ce?ce.options.ghostClass:p.options.ghostClass, !1), Ee(h, u.ghostClass, !0)), ce!==x&&x!==D.active?ce=x:x===D.active&&ce&&(ce=null), y===x&&(x._ignoreWhileAnimating=a), x.animateAll(() =>{
				U('dragOverAnimationComplete'), x._ignoreWhileAnimating=null;
			}), x!==y&&(y.animateAll(), y._ignoreWhileAnimating=null)), (a===h&&!h.animated||a===t&&!a.animated)&&(nt=null), !u.dragoverBubble&&!e.rootEl&&a!==document&&(h.parentNode[ye]._isOutsideThisEl(e.target), !we&&tt(e)), !u.dragoverBubble&&e.stopPropagation&&e.stopPropagation(), S=!0;
		}function V(){
			De=ke(h), Ge=ke(h, u.draggable), he({
				sortable:x,
				name:'change',
				toEl:t,
				newIndex:De,
				newDraggableIndex:Ge,
				originalEvent:e,
			});
		}if(e.preventDefault!==void 0&&e.cancelable&&e.preventDefault(), a=Me(a, u.draggable, t, !0), U('dragOver'), D.eventCanceled)return S;if(h.contains(e.target)||a.animated&&a.animatingX&&a.animatingY||x._ignoreWhileAnimating===a)return q(!1);if(Ht=!1, p&&!u.disabled&&(b?m||(n=Q!==B):ce===this||(this.lastPutMode=It.checkPull(this, p, h, e))&&f.checkPut(this, p, h, e))){
			if(w=this._getDirection(e, a)==='vertical', o=ie(h), U('dragOverValid'), D.eventCanceled)return S;if(n)return Q=B, K(), this._hideClone(), U('revert'), D.eventCanceled||(it?B.insertBefore(h, it):B.appendChild(h)), q(!0);const j=Qi(t, u.draggable);if(!j||Wr(e, w, this)&&!j.animated){
				if(j===h)return q(!1);if(j&&t===e.target&&(a=j), a&&(r=ie(a)), qt(B, t, h, o, a, r, e, !!a)!==!1)return K(), j&&j.nextSibling?t.insertBefore(h, j.nextSibling):t.appendChild(h), Q=t, V(), q(!0);
			}else if(j&&Ur(e, w, this)){
				const re=ct(t, 0, u, !0);if(re===h)return q(!1);if(a=re, r=ie(a), qt(B, t, h, o, a, r, e, !1)!==!1)return K(), t.insertBefore(h, re), Q=t, V(), q(!0);
			}else if(a.parentNode===t){
				r=ie(a);let X=0, ee, ne=h.parentNode!==t, W=!jr(h.animated&&h.toRect||o, a.animated&&a.toRect||r, w), R=w?'top':'left', ae=Ja(a, 'top', 'top')||Ja(h, 'top', 'top'), A=ae?ae.scrollTop:void 0;nt!==a&&(ee=r[R], Et=!1, Nt=!W&&u.invertSwap||ne), X=Gr(e, a, r, w, W?1:u.swapThreshold, u.invertedSwapThreshold==null?u.swapThreshold:u.invertedSwapThreshold, Nt, nt===a);let $;if(X!==0){
					let xe=ke(h);do xe-=X, $=Q.children[xe];while($&&(E($, 'display')==='none'||$===C));
				}if(X===0||$===a)return q(!1);nt=a, wt=X;let Te=a.nextElementSibling, me=!1;me=X===1;const Ce=qt(B, t, h, o, a, r, e, me);if(Ce!==!1)return(Ce===1||Ce===-1)&&(me=Ce===1), Ui=!0, setTimeout(Br, 30), K(), me&&!Te?t.appendChild(h):a.parentNode.insertBefore(h, me?Te:a), ae&&fo(ae, 0, A-ae.scrollTop), Q=h.parentNode, ee!==void 0&&!Nt&&(Ft=Math.abs(ee-ie(a)[R])), V(), q(!0);
			}if(t.contains(h))return q(!1);
		}return!1;
	},
	_ignoreWhileAnimating:null,
	_offMoveEvents:function(){
		I(document, 'mousemove', this._onTouchMove), I(document, 'touchmove', this._onTouchMove), I(document, 'pointermove', this._onTouchMove), I(document, 'dragover', tt), I(document, 'mousemove', tt), I(document, 'touchmove', tt);
	},
	_offUpEvents:function(){
		const e=this.el.ownerDocument;I(e, 'mouseup', this._onDrop), I(e, 'touchend', this._onDrop), I(e, 'pointerup', this._onDrop), I(e, 'pointercancel', this._onDrop), I(e, 'touchcancel', this._onDrop), I(document, 'selectstart', this);
	},
	_onDrop:function(e){
		const t=this.el, a=this.options;if(De=ke(h), Ge=ke(h, a.draggable), _e('drop', this, { evt:e }), Q=h&&h.parentNode, De=ke(h), Ge=ke(h, a.draggable), D.eventCanceled){
			this._nulling();return;
		}st=!1, Nt=!1, Et=!1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), Wi(this.cloneId), Wi(this._dragStartId), this.nativeDraggable&&(I(document, 'drop', this), I(t, 'dragstart', this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), _t&&E(document.body, 'user-select', ''), E(h, 'transform', ''), e&&(ht&&(e.cancelable&&e.preventDefault(), !a.dropBubble&&e.stopPropagation()), C&&C.parentNode&&C.parentNode.removeChild(C), (B===Q||ce&&ce.lastPutMode!=='clone')&&z&&z.parentNode&&z.parentNode.removeChild(z), h&&(this.nativeDraggable&&I(h, 'dragend', this), Li(h), h.style['will-change']='', ht&&!st&&Ee(h, ce?ce.options.ghostClass:this.options.ghostClass, !1), Ee(h, this.options.chosenClass, !1), he({
			sortable:this,
			name:'unchoose',
			toEl:Q,
			newIndex:null,
			newDraggableIndex:null,
			originalEvent:e,
		}), B!==Q?(De>=0&&(he({
			rootEl:Q,
			name:'add',
			toEl:Q,
			fromEl:B,
			originalEvent:e,
		}), he({
			sortable:this,
			name:'remove',
			toEl:Q,
			originalEvent:e,
		}), he({
			rootEl:Q,
			name:'sort',
			toEl:Q,
			fromEl:B,
			originalEvent:e,
		}), he({
			sortable:this,
			name:'sort',
			toEl:Q,
			originalEvent:e,
		})), ce&&ce.save()):De!==dt&&De>=0&&(he({
			sortable:this,
			name:'update',
			toEl:Q,
			originalEvent:e,
		}), he({
			sortable:this,
			name:'sort',
			toEl:Q,
			originalEvent:e,
		})), D.active&&((De==null||De===-1)&&(De=dt, Ge=xt), he({
			sortable:this,
			name:'end',
			toEl:Q,
			originalEvent:e,
		}), this.save()))), this._nulling();
	},
	_nulling:function(){
		_e('nulling', this), B=h=Q=C=it=z=Rt=Ve=et=Ie=ht=De=Ge=dt=xt=nt=wt=ce=It=D.dragged=D.ghost=D.clone=D.active=null;const e=this.el;Bt.forEach(t =>{
			e.contains(t)&&(t.checked=!0);
		}), Bt.length=Mi=Ri=0;
	},
	handleEvent:function(e){
		switch(e.type){
		case'drop':case'dragend':this._onDrop(e);break;case'dragenter':case'dragover':h&&(this._onDragOver(e), Yr(e));break;case'selectstart':e.preventDefault();break;
		}
	},
	toArray:function(){
		for(var e=[], t, a=this.el.children, o=0, r=a.length, n=this.options;o<r;o++)t=a[o], Me(t, n.draggable, this.el, !1)&&e.push(t.getAttribute(n.dataIdAttr)||Vr(t));return e;
	},
	sort:function(e, t){
		const a={}, o=this.el;this.toArray().forEach(function(r, n){
			const u=o.children[n];Me(u, this.options.draggable, o, !1)&&(a[r]=u);
		}, this), t&&this.captureAnimationState(), e.forEach(r =>{
			a[r]&&(o.removeChild(a[r]), o.appendChild(a[r]));
		}), t&&this.animateAll();
	},
	save:function(){
		const e=this.options.store;e&&e.set&&e.set(this);
	},
	closest:function(e, t){
		return Me(e, t||this.options.draggable, this.el, !1);
	},
	option:function(e, t){
		const a=this.options;if(t===void 0)return a[e];const o=Tt.modifyOption(this, e, t);typeof o<'u'?a[e]=o:a[e]=t, e==='group'&&go(a);
	},
	destroy:function(){
		_e('destroy', this);let e=this.el;e[ye]=null, I(e, 'mousedown', this._onTapStart), I(e, 'touchstart', this._onTapStart), I(e, 'pointerdown', this._onTapStart), this.nativeDraggable&&(I(e, 'dragover', this), I(e, 'dragenter', this)), Array.prototype.forEach.call(e.querySelectorAll('[draggable]'), t =>{
			t.removeAttribute('draggable');
		}), this._onDrop(), this._disableDelayedDragEvents(), Yt.splice(Yt.indexOf(this.el), 1), this.el=e=null;
	},
	_hideClone:function(){
		if(!Ve){
			if(_e('hideClone', this), D.eventCanceled)return;E(z, 'display', 'none'), this.options.removeCloneOnHide&&z.parentNode&&z.parentNode.removeChild(z), Ve=!0;
		}
	},
	_showClone:function(e){
		if(e.lastPutMode!=='clone'){
			this._hideClone();return;
		}if(Ve){
			if(_e('showClone', this), D.eventCanceled)return;h.parentNode==B&&!this.options.group.revertClone?B.insertBefore(z, h):it?B.insertBefore(z, it):B.appendChild(z), this.options.group.revertClone&&this.animate(h, z), E(z, 'display', ''), Ve=!1;
		}
	},
};function Yr(i){
	i.dataTransfer&&(i.dataTransfer.dropEffect='move'), i.cancelable&&i.preventDefault();
}function qt(i, e, t, a, o, r, n, u){
	let f, p=i[ye], b=p.options.onMove, m;return window.CustomEvent&&!Ue&&!Dt?f=new CustomEvent('move', {
		bubbles:!0,
		cancelable:!0,
	}):(f=document.createEvent('Event'), f.initEvent('move', !0, !0)), f.to=e, f.from=i, f.dragged=t, f.draggedRect=a, f.related=o||e, f.relatedRect=r||ie(e), f.willInsertAfter=u, f.originalEvent=n, i.dispatchEvent(f), b&&(m=b.call(p, f, n)), m;
}function Li(i){
	i.draggable=!1;
}function Br(){
	Ui=!1;
}function Ur(i, e, t){
	const a=ie(ct(t.el, 0, t.options, !0)), o=mo(t.el, t.options, C), r=10;return e?i.clientX<o.left-r||i.clientY<a.top&&i.clientX<a.right:i.clientY<o.top-r||i.clientY<a.bottom&&i.clientX<a.left;
}function Wr(i, e, t){
	const a=ie(Qi(t.el, t.options.draggable)), o=mo(t.el, t.options, C), r=10;return e?i.clientX>o.right+r||i.clientY>a.bottom&&i.clientX>a.left:i.clientY>o.bottom+r||i.clientX>a.right&&i.clientY>a.top;
}function Gr(i, e, t, a, o, r, n, u){
	let f=a?i.clientY:i.clientX, p=a?t.height:t.width, b=a?t.top:t.left, m=a?t.bottom:t.right, y=!1;if(!n){
		if(u&&Ft<p*o){
			if(!Et&&(wt===1?f>b+p*r/2:f<m-p*r/2)&&(Et=!0), Et)y=!0;else if(wt===1?f<b+Ft:f>m-Ft)return-wt;
		}else if(f>b+p*(1-o)/2&&f<m-p*(1-o)/2){
			return zr(e);
		}
	}return y=y||n, y&&(f<b+p*r/2||f>m-p*r/2)?f>b+p/2?1:-1:0;
}function zr(i){
	return ke(h)<ke(i)?1:-1;
}function Vr(i){
	for(var e=i.tagName+i.className+i.src+i.href+i.textContent, t=e.length, a=0;t--;)a+=e.charCodeAt(t);return a.toString(36);
}function $r(i){
	Bt.length=0;for(let e=i.getElementsByTagName('input'), t=e.length;t--;){
		const a=e[t];a.checked&&Bt.push(a);
	}
}function Lt(i){
	return setTimeout(i, 0);
}function Wi(i){
	return clearTimeout(i);
}zt&&N(document, 'touchmove', i =>{
	(D.active||st)&&i.cancelable&&i.preventDefault();
});D.utils={
	on:N,
	off:I,
	css:E,
	find:uo,
	is:function(e, t){
		return!!Me(e, t, e, !1);
	},
	extend:Ir,
	throttle:co,
	closest:Me,
	toggleClass:Ee,
	clone:po,
	index:ke,
	nextTick:Lt,
	cancelNextTick:Wi,
	detectDirection:ho,
	getChild:ct,
	expando:ye,
};D.get=function(i){
	return i[ye];
};D.mount=function(){
	for(var i=arguments.length, e=new Array(i), t=0;t<i;t++)e[t]=arguments[t];e[0].constructor===Array&&(e=e[0]), e.forEach(a =>{
		if(!a.prototype||!a.prototype.constructor)throw'Sortable: Mounted plugin must be a constructor function, not '.concat({}.toString.call(a));a.utils&&(D.utils=je(je({}, D.utils), a.utils)), Tt.mount(a);
	});
};D.create=function(i, e){
	return new D(i, e);
};D.version=Or;let te=[], gt, Gi, zi=!1, ji, Xi, Ut, bt;function Qr(){
	function i(){
		this.defaults={
			scroll:!0,
			forceAutoScrollFallback:!1,
			scrollSensitivity:30,
			scrollSpeed:10,
			bubbleScroll:!0,
		};for(const e in this)e.charAt(0)==='_'&&typeof this[e]==='function'&&(this[e]=this[e].bind(this));
	}return i.prototype={
		dragStarted:function(t){
			const a=t.originalEvent;this.sortable.nativeDraggable?N(document, 'dragover', this._handleAutoScroll):this.options.supportPointer?N(document, 'pointermove', this._handleFallbackAutoScroll):a.touches?N(document, 'touchmove', this._handleFallbackAutoScroll):N(document, 'mousemove', this._handleFallbackAutoScroll);
		},
		dragOverCompleted:function(t){
			const a=t.originalEvent;!this.options.dragOverBubble&&!a.rootEl&&this._handleAutoScroll(a);
		},
		drop:function(){
			this.sortable.nativeDraggable?I(document, 'dragover', this._handleAutoScroll):(I(document, 'pointermove', this._handleFallbackAutoScroll), I(document, 'touchmove', this._handleFallbackAutoScroll), I(document, 'mousemove', this._handleFallbackAutoScroll)), io(), jt(), Nr();
		},
		nulling:function(){
			Ut=Gi=gt=zi=bt=ji=Xi=null, te.length=0;
		},
		_handleFallbackAutoScroll:function(t){
			this._handleAutoScroll(t, !0);
		},
		_handleAutoScroll:function(t, a){
			const o=this, r=(t.touches?t.touches[0]:t).clientX, n=(t.touches?t.touches[0]:t).clientY, u=document.elementFromPoint(r, n);if(Ut=t, a||this.options.forceAutoScrollFallback||Dt||Ue||_t){
				Hi(t, this.options, u, a);let f=$e(u, !0);zi&&(!bt||r!==ji||n!==Xi)&&(bt&&io(), bt=setInterval(() =>{
					const p=$e(document.elementFromPoint(r, n), !0);p!==f&&(f=p, jt()), Hi(t, o.options, p, a);
				}, 10), ji=r, Xi=n);
			}else{
				if(!this.options.bubbleScroll||$e(u, !0)===Le()){
					jt();return;
				}Hi(t, this.options, $e(u, !1), !1);
			}
		},
	}, Be(i, {
		pluginName:'scroll',
		initializeByDefault:!0,
	});
}function jt(){
	te.forEach(i =>{
		clearInterval(i.pid);
	}), te=[];
}function io(){
	clearInterval(bt);
}var Hi=co((i, e, t, a) =>{
		if(e.scroll){
			let o=(i.touches?i.touches[0]:i).clientX, r=(i.touches?i.touches[0]:i).clientY, n=e.scrollSensitivity, u=e.scrollSpeed, f=Le(), p=!1, b;Gi!==t&&(Gi=t, jt(), gt=e.scroll, b=e.scrollFn, gt===!0&&(gt=$e(t, !0)));let m=0, y=gt;do{
				let w=y, x=ie(w), S=x.top, U=x.bottom, K=x.left, q=x.right, V=x.width, j=x.height, re=void 0, X=void 0, ee=w.scrollWidth, ne=w.scrollHeight, W=E(w), R=w.scrollLeft, ae=w.scrollTop;w===f?(re=V<ee&&(W.overflowX==='auto'||W.overflowX==='scroll'||W.overflowX==='visible'), X=j<ne&&(W.overflowY==='auto'||W.overflowY==='scroll'||W.overflowY==='visible')):(re=V<ee&&(W.overflowX==='auto'||W.overflowX==='scroll'), X=j<ne&&(W.overflowY==='auto'||W.overflowY==='scroll'));const A=re&&(Math.abs(q-o)<=n&&R+V<ee)-(Math.abs(K-o)<=n&&!!R), $=X&&(Math.abs(U-r)<=n&&ae+j<ne)-(Math.abs(S-r)<=n&&!!ae);if(!te[m])for(let xe=0;xe<=m;xe++)te[xe]||(te[xe]={});(te[m].vx!=A||te[m].vy!=$||te[m].el!==w)&&(te[m].el=w, te[m].vx=A, te[m].vy=$, clearInterval(te[m].pid), (A!=0||$!=0)&&(p=!0, te[m].pid=setInterval((function(){
					a&&this.layer===0&&D.active._onTouchMove(Ut);const Te=te[this.layer].vy?te[this.layer].vy*u:0, me=te[this.layer].vx?te[this.layer].vx*u:0;typeof b==='function'&&b.call(D.dragged.parentNode[ye], me, Te, i, Ut, te[this.layer].el)!=='continue'||fo(te[this.layer].el, me, Te);
				}).bind({ layer:m }), 24))), m++;
			}while(e.bubbleScroll&&y!==f&&(y=$e(y, !1)));zi=p;
		}
	}, 30), yo=function(e){
		const t=e.originalEvent, a=e.putSortable, o=e.dragEl, r=e.activeSortable, n=e.dispatchSortableEvent, u=e.hideGhostForTarget, f=e.unhideGhostForTarget;if(t){
			const p=a||r;u();const b=t.changedTouches&&t.changedTouches.length?t.changedTouches[0]:t, m=document.elementFromPoint(b.clientX, b.clientY);f(), p&&!p.el.contains(m)&&(n('spill'), this.onSpill({
				dragEl:o,
				putSortable:a,
			}));
		}
	};function Ji(){}Ji.prototype={
	startIndex:null,
	dragStart:function(e){
		const t=e.oldDraggableIndex;this.startIndex=t;
	},
	onSpill:function(e){
		const t=e.dragEl, a=e.putSortable;this.sortable.captureAnimationState(), a&&a.captureAnimationState();const o=ct(this.sortable.el, this.startIndex, this.options);o?this.sortable.el.insertBefore(t, o):this.sortable.el.appendChild(t), this.sortable.animateAll(), a&&a.animateAll();
	},
	drop:yo,
};Be(Ji, { pluginName:'revertOnSpill' });function Ki(){}Ki.prototype={
	onSpill:function(e){
		const t=e.dragEl, a=e.putSortable, o=a||this.sortable;o.captureAnimationState(), t.parentNode&&t.parentNode.removeChild(t), o.animateAll();
	},
	drop:yo,
};Be(Ki, { pluginName:'removeOnSpill' });D.mount(new Qr);D.mount(Ki, Ji);const Jr=O('<div><label class="font-medium">Label <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The title of the question"></i> <input type="text" class="input form-input text-sm" required="" maxlength="45"/></label></div> <div><label class="font-medium">Maximum length <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The maximum input length"></i> <input type="number" class="input form-input text-sm" required="" min="1" max="1000"/></label></div> <div><label class="font-medium">Minimum length <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The minimum input length"></i> <input type="number" class="input form-input text-sm" required="" min="0" max="1000"/></label></div> <div><label class="font-medium">Placeholder <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The placeholder value, such as a hint"></i> <input type="text" class="input form-input text-sm" maxlength="100"/></label></div> <div><label for="required" class="font-medium">Required <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Require input?"></i> <input type="checkbox" id="required" name="required" class="form-checkbox"/></label></div> <div><label class="font-medium">Style <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How big should the input box be?"></i> <select class="input form-multiselect" required=""><option class="p-1">Short (single-line)</option><option class="p-1">Long (multi-line)</option></select></label></div> <div><label class="font-medium">Value <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="A pre-filled value"></i> <textarea class="input form-input text-sm" maxlength="1000"></textarea></label></div>', 1);function Kr(i, e){
	Wt(e, !0);const t=ro(e, 'question', 15);const a=Jr(), o=ge(a), r=d(o), n=c(d(r));qe(n);const u=c(n, 4);Z(u), s(r), s(o);const f=c(o, 2), p=d(f), b=c(d(p), 3);Z(b), s(p), s(f);const m=c(f, 2), y=d(m), w=c(d(y), 3);Z(w), s(y), s(m);const x=c(m, 2), S=d(x), U=c(d(S), 3);Z(U), s(S), s(x);const K=c(x, 2), q=d(K), V=c(d(q), 3);Z(V), s(q), s(K);const j=c(K, 2), re=d(j), X=c(d(re), 3), ee=d(X);ee.value=ee.__value=1;const ne=c(ee);ne.value=ne.__value=2, s(X), s(re), s(j);const W=c(j, 2), R=d(W), ae=c(d(R), 3);oo(ae), s(R), s(W), de(u, ()=>t().label, A=>t(t().label=A, !0)), de(b, ()=>t().maxLength, A=>t(t().maxLength=A, !0)), de(w, ()=>t().minLength, A=>t(t().minLength=A, !0)), de(U, ()=>t().placeholder, A=>t(t().placeholder=A, !0)), vt(V, ()=>t().required, A=>t(t().required=A, !0)), Fe(X, ()=>t().style, A=>t(t().style=A, !0)), de(ae, ()=>t().value, A=>t(t().value=A, !0)), T(i, a), Gt();
}const Zr=O('<li> </li>'), en=O('<div><label class="font-medium">Label <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The title of the question"></i> <input type="text" class="input form-input text-sm" required="" maxlength="45"/></label></div> <div><label class="font-medium">Maximum values <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How many choices can be selected?"></i> <input type="number" class="input form-input text-sm" required="" min="1" max="25"/></label></div> <div><label class="font-medium">Minimum values <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The minimum number of select choices"></i> <input type="number" class="input form-input text-sm" default="1" required="" min="0" max="25"/></label></div> <div><div class="font-medium"> <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The options that members can choose from"></i> <button type="button" class="rounded-lg px-2 font-medium text-yellow-500 transition duration-300 hover:text-yellow-300 disabled:cursor-not-allowed dark:text-yellow-500 dark:hover:text-yellow-500/50"><i class="fa-solid fa-pencil"></i> Edit</button></div> <div><ul class="list-inside list-disc"></ul></div></div> <div><div><label class="font-medium">Placeholder <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The placeholder (label)"></i> <input type="text" class="input form-input text-sm" maxlength="150"/></label></div></div>', 1);function tn(i, e){
	Wt(e, !0);let t=ro(e, 'question', 15), a=t()._maxLength;t(t().maxLength={
		get maxLength(){
			return a;
		},
		set maxLength(R){
			a=Math.min(25, R);
		},
	}, !0);const o=en(), r=ge(o), n=d(r), u=c(d(n));qe(u);const f=c(u, 4);Z(f), s(n), s(r);const p=c(r, 2), b=d(p), m=c(d(b), 3);Z(m), s(b), s(p);const y=c(p, 2), w=d(y), x=c(d(w), 3);Z(x), s(w), s(y);const S=c(y, 2), U=d(S), K=d(U), q=c(K);qe(q);const V=c(q, 4);s(U);const j=c(U, 2), re=d(j);Ne(re, 21, ()=>t().options, Pe, (R, ae)=>{
		const A=Zr(), $=d(A, !0);s(A), M(()=>oe($, g(ae).label)), T(R, A);
	}), s(re), s(j), s(S);const X=c(S, 2), ee=d(X), ne=d(ee), W=c(d(ne), 3);Z(W), s(ne), s(ee), s(X), M(()=>oe(K, `Options (${t().options.length??''}/25) `)), de(f, ()=>t().label, R=>t(t().label=R, !0)), de(m, ()=>t().maxLength, R=>t(t().maxLength=R, !0)), de(x, ()=>t().minLength, R=>t(t().minLength=R, !0)), at('click', V, ()=>mr.open(OptionsModal, { id:t().id })), de(W, ()=>t().placeholder, R=>t(t().placeholder=R, !0)), T(i, o), Gt();
}Vi(['click']);const an=O('<i class="fa-solid fa-spinner animate-spin"></i>'), on=O('<i class="fa-solid fa-xmark"></i>'), rn=O('<div class="my-4 text-sm"><div class="grid grid-cols-1 gap-3"><div><label class="font-medium">Type <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What type of input should the question use?"></i> <select class="input form-multiselect text-sm" required=""><option class="p-1" default="" disabled="">Select an input type</option><option class="p-1">Text</option><option class="p-1" disabled="" title="Disabled until supported by Discord">Select menu</option></select></label></div> <!></div></div>'), nn=O('<div class="list-group-item rounded-xl bg-gray-100/50 p-4 dark:bg-slate-800/50"><div class="w-full"><div class="flex items-center gap-2 md:gap-4"><i class="handle fa-solid fa-grip-vertical cursor-move text-gray-500 dark:text-slate-400"></i> <div class="w-full"> <button type="button" class="text-red-300 transition duration-300 hover:text-red-500 disabled:cursor-not-allowed dark:text-red-500/50 dark:hover:text-red-500" title="Remove"><!></button> <button type="button" class="flex w-full cursor-pointer select-none justify-between font-medium text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"><span class="text-sm"> </span> <i></i></button></div></div> <!></div></div>'), ln=O('<div class="list-group flex flex-col gap-2"></div>');function sn(i, e){
	Wt(e, !0);const t=()=>fr(pr, '$page', a), [a, o]=cr();const r=ze(lt({})), n=ze(null), u=ze(void 0);ao(()=>{
		D.create(g(u), {
			animation:300,
			handle:'.handle',
			dragClass:'dragged',
			swapThreshold:.5,
			dataIdAttr:'data-id',
			store:{
				get:()=>J.questions.sort((m, y)=>m.order-y.order),
				set:b=>{
					b.toArray().forEach((y, w)=>J.questions.find(x=>x.id===y).order=w);
				},
			},
		});
	});const f=async b=>{
		if(b._real!==!1){
			if(!confirm('Are you sure? This will delete all responses.'))return!1;g(r)[b.id]=!0;const w=`/api/admin/guilds/${t().params.guild}/categories/${t().params.category}/questions/${b.id}`, x=await fetch(w, {
				credentials:'include',
				method:'DELETE',
			});if(g(r)[b.id]=!1, !x.ok){
				const S=await x.json();console.log(S);return;
			}
		}const m=J.questions.findIndex(y=>b.id===y.id);J.questions.splice(m, 1), Se(r, !1);
	};const p=ln();Ne(p, 21, ()=>J.questions, Pe, (b, m, y)=>{
		const w=nn(), x=d(w), S=d(x), U=c(d(S), 2), K=d(U), q=c(K), V=d(q);{ const j=A=>{
				const $=an();T(A, $);
			}, re=A=>{
				const $=on();T(A, $);
			};L(V, A=>{
			g(r)[g(m).id]?A(j):A(re, !1);
		}); }s(q);const X=c(q, 2), ee=d(X), ne=d(ee);s(ee);const W=c(ee, 2);s(X), s(U), s(S);const R=c(S, 2);{ const ae=A=>{
			const $=rn(), xe=d($), Te=d(xe), me=d(Te), Ce=c(d(me));qe(Ce);const we=c(Ce, 4), Qe=d(we);Qe.value=(Qe.__value=null)??'';const Xe=c(Qe);Xe.value=Xe.__value='TEXT';const Je=c(Xe);Je.value=Je.__value='MENU', s(we), s(me), s(Te);const ft=c(Te, 2);{ const pt=Oe=>{
					Kr(Oe, {
						get question(){
							return J.questions[y];
						},
						set question(Ke){
							J.questions[y]=Ke;
						},
					});
				}, St=Oe=>{
					tn(Oe, {
						get question(){
							return J.questions[y];
						},
						set question(Ke){
							J.questions[y]=Ke;
						},
					});
				};L(ft, Oe=>{
				g(m).type==='TEXT'?Oe(pt):g(m).type==='MENU'&&Oe(St, 1);
			}); }s(xe), s($), at('change', we, ()=>{
				g(m).type==='TEXT'?g(m).maxLength=1e3:g(m).type==='MENU'&&(g(m).maxLength=1);
			}), Fe(we, ()=>g(m).type, Oe=>g(m).type=Oe), T(A, $);
		};L(R, A=>{
			g(n)===g(m).id&&A(ae);
		}); }s(x), s(w), M(()=>{
			Yi(w, 'data-id', g(m).id), oe(K, `${g(m).label??''} `), q.disabled=g(r)[g(m).id], oe(ne, `Click to ${g(n)===g(m).id?'collapse':'expand'}`), Mt(W, 1, `fa-solid ${g(n)===g(m).id?'fa-angle-up':'fa-angle-down'} self-end text-xl`);
		}), at('click', q, ()=>f(g(m))), at('click', X, ()=>Se(n, g(n)===g(m).id?null:g(m).id, !0)), T(b, w);
	}), s(p), ur(p, b=>Se(u, b), ()=>g(u)), T(i, p), Gt(), o();
}Vi(['click', 'change']);const dn=O('<p class="mb-1 mt-2 text-sm font-semibold">Preview</p> <div class="block w-full break-words rounded-md bg-blurple/20 p-3 font-mono text-sm shadow-sm dark:bg-blurple/20"><i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400"></i> <span class="marked"><!></span></div>', 1), un=O('<option> </option> <hr/>', 1), cn=O('<option class="p-1"> </option>'), fn=O('<!><!>', 1), pn=O('<option class="p-1"> </option>'), mn=O('<option class="p-1"> </option>'), vn=O('<option class="p-1">None</option><hr/><!>', 1), hn=O('<label class="font-medium">Backup Category <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Alternative category to use when primary is full"></i> <select class="input form-multiselect"><!></select></label>'), gn=O('<label class="font-medium opacity-50 cursor-not-allowed">Backup Category <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Not available for Thread or Forum modes"></i> <select class="input form-multiselect opacity-50 cursor-not-allowed" disabled=""><option>Not available for this mode</option></select></label>'), bn=O('<!> <discord-mention> </discord-mention>', 3), _n=O('<!> , <br/>', 1), yn=O('<discord-embed-fields><discord-embed-field>This is a pretty good preview</discord-embed-field></discord-embed-fields>', 2), xn=O('<discord-embed-footer> </discord-embed-footer>', 2), wn=O('<discord-button>✏️ Edit</discord-button>', 2), En=O('<discord-button>🙌 Claim</discord-button>', 2), Dn=O('<discord-button>✖️ Close</discord-button>', 2), Tn=O('<p class="mb-1 mt-2 text-sm font-semibold">Preview</p> <discord-messages><discord-message><!> <discord-mention> </discord-mention> has created a new ticket <discord-embed><discord-embed-description><!></discord-embed-description> <!> <!></discord-embed> <discord-attachments><discord-action-row><!> <!> <!></discord-action-row></discord-attachments></discord-message></discord-messages>', 3), Sn=O('<option class="m-1 rounded p-1"> </option>'), kn=O('<option class="p-1"> </option>'), Cn=O('<option class="m-1 rounded p-1"> </option>'), On=O('<option class="m-1 rounded p-1"> </option>'), An=O('<div><label class="font-medium">Total limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The total number of tickets that can be open at once."></i> <input type="number" min="1" max="50" class="input form-input"/></label></div>'), In=O('<div><label class="font-medium opacity-50 cursor-not-allowed">Total limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Not available for Thread or Forum modes"></i> <input type="number" disabled="" class="input form-input opacity-50 cursor-not-allowed" placeholder="Not available for this mode"/></label></div>'), Nn=O('<option class="p-1"> </option>'), Pn=O('<option class="p-1">None</option><hr/><!>', 1), qn=O('<div><label class="font-medium">Custom topic <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which question\'s value should be used as the ticket topic?"></i> <select class="input form-multiselect font-normal"><!></select></label></div>'), Mn=O('<div class="text-center"><button type="button" class="rounded-lg p-2 px-5 font-medium text-green-500 transition duration-300 hover:text-green-300 disabled:cursor-not-allowed dark:text-green-500 dark:hover:text-green-500/50"><i class="fa-solid fa-circle-plus"></i> Add</button></div>'), Rn=O('<i class="fa-solid fa-spinner animate-spin"></i>'), Fn=O('<i class="fa-solid fa-trash"></i>'), Ln=O('<button type="button" class="mt-4 rounded-lg bg-red-300 p-2 px-5 font-medium transition duration-300 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white"><!> Delete</button>'), jn=O('<i class="fa-solid fa-spinner animate-spin"></i>'), Xn=O('<div class="mb-8 text-center text-orange-600 dark:text-orange-400"><p><i class="fa-solid fa-triangle-exclamation"></i> <a href="https://discordtickets.app/configuration/categories" class="font-semibold hover:underline">Read the documentation</a> to avoid problems.</p></div> <h1 class="m-4 text-center text-4xl font-bold">Categories</h1> <h2 class="m-4 text-center text-2xl font-semibold text-gray-500 dark:text-slate-400"> </h2> <div class="m-2 mx-auto max-w-5xl p-4 text-lg"><!> <form class="my-4"><div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-12"><div class="grid grid-cols-1 gap-8"><div><label class="font-medium">Name <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The name of the category"></i> <input type="text" class="input form-input" required=""/></label></div> <div><label class="font-medium">Channel name <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The name of ticket channels"></i> <input type="text" class="input form-input"/></label> <!></div> <div><label for="claiming" class="font-medium">Claiming <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Allow staff to claim tickets?"></i> <input type="checkbox" id="claiming" name="claiming" class="form-checkbox"/></label></div> <div><label for="autoAssign" class="font-medium">Auto-assign <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Automatically assign the ticket to the first staff member who responds?"></i> <input type="checkbox" id="autoAssign" name="autoAssign" class="form-checkbox"/></label></div> <div><label class="font-medium">Cooldown <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How long should members have to wait before creating another ticket?"></i> <input type="text" class="input form-input"/></label></div> <div><label class="font-medium">Description <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What is this category for?"></i> <input type="text" class="input form-input" required=""/></label></div> <div><label class="font-medium"><!> <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"></i> <select class="input form-multiselect" required=""><!></select></label></div> <div><label class="font-medium">Channel Mode <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How should ticket channels be created?"></i> <select class="input form-multiselect"></select></label></div> <div><!></div> <div><label class="font-medium">Emoji <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Emoji used for buttons &amp; dropdowns"></i> <span class="text-2xl"> </span> <input type="text" class="input form-input" required=""/></label></div> <div><label for="enableFeedback" class="font-medium">Feedback <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Gather feedback from members?"></i> <input type="checkbox" id="enableFeedback" name="enableFeedback" class="form-checkbox"/></label></div> <div><label class="font-medium">Image <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="A link to an image to be sent with the opening message."></i> <input type="url" class="input form-input"/></label></div> <div><label class="font-medium">Member limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How many tickets in this category can each member have open?"></i> <input type="number" min="1" max="10" class="input form-input"/></label></div> <div><label class="font-medium">Opening message <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Content to be sent in the opening message of each ticket."></i> <textarea class="input form-input" required="" rows="4" maxlength="1000"></textarea></label> <!></div> <div><label class="font-medium">Ping roles <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that should be pinged upon ticket creation."></i> <select multiple="" class="input form-multiselect h-44 font-normal"></select></label></div> <div><label class="font-medium">Slow mode <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Should slow mode be enabled?"></i> <select class="input form-multiselect font-normal"><option class="p-1">Off</option><!></select></label></div> <div><label class="font-medium">Required roles <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that a user needs to create a ticket."></i> <select multiple="" class="input form-multiselect h-44 font-normal"></select></label></div> <div><label for="requireTopic" class="font-medium">Require topic <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Require a topic before ticket creation?"></i> <input type="checkbox" id="requireTopic" name="requireTopic" class="form-checkbox"/></label></div> <div><label class="font-medium">Staff roles <!> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that will be able to view tickets."></i> <select multiple="" required="" class="input form-multiselect h-44 font-normal"></select></label></div> <!></div> <div><div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="flex flex-col gap-4"><div class="text-center"><h3 class="text-xl font-bold">Questions</h3> <p class="text-gray-500 dark:text-slate-400"> </p></div> <!> <div><!></div> <!></div></div> <div class="flex justify-end gap-4"><!> <button type="submit" class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white"><!> Submit</button></div></div></div></form></div>', 1);function gl(i, e){
	Wt(e, !0);const t=ze(!1);vr(l=>{
		g(t)&&!confirm('You have unsaved changes; are you sure you want to leave?')&&l.cancel();
	}), ao(async()=>{
		const{
			applyPolyfills:l, defineCustomElements:v,
		}=await ir(async()=>{
			const{
				applyPolyfills:_, defineCustomElements:k,
			}=await import('../chunks/D2-oBDD7.js').then(P=>P.i);return{
				applyPolyfills:_,
				defineCustomElements:k,
			};
		}, __vite__mapDeps([0, 1]), import.meta.url);l().then(()=>{
			v();
		}), window.addEventListener('beforeunload', _=>{
			g(t)&&(_.preventDefault(), _.returnValue='');
		});
	});const a=e.data, o=lt(a.category), r=lt(a.channels), n=ze(lt(a.roles)), u=lt(a.categories), f=lt(a.url);const p=['5s', '10s', '15s', '30s', '1m', '2m', '5m', '10m', '15m', '30m', '1h', '2h', '6h'], b=[{
		value:'CHANNEL',
		label:'Channel (Default)',
	}, {
		value:'THREAD',
		label:'Thread (in category channel)',
	}, {
		value:'FORUM',
		label:'Forum Channel',
	}];J.questions=o.questions;const m=ki(()=>o.channelMode==='FORUM'?r.filter(l=>l.type===15):o.channelMode==='THREAD'?r.filter(l=>l.type===0):r.filter(l=>l.type===4));Se(n, g(n).filter(l=>l.name!=='@everyone').sort((l, v)=>v.rawPosition-l.rawPosition), !0), g(n).forEach(l=>{
		l._hexColor=l.color>0?`#${l.color.toString(16).padStart(6, '0')}`:null, l._style=l._hexColor?`color: ${l._hexColor}`:'';
	}), o.cooldown=o.cooldown?Ii(o.cooldown):'';const y=ze(null), w=ze(!1), x=ze(!1);const S=async()=>{
			try{
				Se(w, !0);const l={ ...o };if(o.discordCategory==='new'&&(l.discordCategory=null), l.cooldown=o.cooldown?Ii(o.cooldown):null, (l.channelMode==='THREAD'||l.channelMode==='FORUM')&&(l.totalLimit=null), l.name.length>30)throw new Error(`The name is too long (${l.name.length}>30).`);if(l.description.length>100)throw new Error(`The description is too long (${l.description.length}>100).`);l.questions=J.questions.map(k=>{
					if(k.type==='TEXT'){
						if(k.value.length>0&&k.value.length<k.minLength)throw`The value of the "${k.label}" question is shorter than the minimum length.`;if(k.value.length>k.maxLength)throw`The value of the "${k.label}" question is longer than the maximum length.`;
					}return delete k._real, k;
				}), l.questions.find(k=>k.id===l.customTopic)===void 0&&(l.customTopic=null);const v=await fetch(f, {
						method:o.id?'PATCH':'POST',
						body:JSON.stringify(l),
						credentials:'include',
						headers:{ 'Content-Type':'application/json; charset=UTF-8' },
					}), _=await v.json();if(v.ok)Se(t, !1), window.location='./';else throw _;
			}catch(l){
				Se(w, !1), Se(y, l, !0), window.scroll({
					top:0,
					behavior:'smooth',
				});
			}
		}, U=async()=>{
			try{
				if(!confirm(`Are you sure?
This will delete all associated tickets (including messages, feedback, etc).`))return!1;Se(x, !0);const v=await fetch(f, {
						method:'DELETE',
						credentials:'include',
					}), _=await v.json();if(v.ok)window.location='./';else throw _;
			}catch(l){
				Se(x, !1), Se(y, l, !0), window.scroll({
					top:0,
					behavior:'smooth',
				});
			}
		}, K=l=>g(n).find(v=>v.id===l);Ua(()=>{
		o.customTopic=J.questions.find(l=>l.id===o.customTopic)?o.customTopic:null;
	}), Ua(()=>{
		o.requireTopic=J.questions.length>0?!1:o.requireTopic;
	});const q=Xn(), V=c(ge(q), 4), j=d(V);s(V);const re=c(V, 2), X=d(re);{ const ee=l=>{
		hr(l, {
			get error(){
				return g(y);
			},
		});
	};L(X, l=>{
		g(y)&&l(ee);
	}); }const ne=c(X, 2), W=ki(()=>dr(()=>S())), R=d(ne), ae=d(R), A=d(ae), $=d(A), xe=c(d($));qe(xe);const Te=c(xe, 4);Z(Te), s($), s(A);const me=c(A, 2), Ce=d(me), we=c(d(Ce));{ const Qe=l=>{
		qe(l);
	};L(we, l=>{
		o.id&&l(Qe);
	}); }const Xe=c(we, 4);Z(Xe), Yi(Xe, 'placeholder', 'ticket-{num}'), s(Ce);const Je=c(Ce, 2);{ const ft=l=>{
		const v=dn(), _=c(ge(v), 2), k=c(d(_), 2), P=d(k);Ba(P, ()=>Wa.parse(o.channelName.replace(/\n/g, `

`)).replace(/{+\s?num(ber)?\s?}+/gi, 1).replace(/{+\s?(nick|display)(name)?\s?}+/gi, Ya('user').username).replace(/{+\s?(user)?name\s?}+/gi, Ya('user').username)), s(k), s(_), T(l, v);
	};L(Je, l=>{
		o.channelName&&l(ft);
	}); }s(me);const pt=c(me, 2), St=d(pt), Oe=c(d(St), 3);Z(Oe), s(St), s(pt);const Ke=c(pt, 2), Zi=d(Ke), ea=c(d(Zi), 3);Z(ea), s(Zi), s(Ke);const Vt=c(Ke, 2), ta=d(Vt), ia=c(d(ta), 3);Z(ia), s(ta), s(Vt);const $t=c(Vt, 2), aa=d($t), oa=c(d(aa));qe(oa);const ra=c(oa, 4);Z(ra), s(aa), s($t);const Qt=c($t, 2), na=d(Qt), la=d(na);{ const xo=l=>{
			const v=Ci('Discord forum channel');T(l, v);
		}, wo=l=>{
			const v=Ci('Discord category');T(l, v);
		};L(la, l=>{
		o.channelMode==='FORUM'?l(xo):l(wo, !1);
	}); }const sa=c(la, 2);qe(sa);const da=c(sa, 2), Jt=c(da, 2);Oi(Jt, ()=>{
		const l=d(Jt), v=fn(), _=ge(v);{ const k=H=>{
			const le=un(), se=ge(le), be=d(se);s(se), se.value=se.__value='new', Ct(2), M(()=>oe(be, `Create a new ${o.channelMode==='FORUM'?'forum':'category'}`)), T(H, le);
		};L(_, H=>{
			(!o.discordCategory||o.discordCategory==='new')&&H(k);
		}); }const P=c(_);Ne(P, 17, ()=>g(m), Pe, (H, le)=>{
			const se=cn(), be=d(se, !0);s(se);let ve={};M(()=>{
				oe(be, g(le).name), ve!==(ve=g(le).id)&&(se.value=(se.__value=g(le).id)??'');
			}), T(H, se);
		}), T(l, v);
	}), s(na), s(Qt);const Kt=c(Qt, 2), ua=d(Kt), Zt=c(d(ua), 3);Ne(Zt, 21, ()=>b, Pe, (l, v)=>{
		const _=pn(), k=d(_, !0);s(_);let P={};M(()=>{
			oe(k, g(v).label), P!==(P=g(v).value)&&(_.value=(_.__value=g(v).value)??'');
		}), T(l, _);
	}), s(Zt), s(ua), s(Kt);const ei=c(Kt, 2), Eo=d(ei);{ const Do=l=>{
			const v=hn(), _=c(d(v), 3);Oi(_, ()=>{
				const k=d(_), P=vn(), H=ge(P);H.value=(H.__value=null)??'';const le=c(H, 2);Ne(le, 17, ()=>u, Pe, (se, be)=>{
					const ve=Ot(), fe=ge(ve);{ const ot=We=>{
						const Re=mn(), Ei=d(Re);s(Re);let Ae={};M(Ze=>{
							oe(Ei, `${Ze??''} ${g(be).name??''}`), Ae!==(Ae=g(be).id)&&(Re.value=(Re.__value=g(be).id)??'');
						}, [()=>Ni.get(g(be).emoji)??'']), T(We, Re);
					};L(fe, We=>{
						g(be).id!==o.id&&We(ot);
					}); }T(se, ve);
				}), T(k, P);
			}), s(v), Fe(_, ()=>o.backupCategoryId, k=>o.backupCategoryId=k), T(l, v);
		}, To=l=>{
			const v=gn();T(l, v);
		};L(Eo, l=>{
		o.channelMode==='CHANNEL'?l(Do):l(To, !1);
	}); }s(ei);const ti=c(ei, 2), ca=d(ti), fa=c(d(ca));qe(fa);const ii=c(fa, 4), So=d(ii, !0);s(ii);const pa=c(ii, 2);Z(pa), s(ca), s(ti);const ai=c(ti, 2), ma=d(ai), va=c(d(ma), 3);Z(va), s(ma), s(ai);const oi=c(ai, 2), ha=d(oi), ga=c(d(ha), 3);Z(ga), s(ha), s(oi);const ri=c(oi, 2), ba=d(ri), _a=c(d(ba), 3);Z(_a), s(ba), s(ri);const ni=c(ri, 2), li=d(ni), ya=c(d(li));qe(ya);const xa=c(ya, 4);oo(xa), s(li);const ko=c(li, 2);Ga(ko, ()=>o.pingRoles, l=>{
		const v=Ot(), _=ge(v);Ga(_, ()=>o.requireTopic, k=>{
			const P=Ot(), H=ge(P);{ const le=se=>{
				const be=Tn(), ve=c(ge(be), 2);Y(ve, 'no-background', !0), M(()=>Y(ve, 'light-theme', e.data.theme!=='dark')), Mt(ve, 1, 'bloc w-full border-0');const fe=d(ve);M(()=>Y(fe, 'author', e.data.client.username)), M(()=>Y(fe, 'avatar', e.data.client.avatar)), Y(fe, 'bot', !0), M(()=>Y(fe, 'timestamp', `Today at ${new Date().toLocaleTimeString('default', {
					hour:'numeric',
					minute:'numeric',
				})}`)), Mt(fe, 1, 'py-2'), Y(fe, 'highlight', !0);const ot=d(fe);{ const We=G=>{
					const F=_n(), mt=ge(F);Ne(mt, 17, ()=>o.pingRoles, Pe, (Vo, $o, Qo)=>{
						const Ti=ki(()=>K(g($o)));const La=Ot(), Jo=ge(La);{ const Ko=Si=>{
							const ja=bn(), Xa=ge(ja);{ const Zo=He=>{
								const Ha=Ci();Ha.nodeValue=' ', T(He, Ha);
							};L(Xa, He=>{
								Qo>0&&He(Zo);
							}); }const kt=c(Xa, 2);M(()=>{
								let He;return Y(kt, 'color', (He=g(Ti))==null?void 0:He._hexColor);
							}), Y(kt, 'type', 'role');const er=d(kt, !0);s(kt), M(()=>{
								let He;return oe(er, (He=g(Ti))==null?void 0:He.name);
							}), T(Si, ja);
						};L(Jo, Si=>{
							g(Ti)&&Si(Ko);
						}); }T(Vo, La);
					}), Ct(2), T(G, F);
				};L(ot, G=>{
					let F;((F=o.pingRoles)==null?void 0:F.length)>0&&G(We);
				}); }const Re=c(ot, 2);Y(Re, 'highlight', !0);const Ei=d(Re, !0);s(Re);const Ae=c(Re, 2);Y(Ae, 'slot', 'embeds'), M(()=>Y(Ae, 'color', e.data.settings.primaryColour)), M(()=>Y(Ae, 'author-image', `https://cdn.discordapp.com/avatars/${e.data.user.id}/${e.data.user.avatar}.webp`)), M(()=>Y(Ae, 'author-name', e.data.user.username)), M(()=>Y(Ae, 'image', o.image));const Ze=d(Ae);Y(Ze, 'slot', 'description'), Mt(Ze, 1, 'break-words prose prose-slate prose-sm dark:prose-invert prose-a:text-blurple');const Xo=d(Ze);Ba(Xo, ()=>Wa.parse(o.openingMessage).replace(/{+\s?(user)?name\s?}+/gi, `<discord-mention>${e.data.user.username}</discord-mention>`).replace(/{+\s?avgResponseTime\s?}+/gi, e.data.guild.stats.avgResponseTime).replace(/{+\s?avgResolutionTime\s?}+/gi, e.data.guild.stats.avgResolutionTime)), s(Ze);const qa=c(Ze, 2);{ const Ho=G=>{
					const F=yn();Y(F, 'slot', 'fields');const mt=d(F);Y(mt, 'field-title', 'Topic'), s(F), T(G, F);
				};L(qa, G=>{
					o.requireTopic&&G(Ho);
				}); }const Yo=c(qa, 2);{ const Bo=G=>{
					const F=xn();Y(F, 'slot', 'footer'), M(()=>Y(F, 'footer-image', e.data.client.avatar));const mt=d(F, !0);s(F), M(()=>oe(mt, e.data.settings.footer)), T(G, F);
				};L(Yo, G=>{
					e.data.settings.footer&&G(Bo);
				}); }s(Ae);const Di=c(Ae, 2);Y(Di, 'slot', 'components');const Ma=d(Di), Ra=d(Ma);{ const Uo=G=>{
					const F=wn();Y(F, 'type', 'secondary'), T(G, F);
				};L(Ra, G=>{
					(o.requireTopic||J.questions.length>0)&&G(Uo);
				}); }const Fa=c(Ra, 2);{ const Wo=G=>{
					const F=En();Y(F, 'type', 'secondary'), T(G, F);
				};L(Fa, G=>{
					o.claiming&&e.data.settings.claimButton&&G(Wo);
				}); }const Go=c(Fa, 2);{ const zo=G=>{
					const F=Dn();Y(F, 'type', 'destructive'), T(G, F);
				};L(Go, G=>{
					e.data.settings.closeButton&&G(zo);
				}); }s(Ma), s(Di), s(fe), s(ve), M(()=>oe(Ei, e.data.user.username)), T(se, be);
			};L(H, se=>{
				o.openingMessage&&se(le);
			}); }T(k, P);
		}), T(l, v);
	}), s(ni);const si=c(ni, 2), wa=d(si), di=c(d(wa), 3);Ne(di, 21, ()=>g(n), Pe, (l, v)=>{
		const _=Sn(), k=d(_);s(_);let P={};M(()=>{
			Ai(_, g(v)._style), oe(k, `${(g(v).unicodeEmoji||'')??''}
									${g(v).name??''}`), P!==(P=g(v).id)&&(_.value=(_.__value=g(v).id)??'');
		}), T(l, _);
	}), s(di), s(wa), s(si);const ui=c(si, 2), Ea=d(ui), ci=c(d(Ea), 3), fi=d(ci);fi.value=(fi.__value=null)??'';const Co=c(fi);Ne(Co, 17, ()=>p, Pe, (l, v)=>{
		const _=kn(), k=d(_, !0);s(_);let P={};M(H=>{
			oe(k, g(v)), P!==(P=H)&&(_.value=(_.__value=H)??'');
		}, [()=>Ii(g(v))/1e3]), T(l, _);
	}), s(ci), s(Ea), s(ui);const pi=c(ui, 2), Da=d(pi), mi=c(d(Da), 3);Ne(mi, 21, ()=>g(n), Pe, (l, v)=>{
		const _=Cn(), k=d(_);s(_);let P={};M(()=>{
			Ai(_, g(v)._style), oe(k, `${(g(v).unicodeEmoji||'')??''}
									${g(v).name??''}`), P!==(P=g(v).id)&&(_.value=(_.__value=g(v).id)??'');
		}), T(l, _);
	}), s(mi), s(Da), s(pi);const vi=c(pi, 2), Ta=d(vi), hi=c(d(Ta), 3);Z(hi), s(Ta), s(vi);const gi=c(vi, 2), Sa=d(gi), ka=c(d(Sa));qe(ka);const bi=c(ka, 4);Ne(bi, 21, ()=>g(n), Pe, (l, v)=>{
		const _=On(), k=d(_);s(_);let P={};M(()=>{
			Ai(_, g(v)._style), oe(k, `${(g(v).unicodeEmoji||'')??''}
									${g(v).name??''}`), P!==(P=g(v).id)&&(_.value=(_.__value=g(v).id)??'');
		}), T(l, _);
	}), s(bi), s(Sa), s(gi);const Oo=c(gi, 2);{ const Ao=l=>{
			const v=An(), _=d(v), k=c(d(_), 3);Z(k), s(_), s(v), de(k, ()=>o.totalLimit, P=>o.totalLimit=P), T(l, v);
		}, Io=l=>{
			const v=In();T(l, v);
		};L(Oo, l=>{
		o.channelMode==='CHANNEL'?l(Ao):l(Io, !1);
	}); }s(ae);const Ca=c(ae, 2), _i=d(Ca), Oa=d(_i), yi=d(Oa), Aa=c(d(yi), 2), No=d(Aa);s(Aa), s(yi);const Ia=c(yi, 2);{ const Po=l=>{
		const v=qn(), _=d(v), k=c(d(_), 3);Oi(k, ()=>{
			const P=d(k), H=Pn(), le=ge(H);le.value=(le.__value=null)??'';const se=c(le, 2);Ne(se, 17, ()=>J.questions, Pe, (be, ve)=>{
				const fe=Nn(), ot=d(fe, !0);s(fe);let We={};M(()=>{
					oe(ot, g(ve).label), We!==(We=g(ve).id)&&(fe.value=(fe.__value=g(ve).id)??'');
				}), T(be, fe);
			}), T(P, H);
		}), s(_), s(v), Fe(k, ()=>o.customTopic, P=>o.customTopic=P), T(l, v);
	};L(Ia, l=>{
		J.questions.length>0&&l(Po);
	}); }const xi=c(Ia, 2), qo=d(xi);sn(qo, {}), s(xi);const Mo=c(xi, 2);{ const Ro=l=>{
		const v=Mn(), _=d(v);s(v), at('click', _, ()=>{
			J.questions.push({
				id:Er(),
				label:`Question ${J.questions.length+1}`,
				maxLength:1e3,
				minLength:0,
				options:[],
				order:J.questions.length,
				placeholder:'',
				required:!0,
				style:2,
				type:null,
				value:'',
				_real:!1,
			});
		}), T(l, v);
	};L(Mo, l=>{
		J.questions.length<5&&l(Ro);
	}); }s(Oa), s(_i);const Na=c(_i, 2), Pa=d(Na);{ const Fo=l=>{
		const v=Ln(), _=d(v);{ const k=H=>{
				const le=Rn();T(H, le);
			}, P=H=>{
				const le=Fn();T(H, le);
			};L(_, H=>{
			g(x)?H(k):H(P, !1);
		}); }Ct(), s(v), M(()=>v.disabled=g(x)), at('click', v, U), T(l, v);
	};L(Pa, l=>{
		o.id&&l(Fo);
	}); }const wi=c(Pa, 2), Lo=d(wi);{ const jo=l=>{
		const v=jn();T(l, v);
	};L(Lo, l=>{
		g(w)&&l(jo);
	}); }Ct(), s(wi), s(Na), s(Ca), s(R), s(ne), s(re), M((l, v)=>{
		oe(j, `${l??''}
	${(o.name||'New category')??''}`), Xe.required=!!o.id, Yi(da, 'title', o.channelMode==='FORUM'?'Which forum channel should tickets be created in?':'Which category channel should ticket channels be created under?'), oe(So, v), hi.disabled=J.questions.length>0, oe(No, `${J.questions.length??''}/5`), wi.disabled=g(w);
	}, [()=>Ni.get(o.emoji)??'', ()=>Ni.get(o.emoji)??'']), lr('submit', ne, function(...l){
		let v;(v=g(W))==null||v.apply(this, l);
	}), at('change', ne, ()=>Se(t, !0)), de(Te, ()=>o.name, l=>o.name=l), de(Xe, ()=>o.channelName, l=>o.channelName=l), vt(Oe, ()=>o.claiming, l=>o.claiming=l), vt(ea, ()=>o.autoAssign, l=>o.autoAssign=l), de(ia, ()=>o.cooldown, l=>o.cooldown=l), de(ra, ()=>o.description, l=>o.description=l), Fe(Jt, ()=>o.discordCategory, l=>o.discordCategory=l), Fe(Zt, ()=>o.channelMode, l=>o.channelMode=l), de(pa, ()=>o.emoji, l=>o.emoji=l), vt(va, ()=>o.enableFeedback, l=>o.enableFeedback=l), de(ga, ()=>o.image, l=>o.image=l), de(_a, ()=>o.memberLimit, l=>o.memberLimit=l), de(xa, ()=>o.openingMessage, l=>o.openingMessage=l), Fe(di, ()=>o.pingRoles, l=>o.pingRoles=l), Fe(ci, ()=>o.ratelimit, l=>o.ratelimit=l), Fe(mi, ()=>o.requiredRoles, l=>o.requiredRoles=l), vt(hi, ()=>o.requireTopic, l=>o.requireTopic=l), Fe(bi, ()=>o.staffRoles, l=>o.staffRoles=l), T(i, q), Gt();
}Vi(['change', 'click']);export{
	gl as component, hl as universal,
};
