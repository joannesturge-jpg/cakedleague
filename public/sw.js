// Minimal service worker — its only job is to satisfy "installable PWA"
// requirements. No caching: this app is dynamic and auth-gated, so every
// request should just go to the network as normal.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally no-op: falls through to normal network handling.
});
