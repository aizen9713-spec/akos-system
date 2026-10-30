const CACHE_NAME = "akos-system-release-20261030-1";

const ASSETS = [
  "./js/core/cloud-core.js",
  "./",
  "./index.html",
  "./styles.css",
  "./css/components/training.css",
  "./js/features/training-data.js",
  "./js/features/training.js",
  "./app.js?v=0.4.2",
  "./manifest.webmanifest",
  "./icon-512-v2.png",
  "./system-bg.png",
  "./assets/backgrounds/crimson-eclipse.webp",
  "./assets/backgrounds/golden-sanctum.webp",
  "./assets/backgrounds/obsidian-gold.webp",
  "./assets/backgrounds/misty-mountains.webp",
  "./assets/backgrounds/crimson-crown.webp",
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
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  const assets = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
  if (!assets.has(url.href) && event.request.mode !== "navigate") return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    if (event.request.mode === "navigate") {
      const shell = await cache.match(new URL("./index.html", self.registration.scope).href);
      if (shell) return shell;
    }
    return fetch(event.request);
  }));
});
