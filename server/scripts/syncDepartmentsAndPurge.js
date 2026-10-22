/**
 * ============================================================================
 * DATABASE MIGRATION SCRIPT:
 * 1. Purge all dummy / placeholder articles
 * 2. Sync all 38 Official MCC Departments (17 Aided + 21 Self-Financed)
 * ============================================================================
 */
const pool = require('../config/db');

const OFFICIAL_DEPARTMENTS = [
  // Aided Stream (Shift I) - 17 Departments
  {
    name: 'Department of English',
    code: 'ENG-AID',
    stream: 'Aided',
    head_of_department: 'Dr. Sarah Alexander',
    contact_email: 'hod.english@mcc.edu.in',
    description: 'Pioneering liberal arts, literary criticism, and collegiate rhetoric since 1837.',
  },
  {
    name: 'Department of Tamil',
    code: 'TAM-AID',
    stream: 'Aided',
    head_of_department: 'Dr. K. Senthil Kumar',
    contact_email: 'hod.tamil@mcc.edu.in',
    description: 'Classical Dravidian linguistics, ancient Sangam literature, and modern cultural research.',
  },
  {
    name: 'Department of Languages (French, German, Hindi, Kannada, Malayalam, Sanskrit, Telugu)',
    code: 'LANG-AID',
    stream: 'Aided',
    head_of_department: 'Dr. P. Rajeswari',
    contact_email: 'hod.languages@mcc.edu.in',
    description: 'Multilingual humanities consortium offering European and Indian classical and modern tongues.',
  },
  {
    name: 'Department of History',
    code: 'HIST-AID',
    stream: 'Aided',
    head_of_department: 'Dr. David Annadurai',
    contact_email: 'hod.history@mcc.edu.in',
    description: 'Colonial archives, archaeological field research, and South Asian historical studies.',
  },
  {
    name: 'Department of Political Science',
    code: 'POL-AID',
    stream: 'Aided',
    head_of_department: 'Dr. J. Paul Sudhakar',
    contact_email: 'hod.polsci@mcc.edu.in',
    description: 'Constitutional jurisprudence, democratic governance, and international diplomatic relations.',
  },
  {
    name: 'Department of Public Administration',
    code: 'PUB-AID',
    stream: 'Aided',
    head_of_department: 'Dr. R. Vijay Anand',
    contact_email: 'hod.pubadmin@mcc.edu.in',
    description: 'Public policy formulation, civil service leadership, and administrative ethics.',
  },
  {
    name: 'Department of Economics',
    code: 'ECO-AID',
    stream: 'Aided',
    head_of_department: 'Dr. C. Selvaraj',
    contact_email: 'hod.economics@mcc.edu.in',
    description: 'Econometric modeling, developmental policy, and monetary systems research.',
  },
  {
    name: 'Department of Philosophy',
    code: 'PHIL-AID',
    stream: 'Aided',
    head_of_department: 'Dr. Thomas Mathew',
    contact_email: 'hod.philosophy@mcc.edu.in',
    description: 'Classical metaphysics, epistemology, ethics, and contemporary inter-religious hermeneutics.',
  },
  {
    name: 'Department of Commerce',
    code: 'COM-AID',
    stream: 'Aided',
    head_of_department: 'Dr. M. Joseph',
    contact_email: 'hod.commerce@mcc.edu.in',
    description: 'Corporate finance, taxation laws, accounting standards, and international commerce.',
  },
  {
    name: 'Department of Social Work',
    code: 'SOW-AID',
    stream: 'Aided',
    head_of_department: 'Dr. Mary Angeline',
    contact_email: 'hod.socialwork@mcc.edu.in',
    description: 'Community development, clinical psychiatric social work, and human welfare advocacy.',
  },
  {
    name: 'Department of Mathematics',
    code: 'MATH-AID',
    stream: 'Aided',
    head_of_department: 'Dr. A. Sundaram',
    contact_email: 'hod.maths@mcc.edu.in',
    description: 'Pure and applied mathematics, formal grammar theory, graph theory, and topology.',
  },
  {
    name: 'Department of Statistics',
    code: 'STAT-AID',
    stream: 'Aided',
    head_of_department: 'Dr. S. Ravichandran',
    contact_email: 'hod.statistics@mcc.edu.in',
    description: 'Stochastic processes, biostatistics, probability theory, and data analytics.',
  },
  {
    name: 'Department of Physics',
    code: 'PHY-AID',
    stream: 'Aided',
    head_of_department: 'Dr. G. Suresh',
    contact_email: 'hod.physics@mcc.edu.in',
    description: 'Quantum optics, experimental condensed matter physics, and renewable solar energy labs.',
  },
  {
    name: 'Department of Chemistry',
    code: 'CHEM-AID',
    stream: 'Aided',
    head_of_department: 'Dr. Philip Wesley',
    contact_email: 'hod.chemistry@mcc.edu.in',
    description: 'Synthetic organic chemistry, spectroscopy, green catalysis, and materials science.',
  },
  {
    name: 'Department of Plant Biology and Plant Biotechnology (Botany)',
    code: 'BOT-AID',
    stream: 'Aided',
    head_of_department: 'Dr. Edward Livingston',
    contact_email: 'hod.botany@mcc.edu.in',
    description: 'Pristine 365-acre scrub jungle ecological field survey, floristics, and molecular plant biotech.',
  },
  {
    name: 'Department of Zoology',
    code: 'ZOO-AID',
    stream: 'Aided',
    head_of_department: 'Dr. Anita Soundararajan',
    contact_email: 'hod.zoology@mcc.edu.in',
    description: 'Entomology, wildlife biodiversity studies, marine biology, and animal physiology.',
  },
  {
    name: 'Department of Physical Education',
    code: 'PED-AID',
    stream: 'Aided',
    head_of_department: 'Dr. K. Balaji',
    contact_email: 'hod.physed@mcc.edu.in',
    description: 'Sports physiology, collegiate track and field championships, and athletic conditioning.',
  },

  // Self-Financed Stream (Shift II) - 21 Departments / Units
  {
    name: 'Department of English (SFS)',
    code: 'ENG-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Rachel Varghese',
    contact_email: 'hod.english.sfs@mcc.edu.in',
    description: 'Professional communicative English, contemporary literary studies, and technical writing.',
  },
  {
    name: 'Department of Tamil (SFS)',
    code: 'TAM-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. M. Murugan',
    contact_email: 'hod.tamil.sfs@mcc.edu.in',
    description: 'Applied Tamil prose, journalistic writing, and regional media communications.',
  },
  {
    name: 'Department of Languages (SFS)',
    code: 'LANG-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. S. Geetha',
    contact_email: 'hod.languages.sfs@mcc.edu.in',
    description: 'Modern global foreign languages and commercial translation certifications.',
  },
  {
    name: 'Department of Journalism',
    code: 'JRN-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Paulson George',
    contact_email: 'hod.journalism@mcc.edu.in',
    description: 'Investigative reporting, broadcast digital newsrooms, media ethics, and broadsheet production.',
  },
  {
    name: 'Department of Social Work (SFS)',
    code: 'SOW-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Christine Gomez',
    contact_email: 'hod.socialwork.sfs@mcc.edu.in',
    description: 'Human resource management, urban development programs, and youth development.',
  },
  {
    name: 'Department of Commerce (SFS)',
    code: 'COM-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. V. Chandrasekaran',
    contact_email: 'hod.commerce.sfs@mcc.edu.in',
    description: 'Banking technology, corporate governance, e-commerce systems, and investment analysis.',
  },
  {
    name: 'Department of Business Administration (BBA)',
    code: 'BBA-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Abraham Lincoln',
    contact_email: 'hod.bba@mcc.edu.in',
    description: 'Strategic management, organizational leadership, marketing strategy, and entrepreneurial incubation.',
  },
  {
    name: 'Department of Communication',
    code: 'COMM-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Sharon David',
    contact_email: 'hod.communication@mcc.edu.in',
    description: 'Interpersonal communication, corporate PR, advertising, and digital brand storytelling.',
  },
  {
    name: 'Department of Geography, Tourism and Travel Management',
    code: 'GTTM-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. N. Parthiban',
    contact_email: 'hod.gttm@mcc.edu.in',
    description: 'Geospatial information systems (GIS), global tourism logistics, and eco-travel management.',
  },
  {
    name: 'Department of Hospitality and Tourism',
    code: 'HTM-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Richard Daniel',
    contact_email: 'hod.hospitality@mcc.edu.in',
    description: 'Hospitality administration, resort management, culinary operations, and tourism economics.',
  },
  {
    name: 'Department of Mathematics (SFS)',
    code: 'MATH-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. K. Srinivasan',
    contact_email: 'hod.maths.sfs@mcc.edu.in',
    description: 'Computational mathematics, numerical optimization, and algorithmic modeling.',
  },
  {
    name: 'Department of Physics (SFS)',
    code: 'PHY-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Samuel Johnson',
    contact_email: 'hod.physics.sfs@mcc.edu.in',
    description: 'Solid state electronics, applied physics, and computational laboratory simulations.',
  },
  {
    name: 'Department of Chemistry (SFS)',
    code: 'CHEM-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Grace Nirmala',
    contact_email: 'hod.chemistry.sfs@mcc.edu.in',
    description: 'Analytical chemistry, pharmaceutical compounds, and industrial chemical testing.',
  },
  {
    name: 'Department of Microbiology',
    code: 'MCB-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Benjamin Isaac',
    contact_email: 'hod.microbiology@mcc.edu.in',
    description: 'Immunology, microbial genetics, clinical epidemiology, and industrial biotechnology.',
  },
  {
    name: 'Department of Computer Application (BCA)',
    code: 'BCA-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Elizabeth Chacko',
    contact_email: 'hod.bca@mcc.edu.in',
    description: 'Software engineering, enterprise web applications, cloud infrastructure, and database systems.',
  },
  {
    name: 'Department of Computer Science (B.Sc.)',
    code: 'CS-BSC-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Mark Christopher',
    contact_email: 'hod.cs.bsc@mcc.edu.in',
    description: 'Algorithms, operating systems, data structures, and computer architecture fundamentals.',
  },
  {
    name: 'Department of Computer Science (MCA)',
    code: 'CS-MCA-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. V. Deepa',
    contact_email: 'hod.cs.mca@mcc.edu.in',
    description: 'Advanced postgraduate software architecture, artificial intelligence, and mobile systems.',
  },
  {
    name: 'Department of Data Science',
    code: 'DS-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Anand Kumar',
    contact_email: 'hod.datascience@mcc.edu.in',
    description: 'Big data processing, machine learning, predictive statistical modeling, and deep learning.',
  },
  {
    name: 'Department of Visual Communication',
    code: 'VISCOM-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Stephen Jayaraj',
    contact_email: 'hod.viscom@mcc.edu.in',
    description: 'Cinematography, documentary filmmaking, broadcast production, graphic design, and animation.',
  },
  {
    name: 'Department of Physical Education, Health Education and Sports',
    code: 'PED-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. M. Prakash',
    contact_email: 'hod.sports.sfs@mcc.edu.in',
    description: 'Kinesiology, sports medicine, athletic coaching, and campus recreation programs.',
  },
  {
    name: 'Department of Psychology',
    code: 'PSY-SFS',
    stream: 'Self-Financed',
    head_of_department: 'Dr. Hannah Rebecca',
    contact_email: 'hod.psychology@mcc.edu.in',
    description: 'Cognitive psychology, clinical counseling, psychometrics, and organizational behavior.',
  },
];

async function syncDepartmentsAndPurge() {
  console.log('========================================================================');
  console.log('=== MCC CHRONICLES: DEPARTMENT SYNC & DUMMY DISPATCH PURGE           ===');
  console.log('========================================================================\n');

  try {
    // 1. Purge dummy/synthetic test articles
    console.log('[STEP 1] Purging synthetic & dummy test articles...');
    const [delResult] = await pool.query(`
      DELETE FROM articles 
      WHERE title LIKE 'Revised Dispatch%' 
         OR title LIKE 'MCC Campus News Roundup%' 
         OR title LIKE 'Test%' 
         OR summary LIKE '%filler%' 
         OR summary LIKE '%Lorem ipsum%'
    `);
    console.log(`  ✓ Purged ${delResult.affectedRows} dummy/test article(s)`);

    const [remainingArticles] = await pool.query('SELECT COUNT(*) AS count FROM articles');
    console.log(`  ✓ Remaining published articles count: ${remainingArticles[0].count}`);

    // 2. Ensure description column exists in departments table
    console.log('\n[STEP 2] Ensuring departments table schema is up to date...');
    try {
      await pool.query('ALTER TABLE departments ADD COLUMN description TEXT DEFAULT NULL');
      console.log('  ✓ Added description column to departments');
    } catch (e) {
      // Column may already exist
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('  ✓ description column already present in departments');
      } else {
        console.log('  Notice:', e.message);
      }
    }

    // 3. Temporarily set foreign key references on users & circulars
    console.log('\n[STEP 3] Updating relational integrity references...');
    await pool.query('UPDATE users SET department_id = NULL');
    await pool.query('UPDATE circulars SET department_id = NULL WHERE department_id IS NOT NULL');

    // 4. Clean out old/unmatched department records not in the official 38
    const officialCodes = OFFICIAL_DEPARTMENTS.map((d) => d.code);
    const [deletedDepts] = await pool.query(
      'DELETE FROM departments WHERE code NOT IN (?)',
      [officialCodes]
    );
    console.log(`  ✓ Cleaned ${deletedDepts.affectedRows} non-official department(s)`);

    // 5. Seed all 38 official departments
    console.log('\n[STEP 4] Seeding 38 Official MCC Departments (17 Aided + 21 Self-Financed)...');
    for (const dept of OFFICIAL_DEPARTMENTS) {
      await pool.query(
        `INSERT INTO departments (name, code, stream, head_of_department, contact_email, description)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           stream = VALUES(stream),
           head_of_department = VALUES(head_of_department),
           contact_email = VALUES(contact_email),
           description = VALUES(description)`,
        [
          dept.name,
          dept.code,
          dept.stream,
          dept.head_of_department,
          dept.contact_email,
          dept.description,
        ]
      );
    }
    console.log(`  ✓ Seeded / updated ${OFFICIAL_DEPARTMENTS.length} official departments`);

    // 6. Verify row count
    const [finalDepts] = await pool.query('SELECT id, name, code, stream FROM departments ORDER BY id ASC');
    console.log(`\n[STEP 5] Verification: Found ${finalDepts.length} departments in database.`);
    const aidedCount = finalDepts.filter((d) => d.stream === 'Aided').length;
    const sfsCount = finalDepts.filter((d) => d.stream === 'Self-Financed').length;
    console.log(`  ✓ Aided Stream: ${aidedCount} (Target: 17)`);
    console.log(`  ✓ Self-Financed Stream: ${sfsCount} (Target: 21)`);

    // 7. Associate Super Admin with Department of English
    const [engDept] = await pool.query("SELECT id FROM departments WHERE code = 'ENG-AID' LIMIT 1");
    if (engDept.length > 0) {
      await pool.query('UPDATE users SET department_id = ? WHERE role = ?', [engDept[0].id, 'super_admin']);
      console.log(`  ✓ Associated Super Admin with ${engDept[0].id} (Department of English)`);
    }

    console.log('\n========================================================================');
    console.log('=== SYNC & PURGE COMPLETED SUCCESSFULLY                                ===');
    console.log('========================================================================');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

syncDepartmentsAndPurge();
