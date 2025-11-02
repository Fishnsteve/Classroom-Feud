const CACHE_NAME = 'classroom-feud-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/gameData.ts',
  '/components/AnswerSlot.tsx',
  '/components/FaceOffMinigame.tsx',
  '/components/GameBoard.tsx',
  '/components/icons.tsx',
  '/components/Loader.tsx',
  '/components/SetupScreen.tsx',
  '/components/StrikeDisplay.tsx',
  '/services/particleService.ts',
  '/services/soundService.ts',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the request.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response. We don't cache errors.
            // Opaque responses (from no-cors requests) don't have a visible status, but are ok to cache.
            if (!response || (response.status !== 200 && response.type !== 'opaque')) {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
