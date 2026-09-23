import { Hono } from 'hono'
import type { AppEnv, Row } from './types'
import { listDestinations, getDestination, getFx, getWeather, getSettings, ugxPerUsd } from './lib/db'
import { estimateRoute } from './lib/transport'
import { computeBudget, type PlannerInput } from './lib/budget'
import { hashPassword, verifyPassword, createSession, destroySession, requireUser, requireAdmin, isEmail } from './lib/auth'
import { hydrateAll, clampInt, parseJSON } from './lib/format'

const api = new Hono<AppEnv>()

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
async function body(c: any): Promise<Row> {
  const ct = c.req.header('content-type') || ''
  try {
    if (ct.includes('application/json')) return (await c.req.json()) ?? {}
    return Object.fromEntries((await c.req.formData()).entries())
  } catch { return {} }
}

api.get('/health', (c) => c.json({ ok: true, service: 'discover-uganda', time: new Date().toISOString() }))

// ---------------- Content ----------------
api.get('/destinations', async (c) => {
  const q = c.req.query()
  const res = await listDestinations(c.env.DB, {
    q: q.q, region: q.region, category: q.category, experience: q.experience, budget: q.budget,
    duration: q.duration, difficulty: q.difficulty, sort: q.sort, featured: q.featured === '1',
    limit: clampInt(q.limit, 1, 100, 60), offset: clampInt(q.offset, 0, 10000, 0)
  })
  c.header('Cache-Control', 'public, max-age=60')
  return c.json(res)
})

api.get('/destinations/:slug', async (c) => {
  const d = await getDestination(c.env.DB, c.req.param('slug'))
  if (!d) return c.json({ error: 'Not found' }, 404)
  return c.json(d)
})

api.get('/map', async (c) => {
  const rows = (await c.env.DB.prepare(
    `SELECT d.slug,d.name,d.tagline,d.card_image,d.latitude,d.longitude,d.distance_from_kampala_km,d.best_time,d.entry_fee_foreign_usd,
      r.slug AS region, (SELECT GROUP_CONCAT(c.slug) FROM destination_categories dc JOIN categories c ON c.id=dc.category_id WHERE dc.destination_id=d.id) AS categories
     FROM destinations d LEFT JOIN regions r ON r.id=d.region_id WHERE d.latitude IS NOT NULL`
  ).all<Row>()).results
  const cats = (await c.env.DB.prepare(`SELECT slug,name,icon FROM categories WHERE kind='type' ORDER BY sort`).all()).results
  c.header('Cache-Control', 'public, max-age=300')
  return c.json({ categories: cats, points: rows.map((r) => ({ ...r, categories: (r.categories || '').split(',').filter(Boolean) })) })
})

api.get('/places', async (c) => {
  const rows = (await c.env.DB.prepare(
    `SELECT p.slug,p.name,p.kind,p.is_hub,p.latitude,p.longitude,r.name AS region FROM places p LEFT JOIN regions r ON r.id=p.region_id ORDER BY p.is_hub DESC, p.name`
  ).all()).results
  c.header('Cache-Control', 'public, max-age=300')
  return c.json(rows)
})

api.get('/transport/estimate', async (c) => {
  const from = str(c.req.query('from'), 60)
  const to = str(c.req.query('to'), 60)
  const travelers = clampInt(c.req.query('travelers'), 1, 50, 1)
  if (!from || !to) return c.json({ error: 'from and to are required' }, 400)
  const s = await getSettings(c.env.DB)
  const r = await estimateRoute(c.env.DB, from, to, travelers, s.transport_disclaimer)
  if ('error' in r) return c.json(r, 400)
  return c.json(r)
})

api.get('/transport/routes', async (c) => {
  const rows = (await c.env.DB.prepare(
    `SELECT t.slug,t.distance_km,t.duration_hours_min,t.duration_hours_max,t.road_quality,pf.slug AS from_slug,pf.name AS from_name,pt.slug AS to_slug,pt.name AS to_name,
      (SELECT MIN(fare_min_ugx) FROM transport_fares f WHERE f.route_id=t.id AND f.per_person=1) AS fare_from
     FROM transport_routes t JOIN places pf ON pf.id=t.from_place_id JOIN places pt ON pt.id=t.to_place_id ORDER BY pf.is_hub DESC, t.distance_km`
  ).all()).results
  return c.json(rows)
})

api.post('/planner/estimate', async (c) => {
  const b = await body(c)
  const input: PlannerInput = {
    start_place: str(b.start_place, 60) || 'kampala',
    tier: (['budget', 'standard', 'luxury'].includes(b.tier) ? b.tier : 'standard'),
    travelers: clampInt(b.travelers, 1, 20, 2),
    resident: b.resident === 'eastafrican' ? 'eastafrican' : 'foreign',
    stops: Array.isArray(b.stops) ? b.stops.map((s: Row) => ({
      destination_slug: str(s.destination_slug, 80), nights: clampInt(s.nights, 0, 30, 1),
      activity_slugs: Array.isArray(s.activity_slugs) ? s.activity_slugs.slice(0, 20).map((x: unknown) => str(x, 80)) : []
    })) : [],
    return_to_start: b.return_to_start !== false
  }
  const r = await computeBudget(c.env.DB, input, await ugxPerUsd(c.env.DB))
  if ('error' in r) return c.json(r, 400)
  return c.json(r)
})

api.get('/fx', async (c) => c.json(await getFx(c.env.DB)))

api.get('/weather/:slug', async (c) => {
  const d = await c.env.DB.prepare('SELECT latitude,longitude FROM destinations WHERE slug=?').bind(c.req.param('slug')).first<Row>()
  if (!d) return c.json({ error: 'Not found' }, 404)
  const w = await getWeather(c.env.DB, d.latitude, d.longitude)
  if (!w) return c.json({ error: 'Weather unavailable' }, 503)
  return c.json(w)
})

api.get('/search', async (c) => {
  const q = str(c.req.query('q'), 80)
  if (q.length < 2) return c.json({ destinations: [], guides: [], itineraries: [] })
  const like = `%${q}%`
  const [d, g, i] = await Promise.all([
    c.env.DB.prepare(`SELECT slug,name,tagline,card_image FROM destinations WHERE name LIKE ? OR tagline LIKE ? OR district LIKE ? OR highlights LIKE ? ORDER BY popularity DESC LIMIT 8`).bind(like, like, like, like).all(),
    c.env.DB.prepare(`SELECT slug,title,excerpt,icon FROM travel_guides WHERE title LIKE ? OR excerpt LIKE ? OR tags LIKE ? LIMIT 5`).bind(like, like, like).all(),
    c.env.DB.prepare(`SELECT slug,title,days FROM itineraries WHERE title LIKE ? OR summary LIKE ? LIMIT 4`).bind(like, like).all()
  ])
  return c.json({ destinations: d.results, guides: g.results, itineraries: i.results })
})

api.get('/guides', async (c) => {
  const cat = c.req.query('category')
  const rows = cat
    ? await c.env.DB.prepare('SELECT slug,title,category,excerpt,icon,read_minutes,hero_image,tags FROM travel_guides WHERE category=? ORDER BY sort').bind(cat).all<Row>()
    : await c.env.DB.prepare('SELECT slug,title,category,excerpt,icon,read_minutes,hero_image,tags FROM travel_guides ORDER BY sort').all<Row>()
  return c.json(hydrateAll(rows.results))
})

api.get('/itineraries', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM itineraries ORDER BY featured DESC, days').all<Row>()
  return c.json(hydrateAll(rows.results))
})

// ---------------- Auth ----------------
api.post('/auth/register', async (c) => {
  const b = await body(c)
  const email = str(b.email, 200).toLowerCase()
  const name = str(b.name, 100)
  const password = typeof b.password === 'string' ? b.password : ''
  if (!isEmail(email)) return c.json({ error: 'Enter a valid email address' }, 400)
  if (name.length < 2) return c.json({ error: 'Enter your name' }, 400)
  if (password.length < 8 || password.length > 200) return c.json({ error: 'Password must be at least 8 characters' }, 400)
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first()
  if (exists) return c.json({ error: 'An account with that email already exists' }, 409)
  const hash = await hashPassword(password)
  const r = await c.env.DB.prepare('INSERT INTO users (email,name,password_hash,country) VALUES (?,?,?,?)')
    .bind(email, name, hash, str(b.country, 60) || null).run()
  await createSession(c, r.meta.last_row_id as number)
  return c.json({ ok: true, user: { email, name, role: 'user' } })
})

api.post('/auth/login', async (c) => {
  const b = await body(c)
  const email = str(b.email, 200).toLowerCase()
  const password = typeof b.password === 'string' ? b.password : ''
  const u = await c.env.DB.prepare('SELECT id,email,name,role,password_hash FROM users WHERE email=?').bind(email).first<Row>()
  if (!u || !(await verifyPassword(password, u.password_hash))) return c.json({ error: 'Incorrect email or password' }, 401)
  await createSession(c, u.id)
  return c.json({ ok: true, user: { email: u.email, name: u.name, role: u.role } })
})

api.post('/auth/logout', async (c) => {
  await destroySession(c)
  return c.json({ ok: true })
})

api.get('/auth/me', (c) => c.json({ user: c.get('user') }))

// ---------------- Favorites ----------------
api.get('/favorites', requireUser, async (c) => {
  const u = c.get('user')!
  const rows = (await c.env.DB.prepare(
    `SELECT f.id,f.kind,d.slug AS destination_slug,d.name AS destination_name,d.card_image,d.tagline,
      g.slug AS guide_slug,g.title AS guide_title,i.slug AS itinerary_slug,i.title AS itinerary_title
     FROM favorites f LEFT JOIN destinations d ON d.id=f.destination_id LEFT JOIN travel_guides g ON g.id=f.guide_id
     LEFT JOIN itineraries i ON i.id=f.itinerary_id WHERE f.user_id=? ORDER BY f.created_at DESC`
  ).bind(u.id).all()).results
  return c.json(rows)
})

const FAV_TABLE: Record<string, [string, string]> = {
  destination: ['destinations', 'destination_id'], guide: ['travel_guides', 'guide_id'], itinerary: ['itineraries', 'itinerary_id']
}

api.post('/favorites', requireUser, async (c) => {
  const u = c.get('user')!
  const b = await body(c)
  const kind = FAV_TABLE[b.kind] ? b.kind : 'destination'
  const [table, col] = FAV_TABLE[kind]
  const item = await c.env.DB.prepare(`SELECT id FROM ${table} WHERE slug=?`).bind(str(b.slug, 120)).first<Row>()
  if (!item) return c.json({ error: 'Not found' }, 404)
  const existing = await c.env.DB.prepare(`SELECT id FROM favorites WHERE user_id=? AND ${col}=?`).bind(u.id, item.id).first<Row>()
  if (existing) {
    await c.env.DB.prepare('DELETE FROM favorites WHERE id=?').bind(existing.id).run()
    return c.json({ saved: false })
  }
  await c.env.DB.prepare(`INSERT INTO favorites (user_id,${col},kind) VALUES (?,?,?)`).bind(u.id, item.id, kind).run()
  return c.json({ saved: true })
})

api.get('/favorites/slugs', async (c) => {
  const u = c.get('user')
  if (!u) return c.json({ signed_in: false, destinations: [], guides: [], itineraries: [] })
  const rows = (await c.env.DB.prepare(
    `SELECT d.slug AS d, g.slug AS g, i.slug AS i FROM favorites f LEFT JOIN destinations d ON d.id=f.destination_id
     LEFT JOIN travel_guides g ON g.id=f.guide_id LEFT JOIN itineraries i ON i.id=f.itinerary_id WHERE f.user_id=?`
  ).bind(u.id).all<Row>()).results
  return c.json({
    signed_in: true,
    destinations: rows.map((r) => r.d).filter(Boolean), guides: rows.map((r) => r.g).filter(Boolean), itineraries: rows.map((r) => r.i).filter(Boolean)
  })
})

// ---------------- Saved trips ----------------
api.get('/trips', requireUser, async (c) => {
  const rows = (await c.env.DB.prepare('SELECT id,title,tier,travelers,payload,summary,created_at,updated_at FROM saved_trips WHERE user_id=? ORDER BY updated_at DESC')
    .bind(c.get('user')!.id).all<Row>()).results
  return c.json(rows.map((r) => ({ ...r, payload: parseJSON(r.payload, {}), summary: parseJSON(r.summary, {}) })))
})

api.post('/trips', requireUser, async (c) => {
  const b = await body(c)
  const title = str(b.title, 120) || 'My Uganda trip'
  const payload = JSON.stringify(b.payload ?? {}).slice(0, 20000)
  const summary = JSON.stringify(b.summary ?? {}).slice(0, 20000)
  const tier = ['budget', 'standard', 'luxury'].includes(b.tier) ? b.tier : 'standard'
  const travelers = clampInt(b.travelers, 1, 20, 2)
  const uid = c.get('user')!.id
  if (b.id) {
    const r = await c.env.DB.prepare('UPDATE saved_trips SET title=?,tier=?,travelers=?,payload=?,summary=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?')
      .bind(title, tier, travelers, payload, summary, clampInt(b.id, 1, 1e9, 0), uid).run()
    if (!r.meta.changes) return c.json({ error: 'Not found' }, 404)
    return c.json({ ok: true, id: b.id })
  }
  const count = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM saved_trips WHERE user_id=?').bind(uid).first<Row>()
  if ((count?.n ?? 0) >= 50) return c.json({ error: 'Trip limit reached (50)' }, 400)
  const r = await c.env.DB.prepare('INSERT INTO saved_trips (user_id,title,tier,travelers,payload,summary) VALUES (?,?,?,?,?,?)')
    .bind(uid, title, tier, travelers, payload, summary).run()
  return c.json({ ok: true, id: r.meta.last_row_id })
})

api.delete('/trips/:id', requireUser, async (c) => {
  await c.env.DB.prepare('DELETE FROM saved_trips WHERE id=? AND user_id=?').bind(clampInt(c.req.param('id'), 1, 1e9, 0), c.get('user')!.id).run()
  return c.json({ ok: true })
})

// ---------------- Reviews / newsletter / contact ----------------
api.post('/destinations/:slug/reviews', async (c) => {
  const d = await c.env.DB.prepare('SELECT id FROM destinations WHERE slug=?').bind(c.req.param('slug')).first<Row>()
  if (!d) return c.json({ error: 'Not found' }, 404)
  const b = await body(c)
  const u = c.get('user')
  const rating = clampInt(b.rating, 1, 5, 0)
  const text = str(b.body, 3000)
  const author = u?.name || str(b.author_name, 80)
  if (!rating) return c.json({ error: 'Choose a rating from 1 to 5' }, 400)
  if (text.length < 20) return c.json({ error: 'Please write at least 20 characters' }, 400)
  if (!author) return c.json({ error: 'Please add your name' }, 400)
  await c.env.DB.prepare('INSERT INTO reviews (user_id,destination_id,author_name,rating,title,body,visited_on) VALUES (?,?,?,?,?,?,?)')
    .bind(u?.id ?? null, d.id, author, rating, str(b.title, 120) || null, text, str(b.visited_on, 20) || null).run()
  return c.json({ ok: true, message: 'Thanks! Your review will appear once a moderator approves it.' })
})

api.post('/newsletter', async (c) => {
  const b = await body(c)
  const email = str(b.email, 200).toLowerCase()
  if (!isEmail(email)) return c.json({ error: 'Enter a valid email address' }, 400)
  await c.env.DB.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email,interests) VALUES (?,?)').bind(email, str(b.interests, 200) || null).run()
  return c.json({ ok: true, message: 'You\'re subscribed — look out for our next dispatch.' })
})

api.post('/contact', async (c) => {
  const b = await body(c)
  const email = str(b.email, 200)
  const message = str(b.message, 5000)
  if (!isEmail(email)) return c.json({ error: 'Enter a valid email address' }, 400)
  if (message.length < 10) return c.json({ error: 'Please write a message' }, 400)
  await c.env.DB.prepare('INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)')
    .bind(str(b.name, 100), email, str(b.subject, 150), message).run()
  return c.json({ ok: true, message: 'Message received. We usually reply within two working days.' })
})

// ---------------- Admin ----------------
const admin = new Hono<AppEnv>()
admin.use('*', requireAdmin)

admin.get('/stats', async (c) => {
  const q = (sql: string) => c.env.DB.prepare(sql).first<Row>().then((r) => r?.n ?? 0)
  const [destinations, users, reviews_pending, trips, subscribers, messages, routes] = await Promise.all([
    q('SELECT COUNT(*) n FROM destinations'), q('SELECT COUNT(*) n FROM users'),
    q(`SELECT COUNT(*) n FROM reviews WHERE status='pending'`), q('SELECT COUNT(*) n FROM saved_trips'),
    q('SELECT COUNT(*) n FROM newsletter_subscribers'), q('SELECT COUNT(*) n FROM contact_messages'),
    q('SELECT COUNT(*) n FROM transport_routes')
  ])
  return c.json({ destinations, users, reviews_pending, trips, subscribers, messages, routes })
})

admin.get('/reviews', async (c) => {
  const status = ['pending', 'approved', 'rejected'].includes(c.req.query('status') || '') ? c.req.query('status') : 'pending'
  const rows = (await c.env.DB.prepare(
    `SELECT r.*, d.name AS destination_name, d.slug AS destination_slug FROM reviews r JOIN destinations d ON d.id=r.destination_id WHERE r.status=? ORDER BY r.created_at DESC LIMIT 200`
  ).bind(status).all()).results
  return c.json(rows)
})

admin.patch('/reviews/:id', async (c) => {
  const b = await body(c)
  if (!['approved', 'rejected', 'pending'].includes(b.status)) return c.json({ error: 'Invalid status' }, 400)
  await c.env.DB.prepare('UPDATE reviews SET status=? WHERE id=?').bind(b.status, clampInt(c.req.param('id'), 1, 1e9, 0)).run()
  return c.json({ ok: true })
})

const DEST_EDITABLE = ['tagline', 'intro', 'best_time', 'cost_from_ugx', 'entry_fee_foreign_usd', 'entry_fee_eastafrican_ugx',
  'entry_fee_note', 'travel_advice', 'featured', 'popularity', 'hero_image', 'card_image']
admin.patch('/destinations/:slug', async (c) => {
  const b = await body(c)
  const sets: string[] = []
  const args: any[] = []
  for (const k of DEST_EDITABLE) if (k in b) {
    sets.push(`${k}=?`)
    const numeric = ['cost_from_ugx', 'entry_fee_foreign_usd', 'entry_fee_eastafrican_ugx', 'featured', 'popularity'].includes(k)
    args.push(numeric ? (b[k] === '' || b[k] === null ? null : Number(b[k])) : str(b[k], 5000))
  }
  if (!sets.length) return c.json({ error: 'Nothing to update' }, 400)
  const r = await c.env.DB.prepare(`UPDATE destinations SET ${sets.join(',')},updated_at=CURRENT_TIMESTAMP WHERE slug=?`).bind(...args, c.req.param('slug')).run()
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Not found' }, 404)
})

admin.get('/fares', async (c) => {
  const rows = (await c.env.DB.prepare(
    `SELECT f.*, t.slug AS route_slug, pf.name AS from_name, pt.name AS to_name FROM transport_fares f
     JOIN transport_routes t ON t.id=f.route_id JOIN places pf ON pf.id=t.from_place_id JOIN places pt ON pt.id=t.to_place_id ORDER BY t.slug, f.mode`
  ).all()).results
  return c.json(rows)
})

admin.patch('/fares/:id', async (c) => {
  const b = await body(c)
  const min = clampInt(b.fare_min_ugx, 0, 1e8, -1)
  const max = clampInt(b.fare_max_ugx, 0, 1e8, -1)
  if (min < 0 || max < min) return c.json({ error: 'Invalid fare range' }, 400)
  await c.env.DB.prepare('UPDATE transport_fares SET fare_min_ugx=?,fare_max_ugx=?,available=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(min, max, b.available === 0 || b.available === '0' ? 0 : 1, clampInt(c.req.param('id'), 1, 1e9, 0)).run()
  return c.json({ ok: true })
})

admin.get('/rates', async (c) => c.json((await c.env.DB.prepare('SELECT * FROM transport_mode_rates ORDER BY sort').all()).results))
admin.patch('/rates/:mode', async (c) => {
  const b = await body(c)
  const min = Number(b.ugx_per_km_min), max = Number(b.ugx_per_km_max)
  if (!(min >= 0 && max >= min)) return c.json({ error: 'Invalid rate range' }, 400)
  await c.env.DB.prepare('UPDATE transport_mode_rates SET ugx_per_km_min=?,ugx_per_km_max=? WHERE mode=?').bind(min, max, c.req.param('mode')).run()
  return c.json({ ok: true })
})

admin.get('/baselines', async (c) => c.json((await c.env.DB.prepare('SELECT * FROM cost_baselines').all()).results))
admin.patch('/baselines/:tier', async (c) => {
  const b = await body(c)
  const cols = ['accommodation_ugx_min', 'accommodation_ugx_max', 'food_ugx_min', 'food_ugx_max', 'activity_ugx_min', 'activity_ugx_max', 'misc_ugx']
  const sets = cols.filter((k) => k in b)
  if (!sets.length) return c.json({ error: 'Nothing to update' }, 400)
  await c.env.DB.prepare(`UPDATE cost_baselines SET ${sets.map((k) => `${k}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE tier=?`)
    .bind(...sets.map((k) => clampInt(b[k], 0, 1e9, 0)), c.req.param('tier')).run()
  return c.json({ ok: true })
})

admin.get('/messages', async (c) => c.json((await c.env.DB.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200').all()).results))
admin.get('/subscribers', async (c) => c.json((await c.env.DB.prepare('SELECT email,interests,created_at FROM newsletter_subscribers ORDER BY created_at DESC').all()).results))
admin.get('/users', async (c) => c.json((await c.env.DB.prepare('SELECT id,email,name,role,country,created_at FROM users ORDER BY created_at DESC LIMIT 500').all()).results))
admin.patch('/settings/:key', async (c) => {
  const allowed = ['fuel_price_ugx_per_litre', 'transport_disclaimer', 'site_tagline']
  const key = c.req.param('key')
  if (!allowed.includes(key)) return c.json({ error: 'Setting not editable' }, 400)
  const b = await body(c)
  await c.env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP').bind(key, str(b.value, 1000)).run()
  return c.json({ ok: true })
})

api.route('/admin', admin)
api.notFound((c) => c.json({ error: 'Not found' }, 404))

export default api
