(() => {
	const $ = (sel) => document.querySelector(sel);
	const guildInput = $('#guildInput');
	const loadBtn = $('#loadBtn');
	const tabs = document.querySelectorAll('#tabs button');
	const sections = document.querySelectorAll('.tab');

	function showTab(name) {
		tabs.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
		sections.forEach((s) => s.classList.toggle('active', s.id === name));
	}

	tabs.forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));

	loadBtn.addEventListener('click', () => loadAll(guildInput.value.trim()));

	// This page is served straight from Fastify, outside the SvelteKit app that
	// owns the login flow, so nothing here has ever sent the user through
	// OAuth. Without a `token` cookie every /api/admin call comes back 401 and
	// each panel just sat on "Loading...". Bounce to the login route instead,
	// asking for the admin scopes the /api/admin endpoints require.
	let redirecting = false;
	function login() {
		if (redirecting) return;
		redirecting = true;
		const r = encodeURIComponent(location.pathname + location.search);
		location.href = `/auth/login?r=${r}&role=admin`;
	}

	async function api(path) {
		const res = await fetch(path, { credentials: 'same-origin' });
		if (res.status === 401) {
			// `retried` guards against a redirect loop when login succeeds but the
			// token still isn't accepted — show the error rather than bouncing
			// between here and Discord forever.
			if (!sessionStorage.getItem('dashboard-auth-retried')) {
				sessionStorage.setItem('dashboard-auth-retried', '1');
				login();
				throw new Error('Not authenticated — redirecting to login...');
			}
			throw new Error(
				'Not authenticated. Sign in with an account that can manage this guild.'
			);
		}
		sessionStorage.removeItem('dashboard-auth-retried');
		if (res.status === 403) throw new Error('You are not an administrator of this guild.');
		if (!res.ok) throw new Error(await res.text());
		return res.json();
	}

	async function loadAll(guildId) {
		if (!guildId) return alert('Provide a guild id');
		await Promise.all([
			loadAnalytics(guildId),
			loadFeedback(guildId),
			loadTickets(guildId),
			loadCategories(guildId),
			loadSettings(guildId),
			loadTranscripts(guildId)
		]);
	}

	async function loadAnalytics(guildId) {
		const el = $('#analytics');
		el.innerHTML = 'Loading analytics...';
		try {
			const data = await api(`/api/admin/guilds/${guildId}/analytics`);
			// Helper: ms -> human
			const msToTime = (ms) => {
				if (!ms && ms !== 0) return 'N/A';
				const s = Math.round(ms / 1000);
				const m = Math.floor(s / 60);
				const sec = s % 60;
				return m ? `${m}m ${sec}s` : `${sec}s`;
			};

			// Summary
			const summaryHtml = `<div class="grid"><div class="card"><h3>Summary</h3><div class="item">Total tickets: <b>${data.summary.total}</b></div><div class="item">Open: ${data.summary.open} Closed: ${data.summary.closed}</div><div class="item">Avg response: <b>${msToTime(data.summary.avgResponseTimeMs)}</b></div><div class="item">Avg resolution: <b>${msToTime(data.summary.avgResolutionTimeMs)}</b></div></div>`;
			// Priority breakdown
			const priority = Object.entries(data.priorityBreakdown || {})
				.map(([k, v]) => `<div class="item">${k}: <b>${v}</b></div>`)
				.join('');
			const priHtml = `<div class="card"><h3>Priority</h3>${priority}</div>`;
			// Tickets per day simple sparkline (SVG)
			const days = data.ticketsPerDay || [];
			let spark = '<div class="card"><h3>Tickets Per Day</h3>';
			if (days.length) {
				const vals = days.map((d) => d.count);
				const w = Math.max(300, vals.length * 6);
				const h = 80;
				const max = Math.max(...vals);
				const points = vals
					.map((v, i) => `${(i / (vals.length - 1 || 1)) * w},${h - (v / max || 0) * h}`)
					.join(' ');
				spark += `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="#06b6d4" stroke-width="2" points="${points}"/></svg>`;
			} else {
				spark += '<div class="small">No data</div>';
			}
			spark += '</div>';

			// Assignees
			const assignees = (data.assigneeStats || [])
				.map(
					(a) =>
						`<div class="item">${escapeHtml(String(a.userId || 'unknown'))} — closed: <b>${a.closed || 0}</b> claimed: ${a.claimed || 0} avg res: ${msToTime(a.avgResolutionTimeMs)}</div>`
				)
				.join('');
			const assHtml = `<div class="card"><h3>Assignees</h3>${assignees || '<div class="small">No assignee data</div>'}</div>`;

			el.innerHTML = `<div class="grid">${summaryHtml}${priHtml}${spark}${assHtml}</div>`;
		} catch (err) {
			el.innerHTML = `<div class="item small">Error: ${err.message}</div>`;
		}
	}

	let feedbackPage = 1;
	const feedbackLimit = 25;
	async function loadFeedback(guildId, page = 1) {
		feedbackPage = page;
		const el = $('#feedback');
		el.innerHTML = 'Loading feedback...';
		try {
			const data = await api(
				`/api/admin/guilds/${guildId}/feedback?limit=${feedbackLimit}&page=${page}`
			);
			if (!data.feedback.length) {
				el.innerHTML = '<div class="item small">No feedback</div>';
				return;
			}
			const items = data.feedback
				.map(
					(f) =>
						`<div class="item"><div><b>Ticket #${f.ticketNumber || f.ticketId}</b> — ${f.rating}★</div><div class="small">${escapeHtml(f.comment || '')}</div><div><button data-ticket="${f.ticketId}" class="viewFeedback">View</button></div></div>`
				)
				.join('');
			el.innerHTML = `<div class="small">Average: ${data.avgRating || 'N/A'}</div>${items}<div style="margin-top:8px"><button id="fbPrev">Prev</button> Page ${data.pagination.page}/${data.pagination.totalPages} <button id="fbNext">Next</button></div>`;
			document.getElementById('fbPrev').addEventListener('click', () => {
				if (feedbackPage > 1) loadFeedback(guildId, feedbackPage - 1);
			});
			document.getElementById('fbNext').addEventListener('click', () => {
				if (feedbackPage < data.pagination.totalPages)
					loadFeedback(guildId, feedbackPage + 1);
			});
			document.querySelectorAll('.viewFeedback').forEach((b) =>
				b.addEventListener('click', (e) => {
					const ticketId = e.currentTarget.dataset.ticket;
					showTranscriptModal(guildId, ticketId, { viewOnly: true });
				})
			);
		} catch (err) {
			el.innerHTML = `<div class="item small">Error: ${err.message}</div>`;
		}
	}

	async function loadTickets(guildId) {
		const el = $('#tickets');
		el.innerHTML = 'Loading tickets...';
		try {
			const list = await api(`/api/admin/guilds/${guildId}/tickets`);
			if (!list.length) {
				el.innerHTML = '<div class="item small">No tickets</div>';
				return;
			}
			el.innerHTML = list
				.map(
					(t) =>
						`<div class="item"><div><b>#${t.number}</b> ${t.open ? '<span class="small">(open)</span>' : '(closed)'} ${t.topic ? ' — ' + escapeHtml(t.topic) : ''}</div><div class="small">Messages: ${t.messageCount || 0}</div><div class="small">${t.transcriptUrl ? `<button data-id="${t.id}" class="openTranscript">Open Transcript</button> <a href="${t.transcriptUrl}?download=1" target="_blank">Download</a>` : ''}</div></div>`
				)
				.join('');
			document.querySelectorAll('.openTranscript').forEach((b) =>
				b.addEventListener('click', (e) => {
					const id = e.currentTarget.dataset.id;
					showTranscriptModal(guildId, id);
				})
			);
		} catch (err) {
			el.innerHTML = `<div class="item small">Error: ${err.message}</div>`;
		}
	}

	// Transcript modal viewer
	function showTranscriptModal(guildId, ticketId, opts = {}) {
		// Use the transcript API endpoint
		const url =
			`/api/admin/guilds/${guildId}/tickets/${ticketId}/transcript` +
			(opts.viewOnly ? '' : '?regen=0');
		const backdrop = document.createElement('div');
		backdrop.className = 'modal-backdrop';
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.innerHTML = `<button class="close">Close</button><iframe class="transcript-iframe" src="${url}"></iframe>`;
		backdrop.appendChild(modal);
		document.body.appendChild(backdrop);
		modal.querySelector('.close').addEventListener('click', () => backdrop.remove());
	}

	// Categories & settings
	async function loadCategories(guildId) {
		const el = document.getElementById('settings');
		const pane = document.createElement('div');
		pane.innerHTML = '<h3>Categories</h3><div id="catList">Loading categories...</div>';
		el.appendChild(pane);
		try {
			const cats = await api(`/api/admin/guilds/${guildId}/categories`);
			const list = cats
				.map(
					(c) =>
						`<div class="item"><b>${c.name}</b> <div class="small">Mode: ${c.channelMode || 'CHANNEL'} AutoAssign: ${c.autoAssign ? 'yes' : 'no'}</div><div class="small"><button data-id="${c.id}" class="editCat">Edit</button></div></div>`
				)
				.join('');
			document.getElementById('catList').innerHTML =
				list || '<div class="small">No categories</div>';
			document.querySelectorAll('.editCat').forEach((btn) =>
				btn.addEventListener('click', async (e) => {
					const id = e.currentTarget.dataset.id;
					await showCategoryEditor(guildId, id);
				})
			);
		} catch (err) {
			document.getElementById('catList').innerHTML =
				`<div class="small">Error: ${err.message}</div>`;
		}
	}

	async function showCategoryEditor(guildId, categoryId) {
		const cat = await api(`/api/admin/guilds/${guildId}/categories/${categoryId}`);
		const el = document.getElementById('settings');
		const form = document.createElement('div');
		// load all categories to populate backup selector
		let allCats = [];
		try {
			allCats = await api(`/api/admin/guilds/${guildId}/categories`);
		} catch (e) {
			allCats = [];
		}

		const backupOptions = ['<option value="">(none)</option>'].concat(
			allCats
				.filter((c) => String(c.id) !== String(categoryId))
				.map(
					(c) =>
						`<option value="${c.id}" ${cat.backupCategoryId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
				)
		);

		form.innerHTML = `<h4>Edit ${cat.name}</h4>
      <label>Name<br><input id="cat_name" value="${escapeHtml(cat.name || '')}"/></label>
      <label>Channel name template<br><input id="cat_channelName" value="${escapeHtml(cat.channelName || '')}"/></label>
      <label>Auto assign?<br><input id="cat_autoAssign" type="checkbox" ${cat.autoAssign ? 'checked' : ''}/></label>
      <label>Channel mode<br><select id="cat_channelMode"><option${cat.channelMode === 'CHANNEL' ? ' selected' : ''}>CHANNEL</option><option${cat.channelMode === 'THREAD' ? ' selected' : ''}>THREAD</option><option${cat.channelMode === 'FORUM' ? ' selected' : ''}>FORUM</option></select></label>
      <label>Backup category<br><select id="cat_backup">${backupOptions.join('')}</select></label>
      <div><button id="saveCat">Save</button> <button id="closeCat">Close</button></div>`;
		el.appendChild(form);
		document.getElementById('closeCat').addEventListener('click', () => form.remove());
		document.getElementById('saveCat').addEventListener('click', async () => {
			const payload = {
				name: document.getElementById('cat_name').value,
				channelName: document.getElementById('cat_channelName').value,
				autoAssign: document.getElementById('cat_autoAssign').checked,
				channelMode: document.getElementById('cat_channelMode').value,
				backupCategoryId: document.getElementById('cat_backup').value
					? Number(document.getElementById('cat_backup').value)
					: null
			};
			try {
				await fetch(`/api/admin/guilds/${guildId}/categories/${categoryId}`, {
					method: 'PATCH',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(payload),
					credentials: 'same-origin'
				});
				alert('Saved');
				form.remove();
				loadCategories(guildId);
			} catch (err) {
				alert('Save failed: ' + err.message);
			}
		});
	}

	function escapeHtml(s) {
		return (s || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	// Settings
	async function loadSettings(guildId) {
		const el = document.getElementById('settings');
		const pane = document.createElement('div');
		pane.innerHTML = '<h3>Guild Settings</h3><div id="settingsBox">Loading...</div>';
		el.appendChild(pane);
		try {
			const s = await api(`/api/admin/guilds/${guildId}/settings`);
			const box = document.getElementById('settingsBox');
			box.innerHTML = `<textarea id="settingsJson" style="width:100%;height:200px">${JSON.stringify(s, null, 2)}</textarea><div><button id="saveSettings">Save settings</button></div>`;
			document.getElementById('saveSettings').addEventListener('click', async () => {
				const payload = JSON.parse(document.getElementById('settingsJson').value);
				try {
					await fetch(`/api/admin/guilds/${guildId}/settings`, {
						method: 'PATCH',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(payload),
						credentials: 'same-origin'
					});
					alert('Settings saved');
				} catch (err) {
					alert('Save failed: ' + err.message);
				}
			});
		} catch (err) {
			document.getElementById('settingsBox').innerHTML =
				`<div class="small">Error: ${err.message}</div>`;
		}
	}

	// Transcripts
	async function loadTranscripts(guildId) {
		const el = document.getElementById('transcripts');
		el.innerHTML = 'Loading transcripts...';
		try {
			const list = await api(`/api/admin/guilds/${guildId}/tickets`);
			const rows = list
				.filter((t) => t.transcriptUrl)
				.map(
					(t) =>
						`<div class="item"><b>#${t.number}</b> <a href="${t.transcriptUrl}" target="_blank">Open</a> <button data-id="${t.id}" class="regen">Regenerate</button> <a href="${t.transcriptUrl}?download=1" target="_blank">Download</a></div>`
				)
				.join('');
			el.innerHTML = rows || '<div class="small">No transcripts available</div>';
			document.querySelectorAll('.regen').forEach((b) =>
				b.addEventListener('click', async (e) => {
					const id = e.currentTarget.dataset.id;
					try {
						await fetch(
							`/api/admin/guilds/${guildId}/tickets/${id}/transcript?regen=1`,
							{ credentials: 'same-origin' }
						);
						alert('Regeneration requested. Refresh tickets to see updated link.');
					} catch (err) {
						alert('Regen failed: ' + err.message);
					}
				})
			);
		} catch (err) {
			el.innerHTML = `<div class="small">Error: ${err.message}</div>`;
		}
	}

	// Expose simple keyboard shortcut: Enter on input
	guildInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') loadAll(guildInput.value.trim());
	});

	// If guild provided in querystring, load it
	const params = new URLSearchParams(location.search);
	if (params.get('guild')) {
		guildInput.value = params.get('guild');
		loadAll(params.get('guild'));
	}
})();
