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

async function runTasks61To63Tests() {
  console.log('========================================================================');
  console.log('=== VERIFYING TASKS 61, 62 & 63 BACKEND APIS                         ===');
  console.log('========================================================================\n');

  let server;
  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    // 1. Task 61: GET /api/gallery
    console.log('[TEST 1] Testing Public Gallery Listing (GET /api/gallery)...');
    const resGallery = await makeRequest(port, 'GET', '/api/gallery?limit=10');
    if (resGallery.status !== 200 || !resGallery.data?.success) {
      throw new Error(`Gallery query failed. Status: ${resGallery.status}, Body: ${resGallery.text}`);
    }
    console.log(`[PASS] Gallery returned HTTP 200 with ${resGallery.data.data.length} photo items.\n`);

    // 2. Task 61: GET /api/gallery?event_name=DeepWoods
    console.log('[TEST 2] Testing Gallery Event Filter (GET /api/gallery?event_name=DeepWoods)...');
    const resGalleryFilter = await makeRequest(port, 'GET', '/api/gallery?event_name=DeepWoods');
    if (resGalleryFilter.status !== 200 || !resGalleryFilter.data?.success) {
      throw new Error(`Gallery filter failed. Status: ${resGalleryFilter.status}, Body: ${resGalleryFilter.text}`);
    }
    console.log(`[PASS] Filtered gallery returned HTTP 200 with ${resGalleryFilter.data.data.length} photo items.\n`);

    // 3. Task 63: POST /api/contact (Editorial Tip submission)
    console.log('[TEST 3] Testing Public Contact Submission (POST /api/contact)...');
    const contactPayload = {
      name: 'Rev. William Miller Archive Society',
      email: 'society@mcc.edu.in',
      category: 'editorial_tip',
      subject: 'Rare 19th Century Photographs of Anderson Quadrangle Foundation',
      message: 'The archival trust has located twelve original glass-plate negatives from the 1888 campus relocation to Tambaram.',
    };

    const resContact = await makeRequest(port, 'POST', '/api/contact', contactPayload);
    if (resContact.status !== 201 || !resContact.data?.success || !resContact.data?.data?.id) {
      throw new Error(`Contact submission failed. Status: ${resContact.status}, Body: ${resContact.text}`);
    }
    const contactId = resContact.data.data.id;
    console.log(`[PASS] Contact submission created successfully with ID: ${contactId}.\n`);

    // 4. Verify in DB and clean up
    console.log('[TEST 4] Verifying contact record in database & cleaning up test row...');
    const [rows] = await pool.query('SELECT id, name, email, subject, status FROM contact_messages WHERE id = ?', [contactId]);
    if (rows.length === 0 || rows[0].status !== 'unread') {
      throw new Error('Contact record was not found or has incorrect initial status in database');
    }
    console.log(`[PASS] Contact record verified: "${rows[0].subject}" (Status: ${rows[0].status}).`);

    await pool.query('DELETE FROM contact_messages WHERE id = ?', [contactId]);
    console.log('[CLEANUP] Deleted synthetic test contact record from contact_messages.\n');

    console.log('========================================================================');
    console.log('=== ALL BACKEND ENDPOINTS FOR TASKS 61, 62 & 63 PASSED               ===');
    console.log('========================================================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('[TEST FAILURE]:', err.message);
    if (server) server.close();
    process.exit(1);
  }
}

runTasks61To63Tests();
