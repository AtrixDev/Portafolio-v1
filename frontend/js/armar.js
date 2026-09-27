/* ============================================================
   ARMAR.JS — Constructor "Armá tu web"
   El visitante elige rubro, objetivo, estilo, colores, tipografía,
   secciones y funcionalidades; ve su web en vivo y la pide con un clic.
   Presets por rubro: data/weblab/negocios.json (tools/weblab_negocios.py)
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const WA_NUMBER = '541144474507';

  // ── Opciones ──
  const OBJETIVOS = [
    ['consultas', 'Recibir consultas por WhatsApp', 'Que te escriban directo, con la consulta armada.'],
    ['vender',    'Vender online',                  'Catálogo, carrito y pago con Mercado Pago.'],
    ['turnos',    'Dar turnos o reservas',          'Que reserven solos, a cualquier hora.'],
    ['leads',     'Captar clientes con formulario', 'Consultas con datos para cotizar.'],
    ['mostrar',   'Mostrar mis trabajos',           'Galería y portfolio que convencen.'],
  ];
  const ESTILOS = [
    ['minimal',   'Minimal',        'Limpio y directo'],
    ['calido',    'Cálido',         'Cercano y amable'],
    ['oscuro',    'Oscuro premium', 'Elegante y nocturno'],
    ['vibrante',  'Vibrante',       'Con energía y color'],
    ['editorial', 'Editorial',      'Sobrio, tipo revista'],
    ['brutal',    'Audaz',          'Bordes duros, impacto'],
  ];
  const PALETAS = {
    terracota: { n: 'Terracota', bg: '#f7f3ee', fg: '#2b211c', pri: '#b5482a', acc: '#e9a23b', card: '#ffffff', muted: '#efe6dc' },
    bosque:    { n: 'Bosque',    bg: '#f3f5f1', fg: '#1d2a22', pri: '#2f5d46', acc: '#c9a227', card: '#ffffff', muted: '#e3ebe4' },
    marino:    { n: 'Marino',    bg: '#f4f6fa', fg: '#14213d', pri: '#1f3a68', acc: '#fca311', card: '#ffffff', muted: '#e5e9f2' },
    clinico:   { n: 'Clínico',   bg: '#f5fafb', fg: '#12303a', pri: '#0f7c8c', acc: '#2fb892', card: '#ffffff', muted: '#e2f1f3' },
    grafito:   { n: 'Grafito',   bg: '#111113', fg: '#efefea', pri: '#ffe14a', acc: '#ffe14a', card: '#1b1b1e', muted: '#202024' },
    lavanda:   { n: 'Lavanda',   bg: '#faf7fc', fg: '#2a2233', pri: '#7b4fa0', acc: '#e86f9a', card: '#ffffff', muted: '#efe7f5' },
    citrico:   { n: 'Cítrico',   bg: '#fffdf6', fg: '#1c1c1c', pri: '#ff5a1f', acc: '#1f7a4d', card: '#ffffff', muted: '#fff0e0' },
    mono:      { n: 'Mono',      bg: '#ffffff', fg: '#111111', pri: '#111111', acc: '#3355ff', card: '#f6f6f6', muted: '#f0f0f0' },
  };
  const FUENTES = {
    clasica:  { n: 'Clásica',  h: 'Playfair Display', b: 'Lato' },
    moderna:  { n: 'Moderna',  h: 'Plus Jakarta Sans', b: 'Inter' },
    amigable: { n: 'Amigable', h: 'Nunito', b: 'Nunito' },
    elegante: { n: 'Elegante', h: 'Cormorant Garamond', b: 'Montserrat' },
    tecnica:  { n: 'Técnica',  h: 'Space Grotesk', b: 'IBM Plex Sans' },
    impacto:  { n: 'Impacto',  h: 'Bebas Neue', b: 'Barlow' },
  };
  const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;600&family=Nunito:wght@400;800&family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;600&family=Space+Grotesk:wght@700&family=IBM+Plex+Sans:wght@400;600&family=Bebas+Neue&family=Barlow:wght@400;600&display=swap';
  const SECCIONES = [
    ['hero', 'Portada', true], ['servicios', 'Servicios / productos'], ['galeria', 'Galería'], ['precios', 'Precios o planes'],
    ['turnos', 'Reservas / turnos'], ['resenas', 'Reseñas'], ['equipo', 'Equipo'], ['faq', 'Preguntas frecuentes'],
    ['blog', 'Novedades / blog'], ['ubicacion', 'Ubicación y horarios'], ['contacto', 'Contacto'],
  ];
  // [id, nombre, descripción, puntos de complejidad, ficha del Lab relacionada]
  const FUNCIONES = [
    ['whatsapp',    'Botón de WhatsApp',          'Siempre visible, con el mensaje ya armado.',        1, null],
    ['formulario',  'Formulario de contacto',     'Las consultas llegan a tu mail o panel.',            1, 'servicios/formspree'],
    ['mapa',        'Mapa y horarios',            'Cómo llegar, con Google Maps.',                      1, null],
    ['resenas',     'Reseñas de Google',          'Tus mejores opiniones a la vista.',                  1, null],
    ['turnos',      'Turnos online',              'Agenda con horarios disponibles y recordatorios.',   3, 'soluciones/reservas'],
    ['carrito',     'Catálogo con carrito',       'Arman el pedido y lo confirman.',                    4, 'soluciones/ecommerce'],
    ['mercadopago', 'Pagos con Mercado Pago',     'Cobrás señas, cuotas o compras.',                    2, 'servicios/mercadopago'],
    ['panel',       'Panel para editar',          'Cambiás textos, precios y fotos sin programar.',     3, 'arquitecturas/headless-cms'],
    ['blog',        'Blog / novedades',           'Artículos que te posicionan en Google.',             2, 'soluciones/blog'],
    ['idiomas',     'Versión en inglés',          'Para turismo o clientes del exterior.',              2, null],
    ['analitica',   'Estadísticas de visitas',    'Sabés de dónde vienen y qué miran.',                 1, 'servicios/ga4'],
    ['chat',        'Asistente con IA',           'Responde preguntas frecuentes 24/7.',                3, 'servicios/claude-api'],
  ];
  const DEFAULT_PRESET = {
    nombre: 'Tu Negocio', hero: 'Tu negocio, a un clic.', sub: 'Contá en una frase qué hacés y para quién. Acá va tu propuesta.',
    cta: 'Contactanos', itemsLabel: 'Servicios',
    items: [['Servicio uno', 'Descripción breve', 'Desde $'], ['Servicio dos', 'Descripción breve', 'Consultá'], ['Servicio tres', 'Descripción breve', 'A medida']],
    paleta: 'mono', fuentes: 'moderna', estilo: 'minimal', objetivo: 'consultas',
    secciones: ['hero', 'servicios', 'resenas', 'contacto'], funciones: ['whatsapp', 'formulario'],
  };

  let NEGOCIOS = [];
  const S = { negocio: null, nombre: '', objetivo: 'consultas', estilo: 'minimal', paleta: 'mono', fuentes: 'moderna', secciones: new Set(), funciones: new Set(), device: 'desktop' };
  const preset = () => NEGOCIOS.find(x => x.id === S.negocio)?.preset || DEFAULT_PRESET;

  const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
  const ink = h => lum(h) > .45 ? '#141416' : '#ffffff';

  // ── Controles ──
  function renderControls() {
    $('ab-negocios').innerHTML = NEGOCIOS.map(x => `<button type="button" class="ab-choice" data-negocio="${x.id}" aria-pressed="false">${esc(x.name)}</button>`).join('')
      + `<button type="button" class="ab-choice" data-negocio="" aria-pressed="false">Otro rubro</button>`;
    $('ab-objetivos').innerHTML = OBJETIVOS.map(([id, t, d]) => `<label class="ab-opt"><input type="radio" name="objetivo" value="${id}"><span><strong>${t}</strong><small>${d}</small></span></label>`).join('');
    $('ab-estilos').innerHTML = ESTILOS.map(([id, t, d]) => `<label class="ab-style"><input type="radio" name="estilo" value="${id}"><span><i class="ab-style-mini st-${id}"><b></b><em></em></i><strong>${t}</strong><small>${d}</small></span></label>`).join('');
    $('ab-paletas').innerHTML = Object.entries(PALETAS).map(([id, p]) => `<label class="ab-pal" title="${p.n}"><input type="radio" name="paleta" value="${id}"><span><i style="background:${p.bg}"></i><i style="background:${p.pri}"></i><i style="background:${p.acc}"></i><small>${p.n}</small></span></label>`).join('');
    $('ab-fuentes').innerHTML = Object.entries(FUENTES).map(([id, f]) => `<label class="ab-font"><input type="radio" name="fuentes" value="${id}"><span><strong style="font-family:'${f.h}'">Aa</strong><small>${f.n}</small></span></label>`).join('');
    $('ab-secciones').innerHTML = SECCIONES.map(([id, t, fixed]) => `<label class="ab-check"><input type="checkbox" name="seccion" value="${id}"${fixed ? ' disabled checked' : ''}><span>${t}</span></label>`).join('');
    $('ab-funciones').innerHTML = FUNCIONES.map(([id, t, d]) => `<label class="ab-feat"><input type="checkbox" name="funcion" value="${id}"><span><strong>${t}</strong><small>${d}</small></span></label>`).join('');
  }

  function syncControls() {
    document.querySelectorAll('[data-negocio]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.negocio || null) === S.negocio)));
    $('ab-nombre').value = S.nombre;
    const setRadio = (name, v) => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; };
    setRadio('objetivo', S.objetivo); setRadio('estilo', S.estilo); setRadio('paleta', S.paleta); setRadio('fuentes', S.fuentes);
    document.querySelectorAll('input[name="seccion"]').forEach(i => { if (!i.disabled) i.checked = S.secciones.has(i.value); });
    document.querySelectorAll('input[name="funcion"]').forEach(i => { i.checked = S.funciones.has(i.value); });
  }

  function applyPreset(id) {
    S.negocio = id || null;
    const p = preset();
    S.nombre = p.nombre; S.objetivo = p.objetivo; S.estilo = p.estilo; S.paleta = p.paleta; S.fuentes = p.fuentes;
    S.secciones = new Set(p.secciones); S.funciones = new Set(p.funciones);
    syncControls(); render();
  }

  // Objetivo → sugiere funcionalidades y secciones (sin sacar lo que el usuario ya eligió)
  const POR_OBJETIVO = {
    consultas: { f: ['whatsapp'], s: ['contacto'] },
    vender:    { f: ['carrito', 'mercadopago'], s: ['servicios'] },
    turnos:    { f: ['turnos'], s: ['turnos'] },
    leads:     { f: ['formulario'], s: ['contacto'] },
    mostrar:   { f: [], s: ['galeria'] },
  };

  // ── Vista previa de la web ──
  function siteHTML() {
    const p = preset(), pal = PALETAS[S.paleta], fu = FUENTES[S.fuentes];
    const F = S.funciones, sec = S.secciones;
    const nombre = S.nombre.trim() || p.nombre;
    const inicial = nombre.replace(/^(Lic\.|Dr\.|Dra\.)\s*/i, '').trim().charAt(0).toUpperCase();
    const ctaLabel = S.objetivo === 'vender' ? 'Comprar ahora' : S.objetivo === 'turnos' ? (p.cta || 'Reservar') : S.objetivo === 'consultas' ? 'Escribinos' : p.cta;
    const mp = F.has('mercadopago') ? '<span class="s-mp">Pagá con Mercado Pago</span>' : '';
    const img = (label, cls = '') => `<div class="s-img ${cls}"><span>${label}</span></div>`;
    const out = [];

    out.push(`<header class="s-nav"><div class="s-brand"><span class="s-logo">${esc(inicial)}</span><strong>${esc(nombre)}</strong></div>
      <nav class="s-links"><span>Inicio</span><span>${esc(p.itemsLabel)}</span><span>Contacto</span>${F.has('idiomas') ? '<span class="s-lang">ES | EN</span>' : ''}${F.has('carrito') ? `<span class="s-cart">${icon('cart')}<b>2</b></span>` : ''}</nav>
      <span class="s-btn s-btn-sm">${esc(ctaLabel)}</span></header>`);

    out.push(`<section class="s-hero"><div class="s-hero-copy"><h1>${esc(p.hero)}</h1><p>${esc(p.sub)}</p>
      <div class="s-row"><span class="s-btn">${esc(ctaLabel)}</span>${F.has('whatsapp') ? `<span class="s-btn s-btn-ghost">${icon('message')}WhatsApp</span>` : ''}</div>${mp}</div>
      ${img('Tu foto principal', 's-img-hero')}</section>`);

    if (sec.has('servicios')) out.push(`<section class="s-sec"><h2>${esc(p.itemsLabel)}</h2><div class="s-grid">${p.items.map(([t, d, pr]) => `
      <article class="s-card">${img('Foto')}<h3>${esc(t)}</h3><p>${esc(d)}</p><div class="s-card-foot"><strong>${esc(pr)}</strong>${F.has('carrito') ? '<span class="s-btn s-btn-sm">Agregar</span>' : ''}</div></article>`).join('')}</div>${F.has('carrito') ? mp : ''}</section>`);

    if (sec.has('galeria')) out.push(`<section class="s-sec"><h2>Galería</h2><div class="s-gal">${img('Foto', 'g1')}${img('Foto', 'g2')}${img('Foto', 'g3')}${img('Foto', 'g4')}</div></section>`);

    if (sec.has('precios')) out.push(`<section class="s-sec"><h2>Precios</h2><div class="s-grid">${p.items.map(([t, d, pr], i) => `
      <article class="s-card s-plan${i === 1 ? ' is-top' : ''}">${i === 1 ? '<span class="s-tag">Más elegido</span>' : ''}<h3>${esc(t)}</h3><p class="s-price">${esc(pr)}</p><p>${esc(d)}</p><span class="s-btn s-btn-sm">Elegir</span></article>`).join('')}</div>${mp}</section>`);

    if (sec.has('turnos') || F.has('turnos')) out.push(`<section class="s-sec"><h2>Reservá tu turno</h2><div class="s-book">
      <div class="s-days">${['Lun 6', 'Mar 7', 'Mié 8', 'Jue 9', 'Vie 10'].map((d, i) => `<span class="${i === 1 ? 'on' : ''}">${d}</span>`).join('')}</div>
      <div class="s-slots">${['09:00', '10:30', '12:00', '15:00', '16:30', '18:00'].map((h, i) => `<span class="${i === 3 ? 'on' : i === 1 ? 'off' : ''}">${h}</span>`).join('')}</div>
      <div class="s-row"><span class="s-btn">Confirmar turno</span>${F.has('mercadopago') ? '<span class="s-mp">Seña con Mercado Pago</span>' : ''}</div></div></section>`);

    if (sec.has('resenas') || F.has('resenas')) out.push(`<section class="s-sec"><h2>Lo que dicen de nosotros</h2><div class="s-reviews">
      <p class="s-score"><strong>4,8</strong><span>★★★★★</span><small>128 reseñas en Google</small></p>
      <blockquote>“Excelente atención, volvemos seguro.” <cite>Mariana G.</cite></blockquote>
      <blockquote>“Rápidos y muy prolijos. Lo recomiendo.” <cite>Diego R.</cite></blockquote></div></section>`);

    if (sec.has('equipo')) out.push(`<section class="s-sec"><h2>Quiénes somos</h2><div class="s-team">${['Dirección', 'Atención', 'Equipo'].map(r => `<div><span class="s-avatar"></span><strong>Nombre Apellido</strong><small>${r}</small></div>`).join('')}</div></section>`);

    if (sec.has('faq')) out.push(`<section class="s-sec"><h2>Preguntas frecuentes</h2><div class="s-faq">${['¿Cuáles son los medios de pago?', '¿Hacen envíos o atienden a domicilio?', '¿Cómo reservo o consulto?'].map((q, i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>Respuesta breve y clara, para que no tengan que escribirte.</p></details>`).join('')}</div></section>`);

    if (sec.has('blog') || F.has('blog')) out.push(`<section class="s-sec"><h2>Novedades</h2><div class="s-grid">${['Guía para elegir bien', 'Lo que cambió este mes', '5 errores comunes'].map(t => `<article class="s-card">${img('Foto')}<h3>${t}</h3><p>Artículo que responde lo que tus clientes buscan en Google.</p></article>`).join('')}</div></section>`);

    if (sec.has('ubicacion') || F.has('mapa')) out.push(`<section class="s-sec s-loc"><div class="s-map"><span class="s-pin"></span></div><div><h2>Dónde estamos</h2><p>Av. Siempreviva 742, CABA</p><p><strong>Lun a vie</strong> 9 a 19 · <strong>Sáb</strong> 9 a 13</p></div></section>`);

    if (sec.has('contacto')) out.push(`<section class="s-sec s-contact"><h2>${S.objetivo === 'leads' ? 'Pedí tu presupuesto' : 'Escribinos'}</h2>${F.has('formulario') || S.objetivo === 'leads'
      ? '<div class="s-form"><span>Nombre</span><span>Email o WhatsApp</span><span class="wide">Contanos qué necesitás</span><span class="s-btn">Enviar</span></div>'
      : `<div class="s-row"><span class="s-btn">${icon('message')}Escribinos por WhatsApp</span></div>`}</section>`);

    out.push(`<footer class="s-foot"><strong>${esc(nombre)}</strong><small>Web hecha por Darío Colángelo</small></footer>`);
    if (F.has('whatsapp')) out.push(`<span class="s-wa" title="WhatsApp">${icon('message')}</span>`);
    if (F.has('chat')) out.push(`<span class="s-chat">${icon('sparkles')}<span>¿Te ayudo con algo?</span></span>`);

    return { html: out.join(''), style: `--s-bg:${pal.bg};--s-fg:${pal.fg};--s-pri:${pal.pri};--s-pri-ink:${ink(pal.pri)};--s-acc:${pal.acc};--s-acc-ink:${ink(pal.acc)};--s-card:${pal.card};--s-muted:${pal.muted};--s-fh:'${fu.h}';--s-fb:'${fu.b}'` };
  }

  // ── Resumen y estimación ──
  function resumen() {
    const F = [...S.funciones], secs = [...S.secciones].filter(s => s !== 'hero');
    const pts = F.reduce((t, id) => t + (FUNCIONES.find(f => f[0] === id)?.[3] || 0), 0) + secs.length * .5;
    const nivel = pts <= 6 ? ['Esencial', '1 a 2 semanas'] : pts <= 12 ? ['Profesional', '2 a 4 semanas'] : ['Avanzada', '4 a 8 semanas'];
    const tipo = F.includes('carrito') ? 'Tienda online' : F.includes('turnos') ? 'Web con turnos online' : (F.includes('blog') || secs.length > 5) ? 'Web institucional' : 'Landing page';
    const nombre = S.nombre.trim() || preset().nombre;
    const rubro = NEGOCIOS.find(x => x.id === S.negocio)?.name || 'Otro rubro';
    return { F, secs, nivel, tipo, nombre, rubro };
  }

  function renderResumen() {
    const r = resumen();
    const secNames = r.secs.map(id => SECCIONES.find(s => s[0] === id)?.[1]).filter(Boolean);
    const feats = r.F.map(id => FUNCIONES.find(f => f[0] === id)).filter(Boolean);
    $('ab-sum').innerHTML = `
      <div class="ab-sum-head"><div><p class="ab-sum-k">Tu proyecto</p><h3>${esc(r.tipo)}</h3></div>
        <div class="ab-level" data-level="${r.nivel[0]}"><strong>${r.nivel[0]}</strong><span>${r.nivel[1]}</span></div></div>
      <dl class="ab-sum-dl">
        <div><dt>Negocio</dt><dd>${esc(r.nombre)} · ${esc(r.rubro)}</dd></div>
        <div><dt>Diseño</dt><dd>${ESTILOS.find(e => e[0] === S.estilo)[1]} · paleta ${PALETAS[S.paleta].n} · tipografía ${FUENTES[S.fuentes].n}</dd></div>
        <div><dt>Secciones</dt><dd>${secNames.length ? secNames.join(', ') : 'Sólo portada'}</dd></div>
        <div><dt>Funcionalidades</dt><dd>${feats.length ? feats.map(f => f[4] ? `<a href="programacion.html#/${f[4]}" target="_blank" rel="noopener">${f[1]}</a>` : f[1]).join(', ') : 'Ninguna extra'}</dd></div>
      </dl>
      <p class="ab-sum-note">El plazo es orientativo y se ajusta después de una charla. Incluye diseño, desarrollo, publicación con dominio .com.ar y una guía para que la puedas actualizar.</p>`;
  }

  function resumenTexto() {
    const r = resumen();
    return `Hola Darío, armé mi web en tu constructor y me gustaría hacerla.\n\n` +
      `Negocio: ${r.nombre} (${r.rubro})\nTipo: ${r.tipo} · Nivel ${r.nivel[0]} (${r.nivel[1]})\n` +
      `Objetivo: ${OBJETIVOS.find(o => o[0] === S.objetivo)[1]}\n` +
      `Diseño: ${ESTILOS.find(e => e[0] === S.estilo)[1]}, paleta ${PALETAS[S.paleta].n}, tipografía ${FUENTES[S.fuentes].n}\n` +
      `Secciones: ${r.secs.map(id => SECCIONES.find(s => s[0] === id)?.[1]).join(', ') || 'portada'}\n` +
      `Funcionalidades: ${r.F.map(id => FUNCIONES.find(f => f[0] === id)?.[1]).join(', ') || 'ninguna'}\n\n` +
      `Diseño guardado: ${location.origin}${location.pathname}${shareHash()}`;
  }

  // ── Link para compartir (estado en el hash) ──
  function shareHash() {
    const data = { n: S.negocio, t: S.nombre, o: S.objetivo, e: S.estilo, p: S.paleta, f: S.fuentes, s: [...S.secciones], x: [...S.funciones] };
    return '#d=' + btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/=+$/, '');
  }
  function readHash() {
    const h = location.hash;
    if (h.startsWith('#n=')) { applyPreset(decodeURIComponent(h.slice(3))); return true; }
    if (!h.startsWith('#d=')) return false;
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob(h.slice(3)))));
      S.negocio = d.n || null; S.nombre = d.t || ''; S.objetivo = d.o; S.estilo = d.e; S.paleta = d.p; S.fuentes = d.f;
      S.secciones = new Set(d.s || []); S.funciones = new Set(d.x || []);
      if (!PALETAS[S.paleta] || !FUENTES[S.fuentes]) throw new Error('hash');
      syncControls(); render(); return true;
    } catch (e) { return false; }
  }

  let fontsLoaded = false;
  function render() {
    if (!fontsLoaded) {
      fontsLoaded = true;
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS_URL; document.head.appendChild(l);
    }
    S.secciones.add('hero');
    const { html, style } = siteHTML();
    const site = $('ab-site');
    site.className = `site site--${S.estilo}`;
    site.setAttribute('style', style);
    site.innerHTML = html;
    $('ab-url').textContent = (S.nombre.trim() || preset().nombre).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '') + '.com.ar';
    renderResumen();
  }

  // ── Eventos ──
  function bind() {
    $('ab-negocios').addEventListener('click', e => {
      const b = e.target.closest('[data-negocio]');
      if (b) applyPreset(b.dataset.negocio);
    });
    $('ab-nombre').addEventListener('input', e => { S.nombre = e.target.value; render(); });
    document.querySelector('.ab-controls').addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'objetivo') {
        S.objetivo = t.value;
        const sug = POR_OBJETIVO[t.value];
        sug.f.forEach(f => S.funciones.add(f)); sug.s.forEach(s => S.secciones.add(s));
        syncControls();
      }
      if (t.name === 'estilo') S.estilo = t.value;
      if (t.name === 'paleta') S.paleta = t.value;
      if (t.name === 'fuentes') S.fuentes = t.value;
      if (t.name === 'seccion') t.checked ? S.secciones.add(t.value) : S.secciones.delete(t.value);
      if (t.name === 'funcion') t.checked ? S.funciones.add(t.value) : S.funciones.delete(t.value);
      render();
    });
    document.querySelectorAll('[data-device]').forEach(b => b.addEventListener('click', () => {
      S.device = b.dataset.device;
      document.querySelectorAll('[data-device]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('ab-frame').dataset.device = S.device;
    }));
    $('ab-share').addEventListener('click', async e => {
      const url = location.origin + location.pathname + shareHash();
      history.replaceState(null, '', shareHash());
      const lbl = e.currentTarget.querySelector('span');
      try { await navigator.clipboard.writeText(url); lbl.textContent = 'Link copiado'; } catch (err) { lbl.textContent = 'Copiá la URL'; }
      setTimeout(() => { lbl.textContent = 'Copiar link del diseño'; }, 2200);
    });
    $('ab-random').addEventListener('click', () => {
      const pick = a => a[(Math.random() * a.length) | 0];
      S.estilo = pick(ESTILOS)[0]; S.paleta = pick(Object.keys(PALETAS)); S.fuentes = pick(Object.keys(FUENTES));
      syncControls(); render();
    });

    // Pedido
    const form = $('ab-form'), st = $('ab-form-status');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = form.elements.name.value.trim(), email = form.elements.email.value.trim(), extra = form.elements.message.value.trim();
      st.innerHTML = '';
      if (name.length < 2) { st.innerHTML = '<p class="ab-err">Decime tu nombre.</p>'; form.elements.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { st.innerHTML = '<p class="ab-err">Revisá el email (ej: nombre@negocio.com).</p>'; form.elements.email.focus(); return; }
      const message = resumenTexto() + (extra ? `\n\nComentarios: ${extra}` : '');
      const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      try {
        const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000),
          body: JSON.stringify({ name, email, company: S.nombre.trim() || preset().nombre, reason: 'freelance', message, website: '' }) });
        const out = await res.json().catch(() => null);
        if (!res.ok || !out?.ok) throw new Error('fallo');
        st.innerHTML = `<p class="ab-ok">${icon('check')}Listo, ${esc(name.split(' ')[0])}. Recibí tu diseño y te escribo a ${esc(email)}.</p>`;
        form.reset();
      } catch (err) {
        const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
        st.innerHTML = `<p class="ab-err">No pude enviarlo desde acá. Mandámelo por WhatsApp con un clic, ya va con todo el diseño:</p><a class="btn-primary" href="${wa}" target="_blank" rel="noopener">${icon('message')}Enviar por WhatsApp</a>`;
      } finally { btn.disabled = false; }
    });
    $('ab-wa').addEventListener('click', () => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(resumenTexto())}`, '_blank', 'noopener'));
  }

  // ── Inicio ──
  (async function init() {
    try { NEGOCIOS = await (await fetch('data/weblab/negocios.json')).json(); } catch (e) { NEGOCIOS = []; }
    renderControls(); bind();
    if (!readHash()) applyPreset(NEGOCIOS[0]?.id || null);
  })();
})();
