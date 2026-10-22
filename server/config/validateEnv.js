/**
 * Environment Configuration Validator (Task 137).
 * Ensures critical environment variables exist at boot time.
 * Halts startup early with descriptive diagnostics if essential keys are absent.
 */
function validateEnv() {
  const requiredKeys = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
  const missing = [];

  for (const key of requiredKeys) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[CRITICAL CONFIG ERROR] Missing required environment variables: ${missing.join(', ')}. Please configure them in server/.env or container environment.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Provide sensible production defaults for optional keys
  if (!process.env.PORT) {
    process.env.PORT = '5000';
  }
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  return {
    valid: true,
    port: process.env.PORT,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    nodeEnv: process.env.NODE_ENV,
  };
}

module.exports = {
  validateEnv,
};
