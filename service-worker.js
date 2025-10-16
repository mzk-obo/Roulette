const CACHE_NAME = 'roulette-app-cache-v1.0.2';

// キャッシュ対象のファイルリスト (PWAアセットと外部CDNライブラリ)
const ASSETS_TO_CACHE = [
    // アプリのコアアセット (GitHub Pages対応の相対パス)
    '/Roulette/',
    '/Roulette/index.html',
    '/Roulette/manifest.json',
    '/Roulette/icon-192.png',
    '/Roulette/icon-512.png',
    
    // 外部CDNアセット (高速化のため明示的にキャッシュ)
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    
    // Firebase SDKs
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// インストールイベント: キャッシュを開き、アセットをプリキャッシュ
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching App Shell');
                // ブラウザの仕様により、クロスオリジンリソースのキャッシュは失敗する可能性があるため、
                // catchでエラーを握りつぶしてインストールを続行します。
                return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                    console.warn('Service Worker: Failed to cache some external assets (this is often normal).', err);
                    return Promise.resolve();
                });
            })
            .then(() => self.skipWaiting())
    );
});

// アクティベートイベント: 古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// フェッチイベント: キャッシュ・ファースト戦略 (ネットワークフォールバック付き)
self.addEventListener('fetch', (event) => {
    // Firebase Firestoreのネットワークアクセスはキャッシュしない (リアルタイム性を確保するため)
    if (event.request.url.includes('firestore.googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // キャッシュにヒットしたらそれを返す
            if (response) {
                return response;
            }

            // キャッシュミスの場合、ネットワークリクエストを行う
            const fetchRequest = event.request.clone();
            return fetch(fetchRequest).then((networkResponse) => {
                // 有効なレスポンスのみをキャッシュに追加
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'opaque') {
                    return networkResponse;
                }

                // レスポンスをクローンして、キャッシュ用とブラウザ用に分ける
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // ネットワークエラーの場合、カスタムのフォールバック処理が必要ならここに記述
                // 今回はシンプルに、ネットワークエラーを返す
            });
        })
    );
});

