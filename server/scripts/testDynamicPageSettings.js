/**
 * Verification test for Dynamic Page Settings & 1:1 Parity Endpoints
 * Uses Node 22 built-in fetch and FormData.
 */
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- 1. Testing Public GET /api/settings/public ---');
  const pubRes = await fetch(`${API_BASE}/settings/public`);
  const pubData = await pubRes.json();
  if (!pubData?.success || !pubData?.settings) {
    throw new Error('Public settings endpoint did not return expected structure: ' + JSON.stringify(pubData));
  }
  console.log('✓ Public GET returned settings:', Object.keys(pubData.settings).length, 'keys');
  console.log('  header_brand_title:', pubData.settings.header_brand_title);
  console.log('  ticker_enabled:', pubData.settings.ticker_enabled);
  console.log('  footer_email:', pubData.settings.footer_email);

  console.log('\n--- 2. Authenticating as Super Admin (root / root) ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'root',
      password: 'root',
      portal: 'superadmin',
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData?.token || loginData?.data?.token;
  if (!token) {
    throw new Error('Failed to obtain token for superadmin: ' + JSON.stringify(loginData));
  }
  console.log('✓ Superadmin authenticated successfully. Role:', loginData?.user?.role || loginData?.data?.user?.role);

  console.log('\n--- 3. Testing Protected PUT /api/settings/bulk ---');
  const testPayload = {
    header_brand_title: 'Madras Christian College',
    header_brand_subtitle: 'CAMPUS NEWS PORTAL',
    header_edition_text: 'Autonomous Institution • Affiliated to University of Madras • NAAC A++',
    header_date_mode: 'live',
    ticker_enabled: 'true',
    ticker_speed_ms: '4500',
    slideshow_speed_ms: '4500',
    footer_phone: '+91 44 2239 0675',
    footer_email: 'principal@mcc.edu.in',
  };

  const putRes = await fetch(`${API_BASE}/settings/bulk`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testPayload),
  });
  const putData = await putRes.json();
  if (!putData?.success) {
    throw new Error('Bulk update failed: ' + JSON.stringify(putData));
  }
  console.log('✓ PUT /api/settings/bulk succeeded:', putData.message);

  console.log('\n--- 4. Testing Media Upload POST /api/settings/upload ---');
  const dummyImgPath = path.join(__dirname, 'dummy_test.png');
  const tinyPng = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d450000000049454e44ae426082',
    'hex'
  );
  fs.writeFileSync(dummyImgPath, tinyPng);

  try {
    const fileBlob = new Blob([fs.readFileSync(dummyImgPath)], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', fileBlob, 'dummy_test.png');

    const uploadRes = await fetch(`${API_BASE}/settings/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (!uploadData?.success || !uploadData?.url) {
      throw new Error('Upload endpoint failed: ' + JSON.stringify(uploadData));
    }
    console.log('✓ Media upload succeeded. Clean relative URL:', uploadData.url);
  } finally {
    if (fs.existsSync(dummyImgPath)) {
      fs.unlinkSync(dummyImgPath);
    }
  }

  console.log('\n===========================================');
  console.log('ALL DYNAMIC SETTINGS ENDPOINT TESTS PASSED!');
  console.log('===========================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
