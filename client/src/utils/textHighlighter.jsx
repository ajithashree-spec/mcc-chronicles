import React from 'react';

/**
 * Highlights occurrences of a search keyword within a text snippet.
 * Escapes regex special characters safely and returns JSX with highlighted <mark> tags.
 *
 * @param {string} text - The input text string to format
 * @param {string} keyword - The search term or phrase to highlight
 * @param {string} [highlightClassName] - Optional custom CSS classes for the highlight badge
 * @returns {React.ReactNode} - Formatted text with highlight elements or original text
 */
export function highlightKeyword(
  text,
  keyword,
  highlightClassName = 'bg-amber-200/90 text-mcc-maroon font-bold px-0.5 rounded shadow-2xs'
) {
  if (!text || typeof text !== 'string') return text || '';
  if (!keyword || typeof keyword !== 'string' || !keyword.trim()) return text;

  const trimmedKeyword = keyword.trim();
  // Escape regex special characters
  const escaped = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Regex splitting by matching group
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length <= 1) return text;

  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() === trimmedKeyword.toLowerCase()) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export default highlightKeyword;
