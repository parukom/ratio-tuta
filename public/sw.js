// Minimal service worker for PWA installability
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// A no-op fetch handler ensures the SW controls pages and meets install criteria
self.addEventListener('fetch', () => {
    // passthrough
});
