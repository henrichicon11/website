/* Transport cost estimator */
(function () {
  'use strict';
  const { api, esc, Currency, $ } = window.DU;
  const form = $('#transport-form');
  const out = $('#transport-result');
  const from = $('#t-from'), to = $('#t-to'), trav = $('#t-trav');
  let last = null;
  let routeMap = null;

  document.addEventListener('du:places', () => {
    from.value = form.dataset.from || 'kampala';
    if (form.dataset.to) { to.value = form.dataset.to; run(); } else { to.value = 'jinja'; }
  });

  $('#t-swap').addEventListener('click', () => { const a = from.value; from.value = to.value; to.value = a; });
  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  document.addEventListener('du:currency', () => last && render(last));

  async function run() {
    if (from.value === to.value) { out.innerHTML = '<p class="form-msg err">Choose two different places.</p>'; return; }
    out.innerHTML = '<div class="skeleton"></div>';
    const params = new URLSearchParams({ from: from.value, to: to.value, travelers: trav.value || '1' });
    history.replaceState(null, '', '/transport?' + params);
    try { last = await api('/api/transport/estimate?' + params); render(last); }
    catch (err) { out.innerHTML = `<p class="form-msg err">${esc(err.message)}</p>`; }
  }

  const hrs = (a, b) => {
    const f = (h) => h < 1 ? Math.round(h * 60) + ' min' : (Math.floor(h) + 'h' + (Math.round((h % 1) * 60) ? ' ' + Math.round((h % 1) * 60) + 'm' : ''));
    return Math.abs(a - b) < .05 ? f(a) : f(a) + '–' + f(b);
  };
  const CONF = { curated: 'Curated route', combined: 'Combined from known legs', estimated: 'Estimated' };

  function render(r) {
    const rec = r.options.filter((o) => o.recommended && o.recommended.length);
    out.innerHTML = `
      <div class="route-summary">
        <div class="panel">
          <div class="route-head">${esc(r.from.name)} <i class="fa-solid fa-arrow-right"></i> ${esc(r.to.name)}</div>
          <span class="confidence confidence-${r.confidence}">${CONF[r.confidence]}</span>
          <div class="route-stats">
            <div><span>Distance</span><strong>${r.distance_km} km</strong></div>
            <div><span>Road time</span><strong>${hrs(r.duration_hours_min, r.duration_hours_max)}</strong></div>
            <div><span>Road</span><strong>${esc(r.road_quality)}</strong></div>
            <div><span>Transfers (public)</span><strong>${r.transfers}</strong></div>
          </div>
          ${r.waypoints && r.waypoints.length ? `<div class="waypoints">${r.waypoints.map((w) => `<span>${esc(w)}</span>`).join('<i class="fa-solid fa-chevron-right"></i>')}</div>` : ''}
          ${r.description ? `<p class="small">${esc(r.description)}</p>` : ''}
          ${r.alt ? `<details class="small"><summary><strong>Alternative route</strong> · ${r.alt.distance_km} km</summary><div class="waypoints">${r.alt.waypoints.map((w) => `<span>${esc(w)}</span>`).join('<i class="fa-solid fa-chevron-right"></i>')}</div><p>${esc(r.alt.note || '')}</p></details>` : ''}
        </div>
        <div id="route-map" class="route-map panel"></div>
      </div>
      ${rec.length ? `<p class="small"><strong>Quick picks:</strong> ${[['cheapest', r.cheapest], ['fastest', r.fastest], ['most comfortable', r.most_comfortable]].map(([k, m]) => { const o = r.options.find((x) => x.mode === m); return o ? `${k}: <strong>${esc(o.label)}</strong>` : ''; }).filter(Boolean).join(' · ')}</p>` : ''}
      <div class="options-grid">
        ${r.options.map((o) => `
          <div class="option-card${o.recommended.length ? ' is-rec' : ''}">
            <div class="option-head"><i class="fa-solid ${esc(o.icon)}"></i><div><h4>${esc(o.label)}</h4><span class="comfort" title="Comfort ${o.comfort}/5">${'★'.repeat(o.comfort)}${'☆'.repeat(5 - o.comfort)}</span></div></div>
            ${o.recommended.length ? `<div class="rec-tags">${o.recommended.map((t) => `<span class="rec-tag">${esc(t)}</span>`).join('')}</div>` : ''}
            <div class="option-price">${Currency.range(o.fare_min_ugx, o.fare_max_ugx)}</div>
            <div class="small muted">${o.per_person ? 'per person' : 'whole vehicle'}${o.per_person && r.travelers > 1 ? ` · <strong>${Currency.range(o.total_min_ugx, o.total_max_ugx)}</strong> for ${r.travelers}` : ''}${!o.per_person && r.travelers > 1 ? ` · ≈ ${Currency.range(o.total_min_ugx / r.travelers, o.total_max_ugx / r.travelers)} each` : ''}</div>
            <div class="option-meta"><span><i class="fa-regular fa-clock"></i> ${hrs(o.duration_hours_min, o.duration_hours_max)}</span><span class="confidence confidence-${o.source === 'curated' ? 'curated' : 'estimated'}">${o.source}</span></div>
            ${o.notes ? `<p class="small">${esc(o.notes)}</p>` : ''}
          </div>`).join('')}
      </div>
      <p class="small muted mt">Updated using the latest configured fares and per-km rates. ${esc(r.disclaimer || '')}</p>`;
    drawMap(r);
  }

  function drawMap(r) {
    const el = $('#route-map'); if (!el || !window.L) { if (el) el.remove(); return; }
    routeMap && routeMap.remove();
    routeMap = L.map(el, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(routeMap);
    const a = [r.from.latitude, r.from.longitude], b = [r.to.latitude, r.to.longitude];
    L.marker(a).addTo(routeMap).bindTooltip(r.from.name, { permanent: true, direction: 'top' });
    L.marker(b).addTo(routeMap).bindTooltip(r.to.name, { permanent: true, direction: 'top' });
    L.polyline([a, b], { color: '#155a42', weight: 3, dashArray: '8 6' }).addTo(routeMap);
    routeMap.fitBounds([a, b], { padding: [40, 40] });
  }

  // Popular routes table
  api('/api/transport/routes').then((rows) => {
    const top = rows.slice(0, 30);
    $('#route-table').innerHTML = `<table class="table"><thead><tr><th>Route</th><th>Distance</th><th>Time</th><th>Road</th><th>Public fare from</th><th></th></tr></thead><tbody>${top.map((r) =>
      `<tr><td>${esc(r.from_name)} → ${esc(r.to_name)}</td><td>${r.distance_km} km</td><td>${hrs(r.duration_hours_min, r.duration_hours_max)}</td><td>${esc(r.road_quality)}</td><td>${r.fare_from ? `<span class="money" data-ugx="${r.fare_from}">${Currency.fmt(r.fare_from)}</span>` : '—'}</td><td><a href="/transport?from=${esc(r.from_slug)}&to=${esc(r.to_slug)}" data-route>Compare</a></td></tr>`).join('')}</tbody></table>`;
  }).catch(() => { $('#route-table').innerHTML = '<p class="muted">Routes unavailable.</p>'; });

  // Leaflet is only loaded on demand for this page
  if (!window.L) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = () => last && drawMap(last); document.head.appendChild(s);
  }
})();
