var CACHE = 'michedule-v3';
var FILES = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  if (url.indexOf('supabase') !== -1) {
    e.respondWith(fetch(e.request));
    return;
  }

  if (url.indexOf('fonts.googleapis.com') !== -1 || url.indexOf('fonts.gstatic.com') !== -1
      || url.indexOf('cdn.jsdelivr.net') !== -1) {
    e.respondWith(
      caches.match(e.request).then(function(r) {
        return r || fetch(e.request).then(function(resp) {
          if (resp.status === 200) {
            var clone = resp.clone();
            caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          }
          return resp;
        });
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(function(resp) {
      if (resp.status === 200) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      }
      return resp;
    }).catch(function() {
      return caches.match(e.request).then(function(r) {
        return r || caches.match('./index.html');
      });
    })
  );
});
