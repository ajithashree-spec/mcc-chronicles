const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../index');
const pool = require('../config/db');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const headers = { ...options.headers };
    let payload = null;

    if (body) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({ ...options, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, text: data, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: null, text: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTasks97To100Tests() {
  console.log('===========================================================================');
  console.log('=== BACKEND INTEGRATION TEST SUITE: TASKS 97, 98, 99 & 100/140          ===');
  console.log('=== (BOOKMARKS CLOUD SYNC, PITCH ASSIGNMENTS & MULTI-AUTHOR BYLINES)    ===');
  console.log('===========================================================================\n');

  let serverInstance = null;
  const PORT = process.env.PORT || 5000;
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
      failed++;
    }
  }

  let cleanupArticleIds = [];
  let cleanupAssignmentIds = [];
  let cleanupUserIds = [];

  try {
    // 1. Verify Database Schema (Task 97, 98, 99)
    console.log('[STEP 1] Database Tables & Schema Verification');
    
    // a) Table: bookmarks
    const [bmCols] = await pool.query('DESCRIBE bookmarks');
    const bmFields = bmCols.map((c) => c.Field);
    assert(bmFields.includes('id'), "Table 'bookmarks' has 'id'");
    assert(bmFields.includes('user_id'), "Table 'bookmarks' has 'user_id'");
    assert(bmFields.includes('article_id'), "Table 'bookmarks' has 'article_id'");
    assert(bmFields.includes('created_at'), "Table 'bookmarks' has 'created_at'");

    // b) Table: article_assignments
    const [aaCols] = await pool.query('DESCRIBE article_assignments');
    const aaFields = aaCols.map((c) => c.Field);
    assert(aaFields.includes('id'), "Table 'article_assignments' has 'id'");
    assert(aaFields.includes('title'), "Table 'article_assignments' has 'title'");
    assert(aaFields.includes('brief'), "Table 'article_assignments' has 'brief'");
    assert(aaFields.includes('assigned_to'), "Table 'article_assignments' has 'assigned_to'");
    assert(aaFields.includes('assigned_by'), "Table 'article_assignments' has 'assigned_by'");
    assert(aaFields.includes('department_id'), "Table 'article_assignments' has 'department_id'");
    assert(aaFields.includes('deadline'), "Table 'article_assignments' has 'deadline'");
    assert(aaFields.includes('status'), "Table 'article_assignments' has 'status'");

    // c) Table: article_authors
    const [authCols] = await pool.query('DESCRIBE article_authors');
    const authFields = authCols.map((c) => c.Field);
    assert(authFields.includes('id'), "Table 'article_authors' has 'id'");
    assert(authFields.includes('article_id'), "Table 'article_authors' has 'article_id'");
    assert(authFields.includes('user_id'), "Table 'article_authors' has 'user_id'");
    assert(authFields.includes('role_in_article'), "Table 'article_authors' has 'role_in_article'");

    // 2. Ensure test server is listening
    await new Promise((resolve) => {
      const probe = http.get(`http://localhost:${PORT}/api/health`, () => resolve());
      probe.on('error', () => {
        serverInstance = app.listen(PORT, () => {
          console.log(`[INFO] Started test server instance on http://localhost:${PORT}\n`);
          resolve();
        });
      });
    });

    // 3. Super Admin Authentication
    console.log('\n[STEP 2] Authentication & Test User Setup');
    const adminLoginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: 'admin@mcc.edu.in',
      password: 'Admin@MCC2026',
    });

    assert(adminLoginRes.status === 200, 'Super admin authenticated successfully');
    const adminToken = adminLoginRes.data?.token;
    const adminUser = adminLoginRes.data?.user;
    assert(Boolean(adminToken), 'JWT token issued to super admin');

    // Create a temporary reporter user for assignment & byline tests
    const reporterEmail = `test_reporter_${Date.now()}@mcc.edu.in`;
    const [createdReporter] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active, bio)
       VALUES (?, ?, ?, 'reporter', 1, 'Student journalist reporting from Selaiyur Hall.')`,
      ['Priya Ramanathan', reporterEmail, '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890']
    );
    const reporterId = createdReporter.insertId;
    cleanupUserIds.push(reporterId);
    console.log(`  ✓ Created test reporter: Priya Ramanathan (ID: ${reporterId})`);

    // Reporter token for reporter authorization checks
    const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
    const reporterToken = jwt.sign(
      { id: reporterId, email: reporterEmail, role: 'reporter' },
      secret,
      { expiresIn: '1h' }
    );

    // Get an existing category
    const [catRows] = await pool.query('SELECT id FROM categories LIMIT 1');
    const categoryId = catRows[0]?.id || 1;

    // 4. Test Task 97: Article Bookmarking Cloud Sync API
    console.log('\n[STEP 3] Testing Task 97: Bookmarking Cloud Sync API');

    // Create a temporary test article
    const [testArt] = await pool.query(
      `INSERT INTO articles (title, slug, summary, content, status, author_id, category_id, published_at)
       VALUES (?, ?, ?, ?, 'published', ?, ?, NOW())`,
      [
        `Milestone 100 Archival Dispatch ${Date.now()}`,
        `milestone-100-archival-dispatch-${Date.now()}`,
        'Summary for cloud bookmarking test.',
        'Extensive body text for archival testing purposes.',
        adminUser.id,
        categoryId,
      ]
    );
    const testArticleId = testArt.insertId;
    cleanupArticleIds.push(testArticleId);

    // Toggle bookmark ON
    const toggleOnRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/bookmarks/toggle',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { articleId: testArticleId });

    assert(toggleOnRes.status === 201 || toggleOnRes.status === 200, 'POST /api/bookmarks/toggle succeeded (add)');
    assert(toggleOnRes.data?.bookmarked === true, 'Response confirms article is bookmarked: true');

    // Retrieve user bookmarks
    const getBookmarksRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/bookmarks',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(getBookmarksRes.status === 200, 'GET /api/bookmarks succeeded');
    assert(Array.isArray(getBookmarksRes.data?.data), 'GET /api/bookmarks returned data array');
    const foundBookmark = getBookmarksRes.data.data.find((b) => b.id === testArticleId);
    assert(Boolean(foundBookmark), 'User bookmarks list contains newly bookmarked article');
    assert(foundBookmark?.category_name !== undefined, 'Bookmarked article includes joined category metadata');
    assert(foundBookmark?.author_name !== undefined, 'Bookmarked article includes joined author metadata');

    // Toggle bookmark OFF
    const toggleOffRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/bookmarks/toggle',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { articleId: testArticleId });

    assert(toggleOffRes.status === 200, 'POST /api/bookmarks/toggle succeeded (remove)');
    assert(toggleOffRes.data?.bookmarked === false, 'Response confirms article is bookmarked: false');

    // Verify bookmark removed from list
    const getBookmarksAfterRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/bookmarks',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const foundAfter = getBookmarksAfterRes.data?.data?.find((b) => b.id === testArticleId);
    assert(!foundAfter, 'Article no longer in user bookmarks list');

    // 5. Test Task 98: Editorial Desk Assignment & Pitch Pipeline
    console.log('\n[STEP 4] Testing Task 98: Editorial Desk Assignment Pipeline');

    // Create assignment by editor/super_admin
    const createAssignRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/assignments',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: 'Investigation: Anderson Hall Heritage Restoration Timeline',
      brief: 'Interview campus architect, examine 1920s brickwork records, photograph east courtyard.',
      assigned_to: reporterId,
      deadline: '2026-11-15',
    });

    assert(createAssignRes.status === 201, 'POST /api/assignments created assignment (201 Created)');
    assert(createAssignRes.data?.success === true, 'Response success flag is true');
    const assignmentId = createAssignRes.data?.data?.id;
    assert(Boolean(assignmentId), 'Assignment ID returned in response');
    cleanupAssignmentIds.push(assignmentId);
    assert(createAssignRes.data.data.status === 'assigned', "Initial status is 'assigned'");
    assert(createAssignRes.data.data.assigned_to === reporterId, 'Assigned to correct reporter ID');

    // Reporter views assignments
    const getReporterAssignRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/assignments',
      method: 'GET',
      headers: { Authorization: `Bearer ${reporterToken}` },
    });

    assert(getReporterAssignRes.status === 200, 'GET /api/assignments succeeded for reporter');
    const reporterAssignments = getReporterAssignRes.data?.data || [];
    assert(
      reporterAssignments.some((a) => a.id === assignmentId),
      'Reporter sees the newly assigned brief'
    );

    // Reporter accepts assignment
    const acceptRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/assignments/${assignmentId}/status`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${reporterToken}` },
    }, { status: 'accepted' });

    assert(acceptRes.status === 200, "PATCH status to 'accepted' by reporter succeeded");
    assert(acceptRes.data?.data?.status === 'accepted', "Assignment status updated to 'accepted'");

    // Reporter submits assignment
    const submitRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/assignments/${assignmentId}/status`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${reporterToken}` },
    }, { status: 'submitted' });

    assert(submitRes.status === 200, "PATCH status to 'submitted' by reporter succeeded");
    assert(submitRes.data?.data?.status === 'submitted', "Assignment status updated to 'submitted'");

    // Editor marks assignment completed
    const completeRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/assignments/${assignmentId}/status`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { status: 'completed' });

    assert(completeRes.status === 200, "PATCH status to 'completed' by editor succeeded");
    assert(completeRes.data?.data?.status === 'completed', "Assignment status updated to 'completed'");

    // 6. Test Task 99: Multi-Author & Co-Contributor Byline Attribution
    console.log('\n[STEP 5] Testing Task 99: Multi-Author & Co-Contributor Bylines');

    // Create article with contributors
    const createMultiAuthorRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/articles',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: `Centennial Flora & Fauna Survey ${Date.now()}`,
      summary: 'Comprehensive multi-disciplinary ecological census across scrub jungle.',
      content: 'Detailed reporting, field taxonomy notes, and photographic plates from the botanical expedition.',
      category_id: categoryId,
      status: 'published',
      contributors: [
        { userId: reporterId, roleInArticle: 'Contributing Writer' },
      ],
    });

    assert(createMultiAuthorRes.status === 201, 'POST /api/articles created article with contributors');
    const multiAuthorArticleId = createMultiAuthorRes.data?.data?.id;
    const multiAuthorSlug = createMultiAuthorRes.data?.data?.slug;
    assert(Boolean(multiAuthorArticleId), 'Created multi-author article ID returned');
    cleanupArticleIds.push(multiAuthorArticleId);

    // Fetch article by slug and verify attached authors array
    const getMultiAuthorRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/articles/${multiAuthorSlug}`,
      method: 'GET',
    });

    assert(getMultiAuthorRes.status === 200, 'GET /api/articles/:slug retrieved multi-author article');
    const returnedArticle = getMultiAuthorRes.data?.data;
    assert(Array.isArray(returnedArticle?.authors), "Article includes 'authors' array");
    assert(returnedArticle.authors.length >= 1, 'Authors array contains credited contributors');
    const reporterContributor = returnedArticle.authors.find((a) => a.user_id === reporterId);
    assert(Boolean(reporterContributor), 'Credited reporter contributor present in authors array');
    assert(
      reporterContributor?.role_in_article === 'Contributing Writer',
      "Contributor role matched 'Contributing Writer'"
    );

    // Update article contributors to 'Staff Photographer'
    const updateMultiAuthorRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/articles/${multiAuthorArticleId}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: returnedArticle.title,
      contributors: [
        { userId: reporterId, roleInArticle: 'Staff Photographer' },
      ],
    });

    assert(updateMultiAuthorRes.status === 200, 'PUT /api/articles/:id updated contributors');

    // Verify updated contributor role
    const getUpdatedMultiAuthorRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/articles/${multiAuthorArticleId}`,
      method: 'GET',
    });

    const updatedAuthors = getUpdatedMultiAuthorRes.data?.data?.authors || [];
    const updatedPhotographer = updatedAuthors.find((a) => a.user_id === reporterId);
    assert(
      updatedPhotographer?.role_in_article === 'Staff Photographer',
      "Contributor role correctly synced to 'Staff Photographer'"
    );

    // 7. Comprehensive Regression Sweep: Phase 1 through Task 100
    console.log('\n[STEP 6] Phase 1 Through Task 100 Comprehensive Regression Sweep');
    
    // Health
    const healthRes = await request({ hostname: 'localhost', port: PORT, path: '/api/health', method: 'GET' });
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');

    // Public Articles
    const articlesRes = await request({ hostname: 'localhost', port: PORT, path: '/api/articles?limit=5', method: 'GET' });
    assert(articlesRes.status === 200, 'GET /api/articles returns 200 OK');

    // Categories
    const categoriesRes = await request({ hostname: 'localhost', port: PORT, path: '/api/categories', method: 'GET' });
    assert(categoriesRes.status === 200, 'GET /api/categories returns 200 OK');

    // Departments
    const departmentsRes = await request({ hostname: 'localhost', port: PORT, path: '/api/departments', method: 'GET' });
    assert(departmentsRes.status === 200, 'GET /api/departments returns 200 OK');

    // Circulars
    const circularsRes = await request({ hostname: 'localhost', port: PORT, path: '/api/circulars?limit=5', method: 'GET' });
    assert(circularsRes.status === 200, 'GET /api/circulars returns 200 OK');

    // Gallery
    const galleryRes = await request({ hostname: 'localhost', port: PORT, path: '/api/gallery?limit=5', method: 'GET' });
    assert(galleryRes.status === 200, 'GET /api/gallery returns 200 OK');

    // Tags
    const tagsRes = await request({ hostname: 'localhost', port: PORT, path: '/api/tags', method: 'GET' });
    assert(tagsRes.status === 200, 'GET /api/tags returns 200 OK');

    // Polls
    const pollsRes = await request({ hostname: 'localhost', port: PORT, path: '/api/polls/active', method: 'GET' });
    assert(pollsRes.status === 200, 'GET /api/polls/active returns 200 OK');

    // 8. Clean up temporary test data
    console.log('\n[CLEANUP] Purging test artifacts from database...');
    for (const artId of cleanupArticleIds) {
      await pool.query('DELETE FROM article_authors WHERE article_id = ?', [artId]);
      await pool.query('DELETE FROM bookmarks WHERE article_id = ?', [artId]);
      await pool.query('DELETE FROM article_revisions WHERE article_id = ?', [artId]);
      await pool.query('DELETE FROM articles WHERE id = ?', [artId]);
    }
    for (const assignId of cleanupAssignmentIds) {
      await pool.query('DELETE FROM article_assignments WHERE id = ?', [assignId]);
    }
    for (const uId of cleanupUserIds) {
      await pool.query('DELETE FROM users WHERE id = ?', [uId]);
    }
    console.log('  ✓ Cleaned up test articles, assignments, and test users.');

  } catch (error) {
    console.error('\n[FATAL ERROR IN TEST SUITE]:', error);
    failed++;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    console.log('\n===========================================================================');
    console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED                          ===`);
    console.log('===========================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTasks97To100Tests();
