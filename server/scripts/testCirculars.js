const http = require('http');

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
        } catch (e) {
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
  console.log('=== STARTING INTEGRATION TESTS FOR CIRCULARS API ===\n');

  try {
    // 1. Authenticate as Super Admin
    console.log('[TEST 1] Logging in as Super Admin (admin@mcc.edu.in)...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@mcc.edu.in', password: 'Admin@MCC2026' }
    );

    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }
    const token = loginRes.data.token;
    console.log(`[PASS] Logged in successfully. Token acquired: ${token.substring(0, 16)}...\n`);

    // 2. Public GET /api/circulars (Unauthenticated)
    console.log('[TEST 2] Public GET /api/circulars without authentication...');
    const publicGetRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/circulars',
      method: 'GET',
    });
    console.log(`Status: ${publicGetRes.status}, Body:`, publicGetRes.data);
    if (publicGetRes.status !== 200 || !publicGetRes.data.success) {
      throw new Error(`Public GET failed with status ${publicGetRes.status}`);
    }
    console.log('[PASS] Public circulars retrieved successfully.\n');

    // 3. Attempt Unauthenticated POST /api/circulars (Expect 401)
    console.log('[TEST 3] Attempt Unauthenticated POST /api/circulars (Expect 401)...');
    const unauthPostRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/circulars',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { title: 'Unauthorized Notice', circular_number: 'MCC/FAIL/01', publish_date: '2026-10-01' }
    );
    console.log(`Status: ${unauthPostRes.status}, Body:`, unauthPostRes.data);
    if (unauthPostRes.status !== 401) {
      throw new Error(`Expected HTTP 401 but received ${unauthPostRes.status}`);
    }
    console.log('[PASS] Unauthorized POST properly rejected with HTTP 401.\n');

    // 4. Protected POST /api/circulars (Create Circular)
    console.log('[TEST 4] Protected POST /api/circulars with Super Admin token...');
    const newCircularPayload = {
      title: 'End Semester Examination Schedule 2026',
      circular_number: 'MCC/EXAM/2026/01',
      content: 'The End Semester Examinations for all undergraduate and postgraduate programs will commence on November 15, 2026.',
      publish_date: '2026-10-01',
      is_pinned: true,
      target_audience: 'all',
    };

    const createRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/circulars',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      newCircularPayload
    );
    console.log(`Status: ${createRes.status}, Body:`, createRes.data);
    if (createRes.status !== 201 || !createRes.data.success || !createRes.data.data.id) {
      throw new Error(`Create circular failed with status ${createRes.status}`);
    }
    const circularId = createRes.data.data.id;
    console.log(`[PASS] Circular created with ID: ${circularId}.\n`);

    // 5. GET /api/circulars/:id (Public Circular by ID)
    console.log(`[TEST 5] Public GET /api/circulars/${circularId} by ID...`);
    const getByIdRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/circulars/${circularId}`,
      method: 'GET',
    });
    console.log(`Status: ${getByIdRes.status}, Body:`, getByIdRes.data);
    if (
      getByIdRes.status !== 200 ||
      !getByIdRes.data.success ||
      getByIdRes.data.data.circular_number !== 'MCC/EXAM/2026/01'
    ) {
      throw new Error(`Get circular by ID failed: ${JSON.stringify(getByIdRes.data)}`);
    }
    console.log('[PASS] Circular details fetched successfully by ID.\n');

    // 6. PUT /api/circulars/:id (Update Circular)
    console.log(`[TEST 6] Protected PUT /api/circulars/${circularId} (Update title)...`);
    const updateRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/circulars/${circularId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      {
        title: 'End Semester Examination Schedule 2026 (Revised & Final)',
        is_pinned: true,
      }
    );
    console.log(`Status: ${updateRes.status}, Body:`, updateRes.data);
    if (
      updateRes.status !== 200 ||
      !updateRes.data.success ||
      updateRes.data.data.title !== 'End Semester Examination Schedule 2026 (Revised & Final)'
    ) {
      throw new Error(`Update circular failed: ${JSON.stringify(updateRes.data)}`);
    }
    console.log('[PASS] Circular updated successfully.\n');

    // 7. GET /api/circulars with Query Filters
    console.log('[TEST 7] GET /api/circulars?target_audience=all&limit=5 query filters...');
    const filteredRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/circulars?target_audience=all&limit=5',
      method: 'GET',
    });
    console.log(`Status: ${filteredRes.status}, Count: ${filteredRes.data.count}`);
    if (filteredRes.status !== 200 || filteredRes.data.count < 1) {
      throw new Error(`Filtered query failed: ${JSON.stringify(filteredRes.data)}`);
    }
    console.log('[PASS] Query filters returned matched circulars.\n');

    // 8. DELETE /api/circulars/:id (Delete Circular)
    console.log(`[TEST 8] Protected DELETE /api/circulars/${circularId}...`);
    const deleteRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/circulars/${circularId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`Status: ${deleteRes.status}, Body:`, deleteRes.data);
    if (deleteRes.status !== 200 || !deleteRes.data.success) {
      throw new Error(`Delete circular failed: ${JSON.stringify(deleteRes.data)}`);
    }
    console.log('[PASS] Circular deleted successfully.\n');

    // 9. Verify 404 after deletion
    console.log(`[TEST 9] Verify 404 on deleted circular ID ${circularId}...`);
    const verifyNotFoundRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/circulars/${circularId}`,
      method: 'GET',
    });
    console.log(`Status: ${verifyNotFoundRes.status}, Body:`, verifyNotFoundRes.data);
    if (verifyNotFoundRes.status !== 404) {
      throw new Error(`Expected 404 but got ${verifyNotFoundRes.status}`);
    }
    console.log('[PASS] Verified 404 on deleted circular.\n');

    console.log('=== ALL CIRCULARS API INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('[TEST ERROR]:', error.message);
    process.exit(1);
  }
}

runTests();
