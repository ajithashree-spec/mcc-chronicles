import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';
import articleService from '../services/articleService';
import LeadStory from '../components/broadsheet/LeadStory';
import StoryGrid from '../components/broadsheet/StoryGrid';
import BreakingTicker from '../components/broadsheet/BreakingTicker';
import TrendingStories from '../components/broadsheet/TrendingStories';
import CampusPhotoStrip from '../components/broadsheet/CampusPhotoStrip';
import CampusHeroSlideshow from '../components/home/CampusHeroSlideshow';
import VerticalNewsTicker from '../components/home/VerticalNewsTicker';
import { usePageSettings } from '../context/PageSettingsContext';
import {
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Newspaper,
  Layers,
  FolderOpen,
  Calendar,
} from 'lucide-react';

function BroadsheetSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-9 bg-mcc-maroon/10 rounded w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-80 bg-gray-200 rounded w-full" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-60 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { articles, loading, error, refetch } = useArticles({ limit: 12 });
  const { settings } = usePageSettings();
  const [circulars, setCirculars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch official gazette circulars
    articleService
      .getCirculars(5)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setCirculars(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load circulars:', err);
        if (isMounted) setCirculars([]);
      });

    // Fetch dynamic categories for broadsheet columns
    articleService
      .getCategories()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setCategories(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load broadsheet categories:', err);
        if (isMounted) setCategories([]);
      })
      .finally(() => {
        if (isMounted) setCategoriesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasArticles = articles && articles.length > 0;

  // 1. Curated Lead Story assignment (from Superadmin page_settings or fallback to latest)
  const leadArticle = React.useMemo(() => {
    if (!hasArticles) return null;
    if (settings.curated_lead_article_id) {
      const found = articles.find((a) => String(a.id) === String(settings.curated_lead_article_id));
      if (found) return found;
    }
    return articles[0];
  }, [articles, settings.curated_lead_article_id, hasArticles]);

  // 2. Curated Secondary Lead Stories (from Superadmin page_settings or fallback to next 4)
  const secondaryArticles = React.useMemo(() => {
    if (!hasArticles) return [];
    const pool = articles.filter((a) => !leadArticle || String(a.id) !== String(leadArticle.id));

    if (Array.isArray(settings.curated_secondary_article_ids) && settings.curated_secondary_article_ids.length > 0) {
      const curated = [];
      for (const id of settings.curated_secondary_article_ids) {
        const item = pool.find((a) => String(a.id) === String(id));
        if (item && !curated.some((c) => String(c.id) === String(item.id))) {
          curated.push(item);
        }
      }
      if (curated.length > 0) {
        for (const rem of pool) {
          if (curated.length >= 4) break;
          if (!curated.some((c) => String(c.id) === String(rem.id))) {
            curated.push(rem);
          }
        }
        return curated.slice(0, 4);
      }
    }

    return pool.slice(0, 4);
  }, [articles, leadArticle, settings.curated_secondary_article_ids, hasArticles]);

  if (loading && (!articles || articles.length === 0)) {
    return <BroadsheetSkeleton />;
  }

  const popularArticles = hasArticles ? articles : [];

  const breakingArticleItems = (articles || [])
    .filter((a) => Boolean(a.is_breaking))
    .map((a) => ({
      id: `art-${a.id}`,
      text: `BREAKING DISPATCH: ${a.title}`,
      link: `/article/${a.slug}`,
      category: a.category_name || 'Breaking',
    }));

  const circularBulletins = (circulars || []).slice(0, 4).map((c) => ({
    id: `circ-${c.id}`,
    text: `${c.circular_number || 'GAZETTE'}: ${c.title}`,
    link: '/circulars',
    category: 'Gazette',
  }));

  const configuredTickerItems = Array.isArray(settings.ticker_items) ? settings.ticker_items : [];
  const tickerBulletins = configuredTickerItems.length > 0
    ? [...configuredTickerItems, ...breakingArticleItems]
    : [...breakingArticleItems, ...circularBulletins];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* 1. LIVE BREAKING DISPATCH TICKER */}
      {settings.ticker_enabled && (
        <BreakingTicker
          items={tickerBulletins}
          speedMs={settings.ticker_speed_ms}
          enabled={settings.ticker_enabled}
        />
      )}

      {/* HOMEPAGE SPLIT HERO — LEFT CAMPUS PHOTO SLIDESHOW & RIGHT VERTICAL ROLLING NEWS TICKER */}
      <section className="w-full max-w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            <CampusHeroSlideshow articles={articles} />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
            <VerticalNewsTicker articles={articles} />
          </div>
        </div>
      </section>

      {/* 2. GRAND LEAD STORY & BROADSHEET COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b-2 border-mcc-maroon/20 pb-8">
        {/* Main Center-Left Editorial Feature (8 cols) */}
        <section className="lg:col-span-8 lg:border-r border-mcc-navy/15 lg:pr-8 space-y-6 min-w-0">
          {hasArticles ? (
            <>
              <LeadStory article={leadArticle} />
              {secondaryArticles.length > 0 && (
                <StoryGrid articles={secondaryArticles} />
              )}
            </>
          ) : (
            /* AUTHENTIC BROADSHEET NEWSROOM EMPTY STATE */
            <div className="bg-white border-2 border-mcc-maroon/20 rounded-md p-6 sm:p-10 text-center space-y-5 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-mcc-maroon/10 text-mcc-maroon flex items-center justify-center mx-auto border-2 border-mcc-maroon/20">
                <Newspaper className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1 bg-mcc-navy text-mcc-gold text-[11px] font-serif uppercase tracking-widest font-bold rounded">
                  Madras Christian College &bull; Official Broadsheet Press
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-gray-950 tracking-tight max-w-xl mx-auto leading-snug">
                  The Newsroom Is Preparing Today&apos;s Broadsheet Edition
                </h2>
                <p className="text-xs sm:text-sm font-serif text-gray-600 max-w-lg mx-auto leading-relaxed">
                  No dispatches filed for this bureau yet. Only authorized editorial staff, student correspondents, and faculty editors publish verified articles to the public gazette.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/departments"
                  className="px-5 py-2.5 bg-[#7B1113] hover:bg-[#5C0D0E] text-white font-serif text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs"
                >
                  Browse 38 Department Bureaus
                </Link>
              </div>

              {/* Broadsheet Footnote Rule */}
              <div className="border-t border-mcc-maroon/15 pt-4 text-[11px] font-serif italic text-gray-500">
                Founded 1837 &bull; Madras Christian College, Tambaram, Chennai &bull; Autonomous Broadsheet Publication
              </div>
            </div>
          )}
        </section>

        {/* Right Broadsheet Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          <TrendingStories fallbackList={popularArticles} />
        </div>
      </div>

      {/* ZONE B: VIGNETTES OF THE 365-ACRE SCRUB JUNGLE PHOTO STRIP */}
      <CampusPhotoStrip />

      {/* 3. DYNAMIC BROADSHEET COLUMNS & CATEGORIES ROW */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b-2 border-mcc-maroon/20">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-mcc-maroon" />
            <h2 className="font-serif font-bold text-lg text-gray-900 uppercase tracking-wider">
              Broadsheet Editorial Desks & Sections
            </h2>
          </div>
          <span className="text-xs font-sans text-gray-500 font-medium">
            {categories.length} Active Desks
          </span>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-serif text-xs italic">
            No editorial desks configured yet. Super Admin may initialize categories via the Newsroom Console.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => {
              // Accent color cycle
              const accentBorder =
                idx % 3 === 0
                  ? 'border-mcc-maroon'
                  : idx % 3 === 1
                  ? 'border-mcc-navy'
                  : 'border-mcc-gold';
              const accentText =
                idx % 3 === 0
                  ? 'text-mcc-maroon'
                  : idx % 3 === 1
                  ? 'text-mcc-navy'
                  : 'text-mcc-gold';

              // Filter stories matching this category
              const catArticles = (articles || []).filter(
                (a) =>
                  a.category_id === cat.id ||
                  a.category_slug === cat.slug ||
                  (a.category_name &&
                    a.category_name.toLowerCase() === cat.name.toLowerCase())
              );

              return (
                <div
                  key={cat.id || cat.slug || idx}
                  className={`space-y-3 border-t-2 ${accentBorder} pt-3 bg-white p-4 rounded shadow-2xs flex flex-col justify-between`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-serif font-bold ${accentText} uppercase tracking-widest`}
                      >
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {cat.article_count || catArticles.length || 0} Stories
                      </span>
                    </div>

                    {catArticles.length > 0 ? (
                      <div>
                        <h3 className="text-base font-serif font-bold text-gray-900 leading-snug hover:text-mcc-maroon cursor-pointer line-clamp-2">
                          <Link to={`/article/${catArticles[0].slug}`}>
                            {catArticles[0].title}
                          </Link>
                        </h3>
                        {catArticles[0].summary && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-serif mt-1">
                            {catArticles[0].summary}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-serif">
                        {cat.description ||
                          'Comprehensive editorial reporting and journalistic coverage under this collegiate desk.'}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-serif font-semibold">
                    <span className="text-gray-400 italic text-[10px]">
                      {catArticles.length > 0 ? 'Active Coverage' : 'Bureau Open'}
                    </span>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="text-mcc-maroon hover:underline flex items-center gap-1 uppercase tracking-wider"
                    >
                      <span>Explore Desk</span>
                      <ArrowRight className="w-3 h-3" />
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
