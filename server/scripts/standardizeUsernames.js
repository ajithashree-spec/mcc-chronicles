const pool = require('../config/db');

async function standardizeUsernames() {
  console.log('Standardizing administrative user records in MySQL...');

  // 1. Update Super Admin user (id 99 or username 'root')
  await pool.query(`
    UPDATE users 
    SET username = 'superadmin', 
        email = 'superadmin@mcc.edu.in', 
        name = 'MCC Super Administrator', 
        role = 'superadmin' 
    WHERE username = 'root' OR id = 99
  `);

  // 2. Update Editorial Admin user (id 1 or username 'admin')
  await pool.query(`
    UPDATE users 
    SET username = 'admin', 
        email = 'admin@mcc.edu.in', 
        name = 'MCC Editorial Administrator', 
        role = 'admin' 
    WHERE username = 'admin' OR id = 1
  `);

  const [users] = await pool.query('SELECT id, name, username, email, role FROM users');
  console.log('✅ Updated users:', users);
  process.exit(0);
}

standardizeUsernames().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
