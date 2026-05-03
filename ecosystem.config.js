module.exports = {
  apps: [
    {
      name: 'diary-backend',
      script: 'gunicorn',
      args: 'app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8011',
      cwd: '/home/vika/diary/backend',
      interpreter: '/home/vika/diary/backend/venv/bin/python',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'diary-frontend',
      script: 'pnpm',
      args: 'start',
      cwd: '/home/vika/diary/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'https://api.vibenote.ru',
        NEXT_PUBLIC_APP_URL: 'https://vibenote.ru'
      }
    }
  ]
}
