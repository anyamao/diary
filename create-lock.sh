#!/bin/bash
cd ~/Projects/Websites/diary/frontend

# Clean everything
echo "Cleaning old files..."
rm -rf node_modules pnpm-lock.yaml package-lock.json .next

# Install pnpm if not installed
if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm@8.10.5
fi

# Install dependencies and generate lock file
echo "Installing dependencies..."
pnpm install

echo "✅ Lock file created at: frontend/pnpm-lock.yaml"
