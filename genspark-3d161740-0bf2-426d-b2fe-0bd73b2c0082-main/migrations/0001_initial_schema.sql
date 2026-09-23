-- ============================================================
-- Discover Uganda — core schema
-- Designed to scale to thousands of destinations, routes, guides
-- ============================================================

-- ---------- Taxonomy ----------
CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  blurb TEXT,
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  kind TEXT DEFAULT 'type', -- 'type' | 'experience'
  sort INTEGER DEFAULT 0
);

-- ---------- Places (route endpoints: towns + destinations) ----------
CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'town', -- town | destination | airport
  region_id INTEGER REFERENCES regions(id),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  is_hub INTEGER DEFAULT 0,        -- major transport hub
  has_airstrip INTEGER DEFAULT 0,
  destination_id INTEGER            -- set later if it maps to a destination
);
CREATE INDEX IF NOT EXISTS idx_places_kind ON places(kind);

-- ---------- Destinations ----------
CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  tagline TEXT,
  region_id INTEGER REFERENCES regions(id),
  district TEXT,
  location_label TEXT,
  latitude REAL,
  longitude REAL,
  hero_image TEXT,
  card_image TEXT,
  intro TEXT,               -- 1-2 sentence hero intro
  overview TEXT,            -- long form: what it is
  why_visit TEXT,           -- why tourists go
  getting_there TEXT,       -- how to reach it
  travel_advice TEXT,       -- important advice
  highlights TEXT,          -- JSON array of strings
  wildlife TEXT,            -- JSON array
  what_to_pack TEXT,        -- JSON array
  nearby TEXT,              -- JSON array of destination slugs
  best_time TEXT,           -- short label e.g. "Jun-Sep, Dec-Feb"
  best_time_detail TEXT,
  climate_note TEXT,
  distance_from_kampala_km REAL,
  drive_hours_min REAL,
  drive_hours_max REAL,
  cost_from_ugx INTEGER,          -- starting travel cost estimate (transport, 1 pax)
  entry_fee_foreign_usd REAL,     -- park / entry fee non-resident
  entry_fee_eastafrican_ugx INTEGER,
  entry_fee_note TEXT,
  experience_tags TEXT,     -- JSON array: wildlife, adventure, nature, culture, relaxation, history, family, photography
  budget_level TEXT,        -- budget | midrange | luxury  (typical minimum)
  budget_levels TEXT,       -- JSON array of feasible levels
  recommended_days INTEGER,
  duration_band TEXT,       -- JSON array: 1day, weekend, 3-5days, 1week, 2weeks
  difficulty TEXT,          -- easy | moderate | challenging
  popularity INTEGER DEFAULT 50,
  featured INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 1,
  data_confidence TEXT DEFAULT 'verified', -- verified | estimated | community
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dest_region ON destinations(region_id);
CREATE INDEX IF NOT EXISTS idx_dest_featured ON destinations(featured);
CREATE INDEX IF NOT EXISTS idx_dest_pop ON destinations(popularity DESC);

CREATE TABLE IF NOT EXISTS destination_categories (
  destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (destination_id, category_id)
);

-- ---------- Activities (things to do) ----------
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  duration TEXT,
  difficulty TEXT,            -- easy | moderate | challenging | expert
  cost_usd_min REAL,
  cost_usd_max REAL,
  cost_ugx_min INTEGER,
  cost_ugx_max INTEGER,
  cost_note TEXT,
  recommended_age TEXT,
  what_to_bring TEXT,         -- JSON array
  best_season TEXT,
  experience_tag TEXT,
  sort INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_act_dest ON activities(destination_id);

-- ---------- Gallery ----------
CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id INTEGER REFERENCES destinations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  category TEXT,      -- Landscape | Wildlife | Activities | Culture | Accommodation
  credit TEXT,
  featured INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_gal_dest ON gallery_images(destination_id);
CREATE INDEX IF NOT EXISTS idx_gal_cat ON gallery_images(category);

-- ---------- Transport ----------
CREATE TABLE IF NOT EXISTS transport_routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_place_id INTEGER NOT NULL REFERENCES places(id),
  to_place_id INTEGER NOT NULL REFERENCES places(id),
  slug TEXT UNIQUE,                 -- kampala-to-jinja
  distance_km REAL NOT NULL,
  duration_hours_min REAL,
  duration_hours_max REAL,
  road_quality TEXT,                -- tarmac | mixed | murram | rough
  route_description TEXT,
  waypoints TEXT,                   -- JSON array of place names in order
  alt_waypoints TEXT,               -- JSON array (alternative route)
  alt_distance_km REAL,
  alt_note TEXT,
  transfers INTEGER DEFAULT 0,      -- number of vehicle changes on public transport
  notes TEXT,
  data_confidence TEXT DEFAULT 'estimated',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_route_from ON transport_routes(from_place_id);
CREATE INDEX IF NOT EXISTS idx_route_to ON transport_routes(to_place_id);

CREATE TABLE IF NOT EXISTS transport_fares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,        -- bus | minibus | private_car | motorcycle | flight | tourist_van | special_hire
  fare_min_ugx INTEGER,
  fare_max_ugx INTEGER,
  duration_hours_min REAL,
  duration_hours_max REAL,
  per_person INTEGER DEFAULT 1,
  available INTEGER DEFAULT 1,
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fare_route ON transport_fares(route_id);

-- Baseline per-km rates used to ESTIMATE fares for routes with no curated data
CREATE TABLE IF NOT EXISTS transport_mode_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  ugx_per_km_min REAL,
  ugx_per_km_max REAL,
  base_fare_min INTEGER DEFAULT 0,
  base_fare_max INTEGER DEFAULT 0,
  avg_speed_kmh REAL,
  per_person INTEGER DEFAULT 1,
  max_distance_km REAL,      -- mode not offered beyond this
  min_distance_km REAL DEFAULT 0,
  comfort INTEGER DEFAULT 3,
  description TEXT,
  sort INTEGER DEFAULT 0
);

-- ---------- Guides ----------
CREATE TABLE IF NOT EXISTS travel_guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,    -- getting-around | planning | practical
  subcategory TEXT,
  excerpt TEXT,
  body TEXT,                 -- markdown-ish
  hero_image TEXT,
  icon TEXT,
  read_minutes INTEGER,
  tags TEXT,                 -- JSON array
  featured INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_guide_cat ON travel_guides(category);

CREATE TABLE IF NOT EXISTS destination_guides (
  destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  guide_id INTEGER NOT NULL REFERENCES travel_guides(id) ON DELETE CASCADE,
  PRIMARY KEY (destination_id, guide_id)
);

-- ---------- Itineraries ----------
CREATE TABLE IF NOT EXISTS itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  days INTEGER NOT NULL,
  theme TEXT,                -- wildlife | adventure | culture | mixed | relaxation
  region_focus TEXT,
  summary TEXT,
  hero_image TEXT,
  total_distance_km REAL,
  cost_ugx_min INTEGER,
  cost_ugx_max INTEGER,
  best_for TEXT,             -- JSON array
  tips TEXT,                 -- JSON array
  featured INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itinerary_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  destination_id INTEGER REFERENCES destinations(id),
  destination_label TEXT,
  description TEXT,
  schedule TEXT,             -- JSON array of {time,label}
  activities TEXT,           -- JSON array
  transport TEXT,
  distance_km REAL,
  accommodation TEXT,
  tip TEXT
);
CREATE INDEX IF NOT EXISTS idx_itd_itin ON itinerary_days(itinerary_id);

-- ---------- Accommodation ----------
CREATE TABLE IF NOT EXISTS accommodations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id INTEGER REFERENCES destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  category TEXT,             -- budget | midrange | luxury
  property_type TEXT,        -- lodge | campsite | guesthouse | hotel | banda
  image TEXT,
  location_label TEXT,
  distance_from_attraction TEXT,
  price_usd_min REAL,
  price_usd_max REAL,
  price_basis TEXT,          -- e.g. per person sharing, per room
  amenities TEXT,            -- JSON array
  data_source TEXT,          -- 'official-listing' | 'demo'
  is_demo INTEGER DEFAULT 1,
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_acc_dest ON accommodations(destination_id);

-- ---------- Budget baselines (admin editable) ----------
CREATE TABLE IF NOT EXISTS cost_baselines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT UNIQUE NOT NULL,          -- budget | standard | luxury
  label TEXT,
  accommodation_ugx_min INTEGER,
  accommodation_ugx_max INTEGER,
  food_ugx_min INTEGER,
  food_ugx_max INTEGER,
  activity_ugx_min INTEGER,
  activity_ugx_max INTEGER,
  transport_multiplier REAL DEFAULT 1,
  misc_ugx INTEGER DEFAULT 0,
  description TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Users & auth ----------
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',   -- user | admin
  country TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sess_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id INTEGER REFERENCES destinations(id) ON DELETE CASCADE,
  guide_id INTEGER REFERENCES travel_guides(id) ON DELETE CASCADE,
  itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'destination',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id);

CREATE TABLE IF NOT EXISTS saved_trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tier TEXT DEFAULT 'standard',
  travelers INTEGER DEFAULT 2,
  payload TEXT NOT NULL,     -- JSON: days[], options
  summary TEXT,              -- JSON: computed totals snapshot
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trip_user ON saved_trips(user_id);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  author_name TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',   -- pending | approved | rejected
  visited_on TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rev_dest ON reviews(destination_id, status);

-- ---------- Caches / external data ----------
CREATE TABLE IF NOT EXISTS weather_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currency_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base TEXT NOT NULL DEFAULT 'UGX',
  rates TEXT NOT NULL,       -- JSON {USD:..,EUR:..,GBP:..}
  source TEXT,
  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  interests TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
