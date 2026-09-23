import type { Row } from '../types'

export const parseJSON = <T = any>(v: unknown, fallback: T): T => {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v !== 'string') return v as T
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

const JSON_FIELDS = [
  'highlights', 'wildlife', 'what_to_pack', 'nearby', 'experience_tags', 'budget_levels', 'duration_band',
  'what_to_bring', 'waypoints', 'alt_waypoints', 'tags', 'best_for', 'tips', 'schedule', 'activities',
  'amenities', 'payload', 'summary_json'
]

/** Decode JSON-encoded columns on a DB row. */
export const hydrate = <T extends Row>(row: T | null): T | null => {
  if (!row) return row
  const out: Row = { ...row }
  for (const k of JSON_FIELDS) if (k in out && typeof out[k] === 'string') out[k] = parseJSON(out[k], out[k])
  return out as T
}
export const hydrateAll = <T extends Row>(rows: T[]): T[] => rows.map((r) => hydrate(r) as T)

export const ugx = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : 'UGX ' + Math.round(n).toLocaleString('en-US')

export const ugxShort = (n: number | null | undefined) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return 'UGX ' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return 'UGX ' + Math.round(n / 1_000) + 'k'
  return 'UGX ' + Math.round(n)
}

export const usd = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : 'USD ' + Math.round(n).toLocaleString('en-US')

export const hours = (min?: number | null, max?: number | null) => {
  const f = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)} min`
    const whole = Math.floor(h)
    const m = Math.round((h - whole) * 60)
    return m ? `${whole}h ${m}m` : `${whole}h`
  }
  if (min == null && max == null) return '—'
  if (min == null || max == null || Math.abs(min - max) < 0.05) return f((min ?? max) as number)
  return `${f(min)}–${f(max)}`
}

export const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const inline = (s: string) =>
  escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')

/**
 * Minimal, safe markdown renderer (HTML is escaped first).
 * Supports: ## / ### headings, - lists, paragraphs, **bold**, *italic*, [links](/x)
 */
export const md = (src?: string | null): string => {
  if (!src) return ''
  const blocks = src.replace(/\r/g, '').split(/\n{2,}/)
  const html: string[] = []
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '')
    if (!lines.length) continue
    let buf: string[] = []
    let list: string[] = []
    const flushP = () => {
      if (buf.length) html.push(`<p>${inline(buf.join(' '))}</p>`)
      buf = []
    }
    const flushL = () => {
      if (list.length) html.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`)
      list = []
    }
    for (const line of lines) {
      const h = /^(#{2,3})\s+(.*)$/.exec(line)
      if (h) {
        flushP(); flushL()
        const lvl = h[1].length
        const id = h[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        html.push(`<h${lvl} id="${id}">${inline(h[2])}</h${lvl}>`)
      } else if (/^\s*[-*]\s+/.test(line)) {
        flushP()
        list.push(line.replace(/^\s*[-*]\s+/, ''))
      } else {
        flushL()
        buf.push(line.trim())
      }
    }
    flushP(); flushL()
  }
  return html.join('\n')
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)

export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(lat2 - lat1)
  const dLon = toR(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export const clampInt = (v: unknown, min: number, max: number, dflt: number) => {
  const n = parseInt(String(v ?? ''), 10)
  if (!Number.isFinite(n)) return dflt
  return Math.max(min, Math.min(max, n))
}
