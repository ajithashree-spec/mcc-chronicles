import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  FileText,
  Bell,
  Building,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import articleService from '../services/articleService';

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

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const initialTab = searchParams.get('tab') || 'all';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({
    articles: [],
    circulars: [],
    departments: [],
  });
  const [totalMatches, setTotalMatches] = useState(0);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function executeSearch() {
      if (!query || query.trim().length < 2) {
        setResults({ articles: [], circulars: [], departments: [] });
        setTotalMatches(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await articleService.search(query.trim(), { limit: 50 });
        if (!isMounted) return;

        if (res.data && res.data.results) {
          const resObj = res.data.results;
          setResults({
            articles: resObj.articles || [],
            circulars: resObj.circulars || [],
            departments: resObj.departments || [],
          });
          setTotalMatches(
            Number(res.data.totalMatches) ||
              (resObj.articles?.length || 0) +
                (resObj.circulars?.length || 0) +
                (resObj.departments?.length || 0)
          );
        } else {
          setResults({ articles: [], circulars: [], departments: [] });
          setTotalMatches(0);
        }
      } catch (err) {
        console.error('Search query failed:', err);
        if (isMounted) {
          setResults({ articles: [], circulars: [], departments: [] });
          setTotalMatches(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    executeSearch();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim(), tab: activeTab });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ q: query, tab });
  };

  const articlesCount = results.articles.length;
  const circularsCount = results.circulars.length;
  const departmentsCount = results.departments.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif text-gray-500 mb-6">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-400">Search Archives</span>
        {query && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-mcc-maroon font-bold font-serif truncate max-w-xs">
              "{query}"
            </span>
          </>
        )}
      </nav>

      {/* 2. SEARCH HEADER & REFINEMENT BAR */}
      <div className="bg-white p-6 rounded-md border border-mcc-maroon/20 shadow-xs mb-8">
        <div className="max-w-3xl">
          <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
            Archival Search Engine
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
            The MCC Broadsheet Index
          </h1>
          <p className="text-sm font-serif italic text-gray-600 mt-1 mb-5">
            Query articles, news dispatches, official circulars, and departmental records across the collegiate archives.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 w-5 h-5 text-mcc-maroon/70" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by keywords, author, topic, or circular number..."
              className="w-full pl-11 pr-28 py-3 bg-mcc-paper/40 border border-gray-300 focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon rounded text-sm font-serif text-gray-900 focus:outline-hidden"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-1.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 3. METRICS & TABBED NAVIGATION */}
      {query && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3 mb-6">
          <div className="text-sm font-serif text-gray-700">
            {loading ? (
              <span>Searching historical archives...</span>
            ) : (
              <span>
                Found <strong className="text-mcc-navy font-bold">{totalMatches}</strong>{' '}
                {totalMatches === 1 ? 'record' : 'records'} matching &ldquo;
                <span className="text-mcc-maroon font-bold">{query}</span>&rdquo;
              </span>
            )}
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-serif font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-mcc-navy text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({totalMatches})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('articles')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeTab === 'articles'
                  ? 'bg-mcc-maroon text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Articles ({articlesCount})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('circulars')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeTab === 'circulars'
                  ? 'bg-mcc-gold text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Circulars ({circularsCount})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('departments')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeTab === 'departments'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Departments ({departmentsCount})
            </button>
          </div>
        </div>
      )}

      {/* 4. RESULTS CONTENT */}
      {loading ? (
        /* Loading Skeletons */
        <div className="space-y-4 max-w-4xl">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-5 rounded border border-gray-200 animate-pulse space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : !query || query.trim().length < 2 ? (
        /* Empty Query Guide */
        <div className="py-16 text-center text-gray-500 bg-white rounded-md border border-dashed border-gray-300 max-w-2xl mx-auto p-8">
          <Sparkles className="w-12 h-12 text-mcc-gold mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-gray-800">
            Awaiting Archival Search Keywords
          </h3>
          <p className="text-xs sm:text-sm font-serif text-gray-600 mt-1 max-w-md mx-auto leading-relaxed">
            Please enter at least 2 characters in the search box above to explore articles, faculty circulars, and departmental chronicles.
          </p>
        </div>
      ) : totalMatches === 0 ? (
        /* Zero Results Guide */
        <div className="py-16 text-center bg-white rounded-md border border-dashed border-gray-300 max-w-2xl mx-auto p-8">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-gray-800">
            No Records Found Matching &ldquo;{query}&rdquo;
          </h3>
          <p className="text-sm font-serif text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
            We could not locate any published dispatches, official circulars, or departments containing this term.
          </p>
          <div className="mt-6 text-left max-w-md mx-auto bg-mcc-paper p-4 rounded text-xs font-serif space-y-1.5 border border-mcc-maroon/15">
            <span className="font-bold text-mcc-navy uppercase tracking-wider block">
              Search Recommendations:
            </span>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Ensure all words are spelled correctly.</li>
              <li>Try broader terms, e.g. &ldquo;DeepWoods&rdquo;, &ldquo;Botany&rdquo;, &ldquo;Exam&rdquo;.</li>
              <li>Search by department code, e.g. &ldquo;ENG&rdquo;, &ldquo;HIS&rdquo;, &ldquo;BOT&rdquo;.</li>
              <li>Browse our sections from the navigation bar above.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Matched Results List */
        <div className="space-y-8 max-w-4xl">
          {/* ARTICLES STREAM */}
          {(activeTab === 'all' || activeTab === 'articles') && results.articles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-mcc-maroon border-b border-mcc-maroon/20 pb-1">
                <FileText className="w-4 h-4" />
                <span>Articles & Gazette Dispatches ({results.articles.length})</span>
              </div>
              <div className="space-y-4">
                {results.articles.map((art) => (
                  <article
                    key={art.id}
                    className="p-5 bg-white rounded-md border border-gray-200 hover:border-mcc-maroon/40 transition-all hover:shadow-xs group"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-serif uppercase tracking-widest text-mcc-maroon font-bold mb-1.5">
                      <span>{art.category_name || 'Gazette'}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 font-normal">
                        {formatDate(art.published_at)}
                      </span>
                      {art.department_name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500 font-normal">{art.department_name}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors leading-snug">
                      <Link to={`/article/${art.slug}`}>{art.title}</Link>
                    </h3>
                    {art.summary && (
                      <p className="text-xs sm:text-sm font-serif text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                        {art.summary}
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <Link
                        to={`/article/${art.slug}`}
                        className="inline-flex items-center gap-1 text-mcc-maroon font-serif font-bold uppercase tracking-wider text-[11px]"
                      >
                        <span>Read Dispatch</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* CIRCULARS STREAM */}
          {(activeTab === 'all' || activeTab === 'circulars') && results.circulars.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-mcc-navy border-b border-mcc-navy/20 pb-1">
                <Bell className="w-4 h-4" />
                <span>Official Notices & Circulars ({results.circulars.length})</span>
              </div>
              <div className="space-y-3">
                {results.circulars.map((circ) => (
                  <div
                    key={circ.id}
                    className="p-5 bg-white rounded-md border border-gray-200 hover:border-mcc-navy/40 transition-all hover:shadow-xs group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-mcc-navy bg-mcc-navy/5 px-2 py-0.5 rounded border border-mcc-navy/15">
                          {circ.circular_number}
                        </span>
                        <span className="text-[11px] text-gray-500 font-sans">
                          {formatDate(circ.publish_date)}
                        </span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-gray-900 group-hover:text-mcc-navy transition-colors">
                        {circ.title}
                      </h4>
                      <p className="text-xs text-gray-600 font-sans">
                        Authority: {circ.department_name || 'Office of Administration'}
                      </p>
                    </div>

                    <Link
                      to={`/circulars?search=${encodeURIComponent(circ.circular_number || circ.title)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif font-bold uppercase tracking-wider bg-white hover:bg-mcc-paper text-mcc-navy border border-gray-300 hover:border-mcc-navy transition-colors shrink-0 self-start sm:self-center"
                    >
                      <span>View Gazette</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* DEPARTMENTS STREAM */}
          {(activeTab === 'all' || activeTab === 'departments') && results.departments.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-mcc-gold border-b border-mcc-gold/30 pb-1">
                <Building className="w-4 h-4" />
                <span>Collegiate Departments ({results.departments.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-4 bg-white rounded-md border border-gray-200 hover:border-mcc-gold/40 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-mcc-maroon">
                        Code: {dept.code}
                      </span>
                      <span className="text-[10px] uppercase font-serif text-gray-500">
                        {dept.stream || 'Aided / SFS'}
                      </span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-mcc-navy">
                      {dept.name}
                    </h4>
                    <p className="text-xs font-sans text-gray-600 mt-1">
                      Chair / HOD: {dept.head_of_department || 'Faculty Chair'}
                    </p>
                    {dept.contact_email && (
                      <p className="text-[11px] font-sans text-gray-500 mt-0.5">
                        {dept.contact_email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
