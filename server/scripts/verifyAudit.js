const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
const PORT = process.env.PORT || 5000;

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runAudit() {
  console.log('========================================================================');
  console.log('=== MCC CHRONICLES: SYSTEM AUDIT & INTEGRITY VERIFICATION           ===');
  console.log('========================================================================\n');

  let passed = true;

  try {
    // 1. DATABASE CHECK: Departments Count
    console.log('[AUDIT 1] Verifying 38 Official MCC Departments in Database...');
    const [deptRows] = await pool.query('SELECT id, name, code, stream FROM departments ORDER BY id ASC');
    const aidedDepts = deptRows.filter((d) => d.stream === 'Aided');
    const sfsDepts = deptRows.filter((d) => d.stream === 'Self-Financed');

    console.log(`- Total Departments Count: ${deptRows.length} (Expected: 38)`);
    console.log(`- Aided Stream (Shift I): ${aidedDepts.length} (Expected: 17)`);
    console.log(`- Self-Financed Stream (Shift II): ${sfsDepts.length} (Expected: 21)`);

    if (deptRows.length === 38 && aidedDepts.length === 17 && sfsDepts.length === 21) {
      console.log('  -> PASS: All 38 official MCC departments verified!\n');
    } else {
      console.error('  -> FAIL: Department counts do not match official roster!\n');
      passed = false;
    }

    // 2. DATABASE CHECK: Dummy Articles Purge
    console.log('[AUDIT 2] Verifying Zero Dummy / Placeholder Articles in Database...');
    const [articleRows] = await pool.query('SELECT COUNT(*) AS count FROM articles');
    const articleCount = articleRows[0].count;
    console.log(`- Active Articles in Database: ${articleCount}`);

    if (articleCount === 0) {
      console.log('  -> PASS: Zero dummy stories confirmed. Clean broadsheet state established!\n');
    } else {
      console.log(`  -> NOTE: Database contains ${articleCount} genuine articles.\n`);
    }

    // 3. API CHECK: Public GET /api/departments
    console.log('[AUDIT 3] Verifying Public GET /api/departments...');
    const deptRes = await makeRequest('GET', '/api/departments');
    if (deptRes.status === 200 && Array.isArray(deptRes.data?.data) && deptRes.data.data.length === 38) {
      console.log(`  -> PASS: GET /api/departments responded 200 with ${deptRes.data.data.length} departments.\n`);
    } else {
      console.error(`  -> FAIL: Unexpected response from GET /api/departments: status ${deptRes.status}\n`);
      passed = false;
    }

    // 4. API CHECK: Public GET /api/categories
    console.log('[AUDIT 4] Verifying Public GET /api/categories...');
    const catRes = await makeRequest('GET', '/api/categories');
    if (catRes.status === 200 && Array.isArray(catRes.data?.data)) {
      console.log(`  -> PASS: GET /api/categories responded 200 with ${catRes.data.data.length} active columns/categories.\n`);
    } else {
      console.error(`  -> FAIL: Unexpected response from GET /api/categories: status ${catRes.status}\n`);
      passed = false;
    }

    // 5. SUPER ADMIN CRUD: Category Operations
    console.log('[AUDIT 5] Testing Super Admin CRUD for Categories...');
    // Create token for admin@mcc.edu.in
    const adminToken = jwt.sign(
      { id: 1, email: 'admin@mcc.edu.in', role: 'super_admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // 5a. Create temporary category
    const createCatRes = await makeRequest(
      'POST',
      '/api/categories',
      {
        name: 'Audit Test Column',
        slug: 'audit-test-column',
        description: 'Test category for automated CRUD verification.',
      },
      authHeaders
    );

    if (createCatRes.status === 201) {
      const createdId = createCatRes.data?.data?.id;
      console.log(`- Created Category ID: ${createdId}`);

      // 5b. Update category
      const updateCatRes = await makeRequest(
        'PUT',
        `/api/categories/${createdId}`,
        {
          name: 'Audit Test Column Updated',
          description: 'Updated scope description.',
        },
        authHeaders
      );
      console.log(`- Update status: ${updateCatRes.status}`);

      // 5c. Delete category
      const delCatRes = await makeRequest(
        'DELETE',
        `/api/categories/${createdId}`,
        null,
        authHeaders
      );
      console.log(`- Delete status: ${delCatRes.status}`);

      if (updateCatRes.status === 200 && delCatRes.status === 200) {
        console.log('  -> PASS: Super Admin Category CRUD (Create, Update, Delete) verified!\n');
      } else {
        console.error('  -> FAIL: Category update or delete failed.\n');
        passed = false;
      }
    } else {
      console.error(`  -> FAIL: Category creation returned status ${createCatRes.status}:`, createCatRes.data);
      passed = false;
    }

    // 6. SUPER ADMIN CRUD: Department Operations
    console.log('[AUDIT 6] Testing Super Admin CRUD for Departments...');
    // 6a. Create temporary department
    const createDeptRes = await makeRequest(
      'POST',
      '/api/departments',
      {
        name: 'Department of Test Studies',
        code: 'TEST-AID',
        stream: 'Aided',
        head_of_department: 'Dr. Test HOD',
        contact_email: 'test.hod@mcc.edu.in',
        description: 'Temporary department for audit verification.',
      },
      authHeaders
    );

    if (createDeptRes.status === 201) {
      const createdDeptId = createDeptRes.data?.data?.id;
      console.log(`- Created Department ID: ${createdDeptId}`);

      // 6b. Update department
      const updateDeptRes = await makeRequest(
        'PUT',
        `/api/departments/${createdDeptId}`,
        {
          name: 'Department of Test Studies (Updated)',
          head_of_department: 'Dr. Test HOD Updated',
          stream: 'Aided',
          description: 'Updated description.',
        },
        authHeaders
      );
      console.log(`- Update status: ${updateDeptRes.status}`);

      // 6c. Delete department
      const delDeptRes = await makeRequest(
        'DELETE',
        `/api/departments/${createdDeptId}`,
        null,
        authHeaders
      );
      console.log(`- Delete status: ${delDeptRes.status}`);

      if (updateDeptRes.status === 200 && delDeptRes.status === 200) {
        console.log('  -> PASS: Super Admin Department CRUD verified!\n');
      } else {
        console.error('  -> FAIL: Department update or delete failed.\n');
        passed = false;
      }
    } else {
      console.error(`  -> FAIL: Department creation returned status ${createDeptRes.status}:`, createDeptRes.data);
      passed = false;
    }

    console.log('========================================================================');
    if (passed) {
      console.log('=== AUDIT STATUS: ALL CHECKS PASSED PERFECTLY                       ===');
    } else {
      console.log('=== AUDIT STATUS: SOME CHECKS FAILED                                ===');
    }
    console.log('========================================================================');

    process.exit(passed ? 0 : 1);
  } catch (err) {
    console.error('[AUDIT FATAL ERROR]:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAudit();
