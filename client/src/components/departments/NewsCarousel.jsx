import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

/**
 * Normalizes cover image URLs with fallback to campus photography.
 */
function getMediaUrl(url) {
  if (!url || url.includes('unsplash.com')) {
    return '/images/campus/mcc-campus-life.jpg';
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

/**
 * Format ISO date string into readable English format.
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Recent Dispatch';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent Dispatch';
  }
}

/**
 * Calculate approximate reading time in minutes.
 */
function getReadingTime(content, summary) {
  const text = content || summary || '';
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

/**
 * Netflix-Style 3-Card Sliding Carousel for Department News Archives
 * - Responsive: 3 visible on Desktop (lg), 2 on Tablet (md), 1 on Mobile
 * - Floating side navigation arrows with disabled/fade states at boundaries
 * - Smooth cubic-bezier horizontal translation
 */
export default function NewsCarousel({ articles = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Responsive itemsPerPage calculation
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }
    return 3;
  });

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(3);
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const total = articles.length;
  const maxIndex = Math.max(0, total - itemsPerPage);

  // Keep currentIndex bounded if viewport resizes
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, total - itemsPerPage)));
  }, [itemsPerPage, total]);

  if (!articles || articles.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const visibleCount = Math.min(itemsPerPage, total);

  return (
    <section className="mt-10 sm:mt-12 space-y-4">
      {/* SECTION HEADER & COUNTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#C5A059]/30">
        <div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0F2537] uppercase tracking-wide">
            Previous Dispatches & Archives
          </h3>
          <p className="text-xs font-serif text-gray-500 mt-0.5">
            Chronological archive of academic reports, symposiums, and departmental announcements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-sans text-gray-600 font-medium bg-[#FAF8F5] border border-[#C5A059]/40 px-3 py-1 rounded-full shadow-2xs">
            Showing <strong className="text-[#7B1113]">{visibleCount}</strong> of{' '}
            <strong className="text-[#0F2537]">{total}</strong> {total === 1 ? 'Dispatch' : 'Dispatches'}
          </span>
        </div>
      </div>

      {/* CAROUSEL CONTAINER (Relative wrapper with floating arrow buttons) */}
      <div className="relative w-full group">
        {/* VIEWPORT WRAPPER (Prevents outer horizontal overflow) */}
        <div className="relative overflow-hidden w-full py-2">
          {/* INNER TRACK (Translates horizontally with cubic-bezier transition) */}
          <div
            className="flex"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
              transition: 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {articles.map((article) => {
              const coverImg = getMediaUrl(article.cover_image);
              const pubDate = formatDate(article.published_at || article.created_at);
              const readTime = getReadingTime(article.content, article.summary);
              const categoryTag = article.category_name || article.category || 'Dispatch';

              return (
                <div
                  key={article.id}
                  className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-3"
                  style={{ boxSizing: 'border-box' }}
                >
                  <article className="bg-[#FAF8F5] border border-gray-200 hover:border-[#C5A059] rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group/card">
                    {/* Thumbnail: Aspect Ratio 16:10 */}
                    <Link
                      to={`/article/${article.slug}`}
                      className="block relative aspect-[16/10] w-full overflow-hidden bg-gray-100"
                    >
                      <img
                        src={coverImg}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                      {/* Subtle Category Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 bg-[#0F2537]/85 backdrop-blur-xs text-[#FAF8F5] text-[10px] font-sans font-bold uppercase tracking-wider rounded border border-[#C5A059]/30 shadow-xs">
                          {categoryTag}
                        </span>
                      </div>
                    </Link>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Date & Read Time */}
                        <div className="flex items-center gap-2 text-[11px] font-sans text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#C5A059]" />
                            {pubDate}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readTime}
                          </span>
                        </div>

                        {/* Title: 2-line clamp */}
                        <h4 className="font-serif text-base sm:text-lg font-bold text-[#0F2537] group-hover/card:text-[#7B1113] transition-colors line-clamp-2 leading-snug">
                          <Link to={`/article/${article.slug}`}>{article.title}</Link>
                        </h4>

                        {/* Excerpt: 2-line clamp */}
                        <p className="text-gray-600 text-xs sm:text-sm font-sans line-clamp-2 leading-relaxed">
                          {article.summary ||
                            (article.content ? article.content.substring(0, 140) + '...' : '')}
                        </p>
                      </div>

                      {/* Card Footer: Byline & Read More */}
                      <div className="pt-3 mt-4 border-t border-[#C5A059]/20 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-sans text-gray-500 truncate max-w-[130px]">
                          By {article.author_name || 'MCC Desk'}
                        </span>

                        <Link
                          to={`/article/${article.slug}`}
                          className="inline-flex items-center gap-1 text-[#7B1113] hover:text-[#581A20] font-sans font-bold uppercase tracking-wider text-[11px] group/btn transition-colors"
                        >
                          <span>Read More</span>
                          <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* FLOATING NAVIGATION ARROWS (Netflix-style) */}
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous Dispatches"
          className="absolute top-1/2 -translate-y-1/2 left-1 sm:-left-3 z-20 bg-[#0F2537]/90 hover:bg-[#7B1113] text-white border border-[#C5A059] p-2.5 rounded-full shadow-xl transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          aria-label="Next Dispatches"
          className="absolute top-1/2 -translate-y-1/2 right-1 sm:-right-3 z-20 bg-[#0F2537]/90 hover:bg-[#7B1113] text-white border border-[#C5A059] p-2.5 rounded-full shadow-xl transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </section>
  );
}
