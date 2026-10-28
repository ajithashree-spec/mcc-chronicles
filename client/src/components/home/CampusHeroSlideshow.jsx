import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowRight,
  User,
  Sparkles,
  Newspaper,
} from 'lucide-react';
import { usePageSettings } from '../../context/PageSettingsContext';

/**
 * Normalizes cover image URLs to support both external and local server uploads.
 */
function getMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('/images/') || url.startsWith('/assets/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiBase =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Format timestamp into readable collegiate date string.
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
 * Authentic collegiate broadsheet byline.
 */
function formatByline(authorName, departmentName) {
  if (!authorName) {
    return departmentName ? `${departmentName} Desk` : 'Editorial Bureau';
  }
  const clean = String(authorName).trim();
  const lower = clean.toLowerCase();
  if (lower.includes('root') || lower === 'admin' || lower === 'administrator') {
    return departmentName ? `${departmentName} Desk` : 'Editorial Bureau';
  }
  return clean;
}

/**
 * Dynamic Article Hero Slideshow
 * - 100% dynamic display of the cover images, headings, and subheadings of recent articles.
 * - Strictly zero static campus architectural photos.
 * - Provides an immediate "glance into the news" with headline, subheading summary, category, date, and author.
 * - Direct routing to the full article on click.
 */
export default function CampusHeroSlideshow({
  articles = [],
  customSlides = null,
  speedMs = null,
}) {
  const navigate = useNavigate();
  const { settings } = usePageSettings();

  // Assemble dynamic queue strictly from recent articles
  const slides = useMemo(() => {
    // 1. If Superadmin provided curated custom slides with articles, use those
    const curated = customSlides || settings.slideshow_custom_slides;
    if (Array.isArray(curated) && curated.length > 0) {
      return curated.map((s, idx) => ({
        id: s.id || `custom-${idx}`,
        title: s.title,
        subheading: s.caption || s.subheading || s.summary || '',
        image: s.image,
        category: s.category || 'CAMPUS DISPATCH',
        author: s.author || 'Editorial Bureau',
        date: s.date || null,
        slug: s.slug || null,
        link: s.link || (s.slug ? `/article/${s.slug}` : null),
        is_breaking: Boolean(s.is_breaking),
      }));
    }

    // 2. Otherwise, extract recent published articles (up to 6 latest)
    const validArticles = (articles || []).filter(
      (a) => a && a.title && typeof a.title === 'string' && a.title.trim() !== ''
    );

    if (validArticles.length === 0) {
      return [];
    }

    // Take top 6 recent articles
    return validArticles.slice(0, 6).map((art, idx) => ({
      id: art.id || `art-${idx}`,
      title: art.title,
      subheading:
        art.summary ||
        art.subheading ||
        art.excerpt ||
        'Read the verified dispatch from the Madras Christian College broadsheet press.',
      image: art.cover_image || null,
      category: art.category_name || art.department_name || 'CAMPUS NEWS',
      author: formatByline(art.author_name, art.department_name),
      date: art.published_at || art.created_at,
      slug: art.slug,
      link: art.slug ? `/article/${art.slug}` : '/',
      is_breaking: Boolean(art.is_breaking),
    }));
  }, [articles, customSlides, settings.slideshow_custom_slides]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Keep active index in bounds if slides change
  useEffect(() => {
    if (slides.length > 0 && activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  // Auto-slide transition delay (pauses on hover)
  const transitionSpeed = Number(speedMs) || Number(settings.slideshow_speed_ms) || 4500;
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, transitionSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length, transitionSpeed]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[activeIndex] || slides[0];

  const handleClickSlide = () => {
    if (currentSlide?.link) {
      if (currentSlide.link.startsWith('http://') || currentSlide.link.startsWith('https://')) {
        window.open(currentSlide.link, '_blank');
      } else {
        navigate(currentSlide.link);
      }
    } else if (currentSlide?.slug) {
      navigate(`/article/${currentSlide.slug}`);
    }
  };

  // If no articles exist at all, show an authentic empty newsroom state (NO static campus photos)
  if (!slides || slides.length === 0) {
    return (
      <div className="relative w-full h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] rounded-lg overflow-hidden border border-[#C5A059]/40 shadow-sm bg-radial from-[#19354d] to-[#0A1926] p-8 flex flex-col justify-center items-center text-center text-white select-none">
        <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center justify-center mb-4 text-[#C5A059]">
          <Newspaper className="w-8 h-8" />
        </div>
        <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C5A059] block">
          Madras Christian College Broadsheet Desk
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1 max-w-lg leading-snug">
          Today&apos;s News Dispatches Are Being Prepared
        </h3>
        <p className="text-xs sm:text-sm font-serif text-gray-300 mt-2 max-w-md leading-relaxed">
          The editorial bureau is currently assembling front page coverage across our 38 department desks. Verified articles with cover photography will appear here automatically upon publication.
        </p>
      </div>
    );
  }

  const imageUrl = currentSlide?.image ? getMediaUrl(currentSlide.image) : null;

  return (
    <div
      onClick={handleClickSlide}
      className="relative w-full h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] aspect-[16/10] sm:aspect-[16/10] lg:aspect-auto rounded-lg overflow-hidden border border-[#C5A059]/40 shadow-sm bg-[#0F2537] group select-none flex flex-col cursor-pointer"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Recent Articles Hero Slideshow"
    >
      {/* 1. TOP DISPATCH & CATEGORY BADGES */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
        {currentSlide.is_breaking ? (
          <span className="px-2.5 py-1 bg-[#581A20] text-white text-[10px] sm:text-xs font-serif uppercase tracking-widest font-bold rounded shadow-md border border-[#C5A059]/50 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            BREAKING DISPATCH
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-[#581A20]/95 text-white text-[10px] sm:text-xs font-serif uppercase tracking-widest font-bold rounded shadow-md border border-[#C5A059]/40 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            RECENT DISPATCH
          </span>
        )}

        <span className="px-2.5 py-1 bg-[#0F2537]/90 text-[#C5A059] text-[10px] sm:text-xs font-serif uppercase tracking-wider font-bold rounded border border-white/10 backdrop-blur-xs">
          {currentSlide.category}
        </span>
      </div>

      {/* 2. DYNAMIC COVER IMAGES STACK */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#0A1926]">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const slideImg = slide.image ? getMediaUrl(slide.image) : null;

          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {slideImg ? (
                <img
                  src={slideImg}
                  alt={slide.title}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-102 transition-transform duration-1000"
                />
              ) : (
                /* Editorial backdrop if article cover is unavailable */
                <div className="w-full h-full bg-radial from-[#1b3d5b] via-[#0F2537] to-[#08131d] flex items-center justify-center p-8">
                  <img
                    src="/assets/mcc-crest.png"
                    alt=""
                    className="w-32 h-32 object-contain opacity-20 filter grayscale brightness-200"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. LOWER GRADIENT CAPTION OVERLAY: A GLANCE INTO THE NEWS */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-5 px-5 sm:px-6 text-white flex flex-col justify-end pointer-events-none">
        {/* Metadata row: Category, Date, Author */}
        <div className="flex items-center gap-3 mb-2 flex-wrap text-xs font-serif">
          <span className="px-2 py-0.5 bg-[#C5A059] text-[#0F2537] text-[10px] font-sans font-bold uppercase tracking-wider rounded">
            {currentSlide.category}
          </span>

          {currentSlide.date && (
            <span className="text-[11px] text-gray-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#C5A059]" />
              {formatDate(currentSlide.date)}
            </span>
          )}

          {currentSlide.author && (
            <span className="text-[11px] text-gray-300 hidden sm:flex items-center gap-1">
              <User className="w-3 h-3 text-[#C5A059]" />
              By {currentSlide.author}
            </span>
          )}

          <span className="text-[11px] font-serif text-[#C5A059] font-semibold ml-auto hidden sm:inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Read Full Dispatch <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Heading (Title) */}
        <h2 className="font-serif font-black text-lg sm:text-xl lg:text-2xl text-white tracking-tight leading-snug drop-shadow-md line-clamp-2 max-w-3xl group-hover:text-[#C5A059] transition-colors">
          {currentSlide.title}
        </h2>

        {/* Subheading (Glance into the news) */}
        {currentSlide.subheading && (
          <p className="text-xs sm:text-sm font-serif text-gray-200 mt-1.5 line-clamp-2 max-w-2xl leading-relaxed drop-shadow-sm font-normal">
            {currentSlide.subheading}
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
        aria-label="Previous Recent Story"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-[#581A20] text-white border border-[#C5A059]/60 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer focus:opacity-100"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        aria-label="Next Recent Story"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-[#581A20] text-white border border-[#C5A059]/60 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer focus:opacity-100"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* 5. SLIDE INDICATOR BAR */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs border border-white/10">
        {slides.map((_, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(dotIdx);
            }}
            aria-label={`Jump to recent dispatch ${dotIdx + 1}`}
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
