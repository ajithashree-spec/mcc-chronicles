const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('--- Testing Database Connection ---');
  console.log('Host:    ', process.env.DB_HOST || '127.0.0.1');
  console.log('Port:    ', Number(process.env.DB_PORT) || 3307);
  console.log('User:    ', process.env.DB_USER || 'root');
  console.log('Database:', process.env.DB_NAME || 'mcc_chronicles');
  console.log('Password set:', process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '');

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'mcc_chronicles',
    port: Number(process.env.DB_PORT) || 3307,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };

  try {
    const pool = mysql.createPool(config);
    const [rows] = await pool.query('SELECT 1 + 1 AS result, USER() AS currentUser, @@port AS activePort, @@version AS mysqlVersion');
    console.log('✅ Connection SUCCESSFUL:');
    console.log(rows[0]);

    // Inspect user accounts in mysql.user
    try {
      const [userRows] = await pool.query("SELECT User, Host, plugin, authentication_string != '' AS hasPassword FROM mysql.user WHERE User = 'root'");
      console.log('\nRoot users in MySQL:');
      console.table(userRows);
    } catch (e) {
      console.log('(Cannot query mysql.user - normal for non-admin accounts)');
    }

    await pool.end();
  } catch (err) {
    console.error('❌ Connection FAILED:');
    console.error('Code:   ', err.code);
    console.error('Message:', err.message);
  }
}

testConnection();
