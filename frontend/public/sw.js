// MIMI Service Worker
// Version del cache - incrementar para invalidar cache anterior
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `mimi-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mimi-dynamic-${CACHE_VERSION}`;

// Assets estaticos que se cachean al instalar
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Patrones de API (network-first)
const API_PATTERN = /\/api\//;

// Patrones de assets estaticos (cache-first)
const STATIC_PATTERN = /\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/;

// --- Instalacion ---
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando service worker', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando assets estaticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// --- Activacion ---
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando service worker', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Eliminar caches de versiones anteriores
              return name.startsWith('mimi-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Eliminando cache antiguo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// --- Estrategias de Fetch ---

// Network-first: intenta red primero, cache como fallback
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Solo cachear respuestas exitosas
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Si no hay cache y es una navegacion, mostrar fallback offline
    if (request.mode === 'navigate') {
      return offlineFallback();
    }
    throw error;
  }
}

// Cache-first: intenta cache primero, red como fallback
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Para imagenes, devolver un placeholder transparente
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Pagina offline de fallback
function offlineFallback() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0071E3">
  <title>MIMI - Sin conexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FBFBFD;
      color: #1d1d1f;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .container { max-width: 400px; }
    .icon {
      width: 80px;
      height: 80px;
      background: #0071E3;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: white;
      font-size: 28px;
      font-weight: bold;
    }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #6e6e73; line-height: 1.5; margin-bottom: 24px; }
    button {
      padding: 12px 24px;
      background: #0071E3;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 500;
    }
    button:hover { background: #0060c0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">MI</div>
    <h1>Sin conexion</h1>
    <p>No se pudo conectar a MIMI. Verifica tu conexion a internet e intenta nuevamente.</p>
    <button onclick="window.location.reload()">Reintentar</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// --- Listener de Fetch ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return;

  // Ignorar requests a otros origenes (excepto CDN de fuentes comunes)
  const allowedOrigins = [self.location.origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
  if (!allowedOrigins.some((origin) => url.href.startsWith(origin))) return;

  // API calls -> Network-first
  if (API_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navegacion (paginas HTML) -> Network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets estaticos -> Cache-first
  if (STATIC_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Todo lo demas -> Network-first
  event.respondWith(networkFirst(request));
});
