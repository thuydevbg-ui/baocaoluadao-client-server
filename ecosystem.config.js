module.exports = {
  apps: [
    {
      name: 'baocaoluadao',
      script: 'npm',
      // Use dev mode for auto-reload on code changes
      args: ['run', 'dev'],
      cwd: '/var/www/baocaoluadao.com',
      instances: 1,
      exec_mode: 'fork',
      kill_timeout: 10000,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 15,
      exp_backoff_restart_delay: 100,
      autorestart: true,
      // Enable watch for auto-restart on code changes
      watch: [
        'src',
        'package.json',
        'next.config.js',
        'tsconfig.json'
      ],
      ignore_watch: [
        'node_modules',
        '.next',
        '.git',
        '*.log',
        'pm2-*'
      ],
      watch_delay: 2000,
      merge_logs: true,
      error_file: '/var/log/baocaoluadao/pm2-error.log',
      out_file: '/var/log/baocaoluadao/pm2-out.log',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
    },
  ],
};
