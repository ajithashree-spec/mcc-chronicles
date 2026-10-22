const http = require('http');
const app = require('../index');
const pool = require('../config/db');
const sseService = require('../services/sseService');

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

async function runTasks101To104Tests() {
  console.log('===========================================================================');
  console.log('=== BACKEND INTEGRATION TEST SUITE: TASKS 101, 102, 103 & 104/140       ===');
  console.log('=== (SSE REAL-TIME STREAM, LIVE BROADCAST & STUDENT OP-ED DESK)         ===');
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

  let cleanupContactIds = [];

  try {
    // 1. Ensure test server is listening
    console.log('[STEP 1] Starting / Connecting to HTTP Server');
    await new Promise((resolve) => {
      const probe = http.get(`http://localhost:${PORT}/api/health`, () => resolve());
      probe.on('error', () => {
        serverInstance = app.listen(PORT, () => {
          console.log(`[INFO] Started test server instance on http://localhost:${PORT}\n`);
          resolve();
        });
      });
    });

    // 2. Test Task 101: SSE Endpoint and Headers
    console.log('\n[STEP 2] Testing Task 101: Real-Time SSE Stream Endpoint');

    let sseClientReq = null;
    let receivedEvents = [];

    const connectPromise = new Promise((resolve, reject) => {
      sseClientReq = http.request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/realtime/stream',
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
          },
        },
        (res) => {
          assert(res.statusCode === 200, 'GET /api/realtime/stream returned status 200 OK');
          assert(
            res.headers['content-type']?.includes('text/event-stream'),
            "Response header 'Content-Type' is 'text/event-stream'"
          );
          assert(
            res.headers['cache-control']?.includes('no-cache'),
            "Response header 'Cache-Control' contains 'no-cache'"
          );

          res.on('data', (chunk) => {
            const text = chunk.toString();
            receivedEvents.push(text);
            if (text.includes('event: connected') || text.includes('Connected to The MCC Chronicles')) {
              resolve(true);
            }
          });
        }
      );

      sseClientReq.on('error', reject);
      sseClientReq.end();
    });

    await connectPromise;
    assert(receivedEvents.some((e) => e.includes('event: connected')), "Client received initial 'event: connected' handshake");

    // 3. Test Diagnostic Status Endpoint
    const statusRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/realtime/status',
      method: 'GET',
    });
    assert(statusRes.status === 200, 'GET /api/realtime/status returned 200 OK');
    assert(statusRes.data?.activeClients >= 1, `Active SSE client count is registered (${statusRes.data?.activeClients})`);

    // 4. Test Broadcast Trigger: dispatch:published
    console.log('\n[STEP 3] Testing Live Real-Time Event Broadcast');
    const broadcastPayload = {
      id: 888,
      title: 'Centennial Anderson Quadrangle Chimes Restored',
      slug: 'centennial-anderson-quadrangle-chimes-restored',
      category: 'Campus Heritage',
      published_at: new Date().toISOString(),
    };

    const broadcastPromise = new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const found = receivedEvents.some(
          (e) => e.includes('event: dispatch:published') && e.includes('Centennial Anderson Quadrangle Chimes')
        );
        if (found) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);

      // Trigger broadcast
      sseService.broadcast('dispatch:published', broadcastPayload);
    });

    await broadcastPromise;
    assert(true, "Connected SSE client received 'dispatch:published' real-time broadcast event with valid payload");

    // Test circular:urgent broadcast
    const circularBroadcastPromise = new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const found = receivedEvents.some(
          (e) => e.includes('event: circular:urgent') && e.includes('MCC/CIR/2026/URG-09')
        );
        if (found) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);

      sseService.broadcast('circular:urgent', {
        id: 99,
        title: 'Emergency Advisory: Monsoon Rain Protocol',
        reference_no: 'MCC/CIR/2026/URG-09',
        department: 'Bursar & Principal Office',
      });
    });

    await circularBroadcastPromise;
    assert(true, "Connected SSE client received 'circular:urgent' real-time broadcast event");

    // Close SSE test client
    if (sseClientReq) {
      sseClientReq.destroy();
    }

    // 5. Test Task 104: Student Op-Ed Submission Pipeline
    console.log('\n[STEP 4] Testing Task 104: Student Op-Ed & Scoop Submission Desk Pipeline');

    const studentSubmission = {
      name: 'Kavitha Sundaram',
      email: 'kavitha.s@mcc.edu.in',
      subject: '[Student Op-Ed Pitch] Biodiversity in the Tambaram Scrub Woodland',
      category: 'editorial_tip',
      message: `
--- STUDENT OP-ED & SCOOP SUBMISSION ---
Author Name: Kavitha Sundaram
College Roll No: 24/BOT/018
Department: Botany (UG Year III)
Category: Science, Flora & Scrub Ecology
Proposed Headline: Biodiversity in the Tambaram Scrub Woodland
Word Count: 750 (4 min read)

DRAFT BODY:
Field observations across the eastern perimeter of the campus scrub jungle have revealed flourishing populations of indigenous dry evergreen species...
      `.trim(),
    };

    const submitRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/contact',
        method: 'POST',
      },
      studentSubmission
    );

    assert(submitRes.status === 201, 'POST /api/contact transmitted student op-ed (201 Created)');
    assert(submitRes.data?.success === true, 'Response confirms transmission success');
    const contactId = submitRes.data?.data?.id;
    assert(Boolean(contactId), `Submission receipt generated (ID: ${contactId})`);
    if (contactId) cleanupContactIds.push(contactId);

    // Verify record in database
    const [dbRows] = await pool.query(
      'SELECT id, name, email, subject, category FROM contact_messages WHERE id = ? LIMIT 1',
      [contactId]
    );
    assert(dbRows.length > 0, 'Submission verified in contact_messages table');
    assert(dbRows[0]?.category === 'editorial_tip', "Category correctly stored as 'editorial_tip'");

    // 6. Clean up temporary test records
    console.log('\n[CLEANUP] Cleaning up test records...');
    for (const cId of cleanupContactIds) {
      await pool.query('DELETE FROM contact_messages WHERE id = ?', [cId]);
    }
    console.log('  ✓ Cleaned up test contact submissions.');

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

runTasks101To104Tests();
