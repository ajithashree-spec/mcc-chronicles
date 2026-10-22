const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'mcc_chronicles';

  console.log(`Connecting to MySQL host at ${host}:${port}...`);
  const connection = await mysql.createConnection({ host, port, user, password });

  try {
    console.log(`Creating database \`${dbName}\` if it does not exist...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`Database \`${dbName}\` is ready.`);

    await connection.changeUser({ database: dbName });

    // Task 138: Production Migration Safety & Idempotency Lock
    console.log('[MIGRATION SAFETY] Running in non-destructive idempotent mode. No tables will be dropped.');
    console.log('Creating/verifying schema tables...');

    // 1. Departments Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(30) NOT NULL UNIQUE,
        stream ENUM('Aided', 'Self-Financed', 'General') NOT NULL DEFAULT 'Aided',
        head_of_department VARCHAR(150) DEFAULT NULL,
        contact_email VARCHAR(191) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'editor', 'reporter', 'faculty') DEFAULT 'reporter',
        department_id INT DEFAULT NULL,
        avatar_url VARCHAR(255) DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(120) NOT NULL UNIQUE,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Articles Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        summary TEXT DEFAULT NULL,
        content LONGTEXT NOT NULL,
        cover_image VARCHAR(255) DEFAULT NULL,
        status ENUM('pitch', 'draft', 'in_review', 'scheduled', 'published', 'archived') DEFAULT 'draft',
        scheduled_at TIMESTAMP NULL DEFAULT NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        is_breaking BOOLEAN DEFAULT FALSE,
        views_count INT DEFAULT 0,
        author_id INT NOT NULL,
        category_id INT DEFAULT NULL,
        department_id INT DEFAULT NULL,
        published_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Comments Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        author_name VARCHAR(120) NOT NULL,
        author_email VARCHAR(191) NOT NULL,
        content TEXT NOT NULL,
        is_approved BOOLEAN DEFAULT TRUE,
        status ENUM('pending', 'approved', 'rejected', 'spam') DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Site Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Circulars Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS circulars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        circular_number VARCHAR(100) UNIQUE NOT NULL,
        content TEXT NULL,
        attachment_url VARCHAR(500) NULL,
        department_id INT NULL,
        target_audience ENUM('all', 'students', 'faculty', 'staff') DEFAULT 'all',
        is_pinned BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        publish_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Galleries Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS galleries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        image_url VARCHAR(500) NOT NULL,
        caption VARCHAR(255) NULL,
        event_name VARCHAR(150) NULL,
        department_id INT NULL,
        uploaded_by INT NULL,
        is_featured_carousel BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Activity Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NULL,
        entity_id INT NULL,
        details TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Subscribers Table (Newsletter)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(150) NULL,
        frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
        is_active BOOLEAN DEFAULT TRUE,
        unsubscribe_token VARCHAR(64) NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Contact Messages Table (Reader Inquiries & Feedback)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category ENUM('editorial_tip', 'general_inquiry', 'correction', 'grievance', 'event_coverage') DEFAULT 'general_inquiry',
        message TEXT NOT NULL,
        status ENUM('unread', 'read', 'in_progress', 'resolved', 'archived') DEFAULT 'unread',
        admin_notes TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. Tags Taxonomy Table (Task 82)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        slug VARCHAR(60) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. Article Tags Junction Table (Task 82)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_tags (
        article_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (article_id, tag_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 14. Article Revisions Table (Task 83)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_revisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        editor_id INT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        excerpt TEXT NULL,
        change_summary VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 15. Campus Polls Table (Task 84)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question VARCHAR(255) NOT NULL,
        options JSON NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 16. Poll Votes Table (Task 84)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS poll_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        poll_id INT NOT NULL,
        option_index INT NOT NULL,
        ip_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (poll_id, ip_hash),
        FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migration: Add scheduled_at column and update status ENUM on articles (Task 94)
    try {
      await connection.query(`
        ALTER TABLE articles 
        ADD COLUMN scheduled_at TIMESTAMP NULL DEFAULT NULL
      `);
    } catch (e) {
      // Column may already exist
    }

    try {
      await connection.query(`
        ALTER TABLE articles 
        MODIFY COLUMN status ENUM('pitch', 'draft', 'in_review', 'scheduled', 'published', 'archived') NOT NULL DEFAULT 'draft'
      `);
    } catch (e) {
      // Enum already modified
    }

    // 17. Bookmarks Table (Task 97)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        article_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (user_id, article_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 18. Article Assignments Table (Task 98)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        brief TEXT NOT NULL,
        assigned_to INT NULL,
        assigned_by INT NOT NULL,
        department_id INT NULL,
        deadline DATE NULL,
        status ENUM('assigned', 'accepted', 'submitted', 'completed', 'cancelled') DEFAULT 'assigned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 19. Multi-Author Bylines Table (Task 99)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_authors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        user_id INT NOT NULL,
        role_in_article VARCHAR(50) DEFAULT 'Co-Author',
        UNIQUE KEY (article_id, user_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 20. Seed/Sync Official 38 MCC Departments (17 Aided + 21 Self-Financed)
    console.log('[OFFICIAL MCC DEPARTMENTS] Verifying all 38 departments...');
    const OFFICIAL_DEPARTMENTS = [
      // Aided Stream (Shift I) - 17 Departments
      { name: 'Department of English', code: 'ENG-AID', stream: 'Aided', head_of_department: 'Dr. Sarah Alexander', contact_email: 'hod.english@mcc.edu.in', description: 'Pioneering liberal arts, literary criticism, and collegiate rhetoric since 1837.' },
      { name: 'Department of Tamil', code: 'TAM-AID', stream: 'Aided', head_of_department: 'Dr. K. Senthil Kumar', contact_email: 'hod.tamil@mcc.edu.in', description: 'Classical Dravidian linguistics, ancient Sangam literature, and modern cultural research.' },
      { name: 'Department of Languages (French, German, Hindi, Kannada, Malayalam, Sanskrit, Telugu)', code: 'LANG-AID', stream: 'Aided', head_of_department: 'Dr. P. Rajeswari', contact_email: 'hod.languages@mcc.edu.in', description: 'Multilingual humanities consortium offering European and Indian classical and modern tongues.' },
      { name: 'Department of History', code: 'HIST-AID', stream: 'Aided', head_of_department: 'Dr. David Annadurai', contact_email: 'hod.history@mcc.edu.in', description: 'Colonial archives, archaeological field research, and South Asian historical studies.' },
      { name: 'Department of Political Science', code: 'POL-AID', stream: 'Aided', head_of_department: 'Dr. J. Paul Sudhakar', contact_email: 'hod.polsci@mcc.edu.in', description: 'Constitutional jurisprudence, democratic governance, and international diplomatic relations.' },
      { name: 'Department of Public Administration', code: 'PUB-AID', stream: 'Aided', head_of_department: 'Dr. R. Vijay Anand', contact_email: 'hod.pubadmin@mcc.edu.in', description: 'Public policy formulation, civil service leadership, and administrative ethics.' },
      { name: 'Department of Economics', code: 'ECO-AID', stream: 'Aided', head_of_department: 'Dr. C. Selvaraj', contact_email: 'hod.economics@mcc.edu.in', description: 'Econometric modeling, developmental policy, and monetary systems research.' },
      { name: 'Department of Philosophy', code: 'PHIL-AID', stream: 'Aided', head_of_department: 'Dr. Thomas Mathew', contact_email: 'hod.philosophy@mcc.edu.in', description: 'Classical metaphysics, epistemology, ethics, and contemporary inter-religious hermeneutics.' },
      { name: 'Department of Commerce', code: 'COM-AID', stream: 'Aided', head_of_department: 'Dr. M. Joseph', contact_email: 'hod.commerce@mcc.edu.in', description: 'Corporate finance, taxation laws, accounting standards, and international commerce.' },
      { name: 'Department of Social Work', code: 'SOW-AID', stream: 'Aided', head_of_department: 'Dr. Mary Angeline', contact_email: 'hod.socialwork@mcc.edu.in', description: 'Community development, clinical psychiatric social work, and human welfare advocacy.' },
      { name: 'Department of Mathematics', code: 'MATH-AID', stream: 'Aided', head_of_department: 'Dr. A. Sundaram', contact_email: 'hod.maths@mcc.edu.in', description: 'Pure and applied mathematics, formal grammar theory, graph theory, and topology.' },
      { name: 'Department of Statistics', code: 'STAT-AID', stream: 'Aided', head_of_department: 'Dr. S. Ravichandran', contact_email: 'hod.statistics@mcc.edu.in', description: 'Stochastic processes, biostatistics, probability theory, and data analytics.' },
      { name: 'Department of Physics', code: 'PHY-AID', stream: 'Aided', head_of_department: 'Dr. G. Suresh', contact_email: 'hod.physics@mcc.edu.in', description: 'Quantum optics, experimental condensed matter physics, and renewable solar energy labs.' },
      { name: 'Department of Chemistry', code: 'CHEM-AID', stream: 'Aided', head_of_department: 'Dr. Philip Wesley', contact_email: 'hod.chemistry@mcc.edu.in', description: 'Synthetic organic chemistry, spectroscopy, green catalysis, and materials science.' },
      { name: 'Department of Plant Biology and Plant Biotechnology (Botany)', code: 'BOT-AID', stream: 'Aided', head_of_department: 'Dr. Edward Livingston', contact_email: 'hod.botany@mcc.edu.in', description: 'Pristine 365-acre scrub jungle ecological field survey, floristics, and molecular plant biotech.' },
      { name: 'Department of Zoology', code: 'ZOO-AID', stream: 'Aided', head_of_department: 'Dr. Anita Soundararajan', contact_email: 'hod.zoology@mcc.edu.in', description: 'Entomology, wildlife biodiversity studies, marine biology, and animal physiology.' },
      { name: 'Department of Physical Education', code: 'PED-AID', stream: 'Aided', head_of_department: 'Dr. K. Balaji', contact_email: 'hod.physed@mcc.edu.in', description: 'Sports physiology, collegiate track and field championships, and athletic conditioning.' },

      // Self-Financed Stream (Shift II) - 21 Departments / Units
      { name: 'Department of English (SFS)', code: 'ENG-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Rachel Varghese', contact_email: 'hod.english.sfs@mcc.edu.in', description: 'Professional communicative English, contemporary literary studies, and technical writing.' },
      { name: 'Department of Tamil (SFS)', code: 'TAM-SFS', stream: 'Self-Financed', head_of_department: 'Dr. M. Murugan', contact_email: 'hod.tamil.sfs@mcc.edu.in', description: 'Applied Tamil prose, journalistic writing, and regional media communications.' },
      { name: 'Department of Languages (SFS)', code: 'LANG-SFS', stream: 'Self-Financed', head_of_department: 'Dr. S. Geetha', contact_email: 'hod.languages.sfs@mcc.edu.in', description: 'Modern global foreign languages and commercial translation certifications.' },
      { name: 'Department of Journalism', code: 'JRN-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Paulson George', contact_email: 'hod.journalism@mcc.edu.in', description: 'Investigative reporting, broadcast digital newsrooms, media ethics, and broadsheet production.' },
      { name: 'Department of Social Work (SFS)', code: 'SOW-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Christine Gomez', contact_email: 'hod.socialwork.sfs@mcc.edu.in', description: 'Human resource management, urban development programs, and youth development.' },
      { name: 'Department of Commerce (SFS)', code: 'COM-SFS', stream: 'Self-Financed', head_of_department: 'Dr. V. Chandrasekaran', contact_email: 'hod.commerce.sfs@mcc.edu.in', description: 'Banking technology, corporate governance, e-commerce systems, and investment analysis.' },
      { name: 'Department of Business Administration (BBA)', code: 'BBA-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Abraham Lincoln', contact_email: 'hod.bba@mcc.edu.in', description: 'Strategic management, organizational leadership, marketing strategy, and entrepreneurial incubation.' },
      { name: 'Department of Communication', code: 'COMM-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Sharon David', contact_email: 'hod.communication@mcc.edu.in', description: 'Interpersonal communication, corporate PR, advertising, and digital brand storytelling.' },
      { name: 'Department of Geography, Tourism and Travel Management', code: 'GTTM-SFS', stream: 'Self-Financed', head_of_department: 'Dr. N. Parthiban', contact_email: 'hod.gttm@mcc.edu.in', description: 'Geospatial information systems (GIS), global tourism logistics, and eco-travel management.' },
      { name: 'Department of Hospitality and Tourism', code: 'HTM-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Richard Daniel', contact_email: 'hod.hospitality@mcc.edu.in', description: 'Hospitality administration, resort management, culinary operations, and tourism economics.' },
      { name: 'Department of Mathematics (SFS)', code: 'MATH-SFS', stream: 'Self-Financed', head_of_department: 'Dr. K. Srinivasan', contact_email: 'hod.maths.sfs@mcc.edu.in', description: 'Computational mathematics, numerical optimization, and algorithmic modeling.' },
      { name: 'Department of Physics (SFS)', code: 'PHY-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Samuel Johnson', contact_email: 'hod.physics.sfs@mcc.edu.in', description: 'Solid state electronics, applied physics, and computational laboratory simulations.' },
      { name: 'Department of Chemistry (SFS)', code: 'CHEM-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Grace Nirmala', contact_email: 'hod.chemistry.sfs@mcc.edu.in', description: 'Analytical chemistry, pharmaceutical compounds, and industrial chemical testing.' },
      { name: 'Department of Microbiology', code: 'MCB-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Benjamin Isaac', contact_email: 'hod.microbiology@mcc.edu.in', description: 'Immunology, microbial genetics, clinical epidemiology, and industrial biotechnology.' },
      { name: 'Department of Computer Application (BCA)', code: 'BCA-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Elizabeth Chacko', contact_email: 'hod.bca@mcc.edu.in', description: 'Software engineering, enterprise web applications, cloud infrastructure, and database systems.' },
      { name: 'Department of Computer Science (B.Sc.)', code: 'CS-BSC-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Mark Christopher', contact_email: 'hod.cs.bsc@mcc.edu.in', description: 'Algorithms, operating systems, data structures, and computer architecture fundamentals.' },
      { name: 'Department of Computer Science (MCA)', code: 'CS-MCA-SFS', stream: 'Self-Financed', head_of_department: 'Dr. V. Deepa', contact_email: 'hod.cs.mca@mcc.edu.in', description: 'Advanced postgraduate software architecture, artificial intelligence, and mobile systems.' },
      { name: 'Department of Data Science', code: 'DS-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Anand Kumar', contact_email: 'hod.datascience@mcc.edu.in', description: 'Big data processing, machine learning, predictive statistical modeling, and deep learning.' },
      { name: 'Department of Visual Communication', code: 'VISCOM-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Stephen Jayaraj', contact_email: 'hod.viscom@mcc.edu.in', description: 'Cinematography, documentary filmmaking, broadcast production, graphic design, and animation.' },
      { name: 'Department of Physical Education, Health Education and Sports', code: 'PED-SFS', stream: 'Self-Financed', head_of_department: 'Dr. M. Prakash', contact_email: 'hod.sports.sfs@mcc.edu.in', description: 'Kinesiology, sports medicine, athletic coaching, and campus recreation programs.' },
      { name: 'Department of Psychology', code: 'PSY-SFS', stream: 'Self-Financed', head_of_department: 'Dr. Hannah Rebecca', contact_email: 'hod.psychology@mcc.edu.in', description: 'Cognitive psychology, clinical counseling, psychometrics, and organizational behavior.' },
    ];

    for (const d of OFFICIAL_DEPARTMENTS) {
      await connection.query(
        `INSERT INTO departments (name, code, stream, head_of_department, contact_email, description)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           stream = VALUES(stream),
           head_of_department = VALUES(head_of_department),
           contact_email = VALUES(contact_email),
           description = VALUES(description)`,
        [d.name, d.code, d.stream, d.head_of_department, d.contact_email, d.description]
      );
    }
    console.log(`[OFFICIAL MCC DEPARTMENTS] Successfully synced all ${OFFICIAL_DEPARTMENTS.length} official departments.`);

    // 21. Seed/Sync Standard Roles: Super Admin & Unified Admin Handle
    console.log('[USER CONSOLIDATION] Verifying standard accounts...');
    const superAdminPasswordHash = await bcrypt.hash('Admin@MCC2026', 10);
    const editorPasswordHash = await bcrypt.hash('Editor@MCC2026', 10);

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
    console.log('[USER CONSOLIDATION] Seeded admin@mcc.edu.in (super_admin) and editor@mcc.edu.in (editor).');

    console.log('All schema tables successfully initialized!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
