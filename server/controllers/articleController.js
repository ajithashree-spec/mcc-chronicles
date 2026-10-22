const pool = require('../config/db');
const sseService = require('../services/sseService');

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

    // Attach multi-author byline contributors (Task 99)
    try {
      const [authorRows] = await pool.query(
        `SELECT 
           aa.id, aa.user_id, aa.role_in_article,
           u.name, u.email, u.avatar_url, u.bio
         FROM article_authors aa
         JOIN users u ON aa.user_id = u.id
         WHERE aa.article_id = ?
         ORDER BY aa.id ASC`,
        [article.id]
      );

      if (authorRows && authorRows.length > 0) {
        article.authors = authorRows;
      } else {
        article.authors = [
          {
            user_id: article.author_id,
            name: article.author_name || 'Staff Reporter',
            email: article.author_email,
            avatar_url: article.author_avatar,
            bio: article.author_bio,
            role_in_article: 'Lead Reporter',
          },
        ];
      }
    } catch {
      article.authors = [
        {
          user_id: article.author_id,
          name: article.author_name || 'Staff Reporter',
          email: article.author_email,
          avatar_url: article.author_avatar,
          bio: article.author_bio,
          role_in_article: 'Lead Reporter',
        },
      ];
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
      category,
      category_name,
      department_id,
      department,
      department_slug,
      is_featured = false,
      is_breaking = false,
      status: requestedStatus,
      scheduled_at,
      contributors,
      author_name,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Article title is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Article content is required' });
    }

    // 1. Resolve Category ID (supports numeric ID, category slug, or name like 'Research', 'Academics')
    let resolvedCategoryId = category_id ? parseInt(category_id, 10) : null;
    const catInput = category || category_name;

    if (!resolvedCategoryId && catInput) {
      if (typeof catInput === 'number' || /^\d+$/.test(catInput)) {
        resolvedCategoryId = parseInt(catInput, 10);
      } else {
        const catStr = String(catInput).trim();
        const catSlug = slugify(catStr);
        const [catRows] = await pool.query(
          'SELECT id FROM categories WHERE LOWER(name) = ? OR slug = ? LIMIT 1',
          [catStr.toLowerCase(), catSlug]
        );
        if (catRows.length > 0) {
          resolvedCategoryId = catRows[0].id;
        } else {
          // If custom category name provided, insert it or fallback
          try {
            const [newCat] = await pool.query(
              'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
              [catStr, catSlug, `${catStr} Dispatches and Coverage`]
            );
            resolvedCategoryId = newCat.insertId;
          } catch (insertCatErr) {
            const [fallback] = await pool.query('SELECT id FROM categories LIMIT 1');
            resolvedCategoryId = fallback[0]?.id || 1;
          }
        }
      }
    }

    if (!resolvedCategoryId) {
      // Fallback to default first category if not specified
      const [defaultCats] = await pool.query('SELECT id FROM categories ORDER BY id ASC LIMIT 1');
      if (defaultCats.length > 0) {
        resolvedCategoryId = defaultCats[0].id;
      } else {
        return res.status(400).json({ success: false, error: 'Category ID is required' });
      }
    }

    // 2. Resolve Department ID (supports ID, code like 'CHEM-AID', or slug like 'chem-aid')
    let resolvedDeptId = null;
    const deptInput = department_id || department || department_slug;
    if (deptInput) {
      if (typeof deptInput === 'number' || /^\d+$/.test(deptInput)) {
        resolvedDeptId = parseInt(deptInput, 10);
      } else {
        const deptStr = String(deptInput).trim().toLowerCase();
        const [deptRows] = await pool.query(
          'SELECT id FROM departments WHERE LOWER(code) = ? OR LOWER(name) = ? OR LOWER(name) LIKE ? LIMIT 1',
          [deptStr, deptStr, `%${deptStr}%`]
        );
        if (deptRows.length > 0) {
          resolvedDeptId = deptRows[0].id;
        }
      }
    }

    // Assign to selected department from dropdown, or fallback to user's assigned department
    const finalDept = resolvedDeptId || req.user.department_id || null;

    const finalSummary = (excerpt && excerpt.trim()) || (summary && summary.trim()) || null;
    const finalCover = (cover_image && cover_image.trim()) || (featured_image && featured_image.trim()) || null;
    const authorId = req.user.id;

    // Workflow permissions for status (Task 94)
    const isEditorial = ['super_admin', 'editor'].includes(req.user.role);
    let normalizedRequested = requestedStatus ? String(requestedStatus).toLowerCase().trim() : null;
    if (normalizedRequested === 'under_review' || normalizedRequested === 'pending_review') {
      normalizedRequested = 'in_review';
    }

    if (!isEditorial && (normalizedRequested === 'published' || normalizedRequested === 'scheduled')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Reporters cannot directly publish or schedule articles. Submit for editorial review instead.',
      });
    }

    let finalStatus = 'draft';
    if (isEditorial) {
      finalStatus = normalizedRequested || 'published';
    } else {
      if (['pitch', 'draft', 'in_review'].includes(normalizedRequested)) {
        finalStatus = normalizedRequested;
      } else {
        finalStatus = 'draft';
      }
    }

    let finalScheduledAt = null;
    if (finalStatus === 'scheduled' && scheduled_at) {
      finalScheduledAt = new Date(scheduled_at);
    }

    const publishedAt = finalStatus === 'published' ? new Date() : null;
    const uniqueSlug = await generateUniqueSlug(title.trim());

    const [result] = await pool.query(
      `INSERT INTO articles (
        title, slug, summary, content, cover_image, status,
        scheduled_at, is_featured, is_breaking, views_count, author_id,
        category_id, department_id, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        title.trim(),
        uniqueSlug,
        finalSummary,
        content.trim(),
        finalCover,
        finalStatus,
        finalScheduledAt,
        is_featured ? 1 : 0,
        is_breaking ? 1 : 0,
        authorId,
        resolvedCategoryId,
        finalDept,
        publishedAt,
      ]
    );

    // Multi-author byline attribution (Task 99)
    if (Array.isArray(contributors) && contributors.length > 0) {
      for (const contrib of contributors) {
        const cUserId = contrib.userId || contrib.user_id;
        const cRole = contrib.roleInArticle || contrib.role_in_article || 'Co-Author';
        if (cUserId) {
          try {
            await pool.query(
              'INSERT IGNORE INTO article_authors (article_id, user_id, role_in_article) VALUES (?, ?, ?)',
              [result.insertId, cUserId, cRole]
            );
          } catch (e) {
            console.warn('Failed to insert contributor:', e.message);
          }
        }
      }
    }

    const [createdRows] = await pool.query(
      `SELECT 
         a.id, a.title, a.slug, a.summary, a.summary AS excerpt, a.content, a.cover_image,
         a.status, a.scheduled_at, a.is_featured, a.is_breaking, a.views_count,
         a.published_at, a.created_at, a.author_id,
         COALESCE(?, u.name) AS author_name,
         a.category_id, c.name AS category_name, c.slug AS category_slug,
         a.department_id, d.name AS department_name, d.code AS department_code
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.id = ? LIMIT 1`,
      [author_name || null, result.insertId]
    );

    if (finalStatus === 'published') {
      try {
        sseService.broadcast('dispatch:published', {
          id: result.insertId,
          title: createdRows[0]?.title || title.trim(),
          slug: createdRows[0]?.slug,
          category: createdRows[0]?.category_name || 'Gazette Dispatch',
          published_at: createdRows[0]?.published_at || new Date().toISOString(),
        });
      } catch (sseErr) {
        console.warn('Failed to broadcast new published dispatch via SSE:', sseErr.message);
      }
    }

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
      scheduled_at,
      contributors,
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

    // Reporters can only edit drafts, pitches, or in_review articles
    if (!isEditorial && currentArticle.status === 'published') {
      return res.status(403).json({
        success: false,
        error: 'Reporters cannot edit published articles. Contact an editor for updates.',
      });
    }

    // Workflow permissions for status (Task 94)
    let updatedStatus = currentArticle.status;
    let publishedAt = currentArticle.published_at;
    let updatedScheduledAt = currentArticle.scheduled_at;

    if (requestedStatus) {
      let normalized = requestedStatus;
      if (normalized === 'under_review' || normalized === 'pending_review') {
        normalized = 'in_review';
      }

      if (!isEditorial && (normalized === 'published' || normalized === 'scheduled')) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Reporters cannot directly publish or schedule articles. Submit for editorial review instead.',
        });
      }

      if (isEditorial) {
        updatedStatus = normalized;
        if (updatedStatus === 'published' && !publishedAt) {
          publishedAt = new Date();
        } else if (updatedStatus !== 'published') {
          publishedAt = null;
        }
      } else {
        // Reporter
        if (['pitch', 'draft', 'in_review'].includes(normalized)) {
          updatedStatus = normalized;
        }
      }
    }

    if (scheduled_at !== undefined) {
      updatedScheduledAt = scheduled_at ? new Date(scheduled_at) : null;
    }

    const updatedTitle = title !== undefined ? title.trim() : currentArticle.title;
    const updatedSlug = (title && title.trim() !== currentArticle.title)
      ? await generateUniqueSlug(title.trim(), currentArticle.id)
      : currentArticle.slug;
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
        status = ?, scheduled_at = ?, is_featured = ?, is_breaking = ?, category_id = ?,
        department_id = ?, published_at = ?
       WHERE id = ?`,
      [
        updatedTitle,
        updatedSlug,
        updatedSummary,
        updatedContent,
        updatedCover,
        updatedStatus,
        updatedScheduledAt,
        updatedFeatured,
        updatedBreaking,
        updatedCat,
        updatedDept,
        publishedAt,
        id,
      ]
    );

    // Sync multi-author contributors if provided (Task 99)
    if (Array.isArray(contributors)) {
      await pool.query('DELETE FROM article_authors WHERE article_id = ?', [id]);
      for (const contrib of contributors) {
        const cUserId = contrib.userId || contrib.user_id;
        const cRole = contrib.roleInArticle || contrib.role_in_article || 'Co-Author';
        if (cUserId) {
          try {
            await pool.query(
              'INSERT IGNORE INTO article_authors (article_id, user_id, role_in_article) VALUES (?, ?, ?)',
              [id, cUserId, cRole]
            );
          } catch (e) {
            console.warn('Failed to insert contributor in updateArticle:', e.message);
          }
        }
      }
    }

    const [updatedRows] = await pool.query(
      `SELECT 
         a.id, a.title, a.slug, a.summary, a.status, a.scheduled_at, a.is_featured,
         a.is_breaking, a.views_count, a.published_at, a.updated_at,
         c.name AS category_name, d.name AS department_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );

    if (updatedStatus === 'published' && currentArticle.status !== 'published') {
      try {
        sseService.broadcast('dispatch:published', {
          id: parseInt(id, 10),
          title: updatedRows[0]?.title,
          slug: updatedRows[0]?.slug,
          category: updatedRows[0]?.category_name || 'Gazette Dispatch',
          published_at: updatedRows[0]?.published_at || new Date().toISOString(),
        });
      } catch (sseErr) {
        console.warn('Failed to broadcast updated published dispatch via SSE:', sseErr.message);
      }
    }

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

/**
 * Quick status transition (Task 94 & 96).
 * Protected: verifyToken.
 */
async function updateArticleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, scheduled_at } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const [existing] = await pool.query('SELECT * FROM articles WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const currentArticle = existing[0];
    const isEditorial = ['super_admin', 'editor'].includes(req.user.role);
    const isAuthor = req.user.id === currentArticle.author_id;

    if (!isEditorial && !isAuthor) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to transition this article status',
      });
    }

    let normalized = status;
    if (normalized === 'under_review' || normalized === 'pending_review') {
      normalized = 'in_review';
    }

    const validStatuses = ['pitch', 'draft', 'in_review', 'scheduled', 'published', 'archived'];
    if (!validStatuses.includes(normalized)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (!isEditorial && (normalized === 'published' || normalized === 'scheduled')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Reporters cannot directly publish or schedule articles. Submit for editorial review instead.',
      });
    }

    let publishedAt = currentArticle.published_at;
    let scheduledAt = currentArticle.scheduled_at;

    if (normalized === 'published') {
      publishedAt = new Date();
    } else if (normalized !== 'published') {
      publishedAt = null;
    }

    if (normalized === 'scheduled') {
      scheduledAt = scheduled_at ? new Date(scheduled_at) : (currentArticle.scheduled_at || new Date());
    } else if (scheduled_at !== undefined) {
      scheduledAt = scheduled_at ? new Date(scheduled_at) : null;
    }

    await pool.query(
      'UPDATE articles SET status = ?, scheduled_at = ?, published_at = ? WHERE id = ?',
      [normalized, scheduledAt, publishedAt, id]
    );

    const [updatedRows] = await pool.query(
      `SELECT 
         a.id, a.title, a.slug, a.status, a.scheduled_at, a.published_at,
         a.updated_at, c.name AS category_name, u.name AS author_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );

    if (normalized === 'published') {
      try {
        sseService.broadcast('dispatch:published', {
          id: parseInt(id, 10),
          title: updatedRows[0]?.title,
          slug: updatedRows[0]?.slug,
          category: updatedRows[0]?.category_name || 'Gazette Dispatch',
          published_at: updatedRows[0]?.published_at || new Date().toISOString(),
        });
      } catch (sseErr) {
        console.warn('Failed to broadcast status-updated published dispatch via SSE:', sseErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Article status updated to '${normalized}'`,
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually trigger scheduled article auto-publishing (Task 95).
 * Protected: super_admin only.
 */
async function processScheduled(req, res, next) {
  try {
    const { processScheduledArticles } = require('../services/cronScheduler');
    const publishedCount = await processScheduledArticles();

    return res.status(200).json({
      success: true,
      message: `Auto-publisher finished: ${publishedCount} dispatches published`,
      publishedCount,
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
  updateArticleStatus,
  getArticleRevisions,
  deleteArticle,
  processScheduled,
};
