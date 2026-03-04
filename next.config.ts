import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    // Optional deps from MetaMask SDK / Reown connectors (browser build doesn't need them)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'porto': false,
      'porto/internal': false,
    }
    return config
  }
};

export default nextConfig;
