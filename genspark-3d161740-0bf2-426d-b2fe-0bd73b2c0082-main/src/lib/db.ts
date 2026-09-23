import type { Row } from '../types'
import { hydrate, hydrateAll, parseJSON } from './format'

export const CARD_COLS = `d.id,d.slug,d.name,d.short_name,d.tagline,d.intro,d.card_image,d.hero_image,d.latitude,d.longitude,
  d.distance_from_kampala_km,d.drive_hours_min,d.drive_hours_max,d.cost_from_ugx,d.entry_fee_foreign_usd,d.best_time,
  d.experience_tags,d.budget_level,d.budget_levels,d.recommended_days,d.duration_band,d.difficulty,d.popularity,d.featured,
  d.region_id,r.name AS region_name,r.slug AS region_slug`

export type DestFilters = {
  q?: string; region?: string; category?: string; experience?: string; budget?: string
  duration?: string; difficulty?: string; sort?: string; featured?: boolean; limit?: number; offset?: number
}

export async function listDestinations(db: D1Database, f: DestFilters = {}) {
  const where: string[] = []
  const args: any[] = []
  if (f.q) {
    where.push('(d.name LIKE ? OR d.tagline LIKE ? OR d.intro LIKE ? OR d.district LIKE ? OR d.highlights LIKE ?)')
    const like = `%${f.q.slice(0, 80)}%`
    args.push(like, like, like, like, like)
  }
  if (f.region) { where.push('r.slug = ?'); args.push(f.region) }
  if (f.category) {
    where.push('d.id IN (SELECT dc.destination_id FROM destination_categories dc JOIN categories c ON c.id=dc.category_id WHERE c.slug=?)')
    args.push(f.category)
  }
  if (f.experience) { where.push(`d.experience_tags LIKE ?`); args.push(`%"${f.experience.replace(/[^a-z]/g, '')}"%`) }
  if (f.budget) { where.push(`d.budget_levels LIKE ?`); args.push(`%"${f.budget.replace(/[^a-z]/g, '')}"%`) }
  if (f.duration) { where.push(`d.duration_band LIKE ?`); args.push(`%"${f.duration.replace(/[^a-z0-9-]/g, '')}"%`) }
  if (f.difficulty) { where.push('d.difficulty = ?'); args.push(f.difficulty) }
  if (f.featured) where.push('d.featured = 1')
  const order = {
    popular: 'd.popularity DESC', name: 'd.name ASC', distance: 'd.distance_from_kampala_km ASC',
    cost: 'COALESCE(d.cost_from_ugx,0) ASC', fee: 'COALESCE(d.entry_fee_foreign_usd,0) ASC'
  }[f.sort || 'popular'] || 'd.popularity DESC'
  const sqlWhere = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const limit = Math.min(100, f.limit ?? 60)
  const offset = Math.max(0, f.offset ?? 0)
  const [rows, count] = await Promise.all([
    db.prepare(`SELECT ${CARD_COLS} FROM destinations d LEFT JOIN regions r ON r.id=d.region_id ${sqlWhere} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .bind(...args, limit, offset).all<Row>(),
    db.prepare(`SELECT COUNT(*) AS n FROM destinations d LEFT JOIN regions r ON r.id=d.region_id ${sqlWhere}`).bind(...args).first<{ n: number }>()
  ])
  return { items: hydrateAll(rows.results), total: count?.n ?? 0 }
}

export async function getDestination(db: D1Database, slug: string) {
  const d = hydrate(await db.prepare(
    `SELECT d.*, r.name AS region_name, r.slug AS region_slug FROM destinations d LEFT JOIN regions r ON r.id=d.region_id WHERE d.slug=?`
  ).bind(slug).first<Row>())
  if (!d) return null
  const nearbySlugs: string[] = Array.isArray(d.nearby) ? d.nearby : []
  const [activities, gallery, categories, accommodations, guides, reviews, nearby] = await Promise.all([
    db.prepare('SELECT * FROM activities WHERE destination_id=? ORDER BY sort').bind(d.id).all<Row>(),
    db.prepare('SELECT * FROM gallery_images WHERE destination_id=? ORDER BY sort').bind(d.id).all<Row>(),
    db.prepare('SELECT c.* FROM categories c JOIN destination_categories dc ON dc.category_id=c.id WHERE dc.destination_id=? ORDER BY c.sort').bind(d.id).all<Row>(),
    db.prepare(`SELECT * FROM accommodations WHERE destination_id=? ORDER BY CASE category WHEN 'budget' THEN 1 WHEN 'midrange' THEN 2 ELSE 3 END`).bind(d.id).all<Row>(),
    db.prepare('SELECT g.slug,g.title,g.excerpt,g.icon,g.read_minutes FROM travel_guides g JOIN destination_guides dg ON dg.guide_id=g.id WHERE dg.destination_id=?').bind(d.id).all<Row>(),
    db.prepare(`SELECT author_name,rating,title,body,visited_on,created_at FROM reviews WHERE destination_id=? AND status='approved' ORDER BY created_at DESC LIMIT 20`).bind(d.id).all<Row>(),
    nearbySlugs.length
      ? db.prepare(`SELECT ${CARD_COLS} FROM destinations d LEFT JOIN regions r ON r.id=d.region_id WHERE d.slug IN (${nearbySlugs.map(() => '?').join(',')})`).bind(...nearbySlugs).all<Row>()
      : Promise.resolve({ results: [] as Row[] })
  ])
  const rating = reviews.results.length
    ? reviews.results.reduce((s, r) => s + r.rating, 0) / reviews.results.length
    : null
  return {
    ...d,
    activities: hydrateAll(activities.results),
    gallery: gallery.results,
    categories: categories.results,
    accommodations: hydrateAll(accommodations.results),
    guides: guides.results,
    reviews: reviews.results,
    rating,
    nearby_destinations: hydrateAll(nearby.results)
  }
}

export async function getSettings(db: D1Database) {
  const rows = (await db.prepare('SELECT key,value FROM settings').all<{ key: string; value: string }>()).results
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>
}

export type FxRates = { base: 'UGX'; rates: Record<string, number>; source: string; date: string }

/** FX rates (UGX base). Live from open.er-api.com, cached 12h in D1, with a seeded fallback. */
export async function getFx(db: D1Database): Promise<FxRates> {
  const cached = await db.prepare('SELECT rates,source,fetched_at FROM currency_rates ORDER BY id DESC LIMIT 1').first<Row>()
  if (cached && Date.now() - new Date(cached.fetched_at + 'Z').getTime() < 12 * 3600e3) {
    return { base: 'UGX', rates: parseJSON(cached.rates, {}), source: cached.source, date: cached.fetched_at }
  }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3500)
    const res = await fetch('https://open.er-api.com/v6/latest/UGX', { signal: ctrl.signal })
    clearTimeout(t)
    if (res.ok) {
      const j: any = await res.json()
      if (j?.rates?.USD) {
        const rates = { USD: j.rates.USD, EUR: j.rates.EUR, GBP: j.rates.GBP, KES: j.rates.KES }
        await db.prepare('INSERT INTO currency_rates (base,rates,source) VALUES (?,?,?)').bind('UGX', JSON.stringify(rates), 'open.er-api.com').run()
        await db.prepare('DELETE FROM currency_rates WHERE id NOT IN (SELECT id FROM currency_rates ORDER BY id DESC LIMIT 5)').run()
        return { base: 'UGX', rates, source: 'open.er-api.com', date: new Date().toISOString() }
      }
    }
  } catch { /* offline — fall through */ }
  if (cached) return { base: 'UGX', rates: parseJSON(cached.rates, {}), source: cached.source + ' (stale)', date: cached.fetched_at }
  const s = await getSettings(db)
  return { base: 'UGX', rates: parseJSON(s.fx_fallback, { USD: 0.000266 }), source: 'fallback', date: s.fx_fallback_date || '' }
}

/** UGX per 1 USD */
export async function ugxPerUsd(db: D1Database) {
  const fx = await getFx(db)
  return fx.rates.USD ? Math.round(1 / fx.rates.USD) : 3750
}

/** 7-day forecast from Open-Meteo (no key), cached 3h per location. */
export async function getWeather(db: D1Database, lat: number, lng: number) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  const cached = await db.prepare('SELECT payload,fetched_at FROM weather_cache WHERE cache_key=?').bind(key).first<Row>()
  if (cached && Date.now() - new Date(cached.fetched_at + 'Z').getTime() < 3 * 3600e3) return parseJSON(cached.payload, null)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FKampala&forecast_days=7`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3500)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) throw new Error('weather ' + res.status)
    const j = await res.json()
    await db.prepare(`INSERT INTO weather_cache (cache_key,payload,fetched_at) VALUES (?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload, fetched_at=CURRENT_TIMESTAMP`).bind(key, JSON.stringify(j)).run()
    return j
  } catch {
    return cached ? parseJSON(cached.payload, null) : null
  }
}

export const WEATHER_CODES: Record<number, [string, string]> = {
  0: ['Clear sky', 'fa-sun'], 1: ['Mainly clear', 'fa-sun'], 2: ['Partly cloudy', 'fa-cloud-sun'], 3: ['Overcast', 'fa-cloud'],
  45: ['Fog', 'fa-smog'], 48: ['Fog', 'fa-smog'], 51: ['Light drizzle', 'fa-cloud-rain'], 53: ['Drizzle', 'fa-cloud-rain'],
  55: ['Heavy drizzle', 'fa-cloud-rain'], 61: ['Light rain', 'fa-cloud-rain'], 63: ['Rain', 'fa-cloud-showers-heavy'],
  65: ['Heavy rain', 'fa-cloud-showers-heavy'], 80: ['Showers', 'fa-cloud-sun-rain'], 81: ['Showers', 'fa-cloud-showers-heavy'],
  82: ['Violent showers', 'fa-cloud-showers-heavy'], 95: ['Thunderstorm', 'fa-cloud-bolt'], 96: ['Thunderstorm', 'fa-cloud-bolt'], 99: ['Thunderstorm', 'fa-cloud-bolt']
}
