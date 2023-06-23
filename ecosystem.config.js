<<<<<<< HEAD
const scraper = require('./anime-scraper.config');

module.exports = {
  apps: [
    ...scraper.apps,
    {
      name: 'api',
      script: 'dist/apps/api/main.js',
      watch: ['./dist/apps/api'],
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
    },
  ],
=======
module.exports = {
  apps : [{
    script: 'index.js',
    watch: '.'
  }, {
    script: './service-worker/',
    watch: ['./service-worker']
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
>>>>>>> 52cdb53cedd47ffb12ab82f4aee89182589ecf85
};
