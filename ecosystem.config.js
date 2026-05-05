module.exports = {
  apps: [
    {
      name: 'diary-backend',
      script: 'backend/venv/bin/gunicorn',
      args: 'app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8011',
      cwd: '/home/your-user/diary',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PYTHONPATH: '/home/your-user/diary/backend'
      }
    },
    {
      name: 'diary-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3011',
      cwd: '/home/your-user/diary/frontend',
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
