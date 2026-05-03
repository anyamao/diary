/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode for development to avoid double mounting
  reactStrictMode: false,
  // Enable SWC minification
  swcMinify: true,
  // Configure for Docker
  output: "standalone",
  // Ensure hostname is properly configured
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Configure webpack for better Docker compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
