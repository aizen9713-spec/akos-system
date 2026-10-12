const CACHE_NAME = "akos-system-v0.4.2";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js?v=0.4.2",
  "./manifest.webmanifest",
  "./icon-512-v2.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
  const url = new URL(event.request.url);

  if (
    response.ok &&
    url.origin === self.location.origin &&
    url.pathname.startsWith(
      new URL(self.registration.scope).pathname
    )
  ) {
    const responseCopy = response.clone();

    event.waitUntil(
  caches.open(CACHE_NAME).then(cache =>
    cache.put(event.request, responseCopy)
  )
);
  }

  return response;
})
      .catch(() => caches.match(event.request))
  );
});