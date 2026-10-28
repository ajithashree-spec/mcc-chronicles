const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function runMigration() {
  console.log('=== STANDARDIZING CREDENTIALS AND PURGING GHOST SETTINGS ===');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'mcc_chronicles',
  });

  try {
    // 1. Modify users.role to VARCHAR(50) so it accepts 'superadmin', 'admin', 'super_admin', 'editor', etc.
    console.log('[1/4] Updating users table schema for role flexibility...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'reporter'
    `);
    console.log('✓ users.role column modified to VARCHAR(50)');

    // 2. Hash password 'root'
    console.log('[2/4] Generating bcrypt hash for root credentials...');
    const rootPasswordHash = await bcrypt.hash('root', 10);

    // Upsert root account
    await connection.query(
      `INSERT INTO users (id, name, email, password_hash, role, bio, is_active)
       VALUES (99, 'Root Administrator', 'root', ?, 'superadmin', 'Master Root Governance & Editorial Control (Est. 1837)', 1)
       ON DUPLICATE KEY UPDATE
         name = 'Root Administrator',
         email = 'root',
         password_hash = VALUES(password_hash),
         role = 'superadmin',
         bio = 'Master Root Governance & Editorial Control (Est. 1837)',
         is_active = 1`,
      [rootPasswordHash]
    );
    console.log('✓ Standardized root account upserted (username/email: "root", role: "superadmin")');

    // Also ensure admin@mcc.edu.in and editor@mcc.edu.in remain available
    const adminHash = await bcrypt.hash('Admin@MCC2026', 10);
    const editorHash = await bcrypt.hash('Editor@MCC2026', 10);

    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, bio, is_active)
       VALUES ('MCC Super Administrator', 'admin@mcc.edu.in', ?, 'super_admin', 'Master Governance & Publications Administrator', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'super_admin'`,
      [adminHash]
    );

    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, bio, is_active)
       VALUES ('MCC Editorial Bureau Admin', 'editor@mcc.edu.in', ?, 'editor', 'Unified Department Editorial & Dispatch Bureau', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'editor'`,
      [editorHash]
    );
    console.log('✓ Retained legacy admin/editor accounts alongside root');

    // 3. Purge Ghost Settings from site_settings table
    console.log('[3/4] Purging ghost fields from site_settings...');
    const ghostKeys = [
      'site_title',
      'broadsheet_motto',
      'volume_number',
      'issue_number',
      'primary_color',
      'secondary_color',
      'accent_gold',
      'rss_feed_url',
      'atom_feed_url',
      'twitter_handle',
      'linkedin_url',
      'maintenance_mode',
      'comments_enabled',
      'portal_name',
      'tagline',
      'accent_color',
      'institution_name',
    ];

    const [deleteResult] = await connection.query(
      `DELETE FROM site_settings WHERE setting_key IN (?)`,
      [ghostKeys]
    );
    console.log(`✓ Purged ${deleteResult.affectedRows} ghost settings rows from site_settings`);

    // Insert verified operational layout controls
    const verifiedSettings = [
      ['breaking_ticker_enabled', 'true'],
      ['hero_slideshow_mode', '80_20'],
      ['departments_count', '38'],
      ['layout_parity_enforced', 'true'],
    ];

    for (const [key, val] of verifiedSettings) {
      await connection.query(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, val]
      );
    }
    console.log('✓ Initialized verified 1:1 visual parity layout settings');

    // 4. Verification table dump
    console.log('[4/4] Verifying updated users and settings:');
    const [userRows] = await connection.query(
      `SELECT id, name, email, role, is_active FROM users WHERE email IN ('root', 'admin@mcc.edu.in', 'editor@mcc.edu.in')`
    );
    console.table(userRows);

    const [settingsRows] = await connection.query(`SELECT setting_key, setting_value FROM site_settings`);
    console.table(settingsRows);

    console.log('=== MIGRATION & SEEDING COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
