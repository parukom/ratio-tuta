/**
 * Structured Data (JSON-LD) Component
 *
 * Provides rich structured data for search engines using Schema.org vocabulary.
 * This helps Google understand your content and show rich results in search.
 *
 * https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

type StructuredDataProps = {
  locale: string;
  seoData: {
    title: string;
    description: string;
    structuredData: {
      softwareName: string;
      softwareDescription: string;
      applicationCategory: string;
      operatingSystem: string;
      features: Record<string, string>;
    };
  };
};

export default function StructuredData({ locale, seoData }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Convert features object to array
  const featuresArray = Object.values(seoData.structuredData.features);

  // Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoData.structuredData.softwareName,
    url: baseUrl,
    logo: `${baseUrl}/images/icons/icon-512.png`,
    description: seoData.structuredData.softwareDescription,
    sameAs: [
      'https://github.com/parukom/ratio-tuta',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'tomasdudovicius@gmail.com',
      availableLanguage: ['English', 'Lithuanian', 'Russian']
    },
    founder: {
      '@type': 'Person',
      name: 'Tomas Dudovicius',
      url: 'https://github.com/parukom',
    }
  }

  // Software Application Schema
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: seoData.structuredData.softwareName,
    applicationCategory: seoData.structuredData.applicationCategory,
    operatingSystem: seoData.structuredData.operatingSystem,
    description: seoData.structuredData.softwareDescription,
    url: baseUrl,
    softwareVersion: '1.0',
    author: {
      '@type': 'Person',
      name: 'Tomas Dudovicius',
      url: 'https://github.com/parukom',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '20',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      offerCount: '3'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: featuresArray,
    applicationSubCategory: 'Inventory Management Software',
    releaseNotes: 'Feature-rich inventory and financial management platform'
  }

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoData.structuredData.softwareName,
    url: baseUrl,
    description: seoData.description,
    inLanguage: ['en', 'lt', 'ru'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/docs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Documentation',
        item: `${baseUrl}/${locale}/docs`,
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
          __html: JSON.stringify(softwareSchema),
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
