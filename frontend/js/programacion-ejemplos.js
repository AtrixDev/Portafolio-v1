/* ============================================================
   PROGRAMACION-EJEMPLOS.JS — "Así se ve": ejemplos visuales de cada ficha
   Lo usa renderEntry() de programacion.js (se carga antes). Necesita programacion-rubros.js.
     estilos     → mini interfaz con los colores y efectos del estilo
     landing     → wireframe armado con el orden de secciones
     rubros      → ejemplo de la web del rubro pintado con su paleta (programacion-rubros.js)
     arquitecturas → diagrama del flujo de un pedido
     soluciones  → sitios reales de ejemplo
     skills      → instalación + prompt de ejemplo
   ============================================================ */

window.WLExamples = (function () {
  const hexRe = /^#[0-9a-f]{6}$/i;
  const lum = h => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return .2126 * r + .7152 * g + .0722 * b;
  };
  const inkOn = h => (hexRe.test(h) && lum(h) > .4 ? '#141416' : '#ffffff');
  const vivid = list => list.filter(h => hexRe.test(h)).filter(h => { const l = lum(h); return l > .03 && l < .85; });

  const block = (title, body, note = '') =>
    `<div class="wl-d-block"><h3>${title}</h3>${body}${note ? `<p class="ex-note">${note}</p>` : ''}</div>`;

  // ── Estilos: familia visual según el id del estilo ──
  const FAMILIAS = [
    [/liquid-glass|glass|spatial/, 'glass'],
    [/neumorph|soft-ui/, 'neu'],
    [/brutal|gen-z|chaos|maximal/, 'brutal'],
    [/clay/, 'clay'],
    [/dark|oled|cyber|terminal|hud|sci-fi|matrix/, 'dark'],
    [/aurora|gradient|mesh|vibrant|y2k|vaporwave|memphis|chromatic|holograph/, 'vivid'],
    [/retro|pixel|vintage|analog|80s|arcade/, 'retro'],
    [/skeuo|3d|tactile|hyperreal|deformable/, 'skeuo'],
    [/bento/, 'bento'],
    [/editorial|magazine|typograph|kinetic|exaggerated|bold/, 'editorial'],
    [/organic|biophilic|nature|biomimetic|anti-polish|sketch|hand/, 'organic'],
    [/minimal|swiss|e-ink|paper|monochrome|zero-interface|accessible|inclusive/, 'minimal'],
  ];
  function familia(id) {
    for (const [re, f] of FAMILIAS) if (re.test(id)) return f;
    return 'flat';
  }
  // Contenido del ejemplo según para qué sirve el estilo ("Ideal para"): un rubro representativo de esa familia
  const USOS = [
    [/dashboard|analítica|analytics|datos|fintech|financ|saas|b2b|empresarial|panel/i, 'saas-general'],
    [/e-?commerce|tienda|retail|producto|moda|lujo|marca/i, 'e-commerce'],
    [/salud|bienestar|médic|clínica|spa|meditación|fitness/i, 'veterinary-clinic'],
    [/restaurante|comida|gastronom|café|food/i, 'restaurant-food-service'],
    [/educa|curso|aprendizaje|chicos|niños/i, 'online-course-e-learning'],
    [/gaming|juego|entretenimiento/i, 'gaming'],
    [/música|video|streaming|podcast|medios/i, 'music-streaming'],
    [/portfolio|agencia|creativ|diseño|arte|fotograf/i, 'legal-services'],
    [/noticia|editorial|revista|blog|documentación|contenido/i, 'api-developer-portal'],
    [/evento|boda|casamiento|festival/i, 'wedding-event-planning'],
    [/gobierno|público|inclusiv|ong|social/i, 'non-profit-charity'],
    [/viaje|hotel|turismo/i, 'hotel-hospitality'],
    [/inmobili|propiedad/i, 'real-estate-property'],
    [/herramienta|productividad|developer|programación/i, 'productivity-tool'],
  ];
  function contenidoEstilo(e) {
    const ideal = (e.fields || []).find(([k]) => k === 'Ideal para')?.[1] || e.summary || '';
    const id = (USOS.find(([re]) => re.test(ideal)) || [null, 'e-commerce'])[1];
    return window.WLRubros ? WLRubros.datos(id) : { marca: 'Tu marca', h: 'Mandolina V5', p: 'Cortes perfectos en segundos, apta lavavajillas.', b: 'Comprar', g: 'Envío gratis', familia: 'Tiendas' };
  }
  function estilo(e) {
    const fam = familia(e.id);
    const sw = vivid(e.swatches || []);
    const c1 = sw[0] || '#4f46e5', c2 = sw[1] || c1, c3 = sw[2] || c2;
    const d = contenidoEstilo(e);
    const mock = `
      <div class="ex-stage"><div class="ex ex--${fam}" style="--c1:${c1};--c2:${c2};--c3:${c3};--ink1:${inkOn(c1)}">
        <div class="ex-nav"><span class="ex-logo"></span><span class="ex-marca">${esc(d.marca)}</span><span class="ex-links"><i></i><i></i><i></i></span></div>
        <div class="ex-body">
          <div class="ex-card">
            <p class="ex-h">${esc(d.h)}</p>
            <p class="ex-p">${esc(d.p)}</p>
            <div class="ex-row"><span class="ex-btn">${esc(d.b)}</span><span class="ex-chip">${esc(d.g)}</span></div>
          </div>
          <div class="ex-side"><span></span><span></span></div>
        </div>
      </div></div>`;
    return block('Así se ve', mock, `Recreación aproximada del estilo con sus colores y efectos, aplicada a un ejemplo inventado de ${esc((d.familia || 'sitio').toLowerCase())}, uno de los usos para los que se recomienda. No es una captura de un sitio real.`);
  }

  // ── Landing: la página armada con el orden de secciones del patrón ──
  // Mismo negocio inventado en todos los patrones (Yerbal del Monte) para comparar la estructura, no el contenido.
  const LP = {
    hero: x => {
      const v = /video/.test(x) ? 'video' : /buscador|búsqueda/.test(x) ? 'busca' : /cuenta regresiva|temporizador/.test(x) ? 'reloj' : /formulario/.test(x) ? 'form' : /mockup|dispositivo/.test(x) ? 'cel' : /configurador/.test(x) ? 'conf' : /prompt|personaliz|dinámico/.test(x) ? 'prompt' : '';
      const extra = v === 'busca' ? '<span class="lp-in">Buscá tu yerba: suave, con palo, orgánica…</span>'
        : v === 'reloj' ? '<span class="lp-reloj"><b>02</b>d <b>14</b>h <b>09</b>m</span>'
        : v === 'form' ? '<span class="lp-in">Tu email</span><span class="lp-b">Quiero el descuento</span>'
        : v === 'prompt' ? '<span class="lp-in">Contanos cómo tomás mate y te recomendamos…</span>'
        : v === 'conf' ? '<span class="lp-sw"><i></i><i></i><i></i></span><span class="lp-b">Armar mi pack</span>'
        : '<span class="lp-b">Comprar ahora</span><span class="lp-b2">Ver packs</span>';
      return `<div class="lp-hero${v === 'video' ? ' is-video' : ''}"><div><p class="lp-h1">Yerba orgánica, de la chacra a tu mate</p><p class="lp-p">Sin agroquímicos, estacionada 12 meses. Envío gratis desde 2 kg.</p><p class="lp-row">${extra}</p></div>${v === 'cel' ? '<span class="lp-cel"></span>' : v === 'video' ? '<span class="lp-play">▶</span>' : '<span class="lp-img"></span>'}</div>`;
    },
    cards: () => `<div class="lp-3">${['Orgánica certificada', 'Estacionada 12 meses', 'Envío en 48 h'].map(t => `<div class="lp-card"><i></i><b>${t}</b><span></span></div>`).join('')}</div>`,
    bento: () => `<div class="lp-bento"><div class="is-big"><b>Orgánica certificada</b></div><div><b>12 meses</b></div><div><b>48 h</b></div><div><b>Sin palo</b></div></div>`,
    quotes: () => `<div class="lp-3">${['"La más rica que probé."', '"Llega rapidísimo."', '"Suave y rinde."'].map(q => `<div class="lp-q">${q}<small>★★★★★ · cliente</small></div>`).join('')}</div>`,
    stars: () => `<div class="lp-stars"><b>4,8</b><span>★★★★★<small>1.240 reseñas</small></span><span class="lp-bars"><i style="--v:.82"></i><i style="--v:.12"></i><i style="--v:.04"></i></span></div>`,
    logos: () => `<div class="lp-logos">${'<i></i>'.repeat(5)}</div>`,
    cifra: () => `<p class="lp-cifra"><b>+3.400</b> mateadores ya se sumaron</p>`,
    precios: () => `<div class="lp-3">${[['1 kg', '$9.500'], ['3 kg', '$26.000'], ['6 kg', '$48.000']].map(([t, p], k) => `<div class="lp-card${k === 1 ? ' is-dest' : ''}"><b>${t}</b><b class="lp-precio">${p}</b><span class="lp-b">Elegir</span></div>`).join('')}</div>`,
    tabla: () => `<table class="lp-tab"><tr><th></th><th>Yerbal</th><th>Otras</th></tr><tr><td>Orgánica</td><td>✓</td><td>✗</td></tr><tr><td>12 meses</td><td>✓</td><td>✗</td></tr><tr><td>Envío gratis</td><td>✓</td><td>—</td></tr></table>`,
    faq: () => `<div class="lp-faq">${['¿Tiene palo?', '¿Cuánto tarda el envío?', '¿Es apta celíacos?'].map(q => `<p>${q}<span>+</span></p>`).join('')}</div>`,
    cta: () => `<div class="lp-cta"><b>Probá tu primer kilo con envío gratis</b><span class="lp-b">Comprar</span></div>`,
    form: () => `<div class="lp-form"><span class="lp-in">Nombre</span><span class="lp-in">Email</span><span class="lp-b">Enviar</span></div>`,
    pasos: () => `<div class="lp-pasos">${['Elegís el pack', 'Lo despachamos', 'Matear'].map((t, k) => `<span><i>${k + 1}</i>${t}</span>`).join('')}</div>`,
    problema: () => `<p class="lp-prob">¿Tu yerba te cae pesada y se lava en dos cebadas?</p>`,
    media: () => `<div class="lp-media"><span>▶</span></div>`,
    carrusel: () => `<div class="lp-carr"><i></i><i class="is-on"></i><i></i></div>`,
    gente: () => `<div class="lp-3">${['Ana', 'Martín', 'Lucía'].map(n => `<div class="lp-persona"><i></i><b>${n}</b><small>Productora</small></div>`).join('')}</div>`,
    agenda: () => `<div class="lp-agenda">${[['10:00', 'Cómo se cultiva'], ['11:30', 'Cata guiada'], ['13:00', 'Feria de productores']].map(([h, t]) => `<p><b>${h}</b>${t}</p>`).join('')}</div>`,
    chips: () => `<div class="lp-chips">${['Suave', 'Con palo', 'Barbacuá', 'Compuesta', 'Orgánica', 'Packs'].map(c => `<span>${c}</span>`).join('')}</div>`,
    grilla: () => `<div class="lp-grilla"><i></i><i class="is-alta"></i><i></i><i></i><i class="is-alta"></i><i></i></div>`,
    specs: () => `<div class="lp-specs">${[['Origen', 'Misiones'], ['Estacionamiento', '12 meses'], ['Corte', 'Despalada']].map(([a, b]) => `<p><span>${a}</span><b>${b}</b></p>`).join('')}</div>`,
    urgencia: () => `<div class="lp-cta is-urg"><b>Bono: termo de regalo · quedan 6 h</b><span class="lp-reloj"><b>05</b>h <b>59</b>m</span></div>`,
    confianza: () => `<div class="lp-chips">${['Compra protegida', 'Pago seguro', 'Devolución gratis'].map(c => `<span>✓ ${c}</span>`).join('')}</div>`,
    pie: () => `<div class="lp-pie"><b>Yerbal del Monte</b><span>Instagram · WhatsApp · Contacto</span></div>`,
    texto: x => `<div class="lp-txt"><b>${esc(x.replace(/\s*\(.*?\)/g, '').replace(/^./, c => c.toUpperCase()))}</b><span></span><span></span></div>`,
  };
  const tipoLP = x =>
    /^hero|titular del hero/.test(x) ? 'hero' : /pie$|^pie |footer/.test(x) ? 'pie' : /bento/.test(x) ? 'bento' :
    /preguntas/.test(x) ? 'faq' : /precio y espec|especificaciones/.test(x) ? 'specs' : /precios|planes|tarjetas de precios/.test(x) ? 'precios' :
    /tabla|matriz|comparaci/.test(x) ? 'tabla' : /testimonio|reseñas individuales|sobre el autor|bio del/.test(x) ? (/autor|bio/.test(x) ? 'gente' : 'quotes') :
    /calificaci|reseñas y/.test(x) ? 'stars' : /logos|sponsors/.test(x) ? 'logos' : /cantidad de|prueba social|miembros/.test(x) ? (/miembros/.test(x) ? 'gente' : 'cifra') :
    /oradores|equipo/.test(x) ? 'gente' : /agenda/.test(x) ? 'agenda' : /urgencia|bonos|cuenta regresiva/.test(x) ? 'urgencia' :
    /confianza/.test(x) ? 'confianza' : /formulario|email|lead magnet|contacto$/.test(x) ? 'form' :
    /cómo funciona|paso \d|capítulo|recorrido|progresión/.test(x) ? 'pasos' : /problema/.test(x) ? 'problema' :
    /carrusel|capturas|slider/.test(x) ? 'carrusel' : /video|mockup|vista previa|adelanto|interactivo|demo/.test(x) ? 'media' :
    /categor|temas|industria|por rol|ediciones/.test(x) ? 'chips' : /proyectos|publicaciones destacadas|grilla/.test(x) ? 'grilla' :
    /funcionalidad|beneficio|propuesta de valor|características|tarjetas de detalle|resumen de la solución|qué vas a aprender/.test(x) ? 'cards' :
    /cta|comprar|compra$|contactar|sumarse|inscripci|descarga/.test(x) ? 'cta' : 'texto';
  function landing(e) {
    const orden = (e.fields || []).find(([k]) => k === 'Orden de secciones')?.[1] || e.summary || '';
    const partes = orden.split(/\s*\d+\.\s*/).map(s => s.replace(/[,.]\s*$/, '').trim()).filter(Boolean);
    if (!partes.length) return '';
    const secc = partes.map((p, i) => {
      const x = p.toLowerCase(), t = tipoLP(x);
      return `<section class="lp-sec"><span class="lp-n">${i + 1}<small>${esc(p)}</small></span>${(LP[t] || LP.texto)(x)}</section>`;
    }).join('');
    return block('Así se arma', `<div class="lp">${secc}</div>`, 'La página armada con el orden de secciones del patrón, con un negocio inventado (Yerbal del Monte). El mismo negocio en todos los patrones, para comparar cómo cambia la estructura.');
  }

  // ── Paletas y rubros: la paleta aplicada a un ejemplo de la web de ESE rubro ──
  // El contenido sale de programacion-rubros.js (familia + texto propio de cada rubro).
  // Una paleta sin rubro usa un "sitio de negocio" neutro.
  function pieza(d) {
    const w = d.w || [];
    const prog = pct => `<div class="pm-prog"><i style="width:${Math.max(0, Math.min(100, +pct || 0))}%"></i></div>`;
    switch (d.t) {
      case 'prog':   return `${prog(w[0])}<p class="pm-meta"><b>${esc(w[1])}</b><span>${esc(w[2])}</span></p>`;
      case 'slots':  return `<p class="pm-meta"><span>${esc(w[0])}</span></p><div class="pm-slots">${w.slice(1).map((x, i) => `<span class="pm-slot${i ? '' : ' is-on'}">${esc(x)}</span>`).join('')}</div>`;
      case 'kpis':   return `<div class="pm-kpis">${w.map(([a, b]) => `<div><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('')}</div>`;
      case 'precio': return `<p class="pm-price">${esc(w[0])}</p><p class="pm-meta"><span>${esc(w[1])}</span></p>`;
      case 'campos': return `<div class="pm-fields">${w.map(([a, b]) => `<span><small>${esc(a)}</small>${esc(b)}</span>`).join('')}</div>`;
      case 'player': return `<div class="pm-player"><span class="pm-play" aria-hidden="true"></span><span><b>${esc(w[0])}</b><small>${esc(w[1])}</small></span></div>${prog(w[2])}`;
      case 'fecha':  return `<div class="pm-date"><span class="pm-cal"><b>${esc(w[0])}</b><small>${esc(w[1])}</small></span><small>${esc(w[2])}</small></div>`;
      case 'chat':   return `<div class="pm-chat">${w.map(([a, b], i) => `<p class="${i % 2 ? 'is-me' : ''}"><small>${esc(a)}</small>${esc(b)}</p>`).join('')}</div>`;
      case 'big':    return `<div class="pm-big"><b>${esc(w[0])}</b><small>${esc(w[1])}</small></div>${w[2] != null ? prog(w[2]) : ''}`;
      default:       return `<ul class="pm-rows">${w.map(([a, b]) => `<li><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join('')}</ul>`;
    }
  }
  function paletaMock(pal, id) {
    const p = Object.fromEntries(pal);
    const bg = p.Fondo || '#ffffff', fg = p.Texto || '#111111', pri = p.Primario || '#2563eb';
    const acc = p.Acento || pri, card = p.Tarjeta || bg, muted = p.Apagado || bg, border = p.Borde || 'rgba(0,0,0,.1)', bad = p.Destructivo || '#dc2626';
    const d = window.WLRubros ? WLRubros.datos(id) : { t: 'rows', marca: 'Tu Empresa', h: 'Soluciones para tu negocio', p: 'Atención personalizada.', w: [], b: 'Pedir presupuesto', g: 'Conocé más' };
    return `<div class="ex-stage"><div class="pm pm--${d.t}" style="--bg:${bg};--fg:${fg};--pri:${pri};--pri-ink:${inkOn(pri)};--acc:${acc};--acc-ink:${inkOn(acc)};--card:${card};--muted:${muted};--line:${border};--bad:${bad}">
      <div class="pm-bar"><span class="pm-brand"><span class="pm-logo"></span>${esc(d.marca)}</span><span class="pm-nav"><i></i><i></i></span></div>
      <div class="pm-body">
        <div class="pm-card">
          <p class="pm-h">${esc(d.h)}</p>
          <p class="pm-p">${esc(d.p)}</p>
          ${pieza(d)}
          <div class="pm-row"><span class="pm-btn">${esc(d.b)}</span><span class="pm-ghost">${esc(d.g)}</span></div>
        </div>
        <div class="pm-muted"><i></i><i></i><i></i></div>
      </div>
    </div></div>`;
  }
  const notaEjemplo = id => {
    const d = window.WLRubros?.datos(id);
    return d && !d.neutro ? ` Ejemplo inventado de una web de este rubro (familia: ${esc(d.familia.toLowerCase())}).` : ' Ejemplo neutro de un sitio de negocio.';
  };
  // La paleta ya viene dentro de cada rubro (e.palette)
  function rubro(e) {
    return e.palette?.length ? block('Así se ve (paleta del rubro)', paletaMock(e.palette, e.id), `Paleta recomendada para ${esc(e.name)}.${notaEjemplo(e.id)} Tocá un color de la lista de abajo para copiar el código.`) : '';
  }

  // ── Arquitecturas: diagrama del flujo ──
  function flujo(e) {
    if (!e.flow?.length) return '';
    const nodos = e.flow.map(([t, s], i) => `${i ? '<span class="fl-arrow" aria-hidden="true"></span>' : ''}<div class="fl-node"><strong>${esc(t)}</strong><small>${esc(s)}</small></div>`).join('');
    return block('Cómo viaja un pedido', `<div class="fl" role="img" aria-label="${esc(e.flow.map(f => f[0]).join(' → '))}">${nodos}</div>`);
  }

  // ── Tipos de web: sitios reales ──
  function ejemplos(e) {
    if (!e.examples?.length) return '';
    const links = e.examples.map(([t, u]) => {
      const ext = /^https?:/.test(u);
      return `<a class="ex-link" href="${esc(u)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(t)} ${ext ? `<small>${esc(u.replace(/^https?:\/\/(www\.)?/, ''))}</small>` : '<small>en este sitio</small>'}</a>`;
    }).join('');
    return block('Ejemplos reales', `<div class="wl-related">${links}</div>`);
  }

  // ── Skills: instalación + prompt de ejemplo ──
  function skill(e) {
    let out = '';
    if (e.prompt) out += block('Probala con este prompt', `<div class="sk-prompt"><p>${esc(e.prompt)}</p><button type="button" class="sk-copy" data-copy="${esc(e.prompt)}">${icon('copy')}<span>Copiar</span></button></div>`);
    if (e.install) out += block('Cómo se instala (Claude Code)', `<div class="sk-install"><pre>${esc(e.install)}</pre><button type="button" class="sk-copy" data-copy="${esc(e.install)}">${icon('copy')}<span>Copiar</span></button></div>`);
    if (e.source) out += block('Fuente', `<div class="wl-related"><a class="ex-link" href="${esc(e.source)}" target="_blank" rel="noopener">Ver en GitHub <small>${esc(e.source.replace(/^https:\/\/github\.com\//, ''))}</small></a></div>`);
    return out;
  }

  async function render(e, cat) {
    switch (cat) {
      case 'estilos':       return estilo(e);
      case 'landing':       return landing(e);
      case 'rubros':        return rubro(e);
      case 'arquitecturas': return flujo(e);
      case 'soluciones':    return ejemplos(e);
      case 'skills':        return skill(e);
      default:              return '';
    }
  }
  return { render };
})();
