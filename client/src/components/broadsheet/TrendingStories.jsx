import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Eye, TrendingUp, ChevronRight, BookOpen } from 'lucide-react';
import articleService from '../../services/articleService';

export default function TrendingStories({ fallbackList = [] }) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTrending() {
      try {
        const res = await articleService.getArticles({ limit: 5 });
        if (!isMounted) return;

        let list = [];
        if (res.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }

        // Sort descending by views
        if (list.length > 0) {
          const sorted = [...list].sort(
            (a, b) => (Number(b.views_count) || 0) - (Number(a.views_count) || 0)
          );
          setTrending(sorted.slice(0, 5));
        } else {
          setTrending(fallbackList.length > 0 ? fallbackList.slice(0, 5) : []);
        }
      } catch (err) {
        if (isMounted) {
          setTrending(fallbackList.length > 0 ? fallbackList.slice(0, 5) : []);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTrending();

    return () => {
      isMounted = false;
    };
  }, [fallbackList]);

  const items = trending;

  return (
    <div className="bg-white border-2 border-mcc-maroon/20 rounded-md p-5 shadow-xs font-serif space-y-4">
      {/* Header */}
      <div className="border-b-2 border-mcc-maroon/20 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-mcc-maroon text-white flex items-center justify-center shadow-xs">
            <Flame className="w-3.5 h-3.5 text-mcc-gold" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-mcc-navy uppercase tracking-wider leading-none">
              Most-Read Dispatches
            </h3>
            <span className="text-[10px] text-gray-500 font-sans tracking-tight">
              Campus Readership Leaderboard
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-mcc-maroon font-bold bg-mcc-maroon/10 px-2 py-0.5 rounded">
          Top 5
        </span>
      </div>

      {/* Numbered Leaderboard List */}
      {items.length === 0 ? (
        <div className="py-6 text-center text-gray-500 font-sans text-xs italic">
          No trending dispatches filed for this bureau yet.
        </div>
      ) : (
        <ol className="divide-y divide-gray-100 space-y-2 pt-1">
        {items.map((art, idx) => {
          const rank = idx + 1;
          const badgeColor =
            rank === 1
              ? 'bg-mcc-gold text-white shadow-xs'
              : rank === 2 || rank === 3
              ? 'bg-mcc-maroon text-white'
              : 'bg-mcc-navy/15 text-mcc-navy';

          const views = Number(art.views_count) || 1;

          return (
            <li key={art.id || idx} className="pt-2 first:pt-0 group">
              <Link
                to={`/article/${art.slug}`}
                className="flex items-start gap-3 text-left transition-colors"
              >
                {/* Rank Number */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 font-mono ${badgeColor}`}
                >
                  {rank}
                </span>

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-sans">
                    <span className="text-mcc-navy font-semibold truncate max-w-[120px]">
                      {art.category_name || 'Broadsheet'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-600 font-mono shrink-0">
                      <Eye className="w-3 h-3 text-mcc-maroon" />
                      {views.toLocaleString()} reads
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      )}

      {/* Footer link */}
      <div className="border-t border-gray-100 pt-2.5 text-center">
        <Link
          to="/category/campus-news"
          className="text-[11px] font-serif font-bold text-mcc-maroon hover:text-mcc-navy inline-flex items-center gap-1 uppercase tracking-wider transition-colors"
        >
          <span>View All Campus Dispatches</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
