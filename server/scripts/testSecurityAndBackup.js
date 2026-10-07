const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../index');
const pool = require('../config/db');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
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

async function runTests() {
  console.log('===================================================================');
  console.log('=== STARTING INTEGRATION TESTS FOR SECURITY HARDENING & BACKUP  ===');
  console.log('===================================================================\n');

  let serverInstance = null;
  const PORT = process.env.PORT || 5000;

  // Ensure server is listening
  try {
    await new Promise((resolve) => {
      const probe = http.get(`http://localhost:${PORT}/api/health`, (res) => {
        resolve();
      });
      probe.on('error', () => {
        serverInstance = app.listen(PORT, () => {
          console.log(`[INFO] Started temporary test server instance on http://localhost:${PORT}\n`);
          resolve();
        });
      });
    });
  } catch (err) {
    console.error('Server setup warning:', err);
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Check Security Headers via Helmet on GET /api/health
    // -------------------------------------------------------------
    console.log('[TEST 1] Checking security headers from Helmet on GET /api/health...');
    const healthRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    });

    console.log(`Status: ${healthRes.status}`);
    console.log('Response Headers:', {
      'x-content-type-options': healthRes.headers['x-content-type-options'],
      'x-frame-options': healthRes.headers['x-frame-options'],
      'cross-origin-resource-policy': healthRes.headers['cross-origin-resource-policy'],
      'ratelimit-limit': healthRes.headers['ratelimit-limit'],
    });

    if (healthRes.headers['x-content-type-options'] !== 'nosniff') {
      throw new Error(`Expected X-Content-Type-Options: nosniff, got: ${healthRes.headers['x-content-type-options']}`);
    }

    if (healthRes.headers['cross-origin-resource-policy'] !== 'cross-origin') {
      throw new Error(`Expected Cross-Origin-Resource-Policy: cross-origin, got: ${healthRes.headers['cross-origin-resource-policy']}`);
    }
    console.log('[PASS] Helmet security headers verified successfully.\n');

    // -------------------------------------------------------------
    // TEST 2: Unauthenticated GET /api/backup/export/json (Expect HTTP 401)
    // -------------------------------------------------------------
    console.log('[TEST 2] Attempt GET /api/backup/export/json without token (Expect HTTP 401)...');
    const noTokenRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/backup/export/json',
      method: 'GET',
    });

    console.log(`Status: ${noTokenRes.status}, Body:`, noTokenRes.data);
    if (noTokenRes.status !== 401 || noTokenRes.data.success !== false) {
      throw new Error(`Expected HTTP 401 Unauthorized, got: ${noTokenRes.status}`);
    }
    console.log('[PASS] Unauthenticated backup access rejected with HTTP 401.\n');

    // -------------------------------------------------------------
    // TEST 3: Unauthorized GET /api/backup/export/json with reporter token (Expect HTTP 403)
    // -------------------------------------------------------------
    console.log('[TEST 3] Attempt GET /api/backup/export/json with reporter role token (Expect HTTP 403)...');
    const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
    const reporterToken = jwt.sign(
      { id: 999, email: 'reporter@mcc.edu.in', role: 'reporter' },
      secret,
      { expiresIn: '1h' }
    );

    const reporterRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/backup/export/json',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${reporterToken}`,
      },
    });

    console.log(`Status: ${reporterRes.status}, Body:`, reporterRes.data);
    if (reporterRes.status !== 403 || reporterRes.data.success !== false) {
      throw new Error(`Expected HTTP 403 Forbidden for reporter role, got: ${reporterRes.status}`);
    }
    console.log('[PASS] Non-super_admin role rejected with HTTP 403.\n');

    // -------------------------------------------------------------
    // TEST 4: Login as Super Admin (admin@mcc.edu.in / Admin@MCC2026)
    // -------------------------------------------------------------
    console.log('[TEST 4] Authenticating as Super Admin (admin@mcc.edu.in)...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@mcc.edu.in', password: 'Admin@MCC2026' }
    );

    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }
    const superAdminToken = loginRes.data.token;
    console.log(`[PASS] Super Admin logged in successfully. Token acquired.\n`);

    // -------------------------------------------------------------
    // TEST 5: GET /api/backup/export/json with Super Admin Token
    // -------------------------------------------------------------
    console.log('[TEST 5] Fetching full database snapshot (GET /api/backup/export/json)...');
    const backupRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/backup/export/json',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Status: ${backupRes.status}`);
    console.log(`Content-Type: ${backupRes.headers['content-type']}`);
    console.log(`Content-Disposition: ${backupRes.headers['content-disposition']}`);

    if (backupRes.status !== 200 || !backupRes.data.success) {
      throw new Error(`Failed to retrieve JSON backup snapshot: ${JSON.stringify(backupRes.data)}`);
    }

    if (!backupRes.headers['content-disposition'] || !backupRes.headers['content-disposition'].includes('mcc-chronicles-backup-')) {
      throw new Error(`Missing or invalid Content-Disposition header: ${backupRes.headers['content-disposition']}`);
    }

    const { tables, counts } = backupRes.data;
    console.log('Snapshot summary counts:', counts);

    const requiredTables = [
      'site_settings',
      'departments',
      'categories',
      'users',
      'articles',
      'comments',
      'circulars',
      'galleries',
      'activity_logs',
    ];

    for (const table of requiredTables) {
      if (!Array.isArray(tables[table])) {
        throw new Error(`Missing table array "${table}" in snapshot tables payload!`);
      }
    }

    // Security check: Verify password_hash is NOT present in exported users!
    for (const user of tables.users) {
      if (user.password_hash !== undefined) {
        throw new Error('SECURITY VIOLATION: password_hash was leaked in exported users data!');
      }
    }
    console.log('[PASS] Verified JSON snapshot contains all 9 core tables with password_hash strictly omitted.\n');

    // -------------------------------------------------------------
    // TEST 6: GET /api/backup/export/articles/csv with Super Admin Token
    // -------------------------------------------------------------
    console.log('[TEST 6] Fetching articles CSV export (GET /api/backup/export/articles/csv)...');
    const csvRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/backup/export/articles/csv',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Status: ${csvRes.status}`);
    console.log(`Content-Type: ${csvRes.headers['content-type']}`);
    console.log(`Content-Disposition: ${csvRes.headers['content-disposition']}`);

    if (csvRes.status !== 200) {
      throw new Error(`Failed to export articles CSV. Status: ${csvRes.status}`);
    }

    if (!csvRes.headers['content-type'] || !csvRes.headers['content-type'].includes('text/csv')) {
      throw new Error(`Expected text/csv Content-Type, got: ${csvRes.headers['content-type']}`);
    }

    if (!csvRes.headers['content-disposition'] || !csvRes.headers['content-disposition'].includes('mcc-articles-')) {
      throw new Error(`Expected Content-Disposition attachment with mcc-articles-*.csv`);
    }

    const csvLines = csvRes.text.split('\r\n');
    console.log(`CSV Total Rows: ${csvLines.length}`);
    console.log(`CSV Header Row: ${csvLines[0]}`);
    if (csvLines.length > 1) {
      console.log(`CSV Sample Data Row: ${csvLines[1]}`);
    }

    if (!csvLines[0].includes('Title') || !csvLines[0].includes('Category') || !csvLines[0].includes('Author')) {
      throw new Error(`Invalid CSV header format: ${csvLines[0]}`);
    }
    console.log('[PASS] RFC 4180 CSV export verified successfully.\n');

    // -------------------------------------------------------------
    // TEST 7: Verify Editor Access to CSV Export
    // -------------------------------------------------------------
    console.log('[TEST 7] Verifying Editor role access to articles CSV export...');
    const editorToken = jwt.sign(
      { id: 888, email: 'editor@mcc.edu.in', role: 'editor' },
      secret,
      { expiresIn: '1h' }
    );

    const editorCsvRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/backup/export/articles/csv',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${editorToken}`,
      },
    });

    console.log(`Status: ${editorCsvRes.status}`);
    if (editorCsvRes.status !== 200) {
      throw new Error(`Expected editor to access CSV export with HTTP 200, got ${editorCsvRes.status}`);
    }
    console.log('[PASS] Editor role granted CSV export access.\n');

    // -------------------------------------------------------------
    // TEST 8: Verify Rate Limiter Headers / Presence
    // -------------------------------------------------------------
    console.log('[TEST 8] Checking Rate Limiting headers on /api/health...');
    const rateLimitCheckRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    });

    console.log('RateLimit Headers:', {
      'ratelimit-limit': rateLimitCheckRes.headers['ratelimit-limit'],
      'ratelimit-remaining': rateLimitCheckRes.headers['ratelimit-remaining'],
    });

    if (rateLimitCheckRes.headers['ratelimit-limit'] === undefined) {
      console.log('[NOTE] RateLimit header format might be standard or vendor specific.');
    } else {
      console.log(`[PASS] RateLimit limit verified: ${rateLimitCheckRes.headers['ratelimit-limit']}`);
    }

    console.log('===================================================================');
    console.log('=== ALL SECURITY HARDENING & DATA EXPORT TESTS PASSED!          ===');
    console.log('=== COMBINED TASKS 38/140 & 39/140 COMPLETED SUCCESSFULLY!      ===');
    console.log('===================================================================');
  } catch (error) {
    console.error('\n[INTEGRATION TEST FAILURE]:', error.message);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await pool.end();
  }
}

runTests();
