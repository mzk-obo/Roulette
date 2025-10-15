// Service Workerのバージョン。キャッシュを更新したい場合にこの値を変更します
const CACHE_NAME = 'roulette-cache-v2'; 
// キャッシュする主要ファイル
const urlsToCache = [
    './', 
    './index.html',
    './manifest.json',
    // アイコン画像もキャッシュ対象に含めます (ルートに存在することを前提)
    './icon-192.png',
    './icon-512.png'
];

// インストールイベント: 初期キャッシュの作成
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and caching assets.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // 全てのファイルをキャッシュに追加
        return cache.addAll(urlsToCache).catch(error => {
            console.error('Service Worker: Failed to cache some assets.', error);
        });
      })
  );
});

// fetchイベント: キャッシュ優先のストラテジー
self.addEventListener('fetch', (event) => {
  // FirebaseやCDNからのリクエストはキャッシュしない
  if (event.request.url.startsWith('https://www.gstatic.com') || 
      event.request.url.includes('cdn.tailwindcss.com') ||
      event.request.url.includes('firebaseapp.com')) {
    return;
  }
  
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
  console.log('Service Worker: Activating and cleaning old caches.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // ホワイトリストにない古いキャッシュを削除
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 新しい Service Workerがすぐに制御できるようにします
  event.waitUntil(self.clients.claim());
});
