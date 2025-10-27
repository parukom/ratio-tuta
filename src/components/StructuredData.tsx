/**
 * Structured Data (JSON-LD) Component
 *
 * Provides rich structured data for search engines using Schema.org vocabulary.
 * This helps Google understand your content and show rich results in search.
 *
 * https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ratio Tuta',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description: 'Modern inventory tracking and financial management system for teams. Real-time stock control, POS system, and comprehensive reporting.',
    url: baseUrl,
    author: {
      '@type': 'Person',
      name: 'Tomas Dudovicius',
      url: 'https://github.com/parukom',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1',
    },
    featureList: [
      'Real-time inventory tracking',
      'POS system',
      'Team collaboration',
      'Financial reporting',
      'Multi-location management',
      'Receipt management',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ratio Tuta',
    url: baseUrl,
    description: 'Modern inventory and financial management system',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Documentation',
        item: `${baseUrl}/docs/user`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  )
}
