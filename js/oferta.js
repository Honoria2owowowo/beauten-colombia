/* ============================================================
   BeauTen Colombia — Contador de oferta y kits que ahorran
   (tarea #109 del tablero)

   Se carga en index.html y en checkout.html:
   - index.html: pinta el contador de oferta y las tarjetas de kits.
   - checkout.html: usa la lista de kits y los porcentajes para mostrar
     una ESTIMACIÓN del descuento. El descuento real lo valida y lo
     calcula el backend (netlify/functions/crear-pago.js): el navegador
     solo enseña un cálculo aproximado y nunca decide el precio.
   ============================================================ */
(function () {
  'use strict';

  const PRODUCTOS = window.BEAUTEN_PRODUCTOS || [];
  const cop = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
  const buscar = (id) => PRODUCTOS.find((p) => String(p.id) === String(id));

  /* ============================================================
     PARTE 1 — CONTADOR DE OFERTA
     ============================================================ */

  /* Contador de 15 MINUTOS que se reinicia al llegar a cero.

     DECISIÓN DEL USUARIO, CON ADVERTENCIA PREVIA: se le explicó que un contador
     que se reinicia en cada visita le dice al cliente que la oferta termina en
     15 minutos cuando no es cierto — publicidad engañosa según la Ley 1480 y
     regulada por la SIC — y que en una marca nueva eso castiga justo la
     confianza, que es su activo principal. El usuario decidió publicarlo igual,
     conociendo el riesgo. Queda registrado como decisión suya.

     Si algún día se quiere una urgencia legítima, las vías honestas son: una
     fecha de cierre que se cumpla de verdad (como en Vórtex), un stock real
     limitado, o una promoción relámpago real anunciada de antemano. */
  const DURACION_MS = 15 * 60 * 1000;
  const CLAVE_INICIO = 'beauten_oferta_inicio';

  // Instante de arranque del ciclo actual. Si ya pasaron los 15 minutos,
  // empieza uno nuevo: así el reloj nunca se queda en cero.
  function inicioCiclo() {
    let inicio = null;
    try { inicio = parseInt(sessionStorage.getItem(CLAVE_INICIO), 10); } catch (e) { inicio = null; }
    const ahora = Date.now();
    if (!inicio || isNaN(inicio) || ahora - inicio >= DURACION_MS) {
      inicio = ahora;
      try { sessionStorage.setItem(CLAVE_INICIO, String(inicio)); } catch (e) { /* sin almacenamiento */ }
    }
    return inicio;
  }

  const dosDigitos = (n) => String(n).padStart(2, '0');

  function montarContador() {
    const caja = document.getElementById('ofertaContador');
    if (!caja) return;

    const reloj = caja.querySelector('.oferta-reloj');
    const piezas = {
      dias: document.getElementById('ofDias'),
      horas: document.getElementById('ofHoras'),
      minutos: document.getElementById('ofMinutos'),
      segundos: document.getElementById('ofSegundos')
    };
    if (!reloj || !piezas.dias || !piezas.horas || !piezas.minutos || !piezas.segundos) return;

    // El ciclo dura minutos, no días: los bloques de días y horas no aportan
    // nada y se ocultan para que el reloj se lea limpio.
    [piezas.dias, piezas.horas].forEach(function (el) {
      if (el && el.parentElement) el.parentElement.hidden = true;
    });

    const avisoFinal = document.createElement('p');
    avisoFinal.className = 'oferta-final';
    avisoFinal.textContent = 'Oferta finalizada';
    avisoFinal.hidden = true;
    caja.appendChild(avisoFinal);

    let temporizador = null;

    function actualizar() {
      // El ciclo se reinicia solo: al agotarse los 15 minutos empieza de nuevo.
      // Nunca se muestran números negativos.
      let restante = DURACION_MS - (Date.now() - inicioCiclo());

      if (restante <= 0) {
        try { sessionStorage.removeItem(CLAVE_INICIO); } catch (e) { /* sin almacenamiento */ }
        restante = DURACION_MS - (Date.now() - inicioCiclo());
      }

      const segundosTotales = Math.floor(restante / 1000);
      const dias = Math.floor(segundosTotales / 86400);
      const horas = Math.floor((segundosTotales % 86400) / 3600);
      const minutos = Math.floor((segundosTotales % 3600) / 60);
      const segundos = segundosTotales % 60;

      piezas.dias.textContent = dosDigitos(dias);
      piezas.horas.textContent = dosDigitos(horas);
      piezas.minutos.textContent = dosDigitos(minutos);
      piezas.segundos.textContent = dosDigitos(segundos);
    }

    actualizar();
    temporizador = setInterval(actualizar, 1000);
  }

  /* ============================================================
     PARTE 2 — KITS QUE AHORRAN
     Solo se usan productos que YA existen en js/productos.js.
     Si algún id no estuviera en el catálogo, ese kit no se pinta.
     El descuento del kit se aplica DE VERDAD al pagar: el código del kit
     viaja al backend y allí se valida (variables de entorno KITS).
     ============================================================ */
  const KITS = [
    {
      codigo: 'KITCABELLO',
      nombre: 'Kit Cabello de salón',
      descripcion: 'Para secar, moldear y frenar la caída del cabello sin pagar el salón.',
      descuento: 10,
      productos: ['1134526', '1147568']
    },
    {
      codigo: 'KITBIENESTAR',
      nombre: 'Kit Espalda y cuello sin dolor',
      descripcion: 'Para el dolor de espalda del trabajo frente al computador y el de cuello al dormir.',
      descuento: 10,
      productos: ['729188', '2151590']
    }
  ];

  // Porcentajes SOLO para la estimación que se enseña en el checkout.
  // Los códigos válidos de verdad están en la variable de entorno CUPONES
  // del backend. Si allí se cambia el porcentaje, hay que cambiarlo aquí
  // para que la estimación no mienta.
  const CUPONES_ESTIMADOS = { BEAUTEN10: 10 };

  const kitPorCodigo = (codigo) => {
    const c = String(codigo || '').trim().toUpperCase();
    return KITS.find((k) => k.codigo === c) || null;
  };

  function pintarKits() {
    const grid = document.getElementById('kitsGrid');
    if (!grid || !PRODUCTOS.length) return;

    grid.innerHTML = KITS.map((kit) => {
      const incluidos = kit.productos.map(buscar).filter(Boolean);
      // Si falta algún producto del catálogo, el kit no se muestra.
      if (incluidos.length !== kit.productos.length) return '';

      const suma = incluidos.reduce((s, p) => s + (Number(p.precio) || 0), 0);
      const ahorro = Math.round((suma * kit.descuento) / 100);
      const total = suma - ahorro;
      const ids = incluidos.map((p) => p.id).join(',');

      const lista = incluidos
        .map(
          (p) =>
            '<li class="kit-producto">' +
            '<img src="' + p.imagen + '" alt="' + p.nombre + '" loading="lazy">' +
            '<div><h4>' + p.nombre + '</h4><p>' + cop(p.precio) + '</p></div>' +
            '</li>'
        )
        .join('');

      return (
        '<article class="kit-card wow-fade visible">' +
          '<span class="kit-ahorro">Ahorras ' + cop(ahorro) + ' (' + kit.descuento + '%)</span>' +
          '<h3>' + kit.nombre + '</h3>' +
          '<p class="kit-desc">' + kit.descripcion + '</p>' +
          '<ul class="kit-productos">' + lista + '</ul>' +
          '<div class="kit-precios">' +
            '<span class="kit-antes">' + cop(suma) + '</span>' +
            '<span class="kit-ahora">' + cop(total) + '</span>' +
          '</div>' +
          '<button type="button" class="btn-pill btn-pink kit-agregar" data-agregar="' + ids + '" data-kit="' + kit.codigo + '">' +
            '<span>Añadir el kit al carrito</span>' +
          '</button>' +
          '<p class="kit-nota">Se añaden los dos productos al carrito. El código <strong>' + kit.codigo +
            '</strong> se aplica solo y el total baja a ' + cop(total) + '.</p>' +
        '</article>'
      );
    }).join('');
  }

  // Al pulsar el botón de un kit se recuerda el código para que el checkout
  // lo proponga ya escrito. El código NO descuenta por sí solo: el backend
  // comprueba que los dos productos del kit estén en el carrito.
  function recordarKit() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-kit]');
      if (!el) return;
      try {
        localStorage.setItem('beauten_kit_v1', el.dataset.kit);
      } catch (err) {
        /* sin problema: el checkout también permite escribir el código a mano */
      }
    });
  }

  /* ---------- API pública (la usa checkout.html) ---------- */
  window.BeauTenOferta = {
    duracionMs: DURACION_MS,
    kits: KITS,
    cuponesEstimados: CUPONES_ESTIMADOS,
    kitPorCodigo: kitPorCodigo,
    // Porcentaje estimado de un código (cupón o kit). 0 = no reconocido.
    porcentajeEstimado: (codigo) => {
      const c = String(codigo || '').trim().toUpperCase();
      if (CUPONES_ESTIMADOS[c]) return CUPONES_ESTIMADOS[c];
      const kit = kitPorCodigo(c);
      return kit ? kit.descuento : 0;
    },
    kitGuardado: () => {
      try {
        return localStorage.getItem('beauten_kit_v1') || '';
      } catch (err) {
        return '';
      }
    },
    olvidarKit: () => {
      try {
        localStorage.removeItem('beauten_kit_v1');
      } catch (err) {
        /* sin problema */
      }
    }
  };

  /* ---------- Arranque ---------- */
  function iniciar() {
    montarContador();
    pintarKits();
    recordarKit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
