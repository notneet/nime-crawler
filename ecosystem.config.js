const scraper = require('./anime-scraper.config');

module.exports = {
  apps: [
    ...scraper.apps,
    {
      name: 'api',
      script: 'dist/apps/api/apps/api/src/main.js',
      watch: ['./dist/apps/api/apps/api/src/'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
    },
    {
      name: 'cron-interval',
      script: 'dist/apps/cron-interval/main.js',
      watch: ['./dist/apps/cron-interval'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
    },
    {
      name: 'routing-queue',
      script: 'dist/apps/routing-queue/main.js',
      watch: ['./dist/apps/routing-queue'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
      env: {
        CONSUMER_PREFETCH_COUNT: 200,
      },
    },
  ],
};
