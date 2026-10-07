import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Eye,
  User,
  ChevronRight,
  ArrowLeft,
  Share2,
  BookOpen,
  AlertTriangle,
  Building,
  GraduationCap,
  Tag,
} from 'lucide-react';
import articleService from '../services/articleService';
import ReadingProgressBar from '../components/article/ReadingProgressBar';
import ArticleShareBar from '../components/article/ArticleShareBar';
import CommentSection from '../components/article/CommentSection';
import PollWidget from '../components/common/PollWidget';

/**
 * Normalizes cover image URLs to support both external and local server uploads.
 */
function getMediaUrl(url) {
  if (!url) {
    return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200';
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
      weekday: 'long',
      month: 'long',
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
  const text = (content || summary || '');
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

// Fallback articles if current article or related search is offline
const FALLBACK_RELATED = [
  {
    id: 'rel-1',
    slug: 'centennial-celebrations-anderson-quadrangle-research-grants',
    title: 'Centennial Celebrations in Anderson Quadrangle: 187th Academic Year Commences',
    summary: 'Scholars and faculty unveil major interdisciplinary research initiatives.',
    category_name: 'Campus News',
    published_at: '2026-10-04T08:00:00Z',
    cover_image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600',
  },
  {
    id: 'rel-2',
    slug: 'botany-department-rare-medicinal-flora-discovery',
    title: 'Botany Department Discovers Rare Medicinal Flora in Southern Scrub Woodland',
    summary: 'Decades of longitudinal botanical research yields catalog of native species.',
    category_name: 'Science & Research',
    published_at: '2026-10-03T11:00:00Z',
    cover_image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600',
  },
  {
    id: 'rel-3',
    slug: 'deepwoods-2026-concert-finale-lineup-announced',
    title: 'DeepWoods 2026 Concert Lineup: Legendary Woods Stage to Host National Bands',
    summary: 'The cultural committee reveals headline acts for the 46th festival edition.',
    category_name: 'DeepWoods 2026',
    published_at: '2026-10-02T14:30:00Z',
    cover_image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
  },
];

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchArticleData() {
      setLoading(true);
      setNotFound(false);

      try {
        const res = await articleService.getArticleBySlug(slug);
        if (!isMounted) return;

        if (res.data) {
          const art = res.data.data || res.data;
          setArticle(art);

          // Fetch related articles based on category
          try {
            const relRes = await articleService.getArticles({
              category: art.category_name || undefined,
              limit: 4,
            });
            if (isMounted && relRes.data) {
              const list = Array.isArray(relRes.data) ? relRes.data : (relRes.data.data || []);
              const filtered = list.filter((item) => String(item.id) !== String(art.id)).slice(0, 3);
              setRelatedArticles(filtered.length > 0 ? filtered : FALLBACK_RELATED);
            }
          } catch {
            if (isMounted) setRelatedArticles(FALLBACK_RELATED);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load article by slug:', err);
        if (isMounted) {
          // Check if matches fallback
          const matchedFallback = FALLBACK_RELATED.find((f) => f.slug === slug);
          if (matchedFallback) {
            setArticle({
              ...matchedFallback,
              content:
                'In a landmark convocation held under the ancient rain trees of the historic Tambaram campus, the Governing Board alongside academic deans announced the formal inauguration of the Research Initiative. The multi-departmental consortium brings together scholars from English, History, Botany, Mathematics, and Computer Science to document two centuries of biodiversity and literary culture in Southern India.\n\n"Madras Christian College has never been merely a center of instruction; it has forever stood as a sanctuary of thoughtful engagement with society," remarked the Principal during the keynote address in the Miller Memorial Quadrangle.\n\nThe initiative will establish three advanced computing labs and an open-access archival digitized repository commemorating distinguished alumni and former faculty.',
              author_name: 'MCC Editorial Board',
              department_name: 'College Administration',
              views_count: 142,
            });
            setRelatedArticles(FALLBACK_RELATED.filter((f) => f.slug !== slug));
          } else {
            setNotFound(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchArticleData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-12 w-full bg-gray-200 rounded" />
        <div className="h-6 w-3/4 bg-gray-200 rounded" />
        <div className="h-5 w-64 bg-gray-200 rounded" />
        <div className="h-96 w-full bg-gray-200 rounded" />
        <div className="space-y-3 pt-6">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-5 animate-in fade-in duration-300">
        <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold">
          Broadsheet Registry Search
        </span>
        <h2 className="text-4xl sm:text-5xl font-serif font-black text-mcc-maroon">
          Story Not Found in Archives
        </h2>
        <p className="text-base font-serif text-gray-600 max-w-lg mx-auto leading-relaxed">
          The requested dispatch or archival record ({slug}) could not be retrieved from the MCC Gazette. It may have been archived under an alternate volume or removed from publication.
        </p>
        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-mcc-maroon text-white font-serif uppercase tracking-wider text-xs font-bold rounded hover:bg-mcc-maroon-dark transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Front Page</span>
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = article.category_name || article.category || 'Gazette Dispatch';
  const authorName = article.author_name || article.author || 'MCC Editorial Board';
  const departmentName = article.department_name || article.department || null;
  const publishedDate = formatDate(article.published_at || article.created_at);
  const readingTime = getReadingTime(article.content, article.summary);
  const coverImage = getMediaUrl(article.cover_image);
  const viewsCount = article.views_count || 1;

  // Taxonomy tags (Task 86)
  const defaultArticleTags = [
    { name: 'DeepWoods', slug: 'deepwoods' },
    { name: 'MillerMemorial', slug: 'millermemorial' },
    { name: 'Centenary', slug: 'centenary' },
  ];
  const displayTags =
    Array.isArray(article.tags) && article.tags.length > 0
      ? article.tags
      : defaultArticleTags;

  // Split content into paragraphs if plain text
  const paragraphs =
    typeof article.content === 'string'
      ? article.content.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
      : [];

  return (
    <>
      {/* 1. TOP READING PROGRESS BAR */}
      <ReadingProgressBar />

      {/* 2. PRINT-ONLY HEADER FOR PAPER COPIES */}
      <div className="hidden print:block print-only-header">
        <h1 className="text-xl font-bold uppercase tracking-wider font-serif">
          The Madras Christian College Chronicles
        </h1>
        <p className="text-xs text-gray-700 italic">
          Official Broadsheet of Record • Tambaram, Chennai • Founded 1837
        </p>
        <p className="text-[10px] text-gray-600 mt-1">
          Archival Record: {typeof window !== 'undefined' ? window.location.href : ''}
        </p>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 3. BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="no-print flex items-center gap-1.5 text-xs font-serif text-gray-500 mb-6">
          <Link to="/" className="hover:text-mcc-maroon transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="hover:text-mcc-maroon transition-colors">
            {categoryName}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-800 font-semibold truncate max-w-xs sm:max-w-md">
            {article.title}
          </span>
        </nav>

        {/* 4. CATEGORY KICKER & METADATA BADGE */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-serif uppercase tracking-widest text-mcc-maroon font-bold mb-3">
          <span className="px-2.5 py-1 bg-mcc-maroon/10 rounded">
            {categoryName}
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1 text-gray-600 font-normal">
            <Calendar className="w-3.5 h-3.5 text-mcc-gold" />
            {publishedDate}
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1 text-gray-600 font-normal">
            <Clock className="w-3.5 h-3.5" />
            {readingTime}
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1 text-gray-600 font-normal">
            <Eye className="w-3.5 h-3.5 text-mcc-navy" />
            {viewsCount.toLocaleString()} {viewsCount === 1 ? 'reader' : 'readers'}
          </span>
        </div>

        {/* 5. GRAND BROADSHEET HEADLINE */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 leading-tight tracking-tight mb-4">
          {article.title}
        </h1>

        {/* 6. SUBHEADLINE / DECK */}
        {article.summary && (
          <p className="text-lg sm:text-xl font-serif italic text-gray-700 leading-relaxed border-l-3 border-mcc-gold pl-4 sm:pl-5 my-5 bg-mcc-gold/5 py-2">
            {article.summary}
          </p>
        )}

        {/* 7. EDITORIAL BYLINE BAR & SHARE ACTIONS */}
        <div className="pt-2 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-y border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-mcc-maroon text-white flex items-center justify-center text-sm font-bold font-serif shadow-xs">
                {(authorName || 'M')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-mcc-navy text-sm sm:text-base">
                    {authorName}
                  </span>
                  {departmentName && (
                    <span className="text-xs font-sans text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {departmentName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-sans mt-0.5">
                  Published in the Tambaram Broadsheet Gazette
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-serif text-gray-500 hidden sm:block">
              <span className="block font-bold text-mcc-maroon uppercase tracking-wider text-[11px]">
                Official Dispatch
              </span>
              <span>Volume CLXXXIX • Issue No. 14</span>
            </div>
          </div>

          {/* 8. ARTICLE SHARE BAR */}
          <ArticleShareBar title={article.title} />
        </div>

        {/* 9. FEATURED IMAGE WITH BROADSHEET CAPTION */}
        {coverImage && (
          <figure className="mb-8">
            <div className="overflow-hidden rounded-md border border-mcc-maroon/20 shadow-xs">
              <img
                src={coverImage}
                alt={article.title}
                className="w-full max-h-[520px] object-cover"
                loading="eager"
              />
            </div>
            <figcaption className="mt-2 text-xs font-serif text-gray-600 italic flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-2">
              <span>
                <strong className="text-mcc-navy not-italic font-bold">Gazette Dispatch: </strong>
                Archival documentary photographic record from the Tambaram campus grounds.
              </span>
              <span className="text-gray-500 text-[11px] not-italic mt-1 sm:mt-0">
                Photo: MCC Archives & Media Desk
              </span>
            </figcaption>
          </figure>
        )}

        {/* 10. ARTICLE BODY: VINTAGE PROSE STYLING & DROP-CAP */}
        <div className="broadsheet-prose font-serif text-gray-900 leading-relaxed text-lg sm:text-xl space-y-6 pt-2">
          {paragraphs.length > 0 ? (
            paragraphs.map((pText, idx) => (
              <p key={idx} className={idx === 0 ? 'drop-cap' : ''}>
                {pText}
              </p>
            ))
          ) : article.content ? (
            <div
              className="drop-cap"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p className="drop-cap">
              {article.summary ||
                'Full dispatch is preserved in the collegiate archive of Madras Christian College.'}
            </p>
          )}
        </div>

        {/* 10b. ARTICLE TAXONOMY TAG CHIPS (Task 86) */}
        <div className="pt-6 pb-2 flex flex-wrap items-center gap-2 border-b border-gray-200">
          <span className="text-xs font-serif font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-mcc-gold" />
            Taxonomy:
          </span>
          {displayTags.map((t, idx) => (
            <Link
              key={t.slug || idx}
              to={`/tag/${t.slug}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-serif font-bold text-mcc-maroon bg-mcc-maroon/5 hover:bg-mcc-maroon hover:text-white border border-mcc-maroon/20 transition-all shadow-2xs"
            >
              #{t.name}
            </Link>
          ))}
        </div>

        {/* 11. ABOUT THE AUTHOR CARD */}
        <div className="no-print mt-12 p-6 bg-white rounded-md border border-mcc-maroon/20 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-mcc-navy text-mcc-gold flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-xs">
            {(authorName || 'M')[0].toUpperCase()}
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="font-serif text-lg font-bold text-mcc-navy">
                About the Contributor: {authorName}
              </h4>
              <span className="text-[11px] font-serif uppercase tracking-wider text-mcc-maroon font-bold bg-mcc-maroon/5 px-2 py-0.5 rounded border border-mcc-maroon/10">
                Editorial Contributor
              </span>
            </div>
            <p className="text-xs sm:text-sm font-serif text-gray-700 leading-relaxed">
              {article.author_bio ||
                `Staff reporter and literary correspondent contributing regularly to The MCC Chronicles. Dedicated to documenting the academic triumphs, collegiate lore, and natural history of the 365-acre scrub jungle campus.`}
            </p>
            {departmentName && (
              <p className="text-xs font-sans text-gray-500 flex items-center justify-center sm:justify-start gap-1 pt-1">
                <Building className="w-3.5 h-3.5 text-mcc-gold" />
                <span>Department of {departmentName} • Madras Christian College</span>
              </p>
            )}
          </div>
        </div>

        {/* 12. RELATED STORIES GRID */}
        {relatedArticles.length > 0 && (
          <section className="no-print mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-mcc-maroon" />
                <h3 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">
                  Related Stories from the Gazette
                </h3>
              </div>
              <Link
                to="/"
                className="text-xs font-serif font-bold text-mcc-maroon hover:text-mcc-maroon-dark uppercase tracking-wider"
              >
                All Archives →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/article/${rel.slug}`}
                  className="group block bg-white rounded border border-gray-200 hover:border-mcc-maroon/30 transition-all hover:shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={getMediaUrl(rel.cover_image)}
                      alt={rel.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-mcc-maroon text-white text-[10px] font-serif uppercase tracking-widest font-bold rounded">
                      {rel.category_name || 'Gazette'}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h4 className="font-serif text-base font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-sans">
                      <span>{formatDate(rel.published_at)}</span>
                      <span className="text-mcc-maroon font-serif font-semibold">
                        Read Story →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 13. READER COMMENTS SECTION */}
        <CommentSection articleId={article.id} />

        {/* 14. CAMPUS OPINION POLL / BAROMETER (Task 85) */}
        <div className="no-print mt-12 pt-8 border-t border-gray-200">
          <PollWidget />
        </div>
      </article>
    </>
  );
}
