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
  const W = 1200, H = 820; // tamaño de diseño por defecto de las páginas de ejemplo

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

  // ═══════════════ Experimentos reales publicados (tools/experimentos/publicar.py → experimentos/<id>/meta.json) ═══════════════
  // ficha → qué skill, con qué nombre se muestra y qué observé al comparar las dos salidas (se escribe después de verlas)
  const EXPERIMENTOS = {
    'skills/impeccable': { exp: 'impeccable', con: 'Con Impeccable', notas: [
      ['', 'Sin la skill ya sale prolija', 'Paleta de brasas, carta con precios y reserva por WhatsApp. Pero es una plantilla: etiqueta chica sobre el título, tres tarjetas "01 / 02 / 03" iguales y un bloque de cierre genérico.'],
      ['', 'Con Impeccable, un mundo propio', 'La página es el mantel de papel madera: lo que imprime la casa en rojo, lo que anota el mozo en birome azul, botones con forma de sello.'],
      ['', 'Una función que vende', 'Elegís cuántos son, el día y la hora, tildás platos, y el mensaje de WhatsApp sale armado. La otra versión solo abre el chat vacío.'],
      ['', 'Se revisó antes de entregar', 'Sacó capturas en escritorio y celular en dos rondas y corrigió lo que vio. Por eso tardó cuatro veces más y costó cinco veces más.'],
    ], pie: 'En la versión con Impeccable probá armar la reserva: elegí personas, día y hora, y mirá cómo se arma el mensaje. Brasa es un negocio inventado.' },
    'skills/copywriting': { exp: 'copywriting', con: 'Con Copywriting', notas: [
      ['', 'El título entra en Mercado Libre', 'Sin la skill: 79 caracteres (Mercado Libre corta en 60). Con la skill: 57, con marca y modelo adelante, y dos alternativas.'],
      ['', 'Sabe dónde se publica', 'Avisa que Mercado Libre muestra la descripción como texto plano y la escribe con mayúsculas y guiones. La otra usa negritas de Markdown, que en la publicación salen como asteriscos.'],
      ['', 'Responde antes de que pregunten', 'Suma preguntas frecuentes (lavavajillas, protector, garantía) y un cierre que invita a comprar.'],
      ['', 'No inventa', 'Marca qué datos conviene agregar (material, medidas, importador) en lugar de rellenarlos, y sugiere qué fotos subir.'],
    ], pie: 'Datos del producto dados en el prompt. La diferencia es de oficio, no de estilo: las dos se entienden, pero una está lista para publicar.' },
    'skills/marketing-psychology': { exp: 'marketing-psychology', con: 'Con Marketing Psychology', notas: [
      ['', 'La diferencia es chica', 'Sin la skill, Claude ya destaca el pack del medio, lo marca "Recomendado" y muestra el precio por kilo y el ahorro. Esos recursos ya los conoce.'],
      ['', 'Lo que suma la skill', 'El costo por día ($867), el precio tachado de comprar tres de 1 kg, cuánto rinde cada pack y botones con texto propio ("Probar con 1 kg").'],
      ['', 'Cuida lo que afirma', 'Explica por qué no puso "el más vendido" ni stock limitado: no sabe si es cierto. Las dos evitan inventar.'],
      ['', 'Cuándo conviene', 'Para ofertas, precios y promociones más complejas. En una tabla de tres precios, el modelo solo ya resuelve bastante.'],
    ] },
    'skills/xlsx': { exp: 'xlsx', con: 'Con la skill de Excel', notas: [
      ['', 'Las dos sirven', 'Sin la skill ya sale una planilla con fórmulas, totales, lectura para el dueño y cuatro gráficos.'],
      ['', 'Resumen y datos, separados', 'Con la skill arma una hoja para el dueño (indicadores, junio contra noviembre, conclusiones y gráficos) y otra con los datos y las métricas.'],
      ['', 'Convenciones de planilla profesional', 'Los datos de origen van en azul y los cálculos en negro, con una sección de supuestos que explica cada fórmula.'],
      ['', 'Verificada', 'Recalculó el archivo y revisó que sus 57 fórmulas no tengan errores antes de entregar.'],
    ], pie: 'Datos de partida: seis meses de ventas en un CSV. Las imágenes son cada hoja exportada a PDF; descargá el .xlsx para ver las fórmulas.' },
    'skills/react-best-practices': { exp: 'react-best-practices', con: 'Con React Best Practices', notas: [
      ['', 'Casi empate', 'Las dos encontraron el bug grave (el efecto sin dependencias pedía datos a la API sin parar), la cascada de pedidos, la condición de carrera, los errores sin manejar y los problemas de accesibilidad.'],
      ['', 'Con la skill, cada cambio con su regla', 'Nombra la regla que respalda cada cambio (async-parallel, js-index-maps…) y los ordena de más grave a más cosmético.'],
      ['', 'Optimiza solo donde hace falta', 'No memoiza el filtro y el total: son cálculos baratos y se derivan en el render. La otra versión suma useMemo que no aporta.'],
      ['', 'Conclusión', 'En una revisión puntual, el modelo solo ya es muy bueno. La skill rinde más en proyectos grandes, donde hay que aplicar las mismas reglas en cientos de archivos.'],
    ], pie: 'Partieron del mismo componente con errores a propósito (lo podés ver en la ficha del experimento).' },
    'skills/pptx': { exp: 'pptx', con: 'Con la skill de PowerPoint', notas: [
      ['', 'Empate', 'Las dos presentaciones son profesionales, con gráficos y un mensaje claro por diapositiva. Sin la skill hasta suma un dato más (el ticket promedio subió 4,9%).'],
      ['', 'Con la skill, más visual', 'Íconos, títulos que concluyen ("La publicidad rinde 2,5 veces más") y menos texto por diapositiva.'],
      ['', 'Conclusión', 'Para una presentación de cinco diapositivas, el modelo solo ya alcanza. La skill suma más cuando hay que partir de una plantilla de la empresa o editar un archivo existente.'],
    ], pie: 'Los datos son los de mi caso real en Vení a la Cocina. Cada diapositiva se exportó a imagen; descargá el .pptx para abrirlo.' },
    'skills/ad-creative': { exp: 'ad-creative', con: 'Con Ad Creative', notas: [
      ['', 'Respeta los límites de Meta', 'Cuenta los caracteres de cada parte: el gancho entra en los primeros 125 (lo que se ve antes de "más"), el título en 40 y la descripción en 30.'],
      ['', 'Pensados por ubicación', 'Indica para qué formato va cada anuncio (feed 4:5, reels 9:16, carrusel) y describe la pieza visual.'],
      ['', 'Sin la skill también rinde', 'Tres ángulos claros (tiempo, calidad, seguridad), ideas de creatividad y consejos para testear y no chocar con las políticas de Meta.'],
    ] },
    'skills/skill-creator': { exp: 'skill-creator', con: 'Con Skill Creator', notas: [
      ['', 'Se puede medir', 'Con la skill, la nueva skill trae un archivo de evaluaciones (evals.json) con casos de prueba para comprobar que responde bien. Sin la skill, no hay forma de medirla.'],
      ['', 'Se activa cuando corresponde', 'La descripción cubre más formas de pedirlo ("¿qué le contesto?", "armame la respuesta"), aunque no se nombre Mercado Libre.'],
      ['', 'Explica el porqué', 'Cada regla dice por qué importa (una promesa incumplida termina en reclamo y baja la reputación), así Claude decide mejor en casos que no están escritos.'],
      ['', 'Contenido parecido', 'Las dos cubren tono, reglas de Mercado Libre y casos frecuentes: el oficio está en la estructura y en poder probarla.'],
    ] },
    'skills/frontend-design': { exp: 'frontend-design', con: 'Con Frontend Design', notas: [
      ['', 'Sin la skill, plantilla', 'Etiqueta chica sobre el título, fila de cuatro números (12 años, 4,8★, 1.247, 6 noches) y tarjetas iguales para dirección, horario y reservas.'],
      ['', 'Con la skill, identidad', 'Tipografía de cartel condensada, una franja de brasas como imagen principal y la carta escrita en una pizarra.'],
      ['', 'Mismo prompt que Impeccable', 'Se puede comparar con la ficha de Impeccable: Frontend Design tardó 2 min 11 s y costó USD 0,66; Impeccable, 7 min 33 s y USD 2,11, pero sumó la reserva interactiva y se revisó sola.'],
    ], pie: 'Brasa es un negocio inventado. Mismo prompt que el experimento de Impeccable.' },
    'skills/web-design-guidelines': { exp: 'web-design-guidelines', con: 'Con Web Design Guidelines', notas: [
      ['', 'Casi empate', 'Las dos encontraron lo grave: el número de WhatsApp de relleno, los botones que dependen de JavaScript y la navegación que desaparece en el celular.'],
      ['', 'Un hallazgo más', 'Con la skill detectó que el encabezado fijo tapa los títulos y el foco del teclado al navegar (WCAG 2.4.11).'],
      ['', 'Más fácil de corregir', 'Cita la pauta de cada problema y marca archivo y línea exactos.'],
    ], pie: 'Revisaron la landing que hizo Claude sin skills en el experimento de Impeccable (la podés ver en la ficha).' },
    'skills/docx': { exp: 'docx', con: 'Con la skill de Word', notas: [
      ['', 'Empate', 'Las dos propuestas son profesionales, con alcance, plan por mes, inversión con lugares para completar y condiciones.'],
      ['', 'Sin la skill, hasta más completa', 'Suma "Qué necesitamos de Cocina Norte" y un bloque para firmar.'],
      ['', 'Con la skill, formato de documento', 'Encabezado y pie con número de página, y una sección de "Qué vas a recibir".'],
    ], pie: 'Cada página se exportó a imagen; descargá el .docx para abrirlo en Word.' },
    'skills/pdf': { exp: 'pdf', con: 'Con la skill de PDF', notas: [
      ['', 'Empate', 'Para pasar un informe corto a PDF, las dos salieron prolijas y con los números bien destacados.'],
      ['', 'Dónde rinde la skill', 'En tareas más difíciles con PDF: completar formularios, unir o dividir archivos, extraer tablas o leer documentos escaneados.'],
    ] },
    'skills/webapp-testing': { exp: 'webapp-testing', con: 'Con Webapp Testing', notas: [
      ['', 'Las dos probaron de verdad', 'Abrieron la app en un navegador automatizado, cargaron datos como un usuario y encontraron los campos vacíos que se toman como 0, el "NaN" y el "-Infinity".'],
      ['', 'Un bug más, y muy argentino', 'Solo con la skill encontró que si escribís "38.900" (con punto de miles, como se escribe acá) la app lo toma como 38,9 pesos.'],
      ['', 'Más casos', 'Probó 13 casos, además de Enter, el recálculo y el escritorio.'],
    ], pie: 'Partieron de la misma calculadora con errores a propósito (en la ficha del experimento).' },
    'skills/ui-ux-pro-max': { exp: 'ui-ux-pro-max', con: 'Con UI UX Pro Max', notas: [
      ['', 'Diferencia moderada', 'Sin la skill sale una landing prolija de consultorio: servicios, obras sociales, cómo sacar turno y ubicación.'],
      ['', 'Elige estilo y paleta con criterio', 'Tomó de su base el estilo "Accesible y ético" para salud y ajustó los colores para que el texto de los botones cumpla contraste 4,5:1.'],
      ['', 'Más útil para el paciente', 'Muestra si está abierto ahora, los horarios con el día de hoy marcado, las obras sociales arriba y preguntas frecuentes.'],
    ] },
  };
  function experimento(id) {
    const x = EXPERIMENTOS[id];
    return bloque('Antes y después', `<div class="dm dm--exp" data-dm="exp" data-exp="${escH(x.exp)}" data-con="${escH(x.con)}"><div class="dm-exp-load" aria-busy="true"><span></span><span></span><span></span></div></div>` +
      (x.notas ? notas('Qué cambió', x.notas) : ''), x.pie || '');
  }
  const seg2 = s => s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
  const usd = n => 'USD ' + (n ?? 0).toFixed(2).replace('.', ',');
  async function montarExp(el) {
    const id = el.dataset.exp, con = el.dataset.con, base = `experimentos/${id}/`;
    let m;
    try { m = await (await fetch(base + 'meta.json')).json(); } catch (e) { el.innerHTML = '<p class="ex-note">No se pudo cargar el experimento.</p>'; return; }
    const lados = [['sin', 'Sin la skill'], ['con', con]];
    const principal = l => m[l].archivos.filter(a => !a.aux);
    const tipo = (principal('con')[0] || principal('sin')[0] || {}).tipo;
    const fichaHtml = ficha({ modelo: 'Claude ' + (m.con.modelos?.[0] || m.sin.modelos?.[0] || '').replace('claude-', '').replace(/-(\d)-(\d)/, ' $1.$2').replace(/^./, c => c.toUpperCase()) + ' (Claude Code)', fecha: m.fecha, con,
      prompt: m.prompt + (m.entrada.length ? ` (Archivos de partida: ${m.entrada.join(', ')})` : '') + ` (Con la skill se agregó: "Usá la skill…")`,
      filas: [['Tiempo', seg2(m.sin.segundos), seg2(m.con.segundos)], ['Pasos', String(m.sin.pasos ?? '—'), String(m.con.pasos ?? '—')], ['Costo de la corrida', usd(m.sin.costo), usd(m.con.costo)],
        ...(m.con.skills ? [['Skills que cargó', m.sin.skills?.length ? m.sin.skills.join(', ') : 'Ninguna', m.con.skills.join(', ') || 'Ninguna']] : [])],
      como: 'Cada versión se generó en una carpeta vacía con el mismo prompt. La de "sin la skill" corrió con todas las skills desactivadas. Las salidas se muestran tal cual: sin retoques.' });
    let cuerpo = '';
    if (tipo === 'pagina') {
      const src = l => base + principal(l).find(a => a.tipo === 'pagina')?.ruta;
      cuerpo = visor({ w: 1280, h: 800, antes: { label: 'Sin la skill', src: src('sin') }, despues: { label: con, src: src('con') } });
    } else {
      const col = async l => {
        const as = principal(l);
        if (!as.length) return '<p class="dm-exp-vacio">No generó archivos.</p>';
        const partes = await Promise.all(as.map(async a => {
          const dl = `<a class="dm-exp-dl" href="${base + a.ruta}" download>${escH(a.nombre)}</a>`;
          if (a.tipo === 'texto') return `<div class="dm-md">${await (await fetch(base + a.vista)).text()}</div>`;
          if (a.tipo === 'imagen') return `<div class="dm-pags">${(a.paginas || []).map(pg => `<a href="${base + pg}" target="_blank" rel="noopener" title="Ver en grande"><img src="${base + pg}" alt="${escH(a.nombre)}" loading="lazy"></a>`).join('')}</div>`;
          if (a.tipo === 'documento') return `<div class="dm-pags">${(a.paginas || []).map((pg, i) => `<a href="${base + pg}" target="_blank" rel="noopener" title="Ver en grande"><img src="${base + pg}" alt="${escH(a.nombre)}, página ${i + 1}" loading="lazy"></a>`).join('')}</div>${dl}`;
          if (a.tipo === 'codigo') return `<p class="dm-exp-fn">${escH(a.nombre)}</p><pre class="dm-exp-code">${escH(await (await fetch(base + a.ruta)).text())}</pre>`;
          return dl;
        }));
        return partes.join('');
      };
      const [a, b] = await Promise.all([col('sin'), col('con')]);
      cuerpo = `<div class="dm-cols">${[[a, 'Sin la skill', 'bad'], [b, con, 'good']].map(([h, t, tone]) => `<section class="dm-col" data-tone="${tone}"><h4>${escH(t)}</h4><div class="dm-col-in">${h}</div></section>`).join('')}</div>`;
    }
    const dijo = lados.map(([l, t]) => m[l].resumen ? `<details class="dm-dijo"><summary>Lo que dijo Claude al entregar (${escH(t.toLowerCase())})</summary><div>${escH(m[l].resumen).replace(/\n/g, '<br>')}</div></details>` : '').join('');
    const partida = m.entrada.length ? `<p class="dm-exp-partida">Archivos de partida (iguales para las dos): ${m.entrada.map(f => `<a href="${base}entrada/${escH(f)}" target="_blank" rel="noopener">${escH(f)}</a>`).join(', ')}</p>` : '';
    el.innerHTML = fichaHtml + partida + cuerpo + dijo;
    mount(el);
  }

  function stackDemo(nombre, codigo, nota) {
    return bloque('El mismo botón, en ' + nombre, `<div class="dm dm--stack" data-dm="stack">
      <div class="dm-stack-live"><button type="button" class="dm-stack-btn" data-stack-add>Agregar al carrito</button><span class="dm-stack-n" aria-live="polite"><b data-stack-n>0</b> en el carrito</span></div>
      <pre class="dm-stack-code">${codigo}</pre>
    </div>`, escH(nota) + ' Compará con las otras fichas de Stacks: es el mismo ejemplo en cada una.');
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
    if (EXPERIMENTOS[`${cat}/${e.id}`]) return experimento(`${cat}/${e.id}`);
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
    root.querySelectorAll('[data-ux]').forEach(el => { if (!el.dataset.ok && MONTADORES[el.dataset.ux]) { el.dataset.ok = 1; MONTADORES[el.dataset.ux](el); } });
    root.querySelectorAll('[data-dm="exp"]').forEach(el => { if (!el.dataset.ok) { el.dataset.ok = 1; montarExp(el); } });
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

  // Para las tarjetas: 'exp' si la ficha tiene un experimento real, 'demo' si tiene una demo interactiva
  function tipoDemo(cat, id) {
    const k = `${cat}/${id}`;
    return EXPERIMENTOS[k] || k === 'skills/impeccable' ? 'exp' : DEMOS[k] || cat === 'tipografias' ? 'demo' : '';
  }
  // Registro desde otros archivos (programacion-ux.js): demos por ficha y montadores por tipo (data-ux="…")
  const MONTADORES = {};
  function agregar(demos, montadores = {}) { Object.assign(DEMOS, demos); Object.assign(MONTADORES, montadores); }
  const util = { bloque, notas, escH };
  return { render, mount, tipoDemo, agregar, util };
})();
