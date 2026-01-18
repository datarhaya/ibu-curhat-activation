// Service Worker for i-BU Offline PWA
const CACHE_NAME = 'ibu-curhat-v2'; // Increment version to force update
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
  '/Assets/audio/eti-ibucurhat-audio3-selanjutnya.mp3',  
  '/Assets/audio/eti-ibucurhat-audio4-adahalyangsulitkamuceritakan.mp3',
  '/Assets/audio/eti-ibucurhat-audio6-kenalanduluyuk.mp3',
  '/Assets/audio/eti-ibucurhat-audio7-sekarangceritakansemua.mp3',
  '/Assets/audio/eti-ibucurhat-audio8-mulairekam.mp3',
  
  // Fonts
  '/Assets/fonts/ITCAvantGardeStd-Bk.woff2',
  '/Assets/fonts/ITCAvantGardeStd-Demi.otf',
  
  // Images
  '/Assets/image/IBU-Logo.png',
  '/Assets/image/AI-IBU-loading.png',  // Added - referenced in code
  '/Assets/image/background.jpg',      // Added - referenced in code
  '/Assets/image/ibu-icon.png',        // Only add if these exist
  '/Assets/image/bapak-icon.png',      // Only add if these exist
  '/Assets/image/anak-icon.png',       // Only add if these exist
  '/Assets/image/keluarga-icon.png',   // Only add if these exist
  
  // React libraries (from CDN, optional - may not cache well)
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

// Install event - cache resources with better error handling
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell and assets');
        
        // Cache files individually to identify failures
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url)
            .then(() => {
              console.log('[ServiceWorker] Cached:', url);
            })
            .catch(error => {
              console.warn('[ServiceWorker] Failed to cache:', url, error);
              // Don't fail the whole installation if one file fails
            });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
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
        // Cache hit - return response
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }
        
        // Cache miss - fetch from network
        console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Don't cache external scripts from CDN with 'cors' mode
            if (response.type === 'opaque' || response.type === 'cors') {
              return response;
            }
            
            // Clone and cache the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch((error) => {
            console.error('[ServiceWorker] Fetch failed:', event.request.url, error);
            // Return a basic offline message for failed requests
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});