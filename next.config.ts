import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval/inline for dev
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: https: blob: ${s3Host ? `https://${s3Host}` : ''}`,
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

// Enable next-intl plugin so it can load next-intl.config.ts at runtime
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
