const CACHE_NAME = "akos-system-theme-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js?v=0.4.2",
  "./manifest.webmanifest",
  "./icon-512-v2.png",
  "./system-bg.png",
  "./css/components/appearance.css",
  "./css/components/modules.css",
  "./css/components/navigation.css",
  "./css/components/update-panel.css",
  "./css/core/base.css",
  "./css/core/layout.css",
  "./css/core/variables.css",
  "./js/config/stats.js",
  "./js/core/backup.js",
  "./js/core/daily.js",
  "./js/core/dates.js",
  "./js/core/progression.js",
  "./js/core/state.js",
  "./js/data/daily-quests.js",
  "./js/data/quests.js",
  "./js/data/transmissions.js",
  "./js/features/achievements.js",
  "./js/features/appearance.js",
  "./js/features/daily-quests.js",
  "./js/features/quests.js",
  "./js/features/settings.js",
  "./js/features/transmissions.js",
  "./js/ui/achievements.js",
  "./js/ui/dashboard.js",
  "./js/ui/log.js",
  "./js/ui/navigation.js",
  "./js/ui/player.js",
  "./js/ui/quests.js",
  "./js/ui/render.js",
  "./js/ui/settings.js",
  "./js/ui/skills.js",
  "./js/ui/stats.js",
  "./js/ui/system.js"
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
            .filter(key => key.startsWith("akos-system-") && key !== CACHE_NAME)
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