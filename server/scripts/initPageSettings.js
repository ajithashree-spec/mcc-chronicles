const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const DEFAULT_PAGE_SETTINGS = {
  header_brand_title: 'Madras Christian College',
  header_brand_subtitle: 'CAMPUS NEWS PORTAL',
  header_edition_text: 'Autonomous Institution • Affiliated to University of Madras • NAAC A++',
  header_date_mode: 'live',

  ticker_enabled: 'true',
  ticker_speed_ms: '4500',
  ticker_items: JSON.stringify([
    {
      id: 't-1',
      text: 'OFFICIAL GAZETTE: Madras Christian College (Autonomous) — Institutional Circulars & Notices Desk.',
      link: '/circulars',
      category: 'Gazette',
    },
    {
      id: 't-2',
      text: 'ACADEMIC REGISTRY: Official collegiate notices published across all 38 department bureaus.',
      link: '/departments',
      category: 'Academic',
    },
    {
      id: 't-3',
      text: 'TAMBARAM SANCTUARY: Research & scientific inquiry across the 365-acre scrub jungle campus.',
      link: '/gallery',
      category: 'Sanctuary',
    },
  ]),

  slideshow_speed_ms: '4500',
  slideshow_mode: 'auto',
  slideshow_custom_slides: '[]',

  curated_lead_article_id: '',
  curated_secondary_article_ids: '[]',

  footer_description:
    'An autonomous liberal arts and sciences institution affiliated with the University of Madras. Dedicated to academic excellence, investigative student journalism, and scientific inquiry in the 365-acre scrub jungle sanctuary.',
  footer_accreditation: 'Autonomous Institution • NAAC A++ Grade',
  footer_motto: 'Motto: "Lighted to Lighten" • Est. 1837',
  footer_address: 'Madras Christian College, Tambaram East, Chennai - 600059, Tamil Nadu, India',
  footer_phone: '+91 44 2239 0675',
  footer_email: 'principal@mcc.edu.in',
  footer_college_url: 'https://mcc.edu.in',
  footer_college_label: 'College Official Portal (mcc.edu.in)',
  footer_copyright: 'Madras Christian College. All rights reserved. Official Campus News Portal.',
};

async function initPageSettings() {
  console.log('=== INITIALIZING PAGE SETTINGS TABLE & SEED DATA ===');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'mcc_chronicles',
  });

  try {
    // 1. Create page_settings table
    console.log('[1/3] Creating page_settings table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS page_settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` LONGTEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ page_settings table verified/created.');

    // 2. Insert default page settings
    console.log('[2/3] Seeding default 1:1 live broadsheet settings...');
    for (const [key, val] of Object.entries(DEFAULT_PAGE_SETTINGS)) {
      await connection.query(
        `INSERT INTO page_settings (\`key\`, \`value\`)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
        [key, val]
      );
    }
    console.log(`✓ Seeded ${Object.keys(DEFAULT_PAGE_SETTINGS).length} default page settings keys.`);

    // 3. Verify
    console.log('[3/3] Current page_settings rows:');
    const [rows] = await connection.query('SELECT `key`, LEFT(`value`, 60) AS sample_value FROM page_settings');
    console.table(rows);

    console.log('=== PAGE SETTINGS INITIALIZATION COMPLETE ===');
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initPageSettings();
}

module.exports = { initPageSettings, DEFAULT_PAGE_SETTINGS };
