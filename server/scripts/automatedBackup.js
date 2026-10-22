/**
 * Automated Database Backup & Snapshot Script (Task 135)
 * Dumps complete database relational state with timestamps and automated retention pruning.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

const BACKUP_DIR = path.resolve(__dirname, '../backups');

const TABLES_TO_BACKUP = [
  'departments',
  'users',
  'categories',
  'articles',
  'article_revisions',
  'tags',
  'article_tags',
  'article_authors',
  'comments',
  'circulars',
  'galleries',
  'activity_logs',
  'subscribers',
  'contact_messages',
  'polls',
  'poll_votes',
  'bookmarks',
  'article_assignments',
];

/**
 * Creates a timestamped full database snapshot.
 * @param {number} retentionCount - Number of recent snapshots to retain (default 10)
 * @returns {Promise<string>} Path of the created backup file
 */
async function performDatabaseBackup(retentionCount = 10) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);

  const backupFilename = `backup_mcc_chronicles_${timestamp}.json`;
  const backupFilePath = path.join(BACKUP_DIR, backupFilename);

  console.log(`[BACKUP ENGINE] Initiating snapshot for ${TABLES_TO_BACKUP.length} tables...`);

  const dump = {
    metadata: {
      timestamp: new Date().toISOString(),
      database: process.env.DB_NAME || 'mcc_chronicles',
      version: '1.0.0',
      tablesIncluded: TABLES_TO_BACKUP,
    },
    tables: {},
  };

  for (const table of TABLES_TO_BACKUP) {
    try {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
      dump.tables[table] = rows;
      console.log(`  ✓ Dumped ${table}: ${rows.length} rows`);
    } catch (err) {
      console.warn(`  ⚠ Warning: Unable to dump table '${table}': ${err.message}`);
      dump.tables[table] = [];
    }
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(dump, null, 2), 'utf-8');
  const fileSizeBytes = fs.statSync(backupFilePath).size;
  const fileSizeKb = (fileSizeBytes / 1024).toFixed(2);

  console.log(`[BACKUP ENGINE] Snapshot successfully written: ${backupFilename} (${fileSizeKb} KB)`);

  // Log activity
  try {
    await logActivity({
      userId: null,
      action: 'DATABASE_BACKUP_CREATED',
      entityType: 'system',
      entityId: null,
      details: `Created snapshot ${backupFilename} (${fileSizeKb} KB)`,
    });
  } catch (e) {
    // Ignore logging failure during standalone script
  }

  // Retention Pruning: Delete oldest backups if count exceeds retentionCount
  pruneOldBackups(retentionCount);

  return backupFilePath;
}

/**
 * Prunes backup files exceeding maximum retention threshold.
 */
function pruneOldBackups(maxFiles = 10) {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('backup_mcc_chronicles_') && f.endsWith('.json'))
      .map((f) => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxFiles) {
      const toDelete = files.slice(maxFiles);
      for (const item of toDelete) {
        fs.unlinkSync(item.path);
        console.log(`[BACKUP ENGINE] Pruned aged backup file: ${item.name}`);
      }
    }
  } catch (err) {
    console.warn('[BACKUP ENGINE] Retention pruning warning:', err.message);
  }
}

// Execute directly if run as a standalone script
if (require.main === module) {
  performDatabaseBackup()
    .then((filePath) => {
      console.log(`Backup completed successfully: ${filePath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database backup failed:', err);
      process.exit(1);
    });
}

module.exports = {
  performDatabaseBackup,
  pruneOldBackups,
};
