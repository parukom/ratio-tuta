import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const currentDate = new Date()
  const locales = ['en', 'lt', 'ru']

  const routes = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/auth', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/docs', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/docs/user', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/docs/developer', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.5 },
  ]

  // Generate URLs for all locales
  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add root redirect
  sitemapEntries.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  })

  // Add localized routes
  locales.forEach(locale => {
    routes.forEach(route => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: currentDate,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      })
    })
  })

  return sitemapEntries
}
