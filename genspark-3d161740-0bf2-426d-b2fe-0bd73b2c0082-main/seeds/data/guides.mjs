// Travel guides. Body uses a light markdown subset: ## headings, - lists,
// **bold**, *italic*, blank-line paragraphs.
// `destinations` links a guide to destination slugs (destination_guides).

export const GUIDES = [
{
  slug: 'getting-around-uganda-public-transport',
  title: 'Getting Around Uganda by Public Transport',
  category: 'getting-around', subcategory: 'public-transport', icon: 'fa-bus',
  excerpt: 'Buses, 14-seater taxis and boda-bodas explained — where they leave from, what they cost and how to use them without stress.',
  read_minutes: 8, featured: 1, tags: ['bus','taxi','boda','budget'],
  destinations: ['kampala','jinja','fort-portal','sipi-falls'],
  body: `Uganda is one of the easier East African countries to cross on public transport. Distances are moderate, the main highways are tarmac, and there is always *something* heading where you want to go. What there is not is a timetable you can rely on.

## Buses
Scheduled coaches run on every trunk route out of Kampala — west to Mbarara, Kabale and Kisoro, north to Gulu and Arua, east to Jinja and Mbale. Most depart from the **Namayiba**, **Kisenyi** and **Qualicell** terminals in central Kampala.

- Go early. Upcountry buses fill from 06:00 and many leave before 09:00.
- Buy your ticket at the company office, not from touts on the street.
- Overnight buses exist on the longest routes (Kisoro, Arua) but road accidents are more common after dark.

## Taxis (minibuses)
The white-and-blue 14-seater "taxi" is the backbone of short and medium-distance travel. Taxis leave when full rather than on schedule. The **Old Taxi Park** and **New Taxi Park** in Kampala serve almost every destination in the country — ask any conductor and you will be pointed to the right stage.

## Boda-bodas
Motorcycle taxis are the fastest way through Kampala traffic and the only way to reach many trailheads. Use an app (SafeBoda, Uber Boda, Bolt) in the city so the fare is fixed and the rider is registered. Always ask for a helmet. Avoid long highway journeys on a boda.

## Fares
Fares are fixed on buses and loosely fixed on taxis. Expect them to rise in the rain, on public holidays and at the end of the month. See our [transport estimator](/transport) for current ranges on specific routes.`
},
{
  slug: 'self-drive-uganda',
  title: 'Self-Drive in Uganda: Roads, Rules and Renting a 4x4',
  category: 'getting-around', subcategory: 'driving', icon: 'fa-car',
  excerpt: 'Everything you need before hiring a car — licences, road conditions, fuel, police checkpoints and which parks genuinely need a 4x4.',
  read_minutes: 9, featured: 1, tags: ['self-drive','4x4','roads'],
  destinations: ['bwindi-impenetrable-national-park','kidepo-valley-national-park','murchison-falls-national-park'],
  body: `Self-driving gives you total control of your itinerary and is very doable in Uganda — but it is not a casual undertaking, and the final 30 km into most parks is where the challenge lies.

## Paperwork
- An international driving permit alongside your home licence.
- Comprehensive insurance from the rental company — check the excess.
- Vehicle registration papers and third-party insurance sticker must be in the car.

## Road conditions
The main highways from Kampala are tarmac and generally good. Park access roads are **murram** (graded dirt) which ranges from smooth to deeply rutted. After heavy rain, the roads to Buhoma, Ishasha, Kidepo and Sipi's upper trails can become impassable for 2WD vehicles.

## Which trips need a 4x4?
- **Essential:** Bwindi (all sectors), Kidepo, Mgahinga, Semuliki, Rwenzori trailheads, Pian Upe.
- **Recommended:** Murchison north bank, Queen Elizabeth's Ishasha sector, Lake Mburo in the wet season.
- **Not needed:** Jinja, Entebbe, Fort Portal, Kampala, Lake Bunyonyi via Kabale.

## Driving tips
- Drive on the **left**. Speed limit is 80 km/h on highways and 50 km/h in towns.
- Never drive after dark outside towns — unlit vehicles, livestock and pedestrians make it genuinely dangerous.
- Police checkpoints are common. Be polite, have documents ready, and ask for a receipt for any fine.
- Fuel is widely available on main roads but top up before entering remote parks.`
},
{
  slug: 'domestic-flights-uganda',
  title: 'Domestic Flights: Flying to Uganda\'s National Parks',
  category: 'getting-around', subcategory: 'flights', icon: 'fa-plane',
  excerpt: 'How scheduled and charter flights to park airstrips work, what they cost and when they are worth the money.',
  read_minutes: 5, featured: 0, tags: ['flights','time-saving','luxury'],
  destinations: ['kidepo-valley-national-park','bwindi-impenetrable-national-park','murchison-falls-national-park','queen-elizabeth-national-park'],
  body: `If you are short on time, flying transforms a Ugandan itinerary. A 10-hour drive to Bwindi becomes 1.5 hours in the air, and Kidepo — a two-day drive from Kampala — becomes a morning flight.

## Operators and airstrips
Scheduled services leave from **Entebbe International** and **Kajjansi** airfield. The main airstrips served are Kihihi and Kisoro (Bwindi), Mweya and Kasese (Queen Elizabeth, Rwenzori), Pakuba and Bugungu (Murchison) and Apoka (Kidepo).

## Baggage
Aircraft are small single-engine Cessnas and Caravans. The luggage limit is usually **15 kg per person in soft bags** — no hard-shell suitcases.

## Is it worth it?
- **Yes** for Kidepo and for short gorilla trips.
- **Maybe** for Murchison — the drive is only 5 hours and passes Ziwa Rhino Sanctuary.
- **No** for Jinja, Lake Mburo or Entebbe-area trips.`
},
{
  slug: 'gorilla-permits-explained',
  title: 'Gorilla Permits Explained: Prices, Booking and Sectors',
  category: 'planning', subcategory: 'permits', icon: 'fa-ticket',
  excerpt: 'How to buy a gorilla trekking permit, what it costs, which sector to choose and what happens on trekking day.',
  read_minutes: 7, featured: 1, tags: ['gorillas','permits','bwindi','mgahinga'],
  destinations: ['bwindi-impenetrable-national-park','mgahinga-gorilla-national-park'],
  body: `The gorilla permit is the single most important booking on a Uganda trip, and everything else — lodges, transport, flights — should be arranged around it.

## Prices
- **Foreign non-residents:** USD 800
- **Foreign residents:** USD 700
- **East African citizens:** UGX 300,000
- **Habituation experience (Rushaga only):** USD 1,500

Prices are set by the Uganda Wildlife Authority and do change; always reconfirm before paying.

## How to book
Permits can be booked directly with UWA's reservations office in Kampala or through any licensed tour operator. Operators usually charge no premium for the permit itself and will handle the paperwork.

## Choosing a sector
Bwindi has four sectors — **Buhoma**, **Ruhija**, **Rushaga** and **Nkuringo** — plus Mgahinga to the south. The sector on your permit is fixed, so book accommodation in the same sector. They are two to four hours apart by road.

## Trekking day
Arrive at the briefing point by 07:30. You are assigned a gorilla family and walk with rangers and trackers. Treks last anywhere from 30 minutes to seven hours. You get **one hour** with the gorillas.

- Minimum age is 15.
- You will be turned away if you are visibly ill.
- Hire a porter — it helps you and supports the community.`
},
{
  slug: 'best-time-to-visit-uganda',
  title: 'Best Time to Visit Uganda',
  category: 'planning', subcategory: 'seasons', icon: 'fa-sun',
  excerpt: 'Dry seasons, wet seasons and why Uganda is a genuine year-round destination — with month-by-month advice.',
  read_minutes: 6, featured: 1, tags: ['weather','seasons','planning'],
  destinations: ['bwindi-impenetrable-national-park','murchison-falls-national-park','rwenzori-mountains-national-park'],
  body: `Uganda sits on the equator, so temperatures barely change through the year. What changes is the rain.

## The two dry seasons
- **December to February** — warm, dry and bright. Peak season for gorillas and safaris.
- **June to August** — the main peak. Cooler nights, firm trails and the best game viewing as animals gather at water.

## The two wet seasons
- **March to May** — the long rains. Heavy afternoon storms, muddy trails, green landscapes and big lodge discounts.
- **September to November** — the short rains. Lighter and less predictable; a good-value shoulder season.

## By activity
- **Gorilla trekking:** all year; easiest in the dry months.
- **Game drives:** June–September and December–February.
- **Birding:** November–April when Palaearctic migrants are present.
- **Rwenzori climbing:** late December–February and June–August.
- **Rafting in Jinja:** all year; the Nile is highest after the rains.`
},
{
  slug: 'uganda-visa-and-entry',
  title: 'Uganda Visa, Entry Requirements and Health',
  category: 'practical', subcategory: 'visas', icon: 'fa-passport',
  excerpt: 'e-Visas, the East Africa Tourist Visa, yellow fever certificates and the vaccinations to discuss with your doctor.',
  read_minutes: 6, featured: 0, tags: ['visa','health','entry'],
  destinations: ['entebbe','kampala'],
  body: `Most visitors need a visa, and it should be arranged online before you travel.

## Visas
- **Single-entry tourist visa** — applied for online through the official Uganda e-Visa portal. Typically USD 50.
- **East Africa Tourist Visa** — USD 100, valid 90 days for Uganda, Kenya and Rwanda. Excellent value if you are combining countries.

Apply at least two weeks ahead and print your approval letter.

## Yellow fever
A **yellow fever vaccination certificate** is required for entry and is checked at Entebbe. Carry the original.

## Health
- Malaria is present throughout the country. Take prophylaxis and use repellent.
- Discuss typhoid, hepatitis A and B, tetanus and rabies with your travel clinic.
- Tap water is not safe to drink. Bottled and filtered water is widely available.
- Comprehensive travel insurance including medical evacuation is strongly recommended.`
},
{
  slug: 'money-and-costs-uganda',
  title: 'Money, Costs and Tipping in Uganda',
  category: 'practical', subcategory: 'money', icon: 'fa-money-bill-wave',
  excerpt: 'Shillings versus dollars, ATMs, mobile money, typical daily budgets and how much to tip guides and porters.',
  read_minutes: 6, featured: 1, tags: ['money','budget','tipping'],
  destinations: ['kampala','jinja'],
  body: `The currency is the **Uganda shilling (UGX)**. Park fees, permits and many lodges are quoted in US dollars, while day-to-day spending is in shillings.

## Cash and cards
- ATMs are reliable in Kampala, Entebbe, Jinja, Mbarara and Fort Portal, and scarce beyond.
- Bring US dollar notes printed **2013 or later** — older notes get poor rates or are refused.
- Cards work at larger hotels and lodges, often with a 3-5% surcharge.
- Mobile money (MTN MoMo, Airtel Money) is everywhere and useful with a local SIM.

## Typical daily budgets (per person)
- **Budget:** UGX 120,000-250,000 — hostels, local food, public transport.
- **Mid-range:** UGX 450,000-1,000,000 — lodges, private transport, activities.
- **Luxury:** UGX 1,500,000+ — premium lodges and private guiding.

Use our [trip planner](/planner) for a detailed estimate.

## Tipping
- Driver-guide: USD 10-20 per day.
- Porters: USD 15-20 on top of the porter fee.
- Rangers and trackers: USD 5-10 per person.
- Restaurants: 5-10% where no service charge is added.`
},
{
  slug: 'safety-tips-uganda',
  title: 'Staying Safe in Uganda',
  category: 'practical', subcategory: 'safety', icon: 'fa-shield-halved',
  excerpt: 'Practical, proportionate safety advice for cities, roads and national parks.',
  read_minutes: 5, featured: 0, tags: ['safety','advice'],
  destinations: ['kampala'],
  body: `Uganda is a welcoming country and the vast majority of visits are trouble-free. Most risks are the ordinary ones of any busy city, plus the roads.

## In the cities
- Use ride-hailing apps rather than hailing drivers on the street at night.
- Keep phones out of sight in crowded markets and taxi parks.
- Carry a copy of your passport; leave the original in the hotel safe.

## On the road
Road travel is the biggest real risk. Avoid driving after dark, choose reputable bus companies, and wear a helmet on any boda.

## In the parks
- Always follow ranger instructions on walks and treks.
- Never leave the vehicle on game drives except at designated points.
- Hippos are dangerous on land at night around lakeside lodges — use an escort if offered.

## Check current advice
Always check your government's current travel advisory before you go, particularly for border areas.`
},
{
  slug: 'what-to-pack-uganda',
  title: 'What to Pack for a Uganda Trip',
  category: 'planning', subcategory: 'packing', icon: 'fa-suitcase',
  excerpt: 'A practical packing list covering gorilla treks, safaris, the Nile and the mountains.',
  read_minutes: 4, featured: 0, tags: ['packing','gear'],
  destinations: ['bwindi-impenetrable-national-park','rwenzori-mountains-national-park','jinja'],
  body: `Pack light — especially if you are flying between parks, where soft bags and a 15 kg limit apply.

## Essentials
- Lightweight long trousers and long-sleeved shirts in neutral colours
- A warm fleece — highland evenings get cold
- A proper rain jacket
- Broken-in waterproof hiking boots
- Sun hat, sunglasses and high-factor sunscreen
- Insect repellent with DEET
- Binoculars
- Universal power adaptor (Uganda uses UK-style type G sockets)

## For gorilla and chimp treks
- Gardening gloves
- Gaiters or long socks to tuck trousers into
- A small daypack with a rain cover

## Avoid
- Dark blue and black clothing in tsetse areas
- Camouflage clothing — associated with the military
- Single-use plastic bags, which are banned`
},
{
  slug: 'uganda-food-and-culture',
  title: 'Ugandan Food and Culture: A Visitor\'s Primer',
  category: 'planning', subcategory: 'culture', icon: 'fa-utensils',
  excerpt: 'From rolex and matoke to kingdoms and greetings — the cultural basics that make a visit richer.',
  read_minutes: 6, featured: 0, tags: ['food','culture','etiquette'],
  destinations: ['kampala','kasubi-tombs','fort-portal'],
  body: `Uganda has more than 50 ethnic groups and several traditional kingdoms, and the cultural texture changes noticeably as you travel.

## Food to try
- **Rolex** — a chapati rolled around an omelette. The national street snack.
- **Matoke** — steamed green bananas, usually with groundnut sauce.
- **Luwombo** — meat or chicken steamed in banana leaves, a Buganda speciality.
- **Tilapia** — whole-fried fish around Lake Victoria and the Nile.
- **Uganda Waragi** — the local gin.

## Kingdoms
The **Buganda** kingdom around Kampala is the largest, and the Kasubi Tombs and Kabaka's Palace are its key sites. **Toro** is centred on Fort Portal, **Bunyoro** on Hoima and Masindi.

## Etiquette
- Greetings matter. Take time to say hello before asking a question.
- Dress modestly away from lodges, especially at religious and royal sites.
- Always ask before photographing people.
- Use your right hand to give and receive.`
},
{
  slug: 'rafting-the-nile-jinja',
  title: 'Rafting the Nile at Jinja: A First-Timer\'s Guide',
  category: 'planning', subcategory: 'adventure', icon: 'fa-water',
  excerpt: 'Grade 5 rapids, what a day on the river looks like, safety and how to choose an operator.',
  read_minutes: 5, featured: 0, tags: ['rafting','jinja','adventure'],
  destinations: ['jinja','bujagali','source-of-the-nile'],
  body: `Jinja is one of the world's great white-water destinations, and you do not need any experience to do it.

## A day on the river
Operators collect you in Jinja, give a safety briefing on flat water, and then run a series of grade 3-5 rapids with calm stretches for swimming between. Lunch is on a river island. Most full-day trips cover around 25-30 km.

## Choosing an operator
- Check that safety kayakers accompany every raft.
- Ask about guide experience and equipment.
- Family float trips on gentler water are available for younger children.

## Costs
Full-day trips typically cost USD 125-150 per person including transport, lunch and often a night of accommodation.

## Other Jinja activities
Kayaking, bungee jumping, stand-up paddleboarding, horse riding, quad biking and sunset cruises to the Source of the Nile.`
}
];
