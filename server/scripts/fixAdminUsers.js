/**
 * Standalone Script: fixAdminUsers.js
 * Updates and standardizes users table in MySQL (port 3307):
 * - Ensures both `password` and `password_hash` columns exist and are synced.
 * - Standardizes Super Admin: username = 'superadmin', role = 'superadmin'
 * - Standardizes Editorial Admin: username = 'admin', role = 'admin'
 */

const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function fixAdminUsers() {
  console.log('=== STARTING fixAdminUsers.js ===\n');

  try {
    // 1. Inspect users table columns
    console.log('[1/4] Inspecting users table schema...');
    const [cols] = await pool.query('DESCRIBE users');
    const columnNames = cols.map((c) => c.Field);
    console.log('  Current columns:', columnNames.join(', '));

    // Ensure `password` column exists alongside `password_hash`
    if (!columnNames.includes('password')) {
      console.log('  Adding `password` column to users table...');
      await pool.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER password_hash');
      await pool.query('UPDATE users SET password = password_hash WHERE password IS NULL');
      console.log('  ✓ `password` column added and synchronized with `password_hash`.');
    }

    // Ensure `username` column exists
    if (!columnNames.includes('username')) {
      console.log('  Adding `username` column to users table...');
      await pool.query('ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER name');
      console.log('  ✓ `username` column added.');
    }

    // 2. Generate bcrypt hashes (10 rounds)
    console.log('\n[2/4] Generating bcrypt hashes (10 salt rounds)...');
    const saltRounds = 10;
    const superadminPassHash = await bcrypt.hash('superadmin', saltRounds);
    const adminPassHash = await bcrypt.hash('admin', saltRounds);
    console.log('  ✓ Hashes generated successfully.');

    // 3. Upsert / Update Super Admin (id: 99)
    console.log('\n[3/4] Updating / Upserting Super Admin and Admin accounts...');

    // Super Admin: username = 'superadmin', email = 'superadmin@mcc.edu.in', role = 'superadmin'
    await pool.query(
      `INSERT INTO users (id, name, username, email, password, password_hash, role, bio, is_active)
       VALUES (99, 'MCC Super Administrator', 'superadmin', 'superadmin@mcc.edu.in', ?, ?, 'superadmin', 'Master Administrative Governance', 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         username = 'superadmin',
         email = 'superadmin@mcc.edu.in',
         password = VALUES(password),
         password_hash = VALUES(password_hash),
         role = 'superadmin',
         is_active = 1`,
      [superadminPassHash, superadminPassHash]
    );
    console.log('  ✓ Super Admin account updated (id: 99, username: superadmin, role: superadmin)');

    // Editorial Admin: username = 'admin', email = 'admin@mcc.edu.in', role = 'admin'
    await pool.query(
      `INSERT INTO users (id, name, username, email, password, password_hash, role, bio, is_active)
       VALUES (1, 'MCC Editorial Administrator', 'admin', 'admin@mcc.edu.in', ?, ?, 'admin', 'Editorial Desk Administrator', 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         username = 'admin',
         email = 'admin@mcc.edu.in',
         password = VALUES(password),
         password_hash = VALUES(password_hash),
         role = 'admin',
         is_active = 1`,
      [adminPassHash, adminPassHash]
    );
    console.log('  ✓ Editorial Admin account updated (id: 1, username: admin, role: admin)');

    // 4. Query and print the updated rows
    console.log('\n[4/4] Verifying updated records in MySQL:');
    const [rows] = await pool.query(
      `SELECT id, name, username, email, role, 
              LEFT(password, 20) AS pass_preview, 
              LEFT(password_hash, 20) AS hash_preview, 
              is_active 
       FROM users 
       WHERE id IN (1, 99) OR username IN ('superadmin', 'admin')`
    );

    console.table(rows);
    console.log('=== fixAdminUsers.js COMPLETE ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in fixAdminUsers:', error);
    process.exit(1);
  }
}

fixAdminUsers();
