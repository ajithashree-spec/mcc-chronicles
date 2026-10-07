/**
 * Reading Time and Word Count Dynamic Calculator
 * Broadsheet publishing standard based on 200 words-per-minute comprehension rate.
 */

/**
 * Strips HTML tags, markdown tokens, and excessive whitespace from text.
 * @param {string} rawText 
 * @returns {string} Clean plain text
 */
export function stripFormatting(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`.*?`/g, ' ')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove markdown image/link syntax: ![alt](url) or [text](url) -> text
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove markdown header tokens, bullet points, blockquotes, horizontal rules
    .replace(/^#+\s+/gm, ' ')
    .replace(/^[\*\-+]\s+/gm, ' ')
    .replace(/^>\s+/gm, ' ')
    .replace(/[-*_]{3,}/g, ' ')
    // Remove bold/italic asterisks and underscores
    .replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, '$1')
    // Remove URL links
    .replace(/https?:\/\/\S+/gi, ' ')
    // Collapse multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates word count and estimated reading time for a document.
 * @param {string} text - Raw Markdown or HTML article body
 * @param {number} [wordsPerMinute=200] - Average collegiate reading pace
 * @returns {{ words: number, minutes: number, text: string }}
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text || typeof text !== 'string') {
    return {
      words: 0,
      minutes: 1,
      text: '1 min read',
    };
  }

  const plainText = stripFormatting(text);

  if (!plainText) {
    return {
      words: 0,
      minutes: 1,
      text: '1 min read',
    };
  }

  // Count words matching unicode alphanumeric clusters
  const matches = plainText.match(/\S+/g);
  const words = matches ? matches.length : 0;

  if (words === 0) {
    return {
      words: 0,
      minutes: 1,
      text: '1 min read',
    };
  }

  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));

  return {
    words,
    minutes,
    text: `${minutes} min read`,
  };
}

export default calculateReadingTime;
