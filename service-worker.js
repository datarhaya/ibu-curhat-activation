// Service Worker for i-BU Offline PWA
const CACHE_NAME = 'ibu-curhat-v1';
const urlsToCache = [
  '/',
  '/index.html',
  
  // Videos
  'https://r2-video-proxy.data-456.workers.dev/ETI-motion-poster.mp4',
  'https://r2-video-proxy.data-456.workers.dev/closing-dian.mp4',
  'https://r2-video-proxy.data-456.workers.dev/closing-ringgo.mp4',
  
  // Audio files
  '/Assets/audio/eti-ibucurhat-audio1-ibuadauntukmu.mp3',
  '/Assets/audio/eti-ibucurhat-audio2-HaloakuiBU.mp3',
  '/Assets/audio/eti-ibucurhat-audio4-adahalyangsulitkamuceritakan.mp3',
  '/Assets/audio/eti-ibucurhat-audio6-kenalanduluyuk.mp3',
  '/Assets/audio/eti-ibucurhat-audio8-mulairekam.mp3',
  
  // Fonts
  '/Assets/fonts/ITCAvantGardeStd-Bk.woff2',
  '/Assets/fonts/ITCAvantGardeStd-Demi.otf',
  
  // Images/Icons
  '/Assets/image/IBU-Logo.png',
  '/Assets/image/ibu-icon.png',      // Add if you have category icons
  '/Assets/image/bapak-icon.png',    // Add if you have category icons
  '/Assets/image/anak-icon.png',     // Add if you have category icons
  '/Assets/image/keluarga-icon.png', // Add if you have category icons
  
  // React libraries (from CDN, optional - may not cache well)
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

// Install event - cache all resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell and assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from cache
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }
        
        // Cache miss - fetch from network
        console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fetched resource for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch((error) => {
        console.error('[ServiceWorker] Fetch failed:', error);
        // You could return a custom offline page here if needed
      })
  );
});
