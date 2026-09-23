import type { Context } from 'hono'
import type { AppEnv, Row } from '../types'
import { getSettings } from '../lib/db'
import { PageHero } from '../components/ui'

export async function mapPage(c: Context<AppEnv>) {
  const cats = (await c.env.DB.prepare(`SELECT slug,name,icon FROM categories WHERE kind='type' ORDER BY sort`).all<Row>()).results
  const regions = (await c.env.DB.prepare('SELECT slug,name FROM regions ORDER BY sort').all<Row>()).results
  return c.render(
    <>
      <section class="map-page">
        <aside class="map-sidebar">
          <h1>Interactive map</h1>
          <p class="muted small">Every destination on one map. Filter by type, then click a marker for distances and costs.</p>
          <input type="search" id="map-search" placeholder="Filter by name…" aria-label="Filter destinations" />
          <select id="map-region" aria-label="Region"><option value="">All regions</option>{regions.map((r) => <option value={r.slug}>{r.name}</option>)}</select>
          <div class="map-filters" id="map-filters">
            {cats.map((cat) => (
              <label class="chip chip-check"><input type="checkbox" value={cat.slug} /> <i class={`fa-solid ${cat.icon}`}></i> {cat.name}</label>
            ))}
          </div>
          <label class="switch"><input type="checkbox" id="map-routes" /> Show main transport routes</label>
          <div id="map-list" class="map-list" aria-live="polite"></div>
        </aside>
        <div id="map" class="map-canvas" role="region" aria-label="Map of Uganda destinations"></div>
      </section>
    </>,
    { title: 'Interactive Map of Uganda Destinations', description: 'Explore every Uganda destination on an interactive map with filters for parks, waterfalls, lakes, mountains and more.', active: 'map', path: '/map', leaflet: true, scripts: ['/static/map.js'], bodyClass: 'page-map' }
  )
}

export async function transportPage(c: Context<AppEnv>) {
  const s = await getSettings(c.env.DB)
  const q = c.req.query()
  const modes = (await c.env.DB.prepare('SELECT mode,label,icon,description FROM transport_mode_rates ORDER BY sort').all<Row>()).results
  return c.render(
    <>
      <PageHero small kicker="Transport cost estimator" title="How much does it cost to get there?" sub="Compare every way of travelling between Ugandan towns, parks and attractions — fares, times, distance and route." />
      <section class="container section-sm">
        <form class="panel transport-form" id="transport-form" data-from={q.from || 'kampala'} data-to={q.to || ''} data-travelers={q.travelers || '1'}>
          <label class="field-label">Starting point
            <select name="from" id="t-from" data-places-select required></select>
          </label>
          <button type="button" class="icon-btn swap" id="t-swap" aria-label="Swap origin and destination"><i class="fa-solid fa-right-left"></i></button>
          <label class="field-label">Destination
            <select name="to" id="t-to" data-places-select required></select>
          </label>
          <label class="field-label">Travellers
            <input type="number" name="travelers" id="t-trav" min="1" max="50" value={q.travelers || '1'} />
          </label>
          <button class="btn btn-primary btn-lg" type="submit"><i class="fa-solid fa-calculator"></i> Estimate</button>
        </form>
        <div id="transport-result" aria-live="polite"></div>
        <p class="disclaimer"><i class="fa-solid fa-triangle-exclamation"></i> {s.transport_disclaimer}</p>
      </section>
      <section class="container section-sm">
        <h2>Transport modes explained</h2>
        <div class="mode-grid">
          {modes.map((m) => (
            <div class="panel mode-card"><i class={`fa-solid ${m.icon}`}></i><h4>{m.label}</h4><p class="small">{m.description}</p></div>
          ))}
        </div>
        <h2 class="mt">Popular routes</h2>
        <div id="route-table" class="table-wrap"><p class="muted">Loading routes…</p></div>
      </section>
    </>,
    { title: 'Uganda Transport Cost Estimator — Bus, Taxi, Car & Flight Prices', description: 'Estimate bus, taxi, private car, special hire, 4x4 and flight costs between any two places in Uganda.', active: 'transport', path: '/transport', scripts: ['/static/transport.js'] }
  )
}

export async function plannerPage(c: Context<AppEnv>) {
  const tiers = (await c.env.DB.prepare('SELECT tier,label,description FROM cost_baselines').all<Row>()).results
  const order = ['budget', 'standard', 'luxury']
  tiers.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier))
  return c.render(
    <>
      <PageHero small kicker="Trip planner" title="Plan your Uganda trip & budget" sub="Add destinations in order, choose activities and a comfort level, and get a full cost breakdown — then save or print it." />
      <section class="container section-sm planner" id="planner" data-add={c.req.query('add') || ''} data-trip={c.req.query('trip') || ''}>
        <div class="planner-main">
          <div class="panel">
            <h3>1. Trip settings</h3>
            <div class="grid-3">
              <label class="field-label">Start from
                <select id="p-start" data-places-select data-default="kampala"></select>
              </label>
              <label class="field-label">Travellers
                <input id="p-trav" type="number" min="1" max="20" value="2" />
              </label>
              <label class="field-label">Entry-fee category
                <select id="p-res"><option value="foreign">Foreign visitor</option><option value="eastafrican">East African citizen</option></select>
              </label>
            </div>
            <div class="tier-select" role="radiogroup" aria-label="Comfort level">
              {tiers.map((t) => (
                <label class="tier-option">
                  <input type="radio" name="tier" value={t.tier} checked={t.tier === 'standard'} />
                  <span><strong>{t.label}</strong><small>{t.description}</small></span>
                </label>
              ))}
            </div>
            <label class="switch"><input type="checkbox" id="p-return" checked /> Include return journey to start</label>
          </div>
          <div class="panel">
            <h3>2. Destinations</h3>
            <div class="add-stop">
              <select id="p-add" aria-label="Choose a destination"><option value="">Choose a destination to add…</option></select>
              <button class="btn btn-primary" id="p-add-btn" type="button"><i class="fa-solid fa-plus"></i> Add</button>
            </div>
            <ol id="p-stops" class="stops"></ol>
            <p id="p-empty" class="muted">No destinations yet. Add one above or start from an <a href="/itineraries">itinerary</a>.</p>
          </div>
        </div>
        <aside class="planner-side">
          <div class="panel sticky" id="p-summary">
            <h3>Estimated cost</h3>
            <div id="p-result"><p class="muted">Add a destination to see your estimate.</p></div>
            <div class="btn-stack">
              <input id="p-title" placeholder="Trip name" maxlength={120} value="My Uganda trip" aria-label="Trip name" />
              <button class="btn btn-primary btn-block" id="p-save" type="button"><i class="fa-regular fa-floppy-disk"></i> Save trip</button>
              <button class="btn btn-ghost btn-block" id="p-print" type="button"><i class="fa-solid fa-print"></i> Print / PDF</button>
              <button class="btn btn-ghost btn-block" id="p-share" type="button"><i class="fa-solid fa-link"></i> Copy share link</button>
            </div>
            <p class="small muted">Estimates combine curated transport fares, published park fees and typical accommodation and food costs for the chosen tier.</p>
          </div>
        </aside>
      </section>
    </>,
    { title: 'Uganda Trip Planner & Budget Calculator', description: 'Build a multi-destination Uganda itinerary and get an instant cost estimate covering transport, entry fees, activities, accommodation and food.', active: 'planner', path: '/planner', scripts: ['/static/planner.js'] }
  )
}
