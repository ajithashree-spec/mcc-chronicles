const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function runSmokeTest() {
  console.log('========================================================================');
  console.log('CHEMISTRY (AIDED) DEPARTMENT ADMIN & ARTICLE UPLOAD SMOKE TEST');
  console.log('========================================================================\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mcc_chronicles',
  });

  try {
    // 1. Direct Database Verification
    console.log('[STEP 1] Direct MySQL Account Verification...');
    const [userRows] = await connection.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.department_id, u.is_active,
              d.name AS department_name, d.code AS department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = 'chem.editor@mcc.edu.in'`
    );

    if (userRows.length === 0) {
      throw new Error('FAIL: User chem.editor@mcc.edu.in not found in database.');
    }

    const dbUser = userRows[0];
    const passwordMatch = await bcrypt.compare('Editor@MCC2026', dbUser.password_hash);
    if (!passwordMatch) {
      throw new Error('FAIL: Password hash does not match Editor@MCC2026.');
    }

    console.log('✓ Account verified in MySQL:');
    console.log(`  - User ID       : ${dbUser.id}`);
    console.log(`  - Email         : ${dbUser.email}`);
    console.log(`  - Name          : ${dbUser.name}`);
    console.log(`  - Role          : ${dbUser.role}`);
    console.log(`  - Department ID : ${dbUser.department_id} (${dbUser.department_name} / ${dbUser.department_code})`);
    console.log(`  - Active        : ${Boolean(dbUser.is_active)}`);
    console.log(`  - Password Valid: ${passwordMatch}\n`);

    // 2. HTTP Login Verification (/api/auth/login)
    console.log('[STEP 2] Authenticating via POST /api/auth/login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chem.editor@mcc.edu.in',
        password: 'Editor@MCC2026',
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success || !loginData.token) {
      throw new Error(`FAIL: Login failed: ${JSON.stringify(loginData)}`);
    }

    console.log('✓ Login successful:');
    console.log(`  - HTTP Status : ${loginRes.status}`);
    console.log(`  - Token Issued: ${loginData.token.substring(0, 24)}...`);
    console.log(`  - Logged In User: ${loginData.user.name} (${loginData.user.email})`);
    console.log(`  - User Role   : ${loginData.user.role}`);
    console.log(`  - User Dept ID: ${loginData.user.department_id}\n`);

    const authToken = loginData.token;

    // 3. Article Submission Verification (POST /api/articles)
    console.log('[STEP 3] Uploading article dispatch via POST /api/articles...');
    const testArticlePayload = {
      title: `Green Catalysis Innovations in Organic Chemistry (${Date.now().toString().slice(-4)})`,
      category: 'Research',
      excerpt: 'Department of Chemistry unveils cutting-edge green catalysis methodology for sustainable synthesis.',
      content: '## Breakthrough in Sustainable Organic Synthesis\n\nThe Department of Chemistry (Aided) at Madras Christian College has announced an inaugural research milestone detailing sustainable catalytic reactions utilizing eco-friendly solvent systems.',
      cover_image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      author_name: 'Dr. Department Correspondent',
    };

    const articleRes = await fetch(`${BASE_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(testArticlePayload),
    });

    const articleData = await articleRes.json();
    if (!articleRes.ok || !articleData.success || !articleData.data) {
      throw new Error(`FAIL: Article upload failed (HTTP ${articleRes.status}): ${JSON.stringify(articleData)}`);
    }

    console.log('✓ Article published successfully:');
    console.log(`  - HTTP Status    : ${articleRes.status} (Created)`);
    console.log(`  - Article ID     : ${articleData.data.id}`);
    console.log(`  - Title          : ${articleData.data.title}`);
    console.log(`  - Slug           : ${articleData.data.slug}`);
    console.log(`  - Status         : ${articleData.data.status}`);
    console.log(`  - Department ID  : ${articleData.data.department_id} (Locked to Chem Dept)`);
    console.log(`  - Department Name: ${articleData.data.department_name}`);
    console.log(`  - Category Name  : ${articleData.data.category_name}`);
    console.log(`  - Author Name    : ${articleData.data.author_name}\n`);

    const createdArticleId = articleData.data.id;

    // 4. Verification in Department Bureau Feed (/api/articles?department=CHEM-AID)
    console.log('[STEP 4] Verifying article presence in Department Bureau Feed...');
    const feedRes = await fetch(`${BASE_URL}/api/articles?department=CHEM-AID`);
    const feedData = await feedRes.json();

    if (!feedRes.ok || !feedData.success) {
      throw new Error(`FAIL: Could not query department feed: ${JSON.stringify(feedData)}`);
    }

    const foundInFeed = feedData.data?.find((a) => a.id === createdArticleId);
    if (!foundInFeed) {
      throw new Error(`FAIL: Article ID ${createdArticleId} not found in Chemistry department feed.`);
    }

    console.log('✓ Article verified in Chemistry Department Feed:');
    console.log(`  - Total Dept Articles: ${feedData.total || feedData.data.length}`);
    console.log(`  - Matched Dispatch    : "${foundInFeed.title}"`);
    console.log(`  - Bureau Department   : ${foundInFeed.department_name} [${foundInFeed.department_code}]\n`);

    console.log('========================================================================');
    console.log('ALL SMOKE TESTS PASSED: DEPARTMENT ADMIN & UPLOAD WORKFLOW OPERATIONAL!');
    console.log('========================================================================');
  } catch (err) {
    console.error('Smoke test failed with error:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSmokeTest();
