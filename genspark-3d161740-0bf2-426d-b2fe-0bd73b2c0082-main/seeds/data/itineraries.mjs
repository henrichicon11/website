// Sample itineraries. Each day: [title, destinationSlug|null, label, description,
//   activities[], transport, distance_km, accommodation, tip]

export const ITINERARIES = [
{
  slug: 'jinja-nile-weekend',
  title: 'Jinja & the Nile Weekend',
  subtitle: 'Rafting, the source of the Nile and Mabira Forest in two days',
  days: 2, theme: 'adventure', region_focus: 'eastern', featured: 1,
  hero: 'jinja',
  summary: 'The classic Kampala escape. Leave early on Saturday, stop in Mabira Forest, spend the afternoon at the Source of the Nile and give Sunday to the rapids.',
  cost_ugx_min: 650000, cost_ugx_max: 1400000,
  best_for: ['Adventure seekers','Short on time','Groups of friends'],
  tips: ['Leave Kampala before 07:00 to beat traffic','Book rafting a few days ahead in peak season','Bring a change of clothes and reef shoes'],
  schedule: [
    ['Kampala to Jinja via Mabira', 'jinja', 'Mabira Forest & Source of the Nile',
     'Drive east on the Jinja highway, stopping in Mabira Forest at Najjembe for a short forest walk or zipline. Continue to Jinja for lunch and an afternoon boat trip to the Source of the Nile.',
     ['Mabira forest walk','Source of the Nile boat trip','Sunset on the river'], 'Minibus or private car', 80, 'Riverside lodge near Bujagali', 'Try a rolex from a Jinja roadside stall.'],
    ['White-water rafting', 'bujagali', 'Nile rapids',
     'A full day on the Nile with grade 3-5 rapids, lunch on an island, and a late-afternoon return to Kampala.',
     ['Full-day rafting','Swimming in calm stretches'], 'Operator transfer, then minibus to Kampala', 80, '—', 'Rafting operators provide all safety equipment.']
  ]
},
{
  slug: 'murchison-3-day-safari',
  title: 'Murchison Falls 3-Day Safari',
  subtitle: 'Rhinos, the world\'s most powerful waterfall and a Nile game drive',
  days: 3, theme: 'wildlife', region_focus: 'northern', featured: 1,
  hero: 'murchison-falls-national-park',
  summary: 'The best short safari from Kampala. Track white rhino on foot at Ziwa, then combine a morning game drive with an afternoon boat trip to the base of the falls.',
  cost_ugx_min: 1500000, cost_ugx_max: 4200000,
  best_for: ['First safari','Families','Photographers'],
  tips: ['Do the launch trip in the afternoon, game drive at dawn','Hike to the top of the falls from the boat jetty','Wear light colours — tsetse flies like dark blue'],
  schedule: [
    ['Kampala to Ziwa and Murchison', 'ziwa-rhino-sanctuary', 'Ziwa Rhino Sanctuary',
     'Drive north on the Gulu highway to Ziwa for rhino tracking on foot, then continue to Masindi and into the park, arriving at the top of the falls in the late afternoon.',
     ['Rhino tracking on foot','Top of the falls viewpoint'], 'Private 4x4', 305, 'Lodge near Paraa', 'Ziwa rhino tracking takes 1-2 hours.'],
    ['Game drive and Nile launch', 'murchison-falls-national-park', 'Buligi circuit & Victoria Nile',
     'Early ferry across the Nile for a morning game drive on the Buligi circuit — giraffe, elephant, buffalo, lion. After lunch, a three-hour launch trip upstream to the base of the falls.',
     ['Morning game drive','Launch trip to the falls'], 'Private 4x4 + Paraa ferry', 60, 'Lodge near Paraa', 'Bring a telephoto lens for the launch trip.'],
    ['Budongo chimps and return', 'murchison-falls-national-park', 'Budongo Forest',
     'Optional early chimpanzee tracking in Kaniyo Pabidi before the drive back to Kampala.',
     ['Chimpanzee tracking'], 'Private 4x4', 305, '—', 'Chimp permits sell out — book ahead.']
  ]
},
{
  slug: 'gorillas-and-savanna-7-days',
  title: 'Gorillas, Chimps & Savanna — 7 Days',
  subtitle: 'The south-west circuit: Kibale, Queen Elizabeth, Bwindi and Lake Bunyonyi',
  days: 7, theme: 'wildlife', region_focus: 'western', featured: 1,
  hero: 'bwindi-impenetrable-national-park',
  summary: 'Uganda\'s signature week. Chimpanzees in Kibale, tree-climbing lions and the Kazinga Channel in Queen Elizabeth, mountain gorillas in Bwindi and a lazy last day on Lake Bunyonyi.',
  cost_ugx_min: 7500000, cost_ugx_max: 22000000,
  best_for: ['Wildlife lovers','Once-in-a-lifetime trips','Photographers'],
  tips: ['Buy the gorilla permit first — everything else follows','A 4x4 with driver-guide is the easiest option','Pack for rain in every month'],
  schedule: [
    ['Kampala to Fort Portal', 'fort-portal', 'Fort Portal crater lakes',
     'Drive west via Mubende to Fort Portal. Afternoon walk around the crater lakes.',
     ['Crater lakes walk'], 'Private 4x4', 320, 'Crater lake lodge', 'Stop for lunch in Mubende.'],
    ['Chimpanzee tracking in Kibale', 'kibale-national-park', 'Kibale Forest',
     'Morning chimp tracking from Kanyanchu. Afternoon Bigodi Wetland walk for primates and birds.',
     ['Chimpanzee tracking','Bigodi wetland walk'], 'Private 4x4', 36, 'Crater lake lodge', 'Morning tracking has the most activity.'],
    ['To Queen Elizabeth', 'queen-elizabeth-national-park', 'Kazinga Channel',
     'Drive south to Queen Elizabeth. Afternoon launch on the Kazinga Channel for hippo, buffalo, elephant and birds.',
     ['Kazinga Channel launch'], 'Private 4x4', 130, 'Lodge near Mweya', 'Sit on the shore side of the boat.'],
    ['Game drive and Ishasha', 'queen-elizabeth-national-park', 'Kasenyi & Ishasha',
     'Dawn game drive on the Kasenyi plains, then south through Ishasha to look for tree-climbing lions, arriving in Buhoma by evening.',
     ['Kasenyi game drive','Ishasha tree-climbing lions'], 'Private 4x4', 160, 'Lodge in Buhoma', 'The Ishasha road is rough after rain.'],
    ['Gorilla trekking', 'bwindi-impenetrable-national-park', 'Bwindi — Buhoma sector',
     'Briefing at 07:30 then trek to your assigned gorilla family for one hour. Afternoon Buhoma community walk.',
     ['Gorilla trekking','Community walk'], 'On foot', 0, 'Lodge in Buhoma', 'Hire a porter — it matters.'],
    ['To Lake Bunyonyi', 'lake-bunyonyi', 'Lake Bunyonyi',
     'Scenic drive to Lake Bunyonyi. Afternoon canoe among the islands.',
     ['Dugout canoe','Island visit'], 'Private 4x4', 140, 'Island or lakeside lodge', 'Swimming is bilharzia-free here.'],
    ['Return to Kampala', null, 'Kabale to Kampala',
     'Long drive back to Kampala with a stop at the Equator.',
     ['Equator stop'], 'Private 4x4', 419, '—', 'Or fly from Kisoro to save a day.']
  ]
},
{
  slug: 'eastern-uganda-5-days',
  title: 'Eastern Uganda: Nile to Sipi — 5 Days',
  subtitle: 'Budget-friendly adventure on public transport',
  days: 5, theme: 'adventure', region_focus: 'eastern', featured: 0,
  hero: 'sipi-falls',
  summary: 'A self-guided, public-transport-friendly loop: Jinja\'s river, the three waterfalls of Sipi and the coffee farms of Mount Elgon.',
  cost_ugx_min: 900000, cost_ugx_max: 2500000,
  best_for: ['Backpackers','Hikers','Coffee lovers'],
  tips: ['Buses to Mbale run all day','Book a Sipi guide on arrival','Bring layers — Sipi is cool at night'],
  schedule: [
    ['Kampala to Jinja', 'jinja', 'Jinja', 'Morning bus to Jinja; afternoon at the Source of the Nile.', ['Source of the Nile'], 'Bus', 80, 'Budget riverside camp', ''],
    ['Rafting day', 'bujagali', 'Nile rapids', 'Full-day white-water rafting.', ['Rafting'], 'Operator transfer', 0, 'Budget riverside camp', ''],
    ['Jinja to Sipi', 'sipi-falls', 'Sipi Falls', 'Bus to Mbale then minibus up to Sipi. Evening views over the plains.', ['Sunset viewpoint'], 'Bus + minibus', 197, 'Sipi guesthouse', 'Change at Mbale taxi park.'],
    ['Sipi waterfalls hike', 'sipi-falls', 'Sipi\'s three falls', 'Guided hike to all three waterfalls and a coffee farm tour.', ['Three falls hike','Coffee tour','Optional abseil'], 'On foot', 0, 'Sipi guesthouse', 'Wear boots with grip.'],
    ['Return to Kampala', null, 'Sipi to Kampala', 'Minibus to Mbale then bus to Kampala.', [], 'Minibus + bus', 277, '—', 'Leave early.']
  ]
},
{
  slug: 'kampala-entebbe-2-days',
  title: 'Kampala & Entebbe in 2 Days',
  subtitle: 'Culture, kingdoms, shoebills and chimps before or after your safari',
  days: 2, theme: 'culture', region_focus: 'central', featured: 0,
  hero: 'kampala',
  summary: 'Perfect bookends to a longer trip: the royal sites and markets of Kampala, then shoebills at Mabamba and chimps on Ngamba Island.',
  cost_ugx_min: 500000, cost_ugx_max: 1800000,
  best_for: ['Culture lovers','Birders','Arrival or departure days'],
  tips: ['Avoid crossing Kampala at rush hour','Book Ngamba Island in advance'],
  schedule: [
    ['Kampala culture day', 'kampala', 'Kampala', 'Gaddafi Mosque, Uganda Museum, Kasubi Tombs and an evening Ndere Centre performance.', ['City tour','Ndere performance'], 'Special hire', 30, 'Kampala hotel', ''],
    ['Shoebills and chimps', 'mabamba-swamp', 'Mabamba Swamp & Ngamba Island', 'Early canoe into Mabamba Swamp for shoebill, then a boat to Ngamba Island chimpanzee sanctuary.', ['Shoebill canoe','Ngamba Island'], 'Special hire + boat', 60, 'Entebbe hotel', 'Shoebills are most active early.']
  ]
}
];
