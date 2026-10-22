import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import articleService from '../services/articleService';
import {
  Tag,
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

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

export default function TagArchive() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tagName = (slug || 'campus')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    let isMounted = true;
    async function fetchTaggedArticles() {
      try {
        setLoading(true);
        setError(null);
        // Attempt tag query first, with graceful fallback to search/articles
        let res;
        try {
          res = await articleService.getArticles({ tag: slug });
        } catch {
          res = await articleService.getArticles();
        }

        if (isMounted) {
          if (res && Array.isArray(res.data)) {
            // Filter articles in-memory if server returned all
            const filtered = res.data.filter((a) => {
              const matchesTag =
                a.tags &&
                (Array.isArray(a.tags)
                  ? a.tags.some((t) => (typeof t === 'string' ? t.toLowerCase().includes(slug) : t.slug === slug))
                  : String(a.tags).toLowerCase().includes(slug));
              const matchesContent =
                a.title?.toLowerCase().includes(slug.replace(/-/g, ' ')) ||
                a.content?.toLowerCase().includes(slug.replace(/-/g, ' '));
              return matchesTag || matchesContent;
            });
            // If specific match found, use it; otherwise show general collection
            setArticles(filtered.length > 0 ? filtered : res.data);
          } else {
            setArticles([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load tagged articles:', err);
          setError('Unable to retrieve tagged dispatches from the archives.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTaggedArticles();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-serif text-gray-500">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-400">Tags</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-mcc-maroon font-bold font-mono">#{slug}</span>
      </nav>

      {/* 2. BROADSHEET MASTHEAD BANNER */}
      <div className="border-b-2 border-mcc-maroon pb-6">
        <div className="flex items-center gap-2 text-mcc-gold text-xs font-serif uppercase tracking-widest font-bold mb-1">
          <Tag className="w-4 h-4 text-mcc-maroon" />
          <span>Institutional Taxonomy Archives</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-black text-gray-900 tracking-tight">
          TAG ARCHIVE: #{tagName.toUpperCase()}
        </h1>
        <div className="mt-3 flex items-center justify-between text-xs font-serif text-gray-600">
          <p className="max-w-2xl leading-relaxed">
            Curated historical records, investigative reports, and collegiate essays catalogued under the{' '}
            <strong className="text-mcc-navy font-mono">#{slug}</strong> subject identifier.
          </p>
          <span className="font-bold text-mcc-maroon whitespace-nowrap hidden sm:inline">
            {articles.length} {articles.length === 1 ? 'Dispatch' : 'Dispatches'} Indexed
          </span>
        </div>
      </div>

      {/* 3. ERROR BANNER */}
      {error && (
        <div className="p-4 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. ARTICLES GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-48 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-20 text-center space-y-4 font-serif bg-white rounded border border-mcc-maroon/20 p-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900">
            No Dispatches Currently Catalogued
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Our newsroom correspondents have not yet indexed published articles under this tag.
            Check back following the next gazette edition.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2 bg-mcc-maroon text-white font-serif uppercase tracking-wider text-xs font-bold rounded hover:bg-mcc-maroon/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Front Page</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group bg-white rounded border border-gray-200 hover:border-mcc-maroon/40 transition-all hover:shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Cover Image */}
                <div className="h-48 overflow-hidden relative bg-gray-100">
                  <img
                    src={
                      article.cover_image || '/images/mcc-campus-hero.jpg'
                    }
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-mcc-maroon text-white text-[10px] font-serif uppercase tracking-widest font-bold rounded">
                    {article.category_name || 'Gazette'}
                  </div>
                </div>

                {/* Article Copy */}
                <div className="p-5 space-y-2.5">
                  <h3 className="font-serif text-lg font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-2 leading-snug">
                    <Link to={`/article/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-600 font-serif line-clamp-3 leading-relaxed">
                    {article.summary || article.excerpt || article.content?.slice(0, 150)}
                  </p>
                </div>
              </div>

              {/* Byline Footer */}
              <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-sans">
                <span>{formatDate(article.published_at || article.created_at)}</span>
                <Link
                  to={`/article/${article.slug}`}
                  className="text-mcc-maroon font-serif font-bold hover:underline"
                >
                  Read Story →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
