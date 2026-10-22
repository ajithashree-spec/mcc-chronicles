import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Bell, Newspaper, AlertCircle } from 'lucide-react';
import useRealtimeDispatches from '../../hooks/useRealtimeDispatches';

/**
 * BreakingNewsBanner: Floating broadsheet herald banner (Task 102).
 * Displays live real-time notifications when new dispatches or urgent circulars arrive.
 */
export default function BreakingNewsBanner() {
  const { notification, clearNotification } = useRealtimeDispatches();

  if (!notification) {
    return null;
  }

  const isCircular = notification.type === 'circular';

  return (
    <aside
      aria-label="Breaking news alert"
      className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] font-serif animate-in slide-in-from-bottom-5 fade-in duration-300 shadow-2xl"
    >
      <div
        className={`rounded-lg border p-4 text-white flex flex-col gap-2.5 backdrop-blur-md ${
          isCircular
            ? 'bg-mcc-navy/95 border-mcc-gold/40 text-mcc-paper'
            : 'bg-mcc-maroon/95 border-mcc-gold/40 text-white'
        }`}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mcc-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mcc-gold"></span>
            </span>
            <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-mcc-gold">
              {notification.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={clearNotification}
            className="text-white/70 hover:text-white p-0.5 rounded transition-colors"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-1">
          <h4 className="font-serif font-bold text-sm sm:text-base leading-snug line-clamp-2">
            {notification.title}
          </h4>
          {notification.category && (
            <p className="text-[11px] font-sans text-white/80">
              Department / Desk: <strong>{notification.category}</strong>
            </p>
          )}
          {notification.reference_no && (
            <p className="text-[11px] font-sans text-white/80">
              Ref No: <strong>{notification.reference_no}</strong> • {notification.department || 'Gazette'}
            </p>
          )}
        </div>

        {/* Action Link Button */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] text-white/60 font-sans">
            Live Stream Notification
          </span>
          <Link
            to={notification.url}
            onClick={clearNotification}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-mcc-gold hover:bg-yellow-400 text-mcc-navy font-sans text-xs font-bold uppercase tracking-wider rounded shadow-xs transition-colors"
          >
            <span>Read Fresh Dispatch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
