-- ============ Regions ============
INSERT OR REPLACE INTO regions (id, slug, name, blurb, sort) VALUES
 (1,'central','Central','Kampala, Entebbe and Lake Victoria''s shoreline — the country''s arrival point, cultural heart and gateway to the islands.',1),
 (2,'eastern','Eastern','The Nile''s first rapids at Jinja, coffee-terraced Mount Elgon, Sipi''s three waterfalls and the wide Karamoja plains.',2),
 (3,'western','Western','Uganda''s safari belt — gorilla forests, the Rwenzori glaciers, crater lakes, savanna parks and the Albertine Rift.',3),
 (4,'northern','Northern','Murchison''s thundering gorge, remote Kidepo and the open Karamoja frontier. Big landscapes, very few vehicles.',4);

-- ============ Categories ============
-- kind = 'type' (what it is) used for map filters
INSERT OR REPLACE INTO categories (id, slug, name, icon, kind, sort) VALUES
 (1,'national-parks','National Parks','fa-tree','type',1),
 (2,'waterfalls','Waterfalls','fa-water','type',2),
 (3,'lakes','Lakes','fa-droplet','type',3),
 (4,'mountains','Mountains','fa-mountain','type',4),
 (5,'cultural-sites','Cultural Sites','fa-landmark-dome','type',5),
 (6,'wildlife','Wildlife','fa-paw','type',6),
 (7,'adventure','Adventure','fa-person-hiking','type',7),
 (8,'islands','Beaches & Islands','fa-umbrella-beach','type',8),
 (9,'cities','Cities','fa-city','type',9),
 (10,'historical','Historical Sites','fa-monument','type',10),
 (11,'forests','Forests','fa-leaf','type',11),
 (12,'birding','Birding','fa-dove','type',12);

-- kind = 'experience' used on the homepage "explore by experience" strip
INSERT OR REPLACE INTO categories (id, slug, name, icon, kind, sort) VALUES
 (21,'exp-wildlife','Wildlife','fa-paw','experience',1),
 (22,'exp-adventure','Adventure','fa-person-hiking','experience',2),
 (23,'exp-nature','Nature','fa-leaf','experience',3),
 (24,'exp-culture','Culture','fa-drum','experience',4),
 (25,'exp-relaxation','Relaxation','fa-spa','experience',5),
 (26,'exp-history','History','fa-monument','experience',6),
 (27,'exp-family','Family','fa-children','experience',7),
 (28,'exp-photography','Photography','fa-camera','experience',8);

-- ============ Transport mode baseline rates ============
-- Used to ESTIMATE fares on routes without curated data.
-- Derived from typical 2024-25 Ugandan public-transport pricing and fuel at ~UGX 5,200/litre.
INSERT OR REPLACE INTO transport_mode_rates
 (mode,label,icon,ugx_per_km_min,ugx_per_km_max,base_fare_min,base_fare_max,avg_speed_kmh,per_person,max_distance_km,min_distance_km,comfort,description,sort) VALUES
 ('bus','Bus','fa-bus',150,260,3000,5000,48,1,NULL,60,3,
  'Scheduled coaches on main highways. Cheapest long-distance option. Book a morning departure — most upcountry buses leave before 09:00 and fill up fast.',1),
 ('minibus','Taxi / Minibus','fa-van-shuttle',190,330,2000,3000,42,1,NULL,0,2,
  'The 14-seater matatu. Leaves when full rather than on a timetable. Fares are negotiated and rise in the rain and on market days.',2),
 ('private_car','Private Car (self-drive)','fa-car',330,520,0,0,55,0,NULL,0,4,
  'Fuel plus wear for a saloon car at roughly 11-13 km/litre. Cost shown is for the whole vehicle, not per person.',3),
 ('motorcycle','Motorcycle / Boda','fa-motorcycle',600,1100,2000,3000,35,1,60,0,1,
  'Best for short hops and last-mile access. Not advisable on highways or for long distances — always agree the fare before you sit down and ask for a helmet.',4),
 ('flight','Domestic Flight','fa-plane',700,1300,180000,260000,320,1,NULL,180,5,
  'Scheduled and charter hops to park airstrips from Entebbe and Kajjansi. Saves a full day of driving to the far west and north-east.',5),
 ('tourist_van','Tourist Van / 4x4','fa-truck-field',1500,2600,0,0,50,0,NULL,0,5,
  'Chauffeur-driven safari vehicle with a pop-up roof, typically quoted per day including driver-guide and fuel. Cost is for the whole vehicle.',6),
 ('special_hire','Special Hire (private taxi)','fa-taxi',1200,2000,10000,20000,50,0,300,0,4,
  'A car hired exclusively for your trip, negotiated door to door. Cost is for the whole vehicle.',7);

-- ============ Cost baselines per traveller per day ============
INSERT OR REPLACE INTO cost_baselines
 (tier,label,accommodation_ugx_min,accommodation_ugx_max,food_ugx_min,food_ugx_max,activity_ugx_min,activity_ugx_max,transport_multiplier,misc_ugx,description) VALUES
 ('budget','Budget','40000','110000','20000','45000','40000','120000',1.0,20000,
  'Hostels, campsites and park bandas; local restaurants and street food; public transport; a selective handful of paid activities.'),
 ('standard','Standard','180000','420000','60000','140000','150000','400000',1.6,50000,
  'Mid-range lodges and good hotels, restaurant meals, a shared tourist van or special hire, and most headline activities included.'),
 ('luxury','Luxury','900000','3200000','180000','450000','400000','1200000',3.2,150000,
  'Premium lodges and tented camps, private 4x4 with driver-guide, fine dining, and flagship permits such as gorilla trekking.');

-- ============ Settings ============
INSERT OR REPLACE INTO settings (key,value) VALUES
 ('fuel_price_ugx_per_litre','5200'),
 ('fuel_price_updated','2025-09-01'),
 ('fx_fallback','{"USD":0.000266,"EUR":0.000246,"GBP":0.000208,"KES":0.0343}'),
 ('fx_fallback_date','2025-09-01'),
 ('transport_disclaimer','Prices shown are estimates based on available route information and may vary depending on the operator, season, fuel prices, traffic and negotiation.'),
 ('site_tagline','Explore breathtaking destinations, plan your journey, estimate transport costs, and experience the Pearl of Africa.');
