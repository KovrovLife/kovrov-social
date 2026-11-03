// Это минимальный Service Worker для PWA
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Пока мы не кешируем всё подряд, а просто пропускаем запросы к серверу
  event.respondWith(fetch(event.request));
});