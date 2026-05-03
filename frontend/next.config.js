/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['localhost', 'vibenote.ru'],
  },
  // Remove output: 'standalone' completely
  // No standalone output
}

module.exports = nextConfig
