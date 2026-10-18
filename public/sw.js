// Service Worker for Arena Khel Android Mobile Application & Notifications
const CACHE_NAME = 'arena-khel-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/arena_khel_logo.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  event.waitUntil(self.clients.claim());
});

// Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Listen for messages from web application to display mobile status bar notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, data, tag } = event.data;
    
    const options = {
      body: body || 'You have a new update from Arena Khel',
      icon: icon || '/arena_khel_logo.png',
      badge: badge || '/icon.svg',
      vibrate: [200, 100, 200, 100, 200],
      tag: tag || 'arena-khel-' + Date.now(),
      renotify: true,
      requireInteraction: false,
      data: data || {},
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    self.registration.showNotification(title || 'Arena Khel Alert', options);
  }
});

// Handle push events (for background push notifications)
self.addEventListener('push', (event) => {
  let notifData = {
    title: 'Arena Khel Notification',
    body: 'New match update available',
    icon: '/arena_khel_logo.png',
    badge: '/icon.svg',
    data: {}
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notifData = { ...notifData, ...parsed };
    } catch (e) {
      notifData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notifData.title, {
      body: notifData.body,
      icon: notifData.icon || '/arena_khel_logo.png',
      badge: notifData.badge || '/icon.svg',
      vibrate: [200, 100, 200],
      tag: notifData.tag || 'arena-khel-push',
      renotify: true,
      data: notifData.data || {}
    })
  );
});

// When user taps the notification in mobile notification bar
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (event.notification.data && event.notification.data.actionPage) {
            client.postMessage({
              type: 'NAVIGATE_FROM_NOTIFICATION',
              actionPage: event.notification.data.actionPage,
              targetMatchId: event.notification.data.targetMatchId
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
