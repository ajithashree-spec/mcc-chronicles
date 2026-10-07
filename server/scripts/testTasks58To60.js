const http = require('http');
const app = require('../index');
const pool = require('../config/db');

function makeRequest(port, method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, text: data });
        } catch {
          resolve({ status: res.statusCode, data: null, text: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runTasks58To60Tests() {
  console.log('========================================================================');
  console.log('=== VERIFYING TASKS 58, 59 & 60 BACKEND APIS                         ===');
  console.log('========================================================================\n');

  let server;
  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    // 1. Task 58: GET /api/articles?category=campus-news
    console.log('[TEST 1] Testing Category Filtering (GET /api/articles?category=campus-news)...');
    const resCat = await makeRequest(port, 'GET', '/api/articles?category=campus-news&limit=5');
    if (resCat.status !== 200 || !resCat.data?.success) {
      throw new Error(`Category articles query failed. Status: ${resCat.status}, Body: ${resCat.text}`);
    }
    console.log(`[PASS] Category query returned HTTP 200 with ${resCat.data.data.length} articles.\n`);

    // 2. Task 59: GET /api/search?q=DeepWoods
    console.log('[TEST 2] Testing Global Search (GET /api/search?q=DeepWoods)...');
    const resSearch = await makeRequest(port, 'GET', '/api/search?q=DeepWoods');
    if (resSearch.status !== 200 || !resSearch.data?.success || !resSearch.data?.results) {
      throw new Error(`Search failed. Status: ${resSearch.status}, Body: ${resSearch.text}`);
    }
    console.log(`[PASS] Search returned totalMatches=${resSearch.data.totalMatches} (articles: ${resSearch.data.results.articles.length}, circulars: ${resSearch.data.results.circulars.length}).\n`);

    // 3. Task 60: GET /api/circulars
    console.log('[TEST 3] Testing Public Circulars (GET /api/circulars)...');
    const resCirc = await makeRequest(port, 'GET', '/api/circulars?limit=10');
    if (resCirc.status !== 200 || !resCirc.data?.success) {
      throw new Error(`Circulars query failed. Status: ${resCirc.status}, Body: ${resCirc.text}`);
    }
    console.log(`[PASS] Circulars query returned HTTP 200 with ${resCirc.data.data.length} circulars.\n`);

    // 4. Task 60: GET /api/departments
    console.log('[TEST 4] Testing Departments List (GET /api/departments)...');
    const resDept = await makeRequest(port, 'GET', '/api/departments');
    if (resDept.status !== 200 || !resDept.data?.success) {
      throw new Error(`Departments query failed. Status: ${resDept.status}, Body: ${resDept.text}`);
    }
    console.log(`[PASS] Departments query returned HTTP 200 with ${resDept.data.data.length} departments.\n`);

    console.log('========================================================================');
    console.log('=== ALL BACKEND ENDPOINTS FOR TASKS 58, 59 & 60 PASSED               ===');
    console.log('========================================================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('[TEST FAILURE]:', err.message);
    if (server) server.close();
    process.exit(1);
  }
}

runTasks58To60Tests();
