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
    'ux/55-error-placement': () => D['ux/33-error-feedback'](),

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

  WLDemos.agregar(D, M);
})();
