/* Service Worker — Marlú Colombia PWA */
const VERSION = 'beauten-v3.15.0';
const CORE = 'beauten-core-v3.15';
const RUNTIME = 'beauten-runtime-v3.15';

const CORE_ASSETS = [
  './',
  './index.html',
  './producto.html',
  './checkout.html',
  './resultado.html',
  './manifest.webmanifest',
  /* OJO: css y js NO se pre-guardan aquí a propósito.
     Son los archivos que cambian en cada despliegue y ya se sirven RED PRIMERO
     más abajo. Guardarlos en la instalación solo servía para tener una copia
     vieja de reserva: si la red fallaba, el navegador devolvía el CSS antiguo
     junto al HTML nuevo y la página salía sin estilos. Se siguen guardando al
     vuelo cada vez que se descargan bien, así que sin conexión sigue
     funcionando con la última versión que sí se cargó. */
  './assets/imgs/logo/logo.png',
  './assets/imgs/logo/footer-logo.png',
  './assets/imgs/icons/icon-192.png',
  './assets/imgs/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CORE && k !== RUNTIME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Las llamadas a la API de pago NUNCA se interceptan ni se cachean:
  // deben ir siempre a la red para conocer el estado REAL del pago.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) return;

  // El panel privado de pedidos tampoco se cachea nunca.
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin.html')) return;

  // Solo manejamos peticiones del propio origen (la app) y fuentes de Google Fonts.
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  if (!isSameOrigin && !isGoogleFont) return;

  // Navegaciones: red primero; si falla, la copia en caché de ESA misma página.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req).then((c) => c || caches.match('./index.html'))
      )
    );
    return;
  }

  // CSS y JS: RED PRIMERO. Son los archivos que cambian en cada despliegue y,
  // con cache-first, el navegador podía seguir sirviendo la versión vieja
  // durante días. Pasó de verdad: style.css salía de la caché antigua y la
  // barra nueva se veía sin estilos ni animación, incluso tras recarga
  // forzada. Si no hay red, cae a la copia en caché.
  if (/\.(css|js)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy));
          return res;
        }
        return caches.match(req).then((c) => c || res);
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Estrategia cache-first con relleno en runtime (imágenes y fuentes).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
