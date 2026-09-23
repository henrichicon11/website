import type { Row } from '../types'
import { estimateRoute } from './transport'

export type PlannerStop = { destination_slug: string; nights: number; activity_slugs?: string[] }
export type PlannerInput = {
  start_place?: string
  tier: 'budget' | 'standard' | 'luxury'
  travelers: number
  resident?: 'foreign' | 'eastafrican'
  stops: PlannerStop[]
  return_to_start?: boolean
}
export type Line = { label: string; min: number; max: number; kind: string }

/** Pick a transport mode that fits the tier. */
const MODE_BY_TIER: Record<string, string[]> = {
  budget: ['bus', 'minibus'],
  standard: ['special_hire', 'private_car', 'bus'],
  luxury: ['tourist_van', 'flight', 'special_hire']
}

export async function computeBudget(db: D1Database, input: PlannerInput, fx: number) {
  const tier = await db.prepare('SELECT * FROM cost_baselines WHERE tier=?').bind(input.tier).first<Row>()
  if (!tier) return { error: 'Unknown tier' }
  const travelers = Math.max(1, Math.min(20, input.travelers || 1))
  const stops = (input.stops || []).filter((s) => s.destination_slug).slice(0, 12)
  if (!stops.length) return { error: 'Add at least one destination' }

  const slugs = stops.map((s) => s.destination_slug)
  const ph = slugs.map(() => '?').join(',')
  const dests = (await db.prepare(`SELECT id,slug,name,short_name,latitude,longitude,entry_fee_foreign_usd,entry_fee_eastafrican_ugx,card_image FROM destinations WHERE slug IN (${ph})`).bind(...slugs).all<Row>()).results
  const byslug = new Map(dests.map((d) => [d.slug, d]))
  // find place for each destination (for routing)
  const places = (await db.prepare('SELECT slug,destination_id,latitude,longitude,is_hub FROM places').all<Row>()).results
  const placeFor = (d: Row) => {
    const exact = places.find((p) => p.slug === d.slug)
    if (exact) return exact.slug
    const mapped = places.filter((p) => p.destination_id === d.id)
    if (mapped.length) return mapped[0].slug
    // nearest place
    let best = places[0], bd = Infinity
    for (const p of places) {
      const dd = (p.latitude - d.latitude) ** 2 + (p.longitude - d.longitude) ** 2
      if (dd < bd) { bd = dd; best = p }
    }
    return best.slug
  }

  const lines: Line[] = []
  const days: Row[] = []
  let totalNights = 0
  let prevPlace = input.start_place || 'kampala'

  for (const s of stops) {
    const d = byslug.get(s.destination_slug)
    if (!d) continue
    const nights = Math.max(0, Math.min(30, s.nights ?? 1))
    const place = placeFor(d)
    let tmin = 0, tmax = 0, modeLabel = '—', distance = 0, hrs = ''
    if (place !== prevPlace) {
      const r: any = await estimateRoute(db, prevPlace, place, travelers)
      if (!r.error) {
        const prefs = MODE_BY_TIER[input.tier]
        const opt = prefs.map((m) => r.options.find((o: any) => o.mode === m)).find(Boolean) || r.options[0]
        if (opt) {
          tmin = opt.total_min_ugx; tmax = opt.total_max_ugx; modeLabel = opt.label
          hrs = `${opt.duration_hours_min}–${opt.duration_hours_max} h`
        }
        distance = r.distance_km
      }
    }
    // Activities
    let amin = 0, amax = 0
    const actNames: string[] = []
    if (s.activity_slugs?.length) {
      const aph = s.activity_slugs.map(() => '?').join(',')
      const acts = (await db.prepare(`SELECT name,cost_ugx_min,cost_ugx_max FROM activities WHERE destination_id=? AND slug IN (${aph})`).bind(d.id, ...s.activity_slugs).all<Row>()).results
      for (const a of acts) { amin += (a.cost_ugx_min || 0) * travelers; amax += (a.cost_ugx_max || 0) * travelers; actNames.push(a.name) }
    }
    const feeDays = Math.max(1, nights)
    const fee = input.resident === 'eastafrican'
      ? (d.entry_fee_eastafrican_ugx || 0) * travelers * feeDays
      : Math.round((d.entry_fee_foreign_usd || 0) * fx) * travelers * feeDays

    if (tmax) lines.push({ label: `Transport to ${d.short_name || d.name} (${modeLabel})`, min: tmin, max: tmax, kind: 'transport' })
    if (fee) lines.push({ label: `Entry fees — ${d.short_name || d.name}`, min: fee, max: fee, kind: 'fees' })
    if (amax) lines.push({ label: `Activities — ${d.short_name || d.name}`, min: amin, max: amax, kind: 'activities' })
    days.push({ destination: d.name, slug: d.slug, image: d.card_image, nights, transport: modeLabel, distance_km: distance, travel_time: hrs, activities: actNames })
    totalNights += nights
    prevPlace = place
  }

  if (input.return_to_start && prevPlace !== (input.start_place || 'kampala')) {
    const r: any = await estimateRoute(db, prevPlace, input.start_place || 'kampala', travelers)
    if (!r.error) {
      const prefs = MODE_BY_TIER[input.tier]
      const opt = prefs.map((m) => r.options.find((o: any) => o.mode === m)).find(Boolean) || r.options[0]
      if (opt) lines.push({ label: `Return transport (${opt.label})`, min: opt.total_min_ugx, max: opt.total_max_ugx, kind: 'transport' })
    }
  }

  const nights = Math.max(1, totalNights)
  const tripDays = nights + 1
  lines.push({ label: `Accommodation — ${nights} night(s)`, min: tier.accommodation_ugx_min * nights * travelers, max: tier.accommodation_ugx_max * nights * travelers, kind: 'accommodation' })
  lines.push({ label: `Food & drink — ${tripDays} day(s)`, min: tier.food_ugx_min * tripDays * travelers, max: tier.food_ugx_max * tripDays * travelers, kind: 'food' })
  lines.push({ label: 'Miscellaneous (tips, SIM, water, extras)', min: tier.misc_ugx * tripDays * travelers, max: Math.round(tier.misc_ugx * tripDays * travelers * 1.5), kind: 'misc' })


  const total_min = lines.reduce((s, l) => s + l.min, 0)
  const total_max = lines.reduce((s, l) => s + l.max, 0)
  const byKind: Record<string, { min: number; max: number }> = {}
  for (const l of lines) {
    byKind[l.kind] ??= { min: 0, max: 0 }
    byKind[l.kind].min += l.min; byKind[l.kind].max += l.max
  }
  return {
    tier: tier.tier, tier_label: tier.label, tier_description: tier.description,
    travelers, nights, days: tripDays, stops: days, lines, by_kind: byKind,
    total_min, total_max,
    per_person_min: Math.round(total_min / travelers), per_person_max: Math.round(total_max / travelers),
    per_day_min: Math.round(total_min / tripDays), per_day_max: Math.round(total_max / tripDays)
  }
}
