/**
 * Dynamic OpenGraph, Twitter & SEO Meta Tags Manager (Task 106)
 */

const DEFAULT_TITLE = 'The Madras Christian College Chronicles | Broadsheet of Record';
const DEFAULT_DESC =
  'Official broadsheet journal and gazette of Madras Christian College (Autonomous), Tambaram, Chennai. Documenting campus discourse, academic triumphs, and collegiate lore since 1837.';
const DEFAULT_IMAGE = '/images/mcc-campus-hero.jpg';

function setMetaTag(selector, attrName, attrValue, content) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content || '');
}

/**
 * Updates document title, OpenGraph, and Twitter card tags for the current article.
 */
export function updateArticleMetaTags(article) {
  if (!article || typeof document === 'undefined') return;

  const title = article.title
    ? `${article.title} | The MCC Chronicles`
    : DEFAULT_TITLE;
  const description =
    article.summary ||
    (article.content ? article.content.slice(0, 160).replace(/[#*`_]/g, '') : '') ||
    DEFAULT_DESC;
  const image = article.cover_image || DEFAULT_IMAGE;
  const currentUrl = window.location.href;

  document.title = title;

  // Standard Meta
  setMetaTag('meta[name="description"]', 'name', 'description', description);

  // OpenGraph (Facebook / LinkedIn / Slack)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', article.title || DEFAULT_TITLE);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article');
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'The MCC Chronicles');

  // Twitter Card
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', article.title || DEFAULT_TITLE);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);
}

/**
 * Resets document title and metadata to collegiate defaults.
 */
export function resetMetaTags() {
  if (typeof document === 'undefined') return;

  document.title = DEFAULT_TITLE;
  setMetaTag('meta[name="description"]', 'name', 'description', DEFAULT_DESC);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', DEFAULT_TITLE);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', DEFAULT_DESC);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', DEFAULT_IMAGE);
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', DEFAULT_TITLE);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', DEFAULT_DESC);
}

export default {
  updateArticleMetaTags,
  resetMetaTags,
};
