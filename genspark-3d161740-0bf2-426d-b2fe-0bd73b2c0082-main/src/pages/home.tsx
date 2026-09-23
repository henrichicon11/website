import type { Context } from 'hono'
import type { AppEnv, Row } from '../types'
import { listDestinations, getSettings } from '../lib/db'
import { hydrateAll } from '../lib/format'
import { DestCard, SectionHead, Money } from '../components/ui'

const HERO = [
  'https://sspark.genspark.ai/i/8kBhnQ3GVBeWIMh8?width=2560',
  'https://sspark.genspark.ai/i/I4JvByiZFsBH6sa5?width=2560',
  'https://sspark.genspark.ai/i/j6hTevTHVX0by30V?width=2560',
  'https://sspark.genspark.ai/i/PWZ0pDCOc3WdOIHJ?width=2560'
]

export async function homePage(c: Context<AppEnv>) {
  const db = c.env.DB
  const [featured, settings, experiences, regions, guides, itins, counts, places] = await Promise.all([
    listDestinations(db, { featured: true, limit: 8 }),
    getSettings(db),
    db.prepare(`SELECT slug,name,icon FROM categories WHERE kind='experience' ORDER BY sort`).all<Row>(),
    db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM destinations d WHERE d.region_id=r.id) AS n,
      (SELECT card_image FROM destinations d WHERE d.region_id=r.id ORDER BY popularity DESC LIMIT 1) AS image FROM regions r ORDER BY sort`).all<Row>(),
    db.prepare('SELECT slug,title,excerpt,icon,read_minutes,category FROM travel_guides WHERE featured=1 ORDER BY sort LIMIT 4').all<Row>(),
    db.prepare('SELECT * FROM itineraries WHERE featured=1 ORDER BY days LIMIT 3').all<Row>(),
    db.prepare(`SELECT (SELECT COUNT(*) FROM destinations) d, (SELECT COUNT(*) FROM activities) a, (SELECT COUNT(*) FROM transport_routes) r, (SELECT COUNT(*) FROM gallery_images) g`).first<Row>(),
    db.prepare(`SELECT slug,name FROM places WHERE is_hub=1 OR kind='destination' ORDER BY is_hub DESC, name`).all<Row>()
  ])
  const types = (await db.prepare(`SELECT slug,name,icon FROM categories WHERE kind='type' ORDER BY sort`).all<Row>()).results

  return c.render(
    <>
      <section class="hero" data-hero-slides={JSON.stringify(HERO)}>
        <div class="hero-bg" style={`background-image:url('${HERO[0]}')`}></div>
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <p class="kicker kicker-light">The Pearl of Africa</p>
          <h1>Discover the Beauty of <em>Uganda</em></h1>
          <p class="lead">{settings.site_tagline}</p>
          <form class="hero-search" action="/destinations" method="get" role="search">
            <div class="field">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input name="q" placeholder="Where do you want to go? Try gorillas, Jinja, waterfalls…" aria-label="Search destinations" />
            </div>
            <select name="category" aria-label="Type">
              <option value="">Any type</option>
              {types.map((t) => <option value={t.slug}>{t.name}</option>)}
            </select>
            <button class="btn btn-primary btn-lg" type="submit">Search</button>
          </form>
          <div class="hero-ctas">
            <a class="btn btn-light" href="/destinations"><i class="fa-solid fa-compass"></i> Explore destinations</a>
            <a class="btn btn-outline-light" href="/planner"><i class="fa-solid fa-map-location-dot"></i> Plan your trip</a>
          </div>
        </div>
        <div class="container hero-stats">
          <div><strong>{counts?.d}</strong><span>Destinations</span></div>
          <div><strong>{counts?.a}</strong><span>Activities with prices</span></div>
          <div><strong>{counts?.r}</strong><span>Mapped transport routes</span></div>
          <div><strong>{counts?.g}</strong><span>Photos</span></div>
        </div>
      </section>

      <section class="section container">
        <SectionHead kicker="Find your trip" title="Explore by experience" sub="What kind of journey are you after?" />
        <div class="exp-grid">
          {experiences.results.map((e) => (
            <a class="exp-tile" href={`/destinations?experience=${e.slug.replace('exp-', '')}`}>
              <i class={`fa-solid ${e.icon}`}></i><span>{e.name}</span>
            </a>
          ))}
        </div>
      </section>

      <section class="section section-tint">
        <div class="container">
          <SectionHead kicker="Handpicked" title="Featured destinations" sub="The places that define a first trip to Uganda." link={['View all destinations', '/destinations']} />
          <div class="card-grid">{featured.items.map((d) => <DestCard d={d} />)}</div>
        </div>
      </section>

      <section class="section container">
        <div class="split">
          <div>
            <p class="kicker">Transport cost estimator</p>
            <h2>How much will it cost to get there?</h2>
            <p class="muted">Compare buses, minibus taxis, private cars, special hire, 4x4s and domestic flights on {counts?.r} curated routes — with estimates for anywhere else in the country.</p>
            <form class="quick-transport" action="/transport" method="get">
              <label>From
                <select name="from">{places.results.map((p) => <option value={p.slug} selected={p.slug === 'kampala'}>{p.name}</option>)}</select>
              </label>
              <label>To
                <select name="to">{places.results.map((p) => <option value={p.slug} selected={p.slug === 'jinja'}>{p.name}</option>)}</select>
              </label>
              <button class="btn btn-primary" type="submit"><i class="fa-solid fa-calculator"></i> Estimate</button>
            </form>
          </div>
          <div class="feature-list">
            <div class="feature"><i class="fa-solid fa-bus"></i><div><h4>Every mode compared</h4><p>Fares, travel time and comfort side by side, with the cheapest and fastest flagged.</p></div></div>
            <div class="feature"><i class="fa-solid fa-route"></i><div><h4>Real routes</h4><p>Road distances, waypoints, road quality and alternative routes on key corridors.</p></div></div>
            <div class="feature"><i class="fa-solid fa-coins"></i><div><h4>Your currency</h4><p>Switch between UGX, USD, EUR, GBP and KES using live exchange rates.</p></div></div>
          </div>
        </div>
      </section>

      <section class="section section-dark">
        <div class="container">
          <SectionHead kicker="Four regions" title="Explore by region" />
          <div class="region-grid">
            {regions.results.map((r) => (
              <a class="region-tile" href={`/destinations?region=${r.slug}`} style={`--img:url('${r.image}')`}>
                <div><h3>{r.name}</h3><p>{r.blurb}</p><span class="chip">{r.n} destinations</span></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section class="section container">
        <SectionHead kicker="Ready-made" title="Sample itineraries" sub="Day-by-day plans with distances and cost ranges." link={['All itineraries', '/itineraries']} />
        <div class="card-grid card-grid-3">
          {hydrateAll(itins.results).map((i) => (
            <a class="card itin-card" href={`/itineraries/${i.slug}`}>
              <div class="card-media"><img src={i.hero_image} alt={i.title} loading="lazy" /><span class="chip chip-overlay">{i.days} days</span></div>
              <div class="card-body">
                <h3>{i.title}</h3>
                <p class="card-tag">{i.subtitle}</p>
                <p class="price-label">From <strong><Money v={i.cost_ugx_min} short /></strong> per person</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section class="section section-tint">
        <div class="container">
          <SectionHead kicker="Know before you go" title="Travel guides" link={['All guides', '/guides']} />
          <div class="guide-grid">
            {guides.results.map((g) => (
              <a class="guide-tile" href={`/guides/${g.slug}`}>
                <i class={`fa-solid ${g.icon}`}></i>
                <div><h3>{g.title}</h3><p>{g.excerpt}</p><span class="muted small">{g.read_minutes} min read</span></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section class="section container cta-band">
        <div>
          <h2>Build your own Uganda trip</h2>
          <p>Pick destinations, choose activities and a comfort level, and get a full cost breakdown in seconds.</p>
        </div>
        <a class="btn btn-primary btn-lg" href="/planner">Open the trip planner <i class="fa-solid fa-arrow-right"></i></a>
      </section>
    </>,
    {
      active: 'home', path: '/',
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'WebSite', name: 'Discover Uganda', url: new URL(c.req.url).origin,
        potentialAction: { '@type': 'SearchAction', target: `${new URL(c.req.url).origin}/destinations?q={q}`, 'query-input': 'required name=q' }
      }
    }
  )
}
