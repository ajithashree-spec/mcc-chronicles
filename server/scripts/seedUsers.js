const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mcc_chronicles',
  });

  try {
    console.log('--- SEEDING EXCLUSIVE TWO ROLES: SUPER ADMIN & UNIFIED ADMIN ---');

    // 1. Password Hashes
    const superAdminPasswordHash = await bcrypt.hash('Admin@MCC2026', 10);
    const editorPasswordHash = await bcrypt.hash('Editor@MCC2026', 10);

    // 2. Seed Super Admin: admin@mcc.edu.in / Admin@MCC2026
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, bio, is_active)
       VALUES ('MCC Super Administrator', 'admin@mcc.edu.in', ?, 'super_admin', 'Master Governance & Publications Administrator', 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = 'super_admin',
         bio = VALUES(bio),
         is_active = 1`,
      [superAdminPasswordHash]
    );
    console.log('✓ Super Admin Account verified: admin@mcc.edu.in (Role: super_admin)');

    // 3. Seed Unified Admin Handle: editor@mcc.edu.in / Editor@MCC2026
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, bio, is_active)
       VALUES ('MCC Editorial Bureau Admin', 'editor@mcc.edu.in', ?, 'editor', 'Unified Department Editorial & Dispatch Bureau', 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = 'editor',
         bio = VALUES(bio),
         is_active = 1`,
      [editorPasswordHash]
    );
    console.log('✓ Unified Admin Handle verified: editor@mcc.edu.in (Role: editor)');

    // 4. Verify accounts in MySQL
    const [rows] = await connection.query(
      `SELECT id, name, email, role, is_active FROM users WHERE email IN ('admin@mcc.edu.in', 'editor@mcc.edu.in')`
    );
    console.table(rows);
    console.log('--- USER CONSOLIDATION COMPLETE ---');
  } catch (err) {
    console.error('Seeding users failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
