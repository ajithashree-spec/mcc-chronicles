import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Compass,
  BookOpen,
  Building,
  TreePine,
  Award,
  Clock,
  Layers,
  ChevronRight,
  Info,
  Tag,
  Shield,
  Sparkles,
} from 'lucide-react';

const LANDMARKS = [
  {
    id: 'miller-library',
    number: 1,
    name: 'Miller Memorial Library',
    tagline: 'Repository of over 100,000 historic volumes & collegiate records',
    established: '1937',
    category: 'academic',
    zone: 'Anderson Quadrangle (North)',
    coords: { x: 38, y: 28 },
    image: '/images/campus/mcc-main-facade.jpg',
    architecturalStyle: 'Indo-Saracenic Red-Brick Broadsheet Classical',
    history:
      'Named after the visionary missionary and educator Dr. William Miller, who spearheaded the relocation from George Town to the serene 365-acre Tambaram estate. The library houses irreplaceable 19th-century palm-leaf manuscripts, Madras Christian College Magazine archives dating to 1883, and rare botanical catalogs of South India.',
    features: [
      'Over 100,000 archival volumes',
      'Original 1937 teakwood reading carrels',
      'Special archival rare-book vault',
      'Panoramic second-story windows overlooking Anderson Quadrangle',
    ],
    tags: ['millermemorial', 'centenary', 'archives'],
  },
  {
    id: 'guthridge-hall',
    number: 2,
    name: 'Guthridge Hall & Main Clock Tower',
    tagline: 'Collegiate Gothic landmark & academic administrative nerve centre',
    established: '1937',
    category: 'academic',
    zone: 'Central Quadrangle',
    coords: { x: 48, y: 35 },
    image: '/images/campus/mcc-main-facade.jpg',
    architecturalStyle: 'Collegiate Gothic with Mangalore Tile Corridors',
    history:
      'Featuring the iconic four-sided mechanical clock tower whose chimes govern the rhythm of college life, Guthridge Hall forms the stately backdrop of campus convocations and national academic symposia. Its high vaulted archways and cloistered corridors were specifically designed to channel cooling coastal sea breezes through the tropical scrub woodland.',
    features: [
      'Four-faced mechanical pendulum clock tower',
      'Grand Council Chamber with oil portraits of historic Principals',
      'Limestone cloistered arches and courtyards',
      'Memorial bell cast in Great Britain',
    ],
    tags: ['clocktower', 'heritage', 'quadrangle'],
  },
  {
    id: 'heber-hall',
    number: 3,
    name: 'Bishop Heber Hall & Chapel',
    tagline: 'Founded 1923 • Legendary hall spirit, Pelican emblem & sacred chapel',
    established: '1923 (Relocated 1937)',
    category: 'residence',
    zone: 'West Residential Precinct',
    coords: { x: 22, y: 48 },
    image: '/images/campus/mcc-hall-heritage.jpg',
    architecturalStyle: 'Traditional South Indian Courtyard with Gothic Chapel',
    history:
      'Tracing its ancestry to the Christian College at Tiruchirappalli, Bishop Heber Hall fosters intense fraternity and literary camaraderie. The Hall Chapel, with its unadorned rustic granite altar and wooden rafters, hosts meditative candlelit choral services that have resonated through generations of resident scholars.',
    features: [
      'Pelican crest emblem of selfless sacrifice',
      'Acoustically pristine Heber Chapel',
      'Ancient Banyan gathering courtyard',
      'Annual Bishop Heber Memorial Lectures',
    ],
    tags: ['heberhall', 'residence', 'heritage'],
  },
  {
    id: 'st-thomas-hall',
    number: 4,
    name: "St. Thomas's Hall",
    tagline: 'Oldest hall of residence on campus grounds, rooted in apostolic lore',
    established: '1937',
    category: 'residence',
    zone: 'North-West Residential Sector',
    coords: { x: 28, y: 22 },
    image: '/images/campus/mcc-hall-heritage.jpg',
    architecturalStyle: 'Collegiate Courtyard with Sandstone Masonry',
    history:
      'Consecrated under the patron saint of South India, St. Thomas’s Hall is renowned for its steadfast debating society and sporting supremacy on Anderson Field. Its two-story residential quadrangles feature open-air balconies where resident philosophers, scientists, and journalists have debated world events under starlit Tambaram skies.',
    features: [
      'Historic Hall Crest with Apostolic Spear',
      'Open-air central courtyard amphitheatre',
      'Extensive sports trophy salon',
      'Generational debating union',
    ],
    tags: ['st-thomas', 'debating', 'residence'],
  },
  {
    id: 'selaiyur-hall',
    number: 5,
    name: 'Selaiyur Hall',
    tagline: 'Renowned for literary vigor, the Anchor symbol & intellectual debate',
    established: '1937',
    category: 'residence',
    zone: 'North-East Residential Sector',
    coords: { x: 68, y: 24 },
    image: '/images/campus/mcc-hall-heritage.jpg',
    architecturalStyle: 'Red-Brick Quadrangle with Open Verandahs',
    history:
      'Rooted deeply in collegiate lore, Selaiyur Hall stands as a citadel of student journalism, theatrical productions, and intellectual non-conformity. Its anchor insignia signifies steadfast hope and moral anchorage. Alumni include prominent jurists, civil servants, and authors who found their literary voices within its breezy corridors.',
    features: [
      'The Anchor insignia and maritime motto',
      'Lush inner courtyard ringed by rain trees',
      'Historic Hall dining commons and high table',
      'Active literary and cultural fellowship',
    ],
    tags: ['selaiyur', 'studentlife', 'residence'],
  },
  {
    id: 'martin-hall',
    number: 6,
    name: "Martin Hall & Women's Quarters",
    tagline: "Pioneering residential hall for women's collegiate education in South India",
    established: '1968',
    category: 'residence',
    zone: 'East Residential Sector',
    coords: { x: 74, y: 44 },
    image: '/images/campus/mcc-hall-heritage.jpg',
    architecturalStyle: 'Modernist Academic Pavilion surrounded by Gulmohar Trees',
    history:
      'Marking a historic milestone in the co-educational advancement of MCC, Martin Hall was instituted to welcome pioneering women scholars into campus residency. Named after Agnes Martin, the hall has nurtured trailblazing women diplomats, research scientists, and educators who have transformed society across India and abroad.',
    features: [
      'Memorial rose garden and tranquil courtyards',
      'Women’s leadership and symposium archives',
      'Reading parlour with botanical garden views',
      'Strong tradition of community outreach',
    ],
    tags: ['martinhall', 'leadership', 'residence'],
  },
  {
    id: 'scrub-jungle',
    number: 7,
    name: 'The Scrub Jungle Botanical Sanctuary',
    tagline: '365-acre tropical dry evergreen forest & living natural history laboratory',
    established: 'Protected Sanctuary (1837/1937)',
    category: 'nature',
    zone: 'Southern & Eastern Forest Belt',
    coords: { x: 60, y: 72 },
    image: '/images/campus/mcc-scrub-jungle.jpg',
    architecturalStyle: 'Living Biosphere & Native Scrub Jungle Woodland',
    history:
      'One of the last surviving tracts of pristine Coromandel Tropical Dry Evergreen Forest in peninsular India. The campus forest is home to herds of wild spotted deer (Axis axis), bonnet macaques, golden jackals, rare nocturnal civets, and over 150 species of resident and migratory avifauna studied continuously by the Botany and Zoology departments.',
    features: [
      'Over 180 documented indigenous flora species',
      'Natural scrub wetlands and rain ponds',
      'Biodiversity nature trails and birding corridors',
      'Open sanctuary for free-ranging spotted deer',
    ],
    tags: ['scrubjungle', 'botany', 'biodiversity'],
  },
  {
    id: 'anderson-field',
    number: 8,
    name: 'Athletic Pavilion & Anderson Field',
    tagline: 'Centenary athletic grounds, cricket greens & sports heritage',
    established: '1937',
    category: 'nature',
    zone: 'South-West Sports Grounds',
    coords: { x: 32, y: 76 },
    image: '/images/campus/mcc-campus-life.jpg',
    architecturalStyle: 'Collegiate Timber & Masonry Sports Pavilion',
    history:
      'The sacred turf where legendary collegiate cricket derbies, hockey championships, and track meets have unfolded for nearly a century. Surrounded by towering mahogany and tamarind groves, Anderson Field has produced Olympians, Ranji Trophy captains, and university athletic champions whose records adorn the pavilion boards.',
    features: [
      'Historic wooden spectator pavilion',
      'Standard 400m turf athletic running track',
      'First-class turf cricket pitch and outfield',
      'Site of the legendary Inter-Hall Sports Derby',
    ],
    tags: ['sports', 'andersonfield', 'athletics'],
  },
];

export default function CampusMap() {
  const [selectedId, setSelectedId] = useState(LANDMARKS[0].id);
  const [filterCategory, setFilterCategory] = useState('all');

  const selectedLandmark =
    LANDMARKS.find((l) => l.id === selectedId) || LANDMARKS[0];

  const filteredLandmarks =
    filterCategory === 'all'
      ? LANDMARKS
      : LANDMARKS.filter((l) => l.category === filterCategory);

  return (
    <div className="font-serif space-y-8 animate-in fade-in duration-300">
      {/* 1. GRAND BROADSHEET MASTHEAD BANNER */}
      <section className="bg-white border-y-2 border-mcc-maroon py-6 px-4 sm:px-8 text-center relative overflow-hidden shadow-xs">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold">
            <Compass className="w-4 h-4 text-mcc-maroon" />
            <span>Collegiate Cartography & Architectural Annals</span>
            <Compass className="w-4 h-4 text-mcc-maroon" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-mcc-maroon tracking-tight">
            The MCC 365-Acre Scrub Jungle & Heritage Quadrangle
          </h1>
          <p className="text-sm sm:text-base text-gray-700 italic max-w-2xl mx-auto leading-relaxed pt-1">
            An interactive survey of Madras Christian College’s historic halls of residence, collegiate gothic clock towers, and indigenous dry evergreen sanctuary in Tambaram.
          </p>
          <div className="p-1.5 bg-[#fbfaf8] border border-gray-300 shadow-sm ring-1 ring-mcc-gold/30 rounded-xs mt-3 relative max-w-full overflow-hidden">
            <div className="relative overflow-hidden rounded-xs max-h-64 aspect-16/7 sm:aspect-21/9">
              <img
                src="/images/campus/mcc-main-facade.jpg"
                alt="Madras Christian College Historic Campus Grounds & Main Hall"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.src = '/images/campus/mcc-scrub-jungle.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                <span className="text-xs text-white font-serif italic">
                  Historic Main Quadrangle, Clock Tower & Pristine Tambaram Greens • Archives of Madras Christian College
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-sans font-semibold no-print">
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-full border transition-all ${
            filterCategory === 'all'
              ? 'bg-mcc-maroon text-white border-mcc-maroon shadow-xs'
              : 'bg-white text-gray-700 border-gray-300 hover:border-mcc-maroon'
          }`}
        >
          All 8 Historic Landmarks
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('academic')}
          className={`px-4 py-2 rounded-full border transition-all ${
            filterCategory === 'academic'
              ? 'bg-mcc-maroon text-white border-mcc-maroon shadow-xs'
              : 'bg-white text-gray-700 border-gray-300 hover:border-mcc-maroon'
          }`}
        >
          Academic & Clock Tower
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('residence')}
          className={`px-4 py-2 rounded-full border transition-all ${
            filterCategory === 'residence'
              ? 'bg-mcc-maroon text-white border-mcc-maroon shadow-xs'
              : 'bg-white text-gray-700 border-gray-300 hover:border-mcc-maroon'
          }`}
        >
          Halls of Residence
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('nature')}
          className={`px-4 py-2 rounded-full border transition-all ${
            filterCategory === 'nature'
              ? 'bg-mcc-maroon text-white border-mcc-maroon shadow-xs'
              : 'bg-white text-gray-700 border-gray-300 hover:border-mcc-maroon'
          }`}
        >
          Scrub Jungle & Athletics
        </button>
      </div>

      {/* 3. MAIN TWO-COLUMN EXPLORER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: INTERACTIVE CARTOGRAPHIC SCHEMATIC & DIRECTORY (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stylized Broadsheet SVG Campus Map */}
          <div className="bg-white p-5 rounded-lg border border-mcc-maroon/20 shadow-xs relative">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-mcc-maroon" />
                <h3 className="font-bold text-sm tracking-wide uppercase text-mcc-navy">
                  Campus Cartographic Schematic
                </h3>
              </div>
              <span className="text-[11px] text-gray-500 font-sans italic">
                Tambaram, Chennai 600059 • Lat 12.9249° N, Lon 80.1226° E
              </span>
            </div>

            {/* SVG Visual Plan */}
            <div className="relative w-full aspect-4/3 bg-[#fbf8f2] rounded border-2 border-dashed border-mcc-maroon/30 overflow-hidden shadow-inner">
              {/* Compass Rose */}
              <div className="absolute top-3 right-3 text-mcc-maroon/40 flex flex-col items-center pointer-events-none select-none">
                <Compass className="w-8 h-8 animate-spin-slow" />
                <span className="text-[9px] font-sans font-bold tracking-widest uppercase">N</span>
              </div>

              {/* Grid Watermarks & Campus Zones */}
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Background Roads / Campus Paths */}
                <path
                  d="M10,35 Q50,30 90,35 M50,10 L50,90 M25,10 Q30,60 30,90 M70,10 Q70,50 80,90"
                  fill="none"
                  stroke="#e2d9c8"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
                {/* Scrub Jungle Reserve Polygon */}
                <path
                  d="M45,55 Q75,50 90,65 L88,92 L42,90 Z"
                  fill="#edf4eb"
                  stroke="#c5dbc0"
                  strokeWidth="0.8"
                />
                <text x="60" y="78" fill="#4a7c43" fontSize="3" fontStyle="italic" opacity="0.7">
                  Scrub Jungle Sanctuary
                </text>
                <text x="35" y="20" fill="#884242" fontSize="3" fontStyle="italic" opacity="0.6">
                  Anderson Quadrangle
                </text>
                <text x="18" y="86" fill="#1b365d" fontSize="3" fontStyle="italic" opacity="0.6">
                  Anderson Athletic Grounds
                </text>
              </svg>

              {/* Landmark Pins */}
              {LANDMARKS.map((landmark) => {
                const isSelected = landmark.id === selectedId;
                const isMatchFilter =
                  filterCategory === 'all' || landmark.category === filterCategory;

                return (
                  <button
                    key={landmark.id}
                    type="button"
                    onClick={() => setSelectedId(landmark.id)}
                    style={{
                      left: `${landmark.coords.x}%`,
                      top: `${landmark.coords.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10 flex flex-col items-center group cursor-pointer ${
                      isMatchFilter ? 'opacity-100' : 'opacity-30'
                    }`}
                    title={landmark.name}
                  >
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition-transform ${
                        isSelected
                          ? 'bg-mcc-maroon text-white border-mcc-gold scale-125 ring-2 ring-mcc-gold/60'
                          : 'bg-white text-mcc-navy border-mcc-maroon group-hover:scale-110'
                      }`}
                    >
                      {landmark.number}
                    </span>
                    <span
                      className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-2xs mt-1 whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'bg-mcc-navy text-white'
                          : 'bg-white/90 text-gray-800 border border-gray-200 group-hover:bg-white'
                      }`}
                    >
                      {landmark.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-500 italic mt-3 text-center">
              Click any numbered cartographic marker above or select from the registry below to reveal archival records.
            </p>
          </div>

          {/* Landmark Registry Cards List */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans uppercase tracking-wider font-bold text-gray-600 px-1">
              Collegiate Annals Registry ({filteredLandmarks.length} Locations)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredLandmarks.map((lm) => {
                const isSelected = lm.id === selectedId;
                return (
                  <div
                    key={lm.id}
                    onClick={() => setSelectedId(lm.id)}
                    className={`p-2.5 rounded-md border text-left cursor-pointer transition-all flex items-center gap-3 max-w-full overflow-hidden ${
                      isSelected
                        ? 'bg-[#fbfaf8] border-mcc-maroon shadow-sm ring-1 ring-mcc-maroon'
                        : 'bg-white/90 border-gray-200 hover:border-mcc-maroon/40 hover:bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 shrink-0 rounded overflow-hidden p-0.5 bg-white border border-gray-200 ring-1 ring-mcc-gold/20">
                      <img
                        src={lm.image}
                        alt={lm.name}
                        className="w-full h-full object-cover rounded-xs"
                        onError={(e) => {
                          e.currentTarget.src = '/images/campus/mcc-main-facade.jpg';
                        }}
                      />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-mcc-maroon text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {lm.number}
                        </span>
                        <h5 className="font-bold text-xs sm:text-sm text-mcc-navy truncate">
                          {lm.name}
                        </h5>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 font-sans line-clamp-1">
                        Est. {lm.established} • {lm.zone}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED LANDMARK DOSSIER CARD (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-6">
          <article className="bg-white rounded-lg border-2 border-mcc-maroon/20 shadow-md overflow-hidden font-serif animate-in fade-in duration-200">
            {/* Dossier Header Header */}
            <div className="bg-mcc-maroon text-white p-5 border-b border-mcc-gold/30">
              <div className="flex items-center justify-between text-xs text-mcc-gold font-sans font-bold uppercase tracking-widest mb-1">
                <span>Landmark Dossier #{selectedLandmark.number}</span>
                <span>Est. {selectedLandmark.established}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                {selectedLandmark.name}
              </h2>
              <p className="text-xs text-mcc-gold/90 font-serif italic pt-1">
                {selectedLandmark.tagline}
              </p>
            </div>

            {/* Architectural Illustration Image */}
            <div className="p-1.5 bg-[#fbfaf8] border-b border-gray-300 shadow-sm ring-1 ring-mcc-gold/30 max-w-full overflow-hidden">
              <div className="relative aspect-16/9 overflow-hidden bg-gray-100 rounded-xs">
                <img
                  src={selectedLandmark.image}
                  alt={selectedLandmark.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/images/campus/mcc-main-facade.jpg';
                  }}
                />
                <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-sans px-2 py-0.5 rounded backdrop-blur-xs">
                  {selectedLandmark.zone}
                </span>
                <span className="absolute top-2 left-2 bg-mcc-maroon/90 text-mcc-gold text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-xs border border-mcc-gold/40">
                  Authentic Campus Archive
                </span>
              </div>
            </div>

            {/* Architectural Specs Table */}
            <div className="p-6 space-y-5">
              <div className="space-y-2 pb-4 border-b border-gray-200 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span className="font-sans font-bold uppercase text-[10px] tracking-wider text-gray-500">
                    Architectural Style
                  </span>
                  <span className="font-serif italic text-mcc-navy font-semibold text-right">
                    {selectedLandmark.architecturalStyle}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="font-sans font-bold uppercase text-[10px] tracking-wider text-gray-500">
                    Campus Zone
                  </span>
                  <span className="font-serif text-gray-800 text-right">
                    {selectedLandmark.zone}
                  </span>
                </div>
              </div>

              {/* Historical Narrative */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-sans font-bold tracking-wider text-mcc-maroon flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-mcc-gold" />
                  <span>Historical Record & Collegiate Lore</span>
                </h4>
                <p className="text-sm text-gray-800 leading-relaxed font-serif">
                  {selectedLandmark.history}
                </p>
              </div>

              {/* Key Features List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs uppercase font-sans font-bold tracking-wider text-mcc-navy flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-mcc-gold" />
                  <span>Distinguished Hallmarks</span>
                </h4>
                <ul className="text-xs space-y-1.5 font-serif text-gray-700">
                  {selectedLandmark.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-mcc-gold font-bold">▪</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Archival Taxonomy Tags */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <span className="text-[11px] font-sans font-bold text-gray-500 uppercase tracking-wider block">
                  Related Gazette Archives
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedLandmark.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/tag/${t}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-mcc-maroon/5 hover:bg-mcc-maroon hover:text-white border border-mcc-maroon/20 text-mcc-maroon text-xs transition-colors"
                    >
                      <Tag className="w-3 h-3 text-mcc-gold" />
                      <span>#{t}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
