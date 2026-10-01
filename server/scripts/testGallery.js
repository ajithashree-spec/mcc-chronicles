const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, text: data, headers: res.headers });
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

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR GALLERY & CAROUSEL API ===\n');

  try {
    // 1. Authenticate as Super Admin
    console.log('[TEST 1] Logging in as Super Admin (admin@mcc.edu.in)...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@mcc.edu.in', password: 'Admin@MCC2026' }
    );

    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }
    const token = loginRes.data.token;
    console.log(`[PASS] Logged in successfully. Token acquired: ${token.substring(0, 16)}...\n`);

    // 2. Public GET /api/gallery (Unauthenticated)
    console.log('[TEST 2] Public GET /api/gallery (Unauthenticated)...');
    const publicGetRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gallery',
      method: 'GET',
    });
    console.log(`Status: ${publicGetRes.status}, Body:`, publicGetRes.data);
    if (publicGetRes.status !== 200 || !publicGetRes.data.success) {
      throw new Error(`Public GET /api/gallery failed with status ${publicGetRes.status}`);
    }
    console.log('[PASS] Public gallery items retrieved successfully.\n');

    // 3. Attempt Unauthenticated POST /api/gallery (Expect 401)
    console.log('[TEST 3] Attempt Unauthenticated POST /api/gallery (Expect 401)...');
    const unauthPostRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/gallery',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { title: 'Unauthorized Photo', image_url: 'https://mcc.edu.in/photo.jpg' }
    );
    console.log(`Status: ${unauthPostRes.status}, Body:`, unauthPostRes.data);
    if (unauthPostRes.status !== 401) {
      throw new Error(`Expected HTTP 401 but received ${unauthPostRes.status}`);
    }
    console.log('[PASS] Unauthorized POST rejected with HTTP 401.\n');

    // 4. Protected POST /api/gallery (Publish test photo)
    console.log('[TEST 4] Protected POST /api/gallery with Super Admin token...');
    const newPhotoPayload = {
      title: 'DeepWoods 2026 Grand Concert Finale',
      description: 'Over 5,000 students and alumni gathered under the starry sky for the closing performance.',
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
      caption: 'The main quadrangle alight during the performance',
      event_name: 'DeepWoods 2026',
      department_id: 1,
      is_featured_carousel: true,
    };

    const createRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/gallery',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      newPhotoPayload
    );
    console.log(`Status: ${createRes.status}, Body:`, createRes.data);
    if (createRes.status !== 201 || !createRes.data.success || !createRes.data.data.id) {
      throw new Error(`Create gallery item failed with status ${createRes.status}`);
    }
    const galleryId = createRes.data.data.id;
    console.log(`[PASS] Gallery photo published successfully with ID: ${galleryId}.\n`);

    // 5. GET /api/gallery?is_featured_carousel=true
    console.log('[TEST 5] GET /api/gallery?is_featured_carousel=true (Carousel filter)...');
    const carouselRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gallery?is_featured_carousel=true',
      method: 'GET',
    });
    console.log(`Status: ${carouselRes.status}, Total: ${carouselRes.data.pagination.total}, Count: ${carouselRes.data.count}`);
    if (
      carouselRes.status !== 200 ||
      !carouselRes.data.success ||
      carouselRes.data.count < 1 ||
      !carouselRes.data.data.every((item) => item.is_featured_carousel === 1 || item.is_featured_carousel === true)
    ) {
      throw new Error(`Carousel filter failed: ${JSON.stringify(carouselRes.data)}`);
    }
    console.log('[PASS] Filtered carousel items retrieved successfully.\n');

    // 6. GET /api/gallery/:id
    console.log(`[TEST 6] GET /api/gallery/${galleryId} by ID...`);
    const getByIdRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/gallery/${galleryId}`,
      method: 'GET',
    });
    console.log(`Status: ${getByIdRes.status}, Title:`, getByIdRes.data.data.title);
    if (getByIdRes.status !== 200 || !getByIdRes.data.success) {
      throw new Error(`Get by ID failed: ${JSON.stringify(getByIdRes.data)}`);
    }
    console.log('[PASS] Fetched single gallery item successfully.\n');

    // 7. Protected PUT /api/gallery/:id (Update photo details)
    console.log(`[TEST 7] Protected PUT /api/gallery/${galleryId}...`);
    const updateRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/gallery/${galleryId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      {
        title: 'DeepWoods 2026 Grand Concert Finale (Official Archive)',
        caption: 'Encore lights across the historic campus quadrangle',
        is_featured_carousel: true,
      }
    );
    console.log(`Status: ${updateRes.status}, Body:`, updateRes.data);
    if (
      updateRes.status !== 200 ||
      !updateRes.data.success ||
      updateRes.data.data.title !== 'DeepWoods 2026 Grand Concert Finale (Official Archive)'
    ) {
      throw new Error(`Update gallery item failed: ${JSON.stringify(updateRes.data)}`);
    }
    console.log('[PASS] Gallery item updated successfully.\n');

    // 8. Protected DELETE /api/gallery/:id (Delete photo)
    console.log(`[TEST 8] Protected DELETE /api/gallery/${galleryId}...`);
    const deleteRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/gallery/${galleryId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`Status: ${deleteRes.status}, Body:`, deleteRes.data);
    if (deleteRes.status !== 200 || !deleteRes.data.success) {
      throw new Error(`Delete gallery item failed: ${JSON.stringify(deleteRes.data)}`);
    }
    console.log('[PASS] Gallery item deleted successfully.\n');

    // 9. Verify 404 after deletion
    console.log(`[TEST 9] Verify 404 on deleted gallery ID ${galleryId}...`);
    const notFoundRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/gallery/${galleryId}`,
      method: 'GET',
    });
    console.log(`Status: ${notFoundRes.status}, Body:`, notFoundRes.data);
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected HTTP 404 but got ${notFoundRes.status}`);
    }
    console.log('[PASS] Verified 404 on deleted gallery ID.\n');

    console.log('=== ALL GALLERY & CAROUSEL API TESTS PASSED! ===');
  } catch (error) {
    console.error('[TEST ERROR]:', error.message);
    process.exit(1);
  }
}

runTests();
