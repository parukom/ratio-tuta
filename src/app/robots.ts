import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/en/',
          '/lt/',
          '/ru/',
          '/en/*',
          '/lt/*',
          '/ru/*',
        ],
        disallow: [
          '/dashboard/*',
          '/cash-register/*',
          '/api/*',
          '/admin/*',
          '/*.json$',
          '/*?placeId=*', // Block URLs with placeId query parameters
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/en/',
          '/lt/',
          '/ru/',
          '/en/auth',
          '/lt/auth',
          '/ru/auth',
          '/en/docs/*',
          '/lt/docs/*',
          '/ru/docs/*',
          '/en/pricing',
          '/lt/pricing',
          '/ru/pricing',
          '/en/terms',
          '/lt/terms',
          '/ru/terms',
          '/en/privacy',
          '/lt/privacy',
          '/ru/privacy',
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
