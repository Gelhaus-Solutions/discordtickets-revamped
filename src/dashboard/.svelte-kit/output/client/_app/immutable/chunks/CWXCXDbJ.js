const Tn=Object.defineProperty;const St=e=>{
	throw TypeError(e);
};const An=(e, t, n)=>t in e?Tn(e, t, {
	enumerable:!0,
	configurable:!0,
	writable:!0,
	value:n,
}):e[t]=n;const Se=(e, t, n)=>An(e, typeof t!=='symbol'?t+'':t, n), Qe=(e, t, n)=>t.has(e)||St('Cannot '+n);const v=(e, t, n)=>(Qe(e, t, 'read from private field'), n?n.call(e):t.get(e)), j=(e, t, n)=>t.has(e)?St('Cannot add the same private member more than once'):t instanceof WeakSet?t.add(e):t.set(e, n), X=(e, t, n, r)=>(Qe(e, t, 'write to private field'), r?r.call(e, n):t.set(e, n), n), $=(e, t, n)=>(Qe(e, t, 'access private method'), n);import{
	l as _t, t as Sn,
}from'./DIeogL5L.js';const nt=!1;const Nn=Array.isArray, Rn=Array.prototype.indexOf, Ie=Array.prototype.includes, Lr=Array.from, On=Object.defineProperty, je=Object.getOwnPropertyDescriptor, kn=Object.getOwnPropertyDescriptors, xn=Object.prototype, In=Array.prototype, jt=Object.getPrototypeOf, Nt=Object.isExtensible;function Fr(e){
	return typeof e==='function';
}const Cn=()=>{};function jr(e){
	return typeof(e==null?void 0:e.then)==='function';
}function Hr(e){
	return e();
}function Mn(e){
	for(let t=0;t<e.length;t++)e[t]();
}function Ht(){
	let e, t, n=new Promise((r, s)=>{
		e=r, t=s;
	});return{
		promise:n,
		resolve:e,
		reject:t,
	};
}function Vr(e, t){
	if(Array.isArray(e))return e;if(!(Symbol.iterator in e))return Array.from(e);const n=[];for(const r of e)if(n.push(r), n.length===t)break;return n;
}const N=2, Ee=4, Ce=8, vt=1<<24, ie=16, G=32, Te=64, Pn=128, D=512, E=1024, R=2048, Y=4096, B=8192, te=16384, Ae=32768, $e=65536, Rt=1<<17, Dn=1<<18, Ye=1<<19, Vt=1<<20, Yr=1<<25, he=65536, rt=1<<21, dt=1<<22, ne=1<<23, de=Symbol('$state'), qr=Symbol('legacy props'), Br=Symbol(''), le=new class extends Error{
	constructor(){
		super(...arguments);Se(this, 'name', 'StaleReactionError');Se(this, 'message', 'The reaction that called `getAbortSignal()` was re-run or destroyed');
	}
};let Lt;const Gr=!!((Lt=globalThis.document)!=null&&Lt.contentType)&&globalThis.document.contentType.includes('xml'), qe=3, Yt=8;function Ln(e){
	throw new Error('https://svelte.dev/e/lifecycle_outside_component');
}function Fn(){
	throw new Error('https://svelte.dev/e/async_derived_orphan');
}function $r(e, t, n){
	throw new Error('https://svelte.dev/e/each_key_duplicate');
}function jn(e){
	throw new Error('https://svelte.dev/e/effect_in_teardown');
}function Hn(){
	throw new Error('https://svelte.dev/e/effect_in_unowned_derived');
}function Vn(e){
	throw new Error('https://svelte.dev/e/effect_orphan');
}function Yn(){
	throw new Error('https://svelte.dev/e/effect_update_depth_exceeded');
}function zr(){
	throw new Error('https://svelte.dev/e/hydration_failed');
}function Kr(e){
	throw new Error('https://svelte.dev/e/props_invalid_value');
}function qn(){
	throw new Error('https://svelte.dev/e/state_descriptors_fixed');
}function Bn(){
	throw new Error('https://svelte.dev/e/state_prototype_fixed');
}function Un(){
	throw new Error('https://svelte.dev/e/state_unsafe_mutation');
}function Wr(){
	throw new Error('https://svelte.dev/e/svelte_boundary_reset_onerror');
}const Xr=1, Zr=2, Jr=4, Qr=8, es=16, ts=1, ns=2, rs=4, ss=8, as=16, is=1, fs=2, ls=4, Gn=1, $n=2, zn='[', Kn='[!', os='[?', Wn=']', pt={}, A=Symbol(), Xn='http://www.w3.org/1999/xhtml', us='http://www.w3.org/2000/svg', cs='http://www.w3.org/1998/Math/MathML', _s='@attach';function ht(e){
	console.warn('https://svelte.dev/e/hydration_mismatch');
}function vs(e){
	console.warn('https://svelte.dev/e/legacy_recursive_reactive_block');
}function ds(){
	console.warn('https://svelte.dev/e/select_multiple_invalid_value');
}function ps(){
	console.warn('https://svelte.dev/e/svelte_boundary_reset_noop');
}let C=!1;function hs(e){
	C=e;
}let y;function we(e){
	if(e===null)throw ht(), pt;return y=e;
}function Zn(){
	return we(fe(y));
}function ws(e){
	if(C){
		if(fe(y)!==null)throw ht(), pt;y=e;
	}
}function ys(e=1){
	if(C){
		for(var t=e, n=y;t--;)n=fe(n);y=n;
	}
}function ms(e=!0){
	for(let t=0, n=y;;){
		if(n.nodeType===Yt){
			const r=n.data;if(r===Wn){
				if(t===0)return n;t-=1;
			}else{
				(r===zn||r===Kn||r[0]==='['&&!isNaN(Number(r.slice(1))))&&(t+=1);
			}
		}const s=fe(n);e&&n.remove(), n=s;
	}
}function gs(e){
	if(!e||e.nodeType!==Yt)throw ht(), pt;return e.data;
}function qt(e){
	return e===this.v;
}function Jn(e, t){
	return e!=e?t==t:e!==t||e!==null&&typeof e==='object'||typeof e==='function';
}function Bt(e){
	return!Jn(e, this.v);
}let g=null;function ze(e){
	g=e;
}function bs(e){
	return Ut().get(e);
}function Es(e, t){
	return Ut().set(e, t), t;
}function Ts(e, t=!1, n){
	g={
		p:g,
		i:!1,
		c:null,
		e:null,
		s:e,
		x:null,
		l:_t&&!t?{
			s:null,
			u:null,
			$:[],
		}:null,
	};
}function As(e){
	const t=g, n=t.e;if(n!==null){
		t.e=null;for(const r of n)on(r);
	}return t.i=!0, g=t.p, {};
}function Be(){
	return!_t||g!==null&&g.l===null;
}function Ut(e){
	return g===null&&Ln(), g.c??(g.c=new Map(Qn(g)||void 0));
}function Qn(e){
	let t=e.p;for(;t!==null;){
		const n=t.c;if(n!==null)return n;t=t.p;
	}return null;
}let oe=[];function Gt(){
	const e=oe;oe=[], Mn(e);
}function Ke(e){
	if(oe.length===0&&!He){
		const t=oe;queueMicrotask(()=>{
			t===oe&&Gt();
		});
	}oe.push(e);
}function er(){
	for(;oe.length>0;)Gt();
}function tr(e){
	const t=w;if(t===null)return d.f|=ne, e;if((t.f&Ae)===0&&(t.f&Ee)===0)throw e;We(e, t);
}function We(e, t){
	for(;t!==null;){
		if((t.f&Pn)!==0){
			if((t.f&Ae)===0)throw e;try{
				t.b.error(e);return;
			}catch(n){
				e=n;
			}
		}t=t.parent;
	}throw e;
}const nr=-7169;function b(e, t){
	e.f=e.f&nr|t;
}function wt(e){
	(e.f&D)!==0||e.deps===null?b(e, E):b(e, Y);
}function $t(e){
	if(e!==null)for(const t of e)(t.f&N)===0||(t.f&he)===0||(t.f^=he, $t(t.deps));
}function rr(e, t, n){
	(e.f&R)!==0?t.add(e):(e.f&Y)!==0&&n.add(e), $t(e.deps), b(e, E);
}const Ue=new Set;let p=null, Ot=null, S=null, O=[], Xe=null, He=!1, Me=null;let Q, Ne, ve, Re, Oe, ke, ee, q, xe, x, st, at, it, ft;const Tt=class Tt{
	constructor(){
		j(this, x);Se(this, 'current', new Map);Se(this, 'previous', new Map);j(this, Q, new Set);j(this, Ne, new Set);j(this, ve, 0);j(this, Re, 0);j(this, Oe, null);j(this, ke, new Set);j(this, ee, new Set);j(this, q, new Map);Se(this, 'is_fork', !1);j(this, xe, !1);
	}skip_effect(t){
		v(this, q).has(t)||v(this, q).set(t, {
			d:[],
			m:[],
		});
	}unskip_effect(t){
		const n=v(this, q).get(t);if(n){
			v(this, q).delete(t);for(var r of n.d)b(r, R), z(r);for(r of n.m)b(r, Y), z(r);
		}
	}process(t){
		let s;O=[], this.apply();const n=Me=[], r=[];for(const a of t)$(this, x, at).call(this, a, n, r);if(Me=null, $(this, x, st).call(this)){
			$(this, x, it).call(this, r), $(this, x, it).call(this, n);for(const[a, i]of v(this, q))Xt(a, i);
		}else{
			Ot=this, p=null;for(const a of v(this, Q))a(this);v(this, Q).clear(), v(this, ve)===0&&$(this, x, ft).call(this), kt(r), kt(n), v(this, ke).clear(), v(this, ee).clear(), Ot=null, (s=v(this, Oe))==null||s.resolve();
		}S=null;
	}capture(t, n){
		n!==A&&!this.previous.has(t)&&this.previous.set(t, n), (t.f&ne)===0&&(this.current.set(t, t.v), S==null||S.set(t, t.v));
	}activate(){
		p=this, this.apply();
	}deactivate(){
		p===this&&(p=null, S=null);
	}flush(){
		let t;if(O.length>0){
			p=this, zt();
		}else if(v(this, ve)===0&&!this.is_fork){
			for(const n of v(this, Q))n(this);v(this, Q).clear(), $(this, x, ft).call(this), (t=v(this, Oe))==null||t.resolve();
		}this.deactivate();
	}discard(){
		for(const t of v(this, Ne))t(this);v(this, Ne).clear();
	}increment(t){
		X(this, ve, v(this, ve)+1), t&&X(this, Re, v(this, Re)+1);
	}decrement(t){
		X(this, ve, v(this, ve)-1), t&&X(this, Re, v(this, Re)-1), !v(this, xe)&&(X(this, xe, !0), Ke(()=>{
			X(this, xe, !1), $(this, x, st).call(this)?O.length>0&&this.flush():this.revive();
		}));
	}revive(){
		for(const t of v(this, ke))v(this, ee).delete(t), b(t, R), z(t);for(const t of v(this, ee))b(t, Y), z(t);this.flush();
	}oncommit(t){
		v(this, Q).add(t);
	}ondiscard(t){
		v(this, Ne).add(t);
	}settled(){
		return(v(this, Oe)??X(this, Oe, Ht())).promise;
	}static ensure(){
		if(p===null){
			const t=p=new Tt;Ue.add(p), He||Ke(()=>{
				p===t&&t.flush();
			});
		}return p;
	}apply(){}
};Q=new WeakMap, Ne=new WeakMap, ve=new WeakMap, Re=new WeakMap, Oe=new WeakMap, ke=new WeakMap, ee=new WeakMap, q=new WeakMap, xe=new WeakMap, x=new WeakSet, st=function(){
	return this.is_fork||v(this, Re)>0;
}, at=function(t, n, r){
	t.f^=E;for(let s=t.first;s!==null;){
		const a=s.f, i=(a&(G|Te))!==0, o=i&&(a&E)!==0, f=o||(a&B)!==0||v(this, q).has(s);if(!f&&s.fn!==null){
			i?s.f^=E:(a&Ee)!==0?n.push(s):De(s)&&((a&ie)!==0&&v(this, ee).add(s), be(s));const l=s.first;if(l!==null){
				s=l;continue;
			}
		}for(;s!==null;){
			const c=s.next;if(c!==null){
				s=c;break;
			}s=s.parent;
		}
	}
}, it=function(t){
	for(let n=0;n<t.length;n+=1)rr(t[n], v(this, ke), v(this, ee));
}, ft=function(){
	let a;if(Ue.size>1){
		this.previous.clear();let t=p, n=S, r=!0;for(const i of Ue){
			if(i===this){
				r=!1;continue;
			}const o=[];for(const[l, c]of this.current){
				if(i.current.has(l))if(r&&c!==i.current.get(l))i.current.set(l, c);else continue;o.push(l);
			}if(o.length===0)continue;const f=[...i.current.keys()].filter(l=>!this.current.has(l));if(f.length>0){
				const s=O;O=[];const l=new Set, c=new Map;for(const u of o)Kt(u, f, l, c);if(O.length>0){
					p=i, i.apply();for(const u of O)$(a=i, x, at).call(a, u, [], []);i.deactivate();
				}O=s;
			}
		}p=t, S=n;
	}v(this, q).clear(), Ue.delete(this);
};const Pe=Tt;function sr(e){
	const t=He;He=!0;try{
		for(var n;;){
			if(er(), O.length===0&&(p==null||p.flush(), O.length===0))return Xe=null, n;zt();
		}
	}finally{
		He=t;
	}
}function zt(){
	const e=null;try{
		for(let t=0;O.length>0;){
			const n=Pe.ensure();if(t++>1e3){
				var r, s;ar();
			}n.process(O), re.clear();
		}
	}finally{
		O=[], Xe=null, Me=null;
	}
}function ar(){
	try{
		Yn();
	}catch(e){
		We(e, Xe);
	}
}let H=null;function kt(e){
	const t=e.length;if(t!==0){
		for(let n=0;n<t;){
			const r=e[n++];if((r.f&(te|B))===0&&De(r)&&(H=new Set, be(r), r.deps===null&&r.first===null&&r.nodes===null&&r.teardown===null&&r.ac===null&&_n(r), (H==null?void 0:H.size)>0)){
				re.clear();for(const s of H){
					if((s.f&(te|B))!==0)continue;const a=[s];let i=s.parent;for(;i!==null;)H.has(i)&&(H.delete(i), a.push(i)), i=i.parent;for(let o=a.length-1;o>=0;o--){
						const f=a[o];(f.f&(te|B))===0&&be(f);
					}
				}H.clear();
			}
		}H=null;
	}
}function Kt(e, t, n, r){
	if(!n.has(e)&&(n.add(e), e.reactions!==null)){
		for(const s of e.reactions){
			const a=s.f;(a&N)!==0?Kt(s, t, n, r):(a&(dt|ie))!==0&&(a&R)===0&&Wt(s, t, r)&&(b(s, R), z(s));
		}
	}
}function Wt(e, t, n){
	const r=n.get(e);if(r!==void 0)return r;if(e.deps!==null){
		for(const s of e.deps){
			if(Ie.call(t, s))return!0;if((s.f&N)!==0&&Wt(s, t, n))return n.set(s, !0), !0;
		}
	}return n.set(e, !1), !1;
}function z(e){
	let t=Xe=e, n=t.b;if(n!=null&&n.is_pending&&(e.f&(Ee|Ce|vt))!==0&&(e.f&Ae)===0){
		n.defer_effect(e);return;
	}for(;t.parent!==null;){
		t=t.parent;const r=t.f;if(Me!==null&&t===w&&(e.f&Ce)===0)return;if((r&(Te|G))!==0){
			if((r&E)===0)return;t.f^=E;
		}
	}O.push(t);
}function Xt(e, t){
	if(!((e.f&G)!==0&&(e.f&E)!==0)){
		(e.f&R)!==0?t.d.push(e):(e.f&Y)!==0&&t.m.push(e), b(e, E);for(let n=e.first;n!==null;)Xt(n, t), n=n.next;
	}
}function Zt(e, t, n, r){
	const s=Be()?yt:lr;const a=e.filter(u=>!u.settled);if(n.length===0&&a.length===0){
		r(t.map(s));return;
	}const i=w, o=ir(), f=a.length===1?a[0].promise:a.length>1?Promise.all(a.map(u=>u.promise)):null;function l(u){
		o();try{
			r(u);
		}catch(_){
			(i.f&te)===0&&We(_, i);
		}lt();
	}if(n.length===0){
		f.then(()=>l(t.map(s)));return;
	}function c(){
		o(), Promise.all(n.map(u=>fr(u))).then(u=>l([...t.map(s), ...u])).catch(u=>We(u, i));
	}f?f.then(c):c();
}function ir(){
	const e=w, t=d, n=g, r=p;return function(a=!0){
		ae(e), U(t), ze(n), a&&(r==null||r.activate());
	};
}function lt(e=!0){
	ae(null), U(null), ze(null), e&&(p==null||p.deactivate());
}function Jt(){
	const e=w.b, t=p, n=e.is_rendered();return e.update_pending_count(1), t.increment(n), ()=>{
		e.update_pending_count(-1), t.decrement(n);
	};
}function yt(e){
	const t=N|R, n=d!==null&&(d.f&N)!==0?d:null;return w!==null&&(w.f|=Ye), {
		ctx:g,
		deps:null,
		effects:null,
		equals:qt,
		f:t,
		fn:e,
		reactions:null,
		rv:0,
		v:A,
		wv:0,
		parent:n??w,
		ac:null,
	};
}function fr(e, t, n){
	w===null&&Fn();let s=void 0, a=gt(A), i=!d, o=new Map;return yr(()=>{
		let _;const f=Ht();s=f.promise;try{
			Promise.resolve(e()).then(f.resolve, f.reject).finally(lt);
		}catch(m){
			f.reject(m), lt();
		}const l=p;if(i){
			var c=Jt();(_=o.get(l))==null||_.reject(le), o.delete(l), o.set(l, f);
		}const u=(m, h=void 0)=>{
			if(l.activate(), h){
				h!==le&&(a.f|=ne, ut(a, h));
			}else{
				(a.f&ne)!==0&&(a.f^=ne), ut(a, m);for(const[M, T]of o){
					if(o.delete(M), M===l)break;T.reject(le);
				}
			}c&&c();
		};f.promise.then(u, m=>u(null, m||'unknown'));
	}), bt(()=>{
		for(const f of o.values())f.reject(le);
	}), new Promise(f=>{
		function l(c){
			function u(){
				c===s?f(a):l(s);
			}c.then(u, u);
		}l(s);
	});
}function Ss(e){
	const t=yt(e);return pn(t), t;
}function lr(e){
	const t=yt(e);return t.equals=Bt, t;
}function or(e){
	const t=e.effects;if(t!==null){
		e.effects=null;for(let n=0;n<t.length;n+=1)me(t[n]);
	}
}function ur(e){
	for(let t=e.parent;t!==null;){
		if((t.f&N)===0)return(t.f&te)===0?t:null;t=t.parent;
	}return null;
}function mt(e){
	let t, n=w;ae(ur(e));try{
		e.f&=~he, or(e), t=mn(e);
	}finally{
		ae(n);
	}return t;
}function Qt(e){
	const t=mt(e);if(!e.equals(t)&&(e.wv=wn(), (!(p!=null&&p.is_fork)||e.deps===null)&&(e.v=t, e.deps===null))){
		b(e, E);return;
	}ge||(S!==null?(ln()||p!=null&&p.is_fork)&&S.set(e, t):wt(e));
}function cr(e){
	let t, n;if(e.effects!==null)for(const r of e.effects)(r.teardown||r.ac)&&((t=r.teardown)==null||t.call(r), (n=r.ac)==null||n.abort(le), r.teardown=Cn, r.ac=null, Ve(r, 0), Et(r));
}function en(e){
	if(e.effects!==null)for(const t of e.effects)t.teardown&&be(t);
}const ot=new Set;const re=new Map;let tn=!1;function gt(e, t){
	const n={
		f:0,
		v:e,
		reactions:null,
		equals:qt,
		rv:0,
		wv:0,
	};return n;
}function Z(e, t){
	const n=gt(e);return pn(n), n;
}function Ns(e, t=!1, n=!0){
	let s;const r=gt(e);return t||(r.equals=Bt), _t&&n&&g!==null&&g.l!==null&&((s=g.l).s??(s.s=[])).push(r), r;
}function J(e, t, n=!1){
	d!==null&&(!V||(d.f&Rt)!==0)&&Be()&&(d.f&(N|ie|dt|Rt))!==0&&(L===null||!Ie.call(L, e))&&Un();const r=n?Fe(t):t;return ut(e, r);
}function ut(e, t){
	if(!e.equals(t)){
		const n=e.v;ge?re.set(e, t):re.set(e, n), e.v=t;const r=Pe.ensure();if(r.capture(e, n), (e.f&N)!==0){
			const s=e;(e.f&R)!==0&&mt(s), wt(s);
		}e.wv=wn(), nn(e, R), Be()&&w!==null&&(w.f&E)!==0&&(w.f&(G|Te))===0&&(P===null?Er([e]):P.push(e)), !r.is_fork&&ot.size>0&&!tn&&_r();
	}return t;
}function _r(){
	tn=!1;for(const e of ot)(e.f&E)!==0&&b(e, Y), De(e)&&be(e);ot.clear();
}function Rs(e, t=1){
	let n=ce(e), r=t===1?n++:n--;return J(e, n), r;
}function et(e){
	J(e, e.v+1);
}function nn(e, t){
	const n=e.reactions;if(n!==null){
		for(let r=Be(), s=n.length, a=0;a<s;a++){
			const i=n[a], o=i.f;if(!(!r&&i===w)){
				const f=(o&R)===0;if(f&&b(i, t), (o&N)!==0){
					const l=i;S==null||S.delete(l), (o&he)===0&&(o&D&&(i.f|=he), nn(l, Y));
				}else {
					f&&((o&ie)!==0&&H!==null&&H.add(i), z(i));
				}
			}
		}
	}
}function Fe(e){
	if(typeof e!=='object'||e===null||de in e)return e;const t=jt(e);if(t!==xn&&t!==In)return e;const n=new Map, r=Nn(e), s=Z(0), a=pe, i=o=>{
		if(pe===a)return o();const f=d, l=pe;U(null), Pt(a);const c=o();return U(f), Pt(l), c;
	};return r&&n.set('length', Z(e.length)), new Proxy(e, {
		defineProperty(o, f, l){
			(!('value'in l)||l.configurable===!1||l.enumerable===!1||l.writable===!1)&&qn();const c=n.get(f);return c===void 0?i(()=>{
				const u=Z(l.value);return n.set(f, u), u;
			}):J(c, l.value, !0), !0;
		},
		deleteProperty(o, f){
			const l=n.get(f);if(l===void 0){
				if(f in o){
					const c=i(()=>Z(A));n.set(f, c), et(s);
				}
			}else {
				J(l, A), et(s);
			}return!0;
		},
		get(o, f, l){
			let m;if(f===de)return e;let c=n.get(f), u=f in o;if(c===void 0&&(!u||(m=je(o, f))!=null&&m.writable)&&(c=i(()=>{
				const h=Fe(u?o[f]:A), M=Z(h);return M;
			}), n.set(f, c)), c!==void 0){
				const _=ce(c);return _===A?void 0:_;
			}return Reflect.get(o, f, l);
		},
		getOwnPropertyDescriptor(o, f){
			const l=Reflect.getOwnPropertyDescriptor(o, f);if(l&&'value'in l){
				const c=n.get(f);c&&(l.value=ce(c));
			}else if(l===void 0){
				const u=n.get(f), _=u==null?void 0:u.v;if(u!==void 0&&_!==A){
					return{
						enumerable:!0,
						configurable:!0,
						value:_,
						writable:!0,
					};
				}
			}return l;
		},
		has(o, f){
			let _;if(f===de)return!0;let l=n.get(f), c=l!==void 0&&l.v!==A||Reflect.has(o, f);if(l!==void 0||w!==null&&(!c||(_=je(o, f))!=null&&_.writable)){
				l===void 0&&(l=i(()=>{
					const m=c?Fe(o[f]):A, h=Z(m);return h;
				}), n.set(f, l));const u=ce(l);if(u===A)return!1;
			}return c;
		},
		set(o, f, l, c){
			let At;let u=n.get(f), _=f in o;if(r&&f==='length'){
				for(let m=l;m<u.v;m+=1){
					let h=n.get(m+'');h!==void 0?J(h, A):m in o&&(h=i(()=>Z(A)), n.set(m+'', h));
				}
			}if(u===void 0){
				(!_||(At=je(o, f))!=null&&At.writable)&&(u=i(()=>Z(void 0)), J(u, Fe(l)), n.set(f, u));
			}else{
				_=u.v!==A;const M=i(()=>Fe(l));J(u, M);
			}const T=Reflect.getOwnPropertyDescriptor(o, f);if(T!=null&&T.set&&T.set.call(c, l), !_){
				if(r&&typeof f==='string'){
					const Le=n.get('length'), W=Number(f);Number.isInteger(W)&&W>=Le.v&&J(Le, W+1);
				}et(s);
			}return!0;
		},
		ownKeys(o){
			ce(s);const f=Reflect.ownKeys(o).filter(u=>{
				const _=n.get(u);return _===void 0||_.v!==A;
			});for(const[l, c]of n)c.v!==A&&!(l in o)&&f.push(l);return f;
		},
		setPrototypeOf(){
			Bn();
		},
	});
}function xt(e){
	try{
		if(e!==null&&typeof e==='object'&&de in e)return e[de];
	}catch{}return e;
}function Os(e, t){
	return Object.is(xt(e), xt(t));
}let It, vr, rn, sn, an;function ks(){
	if(It===void 0){
		It=window, vr=document, rn=/Firefox/.test(navigator.userAgent);const e=Element.prototype, t=Node.prototype, n=Text.prototype;sn=je(t, 'firstChild').get, an=je(t, 'nextSibling').get, Nt(e)&&(e.__click=void 0, e.__className=void 0, e.__attributes=null, e.__style=void 0, e.__e=void 0), Nt(n)&&(n.__t=void 0);
	}
}function ye(e=''){
	return document.createTextNode(e);
}function se(e){
	return sn.call(e);
}function fe(e){
	return an.call(e);
}function xs(e, t){
	if(!C)return se(e);let n=se(y);if(n===null){
		n=y.appendChild(ye());
	}else if(t&&n.nodeType!==qe){
		const r=ye();return n==null||n.before(r), we(r), r;
	}return t&&Ze(n), we(n), n;
}function Is(e, t=!1){
	if(!C){
		const n=se(e);return n instanceof Comment&&n.data===''?fe(n):n;
	}if(t){
		if((y==null?void 0:y.nodeType)!==qe){
			const r=ye();return y==null||y.before(r), we(r), r;
		}Ze(y);
	}return y;
}function Cs(e, t=1, n=!1){
	let r=C?y:e;for(var s;t--;)s=r, r=fe(r);if(!C)return r;if(n){
		if((r==null?void 0:r.nodeType)!==qe){
			const a=ye();return r===null?s==null||s.after(a):r.before(a), we(a), a;
		}Ze(r);
	}return we(r), r;
}function dr(e){
	e.textContent='';
}function Ms(){
	return!1;
}function pr(e, t, n){
	return document.createElementNS(t??Xn, e, void 0);
}function Ps(e=''){
	return document.createComment(e);
}function Ze(e){
	if(e.nodeValue.length<65536)return;let t=e.nextSibling;for(;t!==null&&t.nodeType===qe;)t.remove(), e.nodeValue+=t.nodeValue, t=e.nextSibling;
}function Ds(e, t){
	if(t){
		const n=document.body;e.autofocus=!0, Ke(()=>{
			document.activeElement===n&&e.focus();
		});
	}
}function Ls(e){
	C&&se(e)!==null&&dr(e);
}let Ct=!1;function hr(){
	Ct||(Ct=!0, document.addEventListener('reset', e=>{
		Promise.resolve().then(()=>{
			let t;if(!e.defaultPrevented)for(const n of e.target.elements)(t=n.__on_r)==null||t.call(n);
		});
	}, { capture:!0 }));
}function Fs(e, t, n, r=!0){
	r&&n();for(const s of t)e.addEventListener(s, n);bt(()=>{
		for(const a of t)e.removeEventListener(a, n);
	});
}function Je(e){
	const t=d, n=w;U(null), ae(null);try{
		return e();
	}finally{
		U(t), ae(n);
	}
}function js(e, t, n, r=n){
	e.addEventListener(t, ()=>Je(n));const s=e.__on_r;s?e.__on_r=()=>{
		s(), r(!0);
	}:e.__on_r=()=>r(!0), hr();
}function fn(e){
	w===null&&(d===null&&Vn(), Hn()), ge&&jn();
}function wr(e, t){
	const n=t.last;n===null?t.last=t.first=e:(n.next=e, e.prev=n, t.last=e);
}function F(e, t){
	const n=w;n!==null&&(n.f&B)!==0&&(e|=B);let r={
			ctx:g,
			deps:null,
			nodes:null,
			f:e|R|D,
			first:null,
			fn:t,
			last:null,
			next:null,
			parent:n,
			b:n&&n.b,
			prev:null,
			teardown:null,
			wv:0,
			ac:null,
		}, s=r;if((e&Ee)!==0){
		Me!==null?Me.push(r):z(r);
	}else if(t!==null){
		try{
			be(r);
		}catch(i){
			throw me(r), i;
		}s.deps===null&&s.teardown===null&&s.nodes===null&&s.first===s.last&&(s.f&Ye)===0&&(s=s.first, (e&ie)!==0&&(e&$e)!==0&&s!==null&&(s.f|=$e));
	}if(s!==null&&(s.parent=n, n!==null&&wr(s, n), d!==null&&(d.f&N)!==0&&(e&Te)===0)){
		const a=d;(a.effects??(a.effects=[])).push(s);
	}return r;
}function ln(){
	return d!==null&&!V;
}function bt(e){
	const t=F(Ce, null);return b(t, E), t.teardown=e, t;
}function Hs(e){
	fn();const t=w.f, n=!d&&(t&G)!==0&&(t&Ae)===0;if(n){
		const r=g;(r.e??(r.e=[])).push(e);
	}else {
		return on(e);
	}
}function on(e){
	return F(Ee|Vt, e);
}function Vs(e){
	return fn(), F(Ce|Vt, e);
}function Ys(e){
	Pe.ensure();const t=F(Te|Ye, e);return(n={})=>new Promise(r=>{
		n.outro?br(t, ()=>{
			me(t), r(void 0);
		}):(me(t), r(void 0));
	});
}function qs(e){
	return F(Ee, e);
}function Bs(e, t){
	const n=g, r={
		effect:null,
		ran:!1,
		deps:e,
	};n.l.$.push(r), r.effect=un(()=>{
		e(), !r.ran&&(r.ran=!0, Ar(t));
	});
}function Us(){
	const e=g;un(()=>{
		for(const t of e.l.$){
			t.deps();const n=t.effect;(n.f&E)!==0&&n.deps!==null&&b(n, Y), De(n)&&be(n), t.ran=!1;
		}
	});
}function yr(e){
	return F(dt|Ye, e);
}function un(e, t=0){
	return F(Ce|t, e);
}function Gs(e, t=[], n=[], r=[]){
	Zt(r, t, n, s=>{
		F(Ce, ()=>e(...s.map(ce)));
	});
}function $s(e, t=[], n=[], r=[]){
	if(n.length>0||r.length>0)var s=Jt();Zt(r, t, n, a=>{
		F(Ee, ()=>e(...a.map(ce))), s&&s();
	});
}function zs(e, t=0){
	const n=F(ie|t, e);return n;
}function Ks(e, t=0){
	const n=F(vt|t, e);return n;
}function Ws(e){
	return F(G|Ye, e);
}function cn(e){
	const t=e.teardown;if(t!==null){
		const n=ge, r=d;Mt(!0), U(null);try{
			t.call(null);
		}finally{
			Mt(n), U(r);
		}
	}
}function Et(e, t=!1){
	let n=e.first;for(e.first=e.last=null;n!==null;){
		const s=n.ac;s!==null&&Je(()=>{
			s.abort(le);
		});const r=n.next;(n.f&Te)!==0?n.parent=null:me(n, t), n=r;
	}
}function mr(e){
	for(let t=e.first;t!==null;){
		const n=t.next;(t.f&G)===0&&me(t), t=n;
	}
}function me(e, t=!0){
	let n=!1;(t||(e.f&Dn)!==0)&&e.nodes!==null&&e.nodes.end!==null&&(gr(e.nodes.start, e.nodes.end), n=!0), Et(e, t&&!n), Ve(e, 0), b(e, te);const r=e.nodes&&e.nodes.t;if(r!==null)for(const a of r)a.stop();cn(e);const s=e.parent;s!==null&&s.first!==null&&_n(e), e.next=e.prev=e.teardown=e.ctx=e.deps=e.fn=e.nodes=e.ac=null;
}function gr(e, t){
	for(;e!==null;){
		const n=e===t?null:fe(e);e.remove(), e=n;
	}
}function _n(e){
	const t=e.parent, n=e.prev, r=e.next;n!==null&&(n.next=r), r!==null&&(r.prev=n), t!==null&&(t.first===e&&(t.first=r), t.last===e&&(t.last=n));
}function br(e, t, n=!0){
	const r=[];vn(e, r, !0);let s=()=>{
			n&&me(e), t&&t();
		}, a=r.length;if(a>0){
		const i=()=>--a||s();for(const o of r)o.out(i);
	}else {
		s();
	}
}function vn(e, t, n){
	if((e.f&B)===0){
		e.f^=B;const r=e.nodes&&e.nodes.t;if(r!==null)for(const o of r)(o.is_global||n)&&t.push(o);for(let s=e.first;s!==null;){
			const a=s.next, i=(s.f&$e)!==0||(s.f&G)!==0&&(e.f&ie)!==0;vn(s, t, i?n:!1), s=a;
		}
	}
}function Xs(e){
	dn(e, !0);
}function dn(e, t){
	if((e.f&B)!==0){
		e.f^=B, (e.f&E)===0&&(b(e, R), z(e));for(let n=e.first;n!==null;){
			const r=n.next, s=(n.f&$e)!==0||(n.f&G)!==0;dn(n, s?t:!1), n=r;
		}const a=e.nodes&&e.nodes.t;if(a!==null)for(const i of a)(i.is_global||t)&&i.in();
	}
}function Zs(e, t){
	if(e.nodes){
		for(let n=e.nodes.start, r=e.nodes.end;n!==null;){
			const s=n===r?null:fe(n);t.append(n), n=s;
		}
	}
}let Ge=!1, ge=!1;function Mt(e){
	ge=e;
}let d=null, V=!1;function U(e){
	d=e;
}let w=null;function ae(e){
	w=e;
}let L=null;function pn(e){
	d!==null&&(L===null?L=[e]:L.push(e));
}let k=null, I=0, P=null;function Er(e){
	P=e;
}let hn=1, ue=0, pe=ue;function Pt(e){
	pe=e;
}function wn(){
	return++hn;
}function De(e){
	const t=e.f;if((t&R)!==0)return!0;if(t&N&&(e.f&=~he), (t&Y)!==0){
		for(let n=e.deps, r=n.length, s=0;s<r;s++){
			const a=n[s];if(De(a)&&Qt(a), a.wv>e.wv)return!0;
		}(t&D)!==0&&S===null&&b(e, E);
	}return!1;
}function yn(e, t, n=!0){
	const r=e.reactions;if(r!==null&&!(L!==null&&Ie.call(L, e))){
		for(let s=0;s<r.length;s++){
			const a=r[s];(a.f&N)!==0?yn(a, t, !1):t===a&&(n?b(a, R):(a.f&E)!==0&&b(a, Y), z(a));
		}
	}
}function mn(e){
	let M;let t=k, n=I, r=P, s=d, a=L, i=g, o=V, f=pe, l=e.f;k=null, I=0, P=null, d=(l&(G|Te))===0?e:null, L=null, ze(e.ctx), V=!1, pe=++ue, e.ac!==null&&(Je(()=>{
		e.ac.abort(le);
	}), e.ac=null);try{
		e.f|=rt;const c=e.fn, u=c();e.f|=Ae;let _=e.deps, m=p==null?void 0:p.is_fork;if(k!==null){
			var h;if(m||Ve(e, I), _!==null&&I>0)for(_.length=I+k.length, h=0;h<k.length;h++)_[I+h]=k[h];else e.deps=_=k;if(ln()&&(e.f&D)!==0)for(h=I;h<_.length;h++)((M=_[h]).reactions??(M.reactions=[])).push(e);
		}else{
			!m&&_!==null&&I<_.length&&(Ve(e, I), _.length=I);
		}if(Be()&&P!==null&&!V&&_!==null&&(e.f&(N|Y|R))===0)for(h=0;h<P.length;h++)yn(P[h], e);if(s!==null&&s!==e){
			if(ue++, s.deps!==null)for(let T=0;T<n;T+=1)s.deps[T].rv=ue;if(t!==null)for(const T of t)T.rv=ue;P!==null&&(r===null?r=P:r.push(...P));
		}return(e.f&ne)!==0&&(e.f^=ne), u;
	}catch(T){
		return tr(T);
	}finally{
		e.f^=rt, k=t, I=n, P=r, d=s, L=a, ze(i), V=o, pe=f;
	}
}function Tr(e, t){
	let n=t.reactions;if(n!==null){
		const r=Rn.call(n, e);if(r!==-1){
			const s=n.length-1;s===0?n=t.reactions=null:(n[r]=n[s], n.pop());
		}
	}if(n===null&&(t.f&N)!==0&&(k===null||!Ie.call(k, t))){
		const a=t;(a.f&D)!==0&&(a.f^=D, a.f&=~he), wt(a), cr(a), Ve(a, 0);
	}
}function Ve(e, t){
	const n=e.deps;if(n!==null)for(let r=t;r<n.length;r++)Tr(e, n[r]);
}function be(e){
	const t=e.f;if((t&te)===0){
		b(e, E);const n=w, r=Ge;w=e, Ge=!0;try{
			(t&(ie|vt))!==0?mr(e):Et(e), cn(e);const s=mn(e);e.teardown=typeof s==='function'?s:null, e.wv=hn;let a;nt&&Sn&&(e.f&R)!==0&&e.deps;
		}finally{
			Ge=r, w=n;
		}
	}
}async function Js(){
	await Promise.resolve(), sr();
}function Qs(){
	return Pe.ensure().settled();
}function ce(e){
	const t=e.f, n=(t&N)!==0;if(d!==null&&!V){
		const r=w!==null&&(w.f&te)!==0;if(!r&&(L===null||!Ie.call(L, e))){
			const s=d.deps;if((d.f&rt)!==0){
				e.rv<ue&&(e.rv=ue, k===null&&s!==null&&s[I]===e?I++:k===null?k=[e]:k.push(e));
			}else{
				(d.deps??(d.deps=[])).push(e);const a=e.reactions;a===null?e.reactions=[d]:Ie.call(a, d)||a.push(d);
			}
		}
	}if(ge&&re.has(e))return re.get(e);if(n){
		const i=e;if(ge){
			let o=i.v;return((i.f&E)===0&&i.reactions!==null||bn(i))&&(o=mt(i)), re.set(i, o), o;
		}const f=(i.f&D)===0&&!V&&d!==null&&(Ge||(d.f&D)!==0), l=(i.f&Ae)===0;De(i)&&(f&&(i.f|=D), Qt(i)), f&&!l&&(en(i), gn(i));
	}if(S!=null&&S.has(e))return S.get(e);if((e.f&ne)!==0)throw e.v;return e.v;
}function gn(e){
	if(e.f|=D, e.deps!==null)for(const t of e.deps)(t.reactions??(t.reactions=[])).push(e), (t.f&N)!==0&&(t.f&D)===0&&(en(t), gn(t));
}function bn(e){
	if(e.v===A)return!0;if(e.deps===null)return!1;for(const t of e.deps)if(re.has(t)||(t.f&N)!==0&&bn(t))return!0;return!1;
}function Ar(e){
	const t=V;try{
		return V=!0, e();
	}finally{
		V=t;
	}
}function ea(e){
	if(!(typeof e!=='object'||!e||e instanceof EventTarget)){
		if(de in e){
			ct(e);
		}else if(!Array.isArray(e)){
			for(const t in e){
				const n=e[t];typeof n==='object'&&n&&de in n&&ct(n);
			}
		}
	}
}function ct(e, t=new Set){
	if(typeof e==='object'&&e!==null&&!(e instanceof EventTarget)&&!t.has(e)){
		t.add(e), e instanceof Date&&e.getTime();for(const r in e){
			try{
				ct(e[r], t);
			}catch{}
		}const n=jt(e);if(n!==Object.prototype&&n!==Array.prototype&&n!==Map.prototype&&n!==Set.prototype&&n!==Date.prototype){
			const r=kn(n);for(const s in r){
				const a=r[s].get;if(a){
					try{
						a.call(e);
					}catch{}
				}
			}
		}
	}
}function ta(e){
	return e.endsWith('capture')&&e!=='gotpointercapture'&&e!=='lostpointercapture';
}const Sr=['beforeinput', 'click', 'change', 'dblclick', 'contextmenu', 'focusin', 'focusout', 'input', 'keydown', 'keyup', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'pointerdown', 'pointermove', 'pointerout', 'pointerover', 'pointerup', 'touchend', 'touchmove', 'touchstart'];function na(e){
	return Sr.includes(e);
}const Nr={
	formnovalidate:'formNoValidate',
	ismap:'isMap',
	nomodule:'noModule',
	playsinline:'playsInline',
	readonly:'readOnly',
	defaultvalue:'defaultValue',
	defaultchecked:'defaultChecked',
	srcobject:'srcObject',
	novalidate:'noValidate',
	allowfullscreen:'allowFullscreen',
	disablepictureinpicture:'disablePictureInPicture',
	disableremoteplayback:'disableRemotePlayback',
};function ra(e){
	return e=e.toLowerCase(), Nr[e]??e;
}const Rr=['touchstart', 'touchmove'];function sa(e){
	return Rr.includes(e);
}const _e=Symbol('events'), Or=new Set, kr=new Set;function xr(e, t, n, r={}){
	function s(a){
		if(r.capture||Ir.call(t, a), !a.cancelBubble)return Je(()=>n==null?void 0:n.call(this, a));
	}return e.startsWith('pointer')||e.startsWith('touch')||e==='wheel'?Ke(()=>{
		t.addEventListener(e, s, r);
	}):t.addEventListener(e, s, r), s;
}function aa(e, t, n, r, s){
	const a={
			capture:r,
			passive:s,
		}, i=xr(e, t, n, a);(t===document.body||t===window||t===document||t instanceof HTMLMediaElement)&&bt(()=>{
		t.removeEventListener(e, i, a);
	});
}function ia(e, t, n){
	(t[_e]??(t[_e]={}))[e]=n;
}function fa(e){
	for(let t=0;t<e.length;t++)Or.add(e[t]);for(const n of kr)n(e);
}let Dt=null;function Ir(e){
	let T, Le;let t=this, n=t.ownerDocument, r=e.type, s=((T=e.composedPath)==null?void 0:T.call(e))||[], a=s[0]||e.target;Dt=e;let i=0, o=Dt===e&&e[_e];if(o){
		const f=s.indexOf(o);if(f!==-1&&(t===document||t===window)){
			e[_e]=t;return;
		}const l=s.indexOf(t);if(l===-1)return;f<=l&&(i=f);
	}if(a=s[i]||e.target, a!==t){
		On(e, 'currentTarget', {
			configurable:!0,
			get(){
				return a||n;
			},
		});const c=d, u=w;U(null), ae(null);try{
			for(var _, m=[];a!==null;){
				const h=a.assignedSlot||a.parentNode||a.host||null;try{
					const M=(Le=a[_e])==null?void 0:Le[r];M!=null&&(!a.disabled||e.target===a)&&M.call(a, e);
				}catch(W){
					_?m.push(W):_=W;
				}if(e.cancelBubble||h===t||h===null)break;a=h;
			}if(_){
				for(const W of m){
					queueMicrotask(()=>{
						throw W;
					});
				}throw _;
			}
		}finally{
			e[_e]=t, delete e.currentTarget, U(c), ae(u);
		}
	}
}let Ft;const tt=((Ft=globalThis==null?void 0:globalThis.window)==null?void 0:Ft.trustedTypes)&&globalThis.window.trustedTypes.createPolicy('svelte-trusted-html', { createHTML:e=>e });function Cr(e){
	return(tt==null?void 0:tt.createHTML(e))??e;
}function En(e){
	const t=pr('template');return t.innerHTML=Cr(e.replaceAll('<!>', '<!---->')), t.content;
}function K(e, t){
	const n=w;n.nodes===null&&(n.nodes={
		start:e,
		end:t,
		a:null,
		t:null,
	});
}function la(e, t){
	let n=(t&Gn)!==0, r=(t&$n)!==0, s, a=!e.startsWith('<!>');return()=>{
		if(C)return K(y, null), y;s===void 0&&(s=En(a?e:'<!>'+e), n||(s=se(s)));const i=r||rn?document.importNode(s, !0):s.cloneNode(!0);if(n){
			const o=se(i), f=i.lastChild;K(o, f);
		}else {
			K(i, i);
		}return i;
	};
}function Mr(e, t, n='svg'){
	let r=!e.startsWith('<!>'), s=`<${n}>${r?e:'<!>'+e}</${n}>`, a;return()=>{
		if(C)return K(y, null), y;if(!a){
			const i=En(s), o=se(i);a=se(o);
		}const f=a.cloneNode(!0);return K(f, f), f;
	};
}function oa(e, t){
	return Mr(e, t, 'svg');
}function ua(e=''){
	if(!C){
		const t=ye(e+'');return K(t, t), t;
	}let n=y;return n.nodeType!==qe?(n.before(n=ye()), we(n)):Ze(n), K(n, n), n;
}function ca(){
	if(C)return K(y, null), y;const e=document.createDocumentFragment(), t=document.createComment(''), n=ye();return e.append(t, n), K(t, n), e;
}function _a(e, t){
	if(C){
		const n=w;((n.f&Ae)===0||n.nodes.end===null)&&(n.nodes.end=y), Zn();return;
	}e!==null&&e.before(t);
}export{
	Mn as $, sr as A, On as B, Yt as C, Ns as D, Ye as E, w as F, R as G, Dn as H, vs as I, b as J, qs as K, qr as L, Y as M, un as N, Ar as O, Ke as P, Ps as Q, pr as R, de as S, Cr as T, Fe as U, Zn as V, gs as W, ms as X, zn as Y, g as Z, Hs as _, _a as a, Ae as a$, Hr as a0, ea as a1, yt as a2, gr as a3, ht as a4, pt as a5, K as a6, us as a7, cs as a8, je as a9, ut as aA, Yr as aB, Ws as aC, $r as aD, Ms as aE, Lr as aF, Xr as aG, es as aH, Zr as aI, Xs as aJ, br as aK, B as aL, G as aM, Qr as aN, dr as aO, me as aP, Zs as aQ, $s as aR, vr as aS, ua as aT, fa as aU, ia as aV, Vr as aW, Jn as aX, aa as aY, Ls as aZ, ie as a_, Kr as aa, rs as ab, ge as ac, te as ad, ss as ae, ns as af, ts as ag, lr as ah, as as ai, gt as aj, Rs as ak, ae as al, Fr as am, js as an, p as ao, Js as ap, Ot as aq, bt as ar, Ln as as, Nn as at, bs as au, Es as av, Qs as aw, Jr as ax, Kn as ay, Wn as az, As as b, ls as b0, is as b1, fs as b2, Je as b3, Ks as b4, ds as b5, Os as b6, Br as b7, Xn as b8, jt as b9, zr as bA, Ys as bB, Or as bC, kr as bD, Ir as bE, sa as bF, Be as bG, jr as bH, lt as bI, He as bJ, ir as bK, oa as bL, Fs as bM, Bs as bN, Us as bO, It as bP, hr as ba, Gr as bb, kn as bc, U as bd, d as be, Zt as bf, _s as bg, ta as bh, xr as bi, Ds as bj, ra as bk, A as bl, na as bm, ln as bn, et as bo, Pn as bp, os as bq, Pe as br, z as bs, rr as bt, ze as bu, tr as bv, We as bw, Wr as bx, ps as by, ks as bz, xs as c, Z as d, ca as e, la as f, ce as g, Is as h, Cs as i, ys as j, ye as k, zs as l, C as m, Cn as n, fe as o, Ts as p, hs as q, ws as r, J as s, Gs as t, Ss as u, we as v, y as w, se as x, $e as y, Vs as z,
};
