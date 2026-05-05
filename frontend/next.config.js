/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 19 features
  reactStrictMode: true,
  
  // Turbopack configuration (moved from experimental in Next.js 16)
  turbopack: {
    // Configure Turbopack for faster builds
  },
  
  // Images configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vibenote.ru',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.vibenote.ru',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // React Compiler is now at top level in Next.js 16
  reactCompiler: false, // Set to true to enable React Compiler (optional)
  
  // Valid experimental features for Next.js 16
  experimental: {
    ppr: false, // Partial Prerendering
    optimizeServerReact: true,
  },
  
  // Output configuration
  output: 'standalone',
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
