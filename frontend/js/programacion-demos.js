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
    const w = o.w || W, h = o.h || H;
    const frame = (v, cls) => `<iframe class="${cls}" title="${escH(v.label)}" ${v.src ? `src="${escH(v.src)}"` : `srcdoc="${escH(v.html)}"`} loading="lazy" tabindex="-1" aria-hidden="true" width="${w}" height="${h}" style="width:${w}px;height:${h}px"></iframe>`;
    return `<div class="dm dm--slider" data-dm="slider" data-w="${w}">
      <div class="dm-frame" style="--x:50%;aspect-ratio:${w} / ${h}">
        ${frame(o.despues, 'dm-a')}
        <div class="dm-b">${frame(o.antes, 'dm-b-if')}</div>
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
      ${o.antes.src ? `<a hidden class="dm-src-a" href="${escH(o.antes.src)}"></a><a hidden class="dm-src-b" href="${escH(o.despues.src)}"></a>` : `<template class="dm-src-a">${escH(o.antes.html)}</template><template class="dm-src-b">${escH(o.despues.html)}</template>`}
    </div>`;
  }
  // Visor A/B: dos páginas reales, una por vez y navegables dentro del marco (para salidas de experimentos)
  function visor(o) {
    const w = o.w || W, h = o.h || H;
    const vs = [o.despues, o.antes];
    return `<div class="dm dm--visor" data-dm="visor" data-w="${w}">
      <div class="dm-bar dm-bar--top">
        <div class="dm-seg" role="group" aria-label="Elegí qué versión ver">${vs.map((v, i) => `<button type="button" data-vis="${i}" aria-pressed="${i === 0}">${escH(v.label)}</button>`).join('')}</div>
        <button type="button" class="dm-open" data-vis-open>Abrir en grande <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-8 8M10 5H5v14h14v-5"/></svg></button>
      </div>
      <div class="dm-frame dm-frame--visor" style="aspect-ratio:${w} / ${h}">
        ${vs.map((v, i) => `<iframe class="dm-vis${i === 0 ? ' is-on' : ''}" title="${escH(v.label)}" src="${escH(v.src)}" loading="lazy" width="${w}" height="${h}" style="width:${w}px;height:${h}px"${i ? ' tabindex="-1" aria-hidden="true"' : ''}></iframe>`).join('')}
      </div>
      <p class="dm-vis-tip">Es la página real: podés scrollear y tocar adentro del marco.</p>
    </div>`;
  }

  function tabs(o) {
    const id = 'dm' + Math.random().toString(36).slice(2, 8);
    return `<div class="dm dm--tabs" data-dm="tabs">
      <div class="dm-tabs" role="tablist" aria-label="Antes y después">${o.panes.map((p, i) => `<button type="button" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === o.panes.length - 1}" tabindex="${i === o.panes.length - 1 ? 0 : -1}" data-tone="${p.tone || ''}">${escH(p.label)}</button>`).join('')}</div>
      ${o.panes.map((p, i) => `<div class="dm-pane" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i === o.panes.length - 1 ? '' : ' hidden'}>${p.html}</div>`).join('')}
    </div>`;
  }
  // Ficha de un experimento real: mismo prompt, mismo modelo, sin y con la skill
  const ficha = x => `<details class="dm-exp"><summary><span>Experimento real</span> ${escH(x.modelo)} · ${escH(x.fecha)} · mismo prompt en las dos</summary>
    <div class="dm-exp-in"><p class="dm-exp-p"><b>Prompt</b>${escH(x.prompt)}</p>
    <dl><div><dt></dt><dd><b>Sin la skill</b></dd><dd><b>${escH(x.con)}</b></dd></div>
      ${x.filas.map(([k, a, b]) => `<div><dt>${escH(k)}</dt><dd>${escH(a)}</dd><dd>${escH(b)}</dd></div>`).join('')}</dl>
    <p class="dm-exp-n">${escH(x.como)}</p></div></details>`;
  const notas = (titulo, items) => `<ol class="dm-notes" aria-label="${escH(titulo)}">${items.map(([cmd, t, d]) => `<li>${cmd ? `<code>${escH(cmd)}</code>` : ''}<b>${escH(t)}</b><span>${escH(d)}</span></li>`).join('')}</ol>`;
  const bloque = (titulo, cuerpo, pie) => `<div class="wl-d-block dm-block"><h3>${escH(titulo)}</h3>${cuerpo}${pie ? `<p class="ex-note">${pie}</p>` : ''}</div>`;

  // ═══════════════ Demos por ficha ═══════════════
  const DEMOS = {
    // ── Skills ──
    'skills/impeccable': () => bloque('Antes y después',
      ficha({ modelo: 'Claude Opus 5.5 (Claude Code)', fecha: '30/09/2026', con: 'Con Impeccable',
        prompt: 'Hacé la landing page de Brasa, una parrilla de barrio en Villa Crespo (Buenos Aires), abierta desde 2014. Abre de martes a domingo de 20 a 00 h, en Thames 1234. Los platos y precios de hoy son: Vacío a las brasas $18.400, Ojo de bife de 400 g $21.900, Mollejas al limón $12.600, Provoleta con orégano $7.900 y Flan con dulce de leche $5.200. Las reservas son por WhatsApp. Tiene 4,8 estrellas en Google con 1.247 reseñas. Entregá un solo archivo index.html en esta carpeta, con el CSS adentro y sin imágenes externas, con los textos en español argentino. (Con la skill se agregó: "Usá la skill impeccable para diseñarla.")',
        filas: [['Tiempo', '1 min 47 s', '7 min 33 s'], ['Pasos', '4', '30'], ['Costo de la corrida', 'USD 0,44', 'USD 2,11'], ['Revisó su trabajo', 'No', 'Sí: capturas en escritorio y celular, dos rondas']],
        como: 'Cada versión se generó en una carpeta vacía. La de "sin la skill" corrió con todas las skills desactivadas (--disable-slash-commands). Las páginas se muestran tal cual salieron; solo se les agregó una etiqueta para que Google no las indexe. Brasa es un negocio inventado.' }) +
      visor({ w: 1280, h: 800, antes: { label: 'Sin la skill', src: 'experimentos/impeccable/sin.html' }, despues: { label: 'Con Impeccable', src: 'experimentos/impeccable/con.html' } }) +
      notas('Qué cambió', [
        ['', 'Sin la skill ya sale prolija', 'Paleta de brasas, carta con precios y reserva por WhatsApp. Pero es una plantilla: etiqueta chica sobre el título, tres tarjetas "01 / 02 / 03" iguales y un bloque de cierre genérico.'],
        ['', 'Con Impeccable, un mundo propio', 'La página es el mantel de papel madera: lo que imprime la casa en rojo, lo que anota el mozo en birome azul, botones con forma de sello.'],
        ['', 'Una función que vende', 'Elegís cuántos son, el día y la hora, tildás platos, y el mensaje de WhatsApp sale armado. La otra versión solo abre el chat vacío.'],
        ['', 'Datos que se entienden de un vistazo', 'La semana con el lunes tachado y el día de hoy marcado, y una línea que cambia según la hora ("hoy abrimos a las 20").'],
        ['', 'El costo de la diferencia', 'Cinco veces más caro y cuatro veces más lento: la skill hace que Claude piense la dirección, construya y se revise antes de entregar.'],
      ]),
      'En la versión con Impeccable probá armar la reserva: elegí personas, día y hora, y mirá cómo se arma el mensaje.'),

    'skills/copywriting': () => bloque('Antes y después', tabs({ panes: [
      { label: 'Texto típico', tone: 'bad', html: `<article class="dm-copy">
        <p class="dm-copy-t">Mandolina Borner V5 Multibox Cortador Profesional Alemán</p>
        <p>¡Bienvenido a nuestra tienda! Ofrecemos productos de la más alta calidad. Esta mandolina es ideal para tu cocina. Es muy práctica y fácil de usar. ¡No te la pierdas! Stock disponible. Consultanos.</p>
        <span class="dm-copy-btn">Comprar</span></article>` },
      { label: 'Texto trabajado', tone: 'good', html: `<article class="dm-copy is-good">
        <p class="dm-copy-t">Cortes parejos en segundos, sin tocar la hoja</p>
        <p>La Mandolina V5 de Borner corta, ralla y hace juliana con cinco placas intercambiables. Hecha en Alemania y con cinco años de garantía.</p>
        <ul><li>Rodajas de 3,5 y 7 mm: papas fritas, ensaladas y gratinados.</li><li>Protector de mano incluido: los dedos nunca llegan a la hoja.</li><li>Las cinco placas se guardan en la Multibox, sin cajones revueltos.</li></ul>
        <span class="dm-copy-btn">Comprar con envío gratis</span></article>` },
    ] }) + notas('Qué cambió', [
      ['', 'Beneficio antes que producto', 'El titular dice qué ganás ("cortes parejos") y no repite el nombre.'],
      ['', 'Datos concretos', 'Medidas, cantidad de placas, origen y garantía, en vez de "alta calidad".'],
      ['', 'Responde la objeción', 'El miedo con una mandolina es cortarse: el protector aparece arriba.'],
      ['', 'El botón dice qué conseguís', '"Comprar con envío gratis" en lugar de "Comprar".'],
    ]), 'Ilustración escrita a mano con un producto que trabajé (Borner). El experimento real (mismo prompt sin y con la skill) está en preparación.'),

    'skills/xlsx': () => bloque('Antes y después', tabs({ panes: [
      { label: 'Datos crudos (CSV)', tone: 'bad', html: `<pre class="dm-csv">mes,ventas,unidades,publicidad
2025-06,18420300,1402,5526090
2025-07,19880150,1511,4771236
2025-08,21104700,1590,3587799
2025-09,22950420,1702,3212059
2025-10,24310900,1788,3160417
2025-11,25601200,1846,3072144</pre>` },
      { label: 'Planilla trabajada', tone: 'good', html: sheet() },
    ] }) + notas('Qué hace la skill', [
      ['', 'Formato de moneda y miles', 'Los números se leen de un vistazo: $ 18.420.300 en vez de 18420300.'],
      ['', 'Fórmulas vivas', 'Totales, variación y ACOS se calculan con fórmulas: si cambiás un dato, se actualiza todo.'],
      ['', 'Formato condicional', 'El ACOS se pinta según pasa o no el objetivo del 15%.'],
      ['', 'Encabezado fijo y gráfico', 'La primera fila queda quieta al bajar y el gráfico sale de los mismos datos.'],
    ]), 'Ilustración hecha a mano con la forma de un reporte mensual de Mercado Libre. Tocá una celda del total para ver su fórmula. El experimento real está en preparación.'),

    'skills/react-best-practices': () => bloque('Antes y después', `<div class="dm dm--race" data-dm="race">
      <div class="dm-race">
        <div class="dm-lane"><p><b>Antes</b><span>Pedidos en cadena (cascada)</span></p>
          <div class="dm-track"><i style="--s:0;--d:.42" data-l="usuario"></i><i style="--s:.42;--d:.35" data-l="pedidos"></i><i style="--s:.77;--d:.38" data-l="stock"></i></div><output>1,15 s</output></div>
        <div class="dm-lane is-good"><p><b>Después</b><span>Los tres a la vez (Promise.all)</span></p>
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
    root.querySelectorAll('[data-dm="visor"]').forEach(montarVisor);
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
    const ancho = +el.dataset.w || W;
    const fit = () => frame.style.setProperty('--s', frame.clientWidth / ancho);
    fit(); new ResizeObserver(fit).observe(frame);
    const set = v => {
      frame.style.setProperty('--x', v + '%'); range.value = v;
      el.querySelectorAll('[data-dm-set]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.dmSet === +v)));
    };
    range.addEventListener('input', () => set(range.value));
    el.querySelectorAll('[data-dm-set]').forEach(b => b.addEventListener('click', () => { frame.classList.add('is-anim'); set(b.dataset.dmSet); setTimeout(() => frame.classList.remove('is-anim'), 420); }));
    el.querySelector('[data-dm-open]')?.addEventListener('click', () => {
      const x = +range.value, src = el.querySelector(x < 50 ? '.dm-src-a' : '.dm-src-b');
      if (src.href) { window.open(src.href, '_blank', 'noopener'); return; }
      const tmp = document.createElement('textarea'); tmp.innerHTML = src.innerHTML;
      const url = URL.createObjectURL(new Blob([tmp.value], { type: 'text/html' }));
      window.open(url, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
  }

  function montarVisor(el) {
    const frame = el.querySelector('.dm-frame'), ancho = +el.dataset.w || W, ifs = [...el.querySelectorAll('.dm-vis')];
    const fit = () => frame.style.setProperty('--s', frame.clientWidth / ancho);
    fit(); new ResizeObserver(fit).observe(frame);
    let actual = 0;
    el.querySelectorAll('[data-vis]').forEach(b => b.addEventListener('click', () => {
      actual = +b.dataset.vis;
      el.querySelectorAll('[data-vis]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      ifs.forEach((f, i) => { f.classList.toggle('is-on', i === actual); f.tabIndex = i === actual ? 0 : -1; f.toggleAttribute('aria-hidden', i !== actual); });
    }));
    el.querySelector('[data-vis-open]').addEventListener('click', () => window.open(ifs[actual].getAttribute('src'), '_blank', 'noopener'));
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
