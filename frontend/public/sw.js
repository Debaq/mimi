// MIMI Service Worker
// Version del cache - incrementar para invalidar cache anterior
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `mimi-static-${CACHE_VERSION}`;

// Assets estaticos que se cachean al instalar
const STATIC_ASSETS = [
  './',
  './manifest.json',
];

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
              // Eliminar TODOS los caches anteriores
              return name.startsWith('mimi-') && name !== STATIC_CACHE;
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

// --- Listener de Fetch ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return;

  // SOLO interceptar GET - dejar pasar POST/PUT/DELETE sin tocar
  if (request.method !== 'GET') return;

  // Ignorar requests a otros origenes
  if (url.origin !== self.location.origin) return;

  // API calls -> solo red, sin cache
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Navegacion (paginas HTML) -> network-first con fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => offlineFallback())
    );
    return;
  }

  // Assets estaticos (.js, .css, imagenes) -> network-first con cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Pagina offline de fallback
function offlineFallback() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
