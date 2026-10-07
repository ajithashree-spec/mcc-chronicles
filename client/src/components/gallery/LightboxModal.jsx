import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  Maximize2,
  Calendar,
  Camera,
  Tag,
} from 'lucide-react';

/**
 * Normalizes image URLs for local or external media.
 */
function getMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function LightboxModal({
  photos = [],
  currentIndex = 0,
  isOpen = false,
  onClose,
  onSelectIndex,
}) {
  const [copied, setCopied] = useState(false);

  const activePhoto = photos[currentIndex] || null;
  const total = photos.length;

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    const nextIdx = (currentIndex - 1 + total) % total;
    onSelectIndex(nextIdx);
  }, [currentIndex, total, onSelectIndex]);

  const handleNext = useCallback(() => {
    if (total === 0) return;
    const nextIdx = (currentIndex + 1) % total;
    onSelectIndex(nextIdx);
  }, [currentIndex, total, onSelectIndex]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !activePhoto) return null;

  const imageUrl = getMediaUrl(activePhoto.image_url);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(imageUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image URL:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1. TOP CONTROLS BAR */}
      <div className="flex items-center justify-between px-6 py-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
        {/* Counter */}
        <div className="flex items-center gap-2 text-white/80 font-serif text-sm">
          <span className="font-bold text-mcc-gold uppercase tracking-widest text-xs">
            Gazette Lightbox
          </span>
          <span className="text-white/40">•</span>
          <span>
            Photo <strong className="text-white font-bold">{currentIndex + 1}</strong> of{' '}
            <strong>{total}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            title={copied ? 'Link Copied!' : 'Copy Photo URL'}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>

          <a
            href={imageUrl}
            download={`mcc-chronicles-${activePhoto.id || currentIndex}.jpg`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open / Download Full Resolution"
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            title="Close Lightbox (Esc)"
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 2. MAIN IMAGE DISPLAY & PREV/NEXT ARROWS */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-16 overflow-hidden">
        {/* PREVIOUS BUTTON */}
        {total > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 sm:left-6 p-3 rounded-full bg-black/40 hover:bg-mcc-maroon text-white/90 hover:text-white transition-all backdrop-blur-xs border border-white/10 hover:border-mcc-maroon z-20 cursor-pointer shadow-lg"
            aria-label="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* IMAGE CONTAINER */}
        <div className="max-w-5xl max-h-[75vh] flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt={activePhoto.title || 'Campus Photo'}
            className="max-h-[72vh] max-w-full object-contain rounded shadow-2xl transition-all duration-300 animate-in zoom-in-95"
          />
        </div>

        {/* NEXT BUTTON */}
        {total > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 sm:right-6 p-3 rounded-full bg-black/40 hover:bg-mcc-maroon text-white/90 hover:text-white transition-all backdrop-blur-xs border border-white/10 hover:border-mcc-maroon z-20 cursor-pointer shadow-lg"
            aria-label="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 3. BOTTOM CAPTION & METADATA TRAY */}
      <div className="px-6 py-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-white z-10 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {activePhoto.event_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-mcc-maroon text-white font-serif uppercase tracking-widest text-[10px] font-bold">
                  <Tag className="w-3 h-3" />
                  {activePhoto.event_name}
                </span>
              )}
              {activePhoto.department_name && (
                <span className="text-white/60 font-sans text-xs">
                  {activePhoto.department_name}
                </span>
              )}
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
              {activePhoto.title || 'Campus Photographic Record'}
            </h3>

            {(activePhoto.caption || activePhoto.description) && (
              <p className="font-serif italic text-white/80 text-xs sm:text-sm leading-relaxed max-w-3xl">
                {activePhoto.caption || activePhoto.description}
              </p>
            )}
          </div>

          <div className="text-right text-[11px] font-serif text-white/50 shrink-0">
            <div className="flex items-center md:justify-end gap-1.5 text-mcc-gold font-semibold">
              <Camera className="w-3.5 h-3.5" />
              <span>MCC Media Archive & Media Desk</span>
            </div>
            <span>Tambaram Campus • Vol. CLXXXIX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
