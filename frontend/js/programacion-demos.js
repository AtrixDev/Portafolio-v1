/* ============================================================
   PROGRAMACION-DEMOS.JS — Demos de "antes y después" de las fichas del Lab
   Cada demo muestra qué cambia o qué mejora la ficha, en vivo:
     slider → la misma página sin y con la ficha (se arrastra la línea para comparar)
     tabs   → dos versiones del mismo contenido (texto, planilla, código)
     vivo   → un ejemplo interactivo (contraste, áreas táctiles, formularios, código)
   Lo usa renderEntry() de programacion.js: WLDemos.render(e, cat) devuelve el HTML
   y WLDemos.mount(raiz) conecta la interacción.
   Todo el contenido es un ejemplo inventado y se rotula como tal.
   ============================================================ */

window.WLDemos = (function () {
  const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = 1200, H = 820; // tamaño de diseño de las páginas de ejemplo

  // ═══════════════ Páginas de ejemplo (se muestran en iframes aislados) ═══════════════
  const doc = (head, body) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=${W}">${head}</head><body>${body}</body></html>`;

  // Brasa, una parrilla de barrio inventada: la landing que sale "por defecto" de una IA…
  const BRASA_GENERICA = doc(`<style>
    *{box-sizing:border-box;margin:0}body{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;background:#fff;width:${W}px;height:${H}px;overflow:hidden}
    nav{display:flex;justify-content:space-between;align-items:center;padding:20px 56px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
    .logo{font-weight:800;font-size:26px;background:linear-gradient(90deg,#667eea,#764ba2);-webkit-background-clip:text;background-clip:text;color:transparent}
    .links{display:flex;gap:32px;color:#6b7280;font-size:16px}.btn{padding:12px 26px;border-radius:999px;background:linear-gradient(90deg,#667eea,#764ba2);color:#fff;font-weight:600;font-size:15px}
    .hero{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-align:center;padding:86px 56px 96px}
    h1{font-size:58px;font-weight:800;letter-spacing:-.5px}.hero p{font-size:20px;opacity:.9;max-width:660px;margin:18px auto 0;line-height:1.5}
    .row{display:flex;gap:14px;justify-content:center;margin-top:34px}.w{background:#fff;color:#764ba2;padding:15px 32px;border-radius:999px;font-weight:700}.o{border:2px solid #fff;padding:13px 30px;border-radius:999px;font-weight:600}
    .feat{padding:56px 56px 0;text-align:center}h2{font-size:34px;font-weight:800}.feat>p{color:#6b7280;margin-top:8px;font-size:17px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:36px}.card{padding:34px 28px;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.08);text-align:center}
    .card i{font-style:normal;font-size:42px}.card h3{margin-top:14px;font-size:21px}.card p{margin-top:8px;color:#6b7280;line-height:1.5}
  </style>`, `
    <nav><span class="logo">🔥 Brasa</span><span class="links"><span>Inicio</span><span>Menú</span><span>Nosotros</span><span>Contacto</span></span><span class="btn">Comenzar</span></nav>
    <section class="hero"><h1>Bienvenido a Brasa 🔥</h1><p>La mejor experiencia gastronómica de la ciudad. Descubrí nuestros sabores únicos y viví momentos inolvidables.</p>
      <div class="row"><span class="w">Comenzar</span><span class="o">Saber más</span></div></section>
    <section class="feat"><h2>¿Por qué elegirnos?</h2><p>Descubrí lo que nos hace únicos</p>
      <div class="grid"><div class="card"><i>🍖</i><h3>Carnes Premium</h3><p>Seleccionamos los mejores cortes para vos.</p></div>
      <div class="card"><i>🍷</i><h3>Vinos Selectos</h3><p>Una carta pensada para cada ocasión.</p></div>
      <div class="card"><i>⭐</i><h3>Atención de Calidad</h3><p>Nuestro equipo está para ayudarte.</p></div></div></section>`);

  // …y la misma landing después de pasarla por Impeccable (critique → colorize → typeset → clarify → polish)
  const BRASA_IMPECCABLE = doc(`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,650;1,9..144,500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet"><style>
    *{box-sizing:border-box;margin:0}body{position:relative;font-family:Figtree,system-ui,sans-serif;color:#1c1814;background:#f3ede3;width:${W}px;height:${H}px;overflow:hidden;
      background-image:radial-gradient(900px 500px at 88% 8%,rgba(194,65,12,.10),transparent 60%)}
    nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:26px 64px}
    .logo{font:italic 500 32px/1 Fraunces,serif;letter-spacing:-.02em}.logo b{color:#c2410c;font-weight:500}
    .links{display:flex;gap:34px;font-size:15px;font-weight:500;color:#3b332b}.meta{justify-self:end;display:flex;align-items:center;gap:18px;font-size:14px;color:#6b6258}
    .res{padding:11px 18px;border-radius:10px;background:#1c1814;color:#f3ede3;font-weight:600;font-size:14px}
    .hero{display:grid;grid-template-columns:1.2fr .85fr;gap:64px;padding:44px 64px 0;align-items:start}
    h1{font:650 94px/.92 Fraunces,serif;letter-spacing:-.035em;font-variation-settings:"opsz" 144}h1 em{font-weight:500;color:#c2410c}
    .sub{margin-top:26px;font-size:20px;line-height:1.5;color:#4a4138;max-width:30ch}
    .cta{display:flex;align-items:center;gap:26px;margin-top:34px}.b{padding:17px 28px;border-radius:12px;background:#c2410c;color:#fff;font-weight:700;font-size:17px;box-shadow:0 10px 24px -12px rgba(194,65,12,.7)}
    .l{font-weight:600;font-size:16px;text-decoration:underline;text-decoration-color:#c9b9a4;text-underline-offset:5px}
    .proof{margin-top:30px;font-size:14px;color:#6b6258}.proof b{color:#1c1814}
    .ticket{margin-top:12px;padding:30px 30px 26px;border-radius:16px;background:#fbf8f2;border:1px solid #e3d8c8;box-shadow:0 30px 50px -30px rgba(70,35,10,.45);transform:rotate(1.2deg)}
    .ticket h2{font:500 27px/1 Fraunces,serif;letter-spacing:-.02em}.ticket small{display:block;margin-top:6px;color:#6b6258;font-size:13px}
    ul{list-style:none;padding:0;margin-top:20px}li{display:flex;align-items:baseline;gap:10px;padding:11px 0;border-top:1px dashed #d9cfc0;font-size:16px}
    li span{flex:1}li b{font-variant-numeric:tabular-nums;font-weight:600}.ticket p{margin-top:14px;font-size:13px;color:#6b6258}
    .facts{position:absolute;left:64px;right:64px;bottom:40px;display:grid;grid-template-columns:1.2fr 1fr 1fr;border-top:1px solid #d9cfc0;padding-top:20px;font-size:15px;color:#3b332b}
    .facts small{display:block;font-size:12.5px;color:#6b6258;margin-bottom:4px}
  </style>`, `
    <nav><span class="logo">Brasa<b>.</b></span><span class="links"><span>La carta</span><span>Reservas</span><span>Cómo llegar</span></span><span class="meta">Mar a dom · 20 a 00 h<span class="res">Reservar</span></span></nav>
    <section class="hero"><div>
      <h1>Fuego lento,<br>cortes de <em>barrio.</em></h1>
      <p class="sub">Vacío de doce horas, achuras y vinos de productores chicos. En Villa Crespo desde 2014.</p>
      <div class="cta"><span class="b">Reservar mesa</span><span class="l">Ver la carta de hoy →</span></div>
      <p class="proof"><b>★ 4,8</b> en Google · 1.247 reseñas</p></div>
      <aside class="ticket"><h2>La carta de hoy</h2><small>Martes 30 de septiembre</small>
        <ul><li><span>Vacío a las brasas</span><b>$ 18.400</b></li><li><span>Ojo de bife, 400 g</span><b>$ 21.900</b></li><li><span>Mollejas al limón</span><b>$ 12.600</b></li><li><span>Provoleta con orégano</span><b>$ 7.900</b></li><li><span>Flan con dulce de leche</span><b>$ 5.200</b></li></ul>
        <p>Precios actualizados hoy. Reservas por WhatsApp.</p></aside></section>
    <div class="facts"><div><small>Dirección</small>Thames 1234, Villa Crespo</div><div><small>Horario</small>Martes a domingo, 20 a 00 h</div><div><small>Afuera</small>Mesas en la vereda para 40</div></div>`);

  // Tipografías: la misma página editorial con las fuentes del sistema y con la combinación de la ficha
  function paginaTipo(heading, body, url) {
    const fam = heading ? `'${heading}', Georgia, serif` : 'Arial, Helvetica, sans-serif';
    const famB = body ? `'${body}', system-ui, sans-serif` : 'Arial, Helvetica, sans-serif';
    const link = url && /^https:\/\/fonts\.googleapis\.com\//.test(url) ? `<link href="${escH(url)}" rel="stylesheet">` : '';
    return doc(`${link}<style>
      *{box-sizing:border-box;margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:#faf9f6;color:#18181b;font-family:${famB}}
      header{display:flex;justify-content:space-between;align-items:center;padding:30px 72px;border-bottom:1px solid #e7e5e0;font-size:15px}
      header b{font-family:${fam};font-size:26px;font-weight:700;letter-spacing:-.01em}header span{color:#52525b}
      main{display:grid;grid-template-columns:1.35fr .9fr;gap:64px;padding:56px 72px}
      h1{font-family:${fam};font-size:76px;line-height:1;font-weight:700;letter-spacing:-.02em}
      .lead{margin-top:26px;font-size:21px;line-height:1.55;color:#3f3f46;max-width:34ch}
      .body{margin-top:22px;font-size:17px;line-height:1.7;color:#52525b;max-width:52ch}
      .btn{display:inline-block;margin-top:30px;padding:15px 24px;border-radius:10px;background:#18181b;color:#fff;font-weight:600;font-size:16px}
      aside{border-left:1px solid #e7e5e0;padding-left:40px}aside h2{font-family:${fam};font-size:30px;line-height:1.15;font-weight:600}
      aside p{margin-top:14px;font-size:16px;line-height:1.65;color:#52525b}.n{margin-top:26px;font-family:${fam};font-size:54px;font-weight:700}.n small{display:block;font-family:${famB};font-size:14px;color:#71717a;font-weight:500}
    </style>`, `<header><b>Cuaderno</b><span>Notas · Recetas · Suscribite</span></header>
      <main><div><h1>El pan que se hace despacio sale mejor.</h1>
        <p class="lead">Masa madre, harina de molino chico y cuarenta y ocho horas de fermentación. Así lo hacemos todos los días.</p>
        <p class="body">La tipografía decide si esto se lee como una panadería de barrio o como un folleto genérico. Mismo texto, misma grilla, mismos colores: solo cambian las fuentes.</p>
        <span class="btn">Ver las recetas</span></div>
        <aside><h2>Lo que aprendimos en diez años de horno</h2><p>Menos levadura, más tiempo. El sabor aparece cuando dejás que la masa trabaje sola.</p><p class="n">48 h<small>de fermentación por tanda</small></p></aside></main>`);
  }

  // ═══════════════ Componentes ═══════════════
  // Comparador: la versión mejorada va a la izquierda (en estas páginas lo importante está a la izquierda)
  // y la de antes a la derecha, recortada desde la línea.
  function slider(o) {
    const frame = (html, cls, title) => `<iframe class="${cls}" title="${escH(title)}" srcdoc="${escH(html)}" loading="lazy" tabindex="-1" aria-hidden="true" width="${W}" height="${H}"></iframe>`;
    return `<div class="dm dm--slider" data-dm="slider">
      <div class="dm-frame" style="--x:50%">
        ${frame(o.despues.html, 'dm-a', o.despues.label)}
        <div class="dm-b">${frame(o.antes.html, 'dm-b-if', o.antes.label)}</div>
        <span class="dm-line" aria-hidden="true"><span class="dm-knob"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 6-6 6 6 6M15 6l6 6-6 6"/></svg></span></span>
        <span class="dm-lab dm-lab-a">${escH(o.despues.label)}</span><span class="dm-lab dm-lab-b">${escH(o.antes.label)}</span>
        <input class="dm-range" type="range" min="0" max="100" value="50" aria-label="Comparar ${escH(o.antes.label)} con ${escH(o.despues.label)}: deslizá la línea">
      </div>
      <div class="dm-bar">
        <div class="dm-seg" role="group" aria-label="Ver una sola versión">
          <button type="button" data-dm-set="0">${escH(o.antes.label)}</button><button type="button" data-dm-set="50" aria-pressed="true">Comparar</button><button type="button" data-dm-set="100">${escH(o.despues.label)}</button>
        </div>
        <button type="button" class="dm-open" data-dm-open="1">Abrir en grande <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-8 8M10 5H5v14h14v-5"/></svg></button>
      </div>
      <template class="dm-src-a">${escH(o.antes.html)}</template><template class="dm-src-b">${escH(o.despues.html)}</template>
    </div>`;
  }
  function tabs(o) {
    const id = 'dm' + Math.random().toString(36).slice(2, 8);
    return `<div class="dm dm--tabs" data-dm="tabs">
      <div class="dm-tabs" role="tablist" aria-label="Antes y después">${o.panes.map((p, i) => `<button type="button" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === o.panes.length - 1}" tabindex="${i === o.panes.length - 1 ? 0 : -1}" data-tone="${p.tone || ''}">${escH(p.label)}</button>`).join('')}</div>
      ${o.panes.map((p, i) => `<div class="dm-pane" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i === o.panes.length - 1 ? '' : ' hidden'}>${p.html}</div>`).join('')}
    </div>`;
  }
  const notas = (titulo, items) => `<ol class="dm-notes" aria-label="${escH(titulo)}">${items.map(([cmd, t, d]) => `<li>${cmd ? `<code>${escH(cmd)}</code>` : ''}<b>${escH(t)}</b><span>${escH(d)}</span></li>`).join('')}</ol>`;
  const bloque = (titulo, cuerpo, pie) => `<div class="wl-d-block dm-block"><h3>${escH(titulo)}</h3>${cuerpo}${pie ? `<p class="ex-note">${pie}</p>` : ''}</div>`;

  // ═══════════════ Demos por ficha ═══════════════
  const DEMOS = {
    // ── Skills ──
    'skills/impeccable': () => bloque('Antes y después',
      slider({ antes: { label: 'Sin la skill', html: BRASA_GENERICA }, despues: { label: 'Con Impeccable', html: BRASA_IMPECCABLE } }) +
      notas('Qué cambió', [
        ['/critique', 'Encontró el "look de IA"', 'Gradiente violeta, emojis como íconos, tres tarjetas iguales y un titular que no dice nada.'],
        ['/colorize', 'Colores de la marca', 'Brasa, carbón y papel en lugar del violeta genérico. Un solo color de acción.'],
        ['/typeset', 'Tipografía con carácter', 'Fraunces para los títulos y Figtree para el texto, con jerarquía clara.'],
        ['/clarify', 'Mensaje concreto', 'Qué es, dónde queda y qué se come, en vez de "la mejor experiencia gastronómica".'],
        ['/distill', 'Lo que busca el que llega', 'La carta con precios de hoy reemplaza a las tarjetas de relleno.'],
        ['/polish', 'Botón que dice qué hace', '"Reservar mesa" en lugar de "Comenzar". Precios con números tabulares.'],
      ]),
      'Ejemplo inventado: la misma parrilla, el mismo contenido de base. La primera versión es lo que suele devolver una IA sin guía de diseño; la segunda, el resultado de pedirle a Claude con Impeccable: <i>"Pasá /critique y después /polish sobre esta landing"</i>.'),

    'skills/copywriting': () => bloque('Antes y después', tabs({ panes: [
      { label: 'Sin la skill', tone: 'bad', html: `<article class="dm-copy">
        <p class="dm-copy-t">Mandolina Borner V5 Multibox Cortador Profesional Alemán</p>
        <p>¡Bienvenido a nuestra tienda! Ofrecemos productos de la más alta calidad. Esta mandolina es ideal para tu cocina. Es muy práctica y fácil de usar. ¡No te la pierdas! Stock disponible. Consultanos.</p>
        <span class="dm-copy-btn">Comprar</span></article>` },
      { label: 'Con Copywriting', tone: 'good', html: `<article class="dm-copy is-good">
        <p class="dm-copy-t">Cortes parejos en segundos, sin tocar la hoja</p>
        <p>La Mandolina V5 de Borner corta, ralla y hace juliana con cinco placas intercambiables. Hecha en Alemania y con cinco años de garantía.</p>
        <ul><li>Rodajas de 3,5 y 7 mm: papas fritas, ensaladas y gratinados.</li><li>Protector de mano incluido: los dedos nunca llegan a la hoja.</li><li>Las cinco placas se guardan en la Multibox, sin cajones revueltos.</li></ul>
        <span class="dm-copy-btn">Comprar con envío gratis</span></article>` },
    ] }) + notas('Qué cambió', [
      ['', 'Beneficio antes que producto', 'El titular dice qué ganás ("cortes parejos") y no repite el nombre.'],
      ['', 'Datos concretos', 'Medidas, cantidad de placas, origen y garantía, en vez de "alta calidad".'],
      ['', 'Responde la objeción', 'El miedo con una mandolina es cortarse: el protector aparece arriba.'],
      ['', 'El botón dice qué conseguís', '"Comprar con envío gratis" en lugar de "Comprar".'],
    ]), 'Ejemplo con un producto real que trabajé (Borner). El texto de "antes" es un modelo de lo que se ve seguido en tiendas, no una publicación puntual.'),

    'skills/xlsx': () => bloque('Antes y después', tabs({ panes: [
      { label: 'Datos crudos (CSV)', tone: 'bad', html: `<pre class="dm-csv">mes,ventas,unidades,publicidad
2025-06,18420300,1402,5526090
2025-07,19880150,1511,4771236
2025-08,21104700,1590,3587799
2025-09,22950420,1702,3212059
2025-10,24310900,1788,3160417
2025-11,25601200,1846,3072144</pre>` },
      { label: 'Con la skill', tone: 'good', html: sheet() },
    ] }) + notas('Qué hace la skill', [
      ['', 'Formato de moneda y miles', 'Los números se leen de un vistazo: $ 18.420.300 en vez de 18420300.'],
      ['', 'Fórmulas vivas', 'Totales, variación y ACOS se calculan con fórmulas: si cambiás un dato, se actualiza todo.'],
      ['', 'Formato condicional', 'El ACOS se pinta según pasa o no el objetivo del 15%.'],
      ['', 'Encabezado fijo y gráfico', 'La primera fila queda quieta al bajar y el gráfico sale de los mismos datos.'],
    ]), 'Ejemplo inventado con la forma de un reporte mensual de Mercado Libre. Tocá una celda del total para ver su fórmula.'),

    'skills/react-best-practices': () => bloque('Antes y después', `<div class="dm dm--race" data-dm="race">
      <div class="dm-race">
        <div class="dm-lane"><p><b>Sin la skill</b><span>Pedidos en cadena (cascada)</span></p>
          <div class="dm-track"><i style="--s:0;--d:.42" data-l="usuario"></i><i style="--s:.42;--d:.35" data-l="pedidos"></i><i style="--s:.77;--d:.38" data-l="stock"></i></div><output>1,15 s</output></div>
        <div class="dm-lane is-good"><p><b>Con React Best Practices</b><span>Los tres a la vez (Promise.all)</span></p>
          <div class="dm-track"><i style="--s:0;--d:.42" data-l="usuario"></i><i style="--s:0;--d:.35" data-l="pedidos"></i><i style="--s:0;--d:.38" data-l="stock"></i></div><output>0,42 s</output></div>
        <div class="dm-scale" aria-hidden="true"><span>0 s</span><span>0,5 s</span><span>1 s</span></div>
      </div>
      <button type="button" class="dm-play" data-dm-play>Reproducir otra vez</button>
      <div class="dm-code2"><div><small>Antes</small><pre>const user = await getUser(id)
const orders = await getOrders(id)
const stock = await getStock()</pre></div><div class="is-good"><small>Después</small><pre>const [user, orders, stock] =
  await Promise.all([
    getUser(id), getOrders(id), getStock(),
  ])</pre></div></div>
    </div>` + notas('Por qué importa', [
      ['', 'La regla de mayor impacto', 'Eliminar cascadas de pedidos es la primera de la lista: la página carga en el tiempo del pedido más lento, no en la suma de todos.'],
      ['', 'Cómo te ayuda Claude', 'Con la skill instalada, detecta estos patrones solo al revisar tu código y propone el cambio.'],
    ]), 'Tiempos ilustrativos de tres pedidos independientes.'),

    // ── Buenas prácticas UX ──
    'ux/36-color-contrast': () => bloque('Probalo', `<div class="dm dm--contrast" data-dm="contrast">
      <div class="dm-cs-prev"><p class="dm-cs-h">Envío gratis desde $ 30.000</p><p class="dm-cs-p">Llega mañana si comprás antes de las 15 h. Devolución gratis durante 30 días.</p></div>
      <label class="dm-cs-ctl"><span>Gris del texto</span><input type="range" min="0" max="200" value="153" data-cs-range aria-describedby="dm-cs-out"></label>
      <div class="dm-cs-out" id="dm-cs-out" aria-live="polite"><b data-cs-ratio>2,8:1</b><span data-cs-aa>No pasa AA</span><span data-cs-hex>#999999 sobre blanco</span></div>
    </div>` + notas('Cómo leerlo', [
      ['', '4,5:1 para texto normal', 'Es el mínimo de WCAG AA. Debajo de eso, mucha gente no lo lee bien en el celular al sol.'],
      ['', '3:1 para títulos grandes', 'A partir de 24 px (o 19 px en negrita) alcanza con 3:1.'],
      ['', '7:1 es AAA', 'El nivel más exigente. Útil para textos largos.'],
    ]), 'Mové el control: el cálculo es el mismo que usan las herramientas de accesibilidad (luminancia relativa de WCAG 2).'),

    'ux/22-touch-target-size': () => bloque('Probalo', `<div class="dm dm--touch" data-dm="touch">
      <div class="dm-phones">
        <div class="dm-phone"><p class="dm-ph-t">Botones de 24 px</p><div class="dm-ph-row is-small"><button type="button" data-hit>−</button><span>1</span><button type="button" data-hit>+</button><button type="button" data-hit aria-label="Eliminar">×</button></div><p class="dm-ph-score" data-score>Tocaste 0 de 0</p></div>
        <div class="dm-phone is-good"><p class="dm-ph-t">Botones de 44 px</p><div class="dm-ph-row"><button type="button" data-hit>−</button><span>1</span><button type="button" data-hit>+</button><button type="button" data-hit aria-label="Eliminar">×</button></div><p class="dm-ph-score" data-score>Tocaste 0 de 0</p></div>
      </div>
      <p class="dm-touch-tip">Con el mouse activá el <b>modo dedo</b>: tus clics pasan a ser un área de 10 mm, como la yema del dedo.</p>
      <button type="button" class="dm-play" data-finger aria-pressed="false">Activar modo dedo</button>
    </div>` + notas('Por qué 44 px', [
      ['', 'La yema del dedo mide unos 10 mm', 'Apple pide 44 × 44 pt y Google 48 × 48 dp. Más chico, el dedo tapa el botón y toca el de al lado.'],
      ['', 'El área puede ser más grande que el dibujo', 'Un ícono de 20 px puede tener un área táctil de 44 px con padding.'],
    ]), 'En el modo dedo, un toque cuenta si el área del dedo cae entera sobre el botón que apuntaste.'),

    'ux/43-form-labels': () => bloque('Probalo', `<div class="dm dm--form">
      <div class="dm-forms">
        <form class="dm-f" onsubmit="return false" aria-label="Formulario sin etiquetas"><p class="dm-f-t">Solo placeholder</p>
          <input placeholder="Email" aria-label="Email (ejemplo sin etiqueta visible)"><input placeholder="Código postal" aria-label="Código postal (ejemplo sin etiqueta visible)"><input placeholder="Teléfono con código de área" aria-label="Teléfono (ejemplo sin etiqueta visible)"></form>
        <form class="dm-f is-good" onsubmit="return false" aria-label="Formulario con etiquetas"><p class="dm-f-t">Con etiqueta</p>
          <label>Email<input type="email" autocomplete="off"></label><label>Código postal<input inputmode="numeric" autocomplete="off"></label><label>Teléfono<small>Con código de área, sin 0 ni 15</small><input inputmode="tel" autocomplete="off"></label></form>
      </div>
    </div>` + notas('Qué pasa', [
      ['', 'Escribí en los dos', 'En el de la izquierda, apenas escribís, desaparece lo que te pedía el campo. Si te distraés, no sabés qué era.'],
      ['', 'La etiqueta queda siempre', 'Y deja lugar para la ayuda ("sin 0 ni 15"), que en un placeholder se pierde.'],
      ['', 'Lectores de pantalla', 'El placeholder no siempre se anuncia como nombre del campo; la etiqueta sí.'],
    ])),

    // ── Stacks: el mismo contador en cada tecnología ──
    'stacks/vanilla': () => stackDemo('HTML + CSS + JavaScript', `&lt;button id="sumar"&gt;Agregar al carrito&lt;/button&gt;
&lt;span id="n"&gt;0&lt;/span&gt;

&lt;script&gt;
  let n = 0
  const out = document.querySelector('#n')
  document.querySelector('#sumar').onclick = () =&gt; {
    n++
    out.textContent = n   // vos actualizás la pantalla
  }
&lt;/script&gt;`, 'Sin nada que instalar: el navegador lo entiende tal cual. Vos te encargás de actualizar la pantalla cada vez que cambia un dato.'),
    'stacks/react-vite': () => stackDemo('React', `import { useState } from 'react'

export function Carrito() {
  const [n, setN] = useState(0)
  return (
    &lt;&gt;
      &lt;button onClick={() =&gt; setN(n + 1)}&gt;
        Agregar al carrito
      &lt;/button&gt;
      &lt;span&gt;{n}&lt;/span&gt;   {/* React la redibuja solo */}
    &lt;/&gt;
  )
}`, 'Declarás cómo se ve según el estado (n) y React redibuja cuando cambia. Conviene cuando la pantalla tiene muchas partes que dependen de los mismos datos.'),
  };

  function stackDemo(nombre, codigo, nota) {
    return bloque('El mismo botón, en ' + nombre, `<div class="dm dm--stack" data-dm="stack">
      <div class="dm-stack-live"><button type="button" class="dm-stack-btn" data-stack-add>Agregar al carrito</button><span class="dm-stack-n" aria-live="polite"><b data-stack-n>0</b> en el carrito</span></div>
      <pre class="dm-stack-code">${codigo}</pre>
    </div>`, escH(nota) + ' Compará con las otras fichas de Stacks: es el mismo ejemplo en cada una.');
  }

  // Planilla de ejemplo (skill xlsx)
  function sheet() {
    const filas = [['jun 2025', 18420300, 1402, 5526090], ['jul 2025', 19880150, 1511, 4771236], ['ago 2025', 21104700, 1590, 3587799], ['sep 2025', 22950420, 1702, 3212059], ['oct 2025', 24310900, 1788, 3160417], ['nov 2025', 25601200, 1846, 3072144]];
    const plata = n => '$ ' + Math.round(n).toLocaleString('es-AR');
    const tot = filas.reduce((a, f) => [a[0] + f[1], a[1] + f[2], a[2] + f[3]], [0, 0, 0]);
    const max = Math.max(...filas.map(f => f[1]));
    return `<div class="dm-xl" data-dm="xl">
      <div class="dm-xl-fx"><span class="dm-xl-ref" data-xl-ref>A1</span><span class="dm-xl-f" data-xl-f>Mes</span></div>
      <div class="dm-xl-grid" role="table" aria-label="Planilla de ejemplo">
        <div class="dm-xl-r is-cols" role="row"><span></span><span>A</span><span>B</span><span>C</span><span>D</span><span>E</span></div>
        <div class="dm-xl-r is-head" role="row"><span>1</span><span data-f="Mes">Mes</span><span data-f="Ventas">Ventas</span><span data-f="Unidades">Unidades</span><span data-f="Publicidad">Publicidad</span><span data-f="ACOS">ACOS</span></div>
        ${filas.map((f, i) => { const acos = f[3] / f[1] * 100; return `<div class="dm-xl-r" role="row"><span>${i + 2}</span><span data-f="${f[0]}">${f[0]}</span><span data-f="${f[1]}">${plata(f[1])}</span><span data-f="${f[2]}">${f[2].toLocaleString('es-AR')}</span><span data-f="${f[3]}">${plata(f[3])}</span><span class="${acos <= 15 ? 'ok' : 'bad'}" data-f="=D${i + 2}/B${i + 2}">${acos.toFixed(1).replace('.', ',')}%</span></div>`; }).join('')}
        <div class="dm-xl-r is-tot" role="row"><span>8</span><span data-f="Total">Total</span><span data-f="=SUMA(B2:B7)">${plata(tot[0])}</span><span data-f="=SUMA(C2:C7)">${tot[1].toLocaleString('es-AR')}</span><span data-f="=SUMA(D2:D7)">${plata(tot[2])}</span><span data-f="=D8/B8">${(tot[2] / tot[0] * 100).toFixed(1).replace('.', ',')}%</span></div>
      </div>
      <div class="dm-xl-chart" aria-hidden="true">${filas.map(f => `<i style="--v:${f[1] / max}"><small>${f[0].slice(0, 3)}</small></i>`).join('')}</div>
    </div>`;
  }

  // ═══════════════ Demos generadas para categorías enteras ═══════════════
  function tipografia(e) {
    if (!e.fonts?.heading) return '';
    return bloque('Antes y después', slider({
      antes: { label: 'Fuentes por defecto', html: paginaTipo('', '', '') },
      despues: { label: e.fonts.heading === e.fonts.body ? e.fonts.heading : `${e.fonts.heading} + ${e.fonts.body}`, html: paginaTipo(e.fonts.heading, e.fonts.body, e.fonts.url) },
    }), 'La misma página con Arial (lo que queda si no elegís nada) y con esta combinación. Mismo texto, grilla y colores: solo cambia la tipografía.');
  }

  function render(e, cat) {
    const f = DEMOS[`${cat}/${e.id}`];
    if (f) return f(e);
    if (cat === 'tipografias') return tipografia(e);
    return '';
  }

  // ═══════════════ Interacción ═══════════════
  const lum = hex => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };

  function mount(root) {
    root.querySelectorAll('[data-dm="slider"]').forEach(montarSlider);
    root.querySelectorAll('[data-dm="tabs"]').forEach(montarTabs);
    root.querySelectorAll('[data-dm="xl"]').forEach(montarXl);
    root.querySelectorAll('[data-dm="race"]').forEach(montarRace);
    root.querySelectorAll('[data-dm="contrast"]').forEach(montarContraste);
    root.querySelectorAll('[data-dm="touch"]').forEach(montarTouch);
    root.querySelectorAll('[data-dm="stack"]').forEach(el => {
      let n = 0; const out = el.querySelector('[data-stack-n]');
      el.querySelector('[data-stack-add]').addEventListener('click', () => { out.textContent = ++n; out.parentElement.classList.remove('pop'); void out.offsetWidth; out.parentElement.classList.add('pop'); });
    });
  }

  function montarSlider(el) {
    const frame = el.querySelector('.dm-frame'), range = el.querySelector('.dm-range');
    const fit = () => frame.style.setProperty('--s', frame.clientWidth / W);
    fit(); new ResizeObserver(fit).observe(frame);
    const set = v => {
      frame.style.setProperty('--x', v + '%'); range.value = v;
      el.querySelectorAll('[data-dm-set]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.dmSet === +v)));
    };
    range.addEventListener('input', () => set(range.value));
    el.querySelectorAll('[data-dm-set]').forEach(b => b.addEventListener('click', () => { frame.classList.add('is-anim'); set(b.dataset.dmSet); setTimeout(() => frame.classList.remove('is-anim'), 420); }));
    el.querySelector('[data-dm-open]')?.addEventListener('click', () => {
      const x = +range.value, src = el.querySelector(x < 50 ? '.dm-src-a' : '.dm-src-b');
      const tmp = document.createElement('textarea'); tmp.innerHTML = src.innerHTML;
      const url = URL.createObjectURL(new Blob([tmp.value], { type: 'text/html' }));
      window.open(url, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
  }

  function montarTabs(el) {
    const tabs = [...el.querySelectorAll('[role="tab"]')];
    const ir = i => tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; el.querySelector('#' + t.getAttribute('aria-controls')).hidden = i !== j; });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => ir(i));
      t.addEventListener('keydown', ev => { const d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (d) { const k = (i + d + tabs.length) % tabs.length; ir(k); tabs[k].focus(); } });
    });
  }

  function montarXl(el) {
    const ref = el.querySelector('[data-xl-ref]'), fx = el.querySelector('[data-xl-f]');
    const cols = 'ABCDE';
    el.querySelectorAll('.dm-xl-r:not(.is-cols)').forEach(r => [...r.children].slice(1).forEach((c, i) => {
      c.tabIndex = 0;
      const pick = () => { el.querySelectorAll('.is-sel').forEach(x => x.classList.remove('is-sel')); c.classList.add('is-sel'); ref.textContent = cols[i] + r.firstElementChild.textContent; fx.textContent = c.dataset.f; };
      c.addEventListener('click', pick); c.addEventListener('focus', pick);
    }));
  }

  function montarRace(el) {
    const run = () => { el.classList.remove('is-run'); void el.offsetWidth; el.classList.add('is-run'); };
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: .4 });
    io.observe(el);
    el.querySelector('[data-dm-play]').addEventListener('click', run);
  }

  function montarContraste(el) {
    const r = el.querySelector('[data-cs-range]'), prev = el.querySelector('.dm-cs-prev');
    const upd = () => {
      const v = +r.value, hex = '#' + v.toString(16).padStart(2, '0').repeat(3), k = ratio(hex, '#ffffff');
      prev.style.setProperty('--c', hex);
      el.querySelector('[data-cs-ratio]').textContent = k.toFixed(1).replace('.', ',') + ':1';
      const aa = el.querySelector('[data-cs-aa]');
      aa.textContent = k >= 7 ? 'Pasa AAA' : k >= 4.5 ? 'Pasa AA' : k >= 3 ? 'Solo para títulos grandes' : 'No pasa AA';
      aa.dataset.tone = k >= 4.5 ? 'ok' : k >= 3 ? 'warn' : 'bad';
      el.querySelector('[data-cs-hex]').textContent = hex.toUpperCase() + ' sobre blanco';
    };
    r.addEventListener('input', upd); upd();
  }

  function montarTouch(el) {
    const fingerBtn = el.querySelector('[data-finger]');
    let finger = false;
    fingerBtn.addEventListener('click', () => { finger = !finger; fingerBtn.setAttribute('aria-pressed', String(finger)); fingerBtn.textContent = finger ? 'Desactivar modo dedo' : 'Activar modo dedo'; el.classList.toggle('is-finger', finger); });
    el.querySelectorAll('.dm-phone').forEach(ph => {
      let ok = 0, total = 0; const score = ph.querySelector('[data-score]');
      ph.addEventListener('pointerdown', ev => {
        const target = ev.target.closest('[data-hit]');
        if (!target && !finger) return;
        const dedo = finger ? 19 : 0; // radio aproximado de la yema en pantalla (≈10 mm)
        const botones = [...ph.querySelectorAll('[data-hit]')];
        const bajo = botones.filter(b => { const q = b.getBoundingClientRect(); return ev.clientX + dedo > q.left && ev.clientX - dedo < q.right && ev.clientY + dedo > q.top && ev.clientY - dedo < q.bottom; });
        if (!bajo.length) return;
        total++;
        const limpio = bajo.length === 1 && (!finger || (() => { const q = bajo[0].getBoundingClientRect(); return ev.clientX - dedo >= q.left - 4 && ev.clientX + dedo <= q.right + 4; })());
        if (limpio) ok++;
        (limpio ? bajo[0] : ph).classList.remove('flash-ok', 'flash-bad'); void ph.offsetWidth;
        (limpio ? bajo[0] : ph).classList.add(limpio ? 'flash-ok' : 'flash-bad');
        score.textContent = `Tocaste ${ok} de ${total}${total - ok ? ` · ${total - ok} con el botón de al lado` : ''}`;
        if (finger) { const d = document.createElement('span'); d.className = 'dm-tap'; d.style.left = ev.clientX - ph.getBoundingClientRect().left + 'px'; d.style.top = ev.clientY - ph.getBoundingClientRect().top + 'px'; ph.appendChild(d); setTimeout(() => d.remove(), 600); }
      });
    });
  }

  return { render, mount };
})();
