/* Trip planner & budget calculator */
(function () {
  'use strict';
  const { api, esc, Currency, toast, $, $$ } = window.DU;
  const root = $('#planner');
  const stopsEl = $('#p-stops'), empty = $('#p-empty'), result = $('#p-result');
  const state = { id: null, stops: [], dests: [], details: {} };
  let lastEstimate = null, timer = null;

  const tier = () => ($('input[name=tier]:checked') || {}).value || 'standard';

  function payload() {
    return {
      start_place: $('#p-start').value || 'kampala',
      tier: tier(),
      travelers: +$('#p-trav').value || 1,
      resident: $('#p-res').value,
      return_to_start: $('#p-return').checked,
      stops: state.stops.map((s) => ({ destination_slug: s.slug, nights: s.nights, activity_slugs: s.acts }))
    };
  }

  async function details(slug) {
    if (!state.details[slug]) state.details[slug] = await api('/api/destinations/' + encodeURIComponent(slug));
    return state.details[slug];
  }

  async function addStop(slug, nights, acts) {
    if (!slug) return;
    try {
      const d = await details(slug);
      state.stops.push({ slug, nights: nights ?? Math.max(1, d.recommended_days - 1 || 1), acts: acts || [] });
      renderStops(); schedule();
    } catch { toast('Could not load that destination'); }
  }

  function renderStops() {
    empty.hidden = state.stops.length > 0;
    stopsEl.innerHTML = state.stops.map((s, i) => {
      const d = state.details[s.slug]; if (!d) return '';
      return `<li class="stop" data-i="${i}">
        <img src="${esc((d.card_image || '').replace('width=2560', 'width=200'))}" alt="">
        <div>
          <h4><a href="/destinations/${esc(d.slug)}" target="_blank" rel="noopener">${esc(d.name)}</a></h4>
          <label class="stop-nights">Nights <input type="number" min="0" max="30" value="${s.nights}" data-nights></label>
          <div class="stop-acts">${(d.activities || []).map((a) => `<label class="chip chip-check chip-sm"><input type="checkbox" value="${esc(a.slug)}" ${s.acts.includes(a.slug) ? 'checked' : ''} data-act> ${esc(a.name)}${a.cost_ugx_min ? ` · <span class="money" data-ugx="${a.cost_ugx_min}" data-short="1">${Currency.fmt(a.cost_ugx_min, true)}</span>` : ''}</label>`).join('')}</div>
        </div>
        <div class="stop-controls">
          <button class="icon-btn" data-up aria-label="Move up" ${i === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
          <button class="icon-btn" data-down aria-label="Move down" ${i === state.stops.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
          <button class="icon-btn" data-remove aria-label="Remove"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </li>`;
    }).join('');
  }

  stopsEl.addEventListener('click', (e) => {
    const li = e.target.closest('.stop'); if (!li) return;
    const i = +li.dataset.i;
    if (e.target.closest('[data-remove]')) state.stops.splice(i, 1);
    else if (e.target.closest('[data-up]') && i > 0) [state.stops[i - 1], state.stops[i]] = [state.stops[i], state.stops[i - 1]];
    else if (e.target.closest('[data-down]') && i < state.stops.length - 1) [state.stops[i + 1], state.stops[i]] = [state.stops[i], state.stops[i + 1]];
    else return;
    renderStops(); schedule();
  });
  stopsEl.addEventListener('change', (e) => {
    const li = e.target.closest('.stop'); if (!li) return;
    const s = state.stops[+li.dataset.i];
    if (e.target.matches('[data-nights]')) s.nights = Math.max(0, Math.min(30, +e.target.value || 0));
    if (e.target.matches('[data-act]')) s.acts = $$('[data-act]:checked', li).map((x) => x.value);
    schedule();
  });

  function schedule() { clearTimeout(timer); timer = setTimeout(estimate, 250); }

  async function estimate() {
    if (!state.stops.length) { result.innerHTML = '<p class="muted">Add a destination to see your estimate.</p>'; lastEstimate = null; return; }
    result.innerHTML = '<div class="skeleton"></div>';
    try { lastEstimate = await api('/api/planner/estimate', { method: 'POST', body: payload() }); renderEstimate(lastEstimate); }
    catch (err) { result.innerHTML = `<p class="form-msg err">${esc(err.message)}</p>`; }
  }

  const KIND = { transport: 'Transport', fees: 'Entry fees', activities: 'Activities', accommodation: 'Accommodation', food: 'Food', misc: 'Misc' };
  function renderEstimate(r) {
    const max = Math.max(...Object.values(r.by_kind).map((k) => k.max), 1);
    result.innerHTML = `
      <div class="cost-total"><span>${esc(r.tier_label)} · ${r.days} days / ${r.nights} nights · ${r.travelers} traveller${r.travelers > 1 ? 's' : ''}</span>
        <strong>${Currency.range(r.total_min, r.total_max, true)}</strong>
        <span>${Currency.range(r.per_person_min, r.per_person_max, true)} per person · ${Currency.range(r.per_day_min, r.per_day_max, true)} per day</span></div>
      <div class="cost-bars">${Object.entries(r.by_kind).map(([k, v]) => `<div class="cost-bar"><span>${KIND[k] || k}</span><div><span style="width:${Math.round((v.max / max) * 100)}%"></span></div><small>${Math.round((v.max / r.total_max) * 100)}%</small></div>`).join('')}</div>
      <ul class="cost-lines">${r.lines.map((l) => `<li><span>${esc(l.label)}</span><span>${Currency.range(l.min, l.max, true)}</span></li>`).join('')}</ul>
      <details class="small"><summary>Route details</summary><ol>${r.stops.map((s) => `<li><strong>${esc(s.destination)}</strong> — ${s.nights} night(s)${s.distance_km ? ` · ${s.distance_km} km by ${esc(s.transport)} (${esc(s.travel_time)})` : ''}${s.activities.length ? `<br><small>${s.activities.map(esc).join(', ')}</small>` : ''}</li>`).join('')}</ol></details>`;
  }

  // Destination picker
  api('/api/destinations?limit=100&sort=name').then((r) => {
    state.dests = r.items;
    $('#p-add').innerHTML = '<option value="">Choose a destination to add…</option>' + r.items.map((d) => `<option value="${esc(d.slug)}">${esc(d.name)}</option>`).join('');
  });
  $('#p-add-btn').addEventListener('click', () => { const v = $('#p-add').value; if (v) { addStop(v); $('#p-add').value = ''; } });
  $('#p-add').addEventListener('change', (e) => { if (e.target.value) { addStop(e.target.value); e.target.value = ''; } });
  ['#p-trav', '#p-res', '#p-return', '#p-start'].forEach((s) => $(s).addEventListener('change', schedule));
  $$('input[name=tier]').forEach((i) => i.addEventListener('change', schedule));
  document.addEventListener('du:currency', () => { lastEstimate && renderEstimate(lastEstimate); renderStops(); });

  // Load from URL
  async function boot() {
    const trip = root.dataset.trip;
    if (trip) {
      try {
        const t = JSON.parse(atob(decodeURIComponent(trip)));
        state.id = t.id || null;
        if (t.title) $('#p-title').value = t.title;
        if (t.travelers) $('#p-trav').value = t.travelers;
        if (t.resident) $('#p-res').value = t.resident;
        if (t.tier) { const r = $(`input[name=tier][value="${t.tier}"]`); if (r) r.checked = true; }
        if (t.return_to_start === false) $('#p-return').checked = false;
        if (t.start_place) $('#p-start').dataset.value = t.start_place;
        for (const s of t.stops || []) {
          await details(s.destination_slug).catch(() => null);
          if (state.details[s.destination_slug]) state.stops.push({ slug: s.destination_slug, nights: s.nights ?? 1, acts: s.activity_slugs || [] });
        }
        renderStops(); schedule();
      } catch { toast('Could not read that trip link'); }
    }
    if (root.dataset.add) await addStop(root.dataset.add);
  }
  boot();

  const shareLink = () => location.origin + '/planner?trip=' + encodeURIComponent(btoa(JSON.stringify({ ...payload(), title: $('#p-title').value })));
  $('#p-share').addEventListener('click', async () => {
    if (!state.stops.length) return toast('Add a destination first');
    await navigator.clipboard.writeText(shareLink()); toast('Share link copied');
  });
  $('#p-print').addEventListener('click', () => window.print());
  $('#p-save').addEventListener('click', async () => {
    if (!state.stops.length) return toast('Add a destination first');
    if (document.body.dataset.signedIn !== '1') {
      sessionStorage.setItem('du_pending_trip', shareLink());
      location.href = '/login?next=' + encodeURIComponent('/planner?trip=' + encodeURIComponent(btoa(JSON.stringify({ ...payload(), title: $('#p-title').value }))));
      return;
    }
    const p = payload();
    try {
      const r = await api('/api/trips', { method: 'POST', body: { id: state.id, title: $('#p-title').value, tier: p.tier, travelers: p.travelers, payload: p, summary: lastEstimate ? { total_min: lastEstimate.total_min, total_max: lastEstimate.total_max, days: lastEstimate.days } : {} } });
      state.id = r.id; toast('Trip saved to your account');
    } catch (err) { toast(err.message); }
  });
})();
