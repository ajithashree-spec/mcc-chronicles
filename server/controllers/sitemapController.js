const pool = require('../config/db');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generates dynamic SEO sitemap in XML format conforming to sitemaps.org standard.
 */
async function getSitemap(req, res, next) {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const today = new Date().toISOString().split('T')[0];

    // Static core routes
    const staticUrls = [
      { loc: `${clientUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${clientUrl}/about`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${clientUrl}/contact`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${clientUrl}/gallery`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${clientUrl}/circulars`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    ];

    // Query active departments
    const [departments] = await pool.query(
      'SELECT code, created_at FROM departments ORDER BY name ASC'
    );
    const departmentUrls = departments.map((dept) => ({
      loc: `${clientUrl}/departments/${dept.code.toLowerCase()}`,
      lastmod: formatDate(dept.created_at),
      changefreq: 'weekly',
      priority: '0.7',
    }));

    // Query categories
    const [categories] = await pool.query(
      'SELECT slug, created_at FROM categories ORDER BY name ASC'
    );
    const categoryUrls = categories.map((cat) => ({
      loc: `${clientUrl}/category/${cat.slug}`,
      lastmod: formatDate(cat.created_at),
      changefreq: 'daily',
      priority: '0.7',
    }));

    // Query published articles
    const [articles] = await pool.query(
      `SELECT slug, published_at, updated_at 
       FROM articles 
       WHERE status = 'published' 
       ORDER BY published_at DESC`
    );
    const articleUrls = articles.map((art) => ({
      loc: `${clientUrl}/article/${art.slug}`,
      lastmod: formatDate(art.updated_at || art.published_at),
      changefreq: 'weekly',
      priority: '0.9',
    }));

    const allUrls = [
      ...staticUrls,
      ...departmentUrls,
      ...categoryUrls,
      ...articleUrls,
    ];

    const xmlUrls = allUrls
      .map(
        (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
      )
      .join('\n');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(sitemapXml);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSitemap,
};
