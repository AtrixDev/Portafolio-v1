/* ============================================================
   PROGRAMACION-V2.JS — Base de datos de herramientas, funcionalidades e información útil
   Datos: data/lab/ (generados por tools/weblab_migrar.py). Rutas por hash:
     #/                base (vista guardada)       #/v/<vista>   problema · aprender · hace · todo
     #/f/<id>          ficha a pantalla completa   #/r/<rubro>   recomendador de rubros
     #/<cat>/<id>      ids viejos: redirigen a #/f/<id>
   Reutiliza WLDemos / WLExamples / WLRubros por el id original de cada ficha (legacy).
   ============================================================ */
(() => {
  'use strict';
  const D = 'data/lab/', OLD = 'data/weblab/';
  const $ = id => document.getElementById(id);
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const cache = {};
  const getJSON = p => (cache[p] ||= fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); }));

  // ── Vocabulario ──
  const AREAS = [
    ['desarrollo-web', 'Desarrollo web', 'Qué puedo construir y cómo puede verse o funcionar.'],
    ['soluciones', 'Tipos de negocio', 'Elegí tu rubro y mirá qué web y qué funciones le sirven.'],
    ['programacion', 'Programación', '¿Cómo se construye técnicamente?'],
    ['ia-datos', 'IA y datos', '¿Cómo puedo trabajar mejor con IA e información?'],
  ];
  // Cómo se llaman y en qué orden van los subtipos (lo más importante primero)
  const SUBN = { 'arquetipo de web': 'Tipos de web', 'proyecto web': 'Proyectos web', 'herramienta propia': 'Herramientas propias', 'por rubro': 'Rubros', 'patrón de página': 'Patrones de página', 'estilo visual': 'Estilos visuales', 'patrón de panel': 'Patrones de panel', 'regla UX': 'Reglas UX', 'par de fuentes': 'Pares de fuentes', funcionalidad: 'Funcionalidades', skill: 'Skills', servicio: 'Servicios', stack: 'Stacks', arquitectura: 'Arquitecturas' };
  const SUBP = { 'arquetipo de web': 0, 'proyecto web': 1, 'herramienta propia': 1, funcionalidad: 2, 'por rubro': 3, 'patrón de página': 4, 'estilo visual': 5, skill: 4, servicio: 5, stack: 5, arquitectura: 6, 'patrón de panel': 6, 'regla UX': 7, 'par de fuentes': 8 };
  const EVP = { proyecto: 0, experimento: 1, demo: 2, ejemplo: 3, maqueta: 4 };
  const subN = s => SUBN[s] || s[0].toUpperCase() + s.slice(1);
  const TIPOS = { solucion: 'Solución', funcionalidad: 'Funcionalidad', tecnica: 'Técnica', herramienta: 'Herramienta', recurso: 'Recurso', proyecto: 'Proyecto' };
  const TEMAS = { automatizacion: 'Automatización', 'identidad-marca': 'Identidad y marca', seguridad: 'Seguridad', accesibilidad: 'Accesibilidad', conversion: 'Conversión', rendimiento: 'Rendimiento', 'mercado-libre': 'Mercado Libre', 'e-commerce': 'E-commerce' };
  const EV = { proyecto: 'Proyecto real', demo: 'Demo', experimento: 'Experimento', maqueta: 'Maqueta', ejemplo: 'Ejemplo de terceros' };
  const EV_NOTA = {
    proyecto: 'Proyecto real: algo que construí.',
    demo: 'Demo: hecha para demostrar esta idea. No es un proyecto de un cliente.',
    experimento: 'Experimento: el mismo prompt, sin y con la herramienta; una sola corrida por lado, así que otra podría dar algo distinto.',
    maqueta: 'Maqueta: representación visual generada con los datos de esta ficha. Muestra la idea; no es un proyecto real.',
    ejemplo: 'Ejemplo de terceros: sitios de otras empresas, no hechos por mí.',
  };
  const VAL = {
    imprescindible: ['Imprescindible', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6 14.4 8 8 14.4 1.6 8Z" fill="currentColor"/></svg>', 'Hoy hay que tenerlo y marca diferencia.'],
    pro: ['Pro', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .8c.55 4.1 2.3 5.95 6.4 6.5v1.4c-4.1.55-5.85 2.4-6.4 6.5h-.02C7.45 11.1 5.7 9.25 1.6 8.7V7.3C5.7 6.75 7.45 4.9 8 .8Z" fill="currentColor"/></svg>', 'Una especialización que te separa del resto; no es para todos.'],
    base: ['Base', '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>', 'Básico, o ya tan usado que no te diferencia.'],
  };
  const VRANK = { imprescindible: 0, pro: 1, base: 2 };
  const NIV = { 1: 'Inicial', 2: 'Intermedio', 3: 'Avanzado' };
  const FAMILIAS = { panel: 'Paneles y software', tienda: 'Tiendas y venta', estudio: 'Estudios y servicios profesionales', turno: 'Salud, bienestar y turnos', curso: 'Educación', juego: 'Juegos', tramite: 'Trámites y gobierno', finanzas: 'Finanzas', comunidad: 'Comunidades y redes', herramienta: 'Herramientas y apps', habito: 'Hábitos y vida personal', media: 'Medios y entretenimiento', lectura: 'Lectura y contenidos', carta: 'Gastronomía', aviso: 'Avisos y marketplaces', viaje: 'Viajes y hotelería', evento: 'Eventos y cultura', dona: 'ONG y comunidades', movilidad: 'Transporte y logística', ciencia: 'Ciencia', negocio: 'Otros negocios' };
  const IC = {
    todo: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>', problema: '<path d="M3 8h18v12H3zM8 8V5h8v3M3 13h18"/>',
    aprender: '<path d="M2 9 12 4l10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>', hace: '<path d="M4 20V10m6 10V4m6 16v-7M2 20h20"/>',
    valor: '<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/>', nivel: '<path d="M5 20v-5M12 20V9M19 20V4"/>', ev: '<path d="M4 12l5 5L20 6"/>', tipo: '<path d="M20 12 12 20 3 11V3h8z"/>',
  };
  const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const VISTAS = [['todo', 'Todo', 'todo'], ['problema', 'Tengo un negocio', 'problema'], ['aprender', 'Quiero aprender', 'aprender'], ['hace', 'Mi trabajo', 'hace']];

  // ── Glosario: qué es cada tecnología, en palabras simples ──
  const GLOS = [
    [/next\.js/i, 'Un framework para armar sitios y tiendas web: páginas rápidas que Google lee bien.'],
    [/node\.js con express/i, 'El “cerebro” del sitio, que corre en un servidor: recibe lo que pide la web y guarda y busca datos.'],
    [/serverless/i, 'Funciones de código que se ejecutan solo cuando alguien las llama, sin mantener un servidor prendido todo el día.'],
    [/mongodb/i, 'La base de datos: el lugar donde se guardan los datos (turnos, productos, mensajes, usuarios).'],
    [/cloudinary/i, 'Un servicio que guarda las fotos y las entrega livianas y rápidas a cada pantalla.'],
    [/jspdf/i, 'Una librería que arma archivos PDF desde el propio sitio, por ejemplo los presupuestos.'],
    [/tiptap/i, 'Un editor de texto (negritas, títulos, listas) para escribir las notas del blog desde el panel.'],
    [/^jwt/i, 'Un “pase” firmado que le permite al sitio recordar quién inició sesión sin guardar su contraseña.'],
    [/render y vercel/i, 'Servicios en la nube donde está publicado el sitio.'],
    [/vercel/i, 'El servicio donde se publica el sitio: cada cambio sale a internet automáticamente.'],
    [/prisma/i, 'Una herramienta que conecta el código con la base de datos y la mantiene ordenada: tablas de productos, pedidos y clientes.'],
    [/typescript/i, 'JavaScript con control de errores: avisa de fallos antes de publicar el sitio.'],
    [/mercado pago/i, 'Cobros online con tarjeta, dinero en cuenta y cuotas.'],
    [/resend/i, 'Un servicio para enviar mails automáticos desde el sitio, como confirmaciones y avisos.'],
    [/tcgdex/i, 'Una base de datos pública de cartas de Pokémon TCG: de ahí salen los nombres y las imágenes de las cartas.'],
    [/jose|bcrypt/i, 'La seguridad del login: jose firma la sesión de quien entró (como un pase) y bcryptjs guarda las contraseñas cifradas, nunca en texto plano.'],
    [/zod/i, 'Revisa que los datos que llegan (un formulario, un pedido) tengan el formato correcto antes de usarlos.'],
    [/sharp/i, 'Reduce y optimiza las imágenes para que el sitio cargue rápido.'],
    [/css modules/i, 'Una forma de escribir los estilos de cada pieza para que no se pisen entre sí.'],
    [/api de mercado libre|oauth/i, 'La conexión oficial con Mercado Libre para leer los datos de una cuenta, con permiso del vendedor.'],
    [/sin framework/i, 'Se escribe en el lenguaje base de la web, sin librerías ni plantillas: más liviano y totalmente a medida.'],
    [/node\.js/i, 'JavaScript corriendo en el servidor: el código que procesa formularios, pagos y datos fuera del navegador.'],
  ];
  const glosa = t => (GLOS.find(([re]) => re.test(t)) || [])[1] || '';
  const sinParen = t => t.replace(/\s*\(.*\)\s*$/, '');
  const NIV_TIP = { 1: 'Inicial: se puede empezar sin experiencia previa.', 2: 'Intermedio: pide conocer lo básico de diseño o programación web.', 3: 'Avanzado: pide experiencia, o a alguien que sepa.' };
  const SUBD = { 'arquetipo de web': 'Los tipos de sitio que se pueden construir: landing, tienda, institucional, panel…', 'proyecto web': 'Webs completas que construí.', 'herramienta propia': 'Herramientas que hice y funcionan.', funcionalidad: 'Cosas concretas que hace una web: cobrar, reservar un turno, administrar contenido.', 'por rubro': 'Tipos de negocio: qué web y qué funciones le sirven a cada uno.', 'patrón de página': 'Cómo ordenar una página para lograr un objetivo, por ejemplo vender o dejar consultas.', 'estilo visual': 'Estilos de diseño: cómo se ve una web (vidrio, minimalista, oscuro…).', 'patrón de panel': 'Cómo organizar un panel de datos o de gestión.', 'regla UX': 'Buenas prácticas para que una web sea fácil y cómoda de usar.', 'par de fuentes': 'Combinaciones de tipografías que funcionan bien juntas.', skill: 'Habilidades que se le agregan a Claude para que haga mejor una tarea.', servicio: 'Servicios externos que se usan para construir una web: hosting, pagos, bases de datos.', stack: 'Conjuntos de tecnologías con las que se programa un sitio.', arquitectura: 'Cómo se organiza por dentro un sitio o una aplicación.' };
  const VISTA_TIP = { todo: 'Todas las entradas, ordenadas por importancia.', problema: 'Elegí tu rubro y mirá qué web y qué funciones le sirven.', aprender: 'Técnicas y herramientas de lo más simple a lo más avanzado.', hace: 'Los proyectos que construí y lo que se comprobó que hacen.' };

  // ── Estado ──
  const S = { idx: [], by: {}, evid: {}, relOut: {}, relIn: {}, legacy: {}, rubros: [], rubrosBy: {}, prev: {},
    vista: store.get('dc-lab-vista', 'todo'), perfil: store.get('dc-lab-perfil', 'reclutador'), f: { area: '', sub: '', tema: '', valor: '', nivel: 0, ev: '', tipo: '' }, q: '' };

  // ── Piezas de interfaz ──
  const valChip = (v, estado, mini) => v && VAL[v] ? `<span class="wl-val${estado === 'provisional' ? ' is-prov' : ''}" data-v="${v}">${VAL[v][1]}${VAL[v][0]}${estado === 'provisional' && !mini ? ' <small>prov.</small>' : ''}</span>` : '';
  const nivChip = n => NIV[n] ? `<span class="wl-lvl" data-n="${n}" data-tip="${esc(NIV_TIP[n])}"><span class="wl-lvl-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="wl-lvl-t">${NIV[n]}</span></span>` : '';
  const evChips = kinds => (kinds && kinds.length ? kinds : ['sin']).map(k => k === 'sin' ? '<span class="lb-ev" data-k="sin">Sin ejemplo todavía</span>' : `<span class="lb-ev" data-k="${k}">${EV[k]}</span>`).join('');
  const nombreDe = id => S.by[id]?.n || S.rubrosBy[id]?.nombre || id;

  function card(f) {
    const prev = S.prev[f.id];
    return `<button type="button" class="wl-card lb-card" data-open="${esc(f.id)}">
      ${prev ? `<div class="lb-pv">${/\.(webp|png|jpe?g)$/i.test(prev) ? `<img src="${esc(prev)}" alt="" loading="lazy">` : `<iframe src="${esc(prev)}" loading="lazy" tabindex="-1" aria-hidden="true" title="Vista previa de ${esc(f.n)}"></iframe>`}</div>` : ''}
      <span class="wl-card-top">${valChip(f.v, f.ve) || `<span class="lb-tipo">${esc(TIPOS[f.t] || f.t)}</span>`}${nivChip(f.lv)}</span>
      <h3>${esc(f.n)}</h3>
      <div class="lb-evs">${evChips(f.e)}</div>
      ${f.d ? `<p class="lb-d">${esc(f.d)}</p>` : ''}
    </button>`;
  }

  // ── Datos ──
  async function boot() {
    try {
      const [idx, evid, rel, legacy, rubros] = await Promise.all([getJSON(D + 'index.json'), getJSON(D + 'evidencias.json'), getJSON(D + 'relaciones.json'), getJSON(D + 'legacy-ids.json'), getJSON(D + 'rubros.json')]);
      S.idx = idx; S.by = Object.fromEntries(idx.map(f => [f.id, f])); S.evid = Object.fromEntries(evid.map(e => [e.id, e])); S.legacy = legacy;
      S.rubros = rubros; S.rubrosBy = Object.fromEntries(rubros.map(r => [r.id, r]));
      for (const r of rel) { (S.relOut[r.desde] ||= []).push(r); (S.relIn[r.a] ||= []).push(r); }
      for (const f of idx) if (f.p) S.prev[f.id] = f.p;
      if ($('lb-nums')) $('lb-nums').innerHTML = [[idx.length, 'entradas en la base'], [idx.filter(f => f.t === 'proyecto').length, 'proyectos y herramientas propias'], [idx.filter(f => f.t === 'funcionalidad').length, 'funcionalidades comprobadas'], [idx.filter(f => f.e.includes('experimento')).length, 'experimentos con y sin skill']].map(([n, t]) => `<div><dt>${t}</dt><dd>${n}</dd></div>`).join('');
      bind();
      route();
    } catch (err) {
      console.error(err);
      $('lb-stats').textContent = 'No se pudo cargar la base. Recargá la página.';
    }
  }

  const fichaCache = {};
  async function ficha(id) {
    const f = S.by[id]; if (!f) return null;
    if (fichaCache[id]) return fichaCache[id];
    const lista = await getJSON(D + (f.c === 'proyectos' ? 'proyectos' : f.c) + '.json');
    for (const x of lista) fichaCache[x.id] = x;
    return fichaCache[id] || null;
  }
  async function legacyEntry(f) {
    if (!f?.legacy) return null;
    const lista = await getJSON(OLD + f.legacy.cat + '.json');
    return lista.find(e => e.id === f.legacy.id) || null;
  }

  // ── Filtros ──
  function filtrar(extra = {}) {
    const q = norm(S.q.trim()), F = { ...S.f, ...extra };
    return S.idx.filter(f =>
      (!F.area || f.a.includes(F.area)) && (!F.sub || f.s === F.sub) && (!F.tema || f.tm.includes(F.tema)) && (!F.valor || f.v === F.valor) &&
      (!F.nivel || f.lv === F.nivel) && (!F.tipo || f.t === F.tipo) &&
      (!F.ev || (F.ev === 'sin' ? !f.e.length : f.e.includes(F.ev))) &&
      (!q || q.split(/\s+/).every(w => norm(`${f.n} ${f.d} ${f.s} ${TIPOS[f.t]} ${f.tm.map(t => TEMAS[t]).join(' ')}`).includes(w))));
  }
  // Lo más importante primero: tipo de ficha (tipos de web, proyectos, funciones…), después valor, después la evidencia más fuerte
  const fuerza = f => Math.min(...(f.e.length ? f.e.map(k => EVP[k] ?? 5) : [6]));
  const ordenar = l => [...l].sort((a, b) => (SUBP[a.s] ?? 9) - (SUBP[b.s] ?? 9) || (VRANK[a.v] ?? 3) - (VRANK[b.v] ?? 3) || fuerza(a) - fuerza(b) || a.n.localeCompare(b.n, 'es'));

  // ── Base ──
  const AREA_IC = { soluciones: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>', 'desarrollo-web': '<path d="M3 5h18v14H3zM3 9h18"/>', programacion: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>', 'ia-datos': '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>' };
  const cap = t => t[0].toUpperCase() + t.slice(1);
  function renderSide() {
    const subsDe = a => { const m = {}; S.idx.filter(f => f.a.includes(a)).forEach(f => { m[f.s] = (m[f.s] || 0) + 1; }); return Object.entries(m).sort((x, y) => (SUBP[x[0]] ?? 9) - (SUBP[y[0]] ?? 9) || y[1] - x[1]); };
    const chev = '<svg class="lb-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
    let h = `<div class="lb-sg"><p class="wl-group-title">Áreas</p>
      <button type="button" class="lb-ar" data-area="" aria-pressed="${!S.f.area}">${ic(IC.todo)}<span>Todas</span><span class="wl-cat-n">${S.idx.length}</span></button>
      ${AREAS.map(([id, n, d]) => {
        const abierta = S.f.area === id;
        return `<div class="lb-ac${abierta ? ' is-open' : ''}"><button type="button" class="lb-ar" data-area="${id}" aria-expanded="${abierta}" data-tip="${esc(d)}">${ic(AREA_IC[id])}<span>${n}</span><span class="wl-cat-n">${S.idx.filter(f => f.a.includes(id)).length}</span>${chev}</button>
          ${abierta ? `<ul class="lb-subs">${subsDe(id).map(([sub, c]) => `<li><button type="button" data-sub="${esc(sub)}" data-tip="${esc(SUBD[sub] || '')}" aria-pressed="${S.f.sub === sub}"><span>${esc(subN(sub))}</span><small>${c}</small></button></li>`).join('')}</ul>` : ''}</div>`;
      }).join('')}</div>`;
    const temas = {};
    S.idx.forEach(f => f.tm.forEach(t => { temas[t] = (temas[t] || 0) + 1; }));
    h += `<div class="lb-sg"><p class="wl-group-title">Para tu negocio</p>${selectorRubro()}<p class="lb-sidehint">Elegí tu rubro y te armo la página con lo que más se parece a tu caso.</p></div>
      <div class="lb-sg"><p class="wl-group-title">Temas</p><div class="lb-temas">${Object.entries(TEMAS).map(([t, n]) => `<button type="button" class="lb-fb" data-tema="${t}" aria-pressed="${S.f.tema === t}">${n} <small>${temas[t] || 0}</small></button>`).join('')}</div></div>
      <details class="lb-sg lb-leyenda"><summary>Qué significa cada etiqueta</summary>
        <p class="lb-lg-t">Evidencia</p><ul>${Object.entries(EV).map(([k, n]) => `<li><span class="lb-ev" data-k="${k}">${n}</span>${esc(EV_NOTA[k].replace(/^[^:]+: /, ''))}</li>`).join('')}<li><span class="lb-ev" data-k="sin">Sin ejemplo todavía</span>Todavía no tiene nada para ver.</li></ul>
        <p class="lb-lg-t">Valor</p><ul>${Object.entries(VAL).map(([k, v]) => `<li>${valChip(k, '', true)}${esc(v[2])}</li>`).join('')}<li><span class="wl-val is-prov" data-v="base">Prov.</span>Provisional: criterio todavía sin revisar.</li></ul></details>`;
    $('lb-side').innerHTML = h;
  }

  function renderVistas() {
    $('lb-vistas').innerHTML = `<div class="lb-vistas" role="group" aria-label="Qué venís a hacer">${VISTAS.map(([k, t, i]) => `<button type="button" data-vista="${k}" data-tip="${esc(VISTA_TIP[k])}" aria-pressed="${S.vista === k}">${ic(IC[i])}<span>${t}</span></button>`).join('')}</div>`;
  }

  function filtrosHTML(base) {
    const cnt = fn => base.filter(fn).length;
    // Cada opción usa la misma pieza que las tarjetas (valor, nivel, evidencia); el botón solo agrega el estado "elegido"
    const fc = (attr, val, chip, n, act) => `<button type="button" class="lb-fchip" data-f-${attr}="${esc(val)}" aria-pressed="${String(act) === String(val)}">${chip}${n === '' ? '' : `<small>${n}</small>`}</button>`;
    const todos = (attr, txt, act, n) => fc(attr, '', `<span class="lb-todos">${txt}</span>`, n, act);
    const GT = { Valor: 'Cuánto te diferencia hoy saber hacerlo: Imprescindible, Pro o Base.', Nivel: 'Qué tan difícil es de aplicar.', Evidencia: 'Qué se puede ver o comprobar de cada entrada: proyecto real, demo, experimento o maqueta.' };
    const grp = (lab, icon, body) => `<div class="lb-fg"><span class="lb-fl" data-tip="${esc(GT[lab])}">${ic(icon)}${lab}</span>${body}</div>`;
    const valor = grp('Valor', IC.valor, todos('valor', 'Todos', S.f.valor, base.length) + Object.keys(VAL).map(k => fc('valor', k, valChip(k, '', true), cnt(f => f.v === k), S.f.valor)).join(''));
    const nivel = grp('Nivel', IC.nivel, todos('nivel', 'Todos', S.f.nivel || '', '') + [1, 2, 3].map(n => fc('nivel', n, nivChip(n), cnt(f => f.lv === n), S.f.nivel || '')).join(''));
    const ev = grp('Evidencia', IC.ev, todos('ev', 'Todas', S.f.ev, '') + Object.keys(EV).map(k => fc('ev', k, `<span class="lb-ev" data-k="${k}">${EV[k]}</span>`, cnt(f => f.e.includes(k)), S.f.ev)).join('') + fc('ev', 'sin', '<span class="lb-ev" data-k="sin">Sin ejemplo todavía</span>', cnt(f => !f.e.length), S.f.ev));
    return `<div class="lb-filtros">${valor}${nivel}${ev}</div>`;
  }

  // Lo que construí: lo más llamativo, arriba de todo y solo cuando no se está filtrando. Todo sale de datos comprobados.
  const DEST = ['odontologia-almagro', 'tenshi', 'tienda-de-coleccionables'];
  async function renderDest() {
    const box = $('lb-dest'); if (!box) return;
    const libre = !S.q.trim() && S.vista === 'todo' && !S.f.area && !S.f.sub && !S.f.tema && !S.f.valor && !S.f.nivel && !S.f.ev && !S.f.tipo;
    const lista = DEST.map(id => S.by[id]).filter(f => f && S.prev[f.id]);
    box.hidden = !(libre && lista.length);
    if (box.hidden) return;
    const cuerpos = Object.fromEntries((await getJSON(D + 'proyectos.json')).map(c => [c.id, c]));
    const pill = (id, cls = '') => `<span class="lb-pill ${cls}" tabindex="0" data-tip="${esc(S.by[id]?.d || '')}">${esc(nombreDe(id))}</span>`;
    box.innerHTML = `<div class="lb-dest-in"><div class="lb-dest-h"><h2>Lo que construí</h2><button type="button" class="lb-link" data-vista="hace">Ver todo mi trabajo →</button></div>
      <div class="lb-dest-g">${lista.map(f => {
        const c = cuerpos[f.id] || {}, out = S.relOut[f.id] || [];
        const funcs = out.filter(r => r.tipo === 'implementa').map(r => r.a), tec = (c.extra?.tecnologias || []).slice(0, 6);
        const abrir = (S.evid[(c.evidencias || [])[0]]?.enlaces || []).find(([, u]) => /^https?:/.test(u));
        return `<article class="lb-dc"><button type="button" class="lb-dc-img" data-open="${esc(f.id)}" aria-label="Abrir ${esc(f.n)}"><img src="${esc(S.prev[f.id])}" alt="Captura de ${esc(f.n)}" loading="lazy"></button>
          <div class="lb-dc-b"><span class="lb-evs">${evChips(f.e)}</span>
            <button type="button" class="lb-dc-t" data-open="${esc(f.id)}">${esc(f.n)}</button>
            <p class="lb-dc-d">${esc(f.d)}</p>
            ${c.extra?.estado ? `<p class="lb-dc-e"><b>Estado.</b> ${esc(c.extra.estado)}</p>` : ''}
            ${funcs.length ? `<div class="lb-dc-l"><span>${funcs.length} funcionalidades comprobadas</span><div>${funcs.slice(0, 4).map(id => pill(id)).join('')}${funcs.length > 4 ? `<span class="lb-pill is-mas">+${funcs.length - 4}</span>` : ''}</div></div>` : ''}
            ${tec.length ? `<div class="lb-dc-l"><span>Hecho con</span><div>${tec.map(t => `<span class="lb-pill is-tec" tabindex="0" data-tip="${esc(glosa(t))}">${esc(sinParen(t))}</span>`).join('')}</div></div>` : ''}
            <div class="lb-dc-f"><button type="button" class="lb-link" data-open="${esc(f.id)}">Ver la ficha completa →</button>${abrir ? `<a class="lb-link" href="${esc(abrir[1])}" target="_blank" rel="noopener">Ver el sitio ↗</a>` : ''}</div>
          </div></article>`;
      }).join('')}</div></div>`;
  }

  // ¿Quién sos? Según la elección se muestran los recomendados. Todo apunta a fichas reales de la base.
  const PERFILES = [
    { id: 'reclutador', n: 'Reclutador', ic: IC.problema, tip: 'Si buscás a alguien para Mercado Libre: herramientas que analizan cuentas y publicaciones.',
      why: 'Lo que más sirve para evaluar mi trabajo en Mercado Libre.', items: [['ml-tracker', 'Seguimiento de cuentas de Mercado Libre'], ['herramienta-auditoria', 'Auditoría de cuenta'], ['herramienta-chequeo', 'Chequeo de publicación'], ['herramienta-simulador', 'Simulador de puntaje']],
      href: ['lab.html', 'Ver el Lab de Mercado Libre'] },
    { id: 'cliente', n: 'Cliente', ic: '<path d="M3 4h2l2.4 11h11L21 7H6M9 20h.01M17 20h.01"/>', tip: 'Si vendés en Mercado Libre o querés una web: tienda propia, revisión de tu cuenta y qué tipo de web te sirve.',
      why: 'Para vender más en Mercado Libre o tener una web propia.', items: [['tienda', 'Si vendés en Mercado Libre'], ['herramienta-auditoria', 'Revisá tu cuenta de Mercado Libre'], ['ecommerce', 'Tu tienda propia'], ['landing', 'Una web que consigue consultas']],
      mas: ['problema', 'Ver qué le sirve a mi rubro'] },
    { id: 'estudiante', n: 'Estudiante', ic: IC.aprender, tip: 'Si querés aprender: por dónde empezar, con ejemplos para tocar.',
      why: 'Para aprender con algo para probar.', items: [['vanilla', 'Para empezar'], ['impeccable', 'Diseñar mejor con IA'], ['glassmorphism', 'Un estilo con demo para tocar'], ['webapp-testing', 'Verificar tu propio trabajo']],
      mas: ['aprender', 'Ver todo para aprender'] },
    { id: 'tendencia', n: 'Tendencia', ic: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>', tip: 'Estilos que hoy se ven en productos nuevos.',
      why: 'Estilos que hoy se ven en productos nuevos. Es criterio mío, no una estadística de mercado.', items: [['liquid-glass', 'Estilo en alza'], ['ai-native-ui', 'Interfaces con IA'], ['bento-grids', 'Layout de moda'], ['motion-driven', 'Movimiento con criterio']] },
  ];
  // Descripción propia solo donde el resumen de la ficha no sirve para una tarjeta
  const TILE_D = { 'liquid-glass': 'Vidrio translúcido que se deforma como un líquido. Muy llamativo; pesado para celulares básicos.', 'ai-native-ui': 'Interfaces pensadas para conversar con una IA: chat, voz y texto que aparece mientras se genera.',
    'bento-grids': 'Información en tarjetas de distintos tamaños, como un bento: ordenado y fácil de escanear.', 'motion-driven': 'Animaciones y transiciones que guían la atención. Pide cuidar el rendimiento.' };
  function renderTop() {
    const box = $('lb-top'); if (!box) return;
    const nProy = id => new Set((S.relIn[id] || []).filter(r => r.tipo === 'usa' || r.tipo === 'implementa').map(r => r.desde)).size;
    const per = PERFILES.find(p => p.id === S.perfil) || PERFILES[0];
    const tiles = per.items.filter(([id]) => S.by[id]).map(([id, k], n) => { const f = S.by[id];
      const d = TILE_D[id] || (f.t === 'funcionalidad' ? `La armé en ${nProy(id)} proyectos distintos. ${f.d}` : f.d);
      return `<button type="button" class="lb-tile${n === 0 ? ' is-main' : ''}" data-open="${esc(f.id)}"><span class="lb-tile-k">${esc(k)}</span><strong>${esc(f.n)}</strong><span class="lb-tile-d">${esc(d)}</span>
        <span class="lb-tile-f">${f.v ? valChip(f.v, f.ve, true) : `<span class="lb-tipo">${esc(TIPOS[f.t] || f.t)}</span>`}<span class="lb-tile-go" aria-hidden="true">→</span></span></button>`; }).join('');
    box.innerHTML = `<p class="lb-top-t">Elegí quién sos y te muestro por dónde empezar<span class="lb-cara" aria-hidden="true">ツ</span></p>
      <div class="lb-perfiles" role="group" aria-label="Quién sos">${PERFILES.map(p => `<button type="button" data-perfil="${p.id}" data-tip="${esc(p.tip)}" aria-pressed="${p.id === per.id}">${ic(p.ic)}<span>${p.n}</span></button>`).join('')}</div>
      <p class="lb-top-why">${esc(per.why)}</p>
      <div class="lb-top-g" key="${per.id}">${tiles}</div>
      ${per.mas ? `<button type="button" class="lb-link" data-vista="${per.mas[0]}">${esc(per.mas[1])} →</button>` : per.href ? `<a class="lb-link" href="${per.href[0]}">${esc(per.href[1])} →</a>` : ''}`;
  }

  // ── Explicaciones al pasar el mouse (o enfocar): rápidas, y la segunda aparece sin demora ──
  function tooltips() {
    const tip = document.createElement('div'); tip.className = 'lb-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true; document.body.appendChild(tip);
    let timer = 0, ultimo = 0, actual = null;
    const SEL = '[data-tip], .lb-ev[data-k], .wl-val';
    const texto = el => {
      if (el.dataset.tip) return el.dataset.tip;
      if (el.matches('.lb-ev[data-k]')) return el.dataset.k === 'sin' ? 'Todavía no tiene nada para ver.' : EV_NOTA[el.dataset.k] || '';
      if (el.matches('.wl-val')) { const v = VAL[el.dataset.v]; return v ? v[2] + (el.classList.contains('is-prov') ? ' Provisional: criterio todavía sin revisar.' : '') : ''; }
      return '';
    };
    const mostrar = el => {
      const t = texto(el); if (!t) return;
      actual = el; tip.textContent = t; tip.hidden = false; tip.style.visibility = 'hidden';
      const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      let x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8), y = r.top - h - 8; if (y < 8) y = r.bottom + 8;
      tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.style.visibility = ''; tip.classList.add('is-on'); ultimo = Date.now();
    };
    const ocultar = () => { clearTimeout(timer); tip.hidden = true; tip.classList.remove('is-on'); actual = null; ultimo = Date.now(); };
    document.addEventListener('mouseover', e => { const el = e.target.closest?.(SEL); if (!el || el === actual) return; clearTimeout(timer); const ya = Date.now() - ultimo < 400 && !tip.hidden || Date.now() - ultimo < 250; timer = setTimeout(() => mostrar(el), ya ? 0 : 140); });
    document.addEventListener('mouseout', e => { const el = e.target.closest?.(SEL); if (el && !el.contains(e.relatedTarget)) ocultar(); });
    document.addEventListener('focusin', e => { const el = e.target.closest?.(SEL); if (el) mostrar(el); });
    document.addEventListener('focusout', ocultar);
    document.addEventListener('scroll', ocultar, { passive: true, capture: true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') ocultar(); });
  }

  async function renderBase() {
    $('lb-main').setAttribute('aria-busy', 'true');
    renderSide(); renderVistas(); renderDest(); renderTop();
    const areaN = AREAS.find(a => a[0] === S.f.area);
    const q = S.q.trim();
    $('lb-head').innerHTML = q ? `<h2>Resultados para “${esc(q)}”</h2><p>Buscando en toda la base.</p>`
      : S.vista === 'problema' ? '<h2>Tengo un negocio</h2><p>Elegí tu rubro y te muestro qué tipo de web, qué funciones y qué diseño le sirven.</p>'
      : S.vista === 'aprender' ? '<h2>Quiero aprender</h2><p>Técnicas, herramientas y recursos, de lo más simple a lo más avanzado, con su ejemplo cuando lo tienen.</p>'
      : S.vista === 'hace' ? '<h2>Mi trabajo</h2><p>Lo que construí y lo que probé: proyectos, las funcionalidades y herramientas que se comprobó que usan, y la evidencia de cada cosa (proyecto real, experimento o demo).</p>'
      : `<h2>${areaN ? areaN[1] : 'Todo'}</h2><p>${areaN ? areaN[2] : 'Todas las entradas de la base. Elegí un área a la izquierda o usá el buscador.'}</p>`;
    const vista = q ? 'todo' : S.vista;
    const grid = $('lb-grid'); let html = '';
    if (vista === 'hace') { await renderHace(); return; }
    let lista = filtrar(vista === 'problema' ? { area: '', tipo: 'solucion' } : vista === 'aprender' ? { tipo: '' } : {});
    if (vista === 'aprender' && !q) lista = lista.filter(f => ['tecnica', 'herramienta', 'recurso'].includes(f.t));
    const totalArea = filtrar({ ...(vista === 'problema' ? { area: '', tipo: 'solucion' } : vista === 'aprender' ? { tipo: '' } : {}), valor: '', nivel: 0, ev: '' });
    $('lb-filtros').innerHTML = filtrosHTML(vista === 'aprender' && !q ? totalArea.filter(f => ['tecnica', 'herramienta', 'recurso'].includes(f.t)) : totalArea);
    if (vista === 'problema') {
      html += `<div class="lb-pregunta"><h2>¿De qué es tu negocio?</h2><p>Con tu rubro te armo la página con las soluciones, estilos, paleta y funcionalidades que más se parecen a tu caso.</p>
        <div class="lb-sel">${selectorRubro()}<button type="button" class="lb-btn is-acc" data-ir-rubro>Ver para mi rubro</button></div></div>`;
    }
    if (vista === 'aprender') {
      const por = {}; ordenarAprender(lista).forEach(f => { (por[f.lv || 0] ||= []).push(f); });
      for (const n of [1, 2, 3, 0]) if (por[n]) html += `<h3 class="lb-grupo">${NIV[n] || 'Sin nivel'}<small>${por[n].length}</small></h3>` + por[n].map(card).join('');
    } else {
      html += ordenar(lista).slice(0, 120).map(card).join('');
      if (lista.length > 120) html += `<p class="lb-vacio">Mostrando 120 de ${lista.length}. Usá el buscador o los filtros para acotar.</p>`;
    }
    if (!lista.length) html += '<p class="lb-vacio">Ninguna entrada cumple con esos filtros. Sacá alguno para ver más.</p>';
    $('lb-count').textContent = `${lista.length} ${lista.length === 1 ? 'entrada' : 'entradas'}`;
    grid.innerHTML = html;
    $('lb-main').setAttribute('aria-busy', 'false');
    baseListo = true; fitCards();
  }
  const ordenarAprender = l => [...l].sort((a, b) => (a.lv || 9) - (b.lv || 9) || (VRANK[a.v] ?? 3) - (VRANK[b.v] ?? 3) || a.n.localeCompare(b.n, 'es'));

  function selectorRubro(sel = '') {
    const g = {}; S.rubros.forEach(r => { (g[r.familia] ||= []).push(r); });
    return `<select class="lb-rubro-sel" aria-label="Elegí tu rubro"><option value="">Elegí tu rubro…</option>${Object.entries(g).sort((a, b) => (FAMILIAS[a[0]] || a[0]).localeCompare(FAMILIAS[b[0]] || b[0], 'es')).map(([f, l]) => `<optgroup label="${esc(FAMILIAS[f] || f)}">${l.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(r => `<option value="${esc(r.id)}"${r.id === sel ? ' selected' : ''}>${esc(r.nombre)}</option>`).join('')}</optgroup>`).join('')}</select>`;
  }

  // ── Vista: Qué sabe hacer Darío (proyectos → funcionalidades, técnicas y herramientas → evidencias) ──
  async function renderHace() {
    const proys = S.idx.filter(f => f.t === 'proyecto');
    const cuerpos = await getJSON(D + 'proyectos.json');
    const porId = Object.fromEntries(cuerpos.map(c => [c.id, c]));
    const pill = id => `<a class="lb-pill" href="#/f/${esc(id)}">${esc(nombreDe(id))}</a>`;
    const tarjeta = f => {
      const c = porId[f.id] || {}, out = S.relOut[f.id] || [];
      const impl = out.filter(r => r.tipo === 'implementa').map(r => r.a), usa = out.filter(r => r.tipo === 'usa').map(r => r.a);
      const evs = (c.evidencias || []).map(e => S.evid[e]).filter(Boolean);
      return `<button type="button" class="lb-proy" data-open="${esc(f.id)}"><span class="lb-evs">${evChips(f.e)}</span>
        <h3>${esc(f.n)}</h3><p>${esc(f.d)}</p>
        ${c.extra?.estado ? `<p class="lb-note">${esc(c.extra.estado)}</p>` : ''}
        <div class="lb-cadena">${impl.length ? `<div><b>Funcionalidades</b>${impl.map(pill).join('')}</div>` : ''}${usa.length ? `<div><b>Herramientas</b>${usa.map(pill).join('')}</div>` : ''}${evs.length ? `<div><b>Evidencia</b>${evs.map(e => `<span class="lb-ev" data-k="${e.tipo}">${esc(e.titulo)}</span>`).join('')}</div>` : ''}</div></button>`;
    };
    const exp = S.idx.filter(f => f.e.includes('experimento')), demos = S.idx.filter(f => f.e.includes('demo') && f.t !== 'proyecto'), funcs = S.idx.filter(f => f.t === 'funcionalidad');
    $('lb-filtros').innerHTML = '';
    const principales = proys.filter(f => !f.id.startsWith('herramienta-'));
    $('lb-grid').innerHTML = `<h3 class="lb-grupo">Proyectos<small>${principales.length}</small></h3><div class="lb-proys">${principales.map(tarjeta).join('')}</div>
      <h3 class="lb-grupo">Herramientas públicas que funcionan<small>${proys.filter(f => f.id.startsWith('herramienta-')).length}</small></h3><div class="lb-proys">${proys.filter(f => f.id.startsWith('herramienta-')).map(tarjeta).join('')}</div>
      <h3 class="lb-grupo">Funcionalidades con respaldo comprobado<small>${funcs.length}</small></h3>${funcs.map(card).join('')}
      <h3 class="lb-grupo">Probado en experimentos<small>${exp.length}</small></h3>${ordenar(exp).map(card).join('')}
      <h3 class="lb-grupo">Con demo para tocar<small>${demos.length}</small></h3>${ordenar(demos).slice(0, 12).map(card).join('')}
      <p class="lb-vacio">Cada cosa dice qué es: <b>proyecto real</b> (lo construí), <b>experimento</b> (lo probé sin y con la herramienta) o <b>demo</b> (hecha para mostrar la idea). Las maquetas generadas no se cuentan acá. <button type="button" class="lb-btn" data-todas-demos>Ver todas las demos</button></p>`;
    $('lb-count').textContent = `${proys.length} proyectos y herramientas`;
    $('lb-main').setAttribute('aria-busy', 'false');
    baseListo = true; fitCards();
  }

  function fitCards() { document.querySelectorAll('.lb-pv').forEach(p => { const f = p.querySelector('iframe'); if (f) f.style.transform = `scale(${p.clientWidth / 1280})`; }); }

  // ── Página de rubro (recomendador) ──
  async function showRubro(id) {
    setView('rubro');
    const r = S.rubrosBy[id]; const box = $('lb-rubro');
    if (!r) { box.innerHTML = '<div class="lb-fbar"><button type="button" data-atras>← Volver a la base</button><button type="button" class="lb-x" data-atras aria-label="Cerrar">✕</button></div><div class="lb-rwrap"><h1>No encontré ese rubro</h1></div>'; return; }
    const listaCards = ids => ids.map(i => S.by[i]).filter(Boolean).map(card).join('') || '<p class="lb-vacio">Todavía no hay entradas para esto.</p>';
    const neg = r.negocios.map(i => S.by[i]).filter(Boolean);
    const negBody = neg.length ? await ficha(neg[0].id) : null;
    const funcs = negBody ? (negBody.nucleo.aporta || []).filter(x => /Funcionalidades/i.test(x.l)) : [];
    box.innerHTML = `<div class="lb-fbar"><button type="button" data-atras>← Volver a la base</button><span class="lb-bc">Para tu negocio / <b>${esc(r.nombre)}</b></span><button type="button" class="lb-x" data-atras aria-label="Cerrar">✕</button></div><div class="lb-rwrap">
      <span class="lb-tipo">Para tu rubro · ${esc(FAMILIAS[r.familia] || '')}</span><h1>${esc(r.nombre)}</h1><p class="lb-sub">${esc(r.resumen)}</p>
      <div class="lb-sel" style="margin-top:1rem">${selectorRubro(r.id)}<button type="button" class="lb-btn" data-ir-rubro>Cambiar rubro</button></div>
      ${neg.length ? `<h2>Soluciones para este rubro</h2><div class="wl-grid">${neg.map(card).join('')}</div>` : ''}
      ${funcs.length ? `<h2>Funcionalidades que venden</h2><dl class="lb-dl">${funcs.map(x => `<div><dt>${esc(x.l)}</dt><dd>${esc(x.x)}</dd></div>`).join('')}</dl><p class="lb-note" style="margin-top:.5rem">Del texto curado de la solución; todavía sin proyecto propio que las respalde.</p>` : ''}
      <h2>Estilos recomendados</h2><div class="wl-grid">${listaCards(r.recomienda.estilos)}</div>
      <h2>Patrones de landing recomendados</h2><div class="wl-grid">${listaCards(r.recomienda.landing)}</div>
      ${r.palette.length ? `<h2>Paleta recomendada</h2><div class="lb-pal wl-pal">${r.palette.map(([n, h]) => `<button type="button" data-copy="${esc(h)}"><span style="background:${esc(h)}"></span><span>${esc(n)}<br>${esc(h)}</span></button>`).join('')}</div><p class="lb-note" style="margin-top:.5rem">Tocá un color para copiar el código.</p>` : ''}
      <h2>Así se ve</h2><div id="lb-rubro-maq" class="lb-legacy"><p class="lb-note">Armando la maqueta…</p></div><p class="lb-note">Maqueta generada con un negocio inventado de este rubro y su paleta. No es un proyecto real.</p>
      <h2>Qué tener en cuenta</h2><dl class="lb-dl">${r.campos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`;
    fitCards();
    try {
      const old = (await getJSON(OLD + 'rubros.json')).find(e => e.id === r.legacy.id);
      $('lb-rubro-maq').innerHTML = old && window.WLExamples ? await WLExamples.render(old, 'rubros') : '';
    } catch (e) { $('lb-rubro-maq').innerHTML = ''; }
    document.title = `Para ${r.nombre} | Darío Colángelo`;
  }

  // ── Ficha a pantalla completa ──
  const evDeFicha = f => (f.evidencias || []).map(e => S.evid[e]).filter(Boolean);
  const frame = (src, titulo, interactivo) => `<div class="lb-frame" data-fr><iframe src="${esc(src)}" title="${esc(titulo)}" loading="lazy"${interactivo ? '' : ' tabindex="-1"'}></iframe></div>`;
  const cmpHTML = (a, b) => `<div class="lb-frame is-cmp" data-fr data-cmp style="--x:50%"><iframe src="${esc(a[1])}" title="${esc(a[0])}" loading="lazy" tabindex="-1"></iframe><div class="top"><iframe src="${esc(b[1])}" title="${esc(b[0])}" loading="lazy" tabindex="-1"></iframe></div><span class="ln"></span><span class="kn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 6-6 6 6 6M15 6l6 6-6 6"/></svg></span><span class="lab a">${esc(a[0])}</span><span class="lab b">${esc(b[0])}</span><input type="range" min="0" max="100" value="50" aria-label="Comparar: deslizá la línea"></div>`;

  // Una captura grande arriba y todas las miniaturas siempre a la vista debajo; al elegir una, pasa arriba
  const galeriaHTML = caps => `<div class="lb-gal"><a class="lb-gal-main" href="${esc(caps[0][1])}" target="_blank" rel="noopener" title="Ver en tamaño real"><img src="${esc(caps[0][1])}" alt="${esc(caps[0][0])}"></a><p class="lb-gal-t">${esc(caps[0][0])}</p>
    ${caps.length > 1 ? `<div class="lb-thumbs" role="group" aria-label="Capturas">${caps.map((c, i) => `<button type="button" data-cap="${i}" aria-pressed="${i === 0}" title="${esc(c[0])}"><img src="${esc(c[1])}" alt="${esc(c[0])}" loading="lazy"></button>`).join('')}</div>` : ''}</div>`;
  function tabsDe(f) {
    const t = [];
    for (const e of evDeFicha(f)) {
      if (e.id === 'demo-glassmorphism') {
        t.push({ k: 'cmp', label: 'Antes / después', nota: EV_NOTA.demo + ' La misma app, con el mismo contenido: a la izquierda estilo plano y a la derecha con vidrio.', html: () => cmpHTML(['Estilo plano', e.ref.antes], ['Con vidrio', e.ref.url]), open: e.ref.url });
        t.push({ k: 'ej', label: 'Ejemplo', nota: EV_NOTA.demo, html: () => frame(e.ref.url, 'Ejemplo', true), open: e.ref.url });
      } else if (e.tipo === 'experimento') {
        if (e.ref?.sin && e.ref?.con) t.push({ k: 'cmp', label: 'Antes / después', nota: EV_NOTA.experimento, html: () => cmpHTML(['Sin la skill', e.ref.sin], ['Con ' + f.nombre, e.ref.con]), open: e.ref.con });
        t.push({ k: 'exp', label: 'Experimento completo', nota: EV_NOTA.experimento, legacy: 'skills' });
      } else if (e.tipo === 'demo') {
        t.push({ k: 'dem', label: 'Demo', nota: EV_NOTA.demo, legacy: 'demo' });
      } else if (e.tipo === 'proyecto' && e.ref?.capturas?.length) {
        const ab = (e.enlaces || []).find(([, u]) => /^https?:/.test(u));
        // Cada proyecto es su propia pestaña (en una funcionalidad o un tipo de web, el nombre del proyecto)
        t.push({ k: 'cap-' + e.id, label: f.tipo === 'proyecto' ? 'Capturas' : f.tipo === 'funcionalidad' ? (e.ref.proyecto || e.titulo) : (e.ref.funcion || e.titulo), nota: (e.ref.nota || EV_NOTA.proyecto), caps: e.ref.capturas, html: () => galeriaHTML(e.ref.capturas), open: ab ? ab[1] : null, openLabel: ab ? ab[0] : '' });
      } else if (e.tipo === 'ejemplo') {
        t.push({ k: 'ej', label: 'Ejemplos de terceros', nota: EV_NOTA.ejemplo, legacy: 'ejemplo' });
      } else if (e.tipo === 'maqueta' && e.id !== 'maqueta-preset') {
        t.push({ k: 'maq', label: 'Maqueta', nota: EV_NOTA.maqueta, legacy: 'maqueta' });
      }
    }
    // evitar pestañas repetidas del mismo tipo
    const orden = { cmp: 0, ej: 1, exp: 2, dem: 3, maq: 4 }, visto = new Set(), peso = k => k.startsWith('cap-') ? -1 : orden[k];
    return t.filter(x => !visto.has(x.k) && visto.add(x.k)).sort((a, b) => peso(a.k) - peso(b.k));
  }

  async function legacyHTML(f, modo) {
    const e = await legacyEntry(f); if (!e || !window.WLDemos) return '<p class="lb-note">Sin contenido para mostrar.</p>';
    const cat = f.legacy.cat; let h = '';
    if (modo === 'skills' || modo === 'demo') h = WLDemos.render(e, cat) || '';
    else { h = (WLDemos.render(e, cat) || '') + (window.WLExamples ? await WLExamples.render(e, cat) : ''); }
    return h || '<p class="lb-note">Esta ficha no tiene contenido de este tipo.</p>';
  }

  const SLOTS = [['que_es', 'Qué es'], ['problema', 'Qué soluciona'], ['aporta', 'Qué aporta'], ['como', 'Cómo se aplica'], ['cuando_si', 'Cuándo conviene'], ['cuando_no', 'Cuándo no']];
  function nucleoHTML(f) {
    let h = '';
    for (const [k, lab] of SLOTS) {
      const items = f.nucleo?.[k]; if (!items?.length) continue;
      const multi = items.length > 1 || k === 'aporta';
      const body = multi ? `<ul>${items.map(i => `<li>${i.l ? `<b>${esc(i.l)}</b> ` : ''}${esc(i.x)}</li>`).join('')}</ul>` : items.map(i => `<p>${i.l ? `<b>${esc(i.l)}</b> ` : ''}${esc(i.x)}</p>`).join('');
      h += `<div class="${k === 'cuando_si' ? 'si' : k === 'cuando_no' ? 'no' : ''}"><dt>${lab}</dt><dd>${body}</dd></div>`;
    }
    return h;
  }
  function relHTML(f) {
    const out = S.relOut[f.id] || [], inn = S.relIn[f.id] || [];
    const pills = ids => [...new Set(ids)].map(i => `<a class="lb-pill" href="#/f/${esc(i)}">${esc(nombreDe(i))}</a>`).join('');
    const rows = [];
    const dondeUse = inn.filter(r => (r.tipo === 'usa' || r.tipo === 'implementa' || r.tipo === 'evidenciada_por') && S.by[r.desde]?.t === 'proyecto').map(r => r.desde);
    if (dondeUse.length) rows.push(['Dónde lo usé', pills(dondeUse)]);
    const impl = out.filter(r => r.tipo === 'implementa').map(r => r.a); if (impl.length) rows.push(['Implementa', pills(impl)]);
    const usa = out.filter(r => r.tipo === 'usa').map(r => r.a); if (usa.length) rows.push(['Usa', pills(usa)]);
    const evi = out.filter(r => r.tipo === 'evidenciada_por').map(r => r.a); if (evi.length) rows.push(['Evidencia en', pills(evi)]);
    const usadoEn = inn.filter(r => r.tipo === 'usa' && S.by[r.desde]?.t !== 'proyecto').map(r => r.desde); if (usadoEn.length) rows.push(['Usado en', pills(usadoEn)]);
    const vde = out.filter(r => r.tipo === 'variante_de').map(r => r.a); if (vde.length) rows.push(['Variante de', pills(vde)]);
    const vars = inn.filter(r => r.tipo === 'variante_de').map(r => r.desde); if (vars.length) rows.push(['Variantes', pills(vars)]);
    const rel = [...out.filter(r => r.tipo === 'relacionada').map(r => r.a), ...inn.filter(r => r.tipo === 'relacionada').map(r => r.desde)]; if (rel.length) rows.push(['Relacionada con', pills(rel)]);
    if (f.recomendado_para?.length) rows.push(['Recomendado para', f.recomendado_para.map(r => `<a class="lb-pill" href="#/r/${esc(r)}">${esc(S.rubrosBy[r]?.nombre || r)}</a>`).join('')]);
    if (f.rubros?.length) rows.push(['Rubros', f.rubros.map(r => `<a class="lb-pill" href="#/r/rubro:${esc(r)}">${esc(S.rubrosBy['rubro:' + r]?.nombre || r)}</a>`).join('')]);
    return rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }
  function evidenciasHTML(f) {
    const evs = evDeFicha(f);
    if (!evs.length) return '<div><dt>Cómo verlo</dt><dd>Sin ejemplo todavía.</dd></div>';
    return `<div><dt>Cómo verlo</dt><dd><ul>${evs.map(e => `<li><span class="lb-ev" data-k="${e.tipo}">${EV[e.tipo]}</span> <b>${esc(e.titulo)}.</b> ${esc(e.descripcion)}${e.enlaces?.length ? ' ' + e.enlaces.map(([t, u]) => /^https?:/.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>` : `<a href="${esc(u)}">${esc(t)}</a>`).join(' · ') : ''}</li>`).join('')}</ul></dd></div>`;
  }
  const veredicto = f => window.WLDemos?.veredicto && f.legacy ? WLDemos.veredicto(f.legacy.cat, f.legacy.id) : null;

  function tecnicoHTML(f) {
    const par = [...(f.tecnico || [])];
    const ex = f.extra || {};
        if (!par.length && !f.fuente) return '';
    return `<details class="lb-tec"><summary>Datos técnicos y fuente</summary><dl>${par.map(p => `<div><dt>${esc(p[0])}</dt><dd>${esc(p[1])}${p[2] ? `<em>(${esc(p[2])})</em>` : ''}</dd></div>`).join('')}${f.fuente ? `<div><dt>Fuente</dt><dd>${esc(f.fuente)}</dd></div>` : ''}${f.origen ? `<div><dt>Origen</dt><dd>${esc(f.origen)}</dd></div>` : ''}</dl></details>`;
  }

  function promptHTML(f) {
    const p = f.reutilizable?.prompt; if (!p?.texto) return '';
    const exp = f.reutilizable?.experimento;
    return `<section class="lb-prompt"><h2>Prompt para usarlo</h2><div id="lb-prompt-box"><p class="lb-pn"><span class="lb-pb">${exp ? 'Sin probar tal cual' : 'Sin probar'}</span> ${p.idioma === 'en' ? 'Está en inglés, que es como lo trae la fuente. ' : ''}${exp ? 'El experimento tiene su propio prompt probado (abajo, en "Experimento completo").' : 'Sugerido; todavía no se corrió.'}</p>
      <div class="lb-pbox"><p>${esc(p.texto).replace(/\n/g, '<br>')}</p><button type="button" class="lb-btn" data-copiar-prompt>Copiar prompt</button></div></div></section>`;
  }

  async function showFicha(id) {
    setView('ficha');
    const box = $('lb-ficha'); const f = await ficha(id);
    if (!f) { box.innerHTML = '<div class="lb-fbar"><button type="button" data-atras>← Volver a la base</button><button type="button" class="lb-x" data-atras aria-label="Cerrar">✕</button></div><div class="lb-info"><h1>No encontré esa ficha</h1></div>'; return; }
    const tabs = tabsDe(f), solo = !tabs.length;
    const prov = f.valor_estado === 'provisional';
    const v = veredicto(f);
    const porque = f.valor ? `<p class="lb-porque"><b>${VAL[f.valor][0]}${prov ? ' (provisorio)' : ''}.</b> ${esc(f.valor_porque)}<small>${prov ? '<span class="lb-prov">Provisional/heredado:</span> criterio automático o asignado sin revisar por Darío. ' : 'Validado por Darío. '}${f.valor_revisado ? 'Valor revisado en octubre de 2026.' : ''}</small></p>` : '';
    const veredHTML = v && v.key !== 'sin' ? `<section class="lb-porque" style="margin-top:1.3rem"><b>Qué mostró el experimento: ${esc(v.label)}.</b> ${esc(v.texto)}<small><b>Cómo se analizó:</b> mismo prompt, mismo modelo, carpeta vacía y una sola corrida por lado. Se comparan el resultado contra el pedido, el tiempo, el costo y los pasos.</small></section>` : '';
    const extra = f.extra || {};
    const proyecto = f.tipo === 'proyecto' ? `${extra.tecnologias?.length ? `<div><dt>Hecho con</dt><dd><ul class="lb-glos">${extra.tecnologias.map(t => `<li><b>${esc(sinParen(t))}</b>${glosa(t) ? ' ' + esc(glosa(t)) : ''}</li>`).join('')}</ul></dd></div>` : ''}${extra.estado ? `<div><dt>Estado</dt><dd>${esc(extra.estado)}</dd></div>` : ''}${extra.pendiente?.length ? `<div><dt>Pendiente</dt><dd><ul>${extra.pendiente.map(x => `<li>${esc(x)}</li>`).join('')}</ul></dd></div>` : ''}` : '';
    const respaldo = f.tipo === 'funcionalidad' && extra.respaldo?.length ? `<div><dt>Respaldo</dt><dd><ul>${extra.respaldo.map(r => `<li><a href="#/f/${esc(r.proyecto)}">${esc(nombreDe(r.proyecto))}</a> (${r.nivel === 'A' ? 'código y documentación' : 'solo en el código'}). <span class="lb-note">${esc(r.fuente)}</span></li>`).join('')}</ul></dd></div>${extra.nota ? `<div><dt>Nota</dt><dd>${esc(extra.nota)}</dd></div>` : ''}` : '';
    const cuerpo = nucleoHTML(f) + proyecto + respaldo + evidenciasHTML(f) + relHTML(f);
    const area = AREAS.find(a => a[0] === f.areas[0]);
    box.innerHTML = `<div class="lb-fbar"><button type="button" data-atras>← Volver a la base</button><span class="lb-bc">${area ? esc(area[1]) : ''} / <b>${esc(f.nombre)}</b></span><button type="button" class="lb-x" data-atras aria-label="Cerrar la ficha">✕</button></div>
      <div class="lb-fc${solo ? ' is-solo' : ''}"><article class="lb-info">
        <span class="lb-tipo">${esc(TIPOS[f.tipo])} · ${esc(f.subtipo)}</span>
        <h1>${esc(f.nombre)}</h1>${f.resumen ? `<p class="lb-sub">${esc(f.resumen)}</p>` : ''}
        <div class="lb-meta">${valChip(f.valor, f.valor_estado)}${nivChip(f.nivel)}<span class="lb-evs" style="margin:0">${evChips([...new Set(evDeFicha(f).map(e => e.tipo))])}</span><a class="lb-btn is-cta lb-cta" href="contacto.html?asunto=${encodeURIComponent('Quiero algo así: ' + f.nombre)}">Quiero algo así</a></div>
        ${porque}
        ${f.nucleo_borrador ? '<p class="lb-borrador">Texto escrito como borrador para revisar.</p>' : ''}
        <dl class="lb-fd">${cuerpo || '<div><dt>Contenido</dt><dd>Todavía sin texto para esta ficha.</dd></div>'}</dl>
        ${veredHTML}${promptHTML(f)}${tecnicoHTML(f)}
      </article>${solo ? '' : '<section class="lb-vw" aria-label="Ejemplo"></section>'}</div>`;
    document.title = `${f.nombre} | Darío Colángelo`;
    if (!solo) montarVisor(f, tabs);
    const bp = box.querySelector('[data-copiar-prompt]');
    if (bp) bp.onclick = async () => { try { await navigator.clipboard.writeText(f.reutilizable.prompt.texto); bp.textContent = 'Copiado'; } catch (e) { bp.textContent = 'No se pudo copiar'; } setTimeout(() => { bp.textContent = 'Copiar prompt'; }, 1600); };
  }

  function montarVisor(f, tabs) {
    const vw = $('lb-ficha').querySelector('.lb-vw'); let actual = tabs[0];
    const pintar = async () => {
      vw.innerHTML = `<div class="lb-vt">${tabs.length > 1 ? `<div class="lb-seg" role="group" aria-label="Qué ver">${tabs.map(t => `<button type="button" data-tab="${t.k}" aria-pressed="${t.k === actual.k}">${t.label}</button>`).join('')}</div>` : `<span class="lb-tipo">${actual.label}</span>`}${actual.open ? `<button type="button" class="lb-btn" data-abrir>${actual.openLabel ? esc(actual.openLabel) + ' ↗' : 'Abrir en grande ↗'}</button>` : '<span></span>'}</div>
        <div class="lb-stage"><div class="lb-legacy" ${actual.legacy ? '' : 'hidden'}></div>${actual.html ? actual.html() : ''}</div><p class="lb-vn">${esc(actual.nota)}</p>`;
      const stage = vw.querySelector('.lb-stage');
      if (actual.legacy) {
        const cont = stage.querySelector('.lb-legacy'); cont.innerHTML = '<p class="lb-note">Cargando…</p>';
        cont.innerHTML = await legacyHTML(f, actual.legacy); if (window.WLDemos) WLDemos.mount(cont);
      }
      ajustarFrames(vw);
      const gal = vw.querySelector('.lb-gal');
      if (gal) {
        const caps = actual.caps || [];
        gal.querySelectorAll('[data-cap]').forEach(b => b.onclick = () => {
          const c = caps[+b.dataset.cap]; if (!c) return;
          gal.querySelector('.lb-gal-main img').src = c[1]; gal.querySelector('.lb-gal-main img').alt = c[0]; gal.querySelector('.lb-gal-main').href = c[1]; gal.querySelector('.lb-gal-t').textContent = c[0];
          gal.querySelectorAll('[data-cap]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        });
      }
      const r = vw.querySelector('input[type=range]'); if (r) r.oninput = () => r.closest('.lb-frame').style.setProperty('--x', r.value + '%');
      const ab = vw.querySelector('[data-abrir]'); if (ab) ab.onclick = () => window.open(actual.open, '_blank', 'noopener');
      vw.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { actual = tabs.find(t => t.k === b.dataset.tab); pintar(); });
    };
    pintar();
  }
  function ajustarFrames(raiz) {
    raiz.querySelectorAll('[data-fr]').forEach(fr => { const fit = () => fr.style.setProperty('--s', fr.clientWidth / 1280); fit(); new ResizeObserver(fit).observe(fr); });
  }

  // ── Router ──
  // La base queda siempre debajo: la ficha y el rubro se abren como un panel completo sobre la misma página
  let abierto = null, foco = null;
  const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setView(v) {
    const ids = { rubro: 'lb-rubro', ficha: 'lb-ficha' };
    for (const [k, id] of Object.entries(ids)) {
      const el = $(id);
      if (k === v) {
        if (el.hidden) { foco = document.activeElement; el.hidden = false; document.documentElement.classList.add('lb-lock'); requestAnimationFrame(() => el.classList.add('is-open')); setTimeout(() => el.focus({ preventScroll: true }), 30); }
        el.scrollTop = 0; abierto = k;
      } else if (!el.hidden) {
        el.classList.remove('is-open'); setTimeout(() => { el.hidden = true; }, reducido() ? 0 : 220);
      }
    }
    if (!v || v === 'base') { document.documentElement.classList.remove('lb-lock'); if (abierto) { abierto = null; try { foco?.focus({ preventScroll: true }); } catch (e) {} } }
  }
  let internas = 0;
  function route() {
    const h = location.hash.replace(/^#\/?/, ''); const [a, b, ...rest] = h.split('/');
    if (a === 'f' && b) { ensureBase(); return showFicha(decodeURIComponent([b, ...rest].join('/'))); }
    if (a === 'r' && b) { ensureBase(); return showRubro(decodeURIComponent([b, ...rest].join('/'))); }
    if (a === 'v' && b && VISTAS.some(v => v[0] === b)) { S.vista = b; store.set('dc-lab-vista', b); }
    else if (a && b && S.legacy[`${a}/${decodeURIComponent([b, ...rest].join('/'))}`]) { const n = S.legacy[`${a}/${decodeURIComponent([b, ...rest].join('/'))}`]; history.replaceState(null, '', n.startsWith('rubro:') ? `#/r/${encodeURIComponent(n)}` : `#/f/${encodeURIComponent(n)}`); return route(); }
    const venia = abierto; setView('base'); document.title = 'Base de datos de herramientas, funcionalidades y proyectos | Darío Colángelo';
    if (!(venia && baseListo)) renderBase();
  }
  let baseListo = false;
  function ensureBase() { if (!baseListo) renderBase(); }

  function bind() {
    tooltips();
    window.addEventListener('hashchange', () => { internas++; route(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && abierto) { e.preventDefault(); if (internas > 0) history.back(); else location.hash = '#/'; return; } if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); $('lb-q').focus(); } });
    let t; $('lb-q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { S.q = e.target.value; if (!$('lb-base').hidden) renderBase(); else location.hash = '#/'; }, 140); });
    document.addEventListener('click', e => {
      const o = e.target.closest('[data-open]'); if (o) { location.hash = '#/f/' + encodeURIComponent(o.dataset.open); return; }
      if (e.target.closest('[data-atras]')) { if (internas > 0) history.back(); else location.hash = '#/'; return; }
      const pf = e.target.closest('[data-perfil]'); if (pf) { S.perfil = pf.dataset.perfil; store.set('dc-lab-perfil', S.perfil); renderTop(); return; }
      const vi = e.target.closest('[data-vista]'); if (vi) { S.vista = vi.dataset.vista; store.set('dc-lab-vista', S.vista); if (location.hash !== '#/') history.replaceState(null, '', '#/'); renderBase(); return; }
      const ar = e.target.closest('[data-area]'); if (ar) { e.preventDefault(); const id = ar.dataset.area; S.f.area = (id && S.f.area === id) ? '' : id; S.f.sub = ''; S.vista = 'todo'; store.set('dc-lab-vista', 'todo'); renderBase(); return; }
      const su = e.target.closest('[data-sub]'); if (su) { e.preventDefault(); S.f.sub = S.f.sub === su.dataset.sub ? '' : su.dataset.sub; S.vista = 'todo'; renderBase(); return; }
      const te = e.target.closest('[data-tema]'); if (te) { S.f.tema = S.f.tema === te.dataset.tema ? '' : te.dataset.tema; renderBase(); return; }
      const fv = e.target.closest('[data-f-valor]'); if (fv) { S.f.valor = fv.dataset.fValor; renderBase(); return; }
      const fn = e.target.closest('[data-f-nivel]'); if (fn) { S.f.nivel = +fn.dataset.fNivel || 0; renderBase(); return; }
      const fe = e.target.closest('[data-f-ev]'); if (fe) { S.f.ev = fe.dataset.fEv; renderBase(); return; }
      if (e.target.closest('[data-todas-demos]')) { S.vista = 'todo'; S.f = { area: '', sub: '', tema: '', valor: '', nivel: 0, ev: 'demo', tipo: '' }; store.set('dc-lab-vista', 'todo'); renderBase(); return; }
      if (e.target.closest('[data-ir-rubro]')) { const v = e.target.closest('[data-ir-rubro]').parentElement.querySelector('select')?.value; if (v) location.hash = '#/r/' + encodeURIComponent(v); return; }
      const cp = e.target.closest('[data-copy]'); if (cp) { navigator.clipboard?.writeText(cp.dataset.copy).then(() => { const l = cp.lastElementChild, p = l.innerHTML; l.textContent = 'Copiado'; setTimeout(() => { l.innerHTML = p; }, 1200); }); }
    });
    document.addEventListener('change', e => { if (e.target.matches?.('.lb-rubro-sel') && e.target.value) location.hash = '#/r/' + encodeURIComponent(e.target.value); });
    window.addEventListener('resize', fitCards);
  }

  boot();
})();
