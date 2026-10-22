import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sparkles, Compass, ArrowRight, Eye } from 'lucide-react';

const TRIPTYCH_VIGNETTES = [
  {
    id: 'facade',
    category: 'Architectural Heritage',
    title: 'Iconic Red-Brick Quadrangle & Clock Tower',
    location: 'Anderson Quadrangle & Main Block',
    caption:
      'Relocated from George Town in 1937, the stately red-brick corridors harmonize colonial Scottish and Dravidian vernacular architecture.',
    image: '/images/campus/mcc-main-facade.jpg',
    year: 'Est. 1937',
    link: '/map',
  },
  {
    id: 'sanctuary',
    category: 'The Natural Sanctuary',
    title: 'The 365-Acre Scrub Jungle Flora & Fauna',
    location: 'Tambaram Scrub Woodland',
    caption:
      'Home to roaming spotted deer, indigenous butterflies, and over two hundred native medicinal taxa preserved in a pristine ecological sanctuary.',
    image: '/images/campus/mcc-scrub-jungle.jpg',
    year: 'Conservation Area',
    link: '/map',
  },
  {
    id: 'halls',
    category: 'Hall Traditions & Campus Lore',
    title: 'Residential Halls & Collegiate Fellowship',
    location: 'Heber, Selaiyur & St. Thomas’s Halls',
    caption:
      'Centuries of collegiate camaraderie, inter-hall forensic debate tournaments, and enduring fraternal traditions forged in hall fellowships.',
    image: '/images/campus/mcc-hall-heritage.jpg',
    year: 'Historic Halls',
    link: '/map',
  },
];

export default function CampusPhotoStrip() {
  return (
    <section className="w-full max-w-full overflow-hidden my-10 py-6 border-y-2 border-mcc-maroon/20 bg-gradient-to-b from-[#fbf9f4] via-[#f7f3ea] to-[#fbf9f4]">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-3 border-b border-mcc-maroon/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-mcc-gold" />
            <span className="text-[11px] font-serif uppercase tracking-widest font-bold text-mcc-maroon">
              Collegiate Pictorial Dispatch
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-gray-950 tracking-tight">
            Vignettes of the 365-Acre Scrub Jungle & Living Heritage
          </h2>
          <p className="text-xs sm:text-sm font-serif italic text-gray-600 max-w-2xl leading-relaxed">
            A pictorial excursion across Madras Christian College&apos;s historic Tambaram sanctuary, capturing living architecture, rich biodiversity, and collegiate lore.
          </p>
        </div>

        <Link
          to="/gallery"
          className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-mcc-navy hover:text-mcc-maroon uppercase tracking-wider shrink-0 transition-colors"
        >
          <span>View Full Photo Gazette</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3-PHOTO VINTAGE BROADSHEET TRIPTYCH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TRIPTYCH_VIGNETTES.map((item, idx) => (
          <div
            key={item.id}
            className="flex flex-col justify-between p-1.5 bg-[#fbfaf8] rounded-xs border border-gray-300 shadow-sm ring-1 ring-mcc-gold/30 group hover:border-mcc-maroon/50 transition-all duration-300 max-w-full overflow-hidden"
          >
            {/* Picture-Frame Outer Border */}
            <div className="relative overflow-hidden aspect-[16/10] rounded-xs border border-mcc-gold/40 bg-[#132238] shadow-inner">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover filter sepia-[0.18] contrast-105 group-hover:sepia-0 group-hover:scale-105 transition-all duration-700 ease-out hd-broadsheet-photo"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/images/campus/mcc-main-facade.jpg';
                }}
              />

              {/* Category Pill Tag */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-mcc-navy/90 text-mcc-gold text-[10px] font-serif uppercase tracking-widest font-bold rounded-xs shadow-xs border border-mcc-gold/30 backdrop-blur-xs">
                {item.category}
              </div>

              {/* Year / Archive Seal */}
              <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 bg-mcc-maroon/90 text-white text-[10px] font-mono font-semibold rounded-xs shadow-xs backdrop-blur-xs">
                {item.year}
              </div>
            </div>

            {/* Micro-Captions & Typography */}
            <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-mcc-maroon block">
                  {item.location}
                </span>
                <h3 className="text-sm sm:text-base font-serif font-bold text-gray-900 leading-snug group-hover:text-mcc-maroon transition-colors">
                  <Link to={item.link}>{item.title}</Link>
                </h3>
                <p className="text-xs font-serif text-gray-600 line-clamp-3 leading-relaxed mt-1">
                  {item.caption}
                </p>
              </div>

              {/* Bottom Rule with Explorer Link */}
              <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px] font-serif">
                <span className="text-gray-400 italic text-[10px]">
                  Plate 0{idx + 1} &bull; Gazette Record
                </span>
                <Link
                  to={item.link}
                  className="text-mcc-maroon font-semibold hover:underline inline-flex items-center gap-1 uppercase tracking-wider text-[10px]"
                >
                  <span>Explore Landmark</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
