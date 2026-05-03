module.exports = {
  apps: [
    {
      name: 'diary-backend',
      script: 'gunicorn',
      args: 'app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8011',
      cwd: '/home/vika/diary/backend',
      interpreter: '/home/vika/diary/backend/venv/bin/python',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'diary-frontend',
      script: 'pnpm',
      args: 'start',
      cwd: '/home/vika/diary/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3011
      }
    }
  ]
}
