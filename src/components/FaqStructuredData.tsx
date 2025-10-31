/**
 * FAQ Structured Data Component
 *
 * Provides FAQPage schema markup for search engines to display FAQ rich results.
 * https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

type FAQItem = {
  question: string
  answer: string
}

type Props = {
  faqs: FAQItem[]
}

export default function FaqStructuredData({ faqs }: Props) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema),
      }}
    />
  )
}
