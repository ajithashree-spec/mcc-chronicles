import React, { useState, useEffect } from 'react';

/**
 * Reading progress bar displayed at the very top of the window,
 * showing reader progress through the article broadsheet column.
 */
export default function ReadingProgressBar() {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const percentage = Number((currentProgress / scrollHeight).toFixed(3)) * 100;
        setCompletion(Math.min(100, Math.max(0, percentage)));
      } else {
        setCompletion(0);
      }
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-black/5 z-50 pointer-events-none no-print"
      role="progressbar"
      aria-valuenow={Math.round(completion)}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        className="h-full bg-mcc-maroon transition-all duration-150 ease-out shadow-xs"
        style={{ width: `${completion}%` }}
      />
    </div>
  );
}
