
const CACHE_NAME = "qarjy-app-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

// Установка Service Worker и кеширование файлов
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

// Активация и удаление старого кеша
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

// Обработка запросов и работа без интернета
self.addEventListener("fetch", event => {
  const request = event.request;

  // Обрабатываем только GET-запросы
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Не перехватываем запросы к другим сайтам
  if (url.origin !== self.location.origin) return;

  // Для HTML используем сеть, а при отсутствии интернета — кеш
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put("./index.html", copy);
            });
          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match("./index.html")
          );
        })
    );

    return;
  }

  // Для остальных файлов сначала проверяем кеш
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request);
    })
  );
});
