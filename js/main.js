/* ============================================================
   BeauTen Colombia — PWA (main.js)
   Menú móvil, filtros, animaciones scroll, PWA install, extras
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Menú móvil ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    mainNav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- Animación de entrada (estilo WOW fadeInUp) ---------- */
  const fadeEls = document.querySelectorAll('.wow-fade');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach((el) => io.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- Filtros de catálogo (best sellers) ---------- */
  const pills = document.querySelectorAll('#filterPills .pill');
  const cards = document.querySelectorAll('#bestGrid .product-card');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const f = pill.dataset.filter;
      cards.forEach((card) => {
        const match = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hidden', !match);
        if (match && !card.classList.contains('visible')) {
          card.classList.add('visible');
        }
      });
    });
  });

  /* ---------- Back to top ---------- */
  const backTop = document.getElementById('backTop');
  if (backTop) {
    const onScroll = () => {
      backTop.classList.toggle('show', window.scrollY > 480);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Año en el footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Registro del Service Worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Service Worker no se pudo registrar:', err);
      });
    });
  }

  /* ---------- Instalación PWA: sin pop-ups automáticos ----------
     El modal SOLO se abre cuando el usuario hace clic en
     "Instalar la app" (sección contacto o footer). Nunca bloquea
     la página al entrar. Cierre por X, tecla ESC o clic fuera. */
  let deferredPrompt = null;
  let appInstalled = false;

  const installModal = document.getElementById('installModal');
  const modalClose = document.getElementById('modalClose');
  const modalDo = document.getElementById('modalDo');
  const modalSteps = document.getElementById('modalSteps');
  const modalHint = document.getElementById('modalHint');
  const installCta = document.getElementById('installCta');
  const footerInstall = document.getElementById('footerInstall');
  const footerInstallHelp = document.getElementById('footerInstallHelp');

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isSecure = window.isSecureContext;
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])/.test(location.hostname);
  // Para instalar la app el sitio debe servirse por HTTPS (localhost es la
  // excepción que permite probar en el PC).
  const canInstallByProtocol = isSecure || isLocalhost;

  const detectOS = () => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  };

  const stepsByOS = {
    android: [
      { t: 'Esta página debe abrirse en Chrome (o tu navegador).' },
      { t: 'Toca el menú ⋮ (arriba a la derecha).' },
      { t: 'Selecciona "Agregar a pantalla de inicio" o "Instalar aplicación".' },
      { t: 'Confirma y listo: BeauTen quedará en tu inicio como una app.' }
    ],
    ios: [
      { t: 'Abre esta página en Safari (el navegador de Apple).' },
      { t: 'Toca el botón Compartir (cuadro con flecha hacia arriba).' },
      { t: 'Desliza hacia abajo y toca "Agregar a pantalla de inicio".' },
      { t: 'Toca "Agregar" y listo: BeauTen quedará en tu inicio.' }
    ],
    desktop: [
      { t: 'Chrome / Edge: haz clic en el icono de instalar (monitor con +) en la barra de direcciones.' },
      { t: 'O abre el menú ⋮ → "Instalar BeauTen Colombia…".' },
      { t: 'Confirma en el diálogo y la app se abrirá en su propia ventana.' }
    ]
  };

  const renderSteps = () => {
    if (!modalSteps) return;
    const os = detectOS();
    modalSteps.innerHTML = stepsByOS[os]
      .map((s, i) => '<div class="step"><span>' + (i + 1) + '</span><p>' + s.t + '</p></div>')
      .join('');
  };

  const openModal = () => {
    if (!installModal) return;
    renderSteps();
    // Si el navegador SÍ puede instalar de forma nativa, mostramos el botón directo.
    if (deferredPrompt && !isIOS) {
      if (modalDo) modalDo.hidden = false;
      if (modalHint) modalHint.hidden = true;
    } else {
      if (modalDo) modalDo.hidden = true;
      if (modalHint) modalHint.hidden = false;
    }
    // Aviso importante: sin HTTPS no se puede instalar (archivo local o http).
    let warn = document.getElementById('modalWarn');
    if (!canInstallByProtocol && !warn) {
      const w = document.createElement('div');
      w.id = 'modalWarn';
      w.className = 'modal-warn';
      w.innerHTML = '<strong>Importante:</strong> para instalar, esta página debe abrirse por <strong>HTTPS</strong> (no como archivo local ni por http). Cuando la publiques en un dominio seguro, vuelve a abrirla desde ahí.';
      modalSteps.parentNode.insertBefore(w, modalSteps);
    } else if (warn) {
      warn.hidden = canInstallByProtocol;
    }
    installModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (installModal) installModal.hidden = true;
    document.body.style.overflow = '';
  };

  const closeIfStandalone = () => {
    if (isStandalone || appInstalled) {
      // La app ya está instalada/en uso: el botón avisa, no molesta.
      if (installCta) {
        installCta.querySelector('span').textContent = 'App instalada ✓';
        installCta.disabled = true;
      }
      if (footerInstall) footerInstall.textContent = 'App instalada ✓';
    }
  };

  /* --- Capturar el evento nativo (Android/Chrome) sin mostrar nada --- */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    appInstalled = true;
    deferredPrompt = null;
    closeIfStandalone();
    console.log('BeauTen instalada correctamente');
  });

  /* --- Cierres del modal: X, clic fuera y tecla ESC --- */
  if (installModal && modalClose) {
    modalClose.addEventListener('click', closeModal);
    installModal.addEventListener('click', (e) => {
      if (e.target === installModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !installModal.hidden) closeModal();
    });
  }

  /* --- Botón nativo dentro del modal (si el navegador lo permite) --- */
  if (modalDo) {
    modalDo.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      closeModal();
      if (choice.outcome === 'accepted') {
        appInstalled = true;
        closeIfStandalone();
      }
    });
  }

  /* --- Acciones de los botones "Instalar la app" --- */
  const handleInstallClick = (e) => {
    e.preventDefault();
    if (appInstalled || isStandalone) {
      openModal(); // muestra el estado "ya instalada" (por si acaso)
      return;
    }
    if (deferredPrompt && !isIOS) {
      // Instalación nativa disponible: la lanzamos directo.
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        deferredPrompt = null;
        if (choice.outcome === 'accepted') {
          appInstalled = true;
          closeIfStandalone();
        }
      });
    } else {
      // iOS o navegadores sin evento nativo → guía paso a paso.
      openModal();
    }
  };

  if (installCta) installCta.addEventListener('click', handleInstallClick);
  if (footerInstall) footerInstall.addEventListener('click', handleInstallClick);
  if (footerInstallHelp) {
    footerInstallHelp.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  }

  closeIfStandalone();
})();

/* ============================================================
   Catálogo real BeauTen — render desde window.BEAUTEN_PRODUCTOS
   + registro de pedidos → exportación CSV formato Dropi
   ============================================================ */
(function () {
  'use strict';

  const PRODUCTOS = window.BEAUTEN_PRODUCTOS || [];
  const grid = document.getElementById('catalogoGrid');
  const pillsBox = document.getElementById('filterPills');
  const WA = '573181738642';
  const fmt = (n) => '$' + n.toLocaleString('es-CO');
  const LS_KEY = 'beauten_pedidos_v1';

  if (!grid || !PRODUCTOS.length) return;

  /* ---------- Render de tarjetas ---------- */
  const cardHTML = (p) => {
    const tag = p.tag ? '<span class="prod-tag">' + p.tag + '</span>' : '';
    const was = p.precioAntes ? '<span class="was">' + fmt(p.precioAntes) + '</span>' : '';
    // Tope de 5: Math.round(4.9) ya da 5, no hay que sumar otra.
    const estrellas = '★'.repeat(Math.min(5, Math.round(p.rating)));
    // Los productos sin reseñas todavía no muestran estrellas ni valoración:
    // así no se enseña un "0.0 (0)" que reste confianza ni un dato inventado.
    const rating = Number(p.reviews) > 0
      ? '<div class="prod-rating"><span>' + estrellas + '</span><strong>' + Number(p.rating).toFixed(1) + '</strong><small>(' + p.reviews + ')</small></div>'
      : '';
    const msg = encodeURIComponent(
      'Hola BeauTen 👋 quiero pedir el producto *' + p.nombre +
      '*\n📦 ID Dropi: ' + p.id +
      '\n🏭 Proveedor: ' + p.proveedor +
      '\n💄 Beneficio: ' + p.beneficio +
      '\n💰 Valor: ' + fmt(p.precio) +
      '\n\nMi nombre es:\nMi ciudad y dirección:\nMi teléfono:'
    );
    return (
      '<article class="product-card wow-fade visible" data-cat="' + p.nicho + '">' +
        '<a class="prod-img" href="producto.html?id=' + encodeURIComponent(p.id) + '" aria-label="Ver ' + p.nombre + '">' +
          '<img src="' + p.imagen + '" alt="' + p.nombre + '" loading="lazy">' +
          tag +
        '</a>' +
        '<div class="prod-body">' +
          '<h3><a href="producto.html?id=' + encodeURIComponent(p.id) + '">' + p.nombre + '</a></h3>' +
          '<p class="prod-benefit">' + p.beneficio + '</p>' +
           '<p class="prod-desc">' + p.descripcion + '</p>' +
           rating +
           '<div class="prod-price">' + was + '<span class="now">' + fmt(p.precio) + '</span></div>' +
          '<div class="prod-cta-row">' +
            '<button type="button" class="btn-pill btn-small btn-comprar" data-agregar="' + p.id + '"><span>Agregar al carrito</span></button>' +
            '<p class="prod-trust">✔ Pago 100% seguro · Envío a todo el país</p>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  };

  grid.innerHTML = PRODUCTOS.map(cardHTML).join('');

  /* ---------- Top 3 más vendidos → sección "Encuentra tu favorita" ----------
     Se renderizan desde el mismo catálogo y con el mismo patrón de tarjeta,
     para que precio, imagen y mensaje de WhatsApp queden siempre sincronizados. */
  const topGrid = document.getElementById('topGrid');
  if (topGrid) {
    const TOP3 = ['930584', '1134526', '729188'];
    topGrid.innerHTML = TOP3
      .map((id) => PRODUCTOS.find((p) => p.id === id))
      .filter(Boolean)
      .map(cardHTML)
      .join('');
  }

  /* ---------- Filtros por nicho ---------- */
  const nichos = ['all'].concat([...new Set(PRODUCTOS.map((p) => p.nicho))]);
  if (pillsBox) {
    pillsBox.innerHTML = nichos
      .map((n, i) => '<button class="pill' + (i === 0 ? ' active' : '') + '" data-filter="' + n + '">' + (n === 'all' ? 'Todos' : n) + '</button>')
      .join('');
    const cards = grid.querySelectorAll('.product-card');
    pillsBox.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        pillsBox.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const f = pill.dataset.filter;
        cards.forEach((card) => {
          const match = f === 'all' || card.dataset.cat === f;
          card.classList.toggle('hidden', !match);
        });
      });
    });
  }

  /* ---------- Registro de pedidos (operador) ---------- */
  const adminPanel = document.getElementById('adminPanel');
  const btnToggle = document.getElementById('btnToggleAdmin');
  const btnExport = document.getElementById('btnExportCsv');
  const btnAdd = document.getElementById('btnAddPedido');
  const btnClear = document.getElementById('btnClearPedidos');
  const adminStatus = document.getElementById('adminStatus');

  const loadPedidos = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; }
  };
  const savePedidos = (list) => localStorage.setItem(LS_KEY, JSON.stringify(list));

  if (btnToggle && adminPanel) {
    btnToggle.addEventListener('click', () => {
      const show = adminPanel.hidden;
      adminPanel.hidden = !show;
      btnToggle.textContent = show ? 'Operador: ocultar registro de pedidos' : 'Operador: registrar pedidos para Dropi ▾';
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const p = PRODUCTOS[Math.floor(Math.random() * PRODUCTOS.length)];
      const list = loadPedidos();
      list.push({
        fecha: new Date().toISOString().slice(0, 10),
        nombres: 'Cliente',
        apellidos: 'Prueba',
        direccion: 'Calle 1 #2-3 Centro',
        departamento: 'Valle del Cauca',
        ciudad: 'Cali',
        telefono: '3001234567',
        idProducto: p.id,
        cantidad: 1,
        precioTotal: String(p.precio),
        conRecaudo: '1'
      });
      savePedidos(list);
      if (adminStatus) adminStatus.textContent = 'Pedido añadido: ' + p.nombre + ' (ID ' + p.id + ') — total registrados: ' + list.length;
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      savePedidos([]);
      if (adminStatus) adminStatus.textContent = 'Lista de pedidos limpiada.';
    });
  }

  /* ---------- Exportación CSV formato oficial Dropi ---------- */
  const CSV_HEADERS = [
    'NOMBRES', 'APELLIDOS', 'DIRECCIÓN Y BARRIO', 'DEPARTAMENTO', 'CIUDAD',
    'TELÉFONO', 'ID DE PRODUCTO', 'CANTIDAD', 'PRECIO TOTAL (SIN PUNTOS NI COMAS)',
    'CON RECAUDO', 'NOTA', 'EMAIL (OPCIONAL)', 'ID DE VARIABLE (OPCIONAL)',
    'CODIGO POSTAL (OPCIONAL)', 'TRANSPORTADORA (OPCIONAL)', 'CEDULA (OPCIONAL)',
    'COLONIA (OBLIGATORIO SOLO PARA QUIKEN)', 'SEGURO (SOLO APLICA PARA ENVIA)'
  ];

  const csvEscape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const list = loadPedidos();
      if (!list.length) {
        if (adminStatus) adminStatus.textContent = 'No hay pedidos registrados aún. Añade al menos uno.';
        return;
      }
      const filas = list.map((o) =>
        [o.nombres, o.apellidos, o.direccion, o.departamento, o.ciudad, o.telefono,
         o.idProducto, o.cantidad, o.precioTotal, o.conRecaudo, o.nota || '',
         '', '', '', '', o.cedula || '', '', ''].map(csvEscape).join(';')
      );
      const contenido = '\uFEFF' + CSV_HEADERS.join(';') + '\n' + filas.join('\n');
      const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pedidos-beauten-dropi-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (adminStatus) adminStatus.textContent = 'CSV exportado (' + list.length + ' pedidos). Súbelo en Dropi: Mis Pedidos → Carga masiva de órdenes.';
    });
  }

  /* Re-observar las nuevas tarjetas para animación */
  const fadeEls = grid.querySelectorAll('.wow-fade');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    fadeEls.forEach((el) => io.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('visible'));
  }
})();
