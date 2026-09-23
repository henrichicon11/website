import type { Context } from 'hono'
import type { AppEnv, Row } from '../types'
import { hydrate, hydrateAll, md } from '../lib/format'
import { PageHero, Breadcrumbs, Html, FavButton, Money, Empty } from '../components/ui'

const GUIDE_CATS: Record<string, [string, string]> = {
  'getting-around': ['Getting around', 'fa-bus'],
  planning: ['Planning your trip', 'fa-map'],
  practical: ['Practical information', 'fa-circle-info']
}

export async function guidesPage(c: Context<AppEnv>) {
  const cat = c.req.query('category')
  const rows = hydrateAll((await c.env.DB.prepare('SELECT slug,title,category,excerpt,icon,read_minutes,hero_image,tags,featured FROM travel_guides ORDER BY featured DESC, sort').all<Row>()).results)
  const list = cat ? rows.filter((r) => r.category === cat) : rows
  return c.render(
    <>
      <PageHero small kicker="Travel guides" title="Know before you go" sub="Practical, honest guidance on transport, permits, money, safety and seasons." />
      <section class="container section-sm">
        <div class="chip-row">
          <a class={`chip chip-filter${!cat ? ' active' : ''}`} href="/guides">All</a>
          {Object.entries(GUIDE_CATS).map(([k, [l, i]]) => <a class={`chip chip-filter${cat === k ? ' active' : ''}`} href={`/guides?category=${k}`}><i class={`fa-solid ${i}`}></i> {l}</a>)}
        </div>
        <div class="card-grid card-grid-3">
          {list.map((g) => (
            <article class="card guide-card">
              <a class="card-media" href={`/guides/${g.slug}`}><img src={g.hero_image} alt="" loading="lazy" /><span class="chip chip-overlay"><i class={`fa-solid ${g.icon}`}></i> {GUIDE_CATS[g.category]?.[0]}</span></a>
              <FavButton kind="guide" slug={g.slug} />
              <div class="card-body">
                <h3><a href={`/guides/${g.slug}`}>{g.title}</a></h3>
                <p class="card-tag">{g.excerpt}</p>
                <div class="card-foot"><span class="small muted">{g.read_minutes} min read</span><a class="link-arrow" href={`/guides/${g.slug}`}>Read <i class="fa-solid fa-arrow-right"></i></a></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>,
    { title: 'Uganda Travel Guides', description: 'Practical Uganda travel guides: public transport, self-drive, gorilla permits, visas, money, safety and the best time to visit.', active: 'guides', path: '/guides' }
  )
}

export async function guideDetailPage(c: Context<AppEnv>) {
  const g = hydrate(await c.env.DB.prepare('SELECT * FROM travel_guides WHERE slug=?').bind(c.req.param('slug')).first<Row>())
  if (!g) return c.notFound()
  const [dests, more] = await Promise.all([
    c.env.DB.prepare('SELECT d.slug,d.name,d.card_image,d.tagline FROM destinations d JOIN destination_guides dg ON dg.destination_id=d.id WHERE dg.guide_id=?').bind(g.id).all<Row>(),
    c.env.DB.prepare('SELECT slug,title,icon,read_minutes FROM travel_guides WHERE id<>? ORDER BY category=? DESC, sort LIMIT 4').bind(g.id, g.category).all<Row>()
  ])
  const toc = [...(g.body as string).matchAll(/^##\s+(.+)$/gm)].map((m) => [m[1], m[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')])
  return c.render(
    <>
      <PageHero title={g.title} kicker={GUIDE_CATS[g.category]?.[0]} sub={g.excerpt} image={g.hero_image} />
      <Breadcrumbs items={[['Home', '/'], ['Guides', '/guides'], [g.title]]} />
      <div class="container detail-layout">
        <article class="detail-main">
          <div class="article-meta"><span><i class="fa-regular fa-clock"></i> {g.read_minutes} min read</span><span>Updated {String(g.updated_at).slice(0, 10)}</span><FavButton kind="guide" slug={g.slug} label /></div>
          <div class="prose prose-lg"><Html html={md(g.body)} /></div>
          <div class="tag-cloud mt">{(g.tags || []).map((t: string) => <span class="chip">#{t}</span>)}</div>
        </article>
        <aside class="detail-side">
          <div class="panel sticky">
            {toc.length > 0 && <><h4>In this guide</h4><ul class="link-list">{toc.map(([l, id]) => <li><a href={`#${id}`}>{l}</a></li>)}</ul></>}
            {dests.results.length > 0 && <><h4 class="mt">Related destinations</h4><ul class="link-list">{dests.results.map((d) => <li><a href={`/destinations/${d.slug}`}>{d.name}</a></li>)}</ul></>}
            <h4 class="mt">More guides</h4>
            <ul class="link-list">{more.results.map((m) => <li><a href={`/guides/${m.slug}`}><i class={`fa-solid ${m.icon}`}></i> {m.title}</a></li>)}</ul>
          </div>
        </aside>
      </div>
    </>,
    {
      title: g.title, description: g.seo_description || g.excerpt, image: g.hero_image, active: 'guides', path: `/guides/${g.slug}`,
      jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.excerpt, image: g.hero_image, dateModified: g.updated_at }
    }
  )
}

export async function itinerariesPage(c: Context<AppEnv>) {
  const rows = hydrateAll((await c.env.DB.prepare('SELECT * FROM itineraries ORDER BY featured DESC, days').all<Row>()).results)
  return c.render(
    <>
      <PageHero small kicker="Itineraries" title="Sample Uganda itineraries" sub="Tested day-by-day routes from a weekend in Jinja to a full week of gorillas and savanna. Load any of them into the planner and make it yours." />
      <section class="container section-sm">
        <div class="itin-list">
          {rows.map((i) => (
            <article class="card itin-row">
              <a class="card-media" href={`/itineraries/${i.slug}`}><img src={i.hero_image} alt="" loading="lazy" /></a>
              <div class="card-body">
                <div class="tag-cloud"><span class="chip">{i.days} days</span><span class="chip">{i.theme}</span><span class="chip">{i.region_focus}</span></div>
                <h3><a href={`/itineraries/${i.slug}`}>{i.title}</a></h3>
                <p class="card-tag">{i.subtitle}</p>
                <p>{i.summary}</p>
                <div class="card-foot">
                  <span class="price-label"><Money v={i.cost_ugx_min} max={i.cost_ugx_max} short /> <span class="small">per person</span></span>
                  <a class="btn btn-primary btn-sm" href={`/itineraries/${i.slug}`}>View day by day</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>,
    { title: 'Uganda Itineraries — Weekend to 2-Week Trips', description: 'Day-by-day Uganda itineraries with distances, transport and cost ranges.', active: 'itineraries', path: '/itineraries' }
  )
}

export async function itineraryDetailPage(c: Context<AppEnv>) {
  const it = hydrate(await c.env.DB.prepare('SELECT * FROM itineraries WHERE slug=?').bind(c.req.param('slug')).first<Row>())
  if (!it) return c.notFound()
  const days = hydrateAll((await c.env.DB.prepare(
    `SELECT d.*, x.slug AS dest_slug, x.name AS dest_name, x.card_image FROM itinerary_days d LEFT JOIN destinations x ON x.id=d.destination_id WHERE d.itinerary_id=? ORDER BY d.day_number`
  ).bind(it.id).all<Row>()).results)
  // Build planner stops: consecutive days at the same destination become nights.
  const stops: { destination_slug: string; nights: number }[] = []
  for (const d of days) {
    if (!d.dest_slug) continue
    const last = stops[stops.length - 1]
    if (last && last.destination_slug === d.dest_slug) last.nights++
    else stops.push({ destination_slug: d.dest_slug, nights: 1 })
  }
  const plannerLink = '/planner?trip=' + encodeURIComponent(btoa(JSON.stringify({ stops, tier: 'standard', travelers: 2 })))
  return c.render(
    <>
      <PageHero title={it.title} kicker={`${it.days}-day itinerary`} sub={it.subtitle} image={it.hero_image}>
        <div class="hero-ctas">
          <a class="btn btn-light" href={plannerLink}><i class="fa-solid fa-calculator"></i> Customise in planner</a>
          <FavButton kind="itinerary" slug={it.slug} label />
        </div>
      </PageHero>
      <Breadcrumbs items={[['Home', '/'], ['Itineraries', '/itineraries'], [it.title]]} />
      <div class="container detail-layout">
        <article class="detail-main">
          <p class="intro">{it.summary}</p>
          <ol class="timeline">
            {days.map((d) => (
              <li class="timeline-item">
                <div class="timeline-marker">Day {d.day_number}</div>
                <div class="panel timeline-card">
                  {d.card_image && <img class="timeline-img" src={d.card_image} alt="" loading="lazy" />}
                  <div>
                    <h3>{d.title}</h3>
                    <p class="muted small"><i class="fa-solid fa-location-dot"></i> {d.dest_slug ? <a href={`/destinations/${d.dest_slug}`}>{d.destination_label}</a> : d.destination_label}</p>
                    <p>{d.description}</p>
                    {d.activities?.length > 0 && <div class="tag-cloud">{d.activities.map((a: string) => <span class="chip chip-sm">{a}</span>)}</div>}
                    <dl class="kv kv-inline">
                      <div><dt><i class="fa-solid fa-car-side"></i> Transport</dt><dd>{d.transport}</dd></div>
                      {d.distance_km > 0 && <div><dt><i class="fa-solid fa-route"></i> Distance</dt><dd>{d.distance_km} km</dd></div>}
                      <div><dt><i class="fa-solid fa-bed"></i> Stay</dt><dd>{d.accommodation}</dd></div>
                    </dl>
                    {d.tip && <p class="tip"><i class="fa-solid fa-lightbulb"></i> {d.tip}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </article>
        <aside class="detail-side">
          <div class="panel sticky">
            <h4>At a glance</h4>
            <dl class="kv">
              <div><dt>Duration</dt><dd>{it.days} days</dd></div>
              <div><dt>Total driving</dt><dd>~{Math.round(it.total_distance_km)} km</dd></div>
              <div><dt>Cost per person</dt><dd><Money v={it.cost_ugx_min} max={it.cost_ugx_max} short /></dd></div>
              <div><dt>Best for</dt><dd>{(it.best_for || []).join(', ')}</dd></div>
            </dl>
            <h4 class="mt">Tips</h4>
            <ul class="check-list">{(it.tips || []).map((t: string) => <li>{t}</li>)}</ul>
            <a class="btn btn-primary btn-block mt" href={plannerLink}>Get a detailed estimate</a>
            <button class="btn btn-ghost btn-block" onclick="window.print()"><i class="fa-solid fa-print"></i> Print itinerary</button>
          </div>
        </aside>
      </div>
    </>,
    { title: it.title, description: it.summary, image: it.hero_image, active: 'itineraries', path: `/itineraries/${it.slug}` }
  )
}

export async function galleryPage(c: Context<AppEnv>) {
  const cat = c.req.query('category')
  const allowed = ['Landscape', 'Wildlife', 'Activities', 'Culture', 'Accommodation']
  const filter = allowed.includes(cat || '') ? cat : null
  const rows = (filter
    ? await c.env.DB.prepare('SELECT g.url,g.caption,g.category,d.slug,d.name FROM gallery_images g JOIN destinations d ON d.id=g.destination_id WHERE g.category=? ORDER BY d.popularity DESC, g.sort').bind(filter).all<Row>()
    : await c.env.DB.prepare('SELECT g.url,g.caption,g.category,d.slug,d.name FROM gallery_images g JOIN destinations d ON d.id=g.destination_id ORDER BY g.sort, d.popularity DESC').all<Row>()).results
  const counts = (await c.env.DB.prepare('SELECT category, COUNT(*) n FROM gallery_images GROUP BY category').all<Row>()).results
  return c.render(
    <>
      <PageHero small kicker="Gallery" title="Uganda in pictures" sub={`${rows.length} photographs from across the country.`} />
      <section class="container section-sm">
        <div class="chip-row">
          <a class={`chip chip-filter${!filter ? ' active' : ''}`} href="/gallery">All</a>
          {counts.map((x) => <a class={`chip chip-filter${filter === x.category ? ' active' : ''}`} href={`/gallery?category=${x.category}`}>{x.category} <small>({x.n})</small></a>)}
        </div>
        {rows.length ? (
          <div class="masonry masonry-4" data-lightbox-group>
            {rows.map((g) => (
              <figure>
                <a href={g.url} data-lightbox data-caption={`${g.caption} — ${g.name}`}><img src={g.url.replace('width=2560', 'width=700')} alt={g.caption} loading="lazy" /></a>
                <figcaption><a href={`/destinations/${g.slug}`}>{g.name}</a></figcaption>
              </figure>
            ))}
          </div>
        ) : <Empty icon="fa-images" title="No photos in this category yet" />}
      </section>
    </>,
    { title: 'Uganda Photo Gallery', description: 'Photographs of Uganda\'s national parks, wildlife, waterfalls, lakes and culture.', active: 'gallery', path: '/gallery' }
  )
}

export async function aboutPage(c: Context<AppEnv>) {
  return c.render(
    <>
      <PageHero small kicker="About" title="About Discover Uganda" sub="Independent, practical travel information for the Pearl of Africa." />
      <section class="container section-sm narrow prose prose-lg">
        <p>Discover Uganda helps travellers understand what a trip here actually involves — where to go, how to get there, how long it takes and what it costs — before they commit to anything.</p>
        <h2 id="data">Where our numbers come from</h2>
        <ul>
          <li><strong>Park & permit fees</strong> reflect published Uganda Wildlife Authority tariffs for the 2024–2026 period.</li>
          <li><strong>Curated transport fares</strong> reflect typical 2024–25 public-transport pricing on each route.</li>
          <li><strong>Estimated fares</strong> for other routes use per-kilometre rates for each mode, calibrated against the curated routes and current fuel prices, with a correction for road quality.</li>
          <li><strong>Exchange rates</strong> are fetched live and cached; a fallback rate is used if the service is unavailable.</li>
          <li><strong>Weather</strong> forecasts come from Open-Meteo.</li>
          <li><strong>Accommodation listings</strong> are illustrative price bands, not specific properties, and are clearly marked as such.</li>
        </ul>
        <h2>Always reconfirm</h2>
        <p>Prices change with fuel, season and exchange rates. Treat every figure on this site as a planning estimate and confirm with the operator, lodge or UWA before you pay.</p>
        <p><a class="btn btn-primary" href="/contact">Spotted something out of date? Tell us</a></p>
      </section>
    </>,
    { title: 'About & Data Sources', path: '/about' }
  )
}

export async function contactPage(c: Context<AppEnv>) {
  return c.render(
    <>
      <PageHero small kicker="Contact" title="Get in touch" sub="Corrections, questions, partnership enquiries — we read everything." />
      <section class="container section-sm narrow">
        <form class="panel form-stack" data-ajax-form action="/api/contact" method="post" data-reset>
          <label class="field-label">Name<input name="name" maxlength={100} autocomplete="name" /></label>
          <label class="field-label">Email<input name="email" type="email" required maxlength={200} autocomplete="email" /></label>
          <label class="field-label">Subject
            <select name="subject"><option>General question</option><option>Price or information correction</option><option>Partnership</option><option>Technical problem</option></select>
          </label>
          <label class="field-label">Message<textarea name="message" rows={6} required minlength={10} maxlength={5000}></textarea></label>
          <button class="btn btn-primary" type="submit">Send message</button>
          <p class="form-msg" aria-live="polite"></p>
        </form>
      </section>
    </>,
    { title: 'Contact', path: '/contact' }
  )
}

export function notFoundPage(c: Context<AppEnv>) {
  c.status(404)
  return c.render(
    <section class="container section narrow center">
      <Empty icon="fa-map-signs" title="We couldn't find that page">
        <p class="muted">The trail may have moved. Try searching, or head back to the destinations.</p>
        <p><a class="btn btn-primary" href="/destinations">Browse destinations</a> <a class="btn btn-ghost" href="/">Home</a></p>
      </Empty>
    </section>,
    { title: 'Page not found', noindex: true }
  )
}
