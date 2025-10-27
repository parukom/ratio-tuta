import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/auth',
          '/docs/*',
        ],
        disallow: [
          '/dashboard/*',
          '/cash-register/*',
          '/api/*',
          '/admin/*',
          '/*.json$',
          '/*?*', // Block URLs with query parameters (dynamic pages)
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/auth',
          '/docs/*',
        ],
        disallow: [
          '/dashboard/*',
          '/cash-register/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
