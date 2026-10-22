/**
 * Verification test suite for Tasks 105 through 120 (Phase 5 Closeout & Phase 6 Core Engine).
 *
 * Checks:
 * 1. Newsletter digest generator & dispatch endpoint (POST /api/subscribers/dispatch-digest)
 * 2. Analytics breakdown endpoint (GET /api/analytics/breakdown)
 * 3. Activity log pruning maintenance cron (pruneOldActivityLogs)
 * 4. HTTP Security Headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
 */
const http = require('http');
const pool = require('../config/db');
const { generateDigestHtml } = require('../services/newsletterService');
const { pruneOldActivityLogs } = require('../services/cronScheduler');

const API_HOST = '127.0.0.1';
const API_PORT = 5000;

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        host: API_HOST,
        port: API_PORT,
        method,
        path,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTasks105To120Tests() {
  console.log('========================================================================');
  console.log('EXECUTING VERIFICATION SUITE: TASKS 105 THROUGH 120');
  console.log('========================================================================\n');

  let passes = 0;
  let fails = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passes++;
    } else {
      console.error(`  [FAIL] ${message}`);
      fails++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. Authenticate as Super Admin
    // -------------------------------------------------------------
    console.log('[STEP 1] Authenticating Super Admin...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'admin@mcc.edu.in',
      password: 'Admin@MCC2026',
    });

    const token = loginRes.data?.token || loginRes.data?.data?.token;
    assert(
      loginRes.statusCode === 200 && Boolean(token),
      'Super Admin authentication returns HTTP 200 with JWT token'
    );

    // -------------------------------------------------------------
    // 2. Task 105: Newsletter Digest Compilation & Dispatch
    // -------------------------------------------------------------
    console.log('\n[STEP 2] Testing Newsletter Service Digest Compilation...');
    const [articles] = await pool.query('SELECT title, summary, slug FROM articles LIMIT 3');
    const digestHtml = generateDigestHtml(articles);
    assert(
      typeof digestHtml === 'string' && digestHtml.includes('Madras Christian College'),
      'generateDigestHtml() produces formatted HTML broadsheet digest'
    );

    console.log('[STEP 2b] Testing POST /api/subscribers/dispatch-digest...');
    const dispatchRes = await makeRequest(
      'POST',
      '/api/subscribers/dispatch-digest',
      { Authorization: `Bearer ${token}` },
      { subject: 'Broadsheet Weekly Gazette Digest [Automated Test]' }
    );

    assert(
      dispatchRes.statusCode === 200 && dispatchRes.data?.success === true,
      `POST /api/subscribers/dispatch-digest responds with HTTP 200 (digestSent: ${dispatchRes.data?.data?.digestSent})`
    );

    // Verify activity log entry for NEWSLETTER_DISPATCH
    const [logRows] = await pool.query(
      `SELECT action, details FROM activity_logs WHERE action = 'NEWSLETTER_DISPATCH' ORDER BY id DESC LIMIT 1`
    );
    assert(
      logRows.length > 0 && logRows[0].action === 'NEWSLETTER_DISPATCH',
      'Activity log recorded NEWSLETTER_DISPATCH audit event'
    );

    // -------------------------------------------------------------
    // 3. Tasks 111 & 112: Readership Analytics Breakdown Endpoint
    // -------------------------------------------------------------
    console.log('\n[STEP 3] Testing GET /api/analytics/breakdown...');
    const breakdownRes = await makeRequest(
      'GET',
      '/api/analytics/breakdown',
      { Authorization: `Bearer ${token}` }
    );

    assert(
      breakdownRes.statusCode === 200 && breakdownRes.data?.success === true,
      'GET /api/analytics/breakdown returns HTTP 200'
    );
    const breakdownData = breakdownRes.data?.data;
    assert(
      Array.isArray(breakdownData?.monthlyTrends) && breakdownData.monthlyTrends.length > 0,
      `Breakdown contains monthlyTrends array (${breakdownData?.monthlyTrends?.length} intervals)`
    );
    assert(
      Array.isArray(breakdownData?.categoryDistribution) && breakdownData.categoryDistribution.length > 0,
      `Breakdown contains categoryDistribution array (${breakdownData?.categoryDistribution?.length} desks)`
    );

    // -------------------------------------------------------------
    // 4. Task 118: Database Activity Log Maintenance Cron Pruning
    // -------------------------------------------------------------
    console.log('\n[STEP 4] Testing Database Log Maintenance Cron Pruning...');
    // Insert mock 100-day-old log row
    const [insertResult] = await pool.query(
      `INSERT INTO activity_logs (action, entity_type, details, created_at) 
       VALUES ('TEST_OLD_LOG', 'test', 'Simulated 100-day-old activity record', DATE_SUB(NOW(), INTERVAL 100 DAY))`
    );
    assert(insertResult.insertId > 0, 'Inserted simulated 100-day-old activity log for pruning test');

    const prunedCount = await pruneOldActivityLogs(90);
    assert(
      prunedCount >= 1,
      `pruneOldActivityLogs(90) successfully deleted ${prunedCount} aged log entries`
    );

    // -------------------------------------------------------------
    // 5. Task 119: Security Headers & Sanitization Verification
    // -------------------------------------------------------------
    console.log('\n[STEP 5] Testing Security Headers Enforcement on API...');
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.statusCode === 200, 'Health endpoint responds with HTTP 200');

    const headers = healthRes.headers;
    const hasFrameOptions = Boolean(headers['x-frame-options']);
    const hasContentTypeOptions = headers['x-content-type-options'] === 'nosniff';
    const hasReferrerPolicy = Boolean(headers['referrer-policy']);

    assert(
      hasFrameOptions,
      `X-Frame-Options header present (${headers['x-frame-options']})`
    );
    assert(
      hasContentTypeOptions,
      `X-Content-Type-Options header present (${headers['x-content-type-options']})`
    );
    assert(
      hasReferrerPolicy,
      `Referrer-Policy header present (${headers['referrer-policy']})`
    );

    console.log('\n========================================================================');
    console.log(`TEST RESULTS: ${passes} PASSED, ${fails} FAILED`);
    console.log('========================================================================');
  } catch (err) {
    console.error('Fatal test runner exception:', err);
    fails++;
  } finally {
    await pool.end();
    process.exit(fails > 0 ? 1 : 0);
  }
}

runTasks105To120Tests();
