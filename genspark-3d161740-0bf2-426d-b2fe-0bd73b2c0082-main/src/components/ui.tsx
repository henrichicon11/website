import { raw } from 'hono/html'
import type { Row } from '../types'
import { hours, ugx, usd, cap } from '../lib/format'

/** Price rendered in UGX, client JS converts to the selected currency. */
export const Money = ({ v, max, short }: { v: number | null | undefined; max?: number | null; short?: boolean }) => {
  if (v === null || v === undefined) return <span>—</span>
  return (
    <span class="money" data-ugx={String(Math.round(v))} data-ugx-max={max != null ? String(Math.round(max)) : undefined} data-short={short ? '1' : undefined}>
      {max != null && max !== v ? `${ugx(v)} – ${ugx(max).replace('UGX ', '')}` : ugx(v)}
    </span>
  )
}

export const Html = ({ html }: { html: string }) => <>{raw(html)}</>

export const FavButton = ({ kind, slug, label }: { kind: 'destination' | 'guide' | 'itinerary'; slug: string; label?: boolean }) => (
  <button class={`fav-btn${label ? ' fav-btn-label' : ''}`} data-fav={kind} data-slug={slug} aria-pressed="false" aria-label="Save to favourites">
    <i class="fa-regular fa-heart"></i>{label && <span> Save</span>}
  </button>
)

export const DestCard = ({ d }: { d: Row }) => (
  <article class="card dest-card">
    <a href={`/destinations/${d.slug}`} class="card-media">
      <img src={d.card_image || d.hero_image} alt={d.name} loading="lazy" decoding="async" />
      {d.region_name && <span class="chip chip-overlay">{d.region_name}</span>}
    </a>
    <FavButton kind="destination" slug={d.slug} />
    <div class="card-body">
      <h3><a href={`/destinations/${d.slug}`}>{d.name}</a></h3>
      <p class="card-tag">{d.tagline}</p>
      <ul class="meta-row">
        {d.distance_from_kampala_km > 0 && <li title="Distance from Kampala"><i class="fa-solid fa-route"></i> {Math.round(d.distance_from_kampala_km)} km</li>}
        {d.drive_hours_max > 0 && <li title="Drive time from Kampala"><i class="fa-regular fa-clock"></i> {hours(d.drive_hours_min, d.drive_hours_max)}</li>}
        {d.best_time && <li title="Best time to visit"><i class="fa-regular fa-sun"></i> {d.best_time}</li>}
      </ul>
      <div class="card-foot">
        {d.entry_fee_foreign_usd ? <span class="price-label">Entry from <strong>{usd(d.entry_fee_foreign_usd)}</strong></span>
          : d.cost_from_ugx ? <span class="price-label">Travel from <strong><Money v={d.cost_from_ugx} short /></strong></span>
          : <span class="price-label">Free to explore</span>}
        <a href={`/destinations/${d.slug}`} class="link-arrow">Explore <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </div>
  </article>
)

export const PageHero = ({ title, kicker, sub, image, children, small }: { title: string; kicker?: string; sub?: string; image?: string | null; children?: any; small?: boolean }) => (
  <section class={`page-hero${small ? ' page-hero-sm' : ''}${image ? '' : ' page-hero-plain'}`} style={image ? `--hero:url('${image}')` : undefined}>
    <div class="container page-hero-inner">
      {kicker && <p class="kicker">{kicker}</p>}
      <h1>{title}</h1>
      {sub && <p class="lead">{sub}</p>}
      {children}
    </div>
  </section>
)

export const Breadcrumbs = ({ items }: { items: [string, string?][] }) => (
  <nav class="breadcrumbs container" aria-label="Breadcrumb">
    <ol>
      {items.map(([label, href], i) => (
        <li>{href && i < items.length - 1 ? <a href={href}>{label}</a> : <span aria-current="page">{label}</span>}</li>
      ))}
    </ol>
  </nav>
)

export const SectionHead = ({ kicker, title, sub, link }: { kicker?: string; title: string; sub?: string; link?: [string, string] }) => (
  <div class="section-head">
    <div>
      {kicker && <p class="kicker">{kicker}</p>}
      <h2>{title}</h2>
      {sub && <p class="muted">{sub}</p>}
    </div>
    {link && <a href={link[1]} class="link-arrow">{link[0]} <i class="fa-solid fa-arrow-right"></i></a>}
  </div>
)

export const Stars = ({ n }: { n: number }) => (
  <span class="stars" aria-label={`${n.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => <i class={i <= Math.round(n) ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>)}
  </span>
)

export const DifficultyBadge = ({ level }: { level?: string | null }) =>
  level ? <span class={`badge badge-${level}`}>{cap(level)}</span> : null

export const Empty = ({ icon, title, children }: { icon: string; title: string; children?: any }) => (
  <div class="empty">
    <i class={`fa-solid ${icon}`}></i>
    <h3>{title}</h3>
    {children}
  </div>
)
