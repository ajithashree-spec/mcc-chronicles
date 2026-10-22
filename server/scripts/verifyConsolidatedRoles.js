const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function runVerification() {
  console.log('=== STARTING ROLE CONSOLIDATION & WORKFLOW VERIFICATION ===\n');

  // TEST 1: Super Admin Authentication
  console.log('[TEST 1] Authenticating as Super Admin (admin@mcc.edu.in)...');
  const superLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mcc.edu.in', password: 'Admin@MCC2026' }),
  });
  const superLoginData = await superLoginRes.json();
  assert.strictEqual(superLoginRes.status, 200, 'Super admin login must return 200');
  assert.strictEqual(superLoginData.user.role, 'super_admin', 'Role must be super_admin');
  assert.ok(superLoginData.token, 'Must return JWT token');
  const superToken = superLoginData.token;
  console.log('✓ Super Admin authenticated successfully (Role: super_admin)');

  // TEST 2: Unified Admin (Editor) Authentication
  console.log('\n[TEST 2] Authenticating as Unified Admin Editor (editor@mcc.edu.in)...');
  const editorLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'editor@mcc.edu.in', password: 'Editor@MCC2026' }),
  });
  const editorLoginData = await editorLoginRes.json();
  assert.strictEqual(editorLoginRes.status, 200, 'Editor login must return 200');
  assert.strictEqual(editorLoginData.user.role, 'editor', 'Role must be editor');
  assert.ok(editorLoginData.token, 'Must return JWT token');
  const editorToken = editorLoginData.token;
  console.log('✓ Unified Admin authenticated successfully (Role: editor)');

  // TEST 3: Super Admin Governance Capabilities
  console.log('\n[TEST 3] Testing Super Admin governance endpoints (Settings, Categories, Departments, Audit)...');
  // Site settings
  const settingsRes = await fetch(`${API_BASE}/settings`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  assert.strictEqual(settingsRes.status, 200, 'Super admin can access /settings');
  console.log('✓ Super Admin can access Site Settings & Appearance');

  // Audit logs
  const auditRes = await fetch(`${API_BASE}/audit`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  assert.strictEqual(auditRes.status, 200, 'Super admin can access /audit');
  console.log('✓ Super Admin can access Audit Logs & Diagnostics');

  // Verify 38 departments
  const deptRes = await fetch(`${API_BASE}/departments`);
  const deptData = await deptRes.json();
  const departmentsList = deptData.data || deptData;
  assert.strictEqual(departmentsList.length, 38, 'Must have exactly 38 official departments');
  const aidedCount = departmentsList.filter(d => d.stream === 'Aided').length;
  const sfsCount = departmentsList.filter(d => d.stream === 'Self-Financed').length;
  assert.strictEqual(aidedCount, 17, 'Must have 17 Aided departments');
  assert.strictEqual(sfsCount, 21, 'Must have 21 Self-Financed departments');
  console.log(`✓ 38 Departments verified: ${aidedCount} Aided (Shift I) & ${sfsCount} Self-Financed (Shift II)`);

  // TEST 4: Unified Admin Restricted Capabilities
  console.log('\n[TEST 4] Verifying Unified Admin is denied access to Super Admin governance endpoints...');
  const editorAuditRes = await fetch(`${API_BASE}/audit`, {
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  assert.strictEqual(editorAuditRes.status, 403, 'Editor must receive 403 Forbidden on audit');
  console.log('✓ Unified Admin correctly denied access to Super Admin Audit Logs (HTTP 403)');

  // TEST 5: Unified Admin Article Creation with Dynamic Department Selector
  console.log('\n[TEST 5] Testing Article Creation by Unified Admin assigned to target department...');
  // Find a target department (e.g. Department of Chemistry - Aided, or Zoology)
  const targetDept = departmentsList.find(d => d.code === 'CHEM-AID') || departmentsList[0];
  console.log(`Target Department selected: ${targetDept.name} (${targetDept.code}) [ID: ${targetDept.id}]`);

  const newArticlePayload = {
    title: 'Breakthrough Discovery in Green Catalysis Research at Miller Quad Labs',
    summary: 'Department researchers synthesize eco-friendly catalysts reducing reaction temperatures by 40%.',
    content: 'Full scholarly dispatch body documenting laboratory methodology, findings, and faculty peer review.',
    author_name: 'Dr. Philip Wesley & Student Bureau',
    category_id: 1,
    department_id: targetDept.id,
    status: 'published',
  };

  const createArticleRes = await fetch(`${API_BASE}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${editorToken}`,
    },
    body: JSON.stringify(newArticlePayload),
  });
  const createArticleData = await createArticleRes.json();
  assert.strictEqual(createArticleRes.status, 201, 'Article creation must return 201 Created');
  assert.strictEqual(createArticleData.data.department_id, targetDept.id, 'Article must be assigned to chosen department');
  const createdArticleId = createArticleData.data.id;
  console.log(`✓ Article successfully created by Unified Admin [ID: ${createdArticleId}] assigned to ${targetDept.name}`);

  // TEST 6: Verify Article appears under the Department
  console.log('\n[TEST 6] Verifying article mounts to target department bureau...');
  const deptArticlesRes = await fetch(`${API_BASE}/articles?department_id=${targetDept.id}`);
  const deptArticlesData = await deptArticlesRes.json();
  const deptArticlesList = deptArticlesData.data || deptArticlesData;
  const foundArticle = deptArticlesList.find(a => a.id === createdArticleId);
  assert.ok(foundArticle, 'Created article must be present under target department');
  console.log(`✓ Article verified mounted under ${targetDept.name}`);

  // TEST 7: Unified Admin Edit Article (Reassign to different department, e.g. Zoology)
  console.log('\n[TEST 7] Testing Article Update & Department Reassignment by Unified Admin...');
  const secondDept = departmentsList.find(d => d.code === 'ZOO-AID') || departmentsList[1];
  const updateArticleRes = await fetch(`${API_BASE}/articles/${createdArticleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${editorToken}`,
    },
    body: JSON.stringify({
      title: 'Updated: Breakthrough Discovery in Green Catalysis & Biodiversity Labs',
      department_id: secondDept.id,
      status: 'published',
    }),
  });
  assert.strictEqual(updateArticleRes.status, 200, 'Update must return 200');
  console.log(`✓ Article successfully updated & reassigned to ${secondDept.name}`);

  // TEST 8: Unified Admin Article Deletion
  console.log('\n[TEST 8] Testing Article Deletion by Unified Admin...');
  const deleteRes = await fetch(`${API_BASE}/articles/${createdArticleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  assert.strictEqual(deleteRes.status, 200, 'Delete article must return 200');
  console.log('✓ Article successfully deleted by Unified Admin');

  // Verify deletion
  const checkDeleteRes = await fetch(`${API_BASE}/articles/${createdArticleId}`);
  assert.strictEqual(checkDeleteRes.status, 404, 'Deleted article must return 404');
  console.log('✓ Verified article no longer exists in database (HTTP 404)');

  console.log('\n=== ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runVerification().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
