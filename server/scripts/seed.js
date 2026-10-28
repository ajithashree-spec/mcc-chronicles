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

    // 2. Seed 38 Official MCC Departments (17 Aided + 21 Self-Financed)
    console.log('[2/4] Seeding 38 Official MCC Departments...');
    const departments = [
      ['Department of English', 'ENG-AID', 'Aided', 'Dr. Sarah Alexander', 'hod.english@mcc.edu.in', 'Pioneering liberal arts, literary criticism, and collegiate rhetoric since 1837.'],
      ['Department of Tamil', 'TAM-AID', 'Aided', 'Dr. K. Senthil Kumar', 'hod.tamil@mcc.edu.in', 'Classical Dravidian linguistics, ancient Sangam literature, and modern cultural research.'],
      ['Department of Languages (French, German, Hindi, Kannada, Malayalam, Sanskrit, Telugu)', 'LANG-AID', 'Aided', 'Dr. P. Rajeswari', 'hod.languages@mcc.edu.in', 'Multilingual humanities consortium offering European and Indian classical and modern tongues.'],
      ['Department of History', 'HIST-AID', 'Aided', 'Dr. David Annadurai', 'hod.history@mcc.edu.in', 'Colonial archives, archaeological field research, and South Asian historical studies.'],
      ['Department of Political Science', 'POL-AID', 'Aided', 'Dr. J. Paul Sudhakar', 'hod.polsci@mcc.edu.in', 'Constitutional jurisprudence, democratic governance, and international diplomatic relations.'],
      ['Department of Public Administration', 'PUB-AID', 'Aided', 'Dr. R. Vijay Anand', 'hod.pubadmin@mcc.edu.in', 'Public policy formulation, civil service leadership, and administrative ethics.'],
      ['Department of Economics', 'ECO-AID', 'Aided', 'Dr. C. Selvaraj', 'hod.economics@mcc.edu.in', 'Econometric modeling, developmental policy, and monetary systems research.'],
      ['Department of Philosophy', 'PHIL-AID', 'Aided', 'Dr. Thomas Mathew', 'hod.philosophy@mcc.edu.in', 'Classical metaphysics, epistemology, ethics, and contemporary inter-religious hermeneutics.'],
      ['Department of Commerce', 'COM-AID', 'Aided', 'Dr. M. Joseph', 'hod.commerce@mcc.edu.in', 'Corporate finance, taxation laws, accounting standards, and international commerce.'],
      ['Department of Social Work', 'SOW-AID', 'Aided', 'Dr. Mary Angeline', 'hod.socialwork@mcc.edu.in', 'Community development, clinical psychiatric social work, and human welfare advocacy.'],
      ['Department of Mathematics', 'MATH-AID', 'Aided', 'Dr. A. Sundaram', 'hod.maths@mcc.edu.in', 'Pure and applied mathematics, formal grammar theory, graph theory, and topology.'],
      ['Department of Statistics', 'STAT-AID', 'Aided', 'Dr. S. Ravichandran', 'hod.statistics@mcc.edu.in', 'Stochastic processes, biostatistics, probability theory, and data analytics.'],
      ['Department of Physics', 'PHY-AID', 'Aided', 'Dr. G. Suresh', 'hod.physics@mcc.edu.in', 'Quantum optics, experimental condensed matter physics, and renewable solar energy labs.'],
      ['Department of Chemistry', 'CHEM-AID', 'Aided', 'Dr. Philip Wesley', 'hod.chemistry@mcc.edu.in', 'Synthetic organic chemistry, spectroscopy, green catalysis, and materials science.'],
      ['Department of Plant Biology and Plant Biotechnology (Botany)', 'BOT-AID', 'Aided', 'Dr. Edward Livingston', 'hod.botany@mcc.edu.in', 'Pristine 365-acre scrub jungle ecological field survey, floristics, and molecular plant biotech.'],
      ['Department of Zoology', 'ZOO-AID', 'Aided', 'Dr. Anita Soundararajan', 'hod.zoology@mcc.edu.in', 'Entomology, wildlife biodiversity studies, marine biology, and animal physiology.'],
      ['Department of Physical Education', 'PED-AID', 'Aided', 'Dr. K. Balaji', 'hod.physed@mcc.edu.in', 'Sports physiology, collegiate track and field championships, and athletic conditioning.'],
      ['Department of English (SFS)', 'ENG-SFS', 'Self-Financed', 'Dr. Rachel Varghese', 'hod.english.sfs@mcc.edu.in', 'Professional communicative English, contemporary literary studies, and technical writing.'],
      ['Department of Tamil (SFS)', 'TAM-SFS', 'Self-Financed', 'Dr. M. Murugan', 'hod.tamil.sfs@mcc.edu.in', 'Applied Tamil prose, journalistic writing, and regional media communications.'],
      ['Department of Languages (SFS)', 'LANG-SFS', 'Self-Financed', 'Dr. S. Geetha', 'hod.languages.sfs@mcc.edu.in', 'Modern global foreign languages and commercial translation certifications.'],
      ['Department of Journalism', 'JRN-SFS', 'Self-Financed', 'Dr. Paulson George', 'hod.journalism@mcc.edu.in', 'Investigative reporting, broadcast digital newsrooms, media ethics, and broadsheet production.'],
      ['Department of Social Work (SFS)', 'SOW-SFS', 'Self-Financed', 'Dr. Christine Gomez', 'hod.socialwork.sfs@mcc.edu.in', 'Human resource management, urban development programs, and youth development.'],
      ['Department of Commerce (SFS)', 'COM-SFS', 'Self-Financed', 'Dr. V. Chandrasekaran', 'hod.commerce.sfs@mcc.edu.in', 'Banking technology, corporate governance, e-commerce systems, and investment analysis.'],
      ['Department of Business Administration (BBA)', 'BBA-SFS', 'Self-Financed', 'Dr. Abraham Lincoln', 'hod.bba@mcc.edu.in', 'Strategic management, organizational leadership, marketing strategy, and entrepreneurial incubation.'],
      ['Department of Communication', 'COMM-SFS', 'Self-Financed', 'Dr. Sharon David', 'hod.communication@mcc.edu.in', 'Interpersonal communication, corporate PR, advertising, and digital brand storytelling.'],
      ['Department of Geography, Tourism and Travel Management', 'GTTM-SFS', 'Self-Financed', 'Dr. N. Parthiban', 'hod.gttm@mcc.edu.in', 'Geospatial information systems (GIS), global tourism logistics, and eco-travel management.'],
      ['Department of Hospitality and Tourism', 'HTM-SFS', 'Self-Financed', 'Dr. Richard Daniel', 'hod.hospitality@mcc.edu.in', 'Hospitality administration, resort management, culinary operations, and tourism economics.'],
      ['Department of Mathematics (SFS)', 'MATH-SFS', 'Self-Financed', 'Dr. K. Srinivasan', 'hod.maths.sfs@mcc.edu.in', 'Computational mathematics, numerical optimization, and algorithmic modeling.'],
      ['Department of Physics (SFS)', 'PHY-SFS', 'Self-Financed', 'Dr. Samuel Johnson', 'hod.physics.sfs@mcc.edu.in', 'Solid state electronics, applied physics, and computational laboratory simulations.'],
      ['Department of Chemistry (SFS)', 'CHEM-SFS', 'Self-Financed', 'Dr. Grace Nirmala', 'hod.chemistry.sfs@mcc.edu.in', 'Analytical chemistry, pharmaceutical compounds, and industrial chemical testing.'],
      ['Department of Microbiology', 'MCB-SFS', 'Self-Financed', 'Dr. Benjamin Isaac', 'hod.microbiology@mcc.edu.in', 'Immunology, microbial genetics, clinical epidemiology, and industrial biotechnology.'],
      ['Department of Computer Application (BCA)', 'BCA-SFS', 'Self-Financed', 'Dr. Elizabeth Chacko', 'hod.bca@mcc.edu.in', 'Software engineering, enterprise web applications, cloud infrastructure, and database systems.'],
      ['Department of Computer Science (B.Sc.)', 'CS-BSC-SFS', 'Self-Financed', 'Dr. Mark Christopher', 'hod.cs.bsc@mcc.edu.in', 'Algorithms, operating systems, data structures, and computer architecture fundamentals.'],
      ['Department of Computer Science (MCA)', 'CS-MCA-SFS', 'Self-Financed', 'Dr. V. Deepa', 'hod.cs.mca@mcc.edu.in', 'Advanced postgraduate software architecture, artificial intelligence, and mobile systems.'],
      ['Department of Data Science', 'DS-SFS', 'Self-Financed', 'Dr. Anand Kumar', 'hod.datascience@mcc.edu.in', 'Big data processing, machine learning, predictive statistical modeling, and deep learning.'],
      ['Department of Visual Communication', 'VISCOM-SFS', 'Self-Financed', 'Dr. Stephen Jayaraj', 'hod.viscom@mcc.edu.in', 'Cinematography, documentary filmmaking, broadcast production, graphic design, and animation.'],
      ['Department of Physical Education, Health Education and Sports', 'PED-SFS', 'Self-Financed', 'Dr. M. Prakash', 'hod.sports.sfs@mcc.edu.in', 'Kinesiology, sports medicine, athletic coaching, and campus recreation programs.'],
      ['Department of Psychology', 'PSY-SFS', 'Self-Financed', 'Dr. Hannah Rebecca', 'hod.psychology@mcc.edu.in', 'Cognitive psychology, clinical counseling, psychometrics, and organizational behavior.']
    ];

    for (const [name, code, stream, hod, email, desc] of departments) {
      await connection.query(
        'INSERT INTO departments (name, code, stream, head_of_department, contact_email, description) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), stream = VALUES(stream), head_of_department = VALUES(head_of_department), contact_email = VALUES(contact_email), description = VALUES(description)',
        [name, code, stream, hod, email, desc]
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

    // 4. Seed Standard Administrative Accounts
    console.log('[4/4] Seeding Default Administrative Users...');
    const saltRounds = 10;
    const defaultPasswordHash = await bcrypt.hash('root', saltRounds);

    const [deptRows] = await connection.query(
      "SELECT id FROM departments WHERE code = 'ENG-AID' LIMIT 1"
    );
    const adminDeptId = deptRows.length > 0 ? deptRows[0].id : null;

    // Super Admin: superadmin
    await connection.query(
      `INSERT INTO users (id, name, username, email, password_hash, role, department_id, is_active)
       VALUES (99, 'MCC Super Administrator', 'superadmin', 'superadmin@mcc.edu.in', ?, 'superadmin', ?, true)
       ON DUPLICATE KEY UPDATE 
         username = 'superadmin', 
         email = 'superadmin@mcc.edu.in', 
         password_hash = VALUES(password_hash), 
         role = 'superadmin', 
         is_active = true`,
      [defaultPasswordHash, adminDeptId]
    );

    // Editorial Admin: admin
    await connection.query(
      `INSERT INTO users (id, name, username, email, password_hash, role, department_id, is_active)
       VALUES (1, 'MCC Editorial Administrator', 'admin', 'admin@mcc.edu.in', ?, 'admin', ?, true)
       ON DUPLICATE KEY UPDATE 
         username = 'admin', 
         email = 'admin@mcc.edu.in', 
         password_hash = VALUES(password_hash), 
         role = 'admin', 
         is_active = true`,
      [defaultPasswordHash, adminDeptId]
    );

    console.log('--- Database Seeding Complete ---');
    console.log('Super Admin: username superadmin (password: root)');
    console.log('Editorial Admin: username admin (password: root)');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

seedDatabase();