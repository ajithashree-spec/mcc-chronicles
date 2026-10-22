import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  FolderOpen,
  Building2,
  Mail,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Compass,
} from 'lucide-react';
import articleService from '../services/articleService';
import NewsCarousel from '../components/departments/NewsCarousel';
import EmptyDispatch from '../components/common/EmptyDispatch';

/**
 * Normalizes cover image URLs with fallback to authentic campus imagery.
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

/**
 * Format department name from slug if database details not yet resolved.
 */
function formatDeptName(s) {
  if (!s) return 'Department Bureau';
  if (s.includes('-')) {
    return s
      .split('-')
      .map((w) => (w.length <= 4 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ');
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}


export default function DepartmentDetail() {
  const { slug } = useParams();
  const [department, setDepartment] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchDepartmentAndArticles() {
      setLoading(true);
      try {
        // 1. Fetch departments to resolve exact department metadata
        let matchedDept = null;
        try {
          const deptRes = await articleService.getDepartments();
          const list = Array.isArray(deptRes.data?.data)
            ? deptRes.data.data
            : Array.isArray(deptRes.data)
            ? deptRes.data
            : [];

          if (slug) {
            const cleanSlug = slug.toLowerCase().trim();
            matchedDept = list.find((d) => {
              const codeSlug = (d.code || '').toLowerCase().replace(/[\s()&,]+/g, '-');
              const nameSlug = (d.name || '').toLowerCase().replace(/[\s()&,]+/g, '-');
              return (
                (d.code && d.code.toLowerCase() === cleanSlug) ||
                codeSlug === cleanSlug ||
                nameSlug === cleanSlug ||
                String(d.id) === cleanSlug ||
                (d.name && d.name.toLowerCase() === cleanSlug)
              );
            });
          }
        } catch (deptErr) {
          console.warn('Could not load departments list:', deptErr);
        }

        if (!isMounted) return;
        setDepartment(matchedDept);

        // 2. Fetch department articles ordered chronologically by publish date descending
        const queryParams = {
          limit: 30,
        };

        if (matchedDept?.id) {
          queryParams.department = matchedDept.id;
        } else if (slug) {
          queryParams.department = slug;
        }

        const artRes = await articleService.getArticles(queryParams);

        if (!isMounted) return;

        const rawList = Array.isArray(artRes.data)
          ? artRes.data
          : Array.isArray(artRes.data?.data)
          ? artRes.data.data
          : [];

        // Guarantee descending chronological order
        const sorted = [...rawList].sort((a, b) => {
          const dateA = new Date(a.published_at || a.created_at || 0);
          const dateB = new Date(b.published_at || b.created_at || 0);
          return dateB - dateA;
        });

        setArticles(sorted);
      } catch (err) {
        console.error('Failed to load department dispatches:', err);
        if (isMounted) {
          setArticles([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDepartmentAndArticles();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Derived Title & Meta
  const deptTitle = department?.name || `Department of ${formatDeptName(slug)}`;
  const streamBadge = department?.stream || (slug?.toLowerCase().includes('sfs') ? 'Self-Financed' : 'Aided');
  const deptCode = department?.code || slug?.toUpperCase() || 'BUREAU';
  const hodName = department?.head_of_department || 'Faculty Chair';
  const contactEmail = department?.contact_email;
  const description =
    department?.description ||
    'Official academic dispatches, curriculum notices, student research, and bureau announcements from Madras Christian College.';

  // 1. DATA SPLIT: Top Hero (1st article) & Archives Carousel (Remaining articles)
  const hasArticles = articles.length > 0;
  const latestArticle = hasArticles ? articles[0] : null;
  const previousArticles = hasArticles ? articles.slice(1) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-300">
      {/* 1. BREADCRUMBS */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-serif text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-[#7B1113] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link to="/departments" className="hover:text-[#7B1113] transition-colors">
          Academic Departments
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[#7B1113] font-bold truncate max-w-xs sm:max-w-md">{deptTitle}</span>
      </nav>

      {/* 2. INSTITUTIONAL BUREAU HEADER */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b-2 border-[#7B1113]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-serif uppercase tracking-widest text-[#C5A059] font-bold">
                Academic Department Bureau
              </span>
              <span className="text-gray-300">•</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider ${
                  streamBadge === 'Aided'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-purple-50 text-purple-800 border border-purple-200'
                }`}
              >
                {streamBadge} Stream
              </span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-mono rounded border border-gray-300">
                {deptCode}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#0F2537] tracking-tight">
              {deptTitle}
            </h1>

            <p className="text-sm sm:text-base font-serif italic text-gray-700 max-w-3xl leading-relaxed">
              {description}
            </p>

            {/* Bureau Metadata Ribbon */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-600 font-sans">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#C5A059]" />
                <span>
                  Head of Bureau: <strong className="text-[#0F2537] font-serif">{hodName}</strong>
                </span>
              </div>
              {contactEmail && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#7B1113]" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-gray-600 hover:text-[#7B1113] underline decoration-[#C5A059]/50"
                  >
                    {contactEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="lg:text-right shrink-0 pt-2 lg:pt-0">
            <span className="text-xs font-serif uppercase tracking-widest font-bold text-gray-600 block">
              Madras Christian College • Tambaram
            </span>
            <span className="text-xs font-sans text-[#7B1113] font-bold">
              {articles.length} {articles.length === 1 ? 'Dispatch' : 'Dispatches'} Filed Under Desk
            </span>
          </div>
        </div>

        {/* Ornate Secondary Hairline */}
        <div className="border-b border-[#C5A059]/30 mt-1" />
      </header>

      {/* 3. CONTENT AREA: LOADING / EMPTY / HERO + CAROUSEL */}
      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-8 animate-pulse">
          {/* Spotlight Hero Skeleton */}
          <div className="bg-[#FAF8F5] border border-[#C5A059]/40 rounded-lg p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 aspect-video bg-gray-200 rounded-md" />
            <div className="lg:col-span-5 space-y-3">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-8 w-4/5 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded pt-2" />
            </div>
          </div>

          {/* Carousel Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-md border border-gray-200 p-4 space-y-3">
                <div className="h-40 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : !hasArticles ? (
        /* Clean Broadsheet Empty State */
        <EmptyDispatch bureau={deptTitle} />
      ) : (
        /* Articles Present: Top Spotlight Hero + Netflix-Style Carousel */
        <div className="space-y-10 sm:space-y-12">
          {/* ================================================================= */}
          {/* 2. TOP SPOTLIGHT HERO CARD (LATEST ARTICLE)                       */}
          {/* ================================================================= */}
          <section aria-label="Featured Department Dispatch">
            <div className="bg-[#FAF8F5] border border-[#C5A059]/40 rounded-lg p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left/Top (Image): lg:col-span-7 - 16:9 Aspect Ratio with Subtle Gold Border */}
                <div className="lg:col-span-7">
                  <Link
                    to={`/article/${latestArticle.slug}`}
                    className="block relative aspect-video w-full rounded-md overflow-hidden border border-[#C5A059]/50 shadow-xs bg-gray-100 group/img"
                  >
                    <img
                      src={getMediaUrl(latestArticle.cover_image)}
                      alt={latestArticle.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                    />
                    {/* Collegiate Photo Caption / Credit Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 bg-[#0F2537]/80 backdrop-blur-xs text-[10px] text-[#FAF8F5]/90 px-2.5 py-1 rounded font-sans truncate border border-[#C5A059]/30">
                      MCC Editorial Archives • Bureau Dispatch Photography
                    </div>
                  </Link>
                </div>

                {/* Right/Bottom (Content): lg:col-span-5 Flex Column */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full">
                  <div>
                    {/* Tag: LATEST DISPATCH */}
                    <span className="text-[#7B1113] bg-[#7B1113]/10 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
                      LATEST DISPATCH
                    </span>

                    {/* Headline: Serif 2xl-3xl font-bold */}
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F2537] hover:text-[#7B1113] transition-colors cursor-pointer leading-tight">
                      <Link to={`/article/${latestArticle.slug}`}>{latestArticle.title}</Link>
                    </h2>

                    {/* Date & Read Time Timestamp */}
                    <div className="text-xs text-gray-500 font-sans mt-2 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                        {formatDate(latestArticle.published_at || latestArticle.created_at)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {getReadingTime(latestArticle.content, latestArticle.summary)}
                      </span>
                    </div>

                    {/* Author / Byline */}
                    <div className="mt-2 text-xs font-sans text-gray-600 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#7B1113]" />
                      <span>
                        By{' '}
                        <strong className="text-gray-800">
                          {latestArticle.author_name || 'MCC Bureau Correspondent'}
                        </strong>
                      </span>
                    </div>

                    {/* Excerpt: 3-line truncated summary */}
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 mt-3">
                      {latestArticle.summary ||
                        (latestArticle.content
                          ? latestArticle.content.substring(0, 180) + '...'
                          : '')}
                    </p>
                  </div>

                  {/* Read Full Dispatch Link with Arrow */}
                  <div className="mt-4 pt-4 border-t border-[#C5A059]/20">
                    <Link
                      to={`/article/${latestArticle.slug}`}
                      className="text-[#7B1113] font-semibold text-xs uppercase tracking-wider hover:underline inline-flex items-center gap-1 group/btn"
                    >
                      <span>Read Full Dispatch</span>
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 3. NETFLIX-STYLE 3-CARD SLIDING CAROUSEL (OLDER DISPATCHES)       */}
          {/* ================================================================= */}
          {previousArticles.length > 0 && (
            <NewsCarousel articles={previousArticles} />
          )}
        </div>
      )}
    </div>
  );
}
