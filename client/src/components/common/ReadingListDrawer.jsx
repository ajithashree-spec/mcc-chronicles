import React from 'react';
import { Link } from 'react-router-dom';
import { useReadingList } from '../../hooks/useReadingList';
import {
  Bookmark,
  BookmarkCheck,
  X,
  Trash2,
  BookOpen,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function ReadingListDrawer({ isOpen, onClose }) {
  const { bookmarks, removeBookmark, clearBookmarks, count } = useReadingList();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-[#faf8f4] border-l-2 border-mcc-gold shadow-2xl flex flex-col font-serif overflow-hidden animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-list-title"
      >
        {/* ============================================================== */}
        {/* 1. DRAWER MASTHEAD HEADER */}
        {/* ============================================================== */}
        <div className="p-5 bg-white border-b-2 border-mcc-maroon/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-mcc-maroon text-mcc-gold flex items-center justify-center shadow-xs">
              <Bookmark className="w-5 h-5 fill-mcc-gold" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-mcc-maroon font-bold block">
                Personal Broadsheet Dossier
              </span>
              <div className="flex items-center gap-2">
                <h2 id="reading-list-title" className="text-base font-black text-gray-900">
                  My Reading List
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-mcc-gold/20 text-mcc-navy font-sans font-bold text-xs">
                  {count} {count === 1 ? 'dispatch' : 'dispatches'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close reading list"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 2. SUB-ACTION BAR */}
        {/* ============================================================== */}
        {count > 0 && (
          <div className="px-5 py-2.5 bg-mcc-halfwhite/80 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span>Preserved locally in browser storage</span>
            <button
              type="button"
              onClick={clearBookmarks}
              className="text-red-700 hover:text-red-900 font-bold flex items-center gap-1 hover:underline text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. STORIES LIST */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {count === 0 ? (
            <div className="py-24 text-center space-y-4 px-6">
              <div className="w-16 h-16 rounded-full bg-mcc-maroon/10 text-mcc-maroon flex items-center justify-center mx-auto">
                <BookmarkCheck className="w-8 h-8 text-mcc-maroon" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Your Reading List is Empty</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                Bookmark collegiate investigations, faculty breakthroughs, and DeepWoods dispatches
                using the bookmark ribbon on any story to read later.
              </p>
              <Link
                to="/"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs"
              >
                <span>Browse Latest Dispatches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            bookmarks.map((story) => (
              <div
                key={story.id || story.slug}
                className="bg-white rounded border border-gray-200 hover:border-mcc-maroon/40 p-3.5 shadow-2xs hover:shadow-xs transition-all flex gap-3 group relative"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  <img
                    src={
                      story.cover_image ||
                      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400'
                    }
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400';
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] uppercase font-bold text-mcc-maroon font-serif tracking-wider truncate">
                        {story.category_name || 'Gazette'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBookmark(story.id || story.slug)}
                        title="Remove from reading list"
                        className="text-gray-400 hover:text-red-700 p-0.5 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-2 leading-snug">
                      <Link to={`/article/${story.slug}`} onClick={onClose}>
                        {story.title}
                      </Link>
                    </h4>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[10px] text-gray-500 font-sans">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-mcc-gold" />
                      <span>{story.reading_time || '3 min read'}</span>
                    </span>
                    <Link
                      to={`/article/${story.slug}`}
                      onClick={onClose}
                      className="text-mcc-maroon font-serif font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. FOOTER */}
        {/* ============================================================== */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-500 text-[11px] italic">
            The MCC Chronicles Reading List
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded text-xs transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
