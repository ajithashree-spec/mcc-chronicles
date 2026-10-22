const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedDeptAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mcc_chronicles',
  });

  try {
    console.log('--- SEEDING CHEMISTRY (AIDED) DEPARTMENT ADMIN TEST ACCOUNT ---');

    // 1. Locate Chemistry (Aided) Department
    let [deptRows] = await connection.query(
      `SELECT id, name, code, stream FROM departments 
       WHERE code = 'CHEM-AID' OR LOWER(code) = 'chem-aid' OR (name LIKE '%Chemistry%' AND stream = 'Aided')
       LIMIT 1`
    );

    let deptId;
    if (deptRows.length === 0) {
      console.log('Department CHEM-AID not found. Inserting official Chemistry (Aided) record...');
      const [insertDept] = await connection.query(
        `INSERT INTO departments (name, code, stream, head_of_department, contact_email, description)
         VALUES ('Department of Chemistry', 'CHEM-AID', 'Aided', 'Dr. Philip Wesley', 'hod.chemistry@mcc.edu.in', 'Synthetic organic chemistry, spectroscopy, green catalysis, and materials science.')`
      );
      deptId = insertDept.insertId;
    } else {
      deptId = deptRows[0].id;
      console.log(`Located Chemistry (Aided) Department: ID ${deptId} [${deptRows[0].code}] - ${deptRows[0].name}`);
    }

    // 2. Hash Password with bcrypt
    const rawPassword = 'Editor@MCC2026';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // 3. Insert or Update User Account
    const email = 'chem.editor@mcc.edu.in';
    const name = 'Dr. Department Correspondent';
    const role = 'editor';
    const bio = 'Department Correspondent & Bureau Editor, Department of Chemistry (Aided), Madras Christian College';

    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, bio, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         department_id = VALUES(department_id),
         bio = VALUES(bio),
         is_active = 1`,
      [name, email, passwordHash, role, deptId, bio]
    );

    // 4. Verify user record committed to MySQL
    const [userRows] = await connection.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.is_active, u.created_at,
              d.name AS department_name, d.code AS department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    if (userRows.length === 0) {
      throw new Error(`Failed to commit user ${email} to MySQL.`);
    }

    const verifiedUser = userRows[0];
    console.log('✓ Successfully seeded and verified Department Admin Editor Account:');
    console.log({
      id: verifiedUser.id,
      email: verifiedUser.email,
      name: verifiedUser.name,
      role: verifiedUser.role,
      department_id: verifiedUser.department_id,
      department_code: verifiedUser.department_code,
      department_name: verifiedUser.department_name,
      is_active: Boolean(verifiedUser.is_active),
    });

    console.log('\n--- CREDENTIALS READY FOR TESTING ---');
    console.log(`Email / Username : ${email}`);
    console.log(`Password         : ${rawPassword}`);
    console.log(`Assigned Bureau  : ${verifiedUser.department_name} (${verifiedUser.department_code}) [ID: ${verifiedUser.department_id}]`);
    console.log(`Role             : ${verifiedUser.role}`);
    console.log(`Active Status    : ${verifiedUser.is_active ? 'ACTIVE' : 'INACTIVE'}`);
  } catch (err) {
    console.error('Seeding Department Admin failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedDeptAdmin();
}

module.exports = seedDeptAdmin;
