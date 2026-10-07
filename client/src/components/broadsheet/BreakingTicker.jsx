import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap, Volume2 } from 'lucide-react';

const DEFAULT_BULLETINS = [
  {
    id: 'b-1',
    text: 'DEEPWOODS 2026: Legendary Woods Stage lineup & festival volunteer enlistment announced.',
    link: '/article/deepwoods-2026-registration-opens',
    category: 'Cultural',
  },
  {
    id: 'b-2',
    text: 'CONTROLLER OF EXAMINATIONS: November 2026 End-Semester hall tickets portal active.',
    link: '/circulars',
    category: 'Gazette',
  },
  {
    id: 'b-3',
    text: 'CENTENNIAL CONVOCATION: Anderson Quadrangle rehearsal protocol issued for Class of 2026 graduands.',
    link: '/article/centennial-celebrations-anderson-quadrangle-research-grants',
    category: 'Spotlight',
  },
  {
    id: 'b-4',
    text: 'BOTANY & RESEARCH: Rare native medicinal flora cataloged in Tambaram scrub woodland sanctuary.',
    link: '/category/research',
    category: 'Science',
  },
];

export default function BreakingTicker({ items = [] }) {
  const tickerItems = items && items.length > 0 ? items : DEFAULT_BULLETINS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || tickerItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, tickerItems.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + tickerItems.length) % tickerItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
  };

  const active = tickerItems[currentIndex] || tickerItems[0];
  if (!active) return null;

  return (
    <div
      className="no-print bg-white border-y border-mcc-maroon/20 text-xs font-serif overflow-hidden shadow-2xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 py-1.5">
        {/* FLASHING BULLETIN LABEL */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-mcc-maroon text-white font-bold uppercase tracking-widest text-[11px] rounded shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-mcc-gold animate-ping shrink-0" />
            Dispatch Bulletin
          </span>
          <span className="hidden sm:inline text-gray-300">•</span>
        </div>

        {/* ACTIVE ITEM CONTENT WITH TRANSITION */}
        <div className="flex-1 overflow-hidden">
          <Link
            to={active.link || (active.slug ? `/article/${active.slug}` : '/')}
            className="group flex items-center gap-2 truncate text-gray-900 hover:text-mcc-maroon transition-colors"
          >
            {active.category && (
              <span className="text-[10px] font-bold text-mcc-gold uppercase tracking-wider shrink-0 bg-mcc-navy px-1.5 py-0.5 rounded">
                {active.category}
              </span>
            )}
            <span className="truncate font-medium text-xs sm:text-[13px] tracking-wide">
              {active.text || active.title}
            </span>
            <span className="hidden md:inline text-mcc-maroon text-[11px] font-bold uppercase tracking-wider shrink-0 group-hover:translate-x-1 transition-transform">
              Read →
            </span>
          </Link>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          <span className="text-[10px] text-gray-500 font-mono hidden sm:inline mr-1">
            {currentIndex + 1}/{tickerItems.length}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 hover:text-mcc-maroon hover:bg-gray-100 rounded transition-colors"
            title="Previous Bulletin"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1 hover:text-mcc-maroon hover:bg-gray-100 rounded transition-colors"
            title="Next Bulletin"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
