module.exports = {
  apps: [
    {
      name: 'autosocial-ai-worker',
      script: 'tsx',
      args: 'index.ts',
      cwd: './worker',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './worker/logs/error.log',
      out_file: './worker/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};

