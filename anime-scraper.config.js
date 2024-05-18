module.exports = {
  apps: [
    {
      name: 'media-updater',
      script: 'dist/apps/media-updater/apps/media-updater/src/main.js',
      watch: ['./dist/apps/media-updater/apps/media-updater/src'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
    },
    {
      name: 'scraper-service-post',
      script: 'dist/apps/scraper-service/apps/scraper-service/src/main.js',
      watch: ['./dist/apps/scraper-service/apps/scraper-service/src'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
      env: {
        SCRAPE_TYPE: 'post',
        CONSUMER_PREFETCH_COUNT: 5,
      },
    },
    {
      name: 'scraper-service-detail',
      script: 'dist/apps/scraper-service/apps/scraper-service/src/main.js',
      watch: ['./dist/apps/scraper-service/apps/scraper-service/src'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
      env: {
        SCRAPE_TYPE: 'detail',
        CONSUMER_PREFETCH_COUNT: 15,
      },
    },
    {
      name: 'scraper-service-episode',
      script: 'dist/apps/scraper-service/apps/scraper-service/src/main.js',
      watch: ['./dist/apps/scraper-service/apps/scraper-service/src'],
      autorestart: true,
      cron_restart: '0 * * * *',
      // interpreter: 'node@16.18.0',
      env: {
        SCRAPE_TYPE: 'episode',
        CONSUMER_PREFETCH_COUNT: 3,
      },
    },
  ],
};
