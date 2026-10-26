const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const pool = require('../config/db');

async function exportDatabase() {
  console.log('--- Starting Programmatic Database Export ---');
  const outputFile = path.resolve(__dirname, '../../database_backup.sql');
  const dbName = process.env.DB_NAME || 'mcc_chronicles';

  try {
    const [versionRow] = await pool.query('SELECT @@version AS version, NOW() AS exportTime');
    const mysqlVersion = versionRow[0].version;
    const exportTime = versionRow[0].exportTime;

    let sql = `-- =====================================================================\n`;
    sql += `-- MCC CHRONICLES DATABASE DUMP & HANDOVER SPECIFICATION\n`;
    sql += `-- Database: ${dbName}\n`;
    sql += `-- Server Version: MySQL ${mysqlVersion} (Port 3307)\n`;
    sql += `-- Generated At: ${exportTime}\n`;
    sql += `-- =====================================================================\n\n`;

    sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sql += `SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n`;
    sql += `SET NAMES utf8mb4;\n`;
    sql += `SET time_zone = '+00:00';\n\n`;

    sql += `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`${dbName}\`;\n\n`;

    // Fetch all tables in database
    const [tableRows] = await pool.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
    const tableKey = Object.keys(tableRows[0])[0];
    const tables = tableRows.map((r) => r[tableKey]);

    console.log(`Found ${tables.length} tables to export from ${dbName}:`);

    // Preferred table export order to preserve relational hierarchy
    const preferredOrder = [
      'users',
      'categories',
      'departments',
      'tags',
      'articles',
      'article_authors',
      'article_tags',
      'article_assignments',
      'article_revisions',
      'galleries',
      'circulars',
      'comments',
      'bookmarks',
      'polls',
      'poll_votes',
      'subscribers',
      'contact_messages',
      'activity_logs',
      'site_settings',
    ];

    const sortedTables = [
      ...preferredOrder.filter((t) => tables.includes(t)),
      ...tables.filter((t) => !preferredOrder.includes(t)),
    ];

    let totalRowsExported = 0;

    for (const table of sortedTables) {
      console.log(`Exporting table: ${table}...`);

      sql += `-- -------------------------------------------------------------------\n`;
      sql += `-- Table structure for table \`${table}\`\n`;
      sql += `-- -------------------------------------------------------------------\n`;
      sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;

      const [createResult] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSql = createResult[0]['Create Table'];
      sql += `${createTableSql};\n\n`;

      // Fetch table records
      const [dataRows] = await pool.query(`SELECT * FROM \`${table}\``);
      if (dataRows.length > 0) {
        totalRowsExported += dataRows.length;
        sql += `-- Dumping data for table \`${table}\` (${dataRows.length} rows)\n`;

        // Batch inserts in chunks of 50 to maintain clean SQL file syntax
        const chunkSize = 50;
        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          const columns = Object.keys(chunk[0]).map((col) => `\`${col}\``).join(', ');

          const valueRows = chunk.map((row) => {
            const values = Object.values(row).map((val) => {
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 1 : 0;
              if (val instanceof Date) {
                return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
              }
              if (typeof val === 'object') {
                return mysql.escape(JSON.stringify(val));
              }
              return mysql.escape(val);
            });
            return `(${values.join(', ')})`;
          });

          sql += `INSERT INTO \`${table}\` (${columns}) VALUES\n${valueRows.join(',\n')};\n`;
        }
        sql += `\n`;
      }
    }

    sql += `-- -------------------------------------------------------------------\n`;
    sql += `-- Re-enable Foreign Key Constraints\n`;
    sql += `-- -------------------------------------------------------------------\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sql += `-- Dump completed on ${new Date().toISOString()}\n`;

    fs.writeFileSync(outputFile, sql, 'utf8');

    const stats = fs.statSync(outputFile);
    const lineCount = sql.split('\n').length;
    const sizeKb = (stats.size / 1024).toFixed(2);

    console.log('\n✅ Database Export Completed Successfully!');
    console.log('Target File:       ', outputFile);
    console.log('Total Tables:      ', sortedTables.length);
    console.log('Total Rows:        ', totalRowsExported);
    console.log('Total Lines:       ', lineCount);
    console.log('File Size:         ', `${sizeKb} KB (${stats.size} bytes)`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Export Failed:', err.message);
    process.exit(1);
  }
}

exportDatabase();
