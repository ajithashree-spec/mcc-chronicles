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

/**
 * Generates an RSS 2.0 syndication feed of top published articles.
 */
async function getRSSFeed(req, res, next) {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const serverUrl = `${req.protocol}://${req.get('host')}`;

    const [articles] = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.content,
        a.published_at,
        a.created_at,
        c.name AS category_name,
        u.name AS author_name,
        u.email AS author_email
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT 20
    `);

    const now = new Date();
    const buildDate = now.toUTCString();

    const itemsXml = articles
      .map((article) => {
        const pubDate = article.published_at ? new Date(article.published_at).toUTCString() : buildDate;
        const articleLink = `${clientUrl}/article/${article.slug}`;
        const description = article.summary || (article.content ? article.content.substring(0, 300) : '');
        const authorEmail = article.author_email || 'editorial@mcc.edu.in';
        const authorName = article.author_name || 'MCC Editorial Board';
        const category = article.category_name || 'General';

        return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleLink}</link>
      <guid isPermaLink="true">${articleLink}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <author>${escapeXml(authorEmail)} (${escapeXml(authorName)})</author>
      <category>${escapeXml(category)}</category>
    </item>`;
      })
      .join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MCC Chronicles</title>
    <link>${clientUrl}</link>
    <description>Official News, Updates, and Literary Voice of Madras Christian College</description>
    <language>en-US</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${serverUrl}/api/feed/rss" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    return res.status(200).send(rssXml);
  } catch (error) {
    next(error);
  }
}

/**
 * Generates an Atom 1.0 syndication feed of top published articles.
 */
async function getAtomFeed(req, res, next) {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const serverUrl = `${req.protocol}://${req.get('host')}`;

    const [articles] = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.content,
        a.published_at,
        a.updated_at,
        a.created_at,
        c.name AS category_name,
        u.name AS author_name,
        u.email AS author_email
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT 20
    `);

    const now = new Date();
    const updatedDate = now.toISOString();

    const entriesXml = articles
      .map((article) => {
        const articleDate = article.updated_at || article.published_at || article.created_at || now;
        const updatedIso = new Date(articleDate).toISOString();
        const articleLink = `${clientUrl}/article/${article.slug}`;
        const summary = article.summary || (article.content ? article.content.substring(0, 300) : '');
        const authorName = article.author_name || 'MCC Editorial Board';
        const authorEmail = article.author_email || 'editorial@mcc.edu.in';
        const category = article.category_name || 'General';

        return `  <entry>
    <title>${escapeXml(article.title)}</title>
    <link href="${articleLink}" rel="alternate"/>
    <id>${articleLink}</id>
    <updated>${updatedIso}</updated>
    <summary>${escapeXml(summary)}</summary>
    <author>
      <name>${escapeXml(authorName)}</name>
      <email>${escapeXml(authorEmail)}</email>
    </author>
    <category term="${escapeXml(category)}"/>
  </entry>`;
      })
      .join('\n');

    const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>MCC Chronicles</title>
  <subtitle>Official News, Updates, and Literary Voice of Madras Christian College</subtitle>
  <link href="${clientUrl}" rel="alternate"/>
  <link href="${serverUrl}/api/feed/atom" rel="self"/>
  <id>${clientUrl}/</id>
  <updated>${updatedDate}</updated>
${entriesXml}
</feed>`;

    res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
    return res.status(200).send(atomXml);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRSSFeed,
  getAtomFeed,
};
