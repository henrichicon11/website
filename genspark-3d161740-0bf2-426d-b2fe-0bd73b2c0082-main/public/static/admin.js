/* Admin dashboard */
(function () {
  'use strict';
  const { api, esc, toast, $, $$ } = window.DU;
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');

  api('/api/admin/stats').then((s) => {
    const L = { destinations: 'Destinations', routes: 'Routes', users: 'Users', trips: 'Saved trips', reviews_pending: 'Reviews pending', subscribers: 'Subscribers', messages: 'Messages' };
    $('#admin-stats').innerHTML = Object.entries(L).map(([k, l]) => `<div class="stat"><strong>${fmt(s[k])}</strong><span>${l}</span></div>`).join('');
  });

  // Tabs
  const loaded = {};
  $$('[data-admin-tabs] a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const pane = a.getAttribute('href').slice(1);
    $$('[data-admin-tabs] a').forEach((x) => x.classList.toggle('active', x === a));
    $$('.admin-pane').forEach((p) => (p.hidden = p.dataset.pane !== pane));
    if (!loaded[pane] && loaders[pane]) { loaded[pane] = true; loaders[pane](); }
  }));

  // Reviews
  async function loadReviews(status = 'pending') {
    const rows = await api('/api/admin/reviews?status=' + status);
    $('#admin-reviews').innerHTML = rows.length ? rows.map((r) => `
      <div class="admin-review" data-id="${r.id}">
        <div><strong>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong> ${esc(r.title || '')}
          <p class="small muted">${esc(r.author_name)} on <a href="/destinations/${esc(r.destination_slug)}" target="_blank">${esc(r.destination_name)}</a> · ${esc(r.created_at)}</p>
          <p>${esc(r.body)}</p></div>
        <div class="btn-stack">${status !== 'approved' ? '<button class="btn btn-sm btn-primary" data-set="approved">Approve</button>' : ''}${status !== 'rejected' ? '<button class="btn btn-sm btn-ghost" data-set="rejected">Reject</button>' : ''}</div>
      </div>`).join('') : '<p class="muted">Nothing here.</p>';
  }
  $('#admin-reviews').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-set]'); if (!b) return;
    const card = b.closest('[data-id]');
    await api('/api/admin/reviews/' + card.dataset.id, { method: 'PATCH', body: { status: b.dataset.set } });
    card.remove(); toast('Review ' + b.dataset.set);
  });
  $$('[data-review-status]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-review-status]').forEach((x) => x.classList.toggle('active', x === b)); loadReviews(b.dataset.reviewStatus);
  }));
  loadReviews();

  // Destinations inline edit
  $$('[data-save-dest]').forEach((b) => b.addEventListener('click', async () => {
    const tr = b.closest('tr'); const body = {};
    $$('input', tr).forEach((i) => (body[i.name] = i.type === 'checkbox' ? (i.checked ? 1 : 0) : i.value));
    try { await api('/api/admin/destinations/' + tr.dataset.dest, { method: 'PATCH', body }); toast('Saved'); } catch (err) { toast(err.message); }
  }));

  const loaders = {
    async fares() {
      const rows = await api('/api/admin/fares');
      $('#admin-fares').innerHTML = `<table class="table"><thead><tr><th>Route</th><th>Mode</th><th>Min UGX</th><th>Max UGX</th><th>Available</th><th>Updated</th><th></th></tr></thead><tbody>${rows.map((r) =>
        `<tr data-id="${r.id}"><td>${esc(r.from_name)} → ${esc(r.to_name)}</td><td>${esc(r.mode)}</td><td><input type="number" name="fare_min_ugx" value="${r.fare_min_ugx}" class="w-md" step="500"></td><td><input type="number" name="fare_max_ugx" value="${r.fare_max_ugx}" class="w-md" step="500"></td><td><input type="checkbox" name="available" ${r.available ? 'checked' : ''}></td><td class="small">${esc(String(r.updated_at).slice(0, 10))}</td><td><button class="btn btn-sm btn-primary" data-save>Save</button></td></tr>`).join('')}</tbody></table>`;
    },
    async rates() {
      const rows = await api('/api/admin/rates');
      $('#admin-rates').innerHTML = `<p class="small muted">Per-kilometre rates used to estimate fares for routes without curated data.</p><table class="table"><thead><tr><th>Mode</th><th>UGX/km min</th><th>UGX/km max</th><th></th></tr></thead><tbody>${rows.map((r) =>
        `<tr data-mode="${esc(r.mode)}"><td><i class="fa-solid ${esc(r.icon)}"></i> ${esc(r.label)}</td><td><input type="number" name="ugx_per_km_min" value="${r.ugx_per_km_min}" class="w-sm"></td><td><input type="number" name="ugx_per_km_max" value="${r.ugx_per_km_max}" class="w-sm"></td><td><button class="btn btn-sm btn-primary" data-save>Save</button></td></tr>`).join('')}</tbody></table>`;
    },
    async baselines() {
      const rows = await api('/api/admin/baselines');
      const cols = ['accommodation_ugx_min', 'accommodation_ugx_max', 'food_ugx_min', 'food_ugx_max', 'misc_ugx'];
      $('#admin-baselines').innerHTML = `<p class="small muted">Per traveller, per day/night.</p><table class="table"><thead><tr><th>Tier</th>${cols.map((c) => `<th>${c.replace(/_ugx|_/g, ' ')}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r) =>
        `<tr data-tier="${esc(r.tier)}"><td>${esc(r.label)}</td>${cols.map((c) => `<td><input type="number" name="${c}" value="${r[c]}" class="w-md" step="1000"></td>`).join('')}<td><button class="btn btn-sm btn-primary" data-save>Save</button></td></tr>`).join('')}</tbody></table>`;
    },
    async messages() {
      const rows = await api('/api/admin/messages');
      $('#admin-messages').innerHTML = rows.length ? rows.map((m) => `<div class="panel mt"><strong>${esc(m.subject || 'Message')}</strong> <span class="small muted">from ${esc(m.name || '')} &lt;<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>&gt; · ${esc(m.created_at)}</span><p>${esc(m.message)}</p></div>`).join('') : '<p class="muted">No messages.</p>';
    },
    async users() {
      const rows = await api('/api/admin/users');
      $('#admin-users').innerHTML = `<table class="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Country</th><th>Joined</th></tr></thead><tbody>${rows.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.role)}</td><td>${esc(u.country || '')}</td><td>${esc(String(u.created_at).slice(0, 10))}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  // Delegate saves for dynamic tables
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-save]'); if (!b) return;
    const tr = b.closest('tr'); const body = {};
    $$('input', tr).forEach((i) => (body[i.name] = i.type === 'checkbox' ? (i.checked ? 1 : 0) : i.value));
    const url = tr.dataset.id ? '/api/admin/fares/' + tr.dataset.id : tr.dataset.mode ? '/api/admin/rates/' + tr.dataset.mode : '/api/admin/baselines/' + tr.dataset.tier;
    try { await api(url, { method: 'PATCH', body }); toast('Saved'); } catch (err) { toast(err.message); }
  });
})();
