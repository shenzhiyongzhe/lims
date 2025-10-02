// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'lims-app',
    script: 'node',
    args: '.next/standalone/server.js',
    cwd: './', // 确保工作目录正确
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '512M',

    // 日志配置
    log_file: '~/.pm2/logs/combined.log',
    out_file: '~/.pm2/logs/out.log',
    error_file: '~/.pm2/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',

    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // 监控和重启配置
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};