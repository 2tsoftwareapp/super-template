// Self-unregistering service worker.
// Cleans up any previously registered SW and its caches.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  // Delete all caches owned by previous service workers.
  caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));

  // Unregister this service worker after clearing caches.
  self.registration.unregister().then(() => {
    // Reload all controlled clients so they load fresh chunks.
    self.clients
      .matchAll({ type: "window" })
      .then((clients) => clients.forEach((c) => c.navigate(c.url)));
  });
});
