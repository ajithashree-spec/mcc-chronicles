const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../index');
const pool = require('../config/db');

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

async function runTasks89To92Tests() {
  console.log('===========================================================================');
  console.log('=== BACKEND INTEGRATION TEST SUITE: TASKS 89, 90, 91 & 92/140           ===');
  console.log('===========================================================================\n');

  let serverInstance = null;
  const PORT = process.env.PORT || 5000;
  const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';

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

  try {
    // 1. Check or start test server
    await new Promise((resolve) => {
      const probe = http.get(`http://localhost:${PORT}/api/health`, () => resolve());
      probe.on('error', () => {
        serverInstance = app.listen(PORT, () => {
          console.log(`[INFO] Started test server instance on http://localhost:${PORT}\n`);
          resolve();
        });
      });
    });

    // 2. Obtain Super Admin token
    console.log('[STEP 1] Super Admin Authentication');
    const adminLoginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: 'admin@mcc.edu.in',
      password: 'Admin@MCC2026',
    });

    assert(adminLoginRes.status === 200, 'Super Admin login returns HTTP 200');
    assert(adminLoginRes.data?.token, 'Super Admin login provides JWT token');
    const adminToken = adminLoginRes.data?.token;
    const adminUserId = adminLoginRes.data?.user?.id;

    // 3. Task 90: Super Admin User Management (GET /api/users)
    console.log('\n[STEP 2] Super Admin Staff Listing (GET /api/users)');
    const listUsersRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(listUsersRes.status === 200, 'GET /api/users returns HTTP 200');
    assert(Array.isArray(listUsersRes.data?.data), 'GET /api/users returns users array');
    assert(listUsersRes.data?.data?.length > 0, `Users returned: ${listUsersRes.data?.data?.length}`);

    // Verify RBAC restriction for non-super-admin
    const reporterDummyToken = jwt.sign(
      { id: 9999, email: 'dummy@mcc.edu.in', role: 'reporter' },
      secret,
      { expiresIn: '10m' }
    );
    const forbiddenUsersRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${reporterDummyToken}` },
    });
    assert(forbiddenUsersRes.status === 403, 'GET /api/users blocks non-super_admin with HTTP 403');

    // 4. Task 90: Super Admin Create Staff (POST /api/users)
    console.log('\n[STEP 3] Super Admin Create Staff User (POST /api/users)');
    const tempStaffEmail = `test.reporter.${Date.now()}@mcc.edu.in`;
    const tempInitialPass = 'TempPass@2026';

    const createUserRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      name: 'Test Desk Correspondent',
      email: tempStaffEmail,
      password: tempInitialPass,
      role: 'reporter',
      department_id: 1,
    });

    assert(createUserRes.status === 201, 'POST /api/users creates user with HTTP 201');
    assert(createUserRes.data?.data?.email === tempStaffEmail, 'Created user matches email');
    const tempUserId = createUserRes.data?.data?.id;
    assert(Boolean(tempUserId), `Temporary user created with ID ${tempUserId}`);

    // 5. Test Temporary User Login
    console.log('\n[STEP 4] Temporary User Login with Initial Password');
    const tempLoginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: tempStaffEmail,
      password: tempInitialPass,
    });

    assert(tempLoginRes.status === 200, 'Temporary user successfully authenticates');
    const tempUserToken = tempLoginRes.data?.token;
    assert(Boolean(tempUserToken), 'Temporary user received JWT token');

    // 6. Task 89: User Profile Update (PUT /api/users/profile)
    console.log('\n[STEP 5] Authenticated User Profile Update (PUT /api/users/profile)');
    const updatedBio = 'Reporting from the Bishop Heber Hall Press Gallery.';
    const updatedAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    const updateProfileRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/profile',
      method: 'PUT',
      headers: { Authorization: `Bearer ${tempUserToken}` },
    }, {
      name: 'Test Correspondent Updated',
      bio: updatedBio,
      avatar_url: updatedAvatar,
    });

    assert(updateProfileRes.status === 200, 'PUT /api/users/profile returns HTTP 200');
    assert(updateProfileRes.data?.data?.name === 'Test Correspondent Updated', 'Profile name updated');
    assert(updateProfileRes.data?.data?.bio === updatedBio, 'Profile bio updated');
    assert(updateProfileRes.data?.data?.avatar_url === updatedAvatar, 'Profile avatar updated');

    // 7. Task 89: Security Password Change (PUT /api/users/change-password)
    console.log('\n[STEP 6] Security Password Change (PUT /api/users/change-password)');
    const newSecurePass = 'StrongPass@MCC2026';

    // Test password strength enforcement (< 8 chars should fail)
    const weakPassRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/change-password',
      method: 'PUT',
      headers: { Authorization: `Bearer ${tempUserToken}` },
    }, {
      currentPassword: tempInitialPass,
      newPassword: 'short',
    });
    assert(weakPassRes.status === 400, 'Reject weak password (< 8 chars) with HTTP 400');

    // Test incorrect current password
    const wrongCurrentRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/change-password',
      method: 'PUT',
      headers: { Authorization: `Bearer ${tempUserToken}` },
    }, {
      currentPassword: 'WrongPassword123',
      newPassword: newSecurePass,
    });
    assert(wrongCurrentRes.status === 401, 'Reject incorrect current password with HTTP 401');

    // Test valid password change
    const validChangeRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/change-password',
      method: 'PUT',
      headers: { Authorization: `Bearer ${tempUserToken}` },
    }, {
      currentPassword: tempInitialPass,
      newPassword: newSecurePass,
    });
    assert(validChangeRes.status === 200, 'Valid password change returns HTTP 200');

    // Verify login with OLD password now fails
    const oldLoginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: tempStaffEmail,
      password: tempInitialPass,
    });
    assert(oldLoginRes.status === 401, 'Login with old password rejected with HTTP 401');

    // Verify login with NEW password succeeds
    const newLoginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: tempStaffEmail,
      password: newSecurePass,
    });
    assert(newLoginRes.status === 200, 'Login with new password succeeds with HTTP 200');

    // 8. Task 90: Super Admin Self-Deletion Prevention
    console.log('\n[STEP 7] Prevent Self-Deletion of Super Admin');
    const selfDeleteRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/users/${adminUserId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(selfDeleteRes.status === 400, 'Super Admin self-deletion rejected with HTTP 400');

    // 9. Task 90: Delete Staff Account (DELETE /api/users/:id)
    console.log('\n[STEP 8] Super Admin Deletes Temporary Staff Account');
    const deleteStaffRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/users/${tempUserId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteStaffRes.status === 200, 'DELETE /api/users/:id returns HTTP 200');

    // Verify user no longer exists
    const checkDeletedRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/users/${tempUserId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(checkDeletedRes.status === 404, 'Deleted user returns HTTP 404');

    // 10. Task 91: Department Directory Endpoint (GET /api/departments)
    console.log('\n[STEP 9] Academic Department Registry (GET /api/departments)');
    const deptRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/departments',
      method: 'GET',
    });
    assert(deptRes.status === 200, 'GET /api/departments returns HTTP 200');
    assert(Array.isArray(deptRes.data?.data), 'Departments list is an array');
    assert(deptRes.data?.data?.length >= 10, `Academic departments found: ${deptRes.data?.data?.length} (>= 10)`);

    console.log('\n===========================================================================');
    console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await pool.end();
  }
}

runTasks89To92Tests();
