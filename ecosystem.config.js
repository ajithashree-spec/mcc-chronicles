/**
 * PM2 Process Manager Configuration (Task 134)
 * Configures cluster workers, memory thresholds, and automated recovery for production.
 */
module.exports = {
  apps: [
    {
      name: 'mcc-chronicles-api',
      script: './server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      error_file: './server/logs/pm2-error.log',
      out_file: './server/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      merge_logs: true,
    },
  ],
};
