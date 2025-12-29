import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment optimization
  reactStrictMode: true,
  poweredByHeader: false,

  // Image optimization for Vercel
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
