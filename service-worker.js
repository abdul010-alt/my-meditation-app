// Service Worker for Mindful Moments Meditation App
// Version 1.0.0

const CACHE_NAME = 'mindful-moments-v1.0.0';
const STATIC_CACHE_NAME = 'mindful-moments-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'mindful-moments-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  
  // Icons
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/maskable-icon-192x192.png',
  '/assets/icons/maskable-icon-512x512.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/favicon-16x16.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        console.log('Service Worker: Fetching from network', request.url);
        return fetch(request)
          .then((networkResponse) => {
            // Don\'t cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response for caching
            const responseToCache = networkResponse.clone();
            
            // Cache dynamic content
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Network fetch failed', error);
            
            // Return offline fallback for navigation requests
            if (request.destination === 'docum              return caches.match(
                '/index.html'
              );   
            // Return a basic offline response for other requests
            return new Response('Offline - Content not available', {
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

// Background sync for meditation session data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'meditation-session-sync') {
    event.waitUntil(syncMeditationData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your daily meditation!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'start-meditation',
        title: 'Start Meditation',
        icon: '/assets/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Mindful Moments', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'start-meditation') {
    // Open the app and start meditation
    event.wa      clients.openWindow(
        '/index.html?autostart=true'
      );  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil      clients.openWindow(
        '/'
      );

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_MEDITATION_DATA') {
    cacheMeditationData(event.data.payload);
  }
});

// Helper function to sync meditation data
async function syncMeditationData() {
  try {
    // Get stored meditation sessions from IndexedDB or localStorage
    const sessions = await getMeditationSessions();
    
    if (sessions && sessions.length > 0) {
      // Sync with server when online
      const response = await fetch('/api/sync-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessions })
      });
      
      if (response.ok) {
        // Clear synced sessions
        await clearSyncedSessions();
        console.log('Service Worker: Meditation data synced successfully');
      }
    }
  } catch (error) {
    console.error('Service Worker: Error syncing meditation data', error);
  }
}

// Helper function to cache meditation data
async function cacheMeditationData(data) {
  try {
    const sessions = await getMeditationSessions() || [];
    sessions.push({
      ...data,
      timestamp: Date.now(),
      synced: false
    });
    
    localStorage.setItem('meditationSessions', JSON.stringify(sessions));
    console.log('Service Worker: Meditation data cached');
    
    // Register for background sync
    await self.registration.sync.register('meditation-session-sync');
  } catch (error) {
    console.error('Service Worker: Error caching meditation data', error);
  }
}

// Helper function to get meditation sessions
async function getMeditationSessions() {
  try {
    const sessions = localStorage.getItem('meditationSessions');
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Service Worker: Error getting meditation sessions', error);
    return [];
  }
}

// Helper function to clear synced sessions
async function clearSyncedSessions() {
  try {
    const sessions = await getMeditationSessions();
    const unsyncedSessions = sessions.filter(session => !session.synced);
    localStorage.setItem('meditationSessions', JSON.stringify(unsyncedSessions));
  } catch (error) {
    console.error('Service Worker: Error clearing synced sessions', error);
  }
}

// Periodic background sync for meditation reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'meditation-reminder') {
    event.waitUntil(sendMeditationReminder());
  }
});

// Helper function to send meditation reminder
async function sendMeditationReminder() {
  try {
    const lastSession = await getLastMeditationSession();
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (!lastSession || (now - lastSession.timestamp) > oneDayInMs) {
      // Send reminder notification
      await self.registration.showNotification('Daily Meditation Reminder', {
        body: 'Take a moment to practice mindfulness today.',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        tag: 'meditation-reminder',
        requireInteraction: false,
        silent: false
      });
    }
  } catch (error) {
    console.error('Service Worker: Error sending meditation reminder', error);
  }
}

// Helper function to get last meditation session
async function getLastMeditationSession() {
  try {
    const sessions = await getMeditationSessions();
    return sessions.length > 0 ? sessions[sessions.length - 1] : null;
  } catch (error) {
    console.error('Service Worker: Error getting last meditation session', error);
    return null;
  }
}

console.log('Service Worker: Script loaded successfully');


