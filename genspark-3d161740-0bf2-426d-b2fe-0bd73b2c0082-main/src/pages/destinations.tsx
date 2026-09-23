import type { Context } from 'hono'
import type { AppEnv, Row } from '../types'
import { listDestinations, getDestination } from '../lib/db'
import { md, hours, usd, cap, ugx } from '../lib/format'
import { DestCard, PageHero, Breadcrumbs, Money, Html, FavButton, Stars, DifficultyBadge, Empty } from '../components/ui'

const EXPERIENCES = ['wildlife', 'adventure', 'nature', 'culture', 'relaxation', 'history', 'family', 'photography']
const DURATIONS: [string, string][] = [['1day', 'Day trip'], ['weekend', 'Weekend'], ['3-5days', '3–5 days'], ['1week', '1 week'], ['2weeks', '2 weeks']]

export async function destinationsPage(c: Context<AppEnv>) {
  const q = c.req.query()
  const page = Math.max(1, parseInt(q.page || '1', 10) || 1)
  const per = 24
  const [res, regions, cats] = await Promise.all([
    listDestinations(c.env.DB, {
      q: q.q, region: q.region, category: q.category, experience: q.experience, budget: q.budget,
      duration: q.duration, difficulty: q.difficulty, sort: q.sort, limit: per, offset: (page - 1) * per
    }),
    c.env.DB.prepare('SELECT slug,name FROM regions ORDER BY sort').all<Row>(),
    c.env.DB.prepare(`SELECT slug,name,icon FROM categories WHERE kind='type' ORDER BY sort`).all<Row>()
  ])
  const pages = Math.max(1, Math.ceil(res.total / per))
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...q, ...patch })) if (v) p.set(k, v)
    return '?' + p.toString()
  }
  const activeCat = cats.results.find((x) => x.slug === q.category)
  const heading = activeCat ? activeCat.name : q.experience ? `${cap(q.experience)} destinations` : 'All destinations'
  const sel = (name: string, v: string) => q[name] === v

  return c.render(
    <>
      <PageHero small title={heading} kicker="Destinations" sub={`${res.total} places across Uganda's four regions — filter by type, experience, budget and trip length.`} />
      <section class="container section-sm">
        <div class="chip-row" role="list">
          <a class={`chip chip-filter${!q.category ? ' active' : ''}`} href={qs({ category: undefined, page: undefined })}>All</a>
          {cats.results.map((cat) => (
            <a class={`chip chip-filter${q.category === cat.slug ? ' active' : ''}`} href={qs({ category: cat.slug, page: undefined })}>
              <i class={`fa-solid ${cat.icon}`}></i> {cat.name}
            </a>
          ))}
        </div>
        <div class="listing">
          <aside class="filters">
            <form method="get" action="/destinations" data-autosubmit>
              {q.category && <input type="hidden" name="category" value={q.category} />}
              <label class="field-label">Search
                <input type="search" name="q" value={q.q || ''} placeholder="Name, district, highlight…" />
              </label>
              <label class="field-label">Region
                <select name="region"><option value="">All regions</option>{regions.results.map((r) => <option value={r.slug} selected={sel('region', r.slug)}>{r.name}</option>)}</select>
              </label>
              <label class="field-label">Experience
                <select name="experience"><option value="">Any</option>{EXPERIENCES.map((e) => <option value={e} selected={sel('experience', e)}>{cap(e)}</option>)}</select>
              </label>
              <label class="field-label">Budget
                <select name="budget"><option value="">Any</option>{['budget', 'midrange', 'luxury'].map((b) => <option value={b} selected={sel('budget', b)}>{b === 'midrange' ? 'Mid-range' : cap(b)}</option>)}</select>
              </label>
              <label class="field-label">Trip length
                <select name="duration"><option value="">Any</option>{DURATIONS.map(([v, l]) => <option value={v} selected={sel('duration', v)}>{l}</option>)}</select>
              </label>
              <label class="field-label">Difficulty
                <select name="difficulty"><option value="">Any</option>{['easy', 'moderate', 'challenging'].map((d) => <option value={d} selected={sel('difficulty', d)}>{cap(d)}</option>)}</select>
              </label>
              <label class="field-label">Sort by
                <select name="sort">
                  {[['popular', 'Most popular'], ['name', 'Name A–Z'], ['distance', 'Closest to Kampala'], ['cost', 'Lowest travel cost'], ['fee', 'Lowest entry fee']].map(([v, l]) =>
                    <option value={v} selected={(q.sort || 'popular') === v}>{l}</option>)}
                </select>
              </label>
              <div class="filter-actions">
                <button class="btn btn-primary btn-block" type="submit">Apply filters</button>
                <a class="btn btn-ghost btn-block" href="/destinations">Reset</a>
              </div>
            </form>
          </aside>
          <div>
            {res.items.length ? (
              <div class="card-grid card-grid-3">{res.items.map((d) => <DestCard d={d} />)}</div>
            ) : (
              <Empty icon="fa-binoculars" title="No destinations match those filters"><p><a href="/destinations">Clear all filters</a></p></Empty>
            )}
            {pages > 1 && (
              <nav class="pagination" aria-label="Pagination">
                {page > 1 && <a href={qs({ page: String(page - 1) })}>&larr; Prev</a>}
                <span>Page {page} of {pages}</span>
                {page < pages && <a href={qs({ page: String(page + 1) })}>Next &rarr;</a>}
              </nav>
            )}
          </div>
        </div>
      </section>
    </>,
    { title: heading, description: `Browse ${res.total} Uganda destinations with distances, costs, best times to visit and activities.`, active: 'destinations', path: '/destinations' }
  )
}

const ACC_LABEL: Record<string, string> = { budget: 'Budget', midrange: 'Mid-range', luxury: 'Luxury' }

export async function destinationDetailPage(c: Context<AppEnv>) {
  const d: any = await getDestination(c.env.DB, c.req.param('slug')!)
  if (!d) return c.notFound()
  const tabs = [
    ['overview', 'Overview'], ['things-to-do', 'Things to do'], ['getting-there', 'Getting there'],
    ['best-time', 'Best time & weather'], ['costs', 'Costs & fees'], ['stay', 'Where to stay'], ['gallery', 'Gallery'], ['reviews', 'Reviews']
  ]
  const origin = new URL(c.req.url).origin
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'TouristAttraction', name: d.name, description: d.intro, image: d.hero_image,
    url: `${origin}/destinations/${d.slug}`,
    geo: { '@type': 'GeoCoordinates', latitude: d.latitude, longitude: d.longitude },
    address: { '@type': 'PostalAddress', addressRegion: d.district, addressCountry: 'UG' },
    ...(d.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: d.rating.toFixed(1), reviewCount: d.reviews.length } } : {})
  }
  const placeForTransport = d.slug

  return c.render(
    <>
      <section class="dest-hero" style={`--hero:url('${d.hero_image}')`}>
        <div class="container dest-hero-inner">
          <p class="kicker kicker-light"><i class="fa-solid fa-location-dot"></i> {d.location_label}</p>
          <h1>{d.name}</h1>
          <p class="lead">{d.tagline}</p>
          <div class="dest-hero-actions">
            <FavButton kind="destination" slug={d.slug} label />
            <a class="btn btn-light btn-sm" href={`/planner?add=${d.slug}`}><i class="fa-solid fa-plus"></i> Add to trip</a>
            <button class="btn btn-outline-light btn-sm" data-share><i class="fa-solid fa-share-nodes"></i> Share</button>
          </div>
        </div>
      </section>
      <Breadcrumbs items={[['Home', '/'], ['Destinations', '/destinations'], [d.region_name, `/destinations?region=${d.region_slug}`], [d.short_name || d.name]]} />

      <section class="container">
        <div class="fact-bar">
          <div><i class="fa-solid fa-route"></i><span>From Kampala</span><strong>{d.distance_from_kampala_km ? `${Math.round(d.distance_from_kampala_km)} km` : 'In the city'}</strong></div>
          <div><i class="fa-regular fa-clock"></i><span>Drive time</span><strong>{d.drive_hours_max ? hours(d.drive_hours_min, d.drive_hours_max) : '—'}</strong></div>
          <div><i class="fa-regular fa-sun"></i><span>Best time</span><strong>{d.best_time}</strong></div>
          <div><i class="fa-solid fa-ticket"></i><span>Entry (foreign)</span><strong>{d.entry_fee_foreign_usd ? usd(d.entry_fee_foreign_usd) : 'Free / varies'}</strong></div>
          <div><i class="fa-solid fa-calendar-days"></i><span>Suggested stay</span><strong>{d.recommended_days} day{d.recommended_days > 1 ? 's' : ''}</strong></div>
          <div><i class="fa-solid fa-person-hiking"></i><span>Difficulty</span><strong>{cap(d.difficulty)}</strong></div>
        </div>
      </section>

      <nav class="tabs container" aria-label="Sections" data-scrollspy>
        {tabs.map(([id, l]) => <a href={`#${id}`}>{l}</a>)}
      </nav>

      <div class="container detail-layout">
        <article class="detail-main prose-wrap">
          <section id="overview" class="detail-section">
            <p class="intro">{d.intro}</p>
            <div class="prose"><Html html={md(d.overview)} /></div>
            <h3>Why visit</h3>
            <div class="prose"><Html html={md(d.why_visit)} /></div>
            <div class="two-col">
              <div class="panel">
                <h4><i class="fa-solid fa-star"></i> Highlights</h4>
                <ul class="check-list">{(d.highlights || []).map((h: string) => <li>{h}</li>)}</ul>
              </div>
              {d.wildlife?.length > 0 && (
                <div class="panel">
                  <h4><i class="fa-solid fa-paw"></i> Wildlife & nature</h4>
                  <div class="tag-cloud">{d.wildlife.map((w: string) => <span class="chip">{w}</span>)}</div>
                </div>
              )}
            </div>
            <div class="tag-cloud mt">{d.categories.map((cat: Row) => <a class="chip chip-filter" href={`/destinations?category=${cat.slug}`}><i class={`fa-solid ${cat.icon}`}></i> {cat.name}</a>)}</div>
          </section>

          <section id="things-to-do" class="detail-section">
            <h2>Things to do</h2>
            <div class="activity-list">
              {d.activities.map((a: Row) => (
                <details class="activity" open={a.sort === 0}>
                  <summary>
                    <span class="activity-icon"><i class={`fa-solid ${a.icon || 'fa-circle-dot'}`}></i></span>
                    <span class="activity-title"><strong>{a.name}</strong><small>{a.duration}</small></span>
                    <DifficultyBadge level={a.difficulty} />
                    <span class="activity-price">{a.cost_usd_min != null ? (a.cost_usd_min === a.cost_usd_max ? usd(a.cost_usd_min) : `${usd(a.cost_usd_min)}–${Math.round(a.cost_usd_max)}`) : '—'}</span>
                  </summary>
                  <div class="activity-body">
                    <p>{a.description}</p>
                    <dl class="kv">
                      <div><dt>Cost</dt><dd>{a.cost_note}</dd></div>
                      {a.cost_ugx_min != null && <div><dt>Approx. local</dt><dd><Money v={a.cost_ugx_min} max={a.cost_ugx_max} /></dd></div>}
                      <div><dt>Age</dt><dd>{a.recommended_age}</dd></div>
                      <div><dt>Best season</dt><dd>{a.best_season}</dd></div>
                    </dl>
                    {a.what_to_bring?.length > 0 && <p class="small"><strong>Bring:</strong> {a.what_to_bring.join(' · ')}</p>}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section id="getting-there" class="detail-section">
            <h2>How to get there</h2>
            <div class="prose"><Html html={md(d.getting_there)} /></div>
            <div class="panel panel-accent">
              <h4><i class="fa-solid fa-calculator"></i> Estimate your transport cost</h4>
              <form class="inline-form" action="/transport" method="get">
                <input type="hidden" name="to" value={placeForTransport} />
                <label>From <select name="from" data-places-select data-default="kampala"></select></label>
                <label>Travellers <input type="number" name="travelers" min="1" max="50" value="2" /></label>
                <button class="btn btn-primary" type="submit">Compare options</button>
              </form>
            </div>
            <h3>Important travel advice</h3>
            <div class="prose callout"><Html html={md(d.travel_advice)} /></div>
          </section>

          <section id="best-time" class="detail-section">
            <h2>Best time to visit</h2>
            <p class="lead-sm"><strong>{d.best_time}</strong></p>
            <div class="prose"><Html html={md(d.best_time_detail)} /></div>
            {d.climate_note && <p class="muted"><i class="fa-solid fa-temperature-half"></i> {d.climate_note}</p>}
            <div class="weather" data-weather={d.slug}><p class="muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading live 7-day forecast…</p></div>
            <h3>What to pack</h3>
            <ul class="check-list columns">{(d.what_to_pack || []).map((p: string) => <li>{p}</li>)}</ul>
          </section>

          <section id="costs" class="detail-section">
            <h2>Costs & entry fees</h2>
            <div class="cost-grid">
              <div class="panel"><span class="muted small">Foreign non-resident entry</span><strong class="big">{d.entry_fee_foreign_usd ? usd(d.entry_fee_foreign_usd) : '—'}</strong><span class="small">per person per day</span></div>
              <div class="panel"><span class="muted small">East African citizen entry</span><strong class="big">{d.entry_fee_eastafrican_ugx ? ugx(d.entry_fee_eastafrican_ugx) : '—'}</strong><span class="small">per person per day</span></div>
              <div class="panel"><span class="muted small">Travel from Kampala from</span><strong class="big"><Money v={d.cost_from_ugx} /></strong><span class="small">cheapest option, one way</span></div>
            </div>
            {d.entry_fee_note && <p class="muted">{d.entry_fee_note}</p>}
            <p class="small muted"><i class="fa-solid fa-circle-info"></i> Fees are set by the Uganda Wildlife Authority and site operators and do change. Always reconfirm before booking.</p>
          </section>

          <section id="stay" class="detail-section">
            <h2>Where to stay</h2>
            <p class="notice"><i class="fa-solid fa-circle-info"></i> The listings below are <strong>illustrative</strong> — they show typical price bands for each comfort level at this destination, not specific properties.</p>
            <div class="card-grid card-grid-3">
              {d.accommodations.map((a: Row) => (
                <div class="card acc-card">
                  <div class="card-media"><img src={a.image} alt="" loading="lazy" /><span class="chip chip-overlay">{ACC_LABEL[a.category]}</span></div>
                  <div class="card-body">
                    <h4>{a.name}</h4>
                    <p class="small muted">{a.distance_from_attraction} · {cap(a.property_type)}</p>
                    <p class="price-label"><strong>{usd(a.price_usd_min)}–{Math.round(a.price_usd_max)}</strong> <span class="small">{a.price_basis}</span></p>
                    <div class="tag-cloud">{(a.amenities || []).map((x: string) => <span class="chip chip-sm">{x}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="gallery" class="detail-section">
            <h2>Gallery</h2>
            <div class="masonry" data-lightbox-group>
              {d.gallery.map((g: Row) => (
                <figure><a href={g.url} data-lightbox data-caption={g.caption}><img src={g.url.replace('width=2560', 'width=900')} alt={g.caption} loading="lazy" /></a><figcaption>{g.caption}</figcaption></figure>
              ))}
            </div>
          </section>

          <section id="reviews" class="detail-section">
            <h2>Traveller reviews {d.rating && <span class="rating-inline"><Stars n={d.rating} /> {d.rating.toFixed(1)} ({d.reviews.length})</span>}</h2>
            {d.reviews.length ? d.reviews.map((r: Row) => (
              <blockquote class="review">
                <Stars n={r.rating} />
                {r.title && <h4>{r.title}</h4>}
                <p>{r.body}</p>
                <footer>— {r.author_name}{r.visited_on ? `, visited ${r.visited_on}` : ''}</footer>
              </blockquote>
            )) : <p class="muted">No reviews yet — be the first to share your experience.</p>}
            <form class="panel review-form" data-ajax-form action={`/api/destinations/${d.slug}/reviews`} method="post">
              <h4>Write a review</h4>
              <div class="rating-input" role="radiogroup" aria-label="Rating">
                {[5, 4, 3, 2, 1].map((n) => <><input type="radio" id={`r${n}`} name="rating" value={String(n)} required /><label for={`r${n}`} title={`${n} stars`}><i class="fa-solid fa-star"></i></label></>)}
              </div>
              {!c.get('user') && <input name="author_name" placeholder="Your name" required maxlength={80} />}
              <input name="title" placeholder="Title (optional)" maxlength={120} />
              <textarea name="body" rows={4} placeholder="What was it like? Tips for other travellers?" required minlength={20} maxlength={3000}></textarea>
              <input name="visited_on" type="month" aria-label="When did you visit?" />
              <button class="btn btn-primary" type="submit">Submit review</button>
              <p class="form-msg" aria-live="polite"></p>
            </form>
          </section>
        </article>

        <aside class="detail-side">
          <div class="panel sticky">
            <h4>Plan this trip</h4>
            <p class="small muted">Suggested stay: {d.recommended_days} day(s). Suits {(d.budget_levels || []).map((b: string) => ACC_LABEL[b]).join(', ').toLowerCase()} budgets.</p>
            <a class="btn btn-primary btn-block" href={`/planner?add=${d.slug}`}><i class="fa-solid fa-plus"></i> Add to trip planner</a>
            <a class="btn btn-ghost btn-block" href={`/transport?from=kampala&to=${placeForTransport}`}><i class="fa-solid fa-bus"></i> Transport options</a>
            <div id="mini-map" class="mini-map" data-lat={d.latitude} data-lng={d.longitude} data-name={d.name}></div>
            {d.guides.length > 0 && (
              <>
                <h4 class="mt">Related guides</h4>
                <ul class="link-list">{d.guides.map((g: Row) => <li><a href={`/guides/${g.slug}`}><i class={`fa-solid ${g.icon}`}></i> {g.title}</a></li>)}</ul>
              </>
            )}
          </div>
        </aside>
      </div>

      {d.nearby_destinations.length > 0 && (
        <section class="section section-tint">
          <div class="container">
            <h2>Nearby destinations</h2>
            <div class="card-grid card-grid-3">{d.nearby_destinations.map((n: Row) => <DestCard d={n} />)}</div>
          </div>
        </section>
      )}
    </>,
    {
      title: d.name + ' — Travel Guide, Costs & How to Get There', description: d.seo_description || d.intro,
      image: d.og_image, active: 'destinations', path: `/destinations/${d.slug}`, jsonLd, leaflet: true
    }
  )
}
