module.exports = {
  apps: [
    {
      name: 'baocaoluadao',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/baocaoluadao.com',
      instances: 1,
      exec_mode: 'fork',
      kill_timeout: 10000,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 15,
      exp_backoff_restart_delay: 100,
      autorestart: true,
      // Watching disabled in production builds
      watch: false,
      merge_logs: true,
      error_file: '/var/log/baocaoluadao/pm2-error.log',
      out_file: '/var/log/baocaoluadao/pm2-out.log',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
    },
  ],
};
