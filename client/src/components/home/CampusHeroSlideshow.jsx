import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  Calendar,
  ArrowRight,
} from 'lucide-react';

const DEFAULT_CAMPUS_SLIDES = [
  {
    type: 'campus',
    image: '/images/campus/mcc-main-facade.jpg',
    src: '/images/campus/mcc-main-facade.jpg',
    title: 'Historic Main Quadrangle & Anderson Clock Tower',
    caption: 'The architectural heart and liberal arts heritage of Madras Christian College since 1837.',
    category: 'TAMBARAM SANCTUARY',
    tag: 'COLLEGIATE FRONTISPIECE • TAMBARAM ESTATE',
  },
  {
    type: 'campus',
    image: '/images/campus/mcc-hall-heritage.jpg',
    src: '/images/campus/mcc-hall-heritage.jpg',
    title: 'Collegiate Halls of Residence & Living Heritage',
    caption: 'Centuries of student camaraderie, hall governance, and collegiate fellowship.',
    category: 'RESIDENTIAL HERITAGE',
    tag: 'COLLEGIATE FRONTISPIECE • TAMBARAM ESTATE',
  },
  {
    type: 'campus',
    image: '/images/campus/mcc-scrub-jungle.jpg',
    src: '/images/campus/mcc-scrub-jungle.jpg',
    title: '365-Acre Scrub Jungle & Natural Flora Canopy',
    caption: 'Pristine biodiversity, deer trails, and protected bird sanctuaries in Tambaram.',
    category: 'ECOLOGICAL RESERVE',
    tag: 'COLLEGIATE FRONTISPIECE • TAMBARAM ESTATE',
  },
  {
    type: 'campus',
    image: '/images/campus/mcc-campus-life.jpg',
    src: '/images/campus/mcc-campus-life.jpg',
    title: 'Miller Memorial Quad & Student Pathways',
    caption: 'Scholarly life, vibrant assemblies, and academic pursuits under the scrub jungle trees.',
    category: 'CAMPUS PATHWAYS',
    tag: 'COLLEGIATE FRONTISPIECE • TAMBARAM ESTATE',
  },
];

/**
 * Normalizes cover image URLs to support both external and local server uploads.
 */
function getMediaUrl(url) {
  if (!url) return '/images/campus/mcc-main-facade.jpg';
  if (url.startsWith('/images/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiBase =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Format timestamp into readable date string.
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * CampusHeroSlideshow Component
 * - 80% latest published news articles with uploaded cover images.
 * - 20% authentic campus architecture and heritage photographs.
 * - Dynamic overlays, category badges, headline bar, and direct article routing.
 * - Auto-transitions every 4.5 seconds with 1000ms cross-fade.
 */
export default function CampusHeroSlideshow({ articles = [], images = null }) {
  const navigate = useNavigate();

  // Assemble dynamic queue with 80% news and 20% campus photos
  const slides = useMemo(() => {
    if (images && images.length > 0) return images;

    const validNews = (articles || []).filter(
      (a) => a && a.cover_image && typeof a.cover_image === 'string' && a.cover_image.trim() !== ''
    );

    // If no news articles with images exist, fall back 100% to campus heritage photos
    if (validNews.length === 0) {
      return DEFAULT_CAMPUS_SLIDES;
    }

    const newsSlides = validNews.slice(0, 5).map((a) => ({
      type: 'news',
      image: a.cover_image,
      src: a.cover_image,
      title: a.title,
      caption: a.summary || 'Click to read full dispatch from the Madras Christian College Gazette.',
      category: a.category_name || a.department_name || 'CAMPUS DISPATCH',
      slug: a.slug,
      tag: 'LATEST DISPATCH',
      published_at: a.published_at || a.created_at,
    }));

    const queue = [];

    // When 1 to 4 unique news slides exist, cycle them across 4 news slots (80%) + 1 campus photo (20%)
    if (newsSlides.length < 5) {
      for (let i = 0; i < 4; i++) {
        const item = newsSlides[i % newsSlides.length];
        queue.push({
          ...item,
          slideKey: `news-${i}-${item.slug || 'art'}`,
        });
      }
      queue.push({
        ...DEFAULT_CAMPUS_SLIDES[0],
        slideKey: 'campus-0',
      });
      return queue;
    }

    // When 5 news slides exist, construct two 80/20 cycles (4 news + 1 campus each)
    for (let i = 0; i < 4; i++) {
      queue.push({
        ...newsSlides[i],
        slideKey: `news-${i}-${newsSlides[i].slug}`,
      });
    }
    queue.push({
      ...DEFAULT_CAMPUS_SLIDES[0],
      slideKey: 'campus-0',
    });

    for (let i = 0; i < 4; i++) {
      const idx = (4 + i) % newsSlides.length;
      queue.push({
        ...newsSlides[idx],
        slideKey: `news-${4 + i}-${newsSlides[idx].slug}`,
      });
    }
    queue.push({
      ...DEFAULT_CAMPUS_SLIDES[1 % DEFAULT_CAMPUS_SLIDES.length],
      slideKey: 'campus-1',
    });

    return queue;
  }, [articles, images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Keep active index in bounds if queue length changes
  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  // Auto-slide transition every 4.5s (pauses on hover)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[activeIndex] || slides[0];
  const isNews = currentSlide?.type === 'news';

  const handleClickSlide = () => {
    if (isNews && currentSlide?.slug) {
      navigate(`/article/${currentSlide.slug}`);
    }
  };

  return (
    <div
      onClick={handleClickSlide}
      className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] aspect-[16/10] sm:aspect-[16/10] lg:aspect-auto rounded-lg overflow-hidden border border-[#C5A059]/40 shadow-sm bg-[#0F2537] group select-none flex flex-col ${
        isNews ? 'cursor-pointer' : 'cursor-default'
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Campus Photographic Slideshow"
    >
      {/* 1. TOP INSTITUTIONAL / DISPATCH BADGES */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
        {isNews ? (
          <>
            <span className="px-2.5 py-1 bg-[#7B1113]/95 text-[#FAF8F5] text-[10px] sm:text-xs font-serif uppercase tracking-widest font-bold rounded shadow-md border border-[#C5A059]/40 backdrop-blur-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
              {currentSlide?.tag || 'LATEST DISPATCH'}
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 bg-[#0F2537]/85 text-[#C5A059] text-[10px] sm:text-xs font-serif uppercase tracking-wider font-bold rounded backdrop-blur-xs border border-white/10">
              {currentSlide?.category || 'Gazette Dispatch'}
            </span>
          </>
        ) : (
          <>
            <span className="px-2.5 py-1 bg-[#0F2537]/90 text-[#C5A059] text-[10px] sm:text-xs font-serif uppercase tracking-widest font-bold rounded shadow-md border border-[#C5A059]/30 backdrop-blur-xs flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
              {currentSlide?.tag || 'COLLEGIATE FRONTISPIECE • TAMBARAM ESTATE'}
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 bg-black/60 text-[#FAF8F5] text-[10px] sm:text-xs font-mono rounded backdrop-blur-xs border border-white/10">
              Tambaram Estate &bull; Est. 1837
            </span>
          </>
        )}
      </div>

      {/* 2. CROSS-FADING SLIDES STACK */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const imageUrl = getMediaUrl(slide.image || slide.src);
          return (
            <div
              key={slide.slideKey || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={imageUrl}
                alt={slide.title}
                loading={idx === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/campus/mcc-main-facade.jpg';
                }}
                className="w-full h-full object-cover transform scale-100 group-hover:scale-102 transition-transform duration-1000"
              />
            </div>
          );
        })}
      </div>

      {/* 3. LOWER GRADIENT CAPTION OVERLAY */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 sm:p-5 text-white flex flex-col justify-end pointer-events-none">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="px-2 py-0.5 bg-[#C5A059] text-[#0F2537] text-[10px] font-sans font-bold uppercase tracking-wider rounded">
            {currentSlide?.category || (isNews ? 'CAMPUS DISPATCH' : 'TAMBARAM SANCTUARY')}
          </span>
          {isNews && currentSlide?.published_at ? (
            <span className="text-[10px] font-serif text-gray-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 inline text-[#C5A059]" />
              {formatDate(currentSlide.published_at)}
            </span>
          ) : (
            <span className="text-[10px] font-serif text-[#C5A059]/90 hidden sm:inline flex items-center gap-1">
              <MapPin className="w-3 h-3 inline" /> 365-Acre Sanctuary
            </span>
          )}
          {isNews && (
            <span className="text-[10px] font-serif text-[#C5A059] font-semibold ml-auto hidden sm:inline-flex items-center gap-1">
              Read Dispatch <ArrowRight className="w-3 h-3 inline" />
            </span>
          )}
        </div>

        <h3 className="font-serif font-bold text-base sm:text-xl lg:text-2xl text-white tracking-wide drop-shadow-sm leading-snug line-clamp-2 max-w-2xl group-hover:text-[#C5A059] transition-colors">
          {currentSlide?.title}
        </h3>

        {currentSlide?.caption && (
          <p className="text-xs sm:text-sm font-serif italic text-gray-300 mt-1 line-clamp-1 max-w-xl">
            {currentSlide.caption}
          </p>
        )}
      </div>

      {/* 4. MANUAL CHEVRON NAVIGATION ARROWS (Fade in on hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        aria-label="Previous Slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-[#7B1113] text-white border border-[#C5A059]/60 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer focus:opacity-100 focus:outline-hidden"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        aria-label="Next Slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-[#7B1113] text-white border border-[#C5A059]/60 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer focus:opacity-100 focus:outline-hidden"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* 5. CENTERED DOT PAGINATION INDICATORS */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs border border-white/10">
        {slides.map((s, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(dotIdx);
            }}
            aria-label={`Go to slide ${dotIdx + 1} (${s.type === 'news' ? 'News Dispatch' : 'Collegiate Heritage'})`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              dotIdx === activeIndex
                ? 'w-6 h-1.5 bg-[#C5A059]'
                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
