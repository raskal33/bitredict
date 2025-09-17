import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Improved experimental features for stability
  experimental: {
    // Optimize chunk loading to prevent build manifest issues
    optimizePackageImports: ['@heroicons/react', '@reown/appkit', 'framer-motion'],
    // Turbopack optimizations
    turbo: {
      rules: {
        // Optimize TypeScript compilation
        '*.{ts,tsx}': {
          loaders: ['swc-loader'],
          as: '*.js',
        },
      },
    },
  },
  
  // Development server optimizations
  devIndicators: {
    buildActivity: false, // Reduce build activity indicators
  },
  
  // Webpack optimizations for development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize development builds to reduce manifest conflicts
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    return config;
  },
  
  images: {
    remotePatterns: [
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
