const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function testCrudWorkflow() {
  console.log('=== VERIFYING CLEAN CRUD TABLE WORKFLOW FOR ARTICLES DESK ===\n');

  // 1. Login as Unified Admin Editor
  console.log('[1] Logging in as editor@mcc.edu.in...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'editor@mcc.edu.in', password: 'Editor@MCC2026' }),
  });
  assert.strictEqual(loginRes.status, 200, 'Login must succeed');
  const { token } = await loginRes.json();
  console.log('✓ Logged in successfully');

  // 2. Fetch initial articles list (should be empty initially)
  console.log('\n[2] Fetching initial articles list...');
  const initRes = await fetch(`${API_BASE}/articles?status=all&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const initData = await initRes.json();
  const initialArticles = Array.isArray(initData.data) ? initData.data : initData;
  console.log(`Initial articles count: ${initialArticles.length}`);

  // 3. Compose a New Dispatch (simulate "+ COMPOSE NEW DISPATCH" button)
  console.log('\n[3] Testing "+ COMPOSE NEW DISPATCH" action...');
  const deptRes = await fetch(`${API_BASE}/departments`);
  const depts = (await deptRes.json()).data || (await deptRes.json());
  const targetDept = depts[0];

  const testPayload = {
    title: 'Historic Miller Memorial Library Inaugurates Digital Rare Manuscripts Desk',
    summary: 'Centuries-old missionary records, regional Tamil folios, and botanical classifications digitized for public scholarly research.',
    content: 'Full article body documenting the digitization efforts, climate-controlled archival vaults, and scholarly access guidelines.',
    author_name: 'Dr. Sarah Alexander & Curatorial Staff',
    category_id: 1,
    department_id: targetDept.id, // Real department ID
    status: 'published',
  };

  const createRes = await fetch(`${API_BASE}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testPayload),
  });
  assert.strictEqual(createRes.status, 201, 'Create article must return 201');
  const created = (await createRes.json()).data;
  console.log(`✓ Article created successfully [ID: ${created.id}]: "${created.title}"`);

  // 4. Verify Article appears in the Table List
  console.log('\n[4] Verifying article appears in the table list...');
  const listRes = await fetch(`${API_BASE}/articles?status=all&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  const currentArticles = Array.isArray(listData.data) ? listData.data : listData;
  const match = currentArticles.find((a) => a.id === created.id);
  assert.ok(match, 'Created article must appear in the table list');
  console.log(`✓ Found article in list: "${match.title}" | Status: ${match.status} | Department: ${match.department_name}`);

  // 5. Test "Edit" action
  console.log('\n[5] Testing "Edit" action (modifying title and summary)...');
  const updatedTitle = 'Historic Miller Memorial Library Opens Global Digital Manuscripts Portal';
  const editRes = await fetch(`${API_BASE}/articles/${created.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: updatedTitle,
      summary: 'Updated summary highlighting global access to digitized colonial folios.',
      department_id: 25, // Reassign to Chemistry
      status: 'published',
    }),
  });
  assert.strictEqual(editRes.status, 200, 'Update must return 200');
  const updatedData = (await editRes.json()).data;
  assert.strictEqual(updatedData.title, updatedTitle, 'Updated title must match');
  console.log(`✓ Article updated successfully: "${updatedData.title}"`);

  // 6. Test "Delete" action
  console.log('\n[6] Testing "Delete" action...');
  const deleteRes = await fetch(`${API_BASE}/articles/${created.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(deleteRes.status, 200, 'Delete must return 200');
  console.log('✓ Article deleted successfully');

  // Verify deletion from table list
  const verifyDelRes = await fetch(`${API_BASE}/articles/${created.id}`);
  assert.strictEqual(verifyDelRes.status, 404, 'Article must return 404 after deletion');
  console.log('✓ Verified article is no longer in the database (HTTP 404)');

  console.log('\n=== ALL CRUD TABLE WORKFLOW TESTS PASSED SUCCESSFULLY! ===');
}

testCrudWorkflow().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
