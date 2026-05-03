FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm@8.10.5

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Disable workspace mode and install
RUN pnpm install --ignore-workspace

# Copy application
COPY . .

EXPOSE 3011

# Start dev server
CMD ["sh", "-c", "pnpm dev -- -H 0.0.0.0 -p 3011"]
