import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
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
import EmptyDispatch from '../components/common/EmptyDispatch';

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
  if (!url || url.includes('unsplash.com')) {
    return '/images/mcc-campus-hero.jpg';
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



export default function CategoryArchive({ defaultCategory = null, isDepartment = false }) {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const deptParam = searchParams.get('dept');
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const isDept = isDepartment || location.pathname.startsWith('/departments') || Boolean(deptParam);
  const activeSlug = slug || defaultCategory || (isDept ? deptParam : 'campus-news');

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentDetails, setDepartmentDetails] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  });

  // Format department name from slug if department route
  const formatDeptName = (s) => {
    if (!s) return 'Department Bureau';
    // If it's a code like ENG-AID
    if (s.includes('-')) {
      return s
        .split('-')
        .map((w) => w.toUpperCase())
        .join(' - ');
    }
    return s
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Derive human title from slug or preset map
  const meta = isDept
    ? {
        title: departmentDetails?.name || `Department of ${formatDeptName(activeSlug)}`,
        subtitle:
          departmentDetails?.description ||
          'Official academic dispatches, curriculum notices, student research, and bureau announcements.',
        breadcrumbCategory: 'Academic Departments',
        breadcrumbLink: '/departments',
      }
    : SECTION_METADATA[activeSlug] || {
        title: activeSlug
          ? activeSlug
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ') + ' Section'
          : 'Campus News & Dispatches',
        subtitle:
          'Archival records, dispatches, and reports published under this editorial desk.',
        breadcrumbCategory: 'News Desks',
        breadcrumbLink: '/news',
      };

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchData() {
      setLoading(true);
      try {
        const queryParams = {
          page: currentPage,
          limit: 9,
        };

        if (isDept) {
          queryParams.department = activeSlug;
        } else {
          queryParams.category = activeSlug;
        }

        const res = await articleService.getArticles(queryParams);

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
            setArticles([]);
            setPagination({
              total: 0,
              page: 1,
              limit: 9,
              totalPages: 1,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load dispatches:', err);
        if (isMounted) {
          setArticles([]);
          setPagination({
            total: 0,
            page: 1,
            limit: 9,
            totalPages: 1,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [activeSlug, currentPage, isDept]);

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
        <Link to={meta.breadcrumbLink} className="text-gray-500 hover:text-mcc-maroon transition-colors">
          {meta.breadcrumbCategory}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-mcc-maroon font-bold font-serif">{meta.title}</span>
      </nav>

      {/* 2. GRAND SECTION HEADER & BROADSHEET DOUBLE RULE */}
      <header className="mb-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-mcc-maroon">
          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
              {isDept ? 'Academic Department Bureau' : 'Collegiate Gazette Section'}
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
              Madras Christian College • Tambaram
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
        <EmptyDispatch bureau={meta.title} />
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
