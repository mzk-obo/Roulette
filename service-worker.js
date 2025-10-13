// Service Workerのバージョン (更新時にはこの番号を変更します)
const CACHE_NAME = 'roulette-cache-v1';
// キャッシュするファイル
const urlsToCache = [
    './', 
    './index.html',
    './manifest.json',
    // GitHub PagesではTailwind CSSなどの外部CDNはキャッシュされません
];

// インストールイベント: キャッシュの初期化
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// fetchイベント: キャッシュからリソースを返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// アクティベートイベント: 古いキャッシュの削除
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

