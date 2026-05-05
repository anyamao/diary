FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@8.10.5

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile for reproducibility
RUN pnpm install --frozen-lockfile

# Copy application
COPY . .

# Build the application for production
RUN pnpm run build

EXPOSE 3011

# Start in production mode with Next.js 16
CMD ["pnpm", "start"]
