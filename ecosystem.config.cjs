// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'kukemc-website',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5460  //
    }
  }]
};
