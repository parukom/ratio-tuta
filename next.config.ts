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
    const isDev = process.env.NODE_ENV === 'development';

    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Strict Transport Security (HSTS)
          // Force HTTPS for 2 years, including subdomains
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Prevent clickjacking by only allowing same-origin framing
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Legacy XSS Protection (mostly superseded by CSP, but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy - disable unused browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          // Content Security Policy (CSP)
          // This is the most important security header!
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: only allow resources from same origin
              "default-src 'self'",
              // Scripts: self + required Next.js exceptions
              // Note: 'unsafe-eval' and 'unsafe-inline' are needed for Next.js dev mode and some runtime features
              // In strict production mode, consider using nonces or hashes
              isDev
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Styles: self + inline styles (required by many React components)
              "style-src 'self' 'unsafe-inline'",
              // Images: self, data URIs, HTTPS images, and S3 bucket
              `img-src 'self' data: https: blob: ${s3Host ? `https://${s3Host}` : ''}`,
              // Fonts: self + data URIs (for embedded fonts)
              "font-src 'self' data:",
              // API connections: only to same origin
              "connect-src 'self' https://api.pwnedpasswords.com https://api.resend.com",
              // Frames: only same origin
              "frame-ancestors 'self'",
              // Base tag: only same origin
              "base-uri 'self'",
              // Forms: only submit to same origin
              "form-action 'self'",
              // Upgrade insecure requests to HTTPS
              "upgrade-insecure-requests",
              // Block all mixed content
              "block-all-mixed-content",
            ]
              .filter(Boolean)
              .join('; '),
          },
          // Cross-Origin policies
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

// Enable next-intl plugin so it can load next-intl.config.ts at runtime
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
