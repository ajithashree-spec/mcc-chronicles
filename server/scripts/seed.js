const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seedDatabase() {
  console.log('--- Starting Initial Seeding for MCC Chronicles ---');
  let connection;

  try {
    connection = await pool.getConnection();

    // 1. Seed Site Settings (at least 8 records)
    console.log('[1/4] Seeding Site Settings...');
    const siteSettings = [
      ['portal_name', 'MCC Chronicles'],
      ['institution_name', 'Madras Christian College'],
      ['tagline', 'Lighted to Lighten - Official Campus News Portal'],
      ['primary_color', '#800000'],
      ['secondary_color', '#002147'],
      ['accent_color', '#D4AF37'],
      ['contact_email', 'chronicles@mcc.edu.in'],
      ['maintenance_mode', 'false']
    ];

    for (const [key, val] of siteSettings) {
      await connection.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [key, val]
      );
    }

    // 2. Seed 10 Departments
    console.log('[2/4] Seeding Departments...');
    const departments = [
      ['English', 'ENG-A', 'Aided', 'Dr. J. English', 'english@mcc.edu.in'],
      ['History', 'HIST-A', 'Aided', 'Dr. H. History', 'history@mcc.edu.in'],
      ['Economics', 'ECON-A', 'Aided', 'Dr. E. Economics', 'economics@mcc.edu.in'],
      ['Commerce', 'COMM-A', 'Aided', 'Dr. C. Commerce', 'commerce@mcc.edu.in'],
      ['Mathematics', 'MATH-A', 'Aided', 'Dr. M. Mathematics', 'maths@mcc.edu.in'],
      ['Physics', 'PHYS-A', 'Aided', 'Dr. P. Physics', 'physics@mcc.edu.in'],
      ['Chemistry', 'CHEM-A', 'Aided', 'Dr. C. Chemistry', 'chemistry@mcc.edu.in'],
      ['Computer Science', 'CS-S', 'Self-Financed', 'Dr. S. Computer', 'cs@mcc.edu.in'],
      ['Journalism', 'JOURN-S', 'Self-Financed', 'Dr. J. Journalism', 'journalism@mcc.edu.in'],
      ['Administration', 'ADMIN', 'Aided', 'Principal Office', 'principal@mcc.edu.in']
    ];

    for (const [name, code, stream, hod, email] of departments) {
      await connection.query(
        'INSERT INTO departments (name, code, stream, head_of_department, contact_email) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), stream = VALUES(stream), head_of_department = VALUES(head_of_department), contact_email = VALUES(contact_email)',
        [name, code, stream, hod, email]
      );
    }

    // 3. Seed 6 Categories
    console.log('[3/4] Seeding Categories...');
    const categories = [
      ['Campus News', 'campus-news', 'Official announcements, events, and administrative circulars'],
      ['Academics', 'academics', 'Curriculum updates, conferences, seminars, and lectures'],
      ['Sports', 'sports', 'Inter-collegiate tournaments, campus leagues, and athletic meets'],
      ['Cultural', 'cultural', 'DeepWoods festival, theater, fine arts, and musical society events'],
      ['Research', 'research', 'Faculty and student publications, grants, and discoveries'],
      ['Alumni Spotlight', 'alumni-spotlight', 'Features on notable alumni and global MCCian achievements']
    ];

    for (const [name, slug, desc] of categories) {
      await connection.query(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)',
        [name, slug, desc]
      );
    }

    // 4. Seed Super Admin User (password: Admin@MCC2026)
    console.log('[4/4] Seeding Default Admin User...');
    const adminEmail = 'admin@mcc.edu.in';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Admin@MCC2026', saltRounds);

    const [deptRows] = await connection.query(
      "SELECT id FROM departments WHERE code = 'ADMIN' OR name = 'Administration' LIMIT 1"
    );
    const adminDeptId = deptRows.length > 0 ? deptRows[0].id : null;

    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, is_active)
       VALUES ('MCC Super Admin', ?, ?, 'super_admin', ?, true)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role), department_id = VALUES(department_id), is_active = true`,
      [adminEmail, passwordHash, adminDeptId]
    );

    console.log('--- Database Seeding Complete ---');
    console.log('Default Admin Account: ' + adminEmail);
    console.log('Default Admin Password: Admin@MCC2026');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

seedDatabase();