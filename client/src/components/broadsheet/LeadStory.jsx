import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Share2, Clock, Calendar, User } from 'lucide-react';

/**
 * Normalizes cover image URLs to support both external and local uploads.
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

export default function LeadStory({ article }) {
  if (!article) return null;

  const categoryName = article.category_name || article.category || 'Front Page';
  const authorName = article.author_name || article.author || 'MCC Editorial Board';
  const departmentName = article.department_name || article.department || null;
  const publishedDate = formatDate(article.published_at || article.created_at);
  const readingTime = getReadingTime(article.content, article.summary);
  const coverImage = getMediaUrl(article.cover_image);

  // Lead content snippet for drop-cap paragraph
  const textBody =
    article.content && typeof article.content === 'string'
      ? article.content.replace(/<[^>]*>/g, '').trim()
      : (article.summary || '');

  return (
    <article className="space-y-4">
      {/* 1. KICKER & METADATA */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-serif uppercase tracking-widest text-mcc-maroon font-bold">
        <span className="px-2 py-0.5 bg-mcc-maroon/10 rounded">
          {categoryName}
        </span>
        <span className="text-gray-300">•</span>
        <span className="flex items-center gap-1 text-gray-600 font-normal">
          <Calendar className="w-3.5 h-3.5 text-mcc-gold" />
          {publishedDate}
        </span>
        <span className="text-gray-300">•</span>
        <span className="flex items-center gap-1 text-gray-500 font-normal">
          <Clock className="w-3.5 h-3.5" />
          {readingTime}
        </span>
      </div>

      {/* 2. GRAND HEADLINE */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black leading-tight text-gray-950 hover:text-mcc-maroon transition-colors tracking-tight">
        <Link to={`/article/${article.slug}`}>
          {article.title}
        </Link>
      </h2>

      {/* 3. ITALIC SUBHEADLINE / SUMMARY */}
      {article.summary && (
        <p className="text-base sm:text-lg font-serif italic text-gray-700 leading-relaxed border-l-2 border-mcc-gold pl-4 my-3">
          {article.summary}
        </p>
      )}

      {/* 4. FRAMED LEAD IMAGE */}
      <Link
        to={`/article/${article.slug}`}
        className="block relative overflow-hidden rounded border border-mcc-maroon/20 group shadow-xs"
      >
        <img
          src={coverImage}
          alt={article.title}
          className="w-full h-72 sm:h-96 lg:h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
          loading="eager"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white text-xs font-serif flex items-center justify-between">
          <span>
            <span className="font-bold text-mcc-gold">Gazette Archive:</span> Photographed on the Madras Christian College campus
          </span>
          <span className="hidden sm:inline text-white/80 uppercase tracking-widest text-[10px]">
            Click to Read Dispatch →
          </span>
        </div>
      </Link>

      {/* 5. LEAD PARAGRAPH WITH VINTAGE DROP-CAP */}
      {textBody && (
        <div className="text-sm text-gray-800 leading-relaxed font-sans pt-1">
          <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-mcc-maroon first-letter:float-left first-letter:mr-3 first-letter:leading-none line-clamp-4">
            {textBody}
          </p>
        </div>
      )}

      {/* 6. BYLINE & SOCIAL ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs text-gray-600 font-sans">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-mcc-maroon text-white flex items-center justify-center text-[10px] font-bold font-serif">
            {authorName[0] || 'M'}
          </div>
          <div>
            <span className="font-semibold text-mcc-navy font-serif">{authorName}</span>
            {departmentName && (
              <span className="text-gray-500 ml-1.5 hidden sm:inline">({departmentName})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-500">
          <Link
            to={`/article/${article.slug}`}
            className="text-mcc-maroon hover:text-mcc-maroon-dark font-serif font-bold uppercase tracking-wider text-xs"
          >
            Full Story →
          </Link>
        </div>
      </div>
    </article>
  );
}
