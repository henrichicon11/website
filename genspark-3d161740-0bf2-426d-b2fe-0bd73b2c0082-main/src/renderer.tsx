import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { raw } from 'hono/html'
import type { SessionUser } from './types'

export type PageMeta = {
  title?: string
  description?: string
  image?: string | null
  path?: string
  active?: string
  jsonLd?: Record<string, any>
  noindex?: boolean
  bodyClass?: string
  scripts?: string[]
  leaflet?: boolean
}

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: PageMeta): Response | Promise<Response>
  }
}

const SITE = 'Discover Uganda'
const DEFAULT_DESC = 'Explore breathtaking destinations, plan your journey, estimate transport costs, and experience the Pearl of Africa.'
const DEFAULT_IMG = 'https://sspark.genspark.ai/i/8kBhnQ3GVBeWIMh8?width=1600'

const NAV = [
  ['destinations', '/destinations', 'Destinations'],
  ['map', '/map', 'Map'],
  ['transport', '/transport', 'Transport'],
  ['planner', '/planner', 'Trip Planner'],
  ['itineraries', '/itineraries', 'Itineraries'],
  ['guides', '/guides', 'Guides'],
  ['gallery', '/gallery', 'Gallery']
] as const

const Header = ({ active, user }: { active?: string; user: SessionUser | null }) => (
  <header class="site-header" id="top">
    <div class="container header-inner">
      <a href="/" class="brand" aria-label="Discover Uganda home">
        <span class="brand-mark"><i class="fa-solid fa-feather-pointed"></i></span>
        <span class="brand-text">Discover<strong>Uganda</strong></span>
      </a>
      <nav class="main-nav" id="main-nav" aria-label="Main">
        {NAV.map(([key, href, label]) => (
          <a href={href} class={active === key ? 'active' : ''} aria-current={active === key ? 'page' : undefined}>{label}</a>
        ))}
      </nav>
      <div class="header-actions">
        <button class="icon-btn" data-open-search aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
        <select class="currency-select" data-currency aria-label="Display currency">
          <option value="UGX">UGX</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="KES">KES</option>
        </select>
        {user ? (
          <div class="user-menu">
            <a href="/account" class="btn btn-sm btn-ghost"><i class="fa-regular fa-user"></i> <span class="hide-sm">{user.name.split(' ')[0]}</span></a>
            {user.role === 'admin' && <a href="/admin" class="btn btn-sm btn-ghost" title="Admin"><i class="fa-solid fa-gauge"></i></a>}
          </div>
        ) : (
          <a href="/login" class="btn btn-sm btn-primary">Sign in</a>
        )}
        <button class="icon-btn nav-toggle" data-nav-toggle aria-label="Menu" aria-expanded="false" aria-controls="main-nav"><i class="fa-solid fa-bars"></i></button>
      </div>
    </div>
  </header>
)

const Footer = () => (
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a href="/" class="brand brand-light"><span class="brand-mark"><i class="fa-solid fa-feather-pointed"></i></span><span class="brand-text">Discover<strong>Uganda</strong></span></a>
        <p class="muted-light">Independent travel information for the Pearl of Africa — destinations, honest costs, and the practical detail you need to plan.</p>
        <form class="newsletter" data-ajax-form action="/api/newsletter" method="post">
          <label for="nl-email" class="sr-only">Email</label>
          <input id="nl-email" type="email" name="email" placeholder="Your email for travel updates" required />
          <button class="btn btn-primary" type="submit">Subscribe</button>
          <p class="form-msg" aria-live="polite"></p>
        </form>
      </div>
      <div>
        <h4>Explore</h4>
        <a href="/destinations">All destinations</a>
        <a href="/destinations?category=national-parks">National parks</a>
        <a href="/destinations?category=waterfalls">Waterfalls</a>
        <a href="/destinations?category=lakes">Lakes & islands</a>
        <a href="/map">Interactive map</a>
      </div>
      <div>
        <h4>Plan</h4>
        <a href="/planner">Trip budget planner</a>
        <a href="/transport">Transport cost estimator</a>
        <a href="/itineraries">Sample itineraries</a>
        <a href="/guides">Travel guides</a>
      </div>
      <div>
        <h4>About</h4>
        <a href="/about">About & data sources</a>
        <a href="/contact">Contact</a>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>© {new Date().getFullYear()} Discover Uganda. Prices are estimates and change — always confirm with operators and the Uganda Wildlife Authority before booking.</p>
      <a href="#top" class="to-top" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></a>
    </div>
  </footer>
)

const SearchOverlay = () => (
  <div class="search-overlay" id="search-overlay" hidden role="dialog" aria-modal="true" aria-label="Search">
    <div class="search-panel">
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" id="global-search" placeholder="Search destinations, guides, itineraries…" autocomplete="off" />
        <button class="icon-btn" data-close-search aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div id="search-results" class="search-results"><p class="muted">Try "gorilla", "waterfall", "Jinja" or "rafting".</p></div>
    </div>
  </div>
)

export const renderer = jsxRenderer(({ children, title, description, image, path, active, jsonLd, noindex, bodyClass, scripts, leaflet }) => {
  const c = useRequestContext()
  const user = (c.get('user') as SessionUser | null) ?? null
  const url = new URL(c.req.url)
  const canonical = `${url.origin}${path ?? url.pathname}`
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Travel Guide to the Pearl of Africa`
  const desc = description || DEFAULT_DESC
  const img = image || DEFAULT_IMG
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{fullTitle}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        {noindex && <meta name="robots" content="noindex" />}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={img} />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#0f3d2e" />
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css" />
        {leaflet && <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />}
        <link href="/static/style.css" rel="stylesheet" />
        {jsonLd && <script type="application/ld+json">{raw(JSON.stringify(jsonLd).replace(/</g, '\\u003c'))}</script>}
      </head>
      <body class={bodyClass || ''} data-signed-in={user ? '1' : '0'}>
        <a href="#main" class="skip-link">Skip to content</a>
        <Header active={active} user={user} />
        <main id="main">{children}</main>
        <Footer />
        <SearchOverlay />
        <div class="toast" id="toast" role="status" aria-live="polite"></div>
        {leaflet && <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>}
        <script src="/static/app.js" defer></script>
        {(scripts || []).map((s) => <script src={s} defer></script>)}
      </body>
    </html>
  )
})
