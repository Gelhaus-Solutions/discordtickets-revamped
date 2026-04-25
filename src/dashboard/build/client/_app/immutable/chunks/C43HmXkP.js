import{
	an as n, ao as f, ap as m, m as u, O as i, N as k, aq as t,
}from'./CWXCXDbJ.js';function E(e, a, r=a){
	const v=new WeakSet;n(e, 'input', async c=>{
		let l=c?e.defaultValue:e.value;if(l=o(e)?h(l):l, r(l), f!==null&&v.add(f), await m(), l!==(l=a())){
			const _=e.selectionStart, s=e.selectionEnd, b=e.value.length;if(e.value=l??'', s!==null){
				const d=e.value.length;_===s&&s===b&&d>b?(e.selectionStart=d, e.selectionEnd=d):(e.selectionStart=_, e.selectionEnd=Math.min(s, d));
			}
		}
	}), (u&&e.defaultValue!==e.value||i(a)==null&&e.value)&&(r(o(e)?h(e.value):e.value), f!==null&&v.add(f)), k(()=>{
		const c=a();if(e===document.activeElement){
			const l=t??f;if(v.has(l))return;
		}o(e)&&c===h(e.value)||e.type==='date'&&!c&&!e.value||c!==e.value&&(e.value=c??'');
	});
}function S(e, a, r=a){
	n(e, 'change', v=>{
		const c=v?e.defaultChecked:e.checked;r(c);
	}), (u&&e.defaultChecked!==e.checked||i(a)==null)&&r(e.checked), k(()=>{
		const v=a();e.checked=!!v;
	});
}function o(e){
	const a=e.type;return a==='number'||a==='range';
}function h(e){
	return e===''?null:+e;
}function C(e, a, r=a){
	n(e, 'change', ()=>{
		r(e.files);
	}), u&&e.files&&r(e.files), k(()=>{
		e.files=a();
	});
}export{
	S as a, E as b, C as c,
};
