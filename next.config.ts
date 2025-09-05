import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Allow S3 or CloudFront domain via env S3_IMAGE_HOST (hostname only)
      ...(process.env.S3_IMAGE_HOST
        ? [
            {
              protocol: 'https' as const,
              hostname: process.env.S3_IMAGE_HOST!,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
