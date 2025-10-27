/**
 * Analytics Component (Optional)
 *
 * Add Google Analytics or other analytics tools here.
 * Uncomment and configure when you're ready.
 */

export default function Analytics() {
  // Only load in production
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  // Uncomment when you have Google Analytics ID:
  /*
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
  */

  return null
}

/*
 * To enable:
 * 1. Get Google Analytics ID from: https://analytics.google.com
 * 2. Add to .env: NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 * 3. Uncomment the code above
 * 4. Import and add <Analytics /> to layout.tsx
 */
