const pool = require('../config/db');

/**
 * Retrieve comprehensive dashboard overview analytics and metrics.
 * Protected: authenticated staff (super_admin, editor, reporter, faculty).
 */
async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Platform-wide Overview Queries
    const [overviewRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_articles,
        COUNT(CASE WHEN status = 'published' THEN 1 END) AS published_articles,
        COUNT(CASE WHEN status IN ('under_review', 'pending_review') THEN 1 END) AS pending_articles,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_articles,
        COALESCE(SUM(views_count), 0) AS total_views
      FROM articles
    `);

    const [userCountRows] = await pool.query(`
      SELECT COUNT(*) AS total_users FROM users WHERE is_active = 1
    `);

    const [commentCountRows] = await pool.query(`
      SELECT COUNT(*) AS pending_comments FROM comments WHERE status = 'pending' OR is_approved = 0
    `);

    const overview = {
      total_articles: Number(overviewRows[0].total_articles) || 0,
      published_articles: Number(overviewRows[0].published_articles) || 0,
      pending_articles: Number(overviewRows[0].pending_articles) || 0,
      draft_articles: Number(overviewRows[0].draft_articles) || 0,
      total_views: Number(overviewRows[0].total_views) || 0,
      total_users: Number(userCountRows[0].total_users) || 0,
      pending_comments: Number(commentCountRows[0].pending_comments) || 0,
    };

    // 2. Department-wise Breakdown
    const [departmentBreakdown] = await pool.query(`
      SELECT 
        d.id,
        d.name,
        d.code,
        COUNT(a.id) AS article_count,
        COALESCE(SUM(a.views_count), 0) AS total_views
      FROM departments d
      LEFT JOIN articles a ON a.department_id = d.id
      GROUP BY d.id, d.name, d.code
      ORDER BY article_count DESC, total_views DESC
    `);

    const formattedDepartmentBreakdown = departmentBreakdown.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      article_count: Number(dept.article_count) || 0,
      total_views: Number(dept.total_views) || 0,
    }));

    // 3. Top 5 Most Viewed Articles
    const [topArticles] = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.views_count,
        a.published_at,
        c.name AS category_name,
        d.name AS department_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.status = 'published'
      ORDER BY a.views_count DESC
      LIMIT 5
    `);

    // 4. Personal Metrics for the requesting user
    let myMetrics = null;
    const [myMetricsRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total_authored,
         COUNT(CASE WHEN status = 'published' THEN 1 END) AS published_count,
         COUNT(CASE WHEN status IN ('under_review', 'pending_review') THEN 1 END) AS pending_count,
         COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_count,
         COALESCE(SUM(views_count), 0) AS total_views
       FROM articles
       WHERE author_id = ?`,
      [userId]
    );

    if (myMetricsRows.length > 0) {
      myMetrics = {
        total_authored: Number(myMetricsRows[0].total_authored) || 0,
        published_count: Number(myMetricsRows[0].published_count) || 0,
        pending_count: Number(myMetricsRows[0].pending_count) || 0,
        draft_count: Number(myMetricsRows[0].draft_count) || 0,
        total_views: Number(myMetricsRows[0].total_views) || 0,
      };
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        overview,
        topArticles,
        departmentBreakdown: formattedDepartmentBreakdown,
        myMetrics,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
};
