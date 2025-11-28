import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Improved experimental features for stability
  experimental: {
    // Optimize chunk loading to prevent build manifest issues
    optimizePackageImports: ['@heroicons/react', '@reown/appkit', 'framer-motion'],
  },
  
  // SECURITY FIX: Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js and some libraries
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
        ],
      },
    ];
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
