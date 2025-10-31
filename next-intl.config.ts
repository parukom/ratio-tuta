import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'lt', 'ru'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/docs': '/docs',
    '/pricing': '/pricing',
    '/auth': '/auth',
    '/terms': '/terms',
    '/privacy': '/privacy',
  },
});

export default routing;
