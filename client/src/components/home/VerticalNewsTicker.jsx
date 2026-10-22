import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Clock, Newspaper, ArrowRight } from 'lucide-react';

/**
 * Helper to format relative or short publication time.
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

/**
 * VerticalNewsTicker Component
 * - Displays 3 compact news items simultaneously in a vertical track.
 * - Auto-scrolls upward by 1 item every 3.5s with infinite seamless looping.
 * - Pauses on hover, includes manual step arrows (▲ / ▼), and clean empty state.
 */
export default function VerticalNewsTicker({ articles = [] }) {
  // Take latest 5 to 7 dispatches
  const feedArticles = articles && articles.length > 0 ? articles.slice(0, 7) : [];
  const N = feedArticles.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // When N > 3, append the first 3 items for infinite seamless rolling
  const displayList = N > 3 ? [...feedArticles, ...feedArticles.slice(0, 3)] : feedArticles;
  const totalSlots = displayList.length;

  // Auto-scroll every 3.5s
  useEffect(() => {
    if (isPaused || N <= 3) return;

    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, N]);

  // Infinite seamless reset when reaching N
  const handleTransitionEnd = () => {
    if (currentIndex >= N) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  // Manual step down (next)
  const handleNext = () => {
    if (N <= 3) return;
    if (currentIndex >= N) {
      setIsTransitioning(false);
      setCurrentIndex(0);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex(1);
      }, 20);
    } else {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Manual step up (prev)
  const handlePrev = () => {
    if (N <= 3) return;
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(N);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex(N - 1);
      }, 20);
    } else {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] flex flex-col bg-[#FAF8F5] border border-[#C5A059]/40 rounded-lg p-3 sm:p-4 shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Live Dispatches Rolling Feed"
    >
      {/* 1. COMPACT HEADER BAR WITH LIVE PULSE & CONTROLS */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#C5A059]/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xs sm:text-sm font-bold tracking-wider text-[#0F2537] uppercase">
            Latest Dispatches
          </span>
          {/* Pulsating LIVE Badge */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-sans font-bold border border-red-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            LIVE
          </span>
        </div>

        {/* Manual Step Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Dispatch"
            className="p-1 rounded text-[#0F2537] hover:text-[#7B1113] hover:bg-[#C5A059]/20 transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Dispatch"
            className="p-1 rounded text-[#0F2537] hover:text-[#7B1113] hover:bg-[#C5A059]/20 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. TICKER BODY: EMPTY STATE OR VERTICAL SLIDING TRACK */}
      {N === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white/70 rounded-md border border-dashed border-[#C5A059]/40 my-2">
          <div className="w-10 h-10 rounded-full bg-[#7B1113]/10 text-[#7B1113] flex items-center justify-center mb-2.5">
            <Newspaper className="w-5 h-5 text-[#7B1113]" />
          </div>
          <h4 className="font-serif text-sm sm:text-base font-bold text-[#0F2537]">
            No Dispatches Published Yet
          </h4>
          <p className="text-xs font-serif text-gray-600 mt-1.5 max-w-xs leading-relaxed">
            Department correspondents and editorial desks will post official bulletins here once published.
          </p>
        </div>
      ) : N <= 3 ? (
        /* Static 1 to 3 items */
        <div className="flex-1 flex flex-col justify-between gap-2 overflow-hidden py-1">
          {feedArticles.map((article) => {
            const catLabel = article.category_name || article.category || 'Dispatch';
            const timeAgo = formatRelativeTime(article.published_at || article.created_at);

            return (
              <div key={article.id} className="flex-1 flex flex-col min-h-0">
                <Link
                  to={`/article/${article.slug}`}
                  className="h-full bg-white hover:bg-[#FAF8F5] border border-gray-200 hover:border-[#C5A059] p-2.5 sm:p-3 rounded-md transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-sans mb-1">
                      <span className="px-1.5 py-0.5 bg-[#7B1113]/10 text-[#7B1113] font-bold uppercase tracking-wider rounded">
                        {catLabel}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C5A059]" />
                        {timeAgo}
                      </span>
                    </div>

                    <h4 className="font-serif text-xs sm:text-sm font-bold text-[#0F2537] group-hover:text-[#7B1113] transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-sans mt-1.5 pt-1.5 border-t border-gray-100">
                    <span className="truncate max-w-[130px] text-gray-600">
                      By {article.author_name || 'MCC Desk'}
                    </span>
                    <span className="text-[#7B1113] font-semibold flex items-center gap-0.5 group-hover:underline">
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dynamic 3-card Viewport with Continuous Vertical Translation */
        <div className="flex-1 relative overflow-hidden w-full">
          <div
            className="absolute inset-x-0 top-0 flex flex-col"
            style={{
              height: `${(totalSlots / 3) * 100}%`,
              transform: `translateY(-${currentIndex * (100 / totalSlots)}%)`,
              transition: isTransitioning
                ? 'transform 550ms cubic-bezier(0.25, 1, 0.5, 1)'
                : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayList.map((article, idx) => {
              const catLabel = article.category_name || article.category || 'Dispatch';
              const timeAgo = formatRelativeTime(article.published_at || article.created_at);

              return (
                <div
                  key={`${article.id}-${idx}`}
                  className="py-1"
                  style={{
                    height: `${100 / totalSlots}%`,
                    boxSizing: 'border-box',
                  }}
                >
                  <Link
                    to={`/article/${article.slug}`}
                    className="h-full bg-white hover:bg-[#FAF8F5] border border-gray-200 hover:border-[#C5A059] p-2.5 sm:p-3 rounded-md transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      {/* Category & Timestamp */}
                      <div className="flex items-center justify-between text-[10px] font-sans mb-1">
                        <span className="px-1.5 py-0.5 bg-[#7B1113]/10 text-[#7B1113] font-bold uppercase tracking-wider rounded">
                          {catLabel}
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C5A059]" />
                          {timeAgo}
                        </span>
                      </div>

                      {/* Headline (2-line clamp) */}
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#0F2537] group-hover:text-[#7B1113] transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                    </div>

                    {/* Byline & Read Link */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-sans mt-1.5 pt-1.5 border-t border-gray-100">
                      <span className="truncate max-w-[130px] text-gray-600">
                        By {article.author_name || 'MCC Desk'}
                      </span>
                      <span className="text-[#7B1113] font-semibold flex items-center gap-0.5 group-hover:underline">
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
