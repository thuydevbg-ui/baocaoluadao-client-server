module.exports = {
  apps: [
    {
      name: 'baocaoluadao',
      script: 'npm',
      args: ['start'],
      cwd: '/var/www/baocaoluadao.com',
      // Using fork mode (exec_mode: 'fork') instead of cluster for stability:
      // 1. Single instance ensures consistent database connection pooling
      // 2. Avoids potential race conditions with shared resources
      // 3. Simpler memory management - no inter-process communication overhead
      // 4. Easier debugging and logging consistency
      // 5. Next.js handles its own request parallelization internally
      // Note: To scale horizontally, use multiple PM2 instances behind a load balancer
      // rather than PM2 cluster mode.
      instances: 1,
      exec_mode: 'fork',
      kill_timeout: 5000,
      max_memory_restart: '700M',
      min_uptime: '10s',
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
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
