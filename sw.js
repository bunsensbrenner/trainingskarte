// Offline-Teil: speichert die App-Dateien auf dem Handy.
// Bei jeder neuen Fassung die Nummer erhöhen, sonst bekommen Handys die Änderung nicht.
const VERSION = "trainingskarte-1";
const FILES = ["./", "index.html", "stil.css", "uebungen.js", "app.js", "manifest.webmanifest",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => e.waitUntil(
  caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" }))))));

self.addEventListener("activate", e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("trainingskarte-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

self.addEventListener("message", e => { if (e.data === "skip") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || !r.url.startsWith(self.registration.scope)) return;
  e.respondWith(caches.open(VERSION)
    .then(c => c.match(r.mode === "navigate" ? "index.html" : r, { ignoreSearch: true }))
    .then(hit => hit || fetch(r)));
});
