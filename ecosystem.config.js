module.exports = {
  apps: [
    {
      name: 'gothitech-api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'change-this-secret-in-production',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: '/var/log/gothitech/error.log',
      out_file: '/var/log/gothitech/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      exp_backoff_restart_delay: 100,
    },
  ],
};
