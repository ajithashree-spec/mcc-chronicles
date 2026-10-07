import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import articleService from '../services/articleService';

// Category titles & descriptive editorial blurbs
const SECTION_METADATA = {
  'campus-news': {
    title: 'Campus News & Chronicle Desk',
    subtitle:
      'Official dispatches, administrative convocations, and historic moments from the 365-acre scrub jungle campus.',
  },
  academics: {
    title: 'Academics & Curricular Dispatches',
    subtitle:
      'Scholarly pursuits, curriculum expansions, faculty symposiums, and institutional achievements.',
  },
  'deepwoods-cultural': {
    title: 'DeepWoods & Cultural Arts',
    subtitle:
      'The cultural spirit of Madras Christian College: concert recitals, literary debates, and theatrical traditions.',
  },
  deepwoods: {
    title: 'DeepWoods Cultural Archive',
    subtitle:
      'Preserving four decades of musical lore, inter-collegiate rivalries, and collegiate fellowship in the scrub jungle.',
  },
  sports: {
    title: 'Sports & Athletic Annals',
    subtitle:
      'Track and field meets, hall championship trophies, inter-university cricket, and collegiate sportsmanship.',
  },
  research: {
    title: 'Research & Botanical Sciences',
    subtitle:
      'Scientific inquiries, biodiversity catalogs, and peer-reviewed studies from the laboratories and nature reserve.',
  },
};

/**
 * Normalizes cover image URLs to support both external and local uploads.
 */
function getMediaUrl(url) {
  if (!url) {
    return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800';
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

// Fallback articles if section or API is empty
const FALLBACK_CATEGORY_ARTICLES = [
  {
    id: 'f-1',
    slug: 'centennial-celebrations-anderson-quadrangle-research-grants',
    title:
      'Centennial Celebrations in Anderson Quadrangle: 187th Academic Year Commences',
    summary:
      'Scholars and faculty unveil major interdisciplinary research initiatives across the 365-acre scrub jungle campus.',
    cover_image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
    category_name: 'Campus News',
    author_name: 'MCC Editorial Board',
    department_name: 'Administration',
    published_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'f-2',
    slug: 'botany-department-rare-medicinal-flora-discovery',
    title:
      'Botany Department Discovers Rare Medicinal Flora in Southern Scrub Woodland',
    summary:
      'Collaborative field research spanning three decades identifies previously uncatalogued medicinal plant varieties.',
    cover_image:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800',
    category_name: 'Research',
    author_name: 'Dr. E. Botany',
    department_name: 'Botany',
    published_at: '2026-10-03T11:00:00Z',
  },
  {
    id: 'f-3',
    slug: 'deepwoods-2026-concert-finale-lineup-announced',
    title:
      'DeepWoods 2026 Concert Lineup: Legendary Woods Stage to Host National Bands',
    summary:
      'The cultural committee reveals headline acts for the 46th edition of South India’s most anticipated festival.',
    cover_image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    category_name: 'DeepWoods & Cultural',
    author_name: 'Cultural Desk',
    department_name: 'Fine Arts',
    published_at: '2026-10-02T14:30:00Z',
  },
];

export default function CategoryArchive() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  });
  const [categoryInfo, setCategoryInfo] = useState(null);

  // Derive human title from slug or preset map
  const meta = SECTION_METADATA[slug] || {
    title: slug
      ? slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') + ' Section'
      : 'Broadsheet Gazette Section',
    subtitle:
      'Archival records, dispatches, and reports published under this editorial desk.',
  };

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchCategoryData() {
      setLoading(true);
      try {
        const res = await articleService.getArticles({
          category: slug,
          page: currentPage,
          limit: 9,
        });

        if (!isMounted) return;

        if (res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          const pag = res.data.pagination || {
            total: list.length,
            page: currentPage,
            limit: 9,
            totalPages: Math.ceil(list.length / 9) || 1,
          };

          if (list.length > 0) {
            setArticles(list);
            setPagination(pag);
          } else {
            // Check if matches fallback
            const filteredFallback = FALLBACK_CATEGORY_ARTICLES.filter(
              (f) =>
                f.category_name.toLowerCase().includes(slug.replace(/-/g, ' ')) ||
                slug.includes(f.category_name.toLowerCase().split(' ')[0])
            );
            setArticles(
              filteredFallback.length > 0
                ? filteredFallback
                : FALLBACK_CATEGORY_ARTICLES
            );
            setPagination({
              total: filteredFallback.length || FALLBACK_CATEGORY_ARTICLES.length,
              page: 1,
              limit: 9,
              totalPages: 1,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load category articles:', err);
        if (isMounted) {
          setArticles(FALLBACK_CATEGORY_ARTICLES);
          setPagination({
            total: FALLBACK_CATEGORY_ARTICLES.length,
            page: 1,
            limit: 9,
            totalPages: 1,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCategoryData();

    return () => {
      isMounted = false;
    };
  }, [slug, currentPage]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif text-gray-500 mb-6">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-400">Sections</span>
        <span className="text-gray-300">/</span>
        <span className="text-mcc-maroon font-bold font-serif">{meta.title}</span>
      </nav>

      {/* 2. GRAND SECTION HEADER & BROADSHEET DOUBLE RULE */}
      <header className="mb-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-mcc-maroon">
          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
              Collegiate Gazette Section
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 uppercase tracking-tight">
              {meta.title}
            </h1>
            <p className="text-sm sm:text-base font-serif italic text-gray-700 mt-2 max-w-2xl leading-relaxed">
              {meta.subtitle}
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs font-serif uppercase tracking-widest font-bold text-gray-600 block">
              Volume CLXXXIX • Tambaram Edition
            </span>
            <span className="text-xs font-sans text-mcc-maroon font-semibold">
              {pagination.total} {pagination.total === 1 ? 'Dispatch' : 'Dispatches'} in Archives
            </span>
          </div>
        </div>

        {/* Ornate Secondary Hairline */}
        <div className="border-b border-gray-200 mt-1" />
      </header>

      {/* 3. ARTICLES GRID */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded border border-gray-200 p-4 space-y-3 animate-pulse"
            >
              <div className="h-48 w-full bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-full bg-gray-200 rounded" />
              <div className="h-4 w-4/5 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded pt-2" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 px-4 bg-white rounded-md border border-dashed border-gray-300 max-w-2xl mx-auto">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-gray-800">
            No Dispatches Filed Under This Desk Yet
          </h3>
          <p className="text-sm font-serif text-gray-600 mt-1 leading-relaxed">
            Our student correspondents and faculty editors are currently assembling dispatches for this section. Please check back shortly or explore our front page.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-mcc-maroon text-white font-serif uppercase tracking-wider text-xs font-bold rounded hover:bg-mcc-maroon-dark transition-colors shadow-xs"
            >
              Return to Front Page
            </Link>
          </div>
        </div>
      ) : (
        /* Render Articles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((art) => {
            const artImage = getMediaUrl(art.cover_image);
            const artDate = formatDate(art.published_at || art.created_at);
            const artReading = getReadingTime(art.content, art.summary);
            const catLabel = art.category_name || art.category || 'Gazette';
            const author = art.author_name || art.author || 'MCC Editorial Desk';

            return (
              <article
                key={art.id}
                className="group flex flex-col bg-white rounded-md border border-gray-200 hover:border-mcc-maroon/40 transition-all hover:shadow-md overflow-hidden"
              >
                {/* Framed Thumbnail */}
                <Link
                  to={`/article/${art.slug}`}
                  className="block relative h-52 overflow-hidden bg-gray-100"
                >
                  <img
                    src={artImage}
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-mcc-maroon text-white text-[11px] font-serif uppercase tracking-widest font-bold rounded shadow-xs">
                      {catLabel}
                    </span>
                  </div>
                </Link>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-[11px] font-serif text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-mcc-gold" />
                        {artDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {artReading}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2 className="font-serif text-xl font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors leading-snug line-clamp-2">
                      <Link to={`/article/${art.slug}`}>{art.title}</Link>
                    </h2>

                    {/* Excerpt */}
                    {art.summary && (
                      <p className="text-xs sm:text-sm font-serif text-gray-600 line-clamp-3 leading-relaxed">
                        {art.summary}
                      </p>
                    )}
                  </div>

                  {/* Byline & Link */}
                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-mcc-navy text-mcc-gold font-serif font-bold text-[10px] flex items-center justify-center">
                        {(author || 'M')[0].toUpperCase()}
                      </div>
                      <span className="font-serif font-semibold text-gray-800 truncate max-w-[130px]">
                        {author}
                      </span>
                    </div>

                    <Link
                      to={`/article/${art.slug}`}
                      className="inline-flex items-center gap-1 text-mcc-maroon font-serif font-bold hover:text-mcc-maroon-dark uppercase tracking-wider text-[11px]"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. PAGINATION CONTROLS */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded text-xs font-serif font-bold uppercase tracking-wider bg-white hover:bg-mcc-paper text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Dispatches</span>
          </button>

          <span className="text-xs font-serif text-gray-600">
            Page <strong className="text-mcc-navy">{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded text-xs font-serif font-bold uppercase tracking-wider bg-white hover:bg-mcc-paper text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next Dispatches</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
