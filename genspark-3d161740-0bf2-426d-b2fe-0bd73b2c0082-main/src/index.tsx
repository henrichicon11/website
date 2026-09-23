import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import type { AppEnv, Row } from './types'
import { renderer } from './renderer'
import api from './api'
import { sessionMiddleware, originGuard, requireUser, requireAdmin } from './lib/auth'
import { homePage } from './pages/home'
import { destinationsPage, destinationDetailPage } from './pages/destinations'
import { mapPage, transportPage, plannerPage } from './pages/tools'
import { guidesPage, guideDetailPage, itinerariesPage, itineraryDetailPage, galleryPage, aboutPage, contactPage, notFoundPage } from './pages/content'
import { loginPage, registerPage, accountPage, adminPage } from './pages/account'

const app = new Hono<AppEnv>()

app.use('*', secureHeaders({ crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }))
app.use('*', sessionMiddleware)
app.use('/api/*', originGuard)
app.route('/api', api)

app.get('/robots.txt', (c) => c.text(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /api/\nSitemap: ${new URL(c.req.url).origin}/sitemap.xml\n`))

app.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin
  const [d, g, i] = await Promise.all([
    c.env.DB.prepare('SELECT slug,updated_at FROM destinations').all<Row>(),
    c.env.DB.prepare('SELECT slug,updated_at FROM travel_guides').all<Row>(),
    c.env.DB.prepare('SELECT slug,updated_at FROM itineraries').all<Row>()
  ])
  const urls: [string, string?][] = [
    ['/'], ['/destinations'], ['/map'], ['/transport'], ['/planner'], ['/itineraries'], ['/guides'], ['/gallery'], ['/about'], ['/contact'],
    ...d.results.map((r): [string, string] => [`/destinations/${r.slug}`, r.updated_at]),
    ...g.results.map((r): [string, string] => [`/guides/${r.slug}`, r.updated_at]),
    ...i.results.map((r): [string, string] => [`/itineraries/${r.slug}`, r.updated_at])
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(([u, m]) => `  <url><loc>${origin}${u}</loc>${m ? `<lastmod>${String(m).slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

app.use(renderer)

app.get('/', homePage)
app.get('/destinations', destinationsPage)
app.get('/destinations/:slug', destinationDetailPage)
app.get('/map', mapPage)
app.get('/transport', transportPage)
app.get('/planner', plannerPage)
app.get('/guides', guidesPage)
app.get('/guides/:slug', guideDetailPage)
app.get('/itineraries', itinerariesPage)
app.get('/itineraries/:slug', itineraryDetailPage)
app.get('/gallery', galleryPage)
app.get('/about', aboutPage)
app.get('/contact', contactPage)
app.get('/login', loginPage)
app.get('/register', registerPage)
app.get('/account', requireUser, accountPage)
app.get('/admin', requireAdmin, adminPage)

app.notFound(notFoundPage)
app.onError((err, c) => {
  console.error(err)
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'Something went wrong' }, 500)
  return c.html('<!doctype html><title>Error</title><body style="font-family:sans-serif;padding:3rem"><h1>Something went wrong</h1><p><a href="/">Return home</a></p></body>', 500)
})

export default app
