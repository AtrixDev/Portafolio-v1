/* ============================================================
   PROGRAMACION-UX.JS — Demos "Así no / Así sí" de las Buenas prácticas UX del Lab
   Cada regla se prueba en vivo: dos mini interfaces reales, la que la rompe y la que la cumple.
   Se registra en programacion-demos.js (WLDemos.agregar). Contenido de ejemplo, rotulado como tal.
   ============================================================ */
(function () {
  if (!window.WLDemos) return;
  const { bloque, notas, escH } = WLDemos.util;
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dos paneles lado a lado. tipo = montador que les da vida (data-ux).
  const par = (tipo, prueba, malo, bueno, extra = '') => `<div class="ux" data-ux="${tipo}">
    <p class="ux-prueba"><b>Probá:</b> ${prueba}</p>
    <div class="ux-par">
      <section class="ux-lado" data-lado="mal"><h4>Así no</h4><div class="ux-in">${malo}</div></section>
      <section class="ux-lado" data-lado="bien"><h4>Así sí</h4><div class="ux-in">${bueno}</div></section>
    </div>${extra}</div>`;
  const demo = (titulo, cuerpo, pie, ns) => () => bloque(titulo, cuerpo + (ns ? notas('Por qué', ns) : ''), pie);

  // ── Contenidos reutilizados ──
  const formError = bien => `<form class="ux-form" novalidate onsubmit="return false">
      <label${bien ? '' : ' class="sr-only-vis"'}>Email</label>
      <input type="email" value="dario@gmail" ${bien ? 'aria-describedby="ux-e1"' : 'aria-label="Email"'} data-err>
      ${bien ? '<p class="ux-err" id="ux-e1" role="alert" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 7v6M12 16.5v.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>Falta el final del email: por ejemplo, <b>.com</b></p>' : ''}
      <button type="submit" class="ux-btn">Enviar</button></form>`;

  const D = {
    'ux/1-smooth-scroll': demo('Probalo', par('scroll', 'tocá "Ver precios" en cada panel.',
      `<div class="ux-scroller"><a href="#" data-ir>Ver precios</a><div class="ux-relleno"></div><h5 data-destino>Precios</h5><p>Desde $38.900</p></div>`,
      `<div class="ux-scroller"><a href="#" data-ir data-suave>Ver precios</a><div class="ux-relleno"></div><h5 data-destino>Precios</h5><p>Desde $38.900</p></div>`),
      'El salto de golpe desorienta: no sabés si bajaste o cambiaste de página. Con scroll suave se ve el recorrido. Si la persona pidió reducir el movimiento, se respeta.',
      [['', 'Una línea de CSS', 'html { scroll-behavior: smooth } y listo. Con JavaScript: scrollIntoView({ behavior: "smooth" }).'], ['', 'Salvo que pidan menos movimiento', 'Dentro de @media (prefers-reduced-motion: reduce), volvé al salto directo.']]),

    'ux/4-back-button': demo('Probalo', par('atras', 'entrá a un producto y después tocá la flecha "atrás" del navegador de juguete.',
      `<div class="ux-nav" data-modo="replace"><div class="ux-nav-bar"><button type="button" data-back aria-label="Atrás">←</button><span data-url>tienda.com/productos</span></div><div class="ux-nav-pag" data-pag></div></div>`,
      `<div class="ux-nav" data-modo="push"><div class="ux-nav-bar"><button type="button" data-back aria-label="Atrás">←</button><span data-url>tienda.com/productos</span></div><div class="ux-nav-pag" data-pag></div></div>`),
      'Si la web cambia de pantalla sin guardar el historial, "atrás" te saca de la tienda en lugar de volver al listado.',
      [['', 'history.pushState', 'Cada pantalla nueva (un producto, un filtro) se guarda en el historial.'], ['', 'Así también se comparte', 'La URL cambia con la pantalla: se puede copiar y mandar por WhatsApp.']]),

    'ux/7-excessive-motion': demo('Probalo', par('movimiento', 'mirá cada panel unos segundos. ¿Dónde se entiende qué es lo importante?',
      `<div class="ux-mov is-mucho"><span class="ux-badge">¡OFERTA!</span><b>Mandolina V5</b><span class="ux-chip">Envío gratis</span><span class="ux-chip">6 cuotas</span><span class="ux-btn">Comprar</span></div>`,
      `<div class="ux-mov is-uno"><span class="ux-badge">Oferta</span><b>Mandolina V5</b><span class="ux-chip">Envío gratis</span><span class="ux-chip">6 cuotas</span><span class="ux-btn">Comprar</span><button type="button" class="ux-link" data-replay>Ver la entrada otra vez</button></div>`),
      'Cuando todo se mueve, nada destaca y cansa la vista. Una sola animación, que se ve una vez, guía la mirada al botón.'),

    'ux/9-reduced-motion': demo('Probalo', par('reducido', 'activá "reducir movimiento", como lo tiene configurado mucha gente en el celular.',
      `<div class="ux-par-mov"><div class="ux-orbita"><i></i></div><p>Ignora tu preferencia: sigue girando.</p></div>`,
      `<div class="ux-par-mov" data-respeta><div class="ux-orbita"><i></i></div><p>Respeta tu preferencia: se detiene.</p></div>`,
      `<button type="button" class="dm-play" data-simular aria-pressed="false">Simular "reducir movimiento"</button>`),
      'Hay gente a la que las animaciones le generan mareo o migraña, y lo avisa desde la configuración del sistema. Tu web lo puede leer con una media query.',
      [['', '@media (prefers-reduced-motion: reduce)', 'Adentro, sacá los desplazamientos y dejá, como mucho, cambios de opacidad.']]),

    'ux/10-loading-states': demo('Probalo', par('carga', 'tocá "Cargar productos" en los dos.',
      `<button type="button" class="ux-btn" data-cargar>Cargar productos</button><div class="ux-lista" data-lista></div>`,
      `<button type="button" class="ux-btn" data-cargar data-esqueleto>Cargar productos</button><div class="ux-lista" data-lista></div>`),
      'Un espacio en blanco parece un error. El esqueleto muestra que algo viene y con qué forma, y la espera se siente más corta.'),

    'ux/11-hover-vs-tap': demo('Probalo', par('hover', 'activá "modo celular" y tratá de abrir el menú "Categorías" en los dos.',
      `<div class="ux-menu" data-solo-hover><button type="button" class="ux-btn is-sec">Categorías ▾</button><ul hidden><li>Cocina</li><li>Bazar</li><li>Electro</li></ul></div>`,
      `<div class="ux-menu"><button type="button" class="ux-btn is-sec" aria-expanded="false">Categorías ▾</button><ul hidden><li>Cocina</li><li>Bazar</li><li>Electro</li></ul></div>`,
      `<button type="button" class="dm-play" data-tactil aria-pressed="false">Modo celular (sin mouse)</button>`),
      'En el celular no existe "pasar el mouse". Un menú que solo abre con hover es un menú que no abre.'),

    'ux/15-z-index-management': demo('Probalo', par('zindex', 'abrí el menú "Mi cuenta" en los dos.',
      `<div class="ux-zi"><div class="ux-zi-head" style="z-index:9999">Barra fija (z-index: 9999)</div><div class="ux-menu is-abajo" style="z-index:50"><button type="button" class="ux-btn is-sec" data-toggle>Mi cuenta ▾</button><ul hidden style="z-index:100"><li>Mis compras</li><li>Favoritos</li><li>Salir</li></ul></div></div>`,
      `<div class="ux-zi"><div class="ux-zi-head" style="z-index:20">Barra fija (capa 20)</div><div class="ux-menu is-abajo" style="z-index:30"><button type="button" class="ux-btn is-sec" data-toggle>Mi cuenta ▾</button><ul hidden><li>Mis compras</li><li>Favoritos</li><li>Salir</li></ul></div></div>`),
      'Con números al azar (9999, 100, 50) siempre aparece algo que tapa a otra cosa. Una escala chica y fija (10 contenido, 20 barra, 30 menús, 50 modales) evita las peleas.'),

    'ux/19-content-jumping': demo('Probalo', par('salto', 'tocá "Recargar" y tratá de tocar "Comprar" apenas aparece.',
      `<div class="ux-salto"><p>Mandolina V5 · $38.900</p><div class="ux-foto" data-foto></div><button type="button" class="ux-btn" data-comprar>Comprar</button><p class="ux-mini" data-res></p></div>`,
      `<div class="ux-salto"><p>Mandolina V5 · $38.900</p><div class="ux-foto is-reserva" data-foto></div><button type="button" class="ux-btn" data-comprar>Comprar</button><p class="ux-mini" data-res></p></div>`,
      `<button type="button" class="dm-play" data-recargar>Recargar</button>`),
      'Si la foto no tiene medidas, llega tarde y empuja todo para abajo: el dedo termina tocando otra cosa. Reservar el lugar (width/height o aspect-ratio) lo evita.'),

    'ux/28-focus-states': demo('Probalo', par('foco', 'hacé clic en el primer botón de cada panel y después apretá Tab varias veces.',
      `<div class="ux-fila is-sin-foco"><button type="button" class="ux-btn">Inicio</button><button type="button" class="ux-btn is-sec">Productos</button><button type="button" class="ux-btn is-sec">Contacto</button></div>`,
      `<div class="ux-fila is-con-foco"><button type="button" class="ux-btn">Inicio</button><button type="button" class="ux-btn is-sec">Productos</button><button type="button" class="ux-btn is-sec">Contacto</button></div>`),
      'Quien navega con teclado (muchos usuarios de computadora y todos los que no pueden usar mouse) necesita ver dónde está. Sacar el contorno sin reemplazo lo deja a ciegas.'),

    'ux/32-loading-buttons': demo('Probalo', par('pago', 'tocá "Pagar" varias veces seguidas, rápido.',
      `<button type="button" class="ux-btn" data-pagar>Pagar $38.900</button><p class="ux-mini" data-pedidos>Pedidos creados: 0</p>`,
      `<button type="button" class="ux-btn" data-pagar data-bloquea>Pagar $38.900</button><p class="ux-mini" data-pedidos>Pedidos creados: 0</p>`),
      'Si el botón sigue activo mientras procesa, cada toque impaciente crea un pedido más (y un cobro más). Deshabilitarlo y mostrar que está trabajando lo evita.'),

    'ux/33-error-feedback': demo('Probalo', par('error', 'tocá "Enviar" en los dos con el email incompleto.', formError(false), formError(true)),
      'Un borde rojo solo no dice qué pasó ni cómo arreglarlo, y quien no distingue el rojo ni lo ve. El mensaje explica, está al lado del campo y lo anuncian los lectores de pantalla.'),

    'ux/35-confirmation-dialogs': demo('Probalo', par('borrar', 'borrá una publicación en cada panel.',
      `<ul class="ux-items" data-items><li>Mandolina V5 <button type="button" class="ux-x" aria-label="Borrar">Borrar</button></li><li>Set de cuchillos <button type="button" class="ux-x" aria-label="Borrar">Borrar</button></li><li>Olla 24 cm <button type="button" class="ux-x" aria-label="Borrar">Borrar</button></li></ul>`,
      `<ul class="ux-items" data-items data-deshacer><li>Mandolina V5 <button type="button" class="ux-x" aria-label="Borrar">Borrar</button></li><li>Set de cuchillos <button type="button" class="ux-x" aria-label="Borrar">Borrar</button></li><li>Olla 24 cm <button type="button" class="ux-x" aria-label="Borrar">Borrar</button></li></ul><p class="ux-toast" data-toast hidden></p>`),
      'Borrar sin aviso castiga el error de un toque. Para acciones que se pueden revertir, "Deshacer" es mejor que un cartel de "¿Estás seguro?": no frena a quien sabe lo que hace.'),

    'ux/37-color-only': demo('Probalo', par('color', 'activá "ver sin colores" (así ve el estado quien no distingue rojo y verde).',
      `<ul class="ux-est"><li><i style="background:#16a34a"></i>Pedido 1024</li><li><i style="background:#dc2626"></i>Pedido 1025</li><li><i style="background:#16a34a"></i>Pedido 1026</li></ul>`,
      `<ul class="ux-est"><li><i style="background:#16a34a"></i>Pedido 1024 · <b>Entregado</b> ✓</li><li><i style="background:#dc2626"></i>Pedido 1025 · <b>Demorado</b> ⚠</li><li><i style="background:#16a34a"></i>Pedido 1026 · <b>Entregado</b> ✓</li></ul>`,
      `<button type="button" class="dm-play" data-gris aria-pressed="false">Ver sin colores</button>`),
      'Alrededor de 1 de cada 12 hombres no distingue bien rojo y verde. Si el estado solo está en el color, para ellos no está.'),

    'ux/38-alt-text': demo('Probalo', par('lector', 'tocá "Escuchar" para ver qué dice un lector de pantalla en cada caso.',
      `<figure class="ux-fig"><div class="ux-foto is-lista" role="img" aria-label="IMG_2034.jpg"></div><button type="button" class="ux-btn is-sec" data-leer="imagen, IMG_2034.jpg">Escuchar</button><p class="ux-voz" data-voz></p></figure>`,
      `<figure class="ux-fig"><div class="ux-foto is-lista" role="img" aria-label="Mandolina Börner V5 cortando papas en bastones"></div><button type="button" class="ux-btn is-sec" data-leer="imagen, Mandolina Börner V5 cortando papas en bastones">Escuchar</button><p class="ux-voz" data-voz></p></figure>`),
      'El texto alternativo es lo que "ve" quien no ve, y lo que lee Google Imágenes. Describí lo que muestra la foto, no el nombre del archivo.'),

    'ux/40-aria-labels': demo('Probalo', par('lector', 'tocá "Escuchar" en cada botón con ícono.',
      `<div class="ux-fila"><span class="ux-ico">✕</span><button type="button" class="ux-btn is-sec" data-leer="botón">Escuchar</button></div><p class="ux-voz" data-voz></p>`,
      `<div class="ux-fila"><span class="ux-ico">✕</span><button type="button" class="ux-btn is-sec" data-leer="botón, Cerrar menú">Escuchar</button></div><p class="ux-voz" data-voz></p>`),
      'Un botón que solo tiene un ícono se anuncia como "botón", sin decir qué hace. aria-label le pone nombre.'),

    'ux/41-keyboard-navigation': demo('Probalo', par('foco', 'hacé clic arriba del panel y usá Tab para llegar a "Elegir talle" y abrirlo con Enter.',
      `<div class="ux-fila is-con-foco"><span class="ux-falso" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden">Elegir talle ▾</span><ul class="ux-opc" hidden><li>S</li><li>M</li><li>L</li></ul></div>`,
      `<div class="ux-fila is-con-foco"><button type="button" class="ux-btn is-sec" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden" aria-expanded="false">Elegir talle ▾</button><ul class="ux-opc" hidden><li>S</li><li>M</li><li>L</li></ul></div>`),
      'Un div con onclick no se puede alcanzar con Tab ni abrir con Enter. Un button sí, sin escribir nada más.'),

    'ux/44-error-messages': () => D['ux/33-error-feedback'](),
    'ux/54-input-labels': () => WLDemos.render({ id: '43-form-labels' }, 'ux'),

    'ux/46-image-optimization': demo('Probalo', par('peso', 'mirá cuánto tarda en llegar la misma foto con 4G.',
      `<div class="ux-peso"><b>foto.jpg · 4000 × 3000 px</b><span>2,8 MB</span><div class="ux-barra"><i data-seg="5.6"></i></div><p class="ux-mini">≈ 5,6 s con 4G (4 Mbps)</p></div>`,
      `<div class="ux-peso"><b>foto-480.webp · 480 × 360 px</b><span>38 KB</span><div class="ux-barra"><i data-seg="0.08"></i></div><p class="ux-mini">≈ 0,1 s con 4G (4 Mbps)</p></div>`,
      `<button type="button" class="dm-play" data-otra>Cargar otra vez</button>`),
      'Si en el celular la foto se ve de 400 px, mandar una de 4000 es hacer esperar al comprador por algo que no ve. Con srcset el navegador elige el tamaño justo, y WebP pesa mucho menos que JPG.'),

    'ux/61-submit-feedback': demo('Probalo', par('pago', 'tocá "Enviar consulta" en los dos.',
      `<button type="button" class="ux-btn" data-pagar data-silencio>Enviar consulta</button><p class="ux-mini" data-pedidos></p>`,
      `<button type="button" class="ux-btn" data-pagar data-bloquea data-texto="Enviar consulta">Enviar consulta</button><p class="ux-mini" data-pedidos></p>`),
      'Si al tocar "Enviar" no pasa nada visible, la persona no sabe si salió: vuelve a tocar o se va. Estado "Enviando…" y después "Listo" cierran la duda.'),

    'ux/67-readable-font-size': demo('Probalo', par('', 'leé la descripción en cada celular.',
      `<div class="ux-cel"><p style="font-size:11px">La Mandolina V5 corta, ralla y hace juliana con cinco insertos. Viene con protector de mano y se guarda en su caja.</p></div>`,
      `<div class="ux-cel"><p style="font-size:16px">La Mandolina V5 corta, ralla y hace juliana con cinco insertos. Viene con protector de mano y se guarda en su caja.</p></div>`),
      'Debajo de 16 px en el celular, mucha gente tiene que hacer zoom (y en iPhone, los campos de texto más chicos hacen zoom solos al tocarlos).'),

    'ux/68-viewport-meta': demo('Probalo', par('', 'compará cómo se ve la misma página en un celular.',
      `<div class="ux-cel is-980"><div class="ux-pag980"><h5>Brasa, parrilla de barrio</h5><p>Reservá tu mesa por WhatsApp. Martes a domingo de 20 a 00 h.</p><span class="ux-btn">Reservar</span></div></div>`,
      `<div class="ux-cel"><div class="ux-pag"><h5>Brasa, parrilla de barrio</h5><p>Reservá tu mesa por WhatsApp. Martes a domingo de 20 a 00 h.</p><span class="ux-btn">Reservar</span></div></div>`),
      'Sin la etiqueta viewport, el celular dibuja la página como si fuera una pantalla de 980 px y la achica: todo queda diminuto. Con una línea en el <head> se ve al tamaño real.'),

    'ux/69-horizontal-scroll': demo('Probalo', par('', 'tratá de leer la tabla en cada celular.',
      `<div class="ux-cel is-scroll"><table class="ux-tab" style="width:520px"><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Envío</th></tr><tr><td>Mandolina V5</td><td>$38.900</td><td>12</td><td>Gratis</td></tr></table></div>`,
      `<div class="ux-cel"><dl class="ux-dl"><div><dt>Producto</dt><dd>Mandolina V5</dd></div><div><dt>Precio</dt><dd>$38.900</dd></div><div><dt>Stock</dt><dd>12</dd></div><div><dt>Envío</dt><dd>Gratis</dd></div></dl></div>`),
      'Si algo es más ancho que la pantalla, toda la página se corre de costado y parece rota. En el celular, las tablas se reorganizan en filas.'),

    'ux/76-contrast-readability': () => WLDemos.render({ id: '36-color-contrast' }, 'ux'),
    'ux/66-touch-friendly': () => WLDemos.render({ id: '22-touch-target-size' }, 'ux'),
    'ux/78-loading-indicators': () => D['ux/10-loading-states'](),
    'ux/99-motion-sensitivity': () => D['ux/9-reduced-motion'](),

    'ux/92-disclaimer': demo('Probalo', par('', 'leé los dos chats.',
      `<div class="ux-chat"><p class="ux-chat-h">Sofía · Atención al cliente</p><p class="ux-msg">¡Hola! Soy Sofía 😊 ¿En qué te ayudo?</p></div>`,
      `<div class="ux-chat"><p class="ux-chat-h">Asistente virtual <span class="ux-ia">IA</span></p><p class="ux-msg">Hola, soy el asistente automático de la tienda. Te respondo al instante sobre envíos, stock y medidas.</p><button type="button" class="ux-link">Prefiero hablar con una persona</button></div>`),
      'Hacer pasar un bot por una persona se descubre enseguida y rompe la confianza. Decir que es IA y ofrecer una persona es honesto y, además, lo exigen cada vez más leyes.'),
  };

  // ═══════════════ Montadores ═══════════════
  const M = {
    scroll: el => el.querySelectorAll('[data-ir]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const box = a.closest('.ux-scroller'), dest = box.querySelector('[data-destino]');
      box.scrollTo({ top: dest.offsetTop - 8, behavior: a.hasAttribute('data-suave') && !reduce() ? 'smooth' : 'auto' });
      setTimeout(() => box.scrollTo({ top: 0 }), 2200);
    })),

    atras: el => el.querySelectorAll('.ux-nav').forEach(nav => {
      const hist = ['productos'], url = nav.querySelector('[data-url]'), pag = nav.querySelector('[data-pag]');
      let actual = 'productos';
      const pintar = () => {
        url.textContent = actual === 'fuera' ? 'google.com' : `tienda.com/${actual}`;
        pag.innerHTML = actual === 'productos' ? `<ul class="ux-items">${['Mandolina V5', 'Set de cuchillos', 'Olla 24 cm'].map(p => `<li><button type="button" class="ux-link" data-prod="${p}">${p}</button></li>`).join('')}</ul>`
          : actual === 'fuera' ? '<p class="ux-mini is-mal">Saliste de la tienda. Volviste a Google.</p>'
          : `<p><b>${escH(decodeURIComponent(actual.split('/')[1]))}</b></p><p class="ux-mini">Ficha del producto</p>`;
      };
      pag.addEventListener('click', e => { const b = e.target.closest('[data-prod]'); if (!b) return; actual = 'producto/' + encodeURIComponent(b.dataset.prod); if (nav.dataset.modo === 'push') hist.push(actual); pintar(); });
      nav.querySelector('[data-back]').addEventListener('click', () => {
        if (nav.dataset.modo === 'push' && hist.length > 1) { hist.pop(); actual = hist[hist.length - 1]; }
        else if (nav.dataset.modo === 'replace') actual = 'fuera';
        pintar();
      });
      pintar();
    }),

    movimiento: el => el.querySelector('[data-replay]')?.addEventListener('click', () => { const m = el.querySelector('.is-uno'); m.classList.remove('is-uno'); void m.offsetWidth; m.classList.add('is-uno'); }),

    reducido: el => el.querySelector('[data-simular]').addEventListener('click', e => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', on);
      el.querySelector('[data-respeta]').classList.toggle('is-quieto', on);
    }),

    carga: el => el.querySelectorAll('[data-cargar]').forEach(b => b.addEventListener('click', () => {
      const lista = b.nextElementSibling, esq = b.hasAttribute('data-esqueleto');
      lista.innerHTML = esq ? '<div class="ux-sk"></div><div class="ux-sk"></div><div class="ux-sk"></div>' : '';
      setTimeout(() => { lista.innerHTML = ['Mandolina V5 · $38.900', 'Set de cuchillos · $52.400', 'Olla 24 cm · $29.900'].map(t => `<div class="ux-it">${t}</div>`).join(''); }, 1800);
    })),

    hover: el => {
      let tactil = false;
      el.querySelector('[data-tactil]').addEventListener('click', e => { tactil = !tactil; e.currentTarget.setAttribute('aria-pressed', tactil); el.classList.toggle('is-tactil', tactil); el.querySelectorAll('.ux-menu ul').forEach(u => u.hidden = true); });
      el.querySelectorAll('.ux-menu').forEach(m => {
        const ul = m.querySelector('ul'), b = m.querySelector('button');
        if (m.hasAttribute('data-solo-hover')) { m.addEventListener('mouseenter', () => { if (!tactil) ul.hidden = false; }); m.addEventListener('mouseleave', () => { ul.hidden = true; }); }
        else b.addEventListener('click', () => { ul.hidden = !ul.hidden; b.setAttribute('aria-expanded', !ul.hidden); });
      });
    },

    zindex: el => el.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => { const u = b.nextElementSibling; u.hidden = !u.hidden; })),

    salto: el => {
      const correr = () => el.querySelectorAll('.ux-salto').forEach(s => {
        const f = s.querySelector('[data-foto]'), res = s.querySelector('[data-res]');
        f.classList.remove('is-lista'); res.textContent = ''; s.dataset.t = Date.now();
        setTimeout(() => f.classList.add('is-lista'), 700);
      });
      el.querySelectorAll('.ux-salto').forEach(s => {
        s.addEventListener('pointerdown', e => {
          if (Date.now() - (+s.dataset.t || 0) > 2500) return;
          const res = s.querySelector('[data-res]');
          res.textContent = e.target.closest('[data-comprar]') ? 'Tocaste "Comprar".' : 'Se corrió: tocaste la foto, no "Comprar".';
          res.className = 'ux-mini ' + (e.target.closest('[data-comprar]') ? 'is-bien' : 'is-mal');
        });
        s.querySelector('[data-foto]').classList.add('is-lista');
      });
      el.querySelector('[data-recargar]').addEventListener('click', correr);
    },

    foco: () => {},

    pago: el => el.querySelectorAll('[data-pagar]').forEach(b => {
      let n = 0; const out = b.nextElementSibling, texto = b.dataset.texto || b.textContent;
      b.addEventListener('click', () => {
        if (b.hasAttribute('data-silencio')) { setTimeout(() => {}, 1500); return; }
        if (b.hasAttribute('data-bloquea')) {
          b.disabled = true; b.innerHTML = '<span class="ux-spin" aria-hidden="true"></span>Procesando…';
          setTimeout(() => { n++; b.textContent = '✓ Listo'; out.textContent = texto.startsWith('Enviar') ? 'Consulta enviada. Te respondemos en el día.' : `Pedidos creados: ${n}`; out.className = 'ux-mini is-bien'; setTimeout(() => { b.disabled = false; b.textContent = texto; }, 1600); }, 1400);
        } else { setTimeout(() => { n++; out.textContent = `Pedidos creados: ${n}`; out.className = 'ux-mini' + (n > 1 ? ' is-mal' : ''); }, 900); }
      });
    }),

    error: el => el.querySelectorAll('.ux-form').forEach(f => f.addEventListener('submit', () => {
      const i = f.querySelector('[data-err]'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.value), msg = f.querySelector('.ux-err');
      i.classList.toggle('is-err', !ok); i.setAttribute('aria-invalid', !ok);
      if (msg) msg.hidden = ok;
      if (!ok) i.focus();
    })),

    borrar: el => el.querySelectorAll('[data-items]').forEach(ul => {
      const toast = ul.parentElement.querySelector('[data-toast]');
      ul.addEventListener('click', e => {
        const b = e.target.closest('.ux-x'); if (!b) return;
        const li = b.closest('li');
        if (!ul.hasAttribute('data-deshacer')) { li.remove(); return; }
        const pos = [...ul.children].indexOf(li); li.remove();
        toast.hidden = false; toast.innerHTML = `Borraste "${escH(li.firstChild.textContent.trim())}". <button type="button" class="ux-link">Deshacer</button>`;
        const t = setTimeout(() => { toast.hidden = true; }, 5000);
        toast.querySelector('button').onclick = () => { clearTimeout(t); ul.insertBefore(li, ul.children[pos] || null); toast.hidden = true; };
      });
    }),

    color: el => el.querySelector('[data-gris]').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); el.classList.toggle('is-gris', on); }),

    lector: el => el.querySelectorAll('[data-leer]').forEach(b => b.addEventListener('click', () => {
      const voz = b.closest('.ux-lado').querySelector('[data-voz]');
      voz.textContent = '🔊 “' + b.dataset.leer + '”';
      try { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(b.dataset.leer); u.lang = 'es-AR'; speechSynthesis.speak(u); } } catch (err) {}
    })),

    peso: el => {
      const correr = () => el.querySelectorAll('[data-seg]').forEach(i => { i.style.transition = 'none'; i.style.transform = 'scaleX(0)'; void i.offsetWidth; i.style.transition = `transform ${i.dataset.seg}s linear`; i.style.transform = 'scaleX(1)'; });
      el.querySelector('[data-otra]').addEventListener('click', correr);
      new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { correr(); io.disconnect(); } }).observe(el);
    },
  };


  // ═══════════════ Reglas Pro: animación y rendimiento ═══════════════
  const tl = (filas, total) => `<div class="ux-tl">${filas.map(([t, ini, dur, c]) => `<div class="ux-tl-f"><span>${t}</span><span class="ux-tl-p"><i class="${c || ''}" style="--a:${ini / total};--d:${dur / total}"></i></span></div>`).join('')}<div class="ux-tl-esc"><span>0 s</span><span>${(total / 2).toLocaleString('es-AR')} s</span><span>${total.toLocaleString('es-AR')} s</span></div></div>`;
  Object.assign(D, {
    'ux/8-duration-timing': demo('Probalo', par('cajon', 'abrí y cerrá el carrito en los dos, varias veces.',
      `<div class="ux-caj" style="--dur:1000ms"><button type="button" class="ux-btn" data-abrir>Ver carrito</button><div class="ux-caj-p"><b>Tu carrito</b><p>Mandolina V5 · $38.900</p></div></div>`,
      `<div class="ux-caj" style="--dur:220ms"><button type="button" class="ux-btn" data-abrir>Ver carrito</button><div class="ux-caj-p"><b>Tu carrito</b><p>Mandolina V5 · $38.900</p></div></div>`),
      'Un segundo de animación en algo que se abre muchas veces se siente lento y hace esperar. Entre 150 y 250 ms se ve el movimiento sin frenar a nadie.'),
    'ux/14-easing-functions': demo('Probalo', par('cajon', 'abrí el carrito en los dos y mirá cómo arranca.',
      `<div class="ux-caj" style="--dur:420ms;--ease:linear"><button type="button" class="ux-btn" data-abrir>Ver carrito</button><div class="ux-caj-p"><b>Tu carrito</b><p>Mandolina V5 · $38.900</p></div></div>`,
      `<div class="ux-caj" style="--dur:420ms;--ease:cubic-bezier(.23,1,.32,1)"><button type="button" class="ux-btn" data-abrir>Ver carrito</button><div class="ux-caj-p"><b>Tu carrito</b><p>Mandolina V5 · $38.900</p></div></div>`),
      'Con velocidad constante (linear) se ve mecánico. Arrancando rápido y frenando suave (ease-out) responde al instante y se siente natural.'),
    'ux/12-continuous-animation': demo('Probalo', par('', 'tratá de leer la ficha en cada panel.',
      `<div class="ux-mov is-mucho"><b>Mandolina V5</b><span class="ux-chip">★ 4,8</span><span class="ux-chip">Envío gratis</span><p class="ux-mini" style="flex-basis:100%">Cortes parejos en segundos, con protector de mano.</p></div>`,
      `<div class="ux-mov"><b>Mandolina V5</b><span class="ux-chip">★ 4,8</span><span class="ux-chip">Envío gratis</span><p class="ux-mini" style="flex-basis:100%">Cortes parejos en segundos, con protector de mano.</p></div>`),
      'Lo que se mueve sin parar se roba la atención de lo que la persona quiere leer. Movimiento infinito solo para indicar que algo está cargando, y mientras carga.'),
    'ux/13-transform-performance': demo('Probalo', par('pista', 'activá "página ocupada" (como cuando cargan scripts pesados) y mirá cuál se traba.',
      `<div class="ux-pista"><i class="ux-bola" data-top></i><p class="ux-mini">Animando <code>left</code></p></div>`,
      `<div class="ux-pista"><i class="ux-bola is-tr"></i><p class="ux-mini">Animando <code>transform</code></p></div>`,
      `<button type="button" class="dm-play" data-ocupar aria-pressed="false">Simular página ocupada</button>`),
      'Animar left, top, width o height obliga al navegador a recalcular la página en cada cuadro, y si está ocupado se traba. transform y opacity los resuelve la placa de video aparte: siguen suaves.'),
    'ux/47-lazy-loading': demo('Probalo', par('lazy', 'bajá por la lista de productos en los dos y mirá el contador.',
      `<div class="ux-lazy"><p class="ux-mini">Imágenes descargadas: <b data-n>0</b> de 24</p><div class="ux-lazy-l" data-modo="todo"></div></div>`,
      `<div class="ux-lazy"><p class="ux-mini">Imágenes descargadas: <b data-n>0</b> de 24</p><div class="ux-lazy-l" data-modo="lazy"></div></div>`),
      'Si la página baja las 24 fotos al abrir, la de arriba tarda más y gastás datos en fotos que quizás nadie ve. Con loading="lazy" se bajan cuando se van a ver.'),
    'ux/48-code-splitting': demo('Lo que pasa al cargar', `<div class="ux-par">
      <section class="ux-lado" data-lado="mal"><h4>Así no: todo en un archivo</h4><div class="ux-in">${tl([['app.js · 900 KB', 0, 2.6, 'is-mal'], ['Primera pantalla', 2.6, .3, 'is-ok']], 3.2)}</div></section>
      <section class="ux-lado" data-lado="bien"><h4>Así sí: dividido</h4><div class="ux-in">${tl([['inicio.js · 120 KB', 0, .45], ['Primera pantalla', .45, .3, 'is-ok'], ['checkout.js (después)', .8, .7, 'is-luego']], 3.2)}</div></section></div>`,
      'Tiempos ilustrativos con 4G. Con import() dinámico, el código del checkout o del panel se baja recién cuando se usa: la primera pantalla aparece en una fracción del tiempo.'),
    'ux/52-bundle-size': () => D['ux/48-code-splitting'](),
    'ux/53-render-blocking': demo('Lo que pasa al cargar', `<div class="ux-par">
      <section class="ux-lado" data-lado="mal"><h4>Así no: todo bloquea</h4><div class="ux-in">${tl([['estilos.css · 180 KB', 0, 1.1, 'is-mal'], ['chat-widget.js', 0, 1.6, 'is-mal'], ['Primera pantalla', 1.6, .3, 'is-ok']], 2.4)}</div></section>
      <section class="ux-lado" data-lado="bien"><h4>Así sí: lo crítico primero</h4><div class="ux-in">${tl([['CSS crítico (adentro)', 0, .1], ['Primera pantalla', .15, .3, 'is-ok'], ['resto del CSS y el chat (defer)', .3, 1.3, 'is-luego']], 2.4)}</div></section></div>`,
      'Tiempos ilustrativos. El navegador no pinta nada hasta terminar el CSS y los scripts del head. Poner adentro el CSS de la primera pantalla y diferir el resto adelanta lo que ve la persona.'),
    'ux/51-third-party-scripts': demo('Probalo', par('terceros', 'tocá "Recargar" y mirá cuándo aparece la página.',
      `<div class="ux-terc" data-bloquea><p class="ux-mini" data-estado>Cargando chat de terceros…</p><div class="ux-terc-c" hidden><b>Mandolina V5</b><p>$38.900 · envío gratis</p><span class="ux-btn">Comprar</span></div></div>`,
      `<div class="ux-terc"><div class="ux-terc-c"><b>Mandolina V5</b><p>$38.900 · envío gratis</p><span class="ux-btn">Comprar</span></div><p class="ux-mini" data-estado>Chat: cargando en segundo plano…</p></div>`,
      `<button type="button" class="dm-play" data-recargar>Recargar</button>`),
      'Un script de chat, de píxeles o de reseñas puesto en el head sin async ni defer frena toda la página hasta que responde otro servidor. Con defer, la página sale primero.'),
    'ux/49-caching': demo('Probalo', par('cache', 'hacé la primera visita y después la segunda en los dos.',
      `<button type="button" class="ux-btn" data-visita>Visitar</button><p class="ux-mini" data-log></p>`,
      `<button type="button" class="ux-btn" data-visita data-cache>Visitar</button><p class="ux-mini" data-log></p>`),
      'Con encabezados de caché (Cache-Control) el navegador guarda logos, estilos y scripts: la segunda visita carga casi al instante. Tiempos ilustrativos.'),
    'ux/50-font-loading': demo('Probalo', par('fuente', 'tocá "Recargar" y mirá el título mientras llega la fuente.',
      `<div class="ux-fuente" data-foit><h5>Fuego lento, cortes de barrio</h5><p class="ux-mini" data-estado></p></div>`,
      `<div class="ux-fuente" data-swap><h5>Fuego lento, cortes de barrio</h5><p class="ux-mini" data-estado></p></div>`,
      `<button type="button" class="dm-play" data-recargar>Recargar</button>`),
      'Sin font-display: swap, el navegador esconde el texto hasta que baja la fuente (con mala señal, varios segundos sin poder leer nada). Con swap se lee al instante y la fuente cambia cuando llega.'),
    'ux/75-font-loading': () => D['ux/50-font-loading'](),
    'ux/91-bulk-actions': demo('Probalo', par('masivo', 'pausá las 5 publicaciones en cada panel. Fijate cuántos clics hiciste.',
      `<ul class="ux-items" data-fila>${['Mandolina V5', 'Set de cuchillos', 'Olla 24 cm', 'Sartén 28 cm', 'Rallador'].map(p => `<li>${p}<button type="button" class="ux-x is-gris">Pausar</button></li>`).join('')}</ul><p class="ux-mini" data-clics>Clics: 0</p>`,
      `<div class="ux-masivo"><label class="ux-mini"><input type="checkbox" data-todas> Seleccionar todas</label><ul class="ux-items">${['Mandolina V5', 'Set de cuchillos', 'Olla 24 cm', 'Sartén 28 cm', 'Rallador'].map(p => `<li><label><input type="checkbox"> ${p}</label></li>`).join('')}</ul><button type="button" class="ux-btn" data-pausar-sel>Pausar seleccionadas</button><p class="ux-mini" data-clics>Clics: 0</p></div>`),
      'Cuando alguien maneja muchas publicaciones, ir una por una es lento y propenso a errores. Selección múltiple con una barra de acciones lo resuelve en dos clics.'),
    'ux/93-streaming': demo('Probalo', par('stream', 'preguntale al asistente en los dos.',
      `<button type="button" class="ux-btn is-sec" data-preg>¿Sirve para papas fritas?</button><div class="ux-msg" data-resp hidden></div>`,
      `<button type="button" class="ux-btn is-sec" data-preg data-stream>¿Sirve para papas fritas?</button><div class="ux-msg" data-resp hidden></div>`),
      'Esperar la respuesta completa con una ruedita hace sentir que tarda el doble. Mostrar el texto a medida que se genera da respuesta inmediata y deja leer mientras tanto.'),
    'ux/96-auto-play-video': demo('Probalo', par('video', 'dejá los dos paneles a la vista unos segundos.',
      `<div class="ux-video is-auto"><span>▶ reproduciendo</span><p class="ux-mini">Datos gastados: <b data-mb>0</b> MB</p></div>`,
      `<div class="ux-video"><button type="button" class="ux-play" aria-label="Reproducir video">▶</button><p class="ux-mini">Datos gastados: <b data-mb>0</b> MB hasta que lo toques</p></div>`),
      'Un video que arranca solo gasta datos y batería aunque nadie lo mire (y en muchos planes de celular, plata). Mostrá una imagen y que lo reproduzca quien quiera. Valores ilustrativos de un video HD.'),
    'ux/98-feedback-loop': demo('Probalo', par('feedback', 'calificá la respuesta del asistente en cada panel.',
      `<div class="ux-msg">La Mandolina V5 trae 5 insertos: rodajas de 3,5 y 7 mm, bastones, juliana y rallado.</div>`,
      `<div class="ux-msg">La Mandolina V5 trae 5 insertos: rodajas de 3,5 y 7 mm, bastones, juliana y rallado.</div><div class="ux-fb"><span class="ux-mini">¿Te sirvió?</span><button type="button" class="ux-btn is-sec" data-fb="Gracias: lo usamos para mejorar.">👍</button><button type="button" class="ux-btn is-sec" data-fb="Gracias. ¿Qué te faltó? Te paso con una persona.">👎</button></div><p class="ux-mini" data-fb-out></p>`),
      'Sin forma de decir "esto no me sirvió", el error se repite y la persona se va. Un 👍/👎 junto a cada respuesta mide la calidad y abre la puerta a una persona.'),
  });

  Object.assign(M, {
    cajon: el => el.querySelectorAll('[data-abrir]').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('is-open'))),
    pista: el => {
      let t = null;
      el.querySelector('[data-ocupar]').addEventListener('click', e => {
        const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on);
        clearInterval(t); if (on) t = setInterval(() => { const f = performance.now() + 70; while (performance.now() < f) {} }, 100);
      });
      const top = el.querySelector('[data-top]'); let x = 0, d = 1;
      const paso = () => { if (!document.contains(top)) { clearInterval(t); return; } x += d * 2.4; if (x > 100 || x < 0) d *= -1; top.style.left = `calc(${Math.max(0, Math.min(100, x))}% - ${Math.max(0, Math.min(100, x)) * .2}px)`; requestAnimationFrame(paso); };
      requestAnimationFrame(paso);
    },
    lazy: el => el.querySelectorAll('.ux-lazy-l').forEach(l => {
      l.innerHTML = Array.from({ length: 24 }, (_, i) => `<div class="ux-lz" data-i="${i}"><i></i><span>Producto ${i + 1}</span></div>`).join('');
      const out = l.parentElement.querySelector('[data-n]'); let n = 0;
      const cargar = d => { if (d.classList.contains('is-ok')) return; d.classList.add('is-ok'); out.textContent = ++n; };
      if (l.dataset.modo === 'todo') l.querySelectorAll('.ux-lz').forEach((d, i) => setTimeout(() => cargar(d), 40 * i));
      else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { cargar(e.target); io.unobserve(e.target); } }), { root: l, rootMargin: '40px' }); l.querySelectorAll('.ux-lz').forEach(d => io.observe(d)); }
    }),
    terceros: el => {
      const correr = () => {
        const a = el.querySelector('[data-bloquea]'), ac = a.querySelector('.ux-terc-c'), ae = a.querySelector('[data-estado]');
        ac.hidden = true; ae.hidden = false; ae.textContent = 'Esperando al script del chat (otro servidor)…';
        setTimeout(() => { ac.hidden = false; ae.textContent = 'Recién ahora se ve la página (2,5 s).'; }, 2500);
        const b = el.querySelector('[data-lado="bien"] [data-estado]'); b.textContent = 'Chat: cargando en segundo plano…'; setTimeout(() => { b.textContent = 'Chat listo (2,5 s), sin frenar la página.'; }, 2500);
      };
      el.querySelector('[data-recargar]').addEventListener('click', correr); correr();
    },
    cache: el => el.querySelectorAll('[data-visita]').forEach(b => {
      let v = 0; const log = b.nextElementSibling;
      b.addEventListener('click', () => {
        v++; const t = v === 1 || !b.hasAttribute('data-cache') ? 2.4 : 0.2;
        b.disabled = true; log.textContent = `Visita ${v}: cargando…`;
        setTimeout(() => { b.disabled = false; b.textContent = 'Visitar de nuevo'; log.innerHTML = `Visita ${v}: <b>${t.toLocaleString('es-AR')} s</b>${v > 1 && b.hasAttribute('data-cache') ? ' (desde la caché)' : ''}`; log.className = 'ux-mini' + (v > 1 ? (t < 1 ? ' is-bien' : ' is-mal') : ''); }, t * 1000);
      });
    }),
    fuente: el => {
      const correr = () => el.querySelectorAll('.ux-fuente').forEach(f => {
        const st = f.querySelector('[data-estado]'); f.classList.remove('is-lista');
        f.classList.add('is-cargando'); st.textContent = f.hasAttribute('data-foit') ? 'Bajando la fuente… (el texto está escondido)' : 'Bajando la fuente… (se ve con la del sistema)';
        setTimeout(() => { f.classList.remove('is-cargando'); f.classList.add('is-lista'); st.textContent = 'Fuente lista.'; }, 2600);
      });
      el.querySelector('[data-recargar]').addEventListener('click', correr); correr();
    },
    masivo: el => {
      el.querySelectorAll('[data-lado]').forEach(l => { let c = 0; const out = l.querySelector('[data-clics]'); l.addEventListener('click', e => { if (e.target.closest('button, input')) { c++; out.textContent = `Clics: ${c}`; } }); });
      el.querySelectorAll('[data-fila] .ux-x').forEach(b => b.addEventListener('click', () => { b.textContent = 'Pausada'; b.disabled = true; }));
      const m = el.querySelector('.ux-masivo');
      m.querySelector('[data-todas]').addEventListener('change', e => m.querySelectorAll('.ux-items input').forEach(i => i.checked = e.target.checked));
      m.querySelector('[data-pausar-sel]').addEventListener('click', () => m.querySelectorAll('.ux-items input:checked').forEach(i => { i.closest('li').classList.add('is-pausada'); i.disabled = true; }));
    },
    stream: el => el.querySelectorAll('[data-preg]').forEach(b => b.addEventListener('click', () => {
      const r = b.nextElementSibling, txt = 'Sí: trae un inserto de bastones que corta papas parejas para freír. Usá el protector de mano y cortá con la papa bien seca.';
      r.hidden = false;
      if (!b.hasAttribute('data-stream')) { r.innerHTML = '<span class="ux-spin is-osc"></span> Pensando…'; setTimeout(() => { r.textContent = txt; }, 3000); return; }
      r.textContent = ''; const ps = txt.split(' '); let i = 0; setTimeout(function tic() { r.textContent += (i ? ' ' : '') + ps[i++]; if (i < ps.length) setTimeout(tic, 90); }, 300);
    })),
    video: el => {
      const mb = el.querySelector('.is-auto [data-mb]'); let n = 0;
      const t = setInterval(() => { if (!document.contains(mb)) return clearInterval(t); n += .6; mb.textContent = n.toLocaleString('es-AR', { maximumFractionDigits: 1 }); }, 1000);
      el.querySelector('.ux-play').addEventListener('click', e => { e.currentTarget.textContent = '▶ reproduciendo'; e.currentTarget.parentElement.classList.add('is-auto'); });
    },
    feedback: el => el.querySelectorAll('[data-fb]').forEach(b => b.addEventListener('click', () => { el.querySelector('[data-fb-out]').textContent = b.dataset.fb; })),
  });


  // Qué pasa en cada panel, a la vista antes de tocar nada: así la diferencia se entiende aunque no se juegue con la demo
  const RES = {
    '1-smooth-scroll': ['Salta de golpe a la sección', 'Se desliza hasta la sección'],
    '4-back-button': ['«Atrás» te saca de la tienda', '«Atrás» vuelve al listado'],
    '7-excessive-motion': ['Todo se mueve: nada destaca', 'Una sola animación guía al botón'],
    '8-duration-timing': ['Tarda tanto que cansa', 'Abre rápido, sin hacerte esperar'],
    '9-reduced-motion': ['Sigue girando aunque lo pidas', 'Se detiene si lo pediste'],
    '10-loading-states': ['Espacio en blanco mientras carga', 'Esqueleto con la forma del contenido'],
    '11-hover-vs-tap': ['El menú solo abre con el mouse', 'El menú abre también al tocar'],
    '12-continuous-animation': ['Algo se mueve sin parar mientras leés', 'Todo quieto'],
    '13-transform-performance': ['Se traba si la página está ocupada', 'Sigue fluido aunque esté ocupada'],
    '14-easing-functions': ['Velocidad constante: se siente mecánico', 'Arranca rápido y frena suave'],
    '15-z-index-management': ['Números al azar: algo tapa el menú', 'Escala corta: el menú queda arriba'],
    '19-content-jumping': ['La foto llega y empuja el botón', 'El lugar de la foto está reservado'],
    '28-focus-states': ['Sin contorno: no sabés dónde estás', 'Contorno visible al navegar con Tab'],
    '32-loading-buttons': ['Cada toque crea otro pedido', 'Se desactiva y muestra que trabaja'],
    '33-error-feedback': ['Solo un borde rojo', 'Un mensaje claro junto al campo'],
    '35-confirmation-dialogs': ['Borra al primer toque', 'Borra y deja deshacer'],
    '37-color-only': ['El estado está solo en el color', 'Color, texto e ícono'],
    '38-alt-text': ['El lector dice «imagen»', 'El lector describe la foto'],
    '40-aria-labels': ['El lector dice solo «botón»', 'El lector dice qué hace'],
    '41-keyboard-navigation': ['No se llega con el teclado', 'Se llega con Tab y se abre con Enter'],
    '46-image-optimization': ['Foto enorme: tarda en llegar', 'Tamaño justo: llega rápido'],
    '47-lazy-loading': ['Baja las 24 fotos de entrada', 'Baja solo las que vas viendo'],
    '49-caching': ['La segunda visita baja todo de nuevo', 'La segunda visita casi no tarda'],
    '50-font-loading': ['Texto invisible hasta que llega la fuente', 'Se lee desde el principio'],
    '51-third-party-scripts': ['La página espera al script externo', 'La página aparece sin esperar'],
    '61-submit-feedback': ['El botón no responde', 'Muestra que envía y confirma'],
    '67-readable-font-size': ['Letra chica: cuesta leerla', 'Letra legible sin hacer zoom'],
    '68-viewport-meta': ['Se ve la web de escritorio, diminuta', 'Se adapta al ancho del celular'],
    '69-horizontal-scroll': ['La tabla se corta y se corre de costado', 'La tabla se reorganiza en filas'],
    '91-bulk-actions': ['Un clic por publicación', 'Un solo clic para todas'],
    '92-disclaimer': ['Parece una persona', 'Aclara que es una IA'],
    '93-streaming': ['Esperás a que termine todo', 'El texto aparece a medida que se escribe'],
    '96-auto-play-video': ['Arranca solo y gasta datos', 'Espera a que lo pidas'],
    '98-feedback-loop': ['Sin forma de decir si sirvió', 'Pulgar para calificar'],
  };
  const conRes = (id, html) => {
    const r = RES[id]; if (!r) return html;
    let i = 0;
    return html.replace(/<h4>(Así no|Así sí)<\/h4>/g, (m) => `${m}<p class="ux-res">${r[i++] ?? ''}</p>`);
  };
  Object.keys(D).forEach(k => {
    const id = k.replace(/^ux\//, ''), f = D[k];
    D[k] = (...a) => conRes(id, f(...a));
  });
  WLDemos.agregar(D, M);
})();
