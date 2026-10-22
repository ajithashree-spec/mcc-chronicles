import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Camera,
  Maximize2,
  Calendar,
  Filter,
  Tag,
  Building,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import articleService from '../services/articleService';
import LightboxModal from '../components/gallery/LightboxModal';

const EVENT_FILTERS = [
  { label: 'All Photos', value: 'all' },
  { label: 'Campus Heritage & Architecture', value: 'Campus Heritage & Architecture' },
  { label: 'DeepWoods 2026', value: 'DeepWoods' },
  { label: 'Centenary Convocation', value: 'Convocation' },
  { label: 'Sports Day', value: 'Sports' },
  { label: 'Scrub Jungle & Flora', value: 'Flora' },
  { label: 'Hall Life', value: 'Hall Life' },
];

const AUTHENTIC_CAMPUS_HERITAGE_PHOTOS = [
  {
    id: 'heritage-facade-1',
    title: 'Historic Main Quadrangle & Clock Tower Facade',
    caption: 'Iconic Indo-Saracenic red-brick broadsheet architecture of Madras Christian College bathed in warm morning light.',
    image_url: '/images/campus/mcc-main-facade.jpg',
    event_name: 'Campus Heritage & Architecture',
    department_name: 'College Archives & History',
    is_authentic_showcase: true,
  },
  {
    id: 'heritage-jungle-2',
    title: 'The 365-Acre Scrub Jungle Flora & Wildlife Canopy',
    caption: 'Pristine canopy avenue and deer trail paths through the protected Coromandel dry evergreen woodland sanctuary in Tambaram.',
    image_url: '/images/campus/mcc-scrub-jungle.jpg',
    event_name: 'Campus Heritage & Architecture',
    department_name: 'Botany & Reserve',
    is_authentic_showcase: true,
  },
  {
    id: 'heritage-hall-3',
    title: 'Residential Hall Quadrangles & Heritage Chapels',
    caption: 'Sandstone cloisters, open verandahs, and peaceful courtyards of Heber, Selaiyur, St. Thomas’s, and Martin Halls.',
    image_url: '/images/campus/mcc-hall-heritage.jpg',
    event_name: 'Campus Heritage & Architecture',
    department_name: 'Residential Halls & Lore',
    is_authentic_showcase: true,
  },
  {
    id: 'heritage-life-4',
    title: 'Student Walkways, Cloistered Verandahs & Anderson Field',
    caption: 'Shaded student walkways connecting academic departments with the historic Anderson athletic pavilion and greens.',
    image_url: '/images/campus/mcc-campus-life.jpg',
    event_name: 'Campus Heritage & Architecture',
    department_name: 'Student Affairs & Athletics',
    is_authentic_showcase: true,
  },
];

const FALLBACK_GALLERY_PHOTOS = [
  ...AUTHENTIC_CAMPUS_HERITAGE_PHOTOS,
  {
    id: 'gal-5',
    title: 'Heritage Residential Hall Entrance & Crest',
    caption: 'Colonial entrance porch with tiled roofs, official collegiate crest insignia, and surrounding palms.',
    image_url: '/images/campus/mcc-hall-heritage.jpg',
    event_name: 'Hall Life',
    department_name: 'Residential Halls',
  },
  {
    id: 'gal-6',
    title: 'Lush Campus Grounds & Guthridge Tower',
    caption: 'Pristine central lawn and historic academic halls in the heart of the Tambaram estate.',
    image_url: '/images/campus/mcc-main-facade.jpg',
    event_name: 'DeepWoods',
    department_name: 'Cultural Committee',
  },
  {
    id: 'gal-7',
    title: 'Biodiversity Corridors of the Tambaram Reserve',
    caption: 'Paved forest pathway through the tropical dry evergreen woodland sanctuary.',
    image_url: '/images/campus/mcc-scrub-jungle.jpg',
    event_name: 'Scrub Jungle & Flora',
    department_name: 'Botany',
  },
  {
    id: 'gal-8',
    title: 'Collegiate Balustrades & Academic Quarters',
    caption: 'Stately architectural composition channeling coastal breezes through open verandas.',
    image_url: '/images/campus/mcc-campus-life.jpg',
    event_name: 'Sports Day',
    department_name: 'Physical Education',
  },
];

/**
 * Normalizes image URLs for local or external media.
 */
function getMediaUrl(url) {
  if (!url || url.includes('unsplash.com')) {
    return '/images/campus/mcc-main-facade.jpg';
  }
  if (url.startsWith('/images/')) {
    return url;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('event') || 'all';

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function loadGalleryData() {
      setLoading(true);
      try {
        const params = { limit: 50 };
        if (
          activeFilter &&
          activeFilter !== 'all' &&
          activeFilter !== 'Campus Heritage & Architecture'
        ) {
          params.event_name = activeFilter;
        }

        const res = await articleService.getGalleries(params);
        if (!isMounted) return;

        let combined = [];
        const rawList = res.data ? (Array.isArray(res.data) ? res.data : (res.data.data || [])) : [];

        if (activeFilter === 'all') {
          // Feature row 1: 4 authentic photos
          const filteredRaw = rawList.filter(
            (item) => !AUTHENTIC_CAMPUS_HERITAGE_PHOTOS.some((a) => a.image_url === item.image_url)
          );
          combined = [...AUTHENTIC_CAMPUS_HERITAGE_PHOTOS, ...filteredRaw];
        } else if (
          activeFilter === 'Campus Heritage & Architecture' ||
          activeFilter.toLowerCase().includes('heritage')
        ) {
          const apiMatches = rawList.filter(
            (item) =>
              item.event_name?.toLowerCase().includes('heritage') ||
              item.event_name?.toLowerCase().includes('architecture')
          );
          combined = [...AUTHENTIC_CAMPUS_HERITAGE_PHOTOS, ...apiMatches];
        } else {
          if (rawList.length > 0) {
            combined = rawList;
          } else {
            combined = FALLBACK_GALLERY_PHOTOS.filter((p) =>
              p.event_name?.toLowerCase().includes(activeFilter.toLowerCase())
            );
          }
        }

        setPhotos(combined.length > 0 ? combined : AUTHENTIC_CAMPUS_HERITAGE_PHOTOS);
      } catch (err) {
        console.error('Failed to load gallery items:', err);
        if (isMounted) {
          if (
            activeFilter === 'all' ||
            activeFilter === 'Campus Heritage & Architecture' ||
            activeFilter.toLowerCase().includes('heritage')
          ) {
            setPhotos(AUTHENTIC_CAMPUS_HERITAGE_PHOTOS);
          } else {
            const filtered = FALLBACK_GALLERY_PHOTOS.filter((p) =>
              p.event_name?.toLowerCase().includes(activeFilter.toLowerCase())
            );
            setPhotos(filtered.length > 0 ? filtered : AUTHENTIC_CAMPUS_HERITAGE_PHOTOS);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGalleryData();

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  const handleFilterClick = (val) => {
    setSearchParams(val === 'all' ? {} : { event: val });
  };

  const handlePhotoClick = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif text-gray-500 mb-6">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-mcc-maroon font-bold font-serif">Collegiate Media Gallery</span>
      </nav>

      {/* 2. GRAND HEADER */}
      <header className="mb-10 pb-4 border-b-2 border-mcc-maroon flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
            Visual Chronicles & Archival Media
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 uppercase tracking-tight">
            Collegiate Photo Gallery
          </h1>
          <p className="text-sm sm:text-base font-serif italic text-gray-700 mt-2 max-w-2xl leading-relaxed">
            Visual records of Madras Christian College: campus architecture, botanical reserves, DeepWoods lore, athletic meets, and historic convocations.
          </p>
        </div>

        <div className="md:text-right shrink-0">
          <span className="text-xs font-serif uppercase tracking-widest font-bold text-gray-600 block">
            Media Archive Bureau
          </span>
          <span className="text-xs font-sans text-mcc-maroon font-semibold">
            {photos.length} Photographic Records Available
          </span>
        </div>
      </header>

      {/* 3. EVENT FILTER PILLS */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
        <span className="text-xs font-serif font-bold uppercase tracking-wider text-gray-500 mr-2 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-mcc-gold" />
          Filter Series:
        </span>
        {EVENT_FILTERS.map((ef) => (
          <button
            key={ef.value}
            type="button"
            onClick={() => handleFilterClick(ef.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-serif transition-colors border shrink-0 ${
              activeFilter === ef.value
                ? 'bg-mcc-maroon text-white border-mcc-maroon font-semibold shadow-xs'
                : 'bg-white hover:bg-mcc-paper text-gray-700 border-gray-300'
            }`}
          >
            {ef.label}
          </button>
        ))}
      </div>

      {/* 4. MASONRY / MEDIA GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-md border border-gray-200 p-2 space-y-2 animate-pulse">
              <div className="h-56 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white rounded-md border border-dashed border-gray-300 max-w-lg mx-auto">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-gray-800">
            No Archival Photos Under This Series
          </h3>
          <p className="text-xs font-serif text-gray-500 mt-1">
            Our student photojournalists and media desk are archiving additional prints.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleFilterClick('all')}
              className="px-4 py-1.5 bg-mcc-maroon text-white text-xs font-serif font-bold uppercase tracking-wider rounded hover:bg-mcc-maroon-dark transition-colors"
            >
              Show All Photos
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((item, idx) => {
            const url = getMediaUrl(item.image_url);
            return (
              <div
                key={item.id || idx}
                onClick={() => handlePhotoClick(idx)}
                className="group relative p-1.5 bg-[#fbfaf8] rounded-xs border border-gray-300 shadow-sm ring-1 ring-mcc-gold/30 hover:border-mcc-maroon/50 overflow-hidden transition-all cursor-pointer flex flex-col max-w-full"
              >
                {/* Image Aspect Box */}
                <div className="relative h-60 overflow-hidden bg-gray-100 rounded-xs">
                  <img
                    src={url}
                    alt={item.title || 'Campus Photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/images/campus/mcc-main-facade.jpg';
                    }}
                  />

                  {/* Dark Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 text-white">
                    <div className="flex justify-end">
                      <span className="p-1.5 rounded-full bg-black/50 text-white/90">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold font-bold block">
                        Click to Expand Lightbox
                      </span>
                      <p className="text-xs font-serif italic text-white/90 line-clamp-2">
                        {item.caption || item.description || item.title}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 group-hover:opacity-0 transition-opacity">
                    {item.event_name && (
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-serif uppercase tracking-widest rounded-xs">
                        {item.event_name}
                      </span>
                    )}
                  </div>

                  {item.is_authentic_showcase && (
                    <div className="absolute top-2.5 right-2.5 group-hover:opacity-0 transition-opacity">
                      <span className="px-2 py-0.5 bg-mcc-maroon/90 backdrop-blur-xs text-mcc-gold text-[9px] font-serif uppercase tracking-widest font-bold rounded-xs shadow-xs border border-mcc-gold/30">
                        Archival Plate
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Title & Caption */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1">
                  <h4 className="font-serif text-sm font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-sans pt-1 border-t border-gray-100">
                    <span className="truncate max-w-[140px]">
                      {item.department_name || 'Archives'}
                    </span>
                    <span className="text-mcc-maroon font-serif font-semibold">
                      View →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. FULL-SCREEN LIGHTBOX MODAL */}
      <LightboxModal
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onSelectIndex={(newIdx) => setLightboxIndex(newIdx)}
      />
    </div>
  );
}
