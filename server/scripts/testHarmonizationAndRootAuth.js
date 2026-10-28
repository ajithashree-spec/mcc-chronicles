const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    // raw text or empty
  }

  return { status: res.status, data };
}

async function runTests() {
  console.log('=== RUNNING HARMONIZATION & ROOT AUTH VERIFICATION SUITE ===\n');

  let passed = 0;
  let total = 0;

  async function check(desc, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS ${total}] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL ${total}] ${desc}`);
      console.error('  Details:', err.message);
      throw err;
    }
  }

  // TEST 1: Root Login as Super Admin (default)
  let superToken = '';
  await check('POST /api/auth/login with { username: "root", password: "root" }', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'root', password: 'root' }),
    });
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
    assert.ok(res.data.token, 'Must return JWT token');
    assert.strictEqual(res.data.user.role, 'superadmin', 'Default root role must be superadmin');
    assert.strictEqual(res.data.user.email, 'root', 'User email must be root');
    superToken = res.data.token;
  });

  // TEST 2: Root Login into Admin portal (/admin)
  let adminToken = '';
  await check('POST /api/auth/login with { username: "root", password: "root", portal: "admin" }', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'root', password: 'root', portal: 'admin' }),
    });
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
    assert.ok(res.data.token, 'Must return JWT token');
    assert.strictEqual(res.data.user.role, 'admin', 'Root role for admin portal must be admin');
    assert.strictEqual(res.data.user.portal, 'admin', 'Portal must be admin');
    adminToken = res.data.token;
  });

  // TEST 3: Root Login via email property
  await check('POST /api/auth/login with { email: "root", password: "root" }', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'root', password: 'root' }),
    });
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
    assert.ok(res.data.token, 'Must return JWT token');
    assert.strictEqual(res.data.user.role, 'superadmin', 'Must return superadmin role');
  });

  // TEST 4: Permission Separation (Admin denied from Superadmin Audit Logs)
  await check('Verify Admin token is forbidden (HTTP 403) from /api/audit', async () => {
    const res = await request('/audit', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 403, 'Admin must receive HTTP 403 on governance audit logs');
  });

  // TEST 5: Permission Separation (Super Admin granted access to /api/audit)
  await check('Verify Super Admin token has access to /api/audit', async () => {
    const res = await request('/audit', {
      method: 'GET',
      headers: { Authorization: `Bearer ${superToken}` },
    });
    assert.strictEqual(res.status, 200, 'Super admin must receive HTTP 200 on audit logs');
    assert.ok(Array.isArray(res.data.data), 'Audit logs data array must exist');
  });

  // TEST 6: Articles Desk access for both roles
  await check('Verify /api/articles accessible by Admin and Superadmin', async () => {
    const resAdmin = await request('/articles', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resAdmin.status, 200, 'Admin must access articles desk');

    const resSuper = await request('/articles', {
      method: 'GET',
      headers: { Authorization: `Bearer ${superToken}` },
    });
    assert.strictEqual(resSuper.status, 200, 'Superadmin must access articles desk');
  });

  // TEST 7: 38 Department Bureaus Parity
  await check('Verify all 38 official department bureaus are returned', async () => {
    const res = await request('/departments');
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
    const depts = res.data.data || res.data;
    assert.strictEqual(depts.length, 38, 'Must return precisely 38 official MCC departments');
  });

  // TEST 8: Circulars / Breaking Ticker Endpoint
  await check('Verify /api/circulars is functional', async () => {
    const res = await request('/circulars');
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
  });

  // TEST 9: Photo Gallery / Slideshow Assets Endpoint
  await check('Verify /api/galleries is functional', async () => {
    const res = await request('/galleries');
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
  });

  // TEST 10: Purged Ghost Settings Verification
  await check('Verify /api/settings contains NO ghost settings', async () => {
    const res = await request('/settings');
    assert.strictEqual(res.status, 200, 'Must return HTTP 200');
    const settings = res.data.settings || {};
    
    // Assert ghost settings are absent
    const ghostKeys = [
      'site_title',
      'broadsheet_motto',
      'volume_number',
      'issue_number',
      'primary_color',
      'secondary_color',
      'accent_gold',
      'rss_feed_url',
      'atom_feed_url',
      'twitter_handle',
      'linkedin_url',
      'maintenance_mode',
      'comments_enabled',
    ];

    for (const key of ghostKeys) {
      assert.strictEqual(settings[key], undefined, `Ghost setting '${key}' must be completely absent from API response`);
    }

    assert.strictEqual(settings.breaking_ticker_enabled, 'true', 'Must contain verified breaking_ticker_enabled');
    assert.strictEqual(settings.hero_slideshow_mode, '80_20', 'Must contain verified hero_slideshow_mode');
    assert.strictEqual(settings.departments_count, '38', 'Must contain verified departments_count');
  });

  console.log(`\n=================================================`);
  console.log(`RESULTS: ${passed}/${total} TESTS PASSED PERFECTLY`);
  console.log(`=================================================\n`);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
