const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load .env reliably regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'mcc_chronicles',
  port: Number(process.env.DB_PORT) || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
