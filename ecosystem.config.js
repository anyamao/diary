module.exports = {
  apps: [
    {
      name: 'diary-backend',
      script: 'gunicorn',
      args: '-w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 127.0.0.1:8011',
      cwd: '/home/vika/diary/backend',
      interpreter: '/home/vika/diary/backend/venv/bin/python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PYTHONPATH: '/home/vika/diary/backend'
      }
    },
    {
      name: 'diary-frontend',
      script: 'pnpm',
      args: 'start -p 3011',
      cwd: '/home/vika/diary/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3011
      }
    }
  ]
}
