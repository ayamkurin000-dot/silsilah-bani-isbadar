/* Service worker Silsilah Bani Isbadar
   - Halaman & berkas situs sendiri -> jaringan dulu (data silsilah selalu terbaru), cadangan dari cache saat offline.
   - Pustaka D3 (d3js.org)          -> cache dulu, supaya tetap jalan tanpa internet.
   Naikkan VERSI setiap ada perubahan agar cache lama dibuang. */
var VERSI = 'bi-v1';
var INTI = ['./', 'index.html', 'manifest.webmanifest', 'logo/ikon-192.png', 'logo/ikon-512.png'];
var D3 = 'https://d3js.org/d3.v7.min.js';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) {
    return Promise.all(INTI.map(function (u) {
      return fetch(new Request(u, { cache: 'no-cache' })).then(function (res) {
        if (res && res.ok) return c.put(u, res);
      }).catch(function () {});
    }).concat([
      fetch(D3, { mode: 'no-cors' }).then(function (res) { return c.put(D3, res); }).catch(function () {})
    ]));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSI; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);

  if (r.url === D3) {                       /* D3: cache dulu */
    e.respondWith(caches.open(VERSI).then(function (c) {
      return c.match(D3).then(function (hit) {
        return hit || fetch(r).then(function (res) { c.put(D3, res.clone()); return res; });
      });
    }));
    return;
  }

  if (u.origin !== location.origin) return;  /* sumber luar lain: biarkan browser */

  e.respondWith(fetch(r).then(function (res) {   /* jaringan dulu */
    if (res && res.ok) {
      var salin = res.clone();
      caches.open(VERSI).then(function (c) { c.put(r, salin); });
    }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (hit) {
      return hit || (r.mode === 'navigate' ? caches.match('index.html') : undefined);
    });
  }));
});
