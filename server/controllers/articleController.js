const pool = require('../config/db');

/**
 * Utility to convert text into URL slug.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug for an article.
 */
async function generateUniqueSlug(title, currentId = null) {
  const baseSlug = slugify(title) || 'article';
  let slugCandidate = baseSlug;
  let counter = 1;

  while (true) {
    const query = currentId
      ? 'SELECT id FROM articles WHERE slug = ? AND id != ? LIMIT 1'
      : 'SELECT id FROM articles WHERE slug = ? LIMIT 1';
    const params = currentId ? [slugCandidate, currentId] : [slugCandidate];

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) {
      return slugCandidate;
    }

    slugCandidate = `${baseSlug}-${counter}-${Math.random().toString(36).substring(2, 6)}`;
    counter++;
  }
}

/**
 * Retrieve paginated list of articles with filters.
 * Public / Filtered access.
 */
async function getAllArticles(req, res, next) {
  try {
    const {
      category_id,
      category,
      department_id,
      department,
      status,
      search,
      featured,
      breaking,
      tag,
      page = 1,
      limit = 10,
    } = req.query;

    const catParam = category_id || category;
    const deptParam = department_id || department;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const queryParams = [];

    // Enforce status filter
    // Unauthenticated readers ONLY see published articles
    if (!req.user) {
      whereClauses.push("a.status = 'published'");
    } else if (status && status !== 'all') {
      const normalizedStatus = status === 'pending_review' ? 'under_review' : status;
      whereClauses.push('a.status = ?');
      queryParams.push(normalizedStatus);
    } else if (!status) {
      whereClauses.push("a.status = 'published'");
    }

    // Category filter
    if (catParam) {
      whereClauses.push('(a.category_id = ? OR c.slug = ? OR c.name = ?)');
      queryParams.push(catParam, catParam, catParam);
    }

    // Department filter
    if (deptParam) {
      whereClauses.push('(a.department_id = ? OR d.code = ? OR d.name = ?)');
      queryParams.push(deptParam, deptParam, deptParam);
    }

    // Tag filter
    if (tag) {
      whereClauses.push(`a.id IN (
        SELECT at.article_id FROM article_tags at 
        JOIN tags t ON at.tag_id = t.id 
        WHERE t.slug = ? OR t.name = ?
      )`);
      queryParams.push(tag, tag);
    }

    // Featured / Breaking filters
    if (featured !== undefined) {
      whereClauses.push('a.is_featured = ?');
      queryParams.push(featured === 'true' || featured === '1' ? 1 : 0);
    }

    if (breaking !== undefined) {
      whereClauses.push('a.is_breaking = ?');
      queryParams.push(breaking === 'true' || breaking === '1' ? 1 : 0);
    }

    // Search query filter
    if (search && search.trim()) {
      whereClauses.push('(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      ${whereSql}
    `;
    const [countRows] = await pool.query(countSql, queryParams);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Articles retrieval query
    const dataSql = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.cover_image,
        a.status,
        a.is_featured,
        a.is_breaking,
        a.views_count,
        a.author_id,
        u.name AS author_name,
        u.email AS author_email,
        u.avatar_url AS author_avatar,
        a.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        a.department_id,
        d.name AS department_name,
        d.code AS department_code,
        a.published_at,
        a.created_at,
        a.updated_at
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN users u ON a.author_id = u.id
      ${whereSql}
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [articles] = await pool.query(dataSql, [...queryParams, limitNum, offset]);

    return res.status(200).json({
      success: true,
      count: articles.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
      data: articles,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve single article by slug or numeric id.
 * Public access.
 */
async function getArticleBySlugOrId(req, res, next) {
  try {
    const { slugOrId } = req.params;
    const isNumeric = /^\d+$/.test(slugOrId);

    const sql = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.content,
        a.cover_image,
        a.status,
        a.is_featured,
        a.is_breaking,
        a.views_count,
        a.author_id,
        u.name AS author_name,
        u.email AS author_email,
        u.avatar_url AS author_avatar,
        u.bio AS author_bio,
        a.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        a.department_id,
        d.name AS department_name,
        d.code AS department_code,
        a.published_at,
        a.created_at,
        a.updated_at
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE ${isNumeric ? 'a.id = ? OR a.slug = ?' : 'a.slug = ?'}
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, isNumeric ? [slugOrId, slugOrId] : [slugOrId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
      });
    }

    const article = rows[0];

    // Access control for non-published articles
    if (article.status !== 'published') {
      if (!req.user) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      const isPrivileged = ['super_admin', 'editor'].includes(req.user.role);
      const isAuthor = req.user.id === article.author_id;

      if (!isPrivileged && !isAuthor) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have permission to preview this draft article',
        });
      }
    }

    // Increment views_count for published articles
    if (article.status === 'published') {
      await pool.query('UPDATE articles SET views_count = views_count + 1 WHERE id = ?', [article.id]);
      article.views_count += 1;
    }

    // Attach taxonomy tags if any
    try {
      const [tagRows] = await pool.query(
        `SELECT t.id, t.name, t.slug 
         FROM tags t 
         JOIN article_tags at ON t.id = at.tag_id 
         WHERE at.article_id = ?`,
        [article.id]
      );
      article.tags = tagRows || [];
    } catch {
      article.tags = [];
    }

    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new article.
 * Protected: super_admin, editor, reporter.
 */
async function createArticle(req, res, next) {
  try {
    const {
      title,
      summary,
      excerpt,
      content,
      cover_image,
      featured_image,
      category_id,
      department_id,
      is_featured = false,
      is_breaking = false,
      status: requestedStatus,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Article title is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Article content is required' });
    }

    if (!category_id) {
      return res.status(400).json({ success: false, error: 'Category ID is required' });
    }

    const finalSummary = summary ? summary.trim() : (excerpt ? excerpt.trim() : null);
    const finalCover = cover_image ? cover_image.trim() : (featured_image ? featured_image.trim() : null);
    const finalDept = department_id || req.user.department_id || null;
    const authorId = req.user.id;

    // Workflow permissions for status
    let finalStatus = 'draft';
    const isEditorial = ['super_admin', 'editor'].includes(req.user.role);

    if (isEditorial) {
      if (requestedStatus) {
        finalStatus = requestedStatus === 'pending_review' ? 'under_review' : requestedStatus;
      } else {
        finalStatus = 'published';
      }
    } else {
      // Reporter role: can save as draft or submit for review
      if (requestedStatus === 'under_review' || requestedStatus === 'pending_review') {
        finalStatus = 'under_review';
      } else {
        finalStatus = 'draft';
      }
    }

    const publishedAt = finalStatus === 'published' ? new Date() : null;
    const uniqueSlug = await generateUniqueSlug(title.trim());

    const [result] = await pool.query(
      `INSERT INTO articles (
        title, slug, summary, content, cover_image, status,
        is_featured, is_breaking, views_count, author_id,
        category_id, department_id, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        title.trim(),
        uniqueSlug,
        finalSummary,
        content.trim(),
        finalCover,
        finalStatus,
        is_featured ? 1 : 0,
        is_breaking ? 1 : 0,
        authorId,
        category_id,
        finalDept,
        publishedAt,
      ]
    );

    const [createdRows] = await pool.query(
      `SELECT 
         a.id, a.title, a.slug, a.summary, a.status, a.is_featured,
         a.is_breaking, a.views_count, a.published_at, a.created_at,
         c.name AS category_name, d.name AS department_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: createdRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing article.
 * Protected: verifyToken.
 */
async function updateArticle(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      excerpt,
      content,
      cover_image,
      featured_image,
      category_id,
      department_id,
      is_featured,
      is_breaking,
      status: requestedStatus,
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM articles WHERE id = ? LIMIT 1', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const currentArticle = existing[0];
    const isEditorial = ['super_admin', 'editor'].includes(req.user.role);
    const isAuthor = req.user.id === currentArticle.author_id;

    // Authorization checks
    if (!isEditorial && !isAuthor) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to edit this article',
      });
    }

    // Reporters can only edit drafts or under_review articles
    if (!isEditorial && currentArticle.status === 'published') {
      return res.status(403).json({
        success: false,
        error: 'Reporters cannot edit published articles. Contact an editor for updates.',
      });
    }

    // Compute updated values
    let updatedSlug = currentArticle.slug;
    if (title && title.trim() !== currentArticle.title) {
      updatedSlug = await generateUniqueSlug(title.trim(), id);
    }

    let updatedStatus = currentArticle.status;
    let publishedAt = currentArticle.published_at;

    if (requestedStatus) {
      const normalized = requestedStatus === 'pending_review' ? 'under_review' : requestedStatus;
      if (isEditorial) {
        updatedStatus = normalized;
        if (updatedStatus === 'published' && !publishedAt) {
          publishedAt = new Date();
        }
      } else {
        // Reporter
        if (['draft', 'under_review'].includes(normalized)) {
          updatedStatus = normalized;
        }
      }
    }

    const updatedTitle = title !== undefined ? title.trim() : currentArticle.title;
    const updatedSummary = summary !== undefined ? (summary ? summary.trim() : null) : (excerpt !== undefined ? (excerpt ? excerpt.trim() : null) : currentArticle.summary);
    const updatedContent = content !== undefined ? content.trim() : currentArticle.content;
    const updatedCover = cover_image !== undefined ? (cover_image ? cover_image.trim() : null) : (featured_image !== undefined ? (featured_image ? featured_image.trim() : null) : currentArticle.cover_image);
    const updatedCat = category_id !== undefined ? category_id : currentArticle.category_id;
    const updatedDept = department_id !== undefined ? department_id : currentArticle.department_id;
    const updatedFeatured = is_featured !== undefined ? (is_featured ? 1 : 0) : currentArticle.is_featured;
    const updatedBreaking = is_breaking !== undefined ? (is_breaking ? 1 : 0) : currentArticle.is_breaking;

    // Automatic revision snapshot before applying updates (Task 83)
    try {
      const changeSummary = req.body.change_summary || (title && title.trim() !== currentArticle.title ? `Updated title to "${title.trim().slice(0, 50)}"` : 'Editorial revision snapshot');
      await pool.query(
        `INSERT INTO article_revisions (article_id, editor_id, title, content, excerpt, change_summary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          currentArticle.id,
          req.user ? req.user.id : null,
          currentArticle.title,
          currentArticle.content,
          currentArticle.summary,
          changeSummary,
        ]
      );
    } catch (revErr) {
      console.warn('Failed to snapshot article revision:', revErr.message);
    }

    await pool.query(
      `UPDATE articles SET
        title = ?, slug = ?, summary = ?, content = ?, cover_image = ?,
        status = ?, is_featured = ?, is_breaking = ?, category_id = ?,
        department_id = ?, published_at = ?
       WHERE id = ?`,
      [
        updatedTitle,
        updatedSlug,
        updatedSummary,
        updatedContent,
        updatedCover,
        updatedStatus,
        updatedFeatured,
        updatedBreaking,
        updatedCat,
        updatedDept,
        publishedAt,
        id,
      ]
    );

    const [updatedRows] = await pool.query(
      `SELECT 
         a.id, a.title, a.slug, a.summary, a.status, a.is_featured,
         a.is_breaking, a.views_count, a.published_at, a.updated_at,
         c.name AS category_name, d.name AS department_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve revision history for an article ordered by created_at DESC with editor name.
 * Protected: super_admin, editor only.
 */
async function getArticleRevisions(req, res, next) {
  try {
    const { id } = req.params;

    const [articleRows] = await pool.query('SELECT id, title FROM articles WHERE id = ? LIMIT 1', [id]);
    if (articleRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const [revisions] = await pool.query(
      `SELECT 
         r.id,
         r.article_id,
         r.editor_id,
         u.name AS editor_name,
         u.email AS editor_email,
         r.title,
         r.content,
         r.excerpt,
         r.change_summary,
         r.created_at
       FROM article_revisions r
       LEFT JOIN users u ON r.editor_id = u.id
       WHERE r.article_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      count: revisions.length,
      data: revisions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an article.
 * Protected: super_admin, editor only.
 */
async function deleteArticle(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, title FROM articles WHERE id = ? LIMIT 1', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Cascade handles comments and image mappings
    await pool.query('DELETE FROM articles WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Article '${existing[0].title}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllArticles,
  getArticleBySlugOrId,
  createArticle,
  updateArticle,
  getArticleRevisions,
  deleteArticle,
};
