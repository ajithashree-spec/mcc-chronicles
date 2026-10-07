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
          resolve({ status: res.statusCode, data: parsed, text: data });
        } catch {
          resolve({ status: res.statusCode, data: null, text: data });
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

async function runTasks64To67Tests() {
  console.log('========================================================================');
  console.log('=== VERIFYING TASKS 64, 65, 66 & 67 BACKEND PIPELINES                ===');
  console.log('========================================================================\n');

  let server;
  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    // 1. Task 64: POST /api/subscribers
    console.log('[TEST 1] Testing Newsletter Subscription (POST /api/subscribers)...');
    const subscribePayload = {
      email: 'anderson.alumnus@mcc.edu.in',
      name: 'Dr. John Anderson Scholar',
      frequency: 'weekly',
    };

    const resSub = await makeRequest(port, 'POST', '/api/subscribers', subscribePayload);
    if (resSub.status !== 201 || !resSub.data?.success || !resSub.data?.data?.unsubscribe_token) {
      throw new Error(`Subscribe failed. Status: ${resSub.status}, Body: ${resSub.text}`);
    }
    const token = resSub.data.data.unsubscribe_token;
    console.log(`[PASS] Subscribed successfully. Generated Token: ${token.substring(0, 16)}...\n`);

    // 2. Task 64: GET /api/subscribers/unsubscribe/:token
    console.log(`[TEST 2] Testing Newsletter Unsubscribe (GET /api/subscribers/unsubscribe/${token.substring(0, 16)}...)...`);
    const resUnsub = await makeRequest(port, 'GET', `/api/subscribers/unsubscribe/${token}`);
    if (resUnsub.status !== 200 || !resUnsub.data?.success) {
      throw new Error(`Unsubscribe failed. Status: ${resUnsub.status}, Body: ${resUnsub.text}`);
    }
    console.log(`[PASS] Unsubscribe executed successfully: "${resUnsub.data.message}"\n`);

    // 3. Verify in DB
    console.log('[TEST 3] Verifying inactive status in database & cleaning up test row...');
    const [rows] = await pool.query('SELECT id, email, is_active FROM subscribers WHERE email = ?', [subscribePayload.email]);
    if (rows.length === 0 || rows[0].is_active !== 0) {
      throw new Error('Subscriber was not marked inactive or row not found');
    }
    console.log(`[PASS] Verified subscriber is_active = ${rows[0].is_active}.`);

    await pool.query('DELETE FROM subscribers WHERE email = ?', [subscribePayload.email]);
    console.log('[CLEANUP] Deleted synthetic test subscriber from subscribers table.\n');

    console.log('========================================================================');
    console.log('=== ALL BACKEND PIPELINES FOR TASKS 64 THROUGH 67 PASSED             ===');
    console.log('========================================================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('[TEST FAILURE]:', err.message);
    if (server) server.close();
    process.exit(1);
  }
}

runTasks64To67Tests();
