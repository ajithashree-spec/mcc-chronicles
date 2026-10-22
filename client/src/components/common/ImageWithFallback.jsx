import React, { useState } from 'react';
import { Camera } from 'lucide-react';

const FALLBACK_CAMPUS_IMAGES = [
  '/images/campus/mcc-main-facade.jpg',
  '/images/campus/mcc-scrub-jungle.jpg',
  '/images/campus/mcc-hall-heritage.jpg',
  '/images/campus/mcc-campus-life.jpg',
];

/**
 * Responsive Image component with collegiate broadsheet fallback (Task 128 / Campus Photo Showcase).
 * Automatically recovers from missing images, invalid URLs, and network 404s using authentic local MCC campus assets.
 */
export default function ImageWithFallback({
  src = '/images/campus/mcc-main-facade.jpg',
  alt = 'Madras Christian College Broadsheet Photographic Record',
  className = '',
  fallbackTitle = 'The MCC Chronicles',
  aspectRatio = 'aspect-[16/9]',
  loading = 'lazy',
  framed = false,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_CAMPUS_IMAGES[0]);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (fallbackIndex < FALLBACK_CAMPUS_IMAGES.length) {
      setImgSrc(FALLBACK_CAMPUS_IMAGES[fallbackIndex]);
      setFallbackIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const frameClass = framed
    ? 'p-1.5 bg-[#fbfaf8] border border-gray-300 shadow-sm ring-1 ring-mcc-gold/30 rounded-xs'
    : '';

  if (!imgSrc || hasError) {
    return (
      <div
        className={`w-full ${aspectRatio} bg-gradient-to-br from-[#1a0507] via-[#2a0b10] to-[#132238] border border-mcc-maroon/30 flex flex-col items-center justify-center p-6 text-center text-white select-none ${frameClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-full bg-white/10 border border-mcc-gold/40 flex items-center justify-center mb-2 shadow-xs">
          <Camera className="w-6 h-6 text-mcc-gold" />
        </div>
        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-mcc-gold">
          Archival Photographic Record
        </span>
        <h4 className="font-serif font-bold text-sm sm:text-base text-gray-100 max-w-xs line-clamp-2 mt-1">
          {fallbackTitle || alt}
        </h4>
        <span className="text-[10px] font-serif italic text-gray-400 mt-1">
          Madras Christian College &bull; Tambaram Archives
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden max-w-full ${frameClass}`}>
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} hd-broadsheet-photo w-full h-full object-cover transition-transform duration-500`}
        loading={loading}
        onError={handleError}
        {...props}
      />
    </div>
  );
}
