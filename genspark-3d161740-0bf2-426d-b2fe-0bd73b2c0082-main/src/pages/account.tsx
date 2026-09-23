import type { Context } from 'hono'
import type { AppEnv, Row } from '../types'
import { parseJSON } from '../lib/format'
import { PageHero, Money, Empty } from '../components/ui'

const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account')

export function loginPage(c: Context<AppEnv>) {
  if (c.get('user')) return c.redirect(safeNext(c.req.query('next')))
  const next = safeNext(c.req.query('next'))
  return c.render(
    <section class="auth-wrap">
      <div class="panel auth-card">
        <h1>Welcome back</h1>
        <p class="muted">Sign in to save destinations, trips and reviews.</p>
        <form class="form-stack" data-auth-form action="/api/auth/login" data-next={next}>
          <label class="field-label">Email<input name="email" type="email" required autocomplete="email" /></label>
          <label class="field-label">Password<input name="password" type="password" required autocomplete="current-password" /></label>
          <button class="btn btn-primary btn-block" type="submit">Sign in</button>
          <p class="form-msg" aria-live="polite"></p>
        </form>
        <p class="small center">New here? <a href={`/register?next=${encodeURIComponent(next)}`}>Create an account</a></p>
      </div>
    </section>,
    { title: 'Sign in', noindex: true, path: '/login' }
  )
}

export function registerPage(c: Context<AppEnv>) {
  if (c.get('user')) return c.redirect('/account')
  const next = safeNext(c.req.query('next'))
  return c.render(
    <section class="auth-wrap">
      <div class="panel auth-card">
        <h1>Create your account</h1>
        <p class="muted">Free. Save favourites, build and store trip budgets.</p>
        <form class="form-stack" data-auth-form action="/api/auth/register" data-next={next}>
          <label class="field-label">Name<input name="name" required minlength={2} maxlength={100} autocomplete="name" /></label>
          <label class="field-label">Email<input name="email" type="email" required autocomplete="email" /></label>
          <label class="field-label">Password <small class="muted">(min. 8 characters)</small><input name="password" type="password" required minlength={8} autocomplete="new-password" /></label>
          <label class="field-label">Country <small class="muted">(optional)</small><input name="country" maxlength={60} autocomplete="country-name" /></label>
          <button class="btn btn-primary btn-block" type="submit">Create account</button>
          <p class="form-msg" aria-live="polite"></p>
        </form>
        <p class="small center">Already have an account? <a href={`/login?next=${encodeURIComponent(next)}`}>Sign in</a></p>
      </div>
    </section>,
    { title: 'Create account', noindex: true, path: '/register' }
  )
}

export async function accountPage(c: Context<AppEnv>) {
  const u = c.get('user')!
  const [favs, trips] = await Promise.all([
    c.env.DB.prepare(
      `SELECT f.kind,d.slug AS ds,d.name AS dn,d.card_image AS di,d.tagline AS dt,g.slug AS gs,g.title AS gt,g.icon AS gi,i.slug AS is_,i.title AS it,i.hero_image AS ii
       FROM favorites f LEFT JOIN destinations d ON d.id=f.destination_id LEFT JOIN travel_guides g ON g.id=f.guide_id LEFT JOIN itineraries i ON i.id=f.itinerary_id
       WHERE f.user_id=? ORDER BY f.created_at DESC`
    ).bind(u.id).all<Row>(),
    c.env.DB.prepare('SELECT id,title,tier,travelers,payload,summary,updated_at FROM saved_trips WHERE user_id=? ORDER BY updated_at DESC').bind(u.id).all<Row>()
  ])
  const dests = favs.results.filter((f) => f.ds)
  const guides = favs.results.filter((f) => f.gs)
  const itins = favs.results.filter((f) => f.is_)
  return c.render(
    <>
      <PageHero small kicker="Your account" title={`Hello, ${u.name.split(' ')[0]}`} sub={u.email}>
        <button class="btn btn-outline-light btn-sm" data-logout><i class="fa-solid fa-arrow-right-from-bracket"></i> Sign out</button>
      </PageHero>
      <section class="container section-sm">
        <h2>Saved trips</h2>
        {trips.results.length ? (
          <div class="card-grid card-grid-3">
            {trips.results.map((t) => {
              const s = parseJSON<Row>(t.summary, {})
              const p = parseJSON<Row>(t.payload, {})
              const link = '/planner?trip=' + encodeURIComponent(btoa(JSON.stringify({ ...p, id: t.id, title: t.title })))
              return (
                <div class="card trip-card" data-trip-id={t.id}>
                  <div class="card-body">
                    <h3>{t.title}</h3>
                    <p class="small muted">{(p.stops || []).length} stop(s) · {t.travelers} traveller(s) · {t.tier} · updated {String(t.updated_at).slice(0, 10)}</p>
                    {s.total_min != null && <p class="price-label"><Money v={s.total_min} max={s.total_max} short /></p>}
                    <div class="card-foot">
                      <a class="btn btn-primary btn-sm" href={link}>Open</a>
                      <button class="btn btn-ghost btn-sm" data-delete-trip={t.id}><i class="fa-regular fa-trash-can"></i> Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : <Empty icon="fa-suitcase-rolling" title="No saved trips yet"><p><a class="btn btn-primary" href="/planner">Plan a trip</a></p></Empty>}

        <h2 class="mt">Favourite destinations</h2>
        {dests.length ? (
          <div class="card-grid card-grid-4">
            {dests.map((f) => (
              <a class="card mini-card" href={`/destinations/${f.ds}`}>
                <div class="card-media"><img src={f.di} alt="" loading="lazy" /></div>
                <div class="card-body"><h4>{f.dn}</h4><p class="small muted">{f.dt}</p></div>
              </a>
            ))}
          </div>
        ) : <p class="muted">Tap the <i class="fa-regular fa-heart"></i> on any destination to save it here.</p>}

        {(guides.length > 0 || itins.length > 0) && (
          <div class="two-col mt">
            <div><h3>Saved guides</h3><ul class="link-list">{guides.map((g) => <li><a href={`/guides/${g.gs}`}><i class={`fa-solid ${g.gi}`}></i> {g.gt}</a></li>)}</ul></div>
            <div><h3>Saved itineraries</h3><ul class="link-list">{itins.map((i) => <li><a href={`/itineraries/${i.is_}`}>{i.it}</a></li>)}</ul></div>
          </div>
        )}
      </section>
    </>,
    { title: 'Your account', noindex: true, path: '/account' }
  )
}

export async function adminPage(c: Context<AppEnv>) {
  const dests = (await c.env.DB.prepare('SELECT slug,name,featured,popularity,entry_fee_foreign_usd,cost_from_ugx,best_time FROM destinations ORDER BY name').all<Row>()).results
  return c.render(
    <>
      <PageHero small kicker="Admin" title="Content dashboard" sub="Moderate reviews, keep prices current and review incoming messages." />
      <section class="container section-sm admin" id="admin">
        <div class="stat-grid" id="admin-stats"></div>
        <nav class="tabs" data-admin-tabs>
          <a href="#reviews" class="active">Reviews</a><a href="#destinations">Destinations</a><a href="#fares">Transport fares</a>
          <a href="#rates">Mode rates</a><a href="#baselines">Budget tiers</a><a href="#messages">Messages</a><a href="#users">Users</a>
        </nav>
        <div class="admin-pane" data-pane="reviews">
          <div class="chip-row"><button class="chip chip-filter active" data-review-status="pending">Pending</button><button class="chip chip-filter" data-review-status="approved">Approved</button><button class="chip chip-filter" data-review-status="rejected">Rejected</button></div>
          <div id="admin-reviews"></div>
        </div>
        <div class="admin-pane" data-pane="destinations" hidden>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Destination</th><th>Featured</th><th>Popularity</th><th>Entry USD</th><th>Travel from UGX</th><th>Best time</th><th></th></tr></thead>
              <tbody>
                {dests.map((d) => (
                  <tr data-dest={d.slug}>
                    <td><a href={`/destinations/${d.slug}`} target="_blank">{d.name}</a></td>
                    <td><input type="checkbox" name="featured" checked={!!d.featured} /></td>
                    <td><input type="number" name="popularity" value={d.popularity} min="0" max="100" class="w-sm" /></td>
                    <td><input type="number" name="entry_fee_foreign_usd" value={d.entry_fee_foreign_usd ?? ''} step="1" class="w-sm" /></td>
                    <td><input type="number" name="cost_from_ugx" value={d.cost_from_ugx ?? ''} step="500" class="w-md" /></td>
                    <td><input name="best_time" value={d.best_time ?? ''} class="w-md" /></td>
                    <td><button class="btn btn-sm btn-primary" data-save-dest>Save</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div class="admin-pane" data-pane="fares" hidden><div id="admin-fares" class="table-wrap"></div></div>
        <div class="admin-pane" data-pane="rates" hidden><div id="admin-rates" class="table-wrap"></div></div>
        <div class="admin-pane" data-pane="baselines" hidden><div id="admin-baselines" class="table-wrap"></div></div>
        <div class="admin-pane" data-pane="messages" hidden><div id="admin-messages"></div></div>
        <div class="admin-pane" data-pane="users" hidden><div id="admin-users" class="table-wrap"></div></div>
      </section>
    </>,
    { title: 'Admin', noindex: true, path: '/admin', scripts: ['/static/admin.js'] }
  )
}
