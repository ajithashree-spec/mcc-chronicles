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
    database: process.env.DB_NAME || 'mcc_chronicles'
  });

  try {
    console.log('Seeding initial data into mcc_chronicles...');

    // Hash default password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);

    // 1. Users
    await connection.query(\
      INSERT IGNORE INTO users (id, name, email, password_hash, role, bio) VALUES
      (1, 'MCC Chief Editor', 'admin@mcc.edu', ?, 'super_admin', 'Head of Publications, Madras Christian College'),
      (2, 'Staff Reporter', 'reporter@mcc.edu', ?, 'reporter', 'Campus journalist covering student affairs and events')
    \, [passwordHash, passwordHash]);

    // 2. Departments
    await connection.query(\
      INSERT IGNORE INTO departments (id, name, code, stream, head_of_department, contact_email) VALUES
      (1, 'English Literature', 'ENG', 'Aided', 'Dr. J. Armstrong', 'english@mcc.edu'),
      (2, 'Journalism & Mass Comm', 'JMC', 'Self-Financed', 'Dr. R. David', 'journalism@mcc.edu'),
      (3, 'Computer Science', 'CS', 'Self-Financed', 'Dr. M. Sangeetha', 'compsci@mcc.edu'),
      (4, 'History', 'HIS', 'Aided', 'Dr. V. Rajan', 'history@mcc.edu')
    \);

    // 3. Categories
    await connection.query(\
      INSERT IGNORE INTO categories (id, name, slug, description) VALUES
      (1, 'Campus News', 'campus-news', 'General campus events, administrative announcements, and institutional updates'),
      (2, 'Deep Woods', 'deep-woods', 'Coverage of MCC annual cultural festival, performances, and art showcases'),
      (3, 'Academics & Research', 'academics-research', 'Faculty publications, student conferences, and academic honors'),
      (4, 'Sports & Athletics', 'sports-athletics', 'Inter-collegiate tournaments, athletics meets, and hall games')
    \);

    // 4. Sample Article
    await connection.query(\
      INSERT IGNORE INTO articles (id, title, slug, summary, content, cover_image, status, is_featured, is_breaking, author_id, category_id, department_id, published_at) VALUES
      (1,
       'MCC Celebrates 189th Founding Anniversary with Historic Symposium',
       'mcc-celebrates-189th-founding-anniversary',
       'Madras Christian College marks nearly two centuries of academic excellence with a campus-wide assembly at Anderson Hall.',
       '<p>Madras Christian College gathered faculty, alumni, and students at Anderson Hall to inaugurate its founding celebrations. Key speakers highlighted the college historical contributions to education, liberal arts, and national scientific progress.</p>',
       'assets/mcc-crest.png',
       'published',
       1,
       0,
       1,
       1,
       4,
       NOW()
      )
    \);

    // 5. Site Settings
    await connection.query(\
      INSERT INTO site_settings (setting_key, setting_value) VALUES
      ('portal_name', 'MCC Chronicles'),
      ('tagline', 'The Official News and Journalism Portal of Madras Christian College'),
      ('breaking_ticker', 'Welcome to MCC Chronicles — The 189th academic year features new interdisciplinary programs.')
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    \);

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
