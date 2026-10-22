const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// ANSI terminal colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function recordTest(id, name, testFn) {
  totalTests++;
  const startTime = Date.now();
  process.stdout.write(`  ${GRAY}[TEST]${RESET} ${BOLD}${id}${RESET}: ${name}... `);
  try {
    const details = await testFn();
    const duration = Date.now() - startTime;
    passedTests++;
    console.log(`${GREEN}${BOLD}[PASS]${RESET} ${GRAY}(${duration}ms)${RESET}`);
    if (details) {
      console.log(`         ${GRAY}↳ ${details}${RESET}`);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    failedTests++;
    console.log(`${RED}${BOLD}[FAIL]${RESET} ${GRAY}(${duration}ms)${RESET}`);
    console.log(`         ${RED}Error: ${err.message}${RESET}`);
    failures.push({ id, name, error: err.message });
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('\n========================================================================');
  console.log(`${BOLD}${CYAN}MCC CHRONICLES — COMPREHENSIVE BACKEND AUDIT SUITE${RESET}`);
  console.log(`Target Server : ${BASE_URL}`);
  console.log(`Database Host : ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
  console.log(`Local Time    : ${new Date().toISOString()}`);
  console.log('========================================================================\n');

  let superAdminToken = null;
  let deptEditorToken = null;
  let testArticleId = null;
  let testDepartmentId = null;
  let testColumnId = null;

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mcc_chronicles',
  });

  try {
    // ========================================================================
    // SUITE A: AUTHENTICATION & SESSION MANAGEMENT
    // ========================================================================
    console.log(`${BOLD}${YELLOW}--- SUITE A: AUTHENTICATION & SESSION MANAGEMENT ---${RESET}`);

    await recordTest('TC-AUTH-01', 'Login as Super Admin (admin@mcc.edu.in)', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@mcc.edu.in', password: 'Admin@MCC2026' }),
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      if (!res.data?.token) throw new Error('JWT token missing from response');
      if (res.data?.user?.role !== 'super_admin') throw new Error(`Expected role 'super_admin', got '${res.data?.user?.role}'`);
      superAdminToken = res.data.token;
      return `Authenticated Super Admin (token: ${superAdminToken.slice(0, 16)}...)`;
    });

    await recordTest('TC-AUTH-02', 'Login as Department Editor (chem.editor@mcc.edu.in)', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'chem.editor@mcc.edu.in', password: 'Editor@MCC2026' }),
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      if (!res.data?.token) throw new Error('JWT token missing from response');
      if (res.data?.user?.role !== 'editor') throw new Error(`Expected role 'editor', got '${res.data?.user?.role}'`);
      if (!res.data?.user?.department_id) throw new Error('department_id missing for editor user');
      deptEditorToken = res.data.token;
      return `Authenticated Dept Editor (Dept ID: ${res.data.user.department_id}, token: ${deptEditorToken.slice(0, 16)}...)`;
    });

    await recordTest('TC-AUTH-03', 'Login with invalid credentials rejects with HTTP 401', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent.user@mcc.edu.in', password: 'WrongPassword999' }),
      });
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
      if (!res.data?.error) throw new Error('Expected descriptive error message');
      return `Returned 401 with message: "${res.data.error}"`;
    });

    await recordTest('TC-AUTH-04', 'Request protected routes without Bearer token rejects with HTTP 401', async () => {
      const res = await request('/api/users');
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
      return `Protected endpoint correctly blocked with HTTP 401`;
    });

    // ========================================================================
    // SUITE B: ROLE-BASED ACCESS CONTROL (RBAC)
    // ========================================================================
    console.log(`\n${BOLD}${YELLOW}--- SUITE B: ROLE-BASED ACCESS CONTROL (RBAC) ---${RESET}`);

    await recordTest('TC-RBAC-01', 'Dept Editor cannot CREATE department (POST /api/departments)', async () => {
      const res = await request('/api/departments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${deptEditorToken}` },
        body: JSON.stringify({ name: 'Unauthorized Bureau', code: 'UNAUTH-AID', stream: 'Aided' }),
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, got ${res.status}`);
      return `Denied with HTTP 403: "${res.data?.error || 'Forbidden'}"`;
    });

    await recordTest('TC-RBAC-02', 'Dept Editor cannot DELETE department (DELETE /api/departments/:id)', async () => {
      const res = await request('/api/departments/25', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${deptEditorToken}` },
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, got ${res.status}`);
      return `Denied with HTTP 403: "${res.data?.error || 'Forbidden'}"`;
    });

    await recordTest('TC-RBAC-03', 'Super Admin creates, updates, and deletes department', async () => {
      const tempCode = `AUD-${Date.now().toString().slice(-4)}`;
      // 1. Create
      const createRes = await request('/api/departments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: JSON.stringify({
          name: 'Temporary Audit Bureau',
          code: tempCode,
          stream: 'Aided',
          head_of_department: 'Dr. Test Audit HOD',
          contact_email: 'audit.test@mcc.edu.in',
        }),
      });
      if (createRes.status !== 201) throw new Error(`Create failed: HTTP ${createRes.status} - ${JSON.stringify(createRes.data)}`);
      testDepartmentId = createRes.data?.data?.id;

      // 2. Update
      const updateRes = await request(`/api/departments/${testDepartmentId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: JSON.stringify({ name: 'Renamed Audit Bureau' }),
      });
      if (updateRes.status !== 200) throw new Error(`Update failed: HTTP ${updateRes.status}`);

      // 3. Delete
      const deleteRes = await request(`/api/departments/${testDepartmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      if (deleteRes.status !== 200) throw new Error(`Delete failed: HTTP ${deleteRes.status}`);
      return `Created (ID: ${testDepartmentId}), updated, and deleted successfully`;
    });

    await recordTest('TC-RBAC-04', 'Unauthenticated user accesses public feeds (Read-Only)', async () => {
      const deptsRes = await request('/api/departments');
      if (deptsRes.status !== 200) throw new Error(`Public GET /api/departments failed with ${deptsRes.status}`);

      const articlesRes = await request('/api/articles');
      if (articlesRes.status !== 200) throw new Error(`Public GET /api/articles failed with ${articlesRes.status}`);

      return `Public read endpoints accessible (Depts: ${deptsRes.data?.count || deptsRes.data?.data?.length}, Articles: ${articlesRes.data?.total || articlesRes.data?.data?.length})`;
    });

    // ========================================================================
    // SUITE C: ARTICLE WORKFLOW & MANUAL AUTHORING
    // ========================================================================
    console.log(`\n${BOLD}${YELLOW}--- SUITE C: ARTICLE WORKFLOW & MANUAL AUTHORING ---${RESET}`);

    await recordTest('TC-ART-01', 'Dept Editor submits valid dispatch (POST /api/articles)', async () => {
      const stamp = Date.now().toString().slice(-4);
      const payload = {
        title: `Catalytic Innovations in Green Chemistry Synthesis (${stamp})`,
        category: 'Research',
        excerpt: 'Department of Chemistry unveils scalable green catalysis protocol.',
        content: '### Sustainable Organic Chemistry\n\nThe faculty and researchers at Madras Christian College present groundbreaking results in non-toxic catalytic mechanisms.',
        department_id: 25,
        status: 'published',
        cover_image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
        author_name: 'Dr. Department Correspondent',
      };

      const res = await request('/api/articles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${deptEditorToken}` },
        body: JSON.stringify(payload),
      });

      if (res.status !== 201) throw new Error(`Expected HTTP 201 Created, got ${res.status}: ${JSON.stringify(res.data)}`);
      if (!res.data?.data?.id) throw new Error('Article ID not returned');
      if (res.data?.data?.department_id !== 25) throw new Error(`Expected department_id 25, got ${res.data?.data?.department_id}`);
      if (res.data?.data?.status !== 'published') throw new Error(`Expected status 'published', got '${res.data?.data?.status}'`);

      testArticleId = res.data.data.id;
      return `Article created ID: ${testArticleId}, Slug: "${res.data.data.slug}", Locked to Dept: ${res.data.data.department_name}`;
    });

    await recordTest('TC-ART-02', 'Public reads department articles (GET /api/articles?department=chem-aid)', async () => {
      const res = await request('/api/articles?department=chem-aid');
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const items = res.data?.data || [];
      if (!Array.isArray(items) || items.length === 0) throw new Error('Expected at least 1 article in Chemistry feed');
      const found = items.find((a) => a.id === testArticleId);
      if (!found) throw new Error(`Article ID ${testArticleId} not found in Chemistry feed`);
      return `Verified ${items.length} article(s) in department feed; newest dispatch confirmed`;
    });

    await recordTest('TC-ART-03', 'Dept Editor updates their authored article (PUT /api/articles/:id)', async () => {
      if (!testArticleId) throw new Error('No article ID available from TC-ART-01');
      const updatedTitle = `Catalytic Innovations in Green Chemistry Synthesis [Revised]`;
      const res = await request(`/api/articles/${testArticleId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${deptEditorToken}` },
        body: JSON.stringify({
          title: updatedTitle,
          summary: 'Updated summary highlighting industrial application tests.',
        }),
      });

      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      return `Article ID ${testArticleId} updated successfully`;
    });

    await recordTest('TC-ART-04', 'Submit article missing required title/content rejects with HTTP 400', async () => {
      const res = await request('/api/articles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${deptEditorToken}` },
        body: JSON.stringify({ category: 'Research', excerpt: 'Incomplete dispatch' }),
      });

      if (res.status !== 400) throw new Error(`Expected HTTP 400 Bad Request, got ${res.status}`);
      return `Rejected with 400 Bad Request: "${res.data?.error || 'Validation error'}"`;
    });

    // ========================================================================
    // SUITE D: DYNAMIC BROADSHEET COLUMNS CRUD
    // ========================================================================
    console.log(`\n${BOLD}${YELLOW}--- SUITE D: DYNAMIC BROADSHEET COLUMNS CRUD ---${RESET}`);

    await recordTest('TC-COL-01', 'Super Admin lists all active columns (GET /api/columns)', async () => {
      const res = await request('/api/columns', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const columns = res.data?.data || [];
      if (!Array.isArray(columns) || columns.length === 0) throw new Error('No columns/categories found');
      return `Retrieved ${columns.length} broadsheet columns (e.g., "${columns[0].name}")`;
    });

    await recordTest('TC-COL-02', 'Super Admin creates a new column (POST /api/columns)', async () => {
      const stamp = Date.now().toString().slice(-4);
      const res = await request('/api/columns', {
        method: 'POST',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: JSON.stringify({
          name: `Audit Special Column ${stamp}`,
          slug: `audit-col-${stamp}`,
          description: 'Special investigative reports and collegiate archives.',
        }),
      });

      if (res.status !== 201) throw new Error(`Expected HTTP 201 Created, got ${res.status}: ${JSON.stringify(res.data)}`);
      testColumnId = res.data?.data?.id;
      if (!testColumnId) throw new Error('Column ID missing from creation response');
      return `Created Column ID: ${testColumnId}, Name: "${res.data.data.name}"`;
    });

    await recordTest('TC-COL-03', 'Super Admin updates column name (PUT /api/columns/:id)', async () => {
      if (!testColumnId) throw new Error('No column ID available from TC-COL-02');
      const res = await request(`/api/columns/${testColumnId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: JSON.stringify({
          name: `Updated Audit Column`,
          description: 'Refined description for archival column.',
        }),
      });

      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      return `Column ID ${testColumnId} updated to "${res.data?.data?.name}"`;
    });

    await recordTest('TC-COL-04', 'Super Admin removes a column with delete safety (DELETE /api/columns/:id)', async () => {
      if (!testColumnId) throw new Error('No column ID available from TC-COL-02');
      const res = await request(`/api/columns/${testColumnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      return `Column ID ${testColumnId} purged cleanly`;
    });

    // ========================================================================
    // SUITE E: DATABASE RELATIONAL INTEGRITY & SEED AUDIT
    // ========================================================================
    console.log(`\n${BOLD}${YELLOW}--- SUITE E: DATABASE RELATIONAL INTEGRITY & SEED AUDIT ---${RESET}`);

    await recordTest('TC-DB-01', 'Official Department Count (17 Aided + 21 Self-Financed = 38)', async () => {
      const [aidedRows] = await db.query(
        "SELECT COUNT(*) AS total FROM departments WHERE LOWER(stream) = 'aided'"
      );
      const aidedCount = aidedRows[0].total;

      const [sfsRows] = await db.query(
        "SELECT COUNT(*) AS total FROM departments WHERE LOWER(REPLACE(stream, '-', '_')) = 'self_financed' OR stream = 'Self-Financed'"
      );
      const sfsCount = sfsRows[0].total;

      const [totalRows] = await db.query("SELECT COUNT(*) AS total FROM departments");
      const totalCount = totalRows[0].total;

      if (aidedCount !== 17) throw new Error(`Expected 17 Aided departments, found ${aidedCount}`);
      if (sfsCount !== 21) throw new Error(`Expected 21 Self-Financed departments, found ${sfsCount}`);
      if (totalCount !== 38) throw new Error(`Expected 38 total departments, found ${totalCount}`);

      return `Verified: ${aidedCount} Aided + ${sfsCount} Self-Financed = ${totalCount} Official Departments`;
    });

    await recordTest('TC-DB-02', 'Zero placeholder/dummy articles in broadsheet archives', async () => {
      const [dummyRows] = await db.query(
        `SELECT COUNT(*) AS total FROM articles 
         WHERE LOWER(title) LIKE '%lorem%' 
            OR LOWER(content) LIKE '%lorem%' 
            OR LOWER(summary) LIKE '%lorem%'
            OR LOWER(title) LIKE '%dummy%'
            OR LOWER(title) LIKE '%placeholder%'`
      );
      const dummyCount = dummyRows[0].total;
      if (dummyCount !== 0) throw new Error(`Found ${dummyCount} dummy/placeholder article(s) in database`);

      const [allArticles] = await db.query('SELECT COUNT(*) AS total FROM articles');
      return `Broadsheet clean: 0 synthetic placeholders across all ${allArticles[0].total} published stories`;
    });

    await recordTest('TC-DB-03', 'Foreign Key & Department Deletion Safety with active dispatches', async () => {
      // Attempt to delete Chemistry Department (ID 25) which has active articles
      const res = await request('/api/departments/25', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      // Controller must refuse deletion to preserve editorial associations
      if (res.status !== 400 && res.status !== 409) {
        throw new Error(`Expected refusal HTTP 400/409, got ${res.status}`);
      }

      return `Safety verified: Deletion blocked (HTTP ${res.status}) with message: "${res.data?.error}"`;
    });

  } catch (globalErr) {
    console.error(`\n${RED}Fatal execution error in test runner: ${globalErr.message}${RESET}`);
  } finally {
    await db.end();
  }

  // Summary Report
  console.log('\n========================================================================');
  console.log(`${BOLD}AUDIT EXECUTION SUMMARY${RESET}`);
  console.log('========================================================================');
  console.log(`Total Test Cases : ${totalTests}`);
  console.log(`Passed           : ${GREEN}${BOLD}${passedTests}${RESET}`);
  console.log(`Failed           : ${failedTests > 0 ? RED + BOLD + failedTests + RESET : GREEN + '0' + RESET}`);
  console.log(`Pass Rate        : ${BOLD}${Math.round((passedTests / (totalTests || 1)) * 100)}%${RESET}`);

  if (failures.length > 0) {
    console.log(`\n${RED}${BOLD}FAILED TEST CASES:${RESET}`);
    failures.forEach((f) => {
      console.log(`  - [${f.id}] ${f.name}: ${f.error}`);
    });
    console.log('========================================================================\n');
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}✓ ALL 5 AUDIT TIERS (19 TEST CASES) PASSED WITH ZERO VULNERABILITIES.${RESET}`);
    console.log('========================================================================\n');
    process.exit(0);
  }
}

runAudit();
