/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Fix for MetaMask SDK warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Ignore react-native-async-storage warning
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },

  // Suppress specific warnings
  typescript: {
    // Don't fail build on type errors in node_modules
    ignoreBuildErrors: false,
  },

  eslint: {
    // Don't fail build on lint errors
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
