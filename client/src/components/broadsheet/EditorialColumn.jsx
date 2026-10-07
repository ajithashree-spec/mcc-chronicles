import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  FileText,
  ArrowRight,
  ExternalLink,
  Download,
  Calendar,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function EditorialColumn({
  popularArticles = [],
  circulars = [],
}) {
  return (
    <aside className="space-y-6">
      {/* 1. FROM THE EDITOR'S DESK / CHARTER */}
      <div className="bg-mcc-halfwhite border border-mcc-maroon/20 p-5 rounded shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-mcc-maroon/20 mb-3">
          <Sparkles className="w-4 h-4 text-mcc-gold" />
          <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-mcc-maroon">
            Editor&apos;s Dispatch
          </h3>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed font-serif">
          Welcome to <strong>The MCC Chronicles</strong>. Our student journalists and faculty correspondents document institutional history, academic breakthroughs, cultural extravaganzas, and student voices across our historic 365-acre campus.
        </p>
        <div className="mt-4 pt-3 border-t border-mcc-maroon/15 flex items-center justify-between text-xs font-semibold">
          <Link to="/about" className="text-mcc-maroon hover:underline flex items-center gap-1">
            <span>Our Charter</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link to="/contact" className="text-mcc-navy hover:underline">
            Submit Scoop
          </Link>
        </div>
      </div>

      {/* 2. MOST READ STORIES (01 TO 05) */}
      <div className="bg-white border border-mcc-maroon/15 rounded p-5 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-mcc-maroon/20 mb-4">
          <TrendingUp className="w-4 h-4 text-mcc-maroon" />
          <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-gray-900">
            Most Read Dispatches
          </h3>
        </div>

        <div className="space-y-4">
          {popularArticles.slice(0, 5).map((item, idx) => {
            const category = item.category_name || item.category || 'Gazette';
            const date = formatDate(item.published_at || item.created_at);

            return (
              <div
                key={item.id || item.slug || idx}
                className="flex items-start gap-3 group cursor-pointer pb-3 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-2xl font-serif font-black text-mcc-gold/60 group-hover:text-mcc-maroon transition-colors select-none w-7 shrink-0 text-right">
                  0{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-maroon font-bold block mb-0.5 truncate">
                    {category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-2 leading-snug">
                    <Link to={`/article/${item.slug}`}>
                      {item.title}
                    </Link>
                  </h4>
                  {date && (
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {date}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. OFFICIAL NOTICES & CIRCULARS TICKER */}
      <div className="border border-mcc-maroon/20 rounded p-4 bg-white shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-mcc-maroon/15 mb-3">
          <span className="flex items-center gap-1.5 text-xs font-serif font-bold text-mcc-maroon uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5 text-mcc-gold" /> Official Notices
          </span>
          <Link
            to="/circulars"
            className="text-[11px] text-mcc-gold hover:text-mcc-maroon hover:underline font-serif"
          >
            View Gazette →
          </Link>
        </div>

        <div className="space-y-2.5 text-xs">
          {circulars.slice(0, 4).map((c) => (
            <div
              key={c.id || c.circular_number}
              className="p-2.5 bg-mcc-halfwhite/60 hover:bg-mcc-halfwhite border border-mcc-maroon/10 rounded transition-colors group"
            >
              <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500 mb-1">
                <span className="font-mono text-mcc-maroon font-semibold">
                  {c.circular_number}
                </span>
                {c.publish_date && (
                  <span>{formatDate(c.publish_date)}</span>
                )}
              </div>
              <h5 className="font-semibold text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-2 leading-tight">
                <Link to="/circulars">
                  {c.title}
                </Link>
              </h5>
              {c.attachment_url && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-mcc-maroon font-medium">
                  <Download className="w-3 h-3 text-mcc-gold" />
                  <span>Document Attached</span>
                </div>
              )}
            </div>
          ))}

          {circulars.length === 0 && (
            <p className="text-xs text-gray-500 italic py-2">
              No recent circulars published today.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
