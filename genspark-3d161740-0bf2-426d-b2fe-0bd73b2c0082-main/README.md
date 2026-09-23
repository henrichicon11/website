# Discover Uganda

A travel guide and trip-planning website for Uganda. It covers destinations, a transport cost estimator, a multi-stop budget planner, itineraries, guides, a gallery, user accounts and an admin dashboard.

Built with **Hono** on **Cloudflare Pages/Workers** and uses **D1** (SQLite). Pages are rendered on the server with JSX. The interactive tools use small plain-JS modules.

## Features

| Area | What it does |
|---|---|
| **Home** | Hero slideshow, search, explore by experience, featured destinations, quick transport estimate, regions, itineraries, guides |
| **Destinations** (`/destinations`) | 27 destinations with filters for category, region, experience, budget, trip length and difficulty, plus sorting and pagination |
| **Destination detail** | Overview, highlights, wildlife, 106 priced activities, how to get there, travel advice, best time and a **live 7-day forecast**, entry fees, demo accommodation price bands, gallery with lightbox, reviews (moderated), mini-map, nearby places, JSON-LD |
| **Interactive map** (`/map`) | Leaflet/OSM map with markers colour-coded by category. Filter by category, region and name. Optional transport-route overlay |
| **Transport estimator** (`/transport`) | Compares bus, minibus, private car, boda, flight, 4x4 and special hire. Shows fares, times, comfort, and flags the cheapest, fastest and most comfortable options. Also shows route waypoints, alternative routes and a map |
| **Trip planner** (`/planner`) | Multi-stop plan with nights, activities, tier (budget/standard/luxury), traveller count and resident/foreign fees. Gives a cost breakdown. You can save it to your account, share it as a link, or print it / save as PDF |
| **Itineraries** | 5 day-by-day itineraries. Each has a one-click "customise in planner" link |
| **Guides** | 11 guides on transport, permits, visas, money, safety, seasons and packing |
| **Gallery** | About 200 licensed photos, filterable by category |
| **Accounts** | Register and log in with PBKDF2-SHA256 hashing and HttpOnly session cookies. Save favourite destinations, guides and itineraries. Save trips |
| **Admin** (`/admin`) | Stats, review moderation, inline editing of destination prices and flags, curated fares, per-km mode rates, budget-tier baselines, messages, users |
| **Currency** | Switch between UGX, USD, EUR, GBP and KES in the header. Live rates from open.er-api.com, cached 12h in D1, with a fallback rate |
| **SEO** | Canonical URLs, OpenGraph/Twitter cards, JSON-LD, `sitemap.xml`, `robots.txt` |

### How the transport estimator works
1. **Curated**: if a direct route exists (either direction), it uses the curated distance, time, waypoints and fares. Modes without a curated fare are estimated from per-km rates.
2. **Combined**: if there's no direct route, it chains known legs using Dijkstra's shortest path over the route graph. Curated fares for each leg are summed when every leg has one. This is only used if the path is less than 1.6× the corrected straight-line distance.
3. **Estimated**: otherwise it uses the straight-line (haversine) distance × 1.32 as a road-network factor.

Per-km rates are also adjusted for road quality (tarmac, mixed, murram, rough). Each mode has minimum and maximum distances, and flights are only offered between airstrips.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | |
| GET | `/api/destinations?q=&region=&category=&experience=&budget=&duration=&difficulty=&sort=&limit=&offset=` | |
| GET | `/api/destinations/:slug` | full detail incl. activities, gallery, accommodation, reviews |
| GET | `/api/map`, `/api/places`, `/api/transport/routes` | |
| GET | `/api/transport/estimate?from=&to=&travelers=` | |
| POST | `/api/planner/estimate` | `{tier, travelers, resident, start_place, return_to_start, stops:[{destination_slug,nights,activity_slugs}]}` |
| GET | `/api/fx`, `/api/weather/:slug`, `/api/search?q=`, `/api/guides`, `/api/itineraries` | |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`; GET `/api/auth/me` | |
| GET/POST | `/api/favorites`, GET `/api/favorites/slugs` | toggle on POST `{kind, slug}` |
| GET/POST/DELETE | `/api/trips`, `/api/trips/:id` | signed-in only |
| POST | `/api/destinations/:slug/reviews`, `/api/newsletter`, `/api/contact` | |
| * | `/api/admin/*` | admin role only |

Write requests are rejected if they come from another site (the Origin header is checked, and cookies are `SameSite=Lax`). Security headers are set with `hono/secure-headers`.

## Data

- `migrations/0001_initial_schema.sql`: the database schema.
- `seeds/01_taxonomy.sql`: regions, categories, per-km transport rates, budget tiers and settings.
- `seeds/data/*.mjs`: the source content (destinations, images, places, routes, fares, guides, itineraries).
- `seeds/build-seed.mjs` → generates `seeds/02_content.sql`. **Edit the `.mjs` files, then re-run this.**
- `seeds/make-admin.mjs` → generates `seeds/03_admin.sql` (git-ignored). Set credentials with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The defaults are `admin@discoveruganda.local` / `ChangeMe!2026`, for **local use only**.

Accommodation listings are **illustrative price bands**. The UI labels them as such, and the database marks them with `is_demo=1`.

## Local development

```bash
npm install
npm run seed:build     # regenerate 02_content.sql + 03_admin.sql
npm run db:reset       # fresh local D1: migrate + seed
npm run build
pm2 start ecosystem.config.cjs   # wrangler pages dev on :3000 with local D1
curl localhost:3000/api/health
```

## Deploying to Cloudflare

```bash
npx wrangler d1 create webapp-production        # put the id into wrangler.jsonc
npm run db:migrate:prod
npx wrangler d1 execute webapp-production --remote --file=./seeds/01_taxonomy.sql
npx wrangler d1 execute webapp-production --remote --file=./seeds/02_content.sql
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='strong-pass' node seeds/make-admin.mjs
npx wrangler d1 execute webapp-production --remote --file=./seeds/03_admin.sql
npm run deploy
```

## Project layout

```
src/
  index.tsx          routes, sitemap, robots, error handling
  api.ts             JSON API (public, auth, user, admin)
  renderer.tsx       HTML layout, SEO meta, header/footer, search overlay
  types.ts
  lib/               auth, db queries + fx/weather caching, transport engine, budget engine, formatting/markdown
  components/ui.tsx  shared JSX components
  pages/             home, destinations, tools (map/transport/planner), content, account/admin
public/static/       style.css, app.js (shared), map.js, transport.js, planner.js, admin.js, favicon.svg
```

## Not yet done / ideas
- Password reset and email verification (needs an email provider).
- Real accommodation listings from partner feeds, to replace the demo price bands.
- Image uploads for admins (R2).
- Rate limiting on the auth and review endpoints (Cloudflare WAF rules or a Durable Object).
