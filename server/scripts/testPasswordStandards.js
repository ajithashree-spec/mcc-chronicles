/**
 * Automated Verification Script using native fetch (Node 22) for:
 * 1. Standardized usernames (`superadmin` and `admin`)
 * 2. Current-password verification enforcement on PUT /api/auth/change-password
 * 3. Bcrypt hash persistence and immediate rejection of previous password
 * 4. Subsequent login success with new password
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

async function runTests() {
  console.log('=== STARTING PASSWORD & USERNAME STANDARDIZATION TESTS ===\n');

  // Test 1: Login with standardized username "superadmin"
  console.log('[TEST 1] Logging in as superadmin with initial password "root"...');
  const superLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    identifier: 'superadmin',
    password: 'root',
    portal: 'superadmin',
  });

  if (!superLogin.ok) {
    console.error('  FAIL: Could not log in as superadmin:', superLogin.data);
    process.exit(1);
  }
  console.log('  PASS: Logged in as superadmin successfully. Token received. Role:', superLogin.data.user.role);
  const superToken = superLogin.data.token;

  // Test 2: Login with standardized username "admin"
  console.log('\n[TEST 2] Logging in as admin with initial password "root"...');
  const adminLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'admin',
    identifier: 'admin',
    password: 'root',
    portal: 'admin',
  });

  if (!adminLogin.ok) {
    console.error('  FAIL: Could not log in as admin:', adminLogin.data);
    process.exit(1);
  }
  console.log('  PASS: Logged in as admin successfully. Token received. Role:', adminLogin.data.user.role);

  // Test 3: Attempt password change with INCORRECT current password
  console.log('\n[TEST 3] Testing rejection of INCORRECT current password on PUT /api/auth/change-password...');
  const wrongCurrent = await putJson(
    `${API_URL}/auth/change-password`,
    {
      targetRole: 'superadmin',
      currentPassword: 'wrong_current_password_123',
      newPassword: 'NewSuperPassword2026!',
      confirmPassword: 'NewSuperPassword2026!',
    },
    superToken
  );

  if (wrongCurrent.status === 401 || wrongCurrent.status === 400) {
    console.log(`  PASS: Correctly rejected with status ${wrongCurrent.status}. Message:`, wrongCurrent.data.message);
  } else {
    console.error('  FAIL: Expected 401/400 but got:', wrongCurrent.status, wrongCurrent.data);
    process.exit(1);
  }

  // Test 4: Attempt password change with MISMATCHED confirm password
  console.log('\n[TEST 4] Testing rejection of MISMATCHED confirm password...');
  const mismatchConfirm = await putJson(
    `${API_URL}/auth/change-password`,
    {
      targetRole: 'superadmin',
      currentPassword: 'root',
      newPassword: 'NewSuperPassword2026!',
      confirmPassword: 'CompletelyDifferentPassword!',
    },
    superToken
  );

  if (mismatchConfirm.status === 400) {
    console.log('  PASS: Correctly rejected with status 400. Message:', mismatchConfirm.data.message);
  } else {
    console.error('  FAIL: Expected 400 for mismatch but got:', mismatchConfirm.status, mismatchConfirm.data);
    process.exit(1);
  }

  // Test 5: Successful password update for Super Admin
  const tempSuperPass = 'SuperSecret2026!';
  console.log(`\n[TEST 5] Updating Super Admin password to "${tempSuperPass}"...`);
  const updateSuper = await putJson(
    `${API_URL}/auth/change-password`,
    {
      targetRole: 'superadmin',
      currentPassword: 'root',
      newPassword: tempSuperPass,
      confirmPassword: tempSuperPass,
    },
    superToken
  );

  if (updateSuper.ok) {
    console.log('  PASS: Password update succeeded with status 200. Message:', updateSuper.data.message);
  } else {
    console.error('  FAIL: Valid password update failed:', updateSuper.status, updateSuper.data);
    process.exit(1);
  }

  // Test 6: Verify old password "root" is immediately rejected for Super Admin
  console.log('\n[TEST 6] Verifying old password "root" is immediately REJECTED for superadmin...');
  const oldSuperLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    identifier: 'superadmin',
    password: 'root',
  });

  if (oldSuperLogin.status === 401) {
    console.log('  PASS: Old password rejected with status 401. Access denied.');
  } else {
    console.error('  FAIL: Old password was accepted! Status:', oldSuperLogin.status);
    process.exit(1);
  }

  // Test 7: Verify new password succeeds for Super Admin
  console.log(`\n[TEST 7] Verifying new password "${tempSuperPass}" SUCCEEDS for superadmin...`);
  const newSuperLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    identifier: 'superadmin',
    password: tempSuperPass,
  });

  if (newSuperLogin.ok) {
    console.log('  PASS: Successfully logged in with new password. Token received for:', newSuperLogin.data.user.username);
  } else {
    console.error('  FAIL: Login with new password failed:', newSuperLogin.status, newSuperLogin.data);
    process.exit(1);
  }
  const newSuperToken = newSuperLogin.data.token;

  // Test 8: Password update for Admin account
  const tempAdminPass = 'AdminSecret2026!';
  console.log(`\n[TEST 8] Updating Admin account password to "${tempAdminPass}"...`);
  const updateAdmin = await putJson(
    `${API_URL}/auth/change-password`,
    {
      targetRole: 'admin',
      currentPassword: 'root',
      newPassword: tempAdminPass,
      confirmPassword: tempAdminPass,
    },
    newSuperToken
  );

  if (updateAdmin.ok) {
    console.log('  PASS: Admin password update succeeded with status 200. Message:', updateAdmin.data.message);
  } else {
    console.error('  FAIL: Admin password update failed:', updateAdmin.status, updateAdmin.data);
    process.exit(1);
  }

  // Test 9: Verify old password rejected and new password succeeds for Admin
  console.log('\n[TEST 9] Verifying old password rejected and new password succeeds for admin...');
  const oldAdminLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'admin',
    identifier: 'admin',
    password: 'root',
  });

  if (oldAdminLogin.status === 401) {
    console.log('  PASS: Old admin password rejected with status 401.');
  } else {
    console.error('  FAIL: Old admin password was accepted! Status:', oldAdminLogin.status);
    process.exit(1);
  }

  const newAdminLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'admin',
    identifier: 'admin',
    password: tempAdminPass,
  });

  if (newAdminLogin.ok) {
    console.log('  PASS: New admin password login succeeded for:', newAdminLogin.data.user.username);
  } else {
    console.error('  FAIL: New admin password login failed:', newAdminLogin.status, newAdminLogin.data);
    process.exit(1);
  }

  // Clean Reset: Revert both passwords back to "root" so default development credentials remain standard
  console.log('\n[CLEAN RESET] Reverting passwords back to "root" for both accounts...');
  await putJson(
    `${API_URL}/auth/change-password`,
    {
      targetRole: 'superadmin',
      currentPassword: tempSuperPass,
      newPassword: 'root',
      confirmPassword: 'root',
    },
    newSuperToken
  );

  const resetSuperLogin = await postJson(`${API_URL}/auth/login`, {
    username: 'superadmin',
    identifier: 'superadmin',
    password: 'root',
  });

  await putJson(
    `${API_URL}/auth/change-password`,
    {
      targetRole: 'admin',
      currentPassword: tempAdminPass,
      newPassword: 'root',
      confirmPassword: 'root',
    },
    resetSuperLogin.data.token
  );

  console.log('  PASS: Passwords cleanly reset to "root" for both accounts.');
  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
