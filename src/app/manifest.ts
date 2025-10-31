import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ratio Tuta - Inventory & Financial Management',
    short_name: 'Ratio Tuta',
    description: 'Modern inventory tracking and financial management system for teams. Real-time stock control, POS system, team collaboration, and comprehensive reporting.',
    start_url: '/',
    scope: '/',
    display: 'fullscreen',
    background_color: '#111827',
    theme_color: '#111827',
    orientation: 'portrait',
    icons: [
      { src: '/images/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { src: '/images/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      {
        src: '/images/icons/icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/images/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
