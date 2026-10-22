import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Layers,
  Search,
  Filter,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  Archive,
} from 'lucide-react';
import articleService from '../services/articleService';

const ARCHIVAL_VOLUMES = [
  {
    volume: 'Volume CLXXXIX',
    academicYear: '2026 - 2027',
    term: 'Monsoon / Autumn Term',
    issuesCount: 14,
    description: 'Centennial celebrations in Anderson Quadrangle, interdisciplinary research consortiums, DeepWoods 46th edition, and contemporary collegiate governance.',
    activeYear: '2026',
  },
  {
    volume: 'Volume CLXXXVIII',
    academicYear: '2025 - 2026',
    term: 'Spring & Winter Sessions',
    issuesCount: 24,
    description: 'Ecological preservation initiatives across the 365-acre scrub jungle, inter-hall parliamentary debates, and modern digital journalism transitions.',
    activeYear: '2025',
  },
  {
    volume: 'Volume CLXXXVII',
    academicYear: '2024 - 2025',
    term: 'Annual Broadsheet Compendium',
    issuesCount: 26,
    description: 'Post-pandemic academic renaissance, renewal of the historic Miller Memorial Quadrangle, and international alumni scholarly convocations.',
    activeYear: '2024',
  },
];

export default function Archives() {
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function loadArchivalDispatches() {
      try {
        setLoading(true);
        const res = await articleService.getArticles({ limit: 50 });
        if (!isMounted) return;

        let list = [];
        if (res.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }
        setArticles(list);
      } catch (err) {
        console.error('Failed to load archives:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArchivalDispatches();

    return () => {
      isMounted = false;
    };
  }, []);

  const years = ['all', '2026', '2025', '2024'];
  const terms = ['all', 'Autumn / Monsoon Term', 'Spring Term', 'Special Compendium'];

  // Filter volumes
  const filteredVolumes = ARCHIVAL_VOLUMES.filter((v) => {
    if (selectedYear !== 'all' && v.activeYear !== selectedYear) return false;
    return true;
  });

  // Filter articles
  const filteredArticles = articles.filter((art) => {
    const artYear = art.published_at ? new Date(art.published_at).getFullYear().toString() : '2026';
    if (selectedYear !== 'all' && artYear !== selectedYear) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title?.toLowerCase().includes(q);
      const matchSummary = art.summary?.toLowerCase().includes(q);
      const matchCat = art.category_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 font-serif space-y-10 animate-in fade-in duration-300">
      {/* 1. MASTHEAD & ARCHIVAL INTRO */}
      <header className="text-center space-y-3 border-b-2 border-mcc-maroon pb-8">
        <div className="flex items-center justify-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-mcc-gold">
          <Archive className="w-4 h-4 text-mcc-maroon" />
          <span>Collegiate Archival Records • Madras Christian College</span>
          <Archive className="w-4 h-4 text-mcc-maroon" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-mcc-maroon tracking-tight">
          The Broadsheet Archival Registry
        </h1>
        <p className="text-base sm:text-lg text-gray-700 italic max-w-2xl mx-auto leading-relaxed">
          Chronological repository of all published volumes, academic terms, and collegiate dispatches since the founding of The MCC Chronicles.
        </p>
      </header>

      {/* 2. FILTER & SEARCH CONTROL DESK */}
      <div className="bg-white p-5 rounded-lg border border-mcc-maroon/20 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs">
          {/* Year selector pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-mcc-gold" />
              Volume Year:
            </span>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedYear === y
                    ? 'bg-mcc-maroon text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {y === 'all' ? 'All Years' : `Anno ${y}`}
              </button>
            ))}
          </div>

          {/* Search filter input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter archival dispatches..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs outline-none focus:border-mcc-maroon focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3. BOUND VOLUMES CHRONOLOGY BANNER */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-mcc-maroon/20 pb-2">
          <h2 className="text-xl font-black text-mcc-navy uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-mcc-maroon" />
            Archival Volumes & Term Folios
          </h2>
          <span className="text-xs font-mono text-gray-500">
            {filteredVolumes.length} Volumes Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredVolumes.map((vol, idx) => (
            <div
              key={idx}
              className="bg-mcc-paper border-2 border-mcc-maroon/20 rounded p-6 shadow-xs space-y-3 hover:border-mcc-maroon transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-mcc-gold font-sans">
                  {vol.academicYear}
                </span>
                <span className="text-[11px] font-mono font-bold text-mcc-maroon bg-mcc-maroon/10 px-2 py-0.5 rounded">
                  {vol.issuesCount} Issues
                </span>
              </div>

              <h3 className="text-2xl font-bold text-mcc-maroon group-hover:text-mcc-navy transition-colors">
                {vol.volume}
              </h3>

              <div className="text-xs font-sans font-semibold text-gray-700 bg-white/70 px-2.5 py-1 rounded border border-gray-200 inline-block">
                {vol.term}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed font-serif pt-1">
                {vol.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DISPATCHES INDEX TABLE / CARDS */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-mcc-maroon/20 pb-2">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-5 h-5 text-mcc-gold" />
            Preserved Dispatches ({filteredArticles.length})
          </h2>
          <span className="text-xs text-gray-500 font-sans">
            Chronological Order
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded border border-gray-200" />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-12 bg-white rounded border border-dashed border-gray-300 text-center space-y-2">
            <Archive className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600 font-serif italic">
              No archival dispatches match the selected volume or filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 bg-white rounded border border-mcc-maroon/20 shadow-xs overflow-hidden">
            {filteredArticles.map((art, idx) => {
              const pubDate = art.published_at
                ? new Date(art.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Archived Dispatch';

              const issueNo = (idx % 14) + 1;

              return (
                <div
                  key={art.id || idx}
                  className="p-5 hover:bg-mcc-paper/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-wider text-mcc-maroon">
                      <span className="bg-mcc-navy text-white px-2 py-0.5 rounded text-[10px] font-mono">
                        Vol. CLXXXIX • No. {issueNo}
                      </span>
                      <span>{art.category_name || 'Gazette'}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 font-normal">{pubDate}</span>
                      {art.department_name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500 font-normal">{art.department_name}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors leading-snug">
                      <Link to={`/article/${art.slug}`}>{art.title}</Link>
                    </h3>

                    {art.summary && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-serif">
                        {art.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <Link
                      to={`/article/${art.slug}`}
                      className="px-3.5 py-1.5 bg-mcc-maroon text-white hover:bg-mcc-maroon-dark rounded text-xs font-sans font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Read Dispatch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
