module.exports = {
  apps: [
    {
      name: 'scraper-service-post',
      script: 'dist/apps/scraper-service/main.js',
      watch: ['./dist/apps/scraper-service'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
      env: {
        SCRAPE_TYPE: 'post',
      },
    },
    {
      name: 'scraper-service-detail',
      script: 'dist/apps/scraper-service/main.js',
      watch: ['./dist/apps/scraper-service'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
      env: {
        SCRAPE_TYPE: 'detail',
      },
    },
  ],
};
