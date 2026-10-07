const http = require('http');
const app = require('../index');
const pool = require('../config/db');

function makeRequest(port, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
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

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function testArticleEndpoints() {
  console.log('========================================================================');
  console.log('=== VERIFYING ARTICLE SLUG & COMMENTS ENDPOINTS (TASKS 55-57)        ===');
  console.log('========================================================================\n');

  let server;
  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    // 1. Get an existing published article
    const [articles] = await pool.query(
      "SELECT id, slug, title, views_count FROM articles WHERE status = 'published' LIMIT 1"
    );

    if (articles.length === 0) {
      console.log('No published articles found in database. Skipping live endpoint hit.');
      server.close();
      process.exit(0);
    }

    const testArticle = articles[0];
    const initialViews = testArticle.views_count || 0;
    console.log(`[TEST 1] Testing GET /api/articles/slug/${testArticle.slug}...`);

    const resArticle = await makeRequest(port, 'GET', `/api/articles/slug/${testArticle.slug}`);

    if (resArticle.status !== 200 || !resArticle.data?.success || !resArticle.data?.data) {
      throw new Error(`Failed to retrieve article by slug. Status: ${resArticle.status}, Body: ${resArticle.text}`);
    }
    console.log(`[PASS] Successfully retrieved: "${resArticle.data.data.title}"`);
    console.log(`       Views count incremented: ${initialViews} -> ${resArticle.data.data.views_count}\n`);

    // 2. Test GET /api/articles/:id/comments
    console.log(`[TEST 2] Testing GET /api/articles/${testArticle.id}/comments...`);
    const resComments = await makeRequest(port, 'GET', `/api/articles/${testArticle.id}/comments`);

    if (resComments.status !== 200 || !resComments.data?.success || !Array.isArray(resComments.data?.data)) {
      throw new Error(`Failed to retrieve comments. Status: ${resComments.status}, Body: ${resComments.text}`);
    }
    console.log(`[PASS] Successfully retrieved comments list. Current count: ${resComments.data.data.length}\n`);

    // 3. Test POST /api/articles/:id/comments
    console.log(`[TEST 3] Testing POST /api/articles/${testArticle.id}/comments...`);
    const commentPayload = {
      author_name: 'Dr. John Miller',
      author_email: 'jmiller@mcc.edu.in',
      content: 'A fitting tribute to the academic traditions of Madras Christian College.',
    };

    const resPostComment = await makeRequest(port, 'POST', `/api/articles/${testArticle.id}/comments`, commentPayload);

    if (resPostComment.status !== 201 || !resPostComment.data?.success || !resPostComment.data?.data) {
      throw new Error(`Failed to post comment. Status: ${resPostComment.status}, Body: ${resPostComment.text}`);
    }
    const createdId = resPostComment.data.data.id;
    console.log(`[PASS] Comment submitted successfully. New comment ID: ${createdId}\n`);

    // 4. Verify the comment appears in GET /api/articles/:id/comments
    console.log(`[TEST 4] Verifying created comment in GET /api/articles/${testArticle.id}/comments...`);
    const resCommentsUpdated = await makeRequest(port, 'GET', `/api/articles/${testArticle.id}/comments`);

    const found = resCommentsUpdated.data.data.find((c) => c.id === createdId);
    if (!found) {
      throw new Error('Newly created comment not found in comments list');
    }
    console.log(`[PASS] Comment verified in active correspondence thread.\n`);

    // Clean up test comment
    await pool.query('DELETE FROM comments WHERE id = ?', [createdId]);
    console.log('[CLEANUP] Test comment removed.\n');

    console.log('========================================================================');
    console.log('=== ALL ARTICLE & COMMENT ENDPOINT TESTS PASSED                      ===');
    console.log('========================================================================');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('[TEST FAILURE]:', error.message);
    if (server) server.close();
    process.exit(1);
  }
}

testArticleEndpoints();
