/* ============================================================
   BeauTen Colombia — Página de detalle de producto (PDP)
   Lee el producto desde window.BEAUTEN_PRODUCTOS usando ?id=
   Regla: solo se muestran datos reales que ya existen en el
   catálogo. No se inventa ninguna especificación ni precio.
   ============================================================ */
(function () {
  'use strict';

  const PRODUCTOS = window.BEAUTEN_PRODUCTOS || [];
  const WA = '573181738642';

  const $ = (id) => document.getElementById(id);
  const cop = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
  const esc = (s) => String(s == null ? '' : s);

  /* ---------- Datos del producto ---------- */
  const idBuscado = new URLSearchParams(window.location.search).get('id');
  const producto = PRODUCTOS.find((p) => String(p.id) === String(idBuscado));

  function mostrarError() {
    if ($('pdpCargando')) $('pdpCargando').hidden = true;
    if ($('pdpError')) $('pdpError').hidden = false;
    document.title = 'Producto no encontrado — BeauTen Colombia';
  }

  if (!producto) {
    mostrarError();
    return;
  }

  const p = producto;

  /* ---------- Cálculos derivados de datos reales ---------- */
  const precio = Number(p.precio) || 0;
  const antes = Number(p.precioAntes) || 0;
  const tieneDescuento = antes > precio && precio > 0;
  const porcentaje = tieneDescuento ? Math.round((1 - precio / antes) * 100) : 0;
  const estrellas = '★'.repeat(Math.min(5, Math.round(Number(p.rating) || 0)));
  const tieneResenas = Number(p.reviews) > 0;

  /* ---------- Cabecera y metadatos ---------- */
  document.title = p.nombre + ' — BeauTen Colombia';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute(
      'content',
      esc(p.descripcion).slice(0, 150) + ' Pago con PSE y tarjetas y envío a toda Colombia.'
    );
  }

  const migaCat = $('pdpMigaCategoria');
  if (migaCat && p.nicho) migaCat.textContent = p.nicho;
  if ($('pdpMigaProducto')) $('pdpMigaProducto').textContent = p.nombre;

  /* ---------- Galería ---------- */
  const img = $('pdpImagen');
  if (img) {
    img.src = p.imagen;
    img.alt = p.nombre;
  }

  // Miniaturas: solo si el producto tiene varias fotos cargadas (p.imagenes).
  // Hoy casi todos tienen una sola, así que la galería no se pinta.
  const minis = $('pdpMinis');
  const fotos = Array.isArray(p.imagenes) ? p.imagenes.filter(Boolean) : [];
  if (minis && fotos.length > 1) {
    minis.innerHTML = fotos
      .map(
        (f, i) =>
          '<button type="button" class="pdp-mini' + (i === 0 ? ' activa' : '') +
          '" data-foto="' + esc(f) + '" aria-label="Ver foto ' + (i + 1) + '">' +
          '<img src="' + esc(f) + '" alt="" loading="lazy"></button>'
      )
      .join('');
    minis.hidden = false;
    minis.addEventListener('click', (e) => {
      const b = e.target.closest('[data-foto]');
      if (!b || !img) return;
      img.src = b.dataset.foto;
      minis.querySelectorAll('.pdp-mini').forEach((m) => m.classList.remove('activa'));
      b.classList.add('activa');
    });
  }

  if ($('pdpTag')) {
    if (p.tag) {
      $('pdpTag').textContent = p.tag;
      $('pdpTag').hidden = false;
    }
  }

  /* ---------- Columna de información ---------- */
  if ($('pdpTitulo')) $('pdpTitulo').textContent = p.nombre;

  if ($('pdpRating')) {
    if (tieneResenas) {
      $('pdpRating').innerHTML =
        '<span class="pdp-estrellas">' + estrellas + '</span>' +
        '<strong>' + Number(p.rating).toFixed(1) + '</strong>' +
        '<small>(' + Number(p.reviews) + ' valoraciones)</small>';
      $('pdpRating').hidden = false;
    }
  }

  if ($('pdpAhora')) $('pdpAhora').textContent = cop(precio);

  if ($('pdpAntes')) {
    if (tieneDescuento) {
      $('pdpAntes').textContent = cop(antes);
      $('pdpAntes').hidden = false;
    }
  }

  if ($('pdpDescuento')) {
    if (tieneDescuento) {
      $('pdpDescuento').textContent = '-' + porcentaje + '%';
      $('pdpDescuento').hidden = false;
    }
  }

  if ($('pdpBeneficio') && p.beneficio) $('pdpBeneficio').textContent = p.beneficio;
  if ($('pdpDescripcion') && p.descripcion) $('pdpDescripcion').textContent = p.descripcion;

  /* ---------- Resumen de confianza ---------------------------------
     Condiciones que la tienda ya declara de forma pública en index.html. */
  const confianza = [
    'Envío a toda Colombia · gratis en compras superiores a $150.000',
    'Pago 100 % seguro (PSE, tarjetas)',
    'Derecho de retracto: 5 días hábiles (Ley 1480 de 2011)'
  ];
  if ($('pdpConfianza')) {
    $('pdpConfianza').innerHTML = confianza
      .map((t) => '<li><span aria-hidden="true">✓</span>' + esc(t) + '</li>')
      .join('');
  }

  /* ---------- Sección "Especificaciones y detalles" -----------------
     El párrafo introductorio es la descripción real del producto y las
     viñetas son el campo `caracteristicas`, que se cargó en productos.js
     a partir de las afirmaciones que ya existían en el propio catálogo.
     No se inventa ninguna especificación técnica. */
  if ($('pdpEspecIntro') && p.descripcion) $('pdpEspecIntro').textContent = p.descripcion;

  const caract = Array.isArray(p.caracteristicas) ? p.caracteristicas.filter(Boolean) : [];
  if ($('pdpCaracteristicas')) {
    $('pdpCaracteristicas').innerHTML = caract.length
      ? caract.map((c) => '<li><span aria-hidden="true">•</span>' + esc(c) + '</li>').join('')
      : '<li><span aria-hidden="true">•</span>Características pendientes de confirmar con el proveedor</li>';
  }

  if ($('pdpEspecCierre')) {
    $('pdpEspecCierre').innerHTML =
      '<strong>Envío gratis</strong> en compras superiores a $150.000 · Envío internacional de 6 a 12 días · ' +
      'Pago 100 % seguro (PSE, tarjetas) · Garantía y derecho de retracto (Ley 1480 de 2011).';
  }

  /* ---------- Sección "Envío y tiempos" ---------- */
  const envios = [
    'Enviamos a todo el país',
    'Envío internacional: 6 a 12 días',
    'Envío gratis en compras superiores a $150.000',
    'Te damos el número de guía para seguir tu pedido'
  ];
  if ($('pdpEnvios')) {
    $('pdpEnvios').innerHTML = envios
      .map((t) => '<li><span aria-hidden="true">✓</span>' + esc(t) + '</li>')
      .join('');
  }

  /* ---------- Sección "Garantía y devoluciones" ---------- */
  const garantias = [
    'Garantía y derecho de retracto — Ley 1480 de 2011',
    '5 días hábiles para retractarte desde que recibes tu pedido',
    'Productos originales y cruelty-free',
    'Soporte directo por WhatsApp si algo no sale bien'
  ];
  if ($('pdpGarantia')) {
    $('pdpGarantia').innerHTML = garantias
      .map((t) => '<li><span aria-hidden="true">✓</span>' + esc(t) + '</li>')
      .join('');
  }

  /* ---------- Abrir y cerrar las secciones ---------- */
  document.querySelectorAll('.pdp-acordeon-cab').forEach((cab) => {
    cab.addEventListener('click', () => {
      const caja = cab.closest('.pdp-acordeon');
      const panel = document.getElementById(cab.getAttribute('aria-controls'));
      const abierto = caja.classList.toggle('abierto');
      cab.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      if (panel) panel.hidden = !abierto;
    });
  });

  /* ---------- Cuenta regresiva de la promoción: QUITADA ----------
     Se eliminó a petición de la clienta (12 sep 2026). Pintaba el reloj de
     #pdpReloj dentro de .pdp-urgencia y además escondía toda la caja cuando
     la fecha pasaba. Esta página ya no tiene ningún contador. */

  /* ---------- Acciones de compra ---------- */
  const carro = () => window.BeauTenCarrito;

  function agregar() {
    const c = carro();
    if (!c) return false;
    return c.agregar(p.id, 1);
  }

  const btnAgregar = $('pdpAgregar');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      if (agregar()) carro().abrir();
    });
  }

  const btnComprar = $('pdpComprar');
  if (btnComprar) {
    btnComprar.addEventListener('click', () => {
      if (!agregar()) return;
      window.location.href = 'checkout.html';
    });
  }

  /* ---------- Barra fija inferior ---------- */
  const sticky = $('pdpSticky');
  if (sticky) {
    if ($('pdpStickyNombre')) $('pdpStickyNombre').textContent = p.nombre;
    if ($('pdpStickyPrecio')) $('pdpStickyPrecio').textContent = cop(precio);
    sticky.hidden = false;

    const stickyBtn = $('pdpStickyBtn');
    if (stickyBtn) {
      stickyBtn.addEventListener('click', () => {
        if (agregar()) carro().abrir();
      });
    }
  }

  /* ---------- WhatsApp: solo el nombre, sin códigos internos ---------- */
  const wa = $('pdpWa');
  if (wa) {
    wa.href =
      'https://wa.me/' + WA + '?text=' +
      encodeURIComponent('Hola BeauTen 👋 quiero preguntar por *' + p.nombre + '*');
  }

  /* ---------- Pintar la página ---------- */
  if ($('pdpCargando')) $('pdpCargando').hidden = true;
  if ($('pdpContenido')) $('pdpContenido').hidden = false;
})();
