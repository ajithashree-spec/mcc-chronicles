const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mcc_chronicles',
  });

  try {
    console.log('Seeding initial data into mcc_chronicles...');

    // Hash default password for admin@mcc.edu.in
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@MCC2026', salt);

    // 1. Super Admin User
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, bio) VALUES
       ('MCC Super Admin', 'admin@mcc.edu.in', ?, 'super_admin', 'Head of Publications & Super Administrator, Madras Christian College')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'super_admin'`,
      [passwordHash]
    );

    // 2. Categories
    await connection.query(`
      INSERT IGNORE INTO categories (name, slug, description) VALUES
      ('Campus News', 'campus-news', 'General campus events, administrative announcements, and institutional updates'),
      ('Academics', 'academics', 'Faculty publications, student conferences, and academic honors'),
      ('Cultural', 'cultural', 'Coverage of MCC annual cultural festival, performances, and art showcases'),
      ('Sports', 'sports', 'Inter-collegiate tournaments, athletics meets, and hall games'),
      ('Research', 'research', 'Faculty and student publications, grants, and discoveries'),
      ('Alumni Spotlight', 'alumni-spotlight', 'Features on notable alumni and global MCCian achievements')
    `);

    // 3. Site Settings
    await connection.query(`
      INSERT INTO site_settings (setting_key, setting_value) VALUES
      ('portal_name', 'MCC Chronicles'),
      ('institution_name', 'Madras Christian College'),
      ('tagline', 'The Official News and Journalism Portal of Madras Christian College'),
      ('breaking_ticker', 'Welcome to MCC Chronicles — The 189th academic year commences.')
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `);

    // NOTE: Zero synthetic/dummy articles seeded. Broadsheet preserves authentic editorial integrity.
    console.log('Seeding completed successfully with zero placeholder articles!');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
