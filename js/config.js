/* ============================================================
   Marlú — configuracion de la API
   ------------------------------------------------------------
   El sitio vive en GitHub Pages (solo archivos estaticos).
   Las funciones de pago necesitan un servidor aparte: el Worker
   de Cloudflare. Aqui se le dice a la app donde esta.

   Para cambiar de servidor, edita SOLO esta linea.
   ============================================================ */
window.BEAUTEN_API = 'https://marlu-pedidos.granadoalejandro97.workers.dev';

/* Atajo: devuelve la URL completa de un endpoint */
window.beautenUrl = function (ruta) {
  var base = String(window.BEAUTEN_API || '').replace(/\/+$/, '');
  return base + ruta;
};
