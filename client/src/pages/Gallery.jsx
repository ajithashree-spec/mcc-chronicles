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
  { label: 'DeepWoods 2026', value: 'DeepWoods' },
  { label: 'Centenary Convocation', value: 'Convocation' },
  { label: 'Sports Day', value: 'Sports' },
  { label: 'Scrub Jungle & Flora', value: 'Flora' },
  { label: 'Hall Life', value: 'Hall Life' },
];

const FALLBACK_GALLERY_PHOTOS = [
  {
    id: 'gal-1',
    title: 'Historic Anderson Quadrangle & Tower at Dusk',
    caption: 'The colonial architectural silhouette of Madras Christian College bathed in twilight golden hour.',
    image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
    event_name: 'Campus Heritage',
    department_name: 'Archives',
  },
  {
    id: 'gal-2',
    title: 'DeepWoods Concert Stage Under the Canopy',
    caption: 'Scholars gather at the open-air scrub jungle amphitheatre for the annual music festival.',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
    event_name: 'DeepWoods 2026',
    department_name: 'Cultural Committee',
  },
  {
    id: 'gal-3',
    title: 'Native Flora in the 365-Acre Scrub Jungle',
    caption: 'Longitudinal botanical survey documenting rare monsoon orchids and indigenous flora.',
    image_url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200',
    event_name: 'Scrub Jungle & Flora',
    department_name: 'Botany',
  },
  {
    id: 'gal-4',
    title: 'Annual Inter-Hall Cricket Championship',
    caption: 'Intense collegiate sportsmanship as Selaiyur Hall and Bishop Heber Hall compete on the main pitch.',
    image_url: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=1200',
    event_name: 'Sports Day',
    department_name: 'Physical Education',
  },
  {
    id: 'gal-5',
    title: 'Anderson Hall Centennial Academic Convocation',
    caption: 'Faculty procession and graduating scholars assembling in traditional academic regalia.',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
    event_name: 'Centenary Convocation',
    department_name: 'Administration',
  },
  {
    id: 'gal-6',
    title: 'Evening Fellowship in St. Thomas’s Hall Quadrangle',
    caption: 'Scholars engaging in evening discussions and literary debates beneath the tamarind trees.',
    image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200',
    event_name: 'Hall Life',
    department_name: 'Residential Halls',
  },
  {
    id: 'gal-7',
    title: 'Rare Avian Biodiversity in Tambaram Sanctuary',
    caption: 'Resident ornithologists document seasonal migratory waterbirds visiting the collegiate lake.',
    image_url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200',
    event_name: 'Scrub Jungle & Flora',
    department_name: 'Zoology',
  },
  {
    id: 'gal-8',
    title: 'Literary Debate Society Finals in Miller Library',
    caption: 'Scholarly parliamentary arguments in the historic Miller Memorial reading room.',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200',
    event_name: 'Campus Heritage',
    department_name: 'English',
  },
];

/**
 * Normalizes image URLs for local or external media.
 */
function getMediaUrl(url) {
  if (!url) return '';
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
        if (activeFilter && activeFilter !== 'all') {
          params.event_name = activeFilter;
        }

        const res = await articleService.getGalleries(params);
        if (!isMounted) return;

        if (res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          if (list.length > 0) {
            setPhotos(list);
          } else {
            // Filter fallback photos
            let filtered = FALLBACK_GALLERY_PHOTOS;
            if (activeFilter !== 'all') {
              filtered = filtered.filter((p) =>
                p.event_name.toLowerCase().includes(activeFilter.toLowerCase())
              );
            }
            setPhotos(filtered.length > 0 ? filtered : FALLBACK_GALLERY_PHOTOS);
          }
        }
      } catch (err) {
        console.error('Failed to load gallery items:', err);
        if (isMounted) {
          let filtered = FALLBACK_GALLERY_PHOTOS;
          if (activeFilter !== 'all') {
            filtered = filtered.filter((p) =>
              p.event_name.toLowerCase().includes(activeFilter.toLowerCase())
            );
          }
          setPhotos(filtered.length > 0 ? filtered : FALLBACK_GALLERY_PHOTOS);
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
                className="group relative bg-white rounded-md border border-gray-200 hover:border-mcc-maroon/50 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                {/* Image Aspect Box */}
                <div className="relative h-60 overflow-hidden bg-gray-100">
                  <img
                    src={url}
                    alt={item.title || 'Campus Photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
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

                  {/* Event Badge */}
                  {item.event_name && (
                    <div className="absolute top-2.5 left-2.5 group-hover:opacity-0 transition-opacity">
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-serif uppercase tracking-widest rounded">
                        {item.event_name}
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
