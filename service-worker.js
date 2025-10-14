// サービスワーカーのバージョン (キャッシュを更新したい場合にこの番号を変更します)
const CACHE_NAME = 'roulette-cache-v2'; // キャッシュ永続化修正のためバージョンをv2に
// キャッシュするファイル
const urlsToCache = [
    './', 
    './index.html',
    './manifest.json', // manifestファイルもキャッシュ対象
    './service-worker.js' // 自身のファイルもキャッシュ対象
];

// インストールイベント: キャッシュの初期化
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] All files cached successfully.');
        return cache.addAll(urlsToCache).catch(error => {
            console.error('[Service Worker] Failed to cache files:', error);
        });
      })
  );
});

// fetchイベント: キャッシュからリソースを返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークから取得
        return fetch(event.request);
      })
  );
});

// アクティベートイベント: 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            // ホワイトリストにない古いキャッシュを削除
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Activation complete.');
        // Service Workerがすぐに制御権を持つようにする
        return self.clients.claim();
    })
  );
});

