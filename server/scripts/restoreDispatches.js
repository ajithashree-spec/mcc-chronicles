/**
 * Recovery & Population Script for Articles and Dispatches
 * Restores verified dispatches into MySQL 8.4 (Port 3307)
 * Populates broadsheet hero spotlight and "Latest Dispatches" feed.
 */

const pool = require('../config/db');

async function restoreDispatches() {
  console.log('=== STARTING DISPATCH RESTORATION PROCESS ===\n');

  try {
    // 1. Verify departments lookup
    console.log('[1/4] Verifying Department IDs...');
    const [deptRows] = await pool.query('SELECT id, name, code FROM departments');
    if (deptRows.length === 0) {
      throw new Error('No departments found in database. Please run initDb.js first.');
    }
    const deptMap = {};
    deptRows.forEach((d) => {
      deptMap[d.code] = d.id;
    });

    const getDeptId = (code) => deptMap[code] || deptRows[0].id;

    // 2. Verify categories lookup
    console.log('[2/4] Verifying Category IDs...');
    const [catRows] = await pool.query('SELECT id, name, slug FROM categories');
    const catMap = {};
    catRows.forEach((c) => {
      catMap[c.slug] = c.id;
    });

    const getCatId = (slug) => catMap[slug] || (catRows.length > 0 ? catRows[0].id : 1);

    // 3. Verify Author ID (Super Admin 99 or Admin 1)
    console.log('[3/4] Verifying Administrative Author User...');
    const [userRows] = await pool.query(
      "SELECT id, username, name FROM users WHERE id IN (99, 1) ORDER BY (id = 99) DESC LIMIT 1"
    );
    const authorId = userRows.length > 0 ? userRows[0].id : 99;
    console.log(`  Assigned Author ID: ${authorId} (${userRows[0]?.username || 'superadmin'})`);

    // 4. Dispatches Definition
    const dispatches = [
      {
        title: 'Heritage Quadrangle Restorations Safeguard Decades of Academic Architecture',
        slug: 'heritage-quadrangle-restorations-safeguard-academic-architecture',
        summary: 'Comprehensive masonry conservation and rare archive digitization ensure centuries of collegiate liberal arts traditions endure.',
        content: 'The Governing Board and Department of History have announced the successful completion of restorative conservation works across the Anderson clock tower and quadrangle pathways. Combining authentic lime-plaster architectural preservation with modern climate-controlled archival vaults, the initiative safeguards over 180 years of collegiate documents, rare colonial broadsheets, and institutional records.',
        cover_image: '/images/mcc-heritage-facade-hd.jpg',
        category_slug: 'campus-news',
        dept_code: 'HIST-AID',
        is_featured: 1,
        is_breaking: 1,
        offsetHours: 1,
      },
      {
        title: 'Extensive Campus Green Spaces Advance Regional Biodiversity',
        slug: 'extensive-campus-green-spaces-advance-regional-biodiversity',
        summary: 'Faculty botanists and student ecological fellows document unique scrub jungle biodiversity during an intensive 365-acre environmental audit.',
        content: 'A peer-reviewed survey conducted by the Department of Plant Biology & Plant Biotechnology has uncovered thriving flora and fauna inhabiting the interior canopy of the 365-acre campus sanctuary. The pristine scrub jungle serves as a critical biological corridor in Chennai, fostering diverse bird habitats, ancient dry evergreen species, and indigenous medicinal shrubs.',
        cover_image: '/images/mcc-scrub-jungle-hd.jpg',
        category_slug: 'academics',
        dept_code: 'BOT-AID',
        is_featured: 1,
        is_breaking: 0,
        offsetHours: 3,
      },
      {
        title: 'New Department Access Pathways Connect Historic Wings',
        slug: 'new-department-access-pathways-connect-historic-wings',
        summary: 'Modernized pedestrian arcades and accessible ramps link foundational collegiate halls with newly constructed interdisciplinary laboratories.',
        content: 'To facilitate seamless pedestrian transit across Shift I and Shift II facilities, campus civil infrastructure works have established all-weather covered pathways connecting the Miller Memorial quadrangle with science laboratories and arts lecture halls. The project incorporates sustainable rainwater percolation pits and tactile paving for complete accessibility.',
        cover_image: '/images/mcc-academic-quad-hd.jpg',
        category_slug: 'campus-news',
        dept_code: 'ENG-AID',
        is_featured: 1,
        is_breaking: 0,
        offsetHours: 6,
      },
      {
        title: 'Madras Christian College Unveils Modernized Visual Emblem',
        slug: 'madras-christian-college-unveils-modernized-visual-emblem',
        summary: 'The refined emblem balances traditional maroon and gold collegiate iconography with streamlined digital typography for institutional publishing.',
        content: 'Celebrating nearly two centuries of academic distinction, Madras Christian College unveiled a refined digital rendering of its historic seal. Developed by faculty and student designers from the Department of Visual Communication, the emblem honors the college motto "They shall be all taught of God" while ensuring crisp visual fidelity across high-resolution broadsheet media and mobile platforms.',
        cover_image: '/images/mcc-historic-hall-hd.jpg',
        category_slug: 'campus-news',
        dept_code: 'VISCOM-SFS',
        is_featured: 1,
        is_breaking: 0,
        offsetHours: 9,
      },
      {
        title: 'Autonomous Academic Council Approves Interdisciplinary AI & Quantum Research Bureaus',
        slug: 'academic-council-approves-interdisciplinary-research-bureaus',
        summary: 'New multidisciplinary laboratories bridge liberal arts scholarship with cutting-edge computing across both Shift I and Shift II departments.',
        content: 'In a landmark session held at the historic Miller quadrangle, the Academic Council of Madras Christian College unanimously ratified the establishment of twin research bureaus dedicated to Quantum Information and Ethics in Artificial Intelligence. The centers will host collaborative research fellowships for postgraduate scholars and visiting scientists.',
        cover_image: '/images/mcc-academic-quad-hd.jpg',
        category_slug: 'research',
        dept_code: 'ENG-AID',
        is_featured: 1,
        is_breaking: 1,
        offsetHours: 12,
      },
      {
        title: 'Annual Cultural Festival Deepwoods Celebrates Golden Jubilee Across Scrub Jungle Sanctuary',
        slug: 'annual-cultural-festival-deepwoods-golden-jubilee',
        summary: 'Over 8,000 collegiate delegates from institutions nationwide gather for literary conclaves, music assemblies, and fine arts pageants.',
        content: 'Deepwoods 2026 commenced this morning with ceremonial fanfare across the iconic open-air quadrangle. Featuring over forty intercollegiate competitions spanning debate, theatrical drama, and forensic acoustics, the festival marks fifty years of collegiate student fellowship.',
        cover_image: '/images/mcc-campus-hero-hd.jpg',
        category_slug: 'cultural',
        dept_code: 'ENG-AID',
        is_featured: 1,
        is_breaking: 0,
        offsetHours: 18,
      },
      {
        title: 'MCC Athletics Contingent Lifts University Championship Trophy in Tri-Centenary Match',
        slug: 'mcc-athletics-lifts-championship-trophy',
        summary: 'Record-breaking performances in track and field lead Tambaram athletes to a historic victory at the Madras Inter-Collegiate Finals.',
        content: 'Displaying relentless grit and disciplined sportsmanship, the Madras Christian College athletic squad clinched the overall rolling championship trophy at the Jawaharlal Nehru Stadium. Gold medals in 400m hurdles, high jump, and relay secured the title for the college.',
        cover_image: '/images/mcc-historic-hall-hd.jpg',
        category_slug: 'sports',
        dept_code: 'HIST-AID',
        is_featured: 1,
        is_breaking: 0,
        offsetHours: 24,
      },
    ];

    console.log(`\n[4/4] Inserting / Upserting ${dispatches.length} Verified Dispatches...`);

    for (const d of dispatches) {
      const categoryId = getCatId(d.category_slug);
      const departmentId = getDeptId(d.dept_code);

      const [existing] = await pool.query('SELECT id FROM articles WHERE slug = ?', [d.slug]);

      if (existing.length > 0) {
        await pool.query(
          `UPDATE articles SET
             title = ?,
             summary = ?,
             content = ?,
             cover_image = ?,
             category_id = ?,
             department_id = ?,
             author_id = ?,
             status = 'published',
             is_featured = ?,
             is_breaking = ?,
             published_at = NOW() - INTERVAL ? HOUR,
             updated_at = NOW()
           WHERE id = ?`,
          [
            d.title,
            d.summary,
            d.content,
            d.cover_image,
            categoryId,
            departmentId,
            authorId,
            d.is_featured,
            d.is_breaking,
            d.offsetHours,
            existing[0].id,
          ]
        );
        console.log(`  ✓ Updated dispatch [id: ${existing[0].id}]: "${d.title}"`);
      } else {
        const [insertRes] = await pool.query(
          `INSERT INTO articles
             (title, slug, summary, content, cover_image, category_id, department_id, author_id, status, is_featured, is_breaking, published_at, created_at, updated_at)
           VALUES
             (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, NOW() - INTERVAL ? HOUR, NOW() - INTERVAL ? HOUR, NOW())`,
          [
            d.title,
            d.slug,
            d.summary,
            d.content,
            d.cover_image,
            categoryId,
            departmentId,
            authorId,
            d.is_featured,
            d.is_breaking,
            d.offsetHours,
            d.offsetHours,
          ]
        );
        console.log(`  ✓ Inserted dispatch [id: ${insertRes.insertId}]: "${d.title}"`);
      }
    }

    console.log('\n=== DISPATCH RESTORATION COMPLETE ===');

    // Run verification query
    const [verified] = await pool.query(
      `SELECT a.id, a.title, a.status, a.is_featured, a.published_at, d.name as department_name, c.name as category_name
       FROM articles a
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.status = 'published'
       ORDER BY a.published_at DESC`
    );

    console.log(`\nVerified Published Dispatches in Database (${verified.length} total):`);
    verified.forEach((a, i) => {
      console.log(`  ${i + 1}. [ID: ${a.id}] "${a.title}" | Dept: ${a.department_name} | Cat: ${a.category_name} | Featured: ${a.is_featured}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Fatal error during dispatch restoration:', error);
    process.exit(1);
  }
}

restoreDispatches();
