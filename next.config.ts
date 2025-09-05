import type { NextConfig } from 'next';

// Derive allowed image host for S3/CloudFront from env.
let s3Host = process.env.S3_IMAGE_HOST;
if (!s3Host && process.env.S3_PUBLIC_BASE_URL) {
  try {
    const u = new URL(process.env.S3_PUBLIC_BASE_URL);
    s3Host = u.hostname || undefined;
  } catch {
    // ignore parse error
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Allow S3/CloudFront image host via env
      ...(s3Host
        ? [
            {
              protocol: 'https' as const,
              hostname: s3Host,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
