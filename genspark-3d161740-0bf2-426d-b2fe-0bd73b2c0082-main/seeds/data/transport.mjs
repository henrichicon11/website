// Places = route endpoints (towns, hubs, destinations).
// Distances are road distances, not straight-line, taken from standard
// Ugandan road-network references. Fares reflect typical 2024-25 pricing.

export const PLACES = [
  // Central hubs
  ['kampala','Kampala','town','central',0.3476,32.5825,1,0],
  ['entebbe','Entebbe','town','central',0.0512,32.4460,1,1],
  ['masaka','Masaka','town','central',-0.3333,31.7333,1,0],
  ['mukono','Mukono','town','central',0.3533,32.7553,0,0],
  ['luweero','Luweero','town','central',0.8492,32.4731,0,0],
  ['mityana','Mityana','town','central',0.4017,32.0225,0,0],
  ['mubende','Mubende','town','central',0.5594,31.3950,0,0],
  ['nakasongola','Nakasongola','town','central',1.3089,32.4611,0,0],
  // Eastern
  ['jinja','Jinja','town','eastern',0.4244,33.2041,1,0],
  ['iganga','Iganga','town','eastern',0.6092,33.4686,0,0],
  ['mbale','Mbale','town','eastern',1.0805,34.1750,1,0],
  ['kapchorwa','Kapchorwa','town','eastern',1.3958,34.4500,0,0],
  ['sipi','Sipi','destination','eastern',1.3333,34.3833,0,0],
  ['soroti','Soroti','town','eastern',1.7147,33.6111,1,1],
  ['tororo','Tororo','town','eastern',0.6928,34.1808,0,0],
  ['moroto','Moroto','town','eastern',2.5275,34.6656,0,1],
  ['bugala','Kalangala (Bugala Is.)','destination','central',-0.3167,32.2833,0,0],
  // Western
  ['mbarara','Mbarara','town','western',-0.6072,30.6545,1,1],
  ['kabale','Kabale','town','western',-1.2489,29.9897,1,0],
  ['kisoro','Kisoro','town','western',-1.2853,29.6847,0,1],
  ['fort-portal','Fort Portal','town','western',0.6710,30.2750,1,0],
  ['kasese','Kasese','town','western',0.1833,30.0833,1,1],
  ['hoima','Hoima','town','western',1.4356,31.3522,1,0],
  ['bushenyi','Bushenyi','town','western',-0.5856,30.1856,0,0],
  ['kanungu','Kanungu / Kihihi','town','western',-0.7500,29.7167,0,1],
  ['kamwenge','Kamwenge','town','western',0.1861,30.4553,0,0],
  ['bundibugyo','Bundibugyo','town','western',0.7100,30.0600,0,0],
  // Northern
  ['masindi','Masindi','town','northern',1.6744,31.7150,1,0],
  ['gulu','Gulu','town','northern',2.7747,32.2990,1,1],
  ['kitgum','Kitgum','town','northern',3.2783,32.8867,0,0],
  ['arua','Arua','town','northern',3.0201,30.9110,1,1],
  ['lira','Lira','town','northern',2.2350,32.9097,1,0],
  ['paraa','Paraa (Murchison)','destination','northern',2.2833,31.5667,0,1],
  ['apoka','Apoka (Kidepo)','destination','northern',3.7167,33.7500,0,1],
  // Destination endpoints
  ['buhoma','Buhoma (Bwindi)','destination','western',-0.9833,29.6167,0,0],
  ['rushaga','Rushaga (Bwindi)','destination','western',-1.1000,29.6500,0,0],
  ['katunguru','Katunguru (QENP)','destination','western',-0.1667,30.0833,0,0],
  ['kanyanchu','Kanyanchu (Kibale)','destination','western',0.4833,30.3833,0,0],
  ['nshara','Nshara Gate (L. Mburo)','destination','western',-0.6000,30.9500,0,0],
  ['rutinda','Rutinda (L. Bunyonyi)','destination','western',-1.2833,29.9333,0,0],
  ['ziwa','Ziwa Rhino Sanctuary','destination','northern',1.6167,32.1500,0,0],
  ['mabamba','Mabamba Swamp','destination','central',0.0833,32.3167,0,0],
  ['najjembe','Najjembe (Mabira)','destination','central',0.4167,33.0000,0,0],
  ['bujagali','Bujagali','destination','eastern',0.4903,33.1350,0,0],
  ['ntebeko','Ntebeko (Mgahinga)','destination','western',-1.3667,29.6333,0,0],
  ['nyakalengija','Nyakalengija (Rwenzori)','destination','western',0.3500,30.0167,0,0],
  ['budadiri','Budadiri (Mt Elgon)','destination','eastern',1.1500,34.3167,0,0],
  ['sempaya','Sempaya (Semuliki)','destination','western',0.8333,30.1333,0,0],
  ['bukakata','Bukakata (ferry)','town','central',-0.1667,31.9500,0,0]
];

// Curated routes: [from, to, distance_km, hrs_min, hrs_max, road_quality,
//                   waypoints[], transfers, notes, alt?]
export const ROUTES = [
  ['kampala','jinja',80,1.5,2,'tarmac',['Kampala','Mukono','Lugazi','Njeru','Jinja'],0,
   'Fully tarmac on the main eastern highway. Traffic leaving Kampala is the main variable — leave before 07:00 or after 10:00 to avoid an extra hour. The road passes through Mabira Forest at Najjembe, a worthwhile stop.',
   {km:95,wp:['Kampala','Gayaza','Kayunga','Njeru','Jinja'],note:'The northern route via Kayunga avoids the worst of the Mukono-Lugazi traffic but is longer and partly murram.'}],

  ['kampala','entebbe',40,0.75,1.5,'tarmac',['Kampala','Kajjansi','Entebbe'],0,
   'The Entebbe Expressway is a toll road and much faster than the old route, typically 45 minutes against 90 in traffic. The old Entebbe Road via Kajjansi is free and passes the craft markets.',
   {km:36,wp:['Kampala','Expressway','Entebbe'],note:'Expressway toll route — fastest option, toll payable by vehicle class.'}],

  ['kampala','mbale',245,4,4.5,'tarmac',['Kampala','Jinja','Iganga','Bugiri','Mbale'],0,
   'Good tarmac the whole way on the main eastern corridor. Buses run continuously from Kampala and the journey is straightforward. Watch for heavy truck traffic between Jinja and Iganga.',null],

  ['kampala','sipi',277,5,6,'tarmac',['Kampala','Jinja','Iganga','Mbale','Sironko','Sipi'],1,
   'Tarmac to Mbale then 65 km north-east through Sironko towards Kapchorwa, now largely paved. On public transport you change at Mbale for a Kapchorwa-bound minibus.',null],

  ['mbale','sipi',65,1.5,2,'tarmac',['Mbale','Sironko','Chema','Sipi'],0,
   'A steady climb from Mbale onto the Elgon escarpment. Minibuses run frequently from Mbale to Kapchorwa and pass through Sipi trading centre.',null],

  ['kampala','masindi',214,3.5,4,'tarmac',['Kampala','Luweero','Nakasongola','Kafu','Masindi'],0,
   'Good tarmac on the Gulu highway as far as Kafu, then west to Masindi. Ziwa Rhino Sanctuary sits directly on this route at Nakitoma.',null],

  ['kampala','paraa',305,5,6,'mixed',['Kampala','Luweero','Nakasongola','Masindi','Kichumbanyobo Gate','Paraa'],1,
   'Tarmac to Masindi then park roads to Paraa. The southern Kichumbanyobo gate route passes through Budongo Forest. For the northern bank you continue via Karuma, adding about an hour.',
   {km:345,wp:['Kampala','Luweero','Karuma','Chobe Gate','Paraa'],note:'The Karuma route approaches from the north bank and avoids the Paraa ferry if your lodge is on that side.'}],

  ['kampala','ziwa',176,2.5,3,'tarmac',['Kampala','Luweero','Nakasongola','Nakitoma'],0,
   'Straightforward tarmac on the Gulu highway. The sanctuary entrance is signposted at Nakitoma. Almost every Murchison itinerary stops here.',null],

  ['kampala','mbarara',266,4,5,'tarmac',['Kampala','Mpigi','Masaka','Lyantonde','Mbarara'],0,
   'The main western highway, tarmac throughout and generally in good condition. The Equator crossing at Kayabwe is the standard photo stop, about 72 km from Kampala.',null],

  ['kampala','nshara',228,3.5,4,'mixed',['Kampala','Masaka','Lyantonde','Sanga','Nshara Gate'],0,
   'Tarmac to Sanga trading centre, then 13 km of murram to the gate. Any Mbarara-bound bus will drop you at Sanga. Usually passable in a 2WD in dry weather.',null],

  ['kampala','katunguru',410,6,7,'tarmac',['Kampala','Masaka','Mbarara','Bushenyi','Katunguru'],0,
   'Tarmac the whole way via Mbarara. The public road runs through the park itself, so you pass through the boundary at Katunguru. An alternative via Fort Portal is slightly longer but more scenic.',
   {km:420,wp:['Kampala','Mityana','Mubende','Fort Portal','Kasese','Katunguru'],note:'The Fort Portal route is marginally longer but passes Kibale and the crater lakes, making it far better as a touring route.'}],

  ['kampala','buhoma',510,8,10,'mixed',['Kampala','Masaka','Mbarara','Rukungiri','Kanungu','Buhoma'],1,
   'Tarmac as far as Rukungiri or Kanungu, then murram into Buhoma. A 4x4 is strongly recommended for the final section. Most visitors break the journey at Mbarara or Lake Mburo rather than driving it in one day.',
   {km:530,wp:['Kampala','Masaka','Mbarara','Kabale','Kanungu','Buhoma'],note:'Via Kabale — longer but allows a stop at Lake Bunyonyi on the way.'}],

  ['kampala','rushaga',495,8,9.5,'mixed',['Kampala','Masaka','Mbarara','Kabale','Rushaga'],1,
   'Tarmac to Kabale then murram into the Rushaga sector. Rushaga and Nkuringo are served from Kabale or Kisoro rather than from Kanungu, which is why the sector on your permit matters so much.',null],

  ['kampala','kabale',411,7,8,'tarmac',['Kampala','Masaka','Mbarara','Ntungamo','Kabale'],0,
   'Tarmac throughout on the main road to the Rwanda border. A long but straightforward drive; buses run all day and overnight.',null],

  ['kampala','rutinda',419,7,8,'mixed',['Kampala','Mbarara','Kabale','Rutinda'],0,
   'Tarmac to Kabale then 8 km of steep murram down to the lake landing site. Island lodges arrange boat transfers from Rutinda.',null],

  ['kampala','kisoro',510,9,10,'tarmac',['Kampala','Masaka','Mbarara','Kabale','Kisoro'],0,
   'Tarmac the whole way. The final stretch from Kabale over the Kanaba gap is spectacular, with views across the Virunga volcanoes on a clear day.',null],

  ['kampala','ntebeko',524,9.5,10.5,'mixed',['Kampala','Mbarara','Kabale','Kisoro','Ntebeko'],1,
   'Tarmac to Kisoro then 14 km of murram to the park headquarters. A 4x4 is needed in the wet season.',null],

  ['kampala','fort-portal',320,4.5,5.5,'tarmac',['Kampala','Mityana','Mubende','Kyenjojo','Fort Portal'],0,
   'One of the better long drives in Uganda — good tarmac, moderate traffic and attractive country once past Mubende. Buses run frequently.',null],

  ['kampala','kanyanchu',356,5,6,'tarmac',['Kampala','Mubende','Fort Portal','Kanyanchu'],0,
   'Tarmac via Fort Portal then 36 km south towards Kamwenge. You must reach the visitor centre by 07:30 for the morning chimp briefing, so most visitors stay locally the night before.',null],

  ['kampala','kasese',380,6,7,'tarmac',['Kampala','Mubende','Fort Portal','Kasese'],0,
   'Tarmac throughout via Fort Portal. Kasese is the base for the Rwenzori trailheads and the northern Queen Elizabeth gates.',null],

  ['kampala','sempaya',375,6.5,7.5,'mixed',['Kampala','Mubende','Fort Portal','Sempaya'],0,
   'Tarmac to Fort Portal then 55 km west over the Rwenzori foothills into the Semliki valley. The descent is steep and winding but the views are among the best in western Uganda.',null],

  ['kampala','gulu',333,5,6,'tarmac',['Kampala','Luweero','Nakasongola','Karuma','Gulu'],0,
   'Good tarmac on the northern highway. The Karuma bridge over the Nile is the halfway marker. Buses run frequently and the road is one of Uganda\'s best.',null],

  ['kampala','apoka',700,10,12,'rough',['Kampala','Gulu','Kitgum','Karenga','Apoka'],2,
   'Tarmac to Kitgum, then rough murram for the final 100+ km into the park. A 4x4 with high clearance is essential and the drive is far better split over two days with a night in Gulu or Kitgum. Flying from Entebbe is the realistic option for most visitors.',
   {km:790,wp:['Kampala','Mbale','Soroti','Moroto','Kaabong','Apoka'],note:'The eastern route through Karamoja is longer and rougher but takes you through country most visitors never see.'}],

  ['kampala','najjembe',54,1,1.5,'tarmac',['Kampala','Mukono','Lugazi','Najjembe'],0,
   'Directly on the Jinja highway. Any eastbound bus passes through and will drop you at the forest visitor centre.',null],

  ['kampala','mabamba',60,2,2.5,'mixed',['Kampala','Nateete','Kasanje','Nakawuka','Mabamba'],1,
   'Tarmac out of Kampala then murram for the last stretch to the landing site. Alternatively cross by boat from Entebbe, which takes 45-60 minutes and is more pleasant.',null],

  ['kampala','bukakata',190,3.5,4,'tarmac',['Kampala','Mpigi','Masaka','Bukakata'],0,
   'Tarmac to Masaka then east to the ferry landing. The Bukakata-Luuku ferry to the Ssese Islands is free and carries vehicles, running several times daily.',null],

  ['kampala','bujagali',88,1.75,2.25,'tarmac',['Kampala','Mukono','Njeru','Jinja','Bujagali'],0,
   'The Jinja highway then 8 km north of town to the riverside camps. Most rafting operators include free transfers from Kampala in their packages.',null],

  ['kampala','budadiri',270,4.5,5,'mixed',['Kampala','Jinja','Mbale','Budadiri'],1,
   'Tarmac to Mbale then 45 minutes to the Sasa trailhead at Budadiri. Minibuses run from Mbale.',null],

  ['kampala','nyakalengija',400,6.5,7.5,'mixed',['Kampala','Fort Portal','Kasese','Nyakalengija'],1,
   'Tarmac to Kasese then 22 km of murram to the central circuit trailhead. All Rwenzori trekking must be arranged through a licensed operator.',null],

  ['kampala','hoima',200,3,4,'tarmac',['Kampala','Bombo','Kiboga','Hoima'],0,
   'Tarmac throughout. Hoima is the Bunyoro kingdom seat and a staging point for the Lake Albert escarpment.',null],

  ['kampala','moroto',450,7,9,'mixed',['Kampala','Mbale','Soroti','Moroto'],1,
   'Tarmac via Mbale and Soroti, with the final approach to Moroto improved in recent years. The gateway to Karamoja and Pian Upe.',null],

  ['kampala','bugala',190,4.5,6,'mixed',['Kampala','Masaka','Bukakata','ferry','Luuku','Kalangala'],1,
   'Drive to Bukakata and take the free vehicle ferry, about 45 minutes, then murram roads on the island. Alternatively the Entebbe passenger ferry takes 3-3.5 hours direct.',
   {km:40,wp:['Entebbe','Nakiwogo pier','ferry','Kalangala'],note:'The Entebbe passenger ferry is foot-passenger only, departs early afternoon and takes 3-3.5 hours.'}],

  // Inter-regional links
  ['jinja','mbale',165,2.5,3,'tarmac',['Jinja','Iganga','Bugiri','Mbale'],0,
   'Good tarmac on the eastern corridor. Frequent buses and minibuses.',null],

  ['jinja','sipi',197,3.5,4.5,'tarmac',['Jinja','Iganga','Mbale','Sironko','Sipi'],1,
   'The natural eastern circuit progression. Change at Mbale on public transport.',null],

  ['mbale','moroto',215,4,5,'mixed',['Mbale','Soroti','Nakapiripirit','Moroto'],1,
   'Largely tarmac now, a significant improvement on the old road. Passes close to Pian Upe Wildlife Reserve.',null],

  ['mbarara','katunguru',150,2.5,3,'tarmac',['Mbarara','Bushenyi','Ishaka','Katunguru'],0,
   'Tarmac throughout, an easy run into the park\'s northern sector.',null],

  ['mbarara','kabale',145,2.5,3,'tarmac',['Mbarara','Ntungamo','Kabale'],0,
   'Tarmac and generally quick. The main corridor towards the Rwanda border.',null],

  ['katunguru','kanyanchu',135,2.5,3,'tarmac',['Katunguru','Kasese','Fort Portal','Kanyanchu'],0,
   'The standard Queen Elizabeth to Kibale transfer, tarmac via Kasese and Fort Portal with the Rwenzori on your left the whole way.',null],

  ['katunguru','buhoma',160,3,4,'mixed',['Katunguru','Ishasha','Kihihi','Buhoma'],0,
   'The classic safari transfer, via the Ishasha sector where the tree-climbing lions are. Murram for much of the way and slow, but you effectively get a game drive en route.',null],

  ['fort-portal','kanyanchu',36,0.75,1,'tarmac',['Fort Portal','Kanyanchu'],0,
   'A short run south from Fort Portal. Minibuses towards Kamwenge pass the visitor centre.',null],

  ['fort-portal','sempaya',55,1.5,2,'mixed',['Fort Portal','Karugutu','Sempaya'],0,
   'Over the northern Rwenzori foothills and down into the Semliki valley. Steep and winding but largely paved, with exceptional views on the descent.',null],

  ['fort-portal','katunguru',130,2.5,3,'tarmac',['Fort Portal','Kasese','Katunguru'],0,
   'Tarmac south along the eastern edge of the Rwenzori. One of the most scenic drives in the country on a clear day.',null],

  ['kabale','rutinda',8,0.25,0.5,'murram',['Kabale','Rutinda'],0,
   'A short but steep murram descent from Kabale to the Lake Bunyonyi landing site. Bodas and special hires run constantly.',null],

  ['kabale','kisoro',80,1.75,2.25,'tarmac',['Kabale','Kanaba Gap','Kisoro'],0,
   'Tarmac over the Kanaba gap with spectacular views of the Virunga volcanoes. Winding and slow but paved.',null],

  ['kisoro','ntebeko',14,0.5,0.75,'murram',['Kisoro','Ntebeko'],0,
   'A short murram climb to the Mgahinga park headquarters. 4x4 recommended in the wet season.',null],

  ['kisoro','rushaga',45,1.5,2,'murram',['Kisoro','Nyakabande','Rushaga'],0,
   'Murram throughout and slow going, but the standard access for the southern Bwindi sectors.',null],

  ['buhoma','rutinda',140,3,4,'mixed',['Buhoma','Kanungu','Kabale','Rutinda'],0,
   'The usual decompression run after gorilla trekking. Murram out of Buhoma then tarmac to Kabale.',null],

  ['gulu','apoka',380,6,8,'rough',['Gulu','Kitgum','Karenga','Apoka'],1,
   'Tarmac to Kitgum then rough murram into the park. High-clearance 4x4 essential.',null],

  ['gulu','paraa',130,2.5,3.5,'mixed',['Gulu','Purongo','Tangi Gate','Paraa'],0,
   'South from Gulu to the park\'s northern gates. Murram inside the park but generally in reasonable condition.',null],

  ['masindi','paraa',85,1.5,2.5,'murram',['Masindi','Kichumbanyobo Gate','Paraa'],0,
   'Park roads through Budongo Forest to Paraa. Murram and slow but scenic, with a good chance of primates on the forest section.',null],

  ['entebbe','mabamba',45,1,1.5,'mixed',['Entebbe','Nakawuka','Kasanje','Mabamba'],0,
   'Road around the lake, or a 45-60 minute boat crossing direct from Nakiwogo pier — the boat is more pleasant and often faster.',null],

  ['entebbe','jinja',115,2,2.75,'tarmac',['Entebbe','Kampala bypass','Mukono','Jinja'],0,
   'Via the Kampala northern bypass to avoid the city centre. Timing depends almost entirely on Kampala traffic.',null],

  ['entebbe','bugala',50,3,3.5,'tarmac',['Entebbe','Nakiwogo pier','ferry','Kalangala'],0,
   'The passenger ferry from Nakiwogo pier takes 3-3.5 hours to Bugala. Foot passengers only; confirm current departure times.',null]
];

// Curated fares for specific routes: [routeSlug, mode, min, max, hrsMin, hrsMax, notes]
export const FARES = [
  ['kampala-to-jinja','bus',10000,15000,2,2.5,'Frequent departures from Namayiba and Nakawa throughout the day.'],
  ['kampala-to-jinja','minibus',10000,15000,1.75,2.5,'Leaves when full from the Old Taxi Park; very frequent on this route.'],
  ['kampala-to-jinja','motorcycle',40000,70000,2,2.5,'Possible but not advisable on the highway. Agree the fare first.'],
  ['kampala-to-jinja','special_hire',150000,250000,1.5,2,'Negotiated door to door; whole vehicle.'],

  ['kampala-to-entebbe','minibus',5000,8000,1,1.5,'Shared taxis run constantly from the Old Taxi Park.'],
  ['kampala-to-entebbe','special_hire',80000,150000,0.75,1.5,'Airport transfers; pre-booked or app-based is cheaper than the airport rank.'],

  ['kampala-to-mbale','bus',20000,30000,4,5,'Several companies run this route all day from Namayiba.'],
  ['kampala-to-mbale','minibus',25000,35000,4,5,'Slightly more expensive than the bus and less comfortable over this distance.'],

  ['kampala-to-sipi','bus',25000,40000,5.5,6.5,'Bus to Mbale then a minibus onward to Kapchorwa.'],
  ['mbale-to-sipi','minibus',10000,15000,1.5,2,'Frequent minibuses towards Kapchorwa pass through Sipi.'],

  ['kampala-to-mbarara','bus',25000,35000,4.5,5.5,'Very frequent on the western corridor.'],
  ['kampala-to-kabale','bus',30000,40000,8,9,'Day and overnight services from Kampala.'],
  ['kampala-to-kisoro','bus',40000,60000,10,12,'Long haul; overnight buses are common on this route.'],
  ['kampala-to-fort-portal','bus',25000,35000,5,6,'Frequent services via Mubende.'],
  ['kampala-to-kasese','bus',30000,40000,7,8,'Continues beyond Fort Portal to Kasese.'],
  ['kampala-to-gulu','bus',25000,40000,5,6,'Good tarmac and frequent departures on the northern highway.'],
  ['kampala-to-masindi','bus',20000,30000,4,5,'Regular services from Kisenyi terminal.'],

  ['kampala-to-paraa','flight',900000,1400000,1.25,1.5,'Aerolink and Bar Aviation scheduled flights from Entebbe to Pakuba or Bugungu.'],
  ['kampala-to-apoka','flight',1300000,2000000,2,2.5,'Entebbe to Apoka airstrip; the realistic option for a short Kidepo trip.'],
  ['kampala-to-buhoma','flight',1000000,1600000,1.5,2,'Entebbe to Kihihi airstrip, then a 1-2 hour road transfer.'],
  ['kampala-to-katunguru','flight',900000,1400000,1.25,1.75,'Entebbe to Mweya or Kasese airstrip.'],

  ['kampala-to-bugala','bus',25000,35000,4.5,6,'Bus to Masaka or Bukakata, then the free vehicle ferry.'],
  ['entebbe-to-bugala','bus',14000,20000,3,3.5,'The MV Kalangala passenger ferry; fare is per foot passenger.'],

  ['kampala-to-najjembe','minibus',8000,12000,1,1.5,'Any Jinja-bound vehicle passes through Najjembe.'],
  ['kampala-to-ziwa','bus',15000,25000,2.5,3,'Any Gulu-bound bus will drop you at Nakitoma.'],
  ['kampala-to-nshara','bus',20000,30000,3.5,4.5,'Mbarara-bound bus, alight at Sanga trading centre.'],
  ['kabale-to-rutinda','motorcycle',5000,10000,0.25,0.5,'Bodas wait at Kabale taxi park for the run down to the lake.'],
  ['kabale-to-rutinda','special_hire',20000,30000,0.25,0.5,'Whole vehicle, negotiated.'],
  ['jinja-to-mbale','bus',15000,25000,2.5,3,'Frequent on the eastern corridor.'],
  ['mbarara-to-kabale','bus',15000,20000,2.5,3,'Any Kabale or Kisoro bound service.'],
  ['kampala-to-bujagali','minibus',12000,18000,2,2.5,'Jinja minibus then a boda from town.'],
  ['kampala-to-mabamba','minibus',10000,15000,2,2.5,'Via Kasanje; the last stretch is murram.']
];
