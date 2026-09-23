/* Discover Uganda — shared client behaviour */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(url, opts = {}) {
    const init = { credentials: 'same-origin', headers: {}, ...opts };
    if (opts.body && typeof opts.body !== 'string' && !(opts.body instanceof FormData)) {
      init.body = JSON.stringify(opts.body);
      init.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, init);
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) { const e = new Error((data && data.error) || 'Request failed'); e.status = res.status; throw e; }
    return data;
  }

  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800);
  }

  // ---------- Currency ----------
  const SYMBOL = { UGX: 'UGX ', USD: '$', EUR: '€', GBP: '£', KES: 'KES ' };
  const Currency = {
    code: localStorage.getItem('du_currency') || 'UGX',
    rates: null,
    async load() {
      try {
        const cached = JSON.parse(sessionStorage.getItem('du_fx') || 'null');
        if (cached && Date.now() - cached.t < 3600e3) { this.rates = cached.r; return; }
        const fx = await api('/api/fx');
        this.rates = fx.rates;
        sessionStorage.setItem('du_fx', JSON.stringify({ t: Date.now(), r: fx.rates }));
      } catch { this.rates = { USD: 0.000266, EUR: 0.000246, GBP: 0.000208, KES: 0.0343 }; }
    },
    convert(ugx) { if (this.code === 'UGX' || !this.rates) return ugx; return ugx * (this.rates[this.code] || 0); },
    fmt(ugx, short) {
      if (ugx == null || isNaN(ugx)) return '—';
      const v = this.convert(Number(ugx));
      const sym = this.code === 'UGX' ? 'UGX ' : SYMBOL[this.code];
      if (short && this.code === 'UGX') {
        if (v >= 1e6) return sym + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
        if (v >= 1e3) return sym + Math.round(v / 1e3) + 'k';
      }
      const digits = this.code === 'UGX' || this.code === 'KES' || v >= 100 ? 0 : 2;
      const rounded = this.code === 'UGX' ? Math.round(v / 100) * 100 : v;
      return sym + rounded.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
    },
    range(min, max, short) {
      if (max == null || Number(max) === Number(min)) return this.fmt(min, short);
      const a = this.fmt(min, short), b = this.fmt(max, short);
      const sym = this.code === 'UGX' ? 'UGX ' : SYMBOL[this.code];
      return a + ' – ' + b.replace(sym, '');
    },
    apply(root = document) {
      $$('.money[data-ugx]', root).forEach((el) => {
        el.textContent = this.range(Number(el.dataset.ugx), el.dataset.ugxMax != null ? Number(el.dataset.ugxMax) : null, el.dataset.short === '1');
      });
    }
  };
  window.DU = { api, toast, esc, Currency, $, $$ };

  const sel = $('[data-currency]');
  if (sel) {
    sel.value = Currency.code;
    sel.addEventListener('change', () => {
      Currency.code = sel.value; localStorage.setItem('du_currency', sel.value);
      Currency.apply(); document.dispatchEvent(new CustomEvent('du:currency'));
    });
  }
  Currency.load().then(() => { if (Currency.code !== 'UGX') Currency.apply(); document.dispatchEvent(new CustomEvent('du:fx-ready')); });

  // ---------- Nav ----------
  const toggle = $('[data-nav-toggle]');
  if (toggle) toggle.addEventListener('click', () => {
    const nav = $('#main-nav'); const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // ---------- Hero slideshow ----------
  const hero = $('[data-hero-slides]');
  if (hero && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const slides = JSON.parse(hero.dataset.heroSlides); let i = 0; const bg = $('.hero-bg', hero);
    slides.slice(1).forEach((s) => { const im = new Image(); im.src = s; });
    setInterval(() => {
      i = (i + 1) % slides.length; bg.style.opacity = '0';
      setTimeout(() => { bg.style.backgroundImage = `url('${slides[i]}')`; bg.style.opacity = '1'; }, 600);
    }, 7000);
  }

  // ---------- Search ----------
  const overlay = $('#search-overlay'); const input = $('#global-search'); const results = $('#search-results');
  function openSearch() { overlay.hidden = false; setTimeout(() => input.focus(), 30); }
  function closeSearch() { overlay.hidden = true; }
  $$('[data-open-search]').forEach((b) => b.addEventListener('click', openSearch));
  $$('[data-close-search]').forEach((b) => b.addEventListener('click', closeSearch));
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.hidden) closeSearch();
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  let st;
  if (input) input.addEventListener('input', () => {
    clearTimeout(st);
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = '<p class="muted">Keep typing…</p>'; return; }
    st = setTimeout(async () => {
      try {
        const r = await api('/api/search?q=' + encodeURIComponent(q));
        let h = '';
        if (r.destinations.length) h += '<h5>Destinations</h5>' + r.destinations.map((d) => `<a class="search-hit" href="/destinations/${esc(d.slug)}"><img src="${esc(d.card_image)}" alt="" loading="lazy"><div>${esc(d.name)}<small>${esc(d.tagline)}</small></div></a>`).join('');
        if (r.guides.length) h += '<h5>Guides</h5>' + r.guides.map((g) => `<a class="search-hit" href="/guides/${esc(g.slug)}"><i class="fa-solid ${esc(g.icon)}"></i><div>${esc(g.title)}<small>${esc(g.excerpt)}</small></div></a>`).join('');
        if (r.itineraries.length) h += '<h5>Itineraries</h5>' + r.itineraries.map((i) => `<a class="search-hit" href="/itineraries/${esc(i.slug)}"><i class="fa-solid fa-route"></i><div>${esc(i.title)}<small>${i.days} days</small></div></a>`).join('');
        results.innerHTML = h || `<p class="muted">No results for "${esc(q)}". <a href="/destinations?q=${encodeURIComponent(q)}">Search all destinations</a></p>`;
      } catch { results.innerHTML = '<p class="muted">Search is unavailable right now.</p>'; }
    }, 180);
  });
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') location.href = '/destinations?q=' + encodeURIComponent(input.value.trim()); });

  // ---------- Favourites ----------
  const favBtns = $$('[data-fav]');
  function setFav(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    const i = $('i', btn); if (i) i.className = on ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const s = $('span', btn); if (s) s.textContent = on ? ' Saved' : ' Save';
  }
  if (favBtns.length && document.body.dataset.signedIn === '1') {
    api('/api/favorites/slugs').then((r) => {
      const map = { destination: r.destinations, guide: r.guides, itinerary: r.itineraries };
      favBtns.forEach((b) => setFav(b, (map[b.dataset.fav] || []).includes(b.dataset.slug)));
    }).catch(() => {});
  }
  favBtns.forEach((b) => b.addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (document.body.dataset.signedIn !== '1') { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
    try {
      const r = await api('/api/favorites', { method: 'POST', body: { kind: b.dataset.fav, slug: b.dataset.slug } });
      $$(`[data-fav="${b.dataset.fav}"][data-slug="${b.dataset.slug}"]`).forEach((x) => setFav(x, r.saved));
      toast(r.saved ? 'Saved to your favourites' : 'Removed from favourites');
    } catch (err) { toast(err.message); }
  }));

  // ---------- Generic AJAX forms ----------
  $$('form[data-ajax-form]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('.form-msg', f); const btn = $('button[type=submit]', f);
    const data = Object.fromEntries(new FormData(f).entries());
    btn && (btn.disabled = true);
    try {
      const r = await api(f.action, { method: 'POST', body: data });
      if (msg) { msg.textContent = r.message || 'Done!'; msg.className = 'form-msg ok'; }
      f.reset();
    } catch (err) { if (msg) { msg.textContent = err.message; msg.className = 'form-msg err'; } }
    finally { btn && (btn.disabled = false); }
  }));

  // ---------- Auth ----------
  $$('form[data-auth-form]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('.form-msg', f); const btn = $('button[type=submit]', f);
    btn.disabled = true; msg.textContent = '';
    try {
      await api(f.getAttribute('action'), { method: 'POST', body: Object.fromEntries(new FormData(f).entries()) });
      location.href = f.dataset.next || '/account';
    } catch (err) { msg.textContent = err.message; msg.className = 'form-msg err'; btn.disabled = false; }
  }));
  $$('[data-logout]').forEach((b) => b.addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = '/'; }));
  $$('[data-delete-trip]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Delete this saved trip?')) return;
    await api('/api/trips/' + b.dataset.deleteTrip, { method: 'DELETE' });
    b.closest('[data-trip-id]').remove(); toast('Trip deleted');
  }));

  // ---------- Filters auto-submit on select change ----------
  $$('form[data-autosubmit] select').forEach((s) => s.addEventListener('change', () => s.form.submit()));

  // ---------- Places selects (shared) ----------
  const placeSelects = $$('[data-places-select]');
  if (placeSelects.length) {
    api('/api/places').then((places) => {
      window.DU.places = places;
      const hubs = places.filter((p) => p.kind === 'town');
      const dests = places.filter((p) => p.kind !== 'town');
      const opts = `<optgroup label="Towns & hubs">${hubs.map((p) => `<option value="${esc(p.slug)}">${esc(p.name)}</option>`).join('')}</optgroup>` +
        `<optgroup label="Parks & attractions">${dests.map((p) => `<option value="${esc(p.slug)}">${esc(p.name)}</option>`).join('')}</optgroup>`;
      placeSelects.forEach((s) => {
        const want = s.dataset.value || s.dataset.default || '';
        s.innerHTML = opts;
        if (want && places.some((p) => p.slug === want)) s.value = want;
        s.dispatchEvent(new CustomEvent('du:places-ready', { bubbles: true }));
      });
      document.dispatchEvent(new CustomEvent('du:places', { detail: places }));
    }).catch(() => {});
  }

  // ---------- Share ----------
  $$('[data-share]').forEach((b) => b.addEventListener('click', async () => {
    const data = { title: document.title, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else { await navigator.clipboard.writeText(location.href); toast('Link copied'); }
  }));

  // ---------- Scrollspy tabs ----------
  const spy = $('[data-scrollspy]');
  if (spy && 'IntersectionObserver' in window) {
    const links = $$('a', spy);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach((l) => { const t = $(l.getAttribute('href')); if (t) io.observe(t); });
  }

  // ---------- Lightbox ----------
  $$('[data-lightbox-group]').forEach((group) => {
    const items = $$('[data-lightbox]', group);
    items.forEach((a, idx) => a.addEventListener('click', (e) => {
      e.preventDefault(); let i = idx;
      const lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
      lb.innerHTML = '<button class="lb-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button><button class="lb-prev" aria-label="Previous"><i class="fa-solid fa-chevron-left"></i></button><img alt=""><p></p><button class="lb-next" aria-label="Next"><i class="fa-solid fa-chevron-right"></i></button>';
      const img = $('img', lb), cap = $('p', lb);
      const show = () => { img.src = items[i].href; img.alt = items[i].dataset.caption || ''; cap.textContent = items[i].dataset.caption || ''; };
      const close = () => { lb.remove(); document.removeEventListener('keydown', key); a.focus(); };
      const key = (ev) => { if (ev.key === 'Escape') close(); if (ev.key === 'ArrowRight') { i = (i + 1) % items.length; show(); } if (ev.key === 'ArrowLeft') { i = (i - 1 + items.length) % items.length; show(); } };
      $('.lb-close', lb).onclick = close;
      $('.lb-next', lb).onclick = () => { i = (i + 1) % items.length; show(); };
      $('.lb-prev', lb).onclick = () => { i = (i - 1 + items.length) % items.length; show(); };
      lb.addEventListener('click', (ev) => { if (ev.target === lb) close(); });
      document.addEventListener('keydown', key);
      document.body.appendChild(lb); show(); $('.lb-close', lb).focus();
    }));
  });

  // ---------- Weather ----------
  const W = { 0: ['Clear', 'fa-sun'], 1: ['Mainly clear', 'fa-sun'], 2: ['Partly cloudy', 'fa-cloud-sun'], 3: ['Overcast', 'fa-cloud'], 45: ['Fog', 'fa-smog'], 48: ['Fog', 'fa-smog'], 51: ['Drizzle', 'fa-cloud-rain'], 53: ['Drizzle', 'fa-cloud-rain'], 55: ['Drizzle', 'fa-cloud-rain'], 61: ['Light rain', 'fa-cloud-rain'], 63: ['Rain', 'fa-cloud-showers-heavy'], 65: ['Heavy rain', 'fa-cloud-showers-heavy'], 80: ['Showers', 'fa-cloud-sun-rain'], 81: ['Showers', 'fa-cloud-showers-heavy'], 82: ['Heavy showers', 'fa-cloud-showers-heavy'], 95: ['Thunderstorm', 'fa-cloud-bolt'], 96: ['Thunderstorm', 'fa-cloud-bolt'], 99: ['Thunderstorm', 'fa-cloud-bolt'] };
  const wx = (c) => W[c] || ['—', 'fa-cloud'];
  $$('[data-weather]').forEach(async (el) => {
    try {
      const w = await api('/api/weather/' + encodeURIComponent(el.dataset.weather));
      const cur = w.current; const d = w.daily;
      const days = d.time.map((t, i) => {
        const [label, icon] = wx(d.weather_code[i]);
        const day = new Date(t + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' });
        return `<div class="weather-day" title="${esc(label)}"><strong>${day}</strong><i class="fa-solid ${icon}"></i>${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°<br><small>${d.precipitation_probability_max[i] ?? 0}% rain</small></div>`;
      }).join('');
      const [cl, ci] = wx(cur.weather_code);
      el.innerHTML = `<div class="weather-now"><i class="fa-solid ${ci}"></i><div><strong>${Math.round(cur.temperature_2m)}°C</strong><div>${esc(cl)} · humidity ${cur.relative_humidity_2m}% · wind ${Math.round(cur.wind_speed_10m)} km/h</div></div></div><div class="weather-days">${days}</div><p class="small muted">Live forecast via Open-Meteo.</p>`;
    } catch { el.innerHTML = '<p class="muted small">Live forecast unavailable right now.</p>'; }
  });

  // ---------- Mini map on detail pages ----------
  const mm = $('#mini-map');
  if (mm && window.L) {
    const lat = +mm.dataset.lat, lng = +mm.dataset.lng;
    const map = L.map(mm, { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(esc(mm.dataset.name));
    L.circleMarker([0.3476, 32.5825], { radius: 5, color: '#c98c17' }).addTo(map).bindTooltip('Kampala');
  }
})();
