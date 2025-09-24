import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow accessing the dev server from your ECS public IP
  allowedDevOrigins: [
    'http://106.15.54.73:3000',
  ],
};

export default nextConfig;
