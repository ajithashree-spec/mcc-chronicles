const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { logActivity } = require('../utils/logger');
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
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, text: data, headers: res.headers });
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
  console.log('===========================================================');
  console.log('=== STARTING INTEGRATION TESTS FOR AUDIT LOGGING SYSTEM ===');
  console.log('===========================================================\n');

  let serverInstance = null;
  const PORT = process.env.PORT || 5000;

  // Check if server is already running, or spin it up
  try {
    await new Promise((resolve, reject) => {
      const probe = http.get(`http://localhost:${PORT}/api/health`, (res) => {
        resolve();
      });
      probe.on('error', () => {
        // Not running; start listening
        serverInstance = app.listen(PORT, () => {
          console.log(`[INFO] Started temporary test server instance on http://localhost:${PORT}\n`);
          resolve();
        });
      });
    });
  } catch (err) {
    console.error('Server setup error:', err);
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated GET /api/audit (Verify HTTP 401 Rejection)
    // -------------------------------------------------------------
    console.log('[TEST 1] Attempt GET /api/audit without token (Expect HTTP 401)...');
    const noTokenRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit',
      method: 'GET',
    });

    console.log(`Status: ${noTokenRes.status}, Body:`, noTokenRes.data);
    if (noTokenRes.status !== 401 || noTokenRes.data.success !== false) {
      throw new Error(`Expected HTTP 401 Unauthorized, but got ${noTokenRes.status}`);
    }
    console.log('[PASS] Unauthenticated access properly rejected with HTTP 401.\n');

    // -------------------------------------------------------------
    // TEST 2: Role Authorization (Forbidden for non-super_admin)
    // -------------------------------------------------------------
    console.log('[TEST 2] Attempt GET /api/audit with reporter role token (Expect HTTP 403)...');
    const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
    const reporterToken = jwt.sign(
      { id: 999, email: 'reporter@mcc.edu.in', role: 'reporter' },
      secret,
      { expiresIn: '1h' }
    );
    const forbiddenRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${reporterToken}`,
      },
    });

    console.log(`Status: ${forbiddenRes.status}, Body:`, forbiddenRes.data);
    if (forbiddenRes.status !== 403 || forbiddenRes.data.success !== false) {
      throw new Error(`Expected HTTP 403 Forbidden for non-super_admin, but got ${forbiddenRes.status}`);
    }
    console.log('[PASS] Non-super_admin access properly rejected with HTTP 403.\n');

    // -------------------------------------------------------------
    // TEST 3: Login as Super Admin (admin@mcc.edu.in / Admin@MCC2026)
    // -------------------------------------------------------------
    console.log('[TEST 3] Logging in as Super Admin (admin@mcc.edu.in)...');
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
      throw new Error(`Super Admin login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const superAdminToken = loginRes.data.token;
    const superAdminUser = loginRes.data.user;
    console.log(`[PASS] Logged in successfully as: ${superAdminUser.name} (${superAdminUser.role})`);
    console.log(`Token acquired: ${superAdminToken.substring(0, 20)}...\n`);

    // -------------------------------------------------------------
    // TEST 4: Directly invoke logActivity helper to generate audit log records
    // -------------------------------------------------------------
    console.log('[TEST 4] Invoking logActivity helper directly for custom actions...');
    await logActivity({
      userId: superAdminUser.id,
      action: 'ARTICLE_PUBLISH',
      entityType: 'article',
      entityId: 101,
      details: { title: 'MCC Celebrates 187th Anniversary', status: 'published' },
      ipAddress: '127.0.0.1',
    });

    await logActivity({
      userId: superAdminUser.id,
      action: 'SETTINGS_UPDATE',
      entityType: 'setting',
      entityId: null,
      details: { setting_key: 'site_title', setting_value: 'Madras Christian College Chronicles' },
      ipAddress: '192.168.1.50',
    });

    await logActivity({
      userId: superAdminUser.id,
      action: 'USER_CREATE',
      entityType: 'user',
      entityId: 202,
      details: { new_user_email: 'newreporter@mcc.edu.in', assigned_role: 'reporter' },
      ipAddress: '10.0.0.1',
    });
    console.log('[PASS] Helper logActivity successfully generated audit log entries.\n');

    // -------------------------------------------------------------
    // TEST 5: GET /api/audit with Super Admin Token
    // -------------------------------------------------------------
    console.log('[TEST 5] Fetching audit logs via GET /api/audit with Super Admin token...');
    const auditRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Status: ${auditRes.status}`);
    console.log(`Success: ${auditRes.data.success}, Count: ${auditRes.data.count}, Total: ${auditRes.data.total}`);

    if (auditRes.status !== 200 || !auditRes.data.success) {
      throw new Error(`Failed to retrieve audit logs: ${JSON.stringify(auditRes.data)}`);
    }

    if (!Array.isArray(auditRes.data.data) || auditRes.data.data.length === 0) {
      throw new Error('Expected at least one audit log record returned.');
    }

    const firstLog = auditRes.data.data[0];
    console.log('Most recent audit entry:', {
      id: firstLog.id,
      user_id: firstLog.user_id,
      action: firstLog.action,
      entity_type: firstLog.entity_type,
      user_name: firstLog.user_name,
      user_email: firstLog.user_email,
      created_at: firstLog.created_at,
    });

    if (!firstLog.user_name || !firstLog.user_email) {
      throw new Error('Expected joined user fields (user_name, user_email) to be populated.');
    }
    console.log('[PASS] Successfully retrieved audit logs with joined user details.\n');

    // -------------------------------------------------------------
    // TEST 6: Filter by action (GET /api/audit?action=ARTICLE_PUBLISH)
    // -------------------------------------------------------------
    console.log('[TEST 6] Filter audit logs by action (action=ARTICLE_PUBLISH)...');
    const filterActionRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit?action=ARTICLE_PUBLISH',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Status: ${filterActionRes.status}, Count: ${filterActionRes.data.count}`);
    if (filterActionRes.status !== 200 || !filterActionRes.data.success) {
      throw new Error(`Failed action filtering: ${JSON.stringify(filterActionRes.data)}`);
    }

    const nonMatchingAction = filterActionRes.data.data.find(
      (log) => log.action.toUpperCase() !== 'ARTICLE_PUBLISH'
    );
    if (nonMatchingAction) {
      throw new Error(`Found unexpected action in filtered results: ${nonMatchingAction.action}`);
    }
    console.log('[PASS] Filter by action verified successfully.\n');

    // -------------------------------------------------------------
    // TEST 7: Filter by entity_type (GET /api/audit?entity_type=setting)
    // -------------------------------------------------------------
    console.log('[TEST 7] Filter audit logs by entity_type (entity_type=setting)...');
    const filterEntityRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit?entity_type=setting',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Status: ${filterEntityRes.status}, Count: ${filterEntityRes.data.count}`);
    if (filterEntityRes.status !== 200 || !filterEntityRes.data.success) {
      throw new Error(`Failed entity_type filtering: ${JSON.stringify(filterEntityRes.data)}`);
    }

    const nonMatchingEntity = filterEntityRes.data.data.find(
      (log) => log.entity_type.toLowerCase() !== 'setting'
    );
    if (nonMatchingEntity) {
      throw new Error(`Found unexpected entity_type in filtered results: ${nonMatchingEntity.entity_type}`);
    }
    console.log('[PASS] Filter by entity_type verified successfully.\n');

    // -------------------------------------------------------------
    // TEST 8: Pagination limit test (GET /api/audit?limit=1)
    // -------------------------------------------------------------
    console.log('[TEST 8] Pagination limit test (limit=1)...');
    const limitRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/audit?limit=1',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Status: ${limitRes.status}, Returned count: ${limitRes.data.data.length}`);
    if (limitRes.status !== 200 || limitRes.data.data.length !== 1) {
      throw new Error(`Expected exactly 1 record with limit=1, got ${limitRes.data.data.length}`);
    }
    console.log('[PASS] Pagination limit verified successfully.\n');

    // -------------------------------------------------------------
    // TEST 9: Retrieve Single Audit Log (GET /api/audit/:id)
    // -------------------------------------------------------------
    const targetId = firstLog.id;
    console.log(`[TEST 9] Fetch single audit record (GET /api/audit/${targetId})...`);
    const singleRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/audit/${targetId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Status: ${singleRes.status}, ID: ${singleRes.data?.data?.id}, Action: ${singleRes.data?.data?.action}`);
    if (singleRes.status !== 200 || !singleRes.data.success || singleRes.data.data.id !== targetId) {
      throw new Error(`Failed to retrieve single audit log ID ${targetId}`);
    }
    console.log('[PASS] Single audit log endpoint verified successfully.\n');

    console.log('===========================================================');
    console.log('=== ALL ACTIVITY AUDIT & SECURITY TRAIL TESTS PASSED!   ===');
    console.log('=== TASK 37/140 VERIFIED SUCCESSFULLY!                  ===');
    console.log('===========================================================');
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
