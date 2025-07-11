/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@heroicons/react',
      'framer-motion',
      'react-icons',
      '@solana/wallet-adapter-react-ui',
      'chart.js',
      'swiper'
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      minimize: true,
    };
    
    return config;
  },
}

module.exports = nextConfig 