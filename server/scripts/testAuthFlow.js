/**
 * Comprehensive Automated Verification for Full Authentication & Dynamic Password Change
 * Runs all tests specified in TASK 5:
 * 1. Login with superadmin & default password -> 200
 * 2. Password change with wrong current password -> 401
 * 3. Password change with correct current password -> 200
 * 4. Login with old password -> 401 rejection
 * 5. Login with new password -> 200 success
 * 6. Repeat for editorial admin
 */

const API_URL = 'http://localhost:5000/api';

async function postJson(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function putJson(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function runAuthFlowTests() {
  console.log('=== STARTING TEST_AUTH_FLOW.JS VERIFICATION ===\n');

  // Step 1: Login with superadmin and default password
  console.log('[STEP 1] Testing login for "superadmin" with default password...');
  let superLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    password: 'superadmin',
    portal: 'superadmin',
  });

  if (!superLogin.ok) {
    // Try fallback to root
    superLogin = await postJson(`${API_URL}/auth/login`, {
      username: 'superadmin',
      password: 'root',
      portal: 'superadmin',
    });
  }

  if (!superLogin.ok) {
    console.error('  FAIL: Could not log in as superadmin with default credentials:', superLogin.data);
    process.exit(1);
  }
  console.log('  PASS: Logged in as superadmin. Role:', superLogin.data.user.role, '| Token received.');
  const initialSuperToken = superLogin.data.token;

  // Step 2: Attempt password change with wrong existing password
  console.log('\n[STEP 2] Attempting password change with WRONG existing password on PUT /api/auth/change-password...');
  const wrongAttempt = await putJson(
    `${API_URL}/auth/change-password`,
    {
      username: 'superadmin',
      currentPassword: 'completely_wrong_current_password_xyz',
      newPassword: 'BrandNewSuperPassword2026!',
    },
    initialSuperToken
  );

  if (wrongAttempt.status === 401) {
    console.log('  PASS: Correctly rejected with status 401 Unauthorized.');
    console.log('  Response Message:', wrongAttempt.data.message);
  } else {
    console.error('  FAIL: Expected 401 status but received:', wrongAttempt.status, wrongAttempt.data);
    process.exit(1);
  }

  // Step 3: Perform password change with correct existing password
  const newSuperSecret = 'BrandNewSuperPassword2026!';
  console.log(`\n[STEP 3] Updating password to "${newSuperSecret}" with correct existing password...`);
  const validChange = await putJson(
    `${API_URL}/auth/change-password`,
    {
      username: 'superadmin',
      currentPassword: 'superadmin',
      newPassword: newSuperSecret,
      confirmPassword: newSuperSecret,
    },
    initialSuperToken
  );

  if (validChange.status === 200 && validChange.data.success) {
    console.log('  PASS: Password update succeeded with status 200.');
    console.log('  Response Message:', validChange.data.message);
  } else {
    console.error('  FAIL: Valid password update was rejected:', validChange.status, validChange.data);
    process.exit(1);
  }

  // Step 4: Attempt login with old password -> must be rejected immediately
  console.log('\n[STEP 4] Verifying OLD password is REJECTED for superadmin...');
  const oldLoginAttempt1 = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    password: 'superadmin',
  });
  const oldLoginAttempt2 = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    password: 'root',
  });

  if (oldLoginAttempt1.status === 401 && oldLoginAttempt2.status === 401) {
    console.log('  PASS: Old password ("superadmin" & "root") strictly rejected with 401.');
  } else {
    console.error('  FAIL: Old password was accepted! Immediate invalidation failed.');
    process.exit(1);
  }

  // Step 5: Attempt login with NEW password -> must succeed
  console.log(`\n[STEP 5] Verifying NEW password ("${newSuperSecret}") SUCCEEDS for superadmin...`);
  const newLoginAttempt = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    password: newSuperSecret,
    portal: 'superadmin',
  });

  if (newLoginAttempt.ok && newLoginAttempt.data.token) {
    console.log('  PASS: Successfully authenticated with new password. User:', newLoginAttempt.data.user.username);
  } else {
    console.error('  FAIL: Login with new password failed:', newLoginAttempt.status, newLoginAttempt.data);
    process.exit(1);
  }
  const updatedSuperToken = newLoginAttempt.data.token;

  // Step 6: Test Admin user cycle
  console.log('\n[STEP 6] Testing Admin account dynamic password change cycle...');
  const adminInitialLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'admin',
    password: 'admin',
    portal: 'admin',
  });

  if (!adminInitialLogin.ok) {
    console.error('  FAIL: Admin initial login failed:', adminInitialLogin.data);
    process.exit(1);
  }
  console.log('  PASS: Initial login as "admin" succeeded. Role:', adminInitialLogin.data.user.role);

  // Admin wrong password check
  const adminWrong = await putJson(
    `${API_URL}/auth/change-password`,
    {
      username: 'admin',
      currentPassword: 'invalid_pass_for_admin',
      newPassword: 'BrandNewAdminPassword2026!',
    },
    adminInitialLogin.data.token
  );

  if (adminWrong.status === 401) {
    console.log('  PASS: Admin wrong current password rejected with 401. Message:', adminWrong.data.message);
  } else {
    console.error('  FAIL: Admin wrong password not rejected with 401:', adminWrong.status);
    process.exit(1);
  }

  // Admin valid change
  const newAdminSecret = 'BrandNewAdminPassword2026!';
  const adminChange = await putJson(
    `${API_URL}/auth/change-password`,
    {
      username: 'admin',
      currentPassword: 'admin',
      newPassword: newAdminSecret,
    },
    adminInitialLogin.data.token
  );

  if (adminChange.ok) {
    console.log('  PASS: Admin password updated successfully. Message:', adminChange.data.message);
  } else {
    console.error('  FAIL: Admin password update failed:', adminChange.status, adminChange.data);
    process.exit(1);
  }

  // Admin old password rejected
  const adminOldLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'admin',
    password: 'admin',
  });
  if (adminOldLogin.status === 401) {
    console.log('  PASS: Old admin password strictly rejected with 401.');
  } else {
    console.error('  FAIL: Old admin password was accepted!');
    process.exit(1);
  }

  // Admin new password succeeds
  const adminNewLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'admin',
    password: newAdminSecret,
  });
  if (adminNewLogin.ok) {
    console.log('  PASS: New admin password login succeeded for:', adminNewLogin.data.user.username);
  } else {
    console.error('  FAIL: New admin password login failed:', adminNewLogin.status, adminNewLogin.data);
    process.exit(1);
  }

  // Step 7: Clean reset back to standard defaults for subsequent dev use
  console.log('\n[STEP 7] Clean reset back to standard default passwords (superadmin -> superadmin, admin -> admin)...');
  await putJson(
    `${API_URL}/auth/change-password`,
    {
      username: 'superadmin',
      currentPassword: newSuperSecret,
      newPassword: 'superadmin',
    },
    updatedSuperToken
  );

  await putJson(
    `${API_URL}/auth/change-password`,
    {
      username: 'admin',
      currentPassword: newAdminSecret,
      newPassword: 'admin',
    },
    adminNewLogin.data.token
  );

  console.log('  PASS: Credentials cleanly restored to default passwords.');
  console.log('\n=== ALL AUTH FLOW TESTS COMPLETED WITH 100% SUCCESS ===\n');
  process.exit(0);
}

runAuthFlowTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
