const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../index');
const pool = require('../config/db');

function request(options, bodyBuffer = null, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const headers = { ...options.headers };
    if (bodyBuffer) {
      if (typeof bodyBuffer === 'string') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        headers['Content-Length'] = Buffer.byteLength(bodyBuffer);
      } else if (Buffer.isBuffer(bodyBuffer)) {
        headers['Content-Type'] = headers['Content-Type'] || contentType;
        headers['Content-Length'] = bodyBuffer.length;
      }
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

    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

async function runPhase5Part1Tests() {
  console.log('===========================================================================');
  console.log('=== PHASE 5 PART 1 INTEGRATION SUITE (TASKS 81 THROUGH 84/140)          ===');
  console.log('===========================================================================\n');

  let serverInstance = null;
  const PORT = process.env.PORT || 5000;
  const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';

  const superAdminToken = jwt.sign(
    { id: 1, email: 'admin@mcc.edu.in', role: 'super_admin' },
    secret,
    { expiresIn: '1h' }
  );

  try {
    // 1. Connect or start local server
    await new Promise((resolve) => {
      const probe = http.get(`http://localhost:${PORT}/api/health`, () => resolve());
      probe.on('error', () => {
        serverInstance = app.listen(PORT, () => {
          console.log(`[INFO] Started test server instance on http://localhost:${PORT}\n`);
          resolve();
        });
      });
    });

    // -------------------------------------------------------------
    // STEP 1: Verify All 5 New Database Tables Exist (Tasks 82, 83, 84)
    // -------------------------------------------------------------
    console.log('[STEP 1] Verifying database tables (tags, article_tags, article_revisions, polls, poll_votes)...');
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('tags', 'article_tags', 'article_revisions', 'polls', 'poll_votes')
    `);

    const tableNames = tables.map((t) => t.TABLE_NAME || t.table_name);
    console.log(`Found ${tableNames.length}/5 new tables:`, tableNames.join(', '));
    const requiredTables = ['tags', 'article_tags', 'article_revisions', 'polls', 'poll_votes'];
    for (const t of requiredTables) {
      if (!tableNames.includes(t)) {
        throw new Error(`Required database table '${t}' is missing from schema.`);
      }
    }
    console.log('[PASS] All 5 new schema tables verified in MySQL.\n');

    // -------------------------------------------------------------
    // STEP 2: Test File Upload Endpoint (Task 81)
    // -------------------------------------------------------------
    console.log('[STEP 2] Testing image upload pipeline (POST /api/upload/single)...');
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    // Minimal 1x1 PNG buffer
    const pngHex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082';
    const fakeImageBuffer = Buffer.from(pngHex, 'hex');

    const multipartHeader = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="quadrangle_test.png"\r\nContent-Type: image/png\r\n\r\n`
    );
    const multipartFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartPayload = Buffer.concat([multipartHeader, fakeImageBuffer, multipartFooter]);

    const uploadRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/upload/single',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
      },
      multipartPayload
    );

    console.log(`Upload status: ${uploadRes.status}, Response:`, uploadRes.data?.url || uploadRes.text);
    if (uploadRes.status !== 201 || !uploadRes.data?.success || !uploadRes.data?.url) {
      throw new Error(`Image upload failed. Status: ${uploadRes.status}, Body: ${uploadRes.text}`);
    }
    if (!uploadRes.data.url.startsWith('/uploads/mcc-')) {
      throw new Error(`Uploaded URL format unexpected: ${uploadRes.data.url}`);
    }
    console.log('[PASS] Task 81: Image upload pipeline functional with mcc- timestamp naming.\n');

    // -------------------------------------------------------------
    // STEP 3: Test Tag Creation and Taxonomy Retrieval (Task 82)
    // -------------------------------------------------------------
    console.log('[STEP 3] Testing Article Tag Taxonomies (POST /api/tags & GET /api/tags)...');
    const testTagName = `Campus Life ${Date.now()}`;
    const createTagRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/tags',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify({ name: testTagName })
    );

    console.log(`Create tag status: ${createTagRes.status}, Tag ID:`, createTagRes.data?.data?.id);
    if (createTagRes.status !== 201 || !createTagRes.data?.success || !createTagRes.data?.data?.slug) {
      throw new Error(`Tag creation failed: ${createTagRes.text}`);
    }

    const createdTag = createTagRes.data.data;
    const getTagsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tags',
      method: 'GET',
    });

    console.log(`Get tags status: ${getTagsRes.status}, Total tags:`, getTagsRes.data?.count);
    if (getTagsRes.status !== 200 || !getTagsRes.data?.success || !Array.isArray(getTagsRes.data?.data)) {
      throw new Error(`Fetching tags failed: ${getTagsRes.text}`);
    }
    const foundTag = getTagsRes.data.data.find((t) => t.id === createdTag.id);
    if (!foundTag) {
      throw new Error(`Newly created tag '${testTagName}' not found in public tags listing.`);
    }
    console.log('[PASS] Task 82: Tag taxonomy creation and retrieval verified.\n');

    // -------------------------------------------------------------
    // STEP 4: Test Article Revision History & Rollback Ledger (Task 83)
    // -------------------------------------------------------------
    console.log('[STEP 4] Testing Editorial Revision History & Snapshot Ledger (Task 83)...');
    // Ensure we have an article to update
    const [articles] = await pool.query('SELECT id, title, content, summary FROM articles LIMIT 1');
    let targetArticleId;

    if (articles.length === 0) {
      const [insertArt] = await pool.query(
        `INSERT INTO articles (title, slug, content, summary, category_id, status)
         VALUES ('Preliminary Dispatch', 'preliminary-dispatch', 'Original broadsheet text.', 'Summary text.', 1, 'published')`
      );
      targetArticleId = insertArt.insertId;
    } else {
      targetArticleId = articles[0].id;
    }

    const originalTitle = articles[0]?.title || 'Preliminary Dispatch';
    const updatedTitle = `Revised Dispatch ${Date.now()}`;

    // Update article through API endpoint
    const updateRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/articles/${targetArticleId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify({
        title: updatedTitle,
        change_summary: 'Major factual revision in morning desk',
      })
    );

    if (updateRes.status !== 200 || !updateRes.data?.success) {
      throw new Error(`Article update failed: ${updateRes.text}`);
    }
    console.log(`Updated article #${targetArticleId} title to: "${updatedTitle}"`);

    // Fetch revisions endpoint
    const revRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/articles/${targetArticleId}/revisions`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    console.log(`Revisions status: ${revRes.status}, Revision count:`, revRes.data?.count);
    if (revRes.status !== 200 || !revRes.data?.success || revRes.data?.count === 0) {
      throw new Error(`Article revisions not found or empty: ${revRes.text}`);
    }
    const latestRevision = revRes.data.data[0];
    console.log('Latest revision snapshot title:', latestRevision.title, '| Change Summary:', latestRevision.change_summary);
    if (!latestRevision.title || !latestRevision.created_at) {
      throw new Error('Revision record is missing title or created_at timestamp');
    }
    console.log('[PASS] Task 83: Editorial revision history snapshot automatically recorded.\n');

    // -------------------------------------------------------------
    // STEP 5: Test Campus Opinion Polls & Deduplication (Task 84)
    // -------------------------------------------------------------
    console.log('[STEP 5] Testing Campus Polls & Barometer (POST /api/polls & POST /api/polls/:id/vote)...');
    const pollPayload = {
      question: `Should MCC reinstate the annual centenary broadsheet ball? (${Date.now()})`,
      options: ['Strongly Agree', 'Agree', 'Indifferent', 'Disagree'],
      is_active: true,
    };

    const createPollRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/polls',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify(pollPayload)
    );

    console.log(`Create poll status: ${createPollRes.status}, Poll ID:`, createPollRes.data?.data?.id);
    if (createPollRes.status !== 201 || !createPollRes.data?.success || !createPollRes.data?.data?.id) {
      throw new Error(`Campus poll creation failed: ${createPollRes.text}`);
    }
    const pollId = createPollRes.data.data.id;

    // Fetch public active poll
    const activePollRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/polls/active',
      method: 'GET',
    });

    console.log(`Active poll status: ${activePollRes.status}, Question:`, activePollRes.data?.data?.question);
    if (activePollRes.status !== 200 || !activePollRes.data?.data || activePollRes.data.data.id !== pollId) {
      throw new Error(`Active poll retrieval did not return newly created poll ID ${pollId}`);
    }

    // Cast Vote
    console.log('Casting vote for option 0 (Strongly Agree)...');
    const voteRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/polls/${pollId}/vote`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify({ optionIndex: 0 })
    );

    console.log(`Vote status: ${voteRes.status}, Total votes:`, voteRes.data?.data?.total_votes);
    if (voteRes.status !== 200 || !voteRes.data?.success || voteRes.data.data.total_votes < 1) {
      throw new Error(`Casting poll vote failed: ${voteRes.text}`);
    }

    // Attempt duplicate vote from same IP
    console.log('Attempting duplicate vote from identical caller IP (expecting HTTP 409 Conflict)...');
    const duplicateVoteRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/polls/${pollId}/vote`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify({ optionIndex: 1 })
    );

    console.log(`Duplicate vote response status: ${duplicateVoteRes.status}`);
    if (duplicateVoteRes.status !== 409 && duplicateVoteRes.status !== 400) {
      throw new Error(`Duplicate vote was not rejected! Received HTTP status ${duplicateVoteRes.status}`);
    }
    console.log(`[PASS] Duplicate vote correctly rejected with status ${duplicateVoteRes.status}: "${duplicateVoteRes.data?.error}"\n`);

    console.log('===========================================================================');
    console.log('=== ALL PHASE 5 PART 1 TASKS (81 THROUGH 84/140) VERIFIED SUCCESSFULLY! ===');
    console.log('===========================================================================');

    if (serverInstance) serverInstance.close();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 5 PART 1 TEST FAILURE]:', err.message);
    if (serverInstance) serverInstance.close();
    await pool.end();
    process.exit(1);
  }
}

runPhase5Part1Tests();
