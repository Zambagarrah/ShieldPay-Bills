// ShieldPay Service Worker — offline support
const CACHE = "shieldpay-v5";
const OFFLINE_URLS = ["/","/login","/dashboard","/bills","/suppliers","/payments"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method!=="GET") return;
  if (e.request.url.includes("supabase.co")) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match("/")))
  );
});
