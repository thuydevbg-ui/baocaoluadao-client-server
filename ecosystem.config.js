module.exports = {
  apps: [
    {
      name: 'baocaoluadao',
      script: 'npm',
      args: ['start', '--', '--hostname', '127.0.0.1'],
      cwd: '/var/www/baocaoluadao.com',
      instances: 'max',
      exec_mode: 'cluster',
      kill_timeout: 5000,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      merge_logs: true,
      error_file: '/var/log/baocaoluadao/pm2-error.log',
      out_file: '/var/log/baocaoluadao/pm2-out.log',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1',
      },
    },
  ],
};
