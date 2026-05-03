#!/bin/bash

# Create environment files
cat >.env <<EOF
# Database
DB_USER=diary_user
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=diary_db

# Security
SECRET_KEY=$(openssl rand -base64 32)

# Environment
ENVIRONMENT=development
EOF

# Copy to backend
cp .env backend/.env

# Create frontend env
cat >frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:8011
NEXT_PUBLIC_APP_URL=http://localhost:3011
EOF

echo "✅ Environment files created"
echo "⚠️  Remember to update production credentials before deploying!"
