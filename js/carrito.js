/* ============================================================
   Marlú Colombia — Carrito de compras
   El pago se hace con PSE y tarjetas a través de MercadoPago.
   El carrito se guarda en el navegador; el cobro lo crea el
   backend (Netlify Function) para que la clave nunca se exponga.
   ============================================================ */
(function () {
  'use strict';

  const CLAVE = 'beauten_carrito_v1';
  const PRODUCTOS = window.BEAUTEN_PRODUCTOS || [];
  const buscar = (id) => PRODUCTOS.find((p) => String(p.id) === String(id));

  const cop = (n) => '$' + Number(n || 0).toLocaleString('es-CO');

  let carrito = [];

  /* ---------- Almacenamiento ---------- */
  function leer() {
    try {
      const raw = localStorage.getItem(CLAVE);
      const data = raw ? JSON.parse(raw) : [];
      carrito = Array.isArray(data) ? data : [];
    } catch (e) {
      carrito = [];
    }
    return carrito;
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(carrito));
    } catch (e) {
      console.warn('No se pudo guardar el carrito:', e);
    }
    pintarTodo();
  }

  /* ---------- Operaciones ---------- */
  function agregar(id, cantidad) {
    const p = buscar(id);
    if (!p) return false;
    const cant = Math.max(1, parseInt(cantidad, 10) || 1);
    const linea = carrito.find((l) => String(l.id) === String(id));
    if (linea) linea.cantidad += cant;
    else carrito.push({ id: String(p.id), cantidad: cant });
    guardar();
    return true;
  }

  function quitar(id) {
    carrito = carrito.filter((l) => String(l.id) !== String(id));
    guardar();
  }

  function cambiarCantidad(id, cantidad) {
    const cant = parseInt(cantidad, 10);
    const linea = carrito.find((l) => String(l.id) === String(id));
    if (!linea) return;
    if (!cant || cant < 1) return quitar(id);
    linea.cantidad = cant;
    guardar();
  }

  function vaciar() {
    carrito = [];
    guardar();
  }

  /* ---------- Cálculos ---------- */
  function lineas() {
    return carrito
      .map((l) => {
        const p = buscar(l.id);
        if (!p) return null;
        const precio = Number(p.precio) || 0;
        return {
          id: String(l.id),
          cantidad: l.cantidad,
          nombre: p.nombre,
          precio: precio,
          imagen: p.imagen,
          proveedor: p.proveedor,
          subtotal: precio * l.cantidad
        };
      })
      .filter(Boolean);
  }

  const subtotal = () => lineas().reduce((s, l) => s + l.subtotal, 0);
  const unidades = () => carrito.reduce((s, l) => s + l.cantidad, 0);

  /* ---------- Interfaz ---------- */
  function montarUI() {
    if (document.getElementById('carritoDrawer')) return;

    // Botón de carrito: se inserta en la cabecera si existe, si no flota
    const acciones = document.querySelector('.header-actions');
    const btn = document.createElement('button');
    btn.id = 'carritoBtn';
    btn.type = 'button';
    btn.className = acciones ? 'carrito-btn-header' : 'carrito-btn-flotante';
    btn.setAttribute('aria-label', 'Ver carrito de compras');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6"/></svg><span class="carrito-contador" id="carritoContador">0</span>';

    if (acciones) acciones.insertBefore(btn, acciones.firstChild);
    else document.body.appendChild(btn);

    // Cajón lateral
    const drawer = document.createElement('div');
    drawer.id = 'carritoDrawer';
    drawer.className = 'carrito-drawer';
    drawer.innerHTML =
      '<div class="carrito-overlay" data-cerrar></div>' +
      '<aside class="carrito-panel" role="dialog" aria-label="Carrito de compras">' +
      '  <header class="carrito-head">' +
      '    <h3>Tu pedido</h3>' +
      '    <button type="button" class="carrito-cerrar" data-cerrar aria-label="Cerrar">&times;</button>' +
      '  </header>' +
      '  <div class="carrito-items" id="carritoItems"></div>' +
      '  <footer class="carrito-pie">' +
      '    <div class="carrito-total"><span>Total</span><strong id="carritoTotal">$0</strong></div>' +
      '    <p class="carrito-nota">Pago seguro con <strong>PSE</strong> y <strong>tarjetas</strong>.</p>' +
      '    <a class="btn-pill btn-pink carrito-pagar" id="carritoPagar" href="checkout.html">Comprar ahora</a>' +
      '  </footer>' +
      '</aside>';
    document.body.appendChild(drawer);

    btn.addEventListener('click', abrir);
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-cerrar]')) cerrar();
      const menos = e.target.closest('[data-menos]');
      const mas = e.target.closest('[data-mas]');
      const del = e.target.closest('[data-quitar]');
      if (menos) cambiarCantidad(menos.dataset.menos, Number(menos.dataset.cant) - 1);
      if (mas) cambiarCantidad(mas.dataset.mas, Number(mas.dataset.cant) + 1);
      if (del) quitar(del.dataset.quitar);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrar();
    });
  }

  function pintarTodo() {
    const contador = document.getElementById('carritoContador');
    const n = unidades();
    if (contador) {
      contador.textContent = n;
      contador.classList.toggle('vacio', n === 0);
    }

    const items = document.getElementById('carritoItems');
    if (items) {
      const ls = lineas();
      if (!ls.length) {
        items.innerHTML =
          '<div class="carrito-vacio">' +
          '<p>Tu carrito está vacío.</p>' +
          '<p class="carrito-vacio-sub">Explora el catálogo y agrega tus favoritos.</p>' +
          '</div>';
      } else {
        items.innerHTML = ls
          .map(
            (l) =>
              '<article class="carrito-item">' +
              '<img src="' + l.imagen + '" alt="' + l.nombre + '" loading="lazy">' +
              '<div class="carrito-item-info">' +
              '<h4>' + l.nombre + '</h4>' +
              '<p class="carrito-item-precio">' + cop(l.precio) + '</p>' +
              '<div class="carrito-cant">' +
              '<button type="button" data-menos="' + l.id + '" data-cant="' + l.cantidad + '" aria-label="Quitar uno">&minus;</button>' +
              '<span>' + l.cantidad + '</span>' +
              '<button type="button" data-mas="' + l.id + '" data-cant="' + l.cantidad + '" aria-label="Agregar uno">+</button>' +
              '</div>' +
              '</div>' +
              '<div class="carrito-item-der">' +
              '<strong>' + cop(l.subtotal) + '</strong>' +
              '<button type="button" class="carrito-quitar" data-quitar="' + l.id + '">Quitar</button>' +
              '</div>' +
              '</article>'
          )
          .join('');
      }
    }

    const total = document.getElementById('carritoTotal');
    if (total) total.textContent = cop(subtotal());

    const pagar = document.getElementById('carritoPagar');
    if (pagar) pagar.classList.toggle('desactivado', n === 0);

    // Reflejo del carrito en la página de checkout
    if (document.body.dataset.pagina === 'checkout' && typeof window.pintarCheckout === 'function') {
      window.pintarCheckout();
    }
  }

  function abrir() {
    const d = document.getElementById('carritoDrawer');
    if (d) d.classList.add('abierto');
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    const d = document.getElementById('carritoDrawer');
    if (d) d.classList.remove('abierto');
    document.body.style.overflow = '';
  }

  /* ---------- Arranque ---------- */
  function iniciar() {
    leer();
    montarUI();
    pintarTodo();

    // Delegación: cualquier [data-agregar] agrega al carrito.
    // Admite varios ids separados por coma (lo usan los kits, que llevan
    // dos productos en un solo botón): data-agregar="1134526,1147568".
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-agregar]');
      if (!el) return;
      e.preventDefault();
      const ids = String(el.dataset.agregar)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      let agregado = false;
      ids.forEach((id) => {
        if (agregar(id)) agregado = true;
      });
      if (agregado) abrir();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  // API pública (la usa checkout.html)
  window.BeauTenCarrito = {
    agregar: agregar,
    quitar: quitar,
    cambiarCantidad: cambiarCantidad,
    vaciar: vaciar,
    lineas: lineas,
    subtotal: subtotal,
    unidades: unidades,
    cop: cop,
    abrir: abrir,
    cerrar: cerrar,
    refrescar: () => {
      leer();
      pintarTodo();
    }
  };
})();
