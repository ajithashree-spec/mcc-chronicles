const pool = require('../config/db');

const tables = [
  'users',
  'departments',
  'categories',
  'articles',
  'article_revisions',
  'tags',
  'article_tags',
  'comments',
  'circulars',
  'galleries',
  'activity_logs',
  'subscribers',
  'contact_messages',
  'polls',
  'poll_votes',
  'site_settings',
];

async function runAudit() {
  console.log('--- STARTING DATABASE AUDIT ON PORT ' + (process.env.DB_PORT || 3307) + ' ---');
  try {
    const [connTest] = await pool.query('SELECT 1 + 1 AS result');
    console.log('[PORT & CONNECTION CHECK] SUCCESS: Connected to MySQL database:', process.env.DB_NAME || 'mcc_chronicles');

    const results = [];
    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
        const count = rows[0].count;
        results.push({ table, count, status: 'EXISTS' });
      } catch (err) {
        results.push({ table, count: 'N/A', status: 'ERROR: ' + err.message });
      }
    }

    console.log('\n--- TABLE ROW COUNTS ---');
    console.table(results);
    
    // Check MySQL version & variables
    const [verRows] = await pool.query('SELECT VERSION() AS version, @@port AS port');
    console.log(`Active MySQL Version: ${verRows[0].version} on port ${verRows[0].port}`);

    await pool.end();
  } catch (err) {
    console.error('[CONNECTION ERROR]:', err.message);
    process.exit(1);
  }
}

runAudit();
