const CACHE = 'mon-repere-emotions-v0.9.21';
const CORE = [
  './', './index.html', './app.js', './style.css', './manifest.json',
  './scientific_knowledge_base/data/emotions.json',
  './scientific_knowledge_base/data/emotion_guidance.json',
  './scientific_knowledge_base/data/exercises.json',
  './scientific_knowledge_base/data/emotion_exercise_map.json',
  './scientific_knowledge_base/data/recommendation_rules.json',
  './scientific_knowledge_base/data/safety_protocol.json',
  './scientific_knowledge_base/data/studies.json',
  './scientific_knowledge_base/data/evidence_grading.json',
  './scientific_knowledge_base/source_config.json',
  './assets/logo-emotions.svg', './assets/icon-calm.png', './assets/icon-irritated.png',
  './assets/icon-sad.png', './assets/icon-stressed.png', './assets/icon-angry.png'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});
