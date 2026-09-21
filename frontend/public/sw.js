const CACHE_NAME = "cla-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    // Never cache API
    if (url.pathname.startsWith("/api/")) return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((r) => {
                    const copy = r.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
                    return r;
                })
                .catch(() => caches.match("/index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) =>
            cached ||
            fetch(event.request).then((r) => {
                if (r.ok && event.request.method === "GET") {
                    const copy = r.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
                }
                return r;
            }).catch(() => cached)
        )
    );
});
