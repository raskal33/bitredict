import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { dev, isServer }) => {
    // Add BigInt serialization support
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        util: false,
      };
    }

    return config;
  },
  // Transpile packages that use BigInt
  transpilePackages: ['viem', 'wagmi'],
};

export default nextConfig;
