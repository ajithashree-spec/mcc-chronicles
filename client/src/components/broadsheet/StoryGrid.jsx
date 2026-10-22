import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

function getMediaUrl(url) {
  if (!url || url.includes('unsplash.com')) {
    return '/images/mcc-academic-quad.jpg';
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

export default function StoryGrid({ articles = [] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="pt-8 border-t-2 border-mcc-maroon/20">
      <div className="flex items-center justify-between pb-3 border-b border-mcc-maroon/15 mb-6">
        <h3 className="font-serif font-bold text-lg text-mcc-maroon uppercase tracking-wider">
          Secondary Front Page Dispatches
        </h3>
        <span className="text-xs font-serif text-gray-500 uppercase tracking-widest hidden sm:inline">
          Special In-Depth Reports
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {articles.map((article, index) => {
          const category = article.category_name || article.category || 'Gazette';
          const author = article.author_name || article.author || 'Staff Reporter';
          const date = formatDate(article.published_at || article.created_at);
          const cover = getMediaUrl(article.cover_image);

          return (
            <article
              key={article.id || article.slug || index}
              className="flex flex-col justify-between group space-y-3 pb-6 md:pb-0 border-b md:border-b-0 border-gray-200 last:border-b-0"
            >
              <div className="space-y-2.5">
                {/* Thumbnail Image */}
                <Link
                  to={`/article/${article.slug}`}
                  className="block relative overflow-hidden rounded border border-mcc-maroon/15 aspect-video"
                >
                  <img
                    src={cover}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-mcc-maroon/90 text-white text-[10px] font-serif uppercase tracking-widest px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                    {category}
                  </div>
                </Link>

                {/* Headline */}
                <h4 className="text-lg sm:text-xl font-serif font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-2 leading-snug">
                  <Link to={`/article/${article.slug}`}>
                    {article.title}
                  </Link>
                </h4>

                {/* Summary / Excerpt */}
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-sans">
                  {article.summary || (article.content ? article.content.replace(/<[^>]*>/g, '').slice(0, 180) : '')}
                </p>
              </div>

              {/* Byline & Date */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500 font-sans">
                <span className="font-medium text-mcc-navy font-serif truncate max-w-[180px]">
                  By {author}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3 h-3 text-mcc-gold" />
                  <span>{date}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
