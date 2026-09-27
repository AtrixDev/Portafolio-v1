/* ============================================================
   PROGRAMACION-EJEMPLOS.JS — "Así se ve": ejemplos visuales de cada ficha
   Lo usa renderEntry() de programacion.js (se carga antes).
     estilos     → mini interfaz con los colores y efectos del estilo
     landing     → wireframe armado con el orden de secciones
     paletas     → interfaz de muestra pintada con la paleta
     rubros      → la paleta del rubro aplicada
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
  function estilo(e) {
    const fam = familia(e.id);
    const sw = vivid(e.swatches || []);
    const c1 = sw[0] || '#4f46e5', c2 = sw[1] || c1, c3 = sw[2] || c2;
    const mock = `
      <div class="ex-stage"><div class="ex ex--${fam}" style="--c1:${c1};--c2:${c2};--c3:${c3};--ink1:${inkOn(c1)}">
        <div class="ex-nav"><span class="ex-logo"></span><span class="ex-links"><i></i><i></i><i></i></span></div>
        <div class="ex-body">
          <div class="ex-card">
            <p class="ex-kicker">Nuevo</p>
            <p class="ex-h">Mandolina V5</p>
            <p class="ex-p">Cortes perfectos en segundos, apta lavavajillas.</p>
            <div class="ex-row"><span class="ex-btn">Comprar</span><span class="ex-chip">Envío gratis</span></div>
          </div>
          <div class="ex-side"><span></span><span></span></div>
        </div>
      </div></div>`;
    return block('Así se ve', mock, 'Recreación aproximada del estilo con sus colores y efectos, para darte una idea. No es una captura de un sitio real.');
  }

  // ── Landing: wireframe con el orden de secciones ──
  function landing(e) {
    const orden = (e.fields || []).find(([k]) => k === 'Orden de secciones')?.[1] || e.summary || '';
    const partes = orden.split(/\s*\d+\.\s*/).map(s => s.replace(/[,.]\s*$/, '').trim()).filter(Boolean);
    if (!partes.length) return '';
    const secc = partes.map((p, i) => {
      const cls = i === 0 ? 'is-hero' : /cta|llamado|inscrip|registro|compr|descarg|contact|suscrib/i.test(p) ? 'is-cta' : /testimon|rese|prueba social|logos/i.test(p) ? 'is-proof' : /precio|plan|tabla|compar/i.test(p) ? 'is-grid' : /pie|footer/i.test(p) ? 'is-foot' : '';
      return `<div class="wf-sec ${cls}"><span class="wf-n">${i + 1}</span><span class="wf-label">${esc(p)}</span>${
        cls === 'is-hero' ? '<span class="wf-bars"><i></i><i></i></span><span class="wf-pill">CTA</span>' :
        cls === 'is-cta' ? '<span class="wf-pill">CTA</span>' :
        cls === 'is-grid' || cls === 'is-proof' ? '<span class="wf-cols"><i></i><i></i><i></i></span>' : '<span class="wf-bars"><i></i></span>'}</div>`;
    }).join('');
    return block('Así se arma', `<div class="wf">${secc}</div>`, 'Wireframe generado con el orden de secciones del patrón.');
  }

  // ── Paletas: interfaz de muestra ──
  function paletaMock(pal) {
    const p = Object.fromEntries(pal);
    const bg = p.Fondo || '#ffffff', fg = p.Texto || '#111111', pri = p.Primario || '#2563eb';
    const acc = p.Acento || pri, card = p.Tarjeta || bg, muted = p.Apagado || bg, border = p.Borde || 'rgba(0,0,0,.1)', bad = p.Destructivo || '#dc2626';
    return `<div class="ex-stage"><div class="pm" style="--bg:${bg};--fg:${fg};--pri:${pri};--pri-ink:${inkOn(pri)};--acc:${acc};--acc-ink:${inkOn(acc)};--card:${card};--muted:${muted};--line:${border};--bad:${bad}">
      <div class="pm-bar"><span class="pm-logo"></span><span class="pm-nav"><i></i><i></i></span></div>
      <div class="pm-body">
        <div class="pm-card">
          <p class="pm-h">Resumen del mes</p>
          <p class="pm-p">Ventas +18% y ACOS en 12,4%. Tres publicaciones necesitan fotos.</p>
          <div class="pm-row"><span class="pm-btn">Ver detalle</span><span class="pm-ghost">Exportar</span><span class="pm-badge">3 alertas</span></div>
        </div>
        <div class="pm-muted"><i></i><i></i></div>
      </div>
    </div></div>`;
  }
  function paleta(e) {
    return e.palette?.length ? block('Así se ve', paletaMock(e.palette), 'La paleta aplicada a una interfaz de ejemplo: fondo, tarjeta, texto, botón principal y alertas.') : '';
  }
  async function rubro(e) {
    try {
      const pals = await loadCat('paletas');
      const pal = pals.find(p => p.id === e.id);
      if (pal) return block('Así se ve (paleta del rubro)', paletaMock(pal.palette), `Paleta recomendada para ${esc(e.name)}. Tocá "Paletas de color" para copiar los códigos.`);
    } catch (err) {}
    return '';
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
      case 'paletas':       return paleta(e);
      case 'rubros':        return rubro(e);
      case 'arquitecturas': return flujo(e);
      case 'soluciones':    return ejemplos(e);
      case 'skills':        return skill(e);
      default:              return '';
    }
  }
  return { render };
})();
