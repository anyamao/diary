FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build

EXPOSE 3011

CMD ["pnpm", "start", "-p", "3011", "-H", "0.0.0.0"]
