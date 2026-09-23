import type { Row } from '../types'
import { haversineKm, parseJSON } from './format'

export type Place = {
  id: number; slug: string; name: string; kind: string; latitude: number; longitude: number
  is_hub: number; has_airstrip: number; destination_id: number | null; region_id: number
}
export type ModeRate = {
  mode: string; label: string; icon: string; ugx_per_km_min: number; ugx_per_km_max: number
  base_fare_min: number; base_fare_max: number; avg_speed_kmh: number; per_person: number
  max_distance_km: number | null; min_distance_km: number | null; comfort: number; description: string; sort: number
}
export type FareOption = {
  mode: string; label: string; icon: string; description: string
  fare_min_ugx: number; fare_max_ugx: number; per_person: boolean
  total_min_ugx: number; total_max_ugx: number
  duration_hours_min: number; duration_hours_max: number
  comfort: number; source: 'curated' | 'estimated'; notes: string | null
  recommended?: string[]
}
export type RouteResult = {
  from: Place; to: Place
  distance_km: number; duration_hours_min: number; duration_hours_max: number
  road_quality: string; waypoints: string[]
  alt?: { distance_km: number; waypoints: string[]; note: string } | null
  legs: { from: string; to: string; distance_km: number; road_quality: string }[]
  description: string | null
  transfers: number
  confidence: 'curated' | 'combined' | 'estimated'
  options: FareOption[]
  cheapest?: string; fastest?: string; most_comfortable?: string
  travelers: number
  disclaimer: string
}

const ROAD_FACTOR = 1.32 // straight-line to road-distance multiplier for Uganda's network
const round500 = (n: number) => Math.round(n / 500) * 500

type Edge = { to: number; km: number; hmin: number; hmax: number; road: string; route: Row; reversed: boolean }

export async function loadNetwork(db: D1Database) {
  const [places, routes, rates] = await Promise.all([
    db.prepare('SELECT * FROM places').all<Place>(),
    db.prepare('SELECT * FROM transport_routes').all<Row>(),
    db.prepare('SELECT * FROM transport_mode_rates ORDER BY sort').all<ModeRate>()
  ])
  const graph = new Map<number, Edge[]>()
  const add = (a: number, e: Edge) => (graph.get(a) ?? graph.set(a, []).get(a)!).push(e)
  for (const r of routes.results) {
    const base = { km: r.distance_km, hmin: r.duration_hours_min, hmax: r.duration_hours_max, road: r.road_quality, route: r }
    add(r.from_place_id, { ...base, to: r.to_place_id, reversed: false })
    add(r.to_place_id, { ...base, to: r.from_place_id, reversed: true })
  }
  return { places: places.results, routes: routes.results, rates: rates.results, graph }
}

function shortestPath(graph: Map<number, Edge[]>, from: number, to: number) {
  const dist = new Map<number, number>([[from, 0]])
  const prev = new Map<number, { node: number; edge: Edge }>()
  const visited = new Set<number>()
  // Small graph (dozens of nodes) — simple O(n²) Dijkstra is fine.
  while (true) {
    let u: number | null = null
    let best = Infinity
    for (const [n, d] of dist) if (!visited.has(n) && d < best) { best = d; u = n }
    if (u === null || u === to) break
    visited.add(u)
    for (const e of graph.get(u) ?? []) {
      const nd = best + e.km
      if (nd < (dist.get(e.to) ?? Infinity)) { dist.set(e.to, nd); prev.set(e.to, { node: u, edge: e }) }
    }
  }
  if (!dist.has(to)) return null
  const edges: Edge[] = []
  let cur = to
  while (cur !== from) { const p = prev.get(cur)!; edges.unshift(p.edge); cur = p.node }
  return edges
}

const worstRoad = (roads: string[]) => {
  const order = ['tarmac', 'mixed', 'murram', 'rough']
  return roads.reduce((w, r) => (order.indexOf(r) > order.indexOf(w) ? r : w), 'tarmac')
}

export async function estimateRoute(
  db: D1Database, fromSlug: string, toSlug: string, travelers = 1, disclaimer = ''
): Promise<RouteResult | { error: string }> {
  const net = await loadNetwork(db)
  const from = net.places.find((p) => p.slug === fromSlug)
  const to = net.places.find((p) => p.slug === toSlug)
  if (!from || !to) return { error: 'Unknown origin or destination' }
  if (from.id === to.id) return { error: 'Origin and destination are the same' }

  let distance = 0, hmin = 0, hmax = 0, road = 'tarmac', transfers = 0
  let waypoints: string[] = []
  let legs: RouteResult['legs'] = []
  let description: string | null = null
  let alt: RouteResult['alt'] = null
  let confidence: RouteResult['confidence'] = 'estimated'
  let curatedFares: Row[] = []
  const byId = new Map(net.places.map((p) => [p.id, p]))

  const direct = net.routes.find(
    (r) => (r.from_place_id === from.id && r.to_place_id === to.id) || (r.from_place_id === to.id && r.to_place_id === from.id)
  )
  const path = direct ? null : shortestPath(net.graph, from.id, to.id)
  const straight = haversineKm(from.latitude, from.longitude, to.latitude, to.longitude) * ROAD_FACTOR

  if (direct) {
    const reversed = direct.from_place_id !== from.id
    distance = direct.distance_km; hmin = direct.duration_hours_min; hmax = direct.duration_hours_max
    road = direct.road_quality; transfers = direct.transfers; description = direct.route_description
    const wp = parseJSON<string[]>(direct.waypoints, [])
    waypoints = reversed ? [...wp].reverse() : wp
    if (direct.alt_waypoints) {
      const awp = parseJSON<string[]>(direct.alt_waypoints, [])
      alt = { distance_km: direct.alt_distance_km, waypoints: reversed ? [...awp].reverse() : awp, note: direct.alt_note }
    }
    legs = [{ from: from.name, to: to.name, distance_km: distance, road_quality: road }]
    confidence = 'curated'
    curatedFares = (await db.prepare('SELECT * FROM transport_fares WHERE route_id=? AND available=1').bind(direct.id).all<Row>()).results
  } else if (path && path.reduce((s, e) => s + e.km, 0) <= straight * 1.6) {
    // Chain curated legs if it isn't an absurd detour compared with the straight line.
    let cur = from.id
    for (const e of path) {
      const a = byId.get(cur)!, b = byId.get(e.to)!
      legs.push({ from: a.name, to: b.name, distance_km: e.km, road_quality: e.road })
      distance += e.km; hmin += e.hmin; hmax += e.hmax
      const wp = parseJSON<string[]>(e.route.waypoints, [])
      const ordered = e.reversed ? [...wp].reverse() : wp
      waypoints.push(...(waypoints.length ? ordered.slice(1) : ordered))
      cur = e.to
    }
    road = worstRoad(path.map((e) => e.road))
    transfers = path.length - 1 + path.reduce((s, e) => s + (e.route.transfers || 0), 0)
    description = `No single curated route exists, so this journey is combined from ${path.length} known legs: ${legs.map((l) => `${l.from} → ${l.to}`).join(', ')}.`
    confidence = 'combined'
    // Where every leg has a curated fare for a mode, the summed leg fares beat a per-km estimate.
    const ids = path.map((e) => e.route.id)
    const legFares = (await db.prepare(`SELECT * FROM transport_fares WHERE available=1 AND route_id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all<Row>()).results
    for (const mode of new Set(legFares.map((f) => f.mode))) {
      const perLeg = ids.map((id) => legFares.find((f) => f.route_id === id && f.mode === mode))
      if (perLeg.every(Boolean)) {
        curatedFares.push({
          mode, fare_min_ugx: perLeg.reduce((s, f) => s + f!.fare_min_ugx, 0), fare_max_ugx: perLeg.reduce((s, f) => s + f!.fare_max_ugx, 0),
          duration_hours_min: perLeg.reduce((s, f) => s + (f!.duration_hours_min ?? 0), 0) + (path.length - 1) * 0.5,
          duration_hours_max: perLeg.reduce((s, f) => s + (f!.duration_hours_max ?? 0), 0) + (path.length - 1),
          notes: `Sum of curated fares for each leg, including ${path.length - 1} change(s).`
        })
      }
    }
  } else {
    distance = Math.round(straight)
    const speed = 45
    hmin = +(distance / speed).toFixed(1); hmax = +(distance / (speed * 0.78)).toFixed(1)
    road = 'mixed'; waypoints = [from.name, to.name]
    transfers = distance > 150 ? 1 : 0
    legs = [{ from: from.name, to: to.name, distance_km: distance, road_quality: road }]
    description = 'Estimated from straight-line distance with a road-network correction factor. Check the actual route before travelling.'
  }

  const roadSlow = road === 'rough' ? 1.25 : road === 'murram' ? 1.15 : road === 'mixed' ? 1.07 : 1
  const options: FareOption[] = []
  for (const rate of net.rates) {
    const curated = curatedFares.find((f) => f.mode === rate.mode)
    if (!curated) {
      if (rate.max_distance_km && distance > rate.max_distance_km) continue
      if (rate.min_distance_km && distance < rate.min_distance_km) continue
      // Kampala is served by Entebbe / Kajjansi airfields
      const air = (p: Place) => !!p.has_airstrip || p.slug === 'kampala'
      if (rate.mode === 'flight' && !(air(from) && air(to))) continue
    }
    let fmin: number, fmax: number, dmin: number, dmax: number
    let source: FareOption['source'] = 'estimated'
    let notes: string | null = null
    if (curated) {
      fmin = curated.fare_min_ugx; fmax = curated.fare_max_ugx
      dmin = curated.duration_hours_min ?? hmin; dmax = curated.duration_hours_max ?? hmax
      source = 'curated'; notes = curated.notes
    } else {
      fmin = round500(rate.base_fare_min + distance * rate.ugx_per_km_min * roadSlow)
      fmax = round500(rate.base_fare_max + distance * rate.ugx_per_km_max * roadSlow)
      if (rate.mode === 'flight') {
        dmin = +(distance / rate.avg_speed_kmh + 0.75).toFixed(1); dmax = +(dmin + 0.75).toFixed(1)
      } else if (['private_car', 'tourist_van', 'special_hire'].includes(rate.mode)) {
        dmin = hmin || +(distance / rate.avg_speed_kmh).toFixed(1); dmax = hmax || dmin * 1.25
      } else {
        const factor = rate.avg_speed_kmh >= 48 ? 1.1 : 1.2
        dmin = +((hmin || distance / rate.avg_speed_kmh) * factor).toFixed(1)
        dmax = +((hmax || distance / rate.avg_speed_kmh) * factor * 1.15 + transfers * 0.5).toFixed(1)
      }
      if (rate.mode === 'tourist_van') notes = 'Typically hired per day with a driver-guide; figure covers the whole vehicle for this distance.'
      if (rate.mode === 'motorcycle') notes = 'Only sensible for short hops — not recommended on highways.'
      if (rate.mode === 'flight') notes = 'Scheduled or charter service between airstrips; subject to availability.'
    }
    const pp = !!rate.per_person
    options.push({
      mode: rate.mode, label: rate.label, icon: rate.icon, description: rate.description,
      fare_min_ugx: fmin, fare_max_ugx: fmax, per_person: pp,
      total_min_ugx: pp ? fmin * travelers : fmin, total_max_ugx: pp ? fmax * travelers : fmax,
      duration_hours_min: dmin, duration_hours_max: dmax, comfort: rate.comfort, source, notes
    })
  }
  const pick = (fn: (o: FareOption) => number) => options.length ? options.reduce((a, b) => (fn(b) < fn(a) ? b : a)).mode : undefined
  const cheapest = pick((o) => o.total_min_ugx + o.total_max_ugx)
  const fastest = pick((o) => o.duration_hours_min + o.duration_hours_max)
  const most_comfortable = pick((o) => -o.comfort * 1e9 + o.total_min_ugx)
  for (const o of options) {
    o.recommended = []
    if (o.mode === cheapest) o.recommended.push('cheapest')
    if (o.mode === fastest) o.recommended.push('fastest')
    if (o.mode === most_comfortable) o.recommended.push('most comfortable')
  }
  return {
    from, to, distance_km: Math.round(distance), duration_hours_min: hmin, duration_hours_max: hmax,
    road_quality: road, waypoints, alt, legs, description, transfers, confidence, options,
    cheapest, fastest, most_comfortable, travelers, disclaimer
  }
}
