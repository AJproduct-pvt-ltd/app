// AJ PRODUCTS — service worker
// Caches the app shell so the app opens instantly and still works
// with a poor/no connection. Bump CACHE_NAME whenever you deploy an
// update so old clients pick up the new files.
const CACHE_NAME = 'aj-products-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './favicon-16.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(APP_SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// Network-first for the HTML (so shop settings / data edits deployed via
// the same URL show up promptly), cache-first for everything else in the
// app shell (icons, manifest — these rarely change).
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return; // don't touch fonts.googleapis.com etc.

  var isHTML = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').indexOf('text/html') !== -1;

  if(isHTML){
    event.respondWith(
      fetch(event.request)
        .then(function(res){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
          return res;
        })
        .catch(function(){ return caches.match(event.request).then(function(r){ return r || caches.match('./index.html'); }); })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return res;
      });
    })
  );
});
