/* Interactive destinations map */
(async function () {
  'use strict';
  const { api, esc, $, $$ } = window.DU;
  const COLORS = {
    'national-parks': '#155a42', waterfalls: '#1f78b4', lakes: '#2b8cbe', mountains: '#6b4f2f', 'cultural-sites': '#8e44ad',
    wildlife: '#b35806', adventure: '#c8412c', islands: '#00897b', cities: '#37474f', historical: '#7b5e2e', forests: '#2e7d32', birding: '#c98c17'
  };
  const map = L.map('map', { zoomControl: true }).setView([1.37, 32.3], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(map);

  const data = await api('/api/map');
  const iconOf = Object.fromEntries(data.categories.map((c) => [c.slug, c.icon]));
  const markers = new Map();
  const bounds = [];
  for (const p of data.points) {
    const primary = p.categories[0] || 'national-parks';
    const icon = L.divIcon({
      className: '', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
      html: `<div class="map-pin" style="background:${COLORS[primary] || '#155a42'}"><i class="fa-solid ${iconOf[primary] || 'fa-location-dot'}"></i></div>`
    });
    const m = L.marker([p.latitude, p.longitude], { icon, title: p.name, alt: p.name });
    m.bindPopup(`<div class="map-popup">${p.card_image ? `<img src="${esc(p.card_image.replace('width=2560', 'width=500'))}" alt="">` : ''}<h4>${esc(p.name)}</h4><p>${esc(p.tagline || '')}</p>
      <p><i class="fa-solid fa-route"></i> ${p.distance_from_kampala_km ? Math.round(p.distance_from_kampala_km) + ' km from Kampala' : 'Kampala'} · <i class="fa-regular fa-sun"></i> ${esc(p.best_time || '')}</p>
      ${p.entry_fee_foreign_usd ? `<p><i class="fa-solid fa-ticket"></i> Entry USD ${Math.round(p.entry_fee_foreign_usd)}</p>` : ''}
      <a href="/destinations/${esc(p.slug)}">View destination →</a> · <a href="/transport?from=kampala&to=${esc(p.slug)}">Transport</a></div>`);
    m.addTo(map);
    markers.set(p.slug, { m, p });
    bounds.push([p.latitude, p.longitude]);
  }
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });

  const list = $('#map-list');
  function render() {
    const q = $('#map-search').value.trim().toLowerCase();
    const region = $('#map-region').value;
    const cats = $$('#map-filters input:checked').map((i) => i.value);
    const shown = [];
    for (const { m, p } of markers.values()) {
      const ok = (!q || p.name.toLowerCase().includes(q)) && (!region || p.region === region) && (!cats.length || cats.some((c) => p.categories.includes(c)));
      if (ok) { if (!map.hasLayer(m)) m.addTo(map); shown.push(p); } else if (map.hasLayer(m)) map.removeLayer(m);
    }
    list.innerHTML = `<p class="small muted">${shown.length} destination${shown.length === 1 ? '' : 's'}</p>` + shown.map((p) =>
      `<button class="map-item" data-slug="${esc(p.slug)}"><img src="${esc((p.card_image || '').replace('width=2560', 'width=200'))}" alt="" loading="lazy"><div><strong>${esc(p.name)}</strong><span>${p.distance_from_kampala_km ? Math.round(p.distance_from_kampala_km) + ' km from Kampala' : 'Capital city'}</span></div></button>`).join('');
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.map-item'); if (!b) return;
    const { m } = markers.get(b.dataset.slug);
    map.flyTo(m.getLatLng(), 10, { duration: .8 }); setTimeout(() => m.openPopup(), 850);
    $$('.map-item', list).forEach((x) => x.classList.toggle('active', x === b));
    if (innerWidth < 800) document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
  });
  $('#map-search').addEventListener('input', render);
  $('#map-region').addEventListener('change', render);
  $$('#map-filters input').forEach((i) => i.addEventListener('change', render));
  render();

  // Transport routes overlay
  let routeLayer = null;
  $('#map-routes').addEventListener('change', async (e) => {
    if (!e.target.checked) { routeLayer && map.removeLayer(routeLayer); return; }
    if (!routeLayer) {
      const [routes, places] = await Promise.all([api('/api/transport/routes'), api('/api/places')]);
      const P = Object.fromEntries(places.map((p) => [p.slug, p]));
      routeLayer = L.layerGroup(routes.filter((r) => P[r.from_slug] && P[r.to_slug]).map((r) =>
        L.polyline([[P[r.from_slug].latitude, P[r.from_slug].longitude], [P[r.to_slug].latitude, P[r.to_slug].longitude]], {
          color: r.road_quality === 'tarmac' ? '#155a42' : '#c98c17', weight: 2.5, opacity: .7, dashArray: r.road_quality === 'tarmac' ? null : '6 6'
        }).bindTooltip(`${r.from_name} → ${r.to_name}: ${r.distance_km} km (${r.road_quality})`)));
    }
    routeLayer.addTo(map);
  });
})();
