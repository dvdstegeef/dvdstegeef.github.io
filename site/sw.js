const CACHE_NAME = "dvdstegeef-pages-v2";
const CORE_ASSETS = [
  "./", "./index.html", "./dvds.html", "./dvd.html", "./reservation.html",
  "./account.html", "./how-it-works.html", "./about.html", "./faq.html",
  "./contact.html", "./terms.html", "./privacy.html", "./offline.html",
  "./css/site.css", "./css/creative-site.css", "./js/runtime-config.js", "./js/api-client.js",
  "./js/data.js", "./js/app.js", "./js/home.js", "./js/catalog.js",
  "./js/detail.js", "./js/reservation.js", "./js/account.js",
  "./js/contact.js", "./js/forms.js", "./js/experience.js", "./assets/poster-placeholder.svg",
  "./assets/brand/logo-elements-transparent.png", "./site.webmanifest"
];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(async () => (await caches.match(event.request)) || (await caches.match("./offline.html"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if (response && response.status === 200) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); } return response; })));
});
