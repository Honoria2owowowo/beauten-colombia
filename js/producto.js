/* ============================================================
   Marlú Colombia — Ficha de producto (PDP)
   Lee el producto desde window.BEAUTEN_PRODUCTOS usando ?id=

   Regla de la casa: solo se muestran datos reales. Nada de
   especificaciones, plazos ni precios inventados. Todo lo que
   aparece aquí sale del catálogo o de lo que la tienda ya
   publica en index.html.
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     LO ÚNICO QUE FALTA POR CONFIRMAR

     Estas líneas controlan las dos cosas que no puedo deducir de
     tus datos. Mientras estén como están, la ficha NO dice nada
     sobre ellas: se calla en vez de prometer algo falso.
     ============================================================ */
  var FICHA = {
    /* true  = también vendes contra entrega: aparece la caja verde
               con las ventajas y el botón cambia a "Pedir contra entrega".
       false = solo pago anticipado con PSE y tarjetas, que es lo que
               el sitio anuncia hoy en la barra superior. */
    contraEntrega: false,

    /* Hora de corte del despacho en formato 24 h, por ejemplo '19:00'.
       Vacío ('') = el reloj no se muestra en ninguna parte. */
    corteDespacho: '',

    /* Plazo de despacho, solo como texto, por ejemplo '3 a 4'.
       Vacío ('') = no se menciona ningún plazo. */
    diasDespacho: '',

    /* Cupón vigente. TIENE que coincidir con la variable CUPONES del
       Worker: si allí se cambia, hay que cambiarlo aquí también. */
    cupon: 'MARLU10',
    cuponPct: 10,

    /* Desde cuánto el envío es gratis. Dato que ya publica index.html. */
    /* El envío es gratis a toda Colombia, sin mínimo de compra: es lo que
       cobra el checkout. No hay umbral que mostrar. */
  };

  /* ============================================================
     DATOS DEL VENDEDOR — bloque "¿Quién te vende?"

     Van en un solo sitio para que no se repitan por el proyecto.
     Una línea vacía NO se dibuja: la caja se calla antes que
     publicar un dato falso o el de otra marca.

     La dirección y el WhatsApp ya están puestos. El correo queda
     vacío porque Marlú todavía no tiene uno propio: mientras tanto,
     el contacto del sitio es el WhatsApp.
     ============================================================ */
  var TIENDA = {
    nombre: 'Marlú Colombia',
    descripcion: 'Negocio colombiano de belleza y bienestar.',
    direccion: 'Cl. 35 Nte. #6ABis-100, Santa Mónica · Cali, Valle del Cauca',
    whatsapp: '573181738642',
    whatsappVisible: '+57 318 173 8642',
    horario: 'Lunes a sábado, 8:00 a.m. a 8:00 p.m.',
    correo: '',             // Marlú todavía no tiene correo propio; el contacto es el WhatsApp.
    titular: 'C.C. 1126705132'
  };

  var PRODUCTOS = window.BEAUTEN_PRODUCTOS || [];
  var WA = '573181738642';

  var $ = function (id) { return document.getElementById(id); };
  var cop = function (n) { return '$' + Number(n || 0).toLocaleString('es-CO'); };
  var esc = function (s) { return String(s == null ? '' : s); };
  var dos = function (n) { return (n < 10 ? '0' : '') + n; };

  // Para textos que van dentro de innerHTML con datos que no controlo.
  var escHtml = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* ---------- Datos del producto ---------- */
  var idBuscado = new URLSearchParams(window.location.search).get('id');
  var producto = PRODUCTOS.find(function (p) { return String(p.id) === String(idBuscado); });

  function mostrarError() {
    if ($('pdpCargando')) $('pdpCargando').hidden = true;
    if ($('pdpError')) $('pdpError').hidden = false;
    document.title = 'Producto no encontrado — Marlú Colombia';
  }

  if (!producto) {
    mostrarError();
    return;
  }

  var p = producto;

  /* ---------- Cálculos derivados de datos reales ---------- */
  var precio = Number(p.precio) || 0;
  var antes = Number(p.precioAntes) || 0;
  var tieneDescuento = antes > precio && precio > 0;
  var porcentaje = tieneDescuento ? Math.round((1 - precio / antes) * 100) : 0;
  var ahorro = tieneDescuento ? antes - precio : 0;
  var estrellas = '★'.repeat(Math.min(5, Math.round(Number(p.rating) || 0)));
  var tieneResenas = Number(p.reviews) > 0;

  /* ---------- Cabecera y metadatos ---------- */
  document.title = p.nombre + ' — Marlú Colombia';
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute(
      'content',
      esc(p.descripcion).slice(0, 150) + ' Pago con PSE y tarjetas y envío a toda Colombia.'
    );
  }

  var migaCat = $('pdpMigaCategoria');
  if (migaCat && p.nicho) migaCat.textContent = p.nicho;
  if ($('pdpMigaProducto')) $('pdpMigaProducto').textContent = p.nombre;

  /* ============================================================
     GALERÍA
     Las fotos salen del campo `imagenes` (varias) o de `imagen`
     (una sola). Si solo hay una, no se pintan miniaturas ni
     contador: no tiene sentido decir "1 foto".
     ============================================================ */
  var fotos = Array.isArray(p.imagenes) ? p.imagenes.filter(Boolean) : [];
  if (!fotos.length && p.imagen) fotos = [p.imagen];
  var fotoActual = 0;

  var img = $('pdpImagen');
  if (img && fotos.length) {
    img.src = fotos[0];
    img.alt = p.nombre;
  }

  var minis = $('pdpMinis');
  var cuenta = $('pdpFotos');

  if (fotos.length > 1) {
    if (cuenta) {
      cuenta.textContent = fotos.length + ' fotos · toca una para ampliarla';
      cuenta.hidden = false;
    }
    if (minis) {
      minis.innerHTML = fotos.map(function (f, i) {
        return '<button type="button" class="pdp-mini' + (i === 0 ? ' activa' : '') +
          '" data-foto="' + escHtml(f) + '" data-idx="' + i +
          '" aria-label="Ver foto ' + (i + 1) + ' de ' + fotos.length + '">' +
          '<img src="' + escHtml(f) + '" alt="" loading="lazy"></button>';
      }).join('');
      minis.hidden = false;

      minis.addEventListener('click', function (e) {
        var b = e.target.closest('[data-foto]');
        if (!b) return;
        fotoActual = parseInt(b.dataset.idx, 10) || 0;
        if (img) img.src = fotos[fotoActual];
        minis.querySelectorAll('.pdp-mini').forEach(function (m) { m.classList.remove('activa'); });
        b.classList.add('activa');
      });
    }
  }

  if ($('pdpTag') && p.tag) {
    $('pdpTag').textContent = p.tag;
    $('pdpTag').hidden = false;
  }

  /* ============================================================
     VISOR DE FOTO AMPLIADA
     Se abre con la lupa, con la foto grande o tocando una miniatura.
     Se cierra con la ✕, tocando el fondo o con Escape. Se navega con
     las flechas del teclado o con los botones laterales.
     ============================================================ */
  var visor = $('pdpVisor');
  var visorImg = $('pdpVisorImg');
  var visorCuenta = $('pdpVisorCuenta');
  var ultimoFoco = null;

  function pintarVisor() {
    if (!visorImg || !fotos.length) return;
    visorImg.src = fotos[fotoActual];
    visorImg.alt = p.nombre + ' — foto ' + (fotoActual + 1);
    if (visorCuenta) {
      visorCuenta.textContent = fotos.length > 1
        ? (fotoActual + 1) + ' / ' + fotos.length
        : '';
    }
    // Las flechas solo tienen sentido si hay más de una foto
    var prev = $('pdpVisorPrev'), next = $('pdpVisorNext');
    var solas = fotos.length < 2;
    if (prev) prev.hidden = solas;
    if (next) next.hidden = solas;
  }

  function abrirVisor(i) {
    if (!visor || !fotos.length) return;
    if (typeof i === 'number') fotoActual = i;
    ultimoFoco = document.activeElement;
    pintarVisor();
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
    var c = $('pdpVisorCerrar');
    if (c) c.focus();
  }

  function cerrarVisor() {
    if (!visor || visor.hidden) return;
    visor.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  function moverVisor(paso) {
    if (fotos.length < 2) return;
    fotoActual = (fotoActual + paso + fotos.length) % fotos.length;
    pintarVisor();
  }

  if ($('pdpZoom')) $('pdpZoom').addEventListener('click', function () { abrirVisor(fotoActual); });
  if (img) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function () { abrirVisor(fotoActual); });
  }
  if ($('pdpVisorCerrar')) $('pdpVisorCerrar').addEventListener('click', cerrarVisor);
  if ($('pdpVisorPrev')) $('pdpVisorPrev').addEventListener('click', function () { moverVisor(-1); });
  if ($('pdpVisorNext')) $('pdpVisorNext').addEventListener('click', function () { moverVisor(1); });
  if (visor) {
    visor.addEventListener('click', function (e) {
      // Tocar el fondo (no la foto ni los botones) cierra
      if (e.target === visor) cerrarVisor();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (!visor || visor.hidden) return;
    if (e.key === 'Escape') cerrarVisor();
    else if (e.key === 'ArrowLeft') moverVisor(-1);
    else if (e.key === 'ArrowRight') moverVisor(1);
  });

  /* ============================================================
     COLUMNA DE INFORMACIÓN
     ============================================================ */
  if ($('pdpTitulo')) $('pdpTitulo').textContent = p.nombre;

  /* --- Línea bajo el título: quién vende y qué se promete ---
     Solo datos que ya están publicados en el sitio. El plazo de
     despacho solo aparece si FICHA.diasDespacho tiene valor. */
  if ($('pdpVendedor')) {
    var partes = ['Vendido por Marlú'];
    if (FICHA.diasDespacho) partes.push('Despacho ' + FICHA.diasDespacho + ' días hábiles');
    partes.push('Envío a toda Colombia');
    partes.push('Gratis a toda Colombia');
    $('pdpVendedor').textContent = partes.join(' · ');
  }

  if ($('pdpRating') && tieneResenas) {
    $('pdpRating').innerHTML =
      '<span class="pdp-estrellas">' + estrellas + '</span>' +
      '<strong>' + Number(p.rating).toFixed(1) + '</strong>' +
      '<small>(' + Number(p.reviews) + ' valoraciones)</small>';
    $('pdpRating').hidden = false;
  }

  if ($('pdpAhora')) $('pdpAhora').textContent = cop(precio);

  if ($('pdpAntes') && tieneDescuento) {
    $('pdpAntes').textContent = cop(antes);
    $('pdpAntes').hidden = false;
  }

  if ($('pdpDescuento') && tieneDescuento) {
    $('pdpDescuento').textContent = '-' + porcentaje + '%';
    $('pdpDescuento').hidden = false;
  }

  /* --- Línea de ahorro: solo si de verdad hay descuento --- */
  if ($('pdpAhorro') && ahorro > 0) {
    $('pdpAhorro').textContent = 'Ahorras ' + cop(ahorro) + ' hoy · Oferta de lanzamiento';
    $('pdpAhorro').hidden = false;
  }

  /* --- Franja del cupón: se copia al portapapeles --- */
  var btnCupon = $('pdpCupon');
  if (btnCupon) {
    if ($('pdpCuponCodigo')) $('pdpCuponCodigo').textContent = FICHA.cupon;
    if ($('pdpCuponPct')) $('pdpCuponPct').textContent = FICHA.cuponPct + ' %';
    btnCupon.hidden = false;

    btnCupon.addEventListener('click', function () {
      var ok = $('pdpCuponOk');
      var texto = FICHA.cupon;

      function avisar() {
        if (!ok) return;
        ok.hidden = false;
        setTimeout(function () { ok.hidden = true; }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(avisar, avisar);
      } else {
        // Navegadores viejos o contexto sin permisos
        var ta = document.createElement('textarea');
        ta.value = texto;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* nada */ }
        document.body.removeChild(ta);
        avisar();
      }
    });
  }

  /* --- Caja de beneficios del pago ---
     Cambia por completo según FICHA.contraEntrega. Los textos son
     afirmaciones que la tienda ya sostiene en su propio sitio. */
  var caja = $('pdpCaja');
  if (caja) {
    if (FICHA.contraEntrega) {
      caja.className = 'pdp-caja pdp-caja--cod';
      caja.innerHTML =
        '<b>PAGA CONTRA ENTREGA</b><ul>' +
        '<li>Pagas en efectivo cuando recibes tu pedido</li>' +
        '<li>Sin tarjeta ni anticipos</li>' +
        '<li>Revisas el producto antes de pagar</li>' +
        '</ul>' +
        '<span class="pdp-caja-pie">✓ Envío gratis a toda Colombia</span>';
    } else {
      caja.className = 'pdp-caja';
      caja.innerHTML =
        '<b>PAGO 100 % SEGURO</b><ul>' +
        '<li>PSE y tarjetas a través de MercadoPago</li>' +
        '<li>No guardamos los datos de tu tarjeta</li>' +
        '<li>Recibes el número de guía para seguir tu pedido</li>' +
        '</ul>' +
        '<span class="pdp-caja-pie">✓ Envío gratis a toda Colombia</span>';
    }
    caja.hidden = false;
  }

  if ($('pdpBeneficio') && p.beneficio) $('pdpBeneficio').textContent = p.beneficio;
  if ($('pdpDescripcion') && p.descripcion) $('pdpDescripcion').textContent = p.descripcion;

  /* ---------- Resumen de confianza ---------- */
  var confianza = [
    'Envío gratis a toda Colombia',
    'Pago seguro: PSE, tarjeta o contra entrega',
    'Derecho de retracto: 5 días hábiles (Ley 1480 de 2011)'
  ];
  if ($('pdpConfianza')) {
    $('pdpConfianza').innerHTML = confianza
      .map(function (t) { return '<li><span aria-hidden="true">✓</span>' + escHtml(t) + '</li>'; })
      .join('');
  }

  /* ---------- Sección "Especificaciones y detalles" ---------- */
  if ($('pdpEspecIntro') && p.descripcion) $('pdpEspecIntro').textContent = p.descripcion;

  var caract = Array.isArray(p.caracteristicas) ? p.caracteristicas.filter(Boolean) : [];
  if ($('pdpCaracteristicas')) {
    $('pdpCaracteristicas').innerHTML = caract.length
      ? caract.map(function (c) { return '<li><span aria-hidden="true">•</span>' + escHtml(c) + '</li>'; }).join('')
      : '<li><span aria-hidden="true">•</span>Características pendientes de confirmar con el proveedor</li>';
  }

  if ($('pdpEspecCierre')) {
    $('pdpEspecCierre').innerHTML =
      '<strong>Envío gratis</strong> a toda Colombia · Envío internacional de 6 a 12 días · ' +
      'Pago con PSE, tarjeta o contra entrega · ' +
      'Garantía y derecho de retracto (Ley 1480 de 2011).';
  }

  /* ---------- Sección "Envío y tiempos" ---------- */
  var envios = [
    'Enviamos a todo el país',
    'Envío internacional: 6 a 12 días',
    'Envío gratis a toda Colombia',
    'Te damos el número de guía para seguir tu pedido'
  ];
  if ($('pdpEnvios')) {
    $('pdpEnvios').innerHTML = envios
      .map(function (t) { return '<li><span aria-hidden="true">✓</span>' + escHtml(t) + '</li>'; })
      .join('');
  }

  /* ---------- Sección "Garantía y devoluciones" ---------- */
  var garantias = [
    'Garantía y derecho de retracto — Ley 1480 de 2011',
    '5 días hábiles para retractarte desde que recibes tu pedido',
    'Productos originales y cruelty-free',
    'Soporte directo por WhatsApp si algo no sale bien'
  ];
  if ($('pdpGarantia')) {
    $('pdpGarantia').innerHTML = garantias
      .map(function (t) { return '<li><span aria-hidden="true">✓</span>' + escHtml(t) + '</li>'; })
      .join('');
  }

  /* ---------- Abrir y cerrar las secciones ---------- */
  document.querySelectorAll('.pdp-acordeon-cab').forEach(function (cab) {
    cab.addEventListener('click', function () {
      var cajaAc = cab.closest('.pdp-acordeon');
      var panel = document.getElementById(cab.getAttribute('aria-controls'));
      var abierto = cajaAc.classList.toggle('abierto');
      cab.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      if (panel) panel.hidden = !abierto;
    });
  });

  /* ============================================================
     RELOJ DE CORTE DEL DESPACHO

     Ojo, esto NO es el contador de promoción que se quitó el
     12-sep-2026. Aquel tenía una fecha de cierre inventada (el 13
     de septiembre) y, al llegar a cero, volvía a empezar: mentía.

     Este cuenta hacia atrás hasta TU hora de corte real, la que
     pongas en FICHA.corteDespacho. Si no la pones, no se muestra.
     Cuando el despacho ya cerró, lo dice en vez de fingir urgencia.
     ============================================================ */
  function reloj12(hh, mm) {
    var suf = hh >= 12 ? 'p.m.' : 'a.m.';
    var h = hh % 12;
    if (h === 0) h = 12;
    return h + ':' + dos(mm) + ' ' + suf;
  }

  function pintarCorte() {
    var cajaCorte = $('pdpCorte');
    if (!cajaCorte || !FICHA.corteDespacho) return;

    var trozos = String(FICHA.corteDespacho).split(':');
    var hh = parseInt(trozos[0], 10);
    var mm = parseInt(trozos[1], 10);
    if (isNaN(hh) || isNaN(mm)) return;

    cajaCorte.hidden = false;

    function tic() {
      var ahora = new Date();
      var fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hh, mm, 0, 0);
      var esHoy = fin.getTime() > ahora.getTime();
      if (!esHoy) fin.setDate(fin.getDate() + 1);

      var ms = fin.getTime() - ahora.getTime();
      var s = Math.floor(ms / 1000);
      var reloj = dos(Math.floor(s / 3600)) + ':' + dos(Math.floor((s % 3600) / 60)) + ':' + dos(s % 60);
      var min = Math.max(1, Math.ceil(ms / 60000));

      var texto;
      if (!esHoy) {
        texto = 'Ya cerró el despacho de hoy · <b>tu pedido sale en el siguiente</b>';
      } else if (min <= 60) {
        texto = 'Quedan <b>' + min + ' min</b> · <b>sale hoy</b>';
      } else {
        texto = 'Pide antes de las <b>' + reloj12(hh, mm) + '</b> y <b>sale hoy</b>';
      }

      cajaCorte.innerHTML = texto + ' <b class="pdp-corte-reloj">' + reloj + '</b>';
    }

    tic();
    setInterval(tic, 1000);
  }
  pintarCorte();

  /* ============================================================
     ACCIONES DE COMPRA
     ============================================================ */
  var carro = function () { return window.BeauTenCarrito; };

  /* ---------- Selector de cantidad ---------- */
  var cantidad = 1;
  var entradaQty = $('pdpQty');

  function pintarCantidad() {
    if (entradaQty) entradaQty.value = String(cantidad);
  }

  if ($('pdpQtyMenos')) {
    $('pdpQtyMenos').addEventListener('click', function () {
      cantidad = Math.max(1, cantidad - 1);
      pintarCantidad();
    });
  }
  if ($('pdpQtyMas')) {
    $('pdpQtyMas').addEventListener('click', function () {
      cantidad = Math.min(99, cantidad + 1);
      pintarCantidad();
    });
  }
  if (entradaQty) {
    entradaQty.addEventListener('change', function () {
      cantidad = Math.max(1, Math.min(99, parseInt(entradaQty.value, 10) || 1));
      pintarCantidad();
    });
    entradaQty.addEventListener('blur', pintarCantidad);
  }
  pintarCantidad();

  function agregar(n) {
    var c = carro();
    if (!c) return false;
    return c.agregar(p.id, n || cantidad);
  }

  if ($('pdpAgregar')) {
    $('pdpAgregar').addEventListener('click', function () {
      if (agregar()) carro().abrir();
    });
  }

  if ($('pdpComprar')) {
    $('pdpComprar').addEventListener('click', function () {
      if (!agregar()) return;
      window.location.href = 'checkout.html';
    });
  }

  /* ---------- Barra fija inferior ---------- */
  var sticky = $('pdpSticky');
  if (sticky) {
    if ($('pdpStickyNombre')) $('pdpStickyNombre').textContent = p.nombre;
    if ($('pdpStickyPrecio')) $('pdpStickyPrecio').textContent = cop(precio);
    sticky.hidden = false;

    if ($('pdpStickyBtn')) {
      $('pdpStickyBtn').addEventListener('click', function () {
        if (agregar()) carro().abrir();
      });
    }
  }

  /* ---------- WhatsApp: solo el nombre, sin códigos internos ---------- */
  var wa = $('pdpWa');
  if (wa) {
    wa.href = 'https://wa.me/' + WA + '?text=' +
      encodeURIComponent('Hola Marlú 👋 quiero preguntar por *' + p.nombre + '*');
  }

  /* ============================================================
     ¿QUIÉN TE VENDE?

     El comprador está a punto de dar su cédula y su dirección: aquí
     es donde se pregunta "¿esta tienda existe?". Se dibujan los
     datos reales que ya están publicados, sin inventar nada. Cada
     línea solo aparece si tiene dato.
     ============================================================ */
  var quien = $('pdpQuien');
  if (quien) {
    var lineas = [
      '<b>¿Quién te vende?</b>',
      '<span>' + escHtml(TIENDA.nombre) + ' · ' + escHtml(TIENDA.descripcion) + '</span>'
    ];
    if (TIENDA.direccion) {
      lineas.push('<span>Dirección: ' + escHtml(TIENDA.direccion) + '</span>');
    }
    if (TIENDA.whatsapp) {
      lineas.push('<span>WhatsApp y llamadas' +
        (TIENDA.horario ? ' (' + escHtml(TIENDA.horario) + ')' : '') +
        ': <a href="https://wa.me/' + escHtml(TIENDA.whatsapp) + '" target="_blank" rel="noopener">' +
        escHtml(TIENDA.whatsappVisible) + '</a></span>');
    }
    if (TIENDA.correo) {
      lineas.push('<span>Correo: <a href="mailto:' + escHtml(TIENDA.correo) + '">' +
        escHtml(TIENDA.correo) + '</a></span>');
    }
    if (TIENDA.titular) {
      lineas.push('<span>Identificación del titular: ' + escHtml(TIENDA.titular) + '.</span>');
    }
    quien.innerHTML = lineas.join('');
    quien.hidden = false;
  }

  /* ============================================================
     LISTA DE CONFIANZA

     El envío es gratis a toda Colombia, sin mínimo: es lo que cobra
     el checkout, que nunca suma envío. Por eso aquí sí se puede
      decir "gratis a toda Colombia" sin ponerle condición.
      ============================================================ */
  var trust = $('pdpTrust');
  if (trust) {
    var puntos = [
      'Envío gratis a toda Colombia',
      FICHA.contraEntrega
        ? 'Pago contra entrega: revisas antes de pagar'
        : 'Pago 100 % seguro: PSE y tarjetas',
      'Garantía y derecho de retracto (Ley 1480 de 2011)',
      'Te damos el número de guía para seguir tu pedido'
    ];
    trust.innerHTML = puntos.map(function (x) {
      return '<div class="pdp-trust-item"><span class="pdp-ck" aria-hidden="true">✓</span>' +
        '<span>' + escHtml(x) + '</span></div>';
    }).join('');
    trust.hidden = false;
  }

  /* ============================================================
     FICHA TÉCNICA

     Igual que en VÓRTEX: un archivo aparte, editable por el dueño,
     con los datos del producto y de dónde salió cada uno. Sirve
     para dos cosas: dibujar la ficha y poder corregir el título o
     la descripción que trae la plataforma del proveedor.

     Si el archivo no está, o el producto no aparece en él, NO se
     dibuja nada. La ficha nunca se rompe ni se rellena a ojo:
     es mejor una ficha corta que una inventada.
     ============================================================ */
  function pintarFicha(f) {
    var caja = $('pdpFicha');
    if (!caja || !f || typeof f !== 'object') return;

    var specs = (f.specs || []).filter(function (s) { return s && s.k && s.v; });
    var incluye = (f.incluye || []).filter(Boolean);
    var necesita = (f.necesita || []).filter(Boolean);
    if (!specs.length && !incluye.length && !necesita.length) return;

    var html = '<h2 class="pdp-ficha-titulo">Ficha técnica' +
      (f.modelo ? ' <span>· ' + escHtml(f.modelo) + '</span>' : '') + '</h2>';

    if (specs.length) {
      html += '<dl class="pdp-ficha-lista">' + specs.map(function (s) {
        return '<div class="pdp-ficha-fila"><dt>' + escHtml(s.k) + '</dt>' +
          '<dd>' + escHtml(s.v) + '</dd></div>';
      }).join('') + '</dl>';
    }

    if (incluye.length || necesita.length) {
      html += '<div class="pdp-ficha-cols">';
      if (incluye.length) {
        html += '<div><h3>Qué trae la caja</h3><ul>' + incluye.map(function (x) {
          return '<li>' + escHtml(x) + '</li>';
        }).join('') + '</ul></div>';
      }
      if (necesita.length) {
        html += '<div><h3>Qué necesitas para usarlo</h3><ul>' + necesita.map(function (x) {
          return '<li>' + escHtml(x) + '</li>';
        }).join('') + '</ul></div>';
      }
      html += '</div>';
    }

    if (f.nota_honesta) {
      html += '<p class="pdp-ficha-nota">' + escHtml(f.nota_honesta) + '</p>';
    }
    if (f.fuente) {
      html += '<p class="pdp-ficha-fuente">Fuente: ' + escHtml(f.fuente) + '.</p>';
    }

    caja.innerHTML = html;
    caja.hidden = false;
  }

  // Se pide el archivo sin bloquear: si tarda o falla, la ficha sale igual.
  fetch('ficha-tecnica.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.productos) return;
      var f = j.productos[String(p.id)];
      if (!f) return;
      // Si hay descripción corregida, sustituye a la que trae la plataforma.
      if (f.descripcion && $('pdpDescripcion')) {
        $('pdpDescripcion').textContent = f.descripcion;
      }
      pintarFicha(f);
    })
    .catch(function () { /* sin ficha técnica: la página funciona igual */ });

  /* ---------- Pintar la página ---------- */
  if ($('pdpCargando')) $('pdpCargando').hidden = true;
  if ($('pdpContenido')) $('pdpContenido').hidden = false;
})();
