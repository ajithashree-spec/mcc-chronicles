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
  console.log('=== STARTING AUTOMATED TESTS FOR GLOBAL SEARCH API ===\n');

  try {
    // 1. GET /api/search?q= (Empty query, expect HTTP 400)
    console.log('[TEST 1] Hit GET /api/search?q= (Empty query verification)...');
    const emptyRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/search?q=',
      method: 'GET',
    });
    console.log(`Status: ${emptyRes.status}, Body:`, emptyRes.data);
    if (emptyRes.status !== 400 || emptyRes.data.success !== false) {
      throw new Error(`Expected HTTP 400 for empty search query, got ${emptyRes.status}`);
    }
    console.log('[PASS] Empty query properly rejected with HTTP 400.\n');

    // 2. GET /api/search?q=English (Verify presence of English department)
    console.log('[TEST 2] Hit GET /api/search?q=English (Verify English department match)...');
    const englishRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/search?q=English',
      method: 'GET',
    });
    console.log(`Status: ${englishRes.status}, Total Matches: ${englishRes.data.totalMatches}`);
    console.log('Departments matched:', englishRes.data.results.departments);
    const hasEnglishDept = englishRes.data.results.departments.some(
      (dept) => dept.name.toLowerCase() === 'english' || dept.code.toLowerCase().includes('eng')
    );
    if (englishRes.status !== 200 || !englishRes.data.success || !hasEnglishDept) {
      throw new Error(`Expected English department in search results: ${JSON.stringify(englishRes.data)}`);
    }
    console.log('[PASS] English department found in results.departments.\n');

    // 3. GET /api/search?q=News (Verify relevant matches across categories/articles)
    console.log('[TEST 3] Hit GET /api/search?q=News (Verify matches across articles)...');
    const newsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/search?q=News',
      method: 'GET',
    });
    console.log(`Status: ${newsRes.status}, Total Matches: ${newsRes.data.totalMatches}`);
    console.log('Articles matched:', newsRes.data.results.articles.map((a) => ({ id: a.id, title: a.title, category: a.category_name })));
    if (newsRes.status !== 200 || !newsRes.data.success || newsRes.data.results.articles.length < 1) {
      throw new Error(`Expected articles matching "News": ${JSON.stringify(newsRes.data)}`);
    }
    console.log('[PASS] "News" successfully matched published article(s).\n');

    // 4. GET /api/search?q=Exam&type=circulars (Verify circulars list)
    console.log('[TEST 4] Hit GET /api/search?q=Exam&type=circulars (Verify circulars list)...');
    const examRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/search?q=Exam&type=circulars',
      method: 'GET',
    });
    console.log(`Status: ${examRes.status}, Total Matches: ${examRes.data.totalMatches}`);
    console.log('Circulars matched:', examRes.data.results.circulars);
    if (
      examRes.status !== 200 ||
      !examRes.data.success ||
      examRes.data.results.circulars.length < 1 ||
      examRes.data.results.articles.length !== 0 ||
      examRes.data.results.departments.length !== 0
    ) {
      throw new Error(`Expected circulars matching "Exam" with other entities empty: ${JSON.stringify(examRes.data)}`);
    }
    console.log('[PASS] "Exam" with type=circulars returned circulars successfully.\n');

    // 5. Test validation: search query < 2 characters
    console.log('[TEST 5] Hit GET /api/search?q=x (Short query < 2 chars)...');
    const shortRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/search?q=x',
      method: 'GET',
    });
    console.log(`Status: ${shortRes.status}, Body:`, shortRes.data);
    if (shortRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for short query, got ${shortRes.status}`);
    }
    console.log('[PASS] Short query (<2 chars) properly rejected with HTTP 400.\n');

    console.log('=== ALL GLOBAL SEARCH API VERIFICATION TESTS PASSED! ===');
  } catch (error) {
    console.error('[TEST FAILED]:', error.message);
    process.exit(1);
  }
}

runTests();
