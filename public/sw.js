// Fricette hors ligne : les pages déjà vues, le carnet et les photos restent disponibles sans réseau.
const V = "frc-v2";
const PRECACHE = ["/", "/offline", "/carnet-lite.json", "/icons/icon-192.png", "/courses"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const cacheFirst = async (req) => {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(V)).put(req, res.clone());
  return res;
};

const networkFirst = async (req, fallback) => {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(V)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || (fallback && (await caches.match(fallback))) || Response.error();
  }
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/recette/")) { e.respondWith(networkFirst(req)); return; } // recettes ouvertes : lisibles hors ligne
  if (url.pathname.startsWith("/api/") || url.pathname === "/stats") return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/photos/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(cacheFirst(req));
  } else if (url.pathname === "/carnet-lite.json") {
    e.respondWith(networkFirst(req));
  } else if (req.mode === "navigate") {
    e.respondWith(networkFirst(req, "/offline"));
  }
});
