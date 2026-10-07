import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  Bell,
  Building,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import articleService from '../../services/articleService';

const POPULAR_SUGGESTIONS = [
  'DeepWoods',
  'Convocation',
  'Exams',
  'Sports Day',
  'Research',
  'Botanical',
];

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewResults, setPreviewResults] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input and lock body scroll on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setPreviewResults(null);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced live search preview
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setPreviewResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await articleService.search(query.trim(), { limit: 5 });
        if (res.data && res.data.results) {
          setPreviewResults(res.data.results);
        } else {
          setPreviewResults(null);
        }
      } catch (err) {
        console.error('Search preview error:', err);
        setPreviewResults(null);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };

  const handleItemClick = (path) => {
    navigate(path);
    onClose();
  };

  const hasArticles = previewResults?.articles?.length > 0;
  const hasCirculars = previewResults?.circulars?.length > 0;
  const hasDepartments = previewResults?.departments?.length > 0;
  const hasAnyMatches = hasArticles || hasCirculars || hasDepartments;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-mcc-maroon/20 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* TOP SEARCH BAR */}
        <form onSubmit={handleFormSubmit} className="relative flex items-center border-b border-gray-200 px-4 py-3 bg-mcc-paper">
          <Search className="w-5 h-5 text-mcc-maroon mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the chronicles, dispatches, notices, or departments..."
            className="w-full bg-transparent text-sm sm:text-base font-serif text-gray-900 placeholder-gray-500 focus:outline-hidden"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-mcc-maroon border-t-transparent rounded-full animate-spin mr-2 shrink-0" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setPreviewResults(null);
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 mr-2"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-mcc-maroon rounded hover:bg-gray-100 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* POPULAR SUGGESTIONS */}
        <div className="px-5 py-2.5 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-serif uppercase tracking-wider text-gray-500 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3 h-3 text-mcc-gold" />
            Popular:
          </span>
          {POPULAR_SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSuggestionClick(tag)}
              className="px-2.5 py-0.5 rounded-full text-xs font-serif bg-white hover:bg-mcc-maroon hover:text-white text-gray-700 border border-gray-200 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* SEARCH RESULTS PREVIEW BODY */}
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
          {!query.trim() ? (
            /* Idle Prompt */
            <div className="py-8 text-center text-gray-500 space-y-2">
              <Sparkles className="w-8 h-8 text-mcc-gold mx-auto" />
              <p className="font-serif text-sm font-semibold text-gray-700">
                Explore the Madras Christian College Broadsheet Archives
              </p>
              <p className="text-xs text-gray-500 font-sans max-w-sm mx-auto">
                Type article keywords, faculty names, circular reference numbers, or collegiate events.
              </p>
            </div>
          ) : query.trim().length < 2 ? (
            <div className="py-4 text-center text-xs font-serif text-gray-500">
              Please enter at least 2 characters to search archives.
            </div>
          ) : hasAnyMatches ? (
            <div className="space-y-4 divide-y divide-gray-100">
              {/* Articles Preview */}
              {hasArticles && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-mcc-maroon">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Dispatches & Articles ({previewResults.articles.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {previewResults.articles.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(`/article/${item.slug}`)}
                        className="p-2.5 rounded hover:bg-mcc-paper cursor-pointer transition-colors border border-transparent hover:border-mcc-maroon/20 flex items-center justify-between group"
                      >
                        <div className="space-y-0.5 max-w-[85%]">
                          <h5 className="font-serif text-sm font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-1">
                            {item.title}
                          </h5>
                          <span className="text-[11px] text-gray-500 font-sans">
                            {item.category_name || 'Gazette'} • {item.department_name || 'Campus'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-mcc-maroon group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Circulars Preview */}
              {hasCirculars && (
                <div className="pt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-mcc-navy">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Official Notices & Circulars ({previewResults.circulars.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {previewResults.circulars.map((circ) => (
                      <div
                        key={circ.id}
                        onClick={() => handleItemClick(`/circulars?search=${encodeURIComponent(circ.circular_number || circ.title)}`)}
                        className="p-2.5 rounded hover:bg-mcc-paper cursor-pointer transition-colors border border-transparent hover:border-mcc-navy/20 flex items-center justify-between group"
                      >
                        <div className="space-y-0.5 max-w-[85%]">
                          <h5 className="font-serif text-sm font-bold text-gray-900 group-hover:text-mcc-navy transition-colors line-clamp-1">
                            {circ.title}
                          </h5>
                          <span className="text-[11px] text-gray-500 font-mono">
                            Ref: {circ.circular_number} • {circ.department_name || 'Administration'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-mcc-navy group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments Preview */}
              {hasDepartments && (
                <div className="pt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-mcc-gold">
                    <Building className="w-3.5 h-3.5" />
                    <span>Academic & Administrative Departments ({previewResults.departments.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {previewResults.departments.map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => handleItemClick(`/search?q=${encodeURIComponent(dept.name)}`)}
                        className="p-2.5 rounded hover:bg-mcc-paper cursor-pointer transition-colors border border-transparent hover:border-mcc-gold/30 flex items-center justify-between group"
                      >
                        <div>
                          <h5 className="font-serif text-sm font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors">
                            {dept.name} ({dept.code})
                          </h5>
                          <span className="text-[11px] text-gray-500 font-sans">
                            Head: {dept.head_of_department || 'Faculty Chair'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-mcc-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !loading ? (
            <div className="py-8 text-center text-gray-500 space-y-2">
              <p className="font-serif text-sm font-bold text-gray-800">
                No immediate matches found for "{query}"
              </p>
              <p className="text-xs text-gray-500">
                Press Enter or click below to launch a comprehensive archive search.
              </p>
            </div>
          ) : null}
        </div>

        {/* FOOTER ACTION */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs font-serif">
          <span className="text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono text-[10px]">Enter</kbd> to search all
          </span>
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={!query.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-mcc-maroon text-white font-serif font-bold uppercase tracking-wider text-[11px] rounded hover:bg-mcc-maroon-dark disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span>View All Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
