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

async function runTasks93To96Tests() {
  console.log('===========================================================================');
  console.log('=== BACKEND INTEGRATION TEST SUITE: TASKS 93, 94, 95 & 96/140           ===');
  console.log('===========================================================================\n');

  let serverInstance = null;
  const PORT = process.env.PORT || 5000;
  const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';

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

  let createdArticleIds = [];
  let tempReporterId = null;

  try {
    // 1. Verify Database Schema (Task 94)
    console.log('[STEP 1] Database Schema & Column Verification (Task 94)');
    const [describeRows] = await pool.query('DESCRIBE articles');
    
    const scheduledAtCol = describeRows.find((c) => c.Field === 'scheduled_at');
    assert(Boolean(scheduledAtCol), "Column 'scheduled_at' exists in articles table");

    const statusCol = describeRows.find((c) => c.Field === 'status');
    assert(Boolean(statusCol), "Column 'status' exists in articles table");
    const statusTypeStr = String(statusCol?.Type || '');
    assert(statusTypeStr.includes('pitch'), "Status enum includes 'pitch'");
    assert(statusTypeStr.includes('draft'), "Status enum includes 'draft'");
    assert(statusTypeStr.includes('in_review'), "Status enum includes 'in_review'");
    assert(statusTypeStr.includes('scheduled'), "Status enum includes 'scheduled'");
    assert(statusTypeStr.includes('published'), "Status enum includes 'published'");
    assert(statusTypeStr.includes('archived'), "Status enum includes 'archived'");

    // 2. Start or check test server
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
    console.log('\n[STEP 2] Super Admin Authentication');
    const adminLoginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: 'admin@mcc.edu.in',
      password: 'Admin@MCC2026',
    });

    assert(adminLoginRes.status === 200, 'Super Admin login returns HTTP 200');
    const adminToken = adminLoginRes.data?.token;
    assert(Boolean(adminToken), 'Super Admin JWT token received');

    // 4. Create Temporary Reporter to Test Role Guards
    console.log('\n[STEP 3] Reporter Role Status Restriction Verification (Task 94)');
    const reporterEmail = `test.reporter.${Date.now()}@mcc.edu.in`;
    const reporterPass = 'ReporterPass@2026';

    const createReporterRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      name: 'Kanban Reporter Test',
      email: reporterEmail,
      password: reporterPass,
      role: 'reporter',
      department_id: 1,
    });

    assert(createReporterRes.status === 201, 'Created temporary reporter user');
    tempReporterId = createReporterRes.data?.data?.id;

    // Login as Reporter
    const reporterLoginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: reporterEmail,
      password: reporterPass,
    });
    const reporterToken = reporterLoginRes.data?.token;

    // Test: Reporter CANNOT create article with status = 'published' (HTTP 403)
    const reporterPublishAttempt = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/articles',
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}` },
    }, {
      title: 'Unauthorized Reporter Publish Attempt',
      content: 'Testing reporter workflow boundary.',
      category_id: 1,
      status: 'published',
    });
    assert(reporterPublishAttempt.status === 403, 'Reporter blocked from publishing directly with HTTP 403');

    // Test: Reporter CANNOT create article with status = 'scheduled' (HTTP 403)
    const reporterScheduleAttempt = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/articles',
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}` },
    }, {
      title: 'Unauthorized Reporter Schedule Attempt',
      content: 'Testing reporter workflow boundary.',
      category_id: 1,
      status: 'scheduled',
      scheduled_at: new Date().toISOString(),
    });
    assert(reporterScheduleAttempt.status === 403, 'Reporter blocked from scheduling directly with HTTP 403');

    // Test: Reporter CAN create article with status = 'pitch' or 'draft'
    const reporterPitchRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/articles',
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}` },
    }, {
      title: `Valid Reporter Story Pitch ${Date.now()}`,
      content: 'An investigative pitch for the collegiate gazette.',
      category_id: 1,
      status: 'pitch',
    });
    assert(reporterPitchRes.status === 201, 'Reporter can create article with status = pitch (HTTP 201)');
    assert(reporterPitchRes.data?.data?.status === 'pitch', 'Article status correctly saved as pitch');
    const reporterArticleId = reporterPitchRes.data?.data?.id;
    if (reporterArticleId) createdArticleIds.push(reporterArticleId);

    // 5. Scheduled Article Creation & Auto-Publisher (Task 95)
    console.log('\n[STEP 4] Scheduled Article Auto-Publisher Engine (Task 95)');
    const pastTimestamp = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago
    const scheduledArticleRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/articles',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      title: `Scheduled Dispatch Test ${Date.now()}`,
      summary: 'Story pre-scheduled for automatic release.',
      content: 'Full broadsheet text published by the background cron publisher.',
      category_id: 1,
      status: 'scheduled',
      scheduled_at: pastTimestamp,
    });

    assert(scheduledArticleRes.status === 201, 'Super Admin created scheduled article (HTTP 201)');
    const scheduledArticleId = scheduledArticleRes.data?.data?.id;
    assert(Boolean(scheduledArticleId), `Scheduled article ID: ${scheduledArticleId}`);
    if (scheduledArticleId) createdArticleIds.push(scheduledArticleId);

    // Verify it is currently 'scheduled'
    const [beforeCron] = await pool.query('SELECT status, published_at FROM articles WHERE id = ?', [scheduledArticleId]);
    assert(beforeCron[0]?.status === 'scheduled', "Article is initially in 'scheduled' status");
    assert(beforeCron[0]?.published_at === null, 'Article published_at is initially null');

    // Call POST /api/articles/process-scheduled
    console.log('\n[STEP 5] Trigger Scheduled Article Processing Endpoint');
    const cronProcessRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/articles/process-scheduled',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(cronProcessRes.status === 200, 'POST /api/articles/process-scheduled returns HTTP 200');
    assert(cronProcessRes.data?.publishedCount >= 1, `Auto-publisher reported publishedCount: ${cronProcessRes.data?.publishedCount}`);

    // Verify DB record status flipped to 'published' and published_at is set
    const [afterCron] = await pool.query('SELECT status, published_at FROM articles WHERE id = ?', [scheduledArticleId]);
    assert(afterCron[0]?.status === 'published', "Article status automatically flipped to 'published'");
    assert(Boolean(afterCron[0]?.published_at), 'Article published_at timestamp was set');

    // 6. Quick Status Transition API (PATCH /api/articles/:id/status)
    console.log('\n[STEP 6] Quick Status Transition Endpoint (PATCH /api/articles/:id/status)');
    const statusTransitionRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/articles/${scheduledArticleId}/status`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      status: 'archived',
    });

    assert(statusTransitionRes.status === 200, 'PATCH status transition returns HTTP 200');
    assert(statusTransitionRes.data?.data?.status === 'archived', "Status transitioned to 'archived'");

    // 7. Cleanup
    console.log('\n[STEP 7] Cleanup Test Records');
    for (const artId of createdArticleIds) {
      await pool.query('DELETE FROM articles WHERE id = ?', [artId]);
    }
    if (tempReporterId) {
      await pool.query('DELETE FROM users WHERE id = ?', [tempReporterId]);
    }
    console.log('  Cleaned up temporary articles and test reporter.');

    console.log('\n===========================================================================');
    console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await pool.end();
  }
}

runTasks93To96Tests();
