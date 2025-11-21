import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Removed 'output: export' - Vercel's Next.js runtime handles both static pages and API routes
  // API routes are proxied to backend via vercel.json, but Next.js runtime is needed for build
  // Static pages will still be optimized by Next.js automatically
  
  // Improved experimental features for stability
  experimental: {
    // Optimize chunk loading to prevent build manifest issues
    optimizePackageImports: ['@heroicons/react', '@reown/appkit', 'framer-motion'],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sportmonks.com',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/coins/**',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: '',
        pathname: '/coins/**',
      },
      {
        protocol: 'https',
        hostname: 'static.coinpaprika.com',
        port: '',
        pathname: '/coin/**',
      },
      {
        protocol: 'https',
        hostname: 's2.coinmarketcap.com',
        port: '',
        pathname: '/static/img/coins/**',
      },
    ],
  },
};

export default nextConfig;
