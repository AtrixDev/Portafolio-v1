/* ============================================================
   ACADEMIA.JS — Academia IA dentro del panel (admin.html)
   Ruta de aprendizaje, skills con progreso, taller de prompts
   completados con datos reales de ML Tracker y viñetas para el CV.
   Contenido: data/ia-meli.json (el mismo que usa ia.html).
   Progreso: /api/academia · Datos de cuentas: /api/tracker
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = n => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-${n}"/></svg>`;
  const token = () => sessionStorage.getItem('dc_token') || '';
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

  const num = x => x == null ? '—' : Math.round(x).toLocaleString('es-AR');
  const plata = x => x == null ? '—' : (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('es-AR');
  const pct = (x, d = 1) => x == null ? '—' : (x * 100).toLocaleString('es-AR', { maximumFractionDigits: d }) + '%';
  const var_ = x => x == null ? 'sin período anterior' : (x >= 0 ? '+' : '') + Math.round(x * 100) + '%';

  const SKILLS_DIR = '~/Escritorio/Proyectos/Proyectos\\ Personales/Skills-MELI/skills';
  const INSTALADAS = new Set(['ads-math', 'ads-budget', 'ads-test']);   // ya vienen en tu Claude Code
  const CAMPOS = { n: 'Cantidad', m: 'Seleccionados', antes: 'Antes', despues: 'Después', pct: 'Porcentaje', horas: 'Horas', marca: 'Marca', producto: 'Producto' };
  const DEFAULTS = { SITE_ID: 'MLA', MARGEN_MINIMO: '15%', MARGEN_OBJETIVO: '10%', DESCUENTO: '15%', LEAD_TIME_DIAS: '15', COLCHON_DIAS: '7' };
  const ACCION = { subir: 'subir', probar_suba: 'probar una suba', bajar: 'bajar', revisar: 'revisar la oferta', mantener: 'mantener' };
  const TABS = [['perfil', 'user', 'Mi perfil'], ['negocio', 'grid', 'Hoja de ruta'], ['ruta', 'target', 'Ruta'], ['skills', 'layers', 'Skills'], ['taller', 'zap', 'Taller de prompts'], ['cv', 'briefcase', 'Para el CV']];

  const S = {
    data: null, prog: { tareas: {}, skills: {} }, vista: lsGet('ac-vista', 'perfil'), tier: 'S',
    cuentas: null, cuenta: lsGet('tk-cuenta', null), datos: {}, item: null, ficha: {},
    prompt: lsGet('ac-prompt', 'auditor'), vars: lsGet('ac-vars', {}), q: '', desdeTarea: null, cargado: false,
  };

  async function api(url, opts = {}) {
    const r = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + token(), ...(opts.body ? { 'Content-Type': 'application/json' } : {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || 'Error'), { status: r.status });
    return d;
  }
  function toast(msg, bad = false) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.toggle('is-bad', bad); t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
  }
  async function copiar(txt, msg = 'Copiado') {
    try { await navigator.clipboard.writeText(txt); toast(msg); }
    catch (e) { toast('No se pudo copiar: seleccioná el texto y usá Ctrl+C', true); }
  }

  // ── Progreso (se guarda solo, medio segundo después del último cambio) ──
  const skillP = id => (S.prog.skills[id] ||= { estado: 'pendiente', campos: {}, notas: '', publico: false });
  function guardar() {
    clearTimeout(guardar.t);
    const st = $('ac-save'); if (st) st.textContent = 'Guardando…';
    guardar.t = setTimeout(async () => {
      try { await api('/api/academia', { method: 'POST', body: JSON.stringify(S.prog) }); if ($('ac-save')) $('ac-save').textContent = 'Guardado'; }
      catch (e) { if ($('ac-save')) $('ac-save').textContent = 'No se pudo guardar'; toast('No se pudo guardar el progreso', true); }
    }, 600);
  }

  // ── Carga ──
  async function abrir() {
    const box = $('ac-app'); if (!box) return;
    if (!S.cargado) {
      box.innerHTML = '<p class="cp-empty">Cargando la academia…</p>';
      try {
        const [data, prog] = await Promise.all([fetch('data/ia-meli.json').then(r => r.json()), api('/api/academia')]);
        S.data = data; S.prog = { tareas: prog.tareas || {}, skills: prog.skills || {}, perfil: prog.perfil, negocio: prog.negocio }; S.cargado = true;
      } catch (e) {
        box.innerHTML = `<div class="tk-demo is-bad">${ic('alert')}<span>No se pudo cargar la academia (${esc(e.message)}). Recargá la página.</span></div>`;
        return;
      }
    }
    render();
  }

  function stats() {
    const tareas = S.data.plan.flatMap(w => w.tareas);
    const hechas = tareas.filter(t => S.prog.tareas[t.id]).length;
    const est = S.data.skills.map(s => skillP(s.id).estado);
    return { tareas: tareas.length, hechas, aplicadas: est.filter(e => e === 'aplicada' || e === 'dominada').length, aprendiendo: est.filter(e => e === 'aprendiendo').length };
  }

  function render() {
    const st = stats();
    $('ac-app').innerHTML = `
      <header class="tk-head">
        <div>
          <h2>Tu carrera en e-commerce</h2>
          <p class="tk-sub">Solo lo ves vos: tu perfil y lo que vale, qué aprender, cómo practicarlo con tus publicaciones reales y cómo contarlo en el CV. <span class="ac-save mono" id="ac-save" aria-live="polite"></span></p>
        </div>
        <div class="tk-head-actions"><a class="btn-secondary cp-sm" href="sistema.html" target="_blank" rel="noopener">${ic('external')}Ver la página pública</a></div>
      </header>
      <div class="tk-kpis">
        <div class="tk-kpi"><p class="tk-kpi-k">Ruta completada</p><p class="tk-kpi-v">${Math.round(st.hechas / st.tareas * 100)}<small>%</small></p><div class="tk-progress-bar"><i style="width:${st.hechas / st.tareas * 100}%"></i></div></div>
        <div class="tk-kpi"><p class="tk-kpi-k">Tareas hechas</p><p class="tk-kpi-v">${st.hechas}<small> de ${st.tareas}</small></p></div>
        <div class="tk-kpi"><p class="tk-kpi-k">Skills aplicadas</p><p class="tk-kpi-v">${st.aplicadas}<small> de ${S.data.skills.length}</small></p></div>
        <div class="tk-kpi"><p class="tk-kpi-k">Aprendiendo ahora</p><p class="tk-kpi-v">${st.aprendiendo}</p></div>
      </div>
      <nav class="tk-tabs" aria-label="Secciones de la academia">
        ${TABS.map(([id, i, t]) => `<button type="button" data-ac-tab="${id}"${S.vista === id ? ' aria-current="page"' : ''}>${ic(i)}${t}</button>`).join('')}
      </nav>
      <div id="ac-body"></div>`;
    $('ac-app').querySelector('.tk-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-ac-tab]'); if (!b) return;
      irA(b.dataset.acTab);
    });
    ({ perfil: vPerfil, negocio: vNegocio, ruta: vRuta, skills: vSkills, taller: vTaller, cv: vCV })[S.vista]?.();
  }
  function irA(vista) { S.vista = vista; lsSet('ac-vista', vista); render(); document.querySelector('.cp-main').scrollTop = 0; }

  // ═══ MI PERFIL (privado: mapa de competencias y guía de valores) ═══
  const nivelTxt = n => n >= 4.5 ? 'Tu fuerte' : n >= 4 ? 'Muy bueno' : n >= 3 ? 'Sólido' : n >= 2 ? 'En desarrollo' : 'Brecha';
  const nivelTono = n => n >= 4 ? 'accent' : n >= 3 ? 'ok' : n >= 2 ? 'warn' : 'bad';
  function vPerfil() {
    const P = S.prog.perfil, A = P.areas;
    const fuertes = A.filter(a => a.nivel >= 4).sort((a, b) => b.nivel - a.nivel);
    const brechas = A.filter(a => a.nivel <= 2).sort((a, b) => a.nivel - b.nivel);
    const vendibles = A.filter(a => a.vendible);
    const grupos = [...new Set(A.map(a => a.grupo))];
    const sk = id => S.data.skills.find(s => s.id === id);
    $('ac-body').innerHTML = `
      <p class="ac-intro">Solo lo ves vos. Tu mapa de competencias con evidencia, lo que te falta y cuánto vale cada cosa en el mercado. Editá lo que no coincida: se guarda solo.</p>
      <div class="tk-card">
        <label class="cp-field"><span>Cómo te presentás en una línea</span><textarea data-p="posicionamiento" rows="2">${esc(P.posicionamiento)}</textarea></label>
      </div>
      <div class="ac-resumen">
        <section class="tk-card"><h3 class="ac-rh">${ic('award')}Tus fuertes</h3><ul class="ac-rl">${fuertes.map(a => `<li><span>${esc(a.nombre)}</span><b class="mono">${a.nivel}</b></li>`).join('') || '<li>—</li>'}</ul></section>
        <section class="tk-card"><h3 class="ac-rh">${ic('target')}Brechas a trabajar</h3><ul class="ac-rl">${brechas.map(a => `<li><span>${esc(a.nombre)}</span><b class="mono">${a.nivel}</b></li>`).join('') || '<li>—</li>'}</ul></section>
        <section class="tk-card"><h3 class="ac-rh">${ic('briefcase')}Lo que podés vender hoy</h3><p class="ac-chips">${vendibles.map(a => `<span class="cp-tag">${esc(a.nombre)}</span>`).join('') || '—'}</p></section>
      </div>

      <h3 class="cp-subhead">Mapa de competencias</h3>
      ${grupos.map(g => `
        <section class="tk-card ac-mapa">
          <h4 class="ac-cv-h">${esc(g)}</h4>
          ${A.map((a, i) => a.grupo !== g ? '' : `
            <details class="ac-area" data-i="${i}">
              <summary>
                <span class="ac-area-name">${esc(a.nombre)}${a.vendible ? ' <span class="tk-chip" data-tono="neutral">Vendible</span>' : ''}</span>
                <span class="ac-bar" aria-hidden="true"><i style="width:${a.nivel / 5 * 100}%" data-tono="${nivelTono(a.nivel)}"></i></span>
                <span class="ac-nivel mono">${a.nivel}</span>
                <span class="tk-chip" data-tono="${nivelTono(a.nivel)}">${nivelTxt(a.nivel)}</span>
              </summary>
              <div class="ac-area-body">
                <div class="ac-form-row">
                  <label class="cp-field"><span>Nivel (0 a 5)</span><span class="tk-select"><select data-a="nivel">${[0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5].map(n => `<option value="${n}"${n === a.nivel ? ' selected' : ''}>${n}</option>`).join('')}</select></span></label>
                  <label class="cp-field"><span>Nombre</span><input data-a="nombre" value="${esc(a.nombre)}"></label>
                  <label class="cp-field"><span>Grupo</span><input data-a="grupo" value="${esc(a.grupo)}"></label>
                </div>
                <label class="cp-field"><span>Evidencia <small>(qué lo demuestra)</small></span><textarea data-a="evidencia" rows="2">${esc(a.evidencia)}</textarea></label>
                <label class="cp-field"><span>Qué te falta para subir</span><textarea data-a="falta" rows="2">${esc(a.falta)}</textarea></label>
                <label class="ac-check ac-publico"><input type="checkbox" data-a="vendible"${a.vendible ? ' checked' : ''}><span>Lo puedo vender hoy como servicio</span></label>
                <div class="ac-btns">
                  ${a.skills.map(id => sk(id) ? `<button type="button" class="ac-plink" data-ver-skill="${id}">${ic('layers')}${esc(sk(id).nombre)}</button>` : '').join('')}
                  <button type="button" class="ac-mini cp-danger" data-borrar-area="${i}" title="Eliminar esta área">${ic('trash')}</button>
                </div>
              </div>
            </details>`).join('')}
        </section>`).join('')}
      <div class="cp-actions"><button type="button" class="btn-secondary cp-sm" id="ac-add-area">${ic('plus')}Agregar área</button></div>

      <h3 class="cp-subhead">Cuánto vale: puestos</h3>
      <div class="tk-card ac-valores">${tablaValores('roles', ['puesto', 'rango', 'nota'], ['Puesto', 'Rango', 'Nota'])}</div>
      <h3 class="cp-subhead">Cuánto vale: servicios freelance</h3>
      <div class="tk-card ac-valores">${tablaValores('servicios', ['servicio', 'rango', 'entregable', 'nota'], ['Servicio', 'Rango', 'Entregable', 'Nota'])}</div>
      <div class="tk-card"><label class="cp-field"><span>Notas</span><textarea data-p="notas" rows="5">${esc(P.notas)}</textarea></label></div>`;

    const body = $('ac-body');
    body.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.p) { P[t.dataset.p] = t.value; return guardar(); }
      const area = t.closest('.ac-area');
      if (area && t.dataset.a) {
        const a = A[+area.dataset.i];
        a[t.dataset.a] = t.type === 'checkbox' ? t.checked : t.dataset.a === 'nivel' ? Number(t.value) : t.value;
        guardar();
        if (['nivel', 'vendible'].includes(t.dataset.a)) { S.abiertaArea = +area.dataset.i; render(); }
        return;
      }
      const fila = t.closest('[data-fila]');
      if (fila && t.dataset.v) { P[fila.dataset.lista][+fila.dataset.fila][t.dataset.v] = t.value; guardar(); }
    });
    body.addEventListener('click', e => {
      const s = e.target.closest('[data-ver-skill]'), b = e.target.closest('[data-borrar-area]'), bf = e.target.closest('[data-borrar-fila]'), af = e.target.closest('[data-agregar-fila]');
      if (s) verSkill(s.dataset.verSkill);
      if (b && confirm('¿Eliminar esta área del mapa?')) { A.splice(+b.dataset.borrarArea, 1); guardar(); render(); }
      if (bf) { P[bf.dataset.lista].splice(+bf.dataset.borrarFila, 1); guardar(); render(); }
      if (af) { P[af.dataset.agregarFila].push({}); guardar(); render(); }
      if (e.target.closest('#ac-add-area')) { A.push({ id: 'area-' + Date.now().toString(36), grupo: 'Otras', nombre: 'Nueva área', nivel: 2, evidencia: '', falta: '', skills: [], vendible: false }); S.abiertaArea = A.length - 1; guardar(); render(); }
    });
    if (S.abiertaArea != null) { const d = body.querySelector(`.ac-area[data-i="${S.abiertaArea}"]`); if (d) { d.open = true; d.scrollIntoView({ block: 'center' }); } S.abiertaArea = null; }
  }
  function tablaValores(lista, campos, titulos) {
    const filas = S.prog.perfil[lista];
    return `<div class="ac-vt" data-cols="${campos.length}">
      <div class="ac-vt-h">${titulos.map(t => `<span>${t}</span>`).join('')}<span></span></div>
      ${filas.map((f, i) => `<div class="ac-vt-r" data-lista="${lista}" data-fila="${i}">${campos.map((c, j) => `<textarea data-v="${c}" rows="2" aria-label="${titulos[j]}">${esc(f[c] || '')}</textarea>`).join('')}<button type="button" class="ac-mini" data-lista="${lista}" data-borrar-fila="${i}" title="Eliminar">${ic('trash')}</button></div>`).join('')}
    </div>
    <button type="button" class="btn-secondary cp-sm" data-agregar-fila="${lista}">${ic('plus')}Agregar fila</button>`;
  }

  // ═══ HOJA DE RUTA (herramientas, servicios, contenido y SaaS por etapa) ═══
  const ETAPAS = [['idea', 'Idea'], ['aprendiendo', 'Aprendiendo'], ['construyendo', 'Construyendo'], ['validando', 'Validando'], ['activo', 'Activo']];
  const TIPOS_N = { servicio: { txt: 'Servicio', tono: 'accent' }, herramienta: { txt: 'Herramienta', tono: 'ok' }, contenido: { txt: 'Contenido', tono: 'neutral' }, saas: { txt: 'SaaS', tono: 'warn' } };
  const puntaje = n => (n.valor || 0) + (n.originalidad || 0) * 0.5;
  function vNegocio() {
    const N = S.prog.negocio, filtro = S.tipoN || 'todo';
    const lista = N.filter(n => filtro === 'todo' || n.tipo === filtro);
    const orden = { construyendo: 0, validando: 1, aprendiendo: 2, idea: 3 };
    const proximos = N.filter(n => n.etapa !== 'activo' && n.siguiente).sort((a, b) => (orden[a.etapa] - orden[b.etapa]) || puntaje(b) - puntaje(a)).slice(0, 3);
    const sel = N.find(n => n.id === S.selN);
    const nombre = id => N.find(n => n.id === id)?.nombre || id;
    const card = n => `<button type="button" class="ac-nc${n.id === S.selN ? ' is-sel' : ''}" data-n="${esc(n.id)}">
        <span class="tk-chip" data-tono="${TIPOS_N[n.tipo]?.tono || 'neutral'}">${TIPOS_N[n.tipo]?.txt || n.tipo}</span>
        <strong>${esc(n.nombre)}</strong>
        <span class="ac-nc-meta mono"><span title="Valor">V ${n.valor}</span><span title="Originalidad">O ${n.originalidad}</span>${n.hoy && n.hoy !== '—' ? `<span>${esc(n.hoy)}</span>` : ''}</span>
      </button>`;
    $('ac-body').innerHTML = `
      <p class="ac-intro">Todo lo que podés construir, vender o publicar, ordenado por etapa: <b>idea → aprendiendo → construyendo → validando → activo</b>. Cada ítem tiene su precio de mercado con fuente, tu precio hoy, el próximo paso y cómo sabés que funciona. Solo lo ves vos.</p>
      <section class="tk-card ac-next">
        <h3 class="ac-rh">${ic('target')}Tus próximos pasos</h3>
        <ol>${proximos.map(n => `<li><button type="button" class="tk-linkbtn" data-n="${esc(n.id)}">${esc(n.nombre)}</button><span>${esc(n.siguiente)}</span></li>`).join('')}</ol>
      </section>
      <div class="ac-toolbar">
        <div class="tk-seg" role="group" aria-label="Filtrar por tipo">${[['todo', 'Todo'], ['servicio', 'Servicios'], ['herramienta', 'Herramientas'], ['contenido', 'Contenido'], ['saas', 'SaaS']].map(([k, t]) => `<button type="button" data-tipo-n="${k}" aria-pressed="${filtro === k}">${t} <span class="mono">${k === 'todo' ? N.length : N.filter(n => n.tipo === k).length}</span></button>`).join('')}</div>
        <button type="button" class="btn-secondary cp-sm" id="ac-add-n">${ic('plus')}Agregar</button>
      </div>
      <div class="ac-board">${ETAPAS.map(([k, t]) => {
        const col = lista.filter(n => n.etapa === k).sort((a, b) => puntaje(b) - puntaje(a));
        return `<section class="ac-col" data-etapa="${k}"><h4>${t} <span class="tk-count">${col.length}</span></h4>${col.map(card).join('') || '<p class="ac-col-empty">—</p>'}</section>`;
      }).join('')}</div>
      ${sel ? `
      <section class="tk-card ac-ndet" id="ac-ndet">
        <div class="tk-card-head"><h3>${esc(sel.nombre)}</h3><span class="ac-btns">
          <button type="button" class="ac-mini" data-mover="-1" title="Etapa anterior" aria-label="Etapa anterior" ${sel.etapa === 'idea' ? 'disabled' : ''}><span class="ac-izq">${ic('arrow-right')}</span></button>
          <button type="button" class="ac-mini" data-mover="1" title="Etapa siguiente" aria-label="Etapa siguiente" ${sel.etapa === 'activo' ? 'disabled' : ''}>${ic('arrow-right')}</button>
          <button type="button" class="ac-mini" data-cerrar-n title="Cerrar">${ic('x')}</button></span></div>
        <div class="ac-form-row">
          <label class="cp-field"><span>Nombre</span><input data-nf="nombre" value="${esc(sel.nombre)}"></label>
          <label class="cp-field"><span>Tipo</span><span class="tk-select"><select data-nf="tipo">${Object.entries(TIPOS_N).map(([k, v]) => `<option value="${k}"${sel.tipo === k ? ' selected' : ''}>${v.txt}</option>`).join('')}</select></span></label>
          <label class="cp-field"><span>Etapa</span><span class="tk-select"><select data-nf="etapa">${ETAPAS.map(([k, t]) => `<option value="${k}"${sel.etapa === k ? ' selected' : ''}>${t}</option>`).join('')}</select></span></label>
          <label class="cp-field"><span>Valor (0–10)</span><input type="number" min="0" max="10" data-nf="valor" value="${sel.valor}"></label>
          <label class="cp-field"><span>Originalidad (0–10)</span><input type="number" min="0" max="10" data-nf="originalidad" value="${sel.originalidad}"></label>
        </div>
        <div class="ac-precios">
          <label class="cp-field"><span>Qué cobra el mercado</span><textarea data-nf="mercado" rows="2">${esc(sel.mercado)}</textarea></label>
          <label class="cp-field"><span>Tu precio hoy</span><input data-nf="hoy" value="${esc(sel.hoy)}"></label>
          <label class="cp-field"><span>Con 3 a 5 casos</span><input data-nf="conCasos" value="${esc(sel.conCasos)}"></label>
        </div>
        <label class="cp-field"><span>Fuente del precio de mercado ${sel.fuente ? `<a href="${esc(sel.fuente)}" target="_blank" rel="noopener">abrir</a>` : ''}</span><input type="url" data-nf="fuente" value="${esc(sel.fuente)}" placeholder="https://…"></label>
        <label class="cp-field"><span>Próximo paso</span><textarea data-nf="siguiente" rows="2">${esc(sel.siguiente)}</textarea></label>
        <label class="cp-field"><span>Cómo sé que funciona <small>(criterio de validación)</small></span><textarea data-nf="validacion" rows="2">${esc(sel.validacion)}</textarea></label>
        <label class="cp-field"><span>Notas</span><textarea data-nf="notas" rows="3">${esc(sel.notas || '')}</textarea></label>
        ${sel.usa?.length ? `<p class="ac-chips ac-usa">Se apoya en: ${sel.usa.map(id => `<button type="button" class="ac-plink" data-n="${esc(id)}">${esc(nombre(id))}</button>`).join('')}</p>` : ''}
        <div class="cp-actions"><button type="button" class="btn-secondary cp-sm cp-danger" data-borrar-n>${ic('trash')}Eliminar</button></div>
      </section>` : ''}`;

    const body = $('ac-body');
    body.addEventListener('click', e => {
      const c = e.target.closest('[data-n]'), t = e.target.closest('[data-tipo-n]'), m = e.target.closest('[data-mover]');
      if (c) { S.selN = c.dataset.n; render(); setTimeout(() => $('ac-ndet')?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 30); return; }
      if (t) { S.tipoN = t.dataset.tipoN; render(); return; }
      if (m && sel) { const i = ETAPAS.findIndex(([k]) => k === sel.etapa) + Number(m.dataset.mover); if (ETAPAS[i]) { sel.etapa = ETAPAS[i][0]; guardar(); render(); } return; }
      if (e.target.closest('[data-cerrar-n]')) { S.selN = null; render(); return; }
      if (e.target.closest('[data-borrar-n]') && sel && confirm(`¿Eliminar «${sel.nombre}»?`)) { N.splice(N.indexOf(sel), 1); S.selN = null; guardar(); render(); return; }
      if (e.target.closest('#ac-add-n')) {
        const n = { id: 'item-' + Date.now().toString(36), tipo: S.tipoN && S.tipoN !== 'todo' ? S.tipoN : 'herramienta', nombre: 'Nueva idea', etapa: 'idea', valor: 5, originalidad: 5, mercado: '', fuente: '', hoy: '', conCasos: '', siguiente: '', validacion: '', notas: '', usa: [] };
        N.push(n); S.selN = n.id; guardar(); render(); setTimeout(() => $('ac-ndet')?.scrollIntoView({ block: 'start' }), 30);
      }
    });
    body.addEventListener('input', e => {
      const f = e.target.dataset.nf; if (!f || !sel) return;
      sel[f] = ['valor', 'originalidad'].includes(f) ? Math.min(10, Math.max(0, Number(e.target.value) || 0)) : e.target.value;
      guardar();
      if (['tipo', 'etapa'].includes(f)) render();
    });
    body.addEventListener('change', e => { if (['nombre', 'valor', 'originalidad', 'hoy'].includes(e.target.dataset.nf)) render(); });
  }

  // ═══ RUTA ═══
  function vRuta() {
    const nombre = id => S.data.skills.find(s => s.id === id)?.nombre || id;
    $('ac-body').innerHTML = `
      <p class="ac-intro">Seis semanas, una por bloque. Cada tarea con ${ic('zap')} abre el prompt ya completado con tus datos. Tildá lo que vayas haciendo: el avance se guarda solo.</p>
      <div class="ac-weeks">${S.data.plan.map(w => {
        const hechas = w.tareas.filter(t => S.prog.tareas[t.id]).length;
        return `<section class="tk-card ac-week${hechas === w.tareas.length ? ' is-done' : ''}">
          <div class="tk-card-head"><h3><span class="ac-wk mono">Semana ${w.n}</span>${esc(w.titulo)}</h3><span class="tk-count">${hechas}/${w.tareas.length}</span></div>
          <div class="tk-progress-bar"><i style="width:${hechas / w.tareas.length * 100}%"></i></div>
          <ul class="ac-tasks">${w.tareas.map(t => `
            <li>
              <label class="ac-check"><input type="checkbox" data-tarea="${t.id}"${S.prog.tareas[t.id] ? ' checked' : ''}><span>${esc(t.txt)}</span></label>
              ${t.prompt ? `<button type="button" class="ac-mini" data-abrir-prompt="${t.prompt}" data-tarea-id="${t.id}" title="Abrir el prompt">${ic('zap')}</button>` : ''}
            </li>`).join('')}</ul>
          <p class="ac-week-skills">${w.skills.map(id => `<button type="button" class="tk-chip" data-tono="neutral" data-ver-skill="${id}">${esc(nombre(id))}</button>`).join('')}</p>
        </section>`;
      }).join('')}</div>`;
    const body = $('ac-body');
    body.addEventListener('change', e => {
      const c = e.target.closest('[data-tarea]'); if (!c) return;
      if (c.checked) S.prog.tareas[c.dataset.tarea] = new Date().toISOString(); else delete S.prog.tareas[c.dataset.tarea];
      guardar(); render();
    });
    body.addEventListener('click', e => {
      const p = e.target.closest('[data-abrir-prompt]'), s = e.target.closest('[data-ver-skill]');
      if (p) abrirPrompt(p.dataset.abrirPrompt, p.dataset.tareaId);
      if (s) verSkill(s.dataset.verSkill);
    });
  }

  // ═══ SKILLS ═══
  function verSkill(id) {
    const sk = S.data.skills.find(s => s.id === id); if (!sk) return;
    S.tier = sk.tier; S.abierta = id; irA('skills');
    setTimeout(() => document.getElementById('ac-sk-' + id)?.scrollIntoView({ block: 'start' }), 30);
  }
  function vSkills() {
    const lista = S.data.skills.filter(s => S.tier === 'todas' || s.tier === S.tier);
    const est = S.data.estados;
    const tierTxt = { S: 'Tier S · Diferencian', A: 'Tier A · Suman mucho', B: 'Tier B · Complementarias', todas: 'Todas' };
    $('ac-body').innerHTML = `
      <div class="ac-toolbar">
        <div class="tk-seg" role="group" aria-label="Filtrar por nivel">${['S', 'A', 'B', 'todas'].map(t => `<button type="button" data-tier="${t}" aria-pressed="${S.tier === t}">${tierTxt[t]}</button>`).join('')}</div>
      </div>
      <div class="ac-skills">${lista.map(sk => {
        const p = skillP(sk.id), e = est[p.estado];
        return `<details class="tk-card ac-skill" id="ac-sk-${sk.id}"${S.abierta === sk.id ? ' open' : ''}>
          <summary>
            <span class="ac-tier mono" data-tier="${sk.tier}">${sk.tier}</span>
            <span class="ac-skill-name"><strong>${esc(sk.nombre)}</strong><small>${esc(sk.resumen)}</small></span>
            <span class="ac-stars" aria-label="Valor ${sk.valor} de 5">${'●'.repeat(sk.valor)}<i>${'●'.repeat(5 - sk.valor)}</i></span>
            <span class="tk-chip" data-tono="${e.tono}">${e.txt}</span>
          </summary>
          <div class="ac-skill-body">
            <div class="ac-cols">
              <div>
                <p class="ac-why"><b>Por qué importa:</b> ${esc(sk.porque)}</p>
                <h4>Conceptos clave</h4>
                <ul class="ac-list">${sk.conceptos.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
                <h4>KPIs que mueve</h4>
                <p class="ac-chips">${sk.kpis.map(k => `<span class="cp-tag">${esc(k)}</span>`).join('')}</p>
              </div>
              <div>
                <h4>Practicá</h4>
                <p class="ac-practica">${esc(sk.practica.txt)}</p>
                <p class="ac-btns">
                  ${sk.practica.vista ? `<button type="button" class="btn-secondary cp-sm" data-ir-tracker>${ic('activity')}Abrir ML Tracker</button>` : ''}
                  ${sk.lab ? `<a class="btn-secondary cp-sm" href="${sk.lab}" target="_blank" rel="noopener">${ic('book')}Guía del Lab</a>` : ''}
                </p>
                ${sk.prompts.length ? `<h4>Prompts</h4><p class="ac-btns">${sk.prompts.map(pid => `<button type="button" class="ac-plink" data-abrir-prompt="${pid}">${ic('zap')}${esc(S.data.prompts.find(x => x.id === pid)?.titulo || pid)}</button>`).join('')}</p>` : ''}
                ${sk.claude.length ? `<h4>Skills de Claude Code</h4><ul class="ac-claude">${sk.claude.map(c => `<li><code>${esc(c)}</code>${INSTALADAS.has(c) ? '<span class="tk-chip" data-tono="ok">Ya instalada</span>' : `<button type="button" class="ac-mini" data-copiar="cp -r ${SKILLS_DIR}/${c} ~/.claude/skills/" title="Copiar el comando para instalarla">${ic('copy')}</button>`}</li>`).join('')}</ul>` : ''}
              </div>
            </div>
            <div class="ac-form" data-skill="${sk.id}">
              <div class="ac-form-row">
                <label class="cp-field"><span>Estado</span>
                  <span class="tk-select"><select data-f="estado">${Object.entries(est).map(([k, v]) => `<option value="${k}"${p.estado === k ? ' selected' : ''}>${v.txt}</option>`).join('')}</select></span>
                </label>
                ${sk.campos.map(c => `<label class="cp-field"><span>${CAMPOS[c] || c}</span><input data-campo="${c}" value="${esc(p.campos?.[c] || '')}" placeholder="${c === 'pct' ? '12%' : c === 'antes' || c === 'despues' ? 'ej. 18%' : ''}"></label>`).join('')}
              </div>
              <p class="ac-cv-prev"><b>En el CV:</b> ${cvLinea(sk, p, true)}</p>
              <label class="cp-field"><span>Notas <small>(qué aprendiste, links, dudas)</small></span><textarea data-f="notas" rows="2">${esc(p.notas)}</textarea></label>
              <label class="ac-check ac-publico"><input type="checkbox" data-f="publico"${p.publico ? ' checked' : ''}><span>Mostrar esta skill y su logro en la página pública <small>(se ve el estado; el logro, cuando cargues todos los números)</small></span></label>
            </div>
          </div>
        </details>`;
      }).join('')}</div>
      <h3 class="cp-subhead">Descartadas para este rol</h3>
      <ul class="ac-descartadas">${S.data.descartadas.map(d => `<li><code>${esc(d.nombre)}</code><span>${esc(d.motivo)}</span></li>`).join('')}</ul>`;

    const body = $('ac-body');
    body.querySelector('.tk-seg').addEventListener('click', e => {
      const b = e.target.closest('[data-tier]'); if (!b) return;
      S.tier = b.dataset.tier; render();
    });
    body.addEventListener('toggle', e => { if (e.target.matches('.ac-skill') && e.target.open) S.abierta = e.target.id.slice(6); }, true);
    body.addEventListener('input', e => {
      const f = e.target.closest('.ac-form'); if (!f) return;
      const sk = S.data.skills.find(s => s.id === f.dataset.skill), p = skillP(sk.id);
      if (e.target.dataset.campo) p.campos[e.target.dataset.campo] = e.target.value.trim();
      else if (e.target.dataset.f === 'publico') p.publico = e.target.checked;
      else if (e.target.dataset.f) p[e.target.dataset.f] = e.target.value;
      f.querySelector('.ac-cv-prev').innerHTML = `<b>En el CV:</b> ${cvLinea(sk, p, true)}`;
      if (e.target.dataset.f === 'estado') {
        const chip = f.closest('.ac-skill').querySelector('summary .tk-chip'), es = S.data.estados[p.estado];
        chip.dataset.tono = es.tono; chip.textContent = es.txt;
      }
      guardar();
    });
    body.addEventListener('click', e => {
      const pr = e.target.closest('[data-abrir-prompt]'), cp = e.target.closest('[data-copiar]');
      if (pr) abrirPrompt(pr.dataset.abrirPrompt);
      if (cp) copiar(cp.dataset.copiar, 'Comando copiado: pegalo en la terminal');
      if (e.target.closest('[data-ir-tracker]')) document.querySelector('.cp-nav a[data-s="tracker"]')?.click();
    });
  }

  // Viñeta de CV con los logros cargados; lo que falta queda marcado entre corchetes
  function cvLinea(sk, p, html = false) {
    return sk.cv.split(/(\{\w+\})/).map(parte => {
      const m = parte.match(/^\{(\w+)\}$/);
      if (!m) return html ? esc(parte) : parte;
      const v = p.campos?.[m[1]], lbl = CAMPOS[m[1]] || m[1];
      if (v) return html ? `<mark>${esc(v)}</mark>` : v;
      return html ? `<span class="ac-falta">[${esc(lbl)}]</span>` : `[${lbl}]`;
    }).join('');
  }

  // ═══ TALLER DE PROMPTS ═══
  function abrirPrompt(id, tarea = null) { S.prompt = id; S.desdeTarea = tarea; lsSet('ac-prompt', id); irA('taller'); }

  async function asegurarCuentas() {
    if (S.cuentas) return;
    try { S.cuentas = (await api('/api/tracker?action=cuentas')).cuentas.filter(c => c.status === 'ok' || c.demo); }
    catch (e) { S.cuentas = [{ id: 'demo', nickname: 'Cuenta demo', demo: true }]; }
    if (!S.cuentas.some(c => c.id === S.cuenta)) S.cuenta = S.cuentas.find(c => !c.demo)?.id || 'demo';
  }
  async function asegurarDatos() {
    if (S.datos[S.cuenta]) return S.datos[S.cuenta];
    S.datos[S.cuenta] = await api('/api/tracker?action=cuenta&id=' + encodeURIComponent(S.cuenta));
    return S.datos[S.cuenta];
  }

  async function vTaller() {
    const P = S.data.prompts, pr = P.find(p => p.id === S.prompt) || P[0];
    const cats = [...new Set(P.map(p => p.cat))];
    const q = S.q.toLowerCase();
    $('ac-body').innerHTML = `
      <div class="ac-taller">
        <aside class="ac-plist">
          <label class="ac-search">${ic('search')}<input type="search" id="ac-q" placeholder="Buscar prompt…" value="${esc(S.q)}" aria-label="Buscar prompt"></label>
          ${cats.map(c => {
            const ps = P.filter(p => p.cat === c && (!q || (p.titulo + ' ' + p.desc).toLowerCase().includes(q)));
            return ps.length ? `<p class="ac-pcat mono">${esc(c)}</p>${ps.map(p => `<button type="button" data-prompt="${p.id}"${p.id === pr.id ? ' aria-current="true"' : ''}><span>${esc(p.titulo)}</span><small>${p.alcance === 'publicacion' ? 'Con una publicación' : p.alcance === 'cuenta' ? 'Con la cuenta' : 'Libre'}</small></button>`).join('')}` : '';
          }).join('')}
        </aside>
        <div class="ac-pmain" id="ac-pmain"><p class="cp-empty">Cargando…</p></div>
      </div>`;
    $('ac-q').addEventListener('input', e => {
      S.q = e.target.value; const pos = e.target.selectionStart;
      vTaller().then(() => { const i = $('ac-q'); i.focus(); i.setSelectionRange(pos, pos); });
    });
    $('ac-body').querySelector('.ac-plist').addEventListener('click', e => {
      const b = e.target.closest('[data-prompt]'); if (!b) return;
      S.prompt = b.dataset.prompt; S.desdeTarea = null; lsSet('ac-prompt', S.prompt); vTaller();
    });
    await vPrompt(pr);
  }

  async function vPrompt(pr) {
    const main = $('ac-pmain');
    let datos = null, errDatos = null;
    if (pr.alcance !== 'libre') {
      try { await asegurarCuentas(); datos = await asegurarDatos(); } catch (e) { errDatos = e.message; }
    }
    const items = datos ? [...datos.items].sort((a, b) => b.actual.facturacion - a.actual.facturacion || b.actual.visitas - a.actual.visitas) : [];
    if (pr.alcance === 'publicacion' && items.length && !items.some(i => i.id === S.item)) S.item = items[0].id;
    const vars = [...new Set([...pr.texto.matchAll(/\[([A-Z][A-Z0-9_]{2,})\]/g)].map(m => m[1]))];
    const cuentaSel = S.cuentas?.find(c => c.id === S.cuenta);
    const skill = S.data.skills.find(s => s.id === pr.skill);
    const tarea = S.desdeTarea && S.data.plan.flatMap(w => w.tareas).find(t => t.id === S.desdeTarea);

    main.innerHTML = `
      <div class="tk-card">
        <div class="ac-phead">
          <div><h3>${esc(pr.titulo)}</h3><p class="ac-pmeta">${esc(pr.cat)}${skill ? ' · ' + esc(skill.nombre) : ''}</p><p class="tk-sub">${esc(pr.desc)}</p></div>
        </div>
        ${pr.alcance !== 'libre' ? `
          <div class="ac-src">
            ${errDatos ? `<div class="tk-demo is-bad">${ic('alert')}<span>No pude leer los datos del Tracker (${esc(errDatos)}). El prompt queda con el lugar para pegar los datos a mano.</span></div>` : `
            <label class="cp-field"><span>Cuenta</span><span class="tk-select"><select id="ac-cuenta">${S.cuentas.map(c => `<option value="${esc(c.id)}"${c.id === S.cuenta ? ' selected' : ''}>${esc(c.nickname)}${c.demo ? ' (datos simulados)' : ''}</option>`).join('')}</select></span></label>
            ${pr.alcance === 'publicacion' ? `
              <label class="cp-field ac-src-item"><span>Publicación</span><span class="tk-select"><select id="ac-item">${items.map(i => `<option value="${esc(i.id)}"${i.id === S.item ? ' selected' : ''}>${esc(i.title.slice(0, 70))} · ${plata(i.price)}</option>`).join('')}</select></span></label>
              <div class="cp-field ac-src-btn"><span>Atributos de la categoría</span><button type="button" class="btn-secondary" id="ac-ficha">${ic('database')}${S.ficha[S.cuenta + S.item] ? 'Atributos incluidos' : 'Traer de Mercado Libre'}</button></div>` : ''}`}
          </div>
          ${cuentaSel?.demo ? `<p class="ac-note">${ic('flask')}Cuenta demo: datos simulados para practicar. Elegí tu cuenta real para trabajar con datos verdaderos.</p>` : ''}` : ''}
        ${vars.length ? `<div class="ac-vars">${vars.map(v => {
          const val = S.vars[v] ?? (v === 'TIENDA' ? cuentaSel?.nickname || '' : DEFAULTS[v] || '');
          const largo = /PEGAR|PAYLOAD|LISTA|REPORTES/.test(v);
          return `<label class="cp-field"><span>${esc(v.replace(/_/g, ' ').toLowerCase())}</span>${largo ? `<textarea data-var="${v}" rows="3">${esc(val)}</textarea>` : `<input data-var="${v}" value="${esc(val)}">`}</label>`;
        }).join('')}</div>` : ''}
        <label class="cp-field ac-out-lbl"><span>Prompt listo <small>(podés editarlo antes de copiar)</small></span><textarea id="ac-out" class="ac-out" rows="18" spellcheck="false"></textarea></label>
        <div class="cp-actions">
          <button type="button" class="btn-primary" id="ac-copy">${ic('copy')}Copiar prompt</button>
          <button type="button" class="btn-secondary" id="ac-claude">${ic('external')}Copiar y abrir Claude</button>
          ${tarea ? `<button type="button" class="btn-secondary" id="ac-tarea"${S.prog.tareas[tarea.id] ? ' disabled' : ''}>${ic('check')}${S.prog.tareas[tarea.id] ? 'Tarea hecha' : 'Marcar tarea como hecha'}</button>` : ''}
          <span class="cp-status mono" id="ac-len"></span>
        </div>
      </div>`;

    const armar = () => {
      let txt = pr.texto.replace(/\[([A-Z][A-Z0-9_]{2,})\]/g, (m, v) => (S.vars[v] ?? (v === 'TIENDA' ? cuentaSel?.nickname : DEFAULTS[v])) || m);
      if (txt.includes('{{DATOS}}')) {
        let bloque = '[PEGÁ ACÁ LOS DATOS]';
        if (datos && pr.alcance === 'publicacion') { const it = datos.items.find(i => i.id === S.item); if (it) bloque = datosPublicacion(it, datos, S.ficha[S.cuenta + S.item]); }
        if (datos && pr.alcance === 'cuenta') bloque = datosCuenta(datos, cuentaSel, pr.id === 'preventa');
        txt = txt.replace('{{DATOS}}', bloque);
      }
      $('ac-out').value = txt;
      $('ac-len').textContent = `${txt.length.toLocaleString('es-AR')} caracteres`;
    };
    armar();

    main.oninput = e => {
      const v = e.target.dataset.var; if (!v) return;
      S.vars[v] = e.target.value; lsSet('ac-vars', S.vars); armar();
    };
    $('ac-cuenta')?.addEventListener('change', e => { S.cuenta = e.target.value; S.item = null; vPrompt(pr); });
    $('ac-item')?.addEventListener('change', e => { S.item = e.target.value; vPrompt(pr); });
    $('ac-ficha')?.addEventListener('click', async e => {
      const b = e.currentTarget, k = S.cuenta + S.item;
      if (S.ficha[k]) return;
      b.disabled = true; b.lastChild.textContent = 'Consultando Mercado Libre…';
      try {
        S.ficha[k] = await api(`/api/tracker?action=ficha&cuenta=${encodeURIComponent(S.cuenta)}&id=${encodeURIComponent(S.item)}`);
        b.lastChild.textContent = 'Atributos incluidos'; armar(); toast('Atributos agregados al prompt');
      } catch (err) { b.disabled = false; b.lastChild.textContent = 'Traer de Mercado Libre'; toast(err.message, true); }
    });
    $('ac-copy').addEventListener('click', () => copiar($('ac-out').value, 'Prompt copiado'));
    $('ac-claude').addEventListener('click', async () => {
      await copiar($('ac-out').value, 'Prompt copiado: pegalo en Claude');
      window.open('https://claude.ai/new', '_blank', 'noopener');
    });
    $('ac-tarea')?.addEventListener('click', e => {
      S.prog.tareas[tarea.id] = new Date().toISOString(); guardar();
      e.currentTarget.disabled = true; e.currentTarget.lastChild.textContent = 'Tarea hecha';
    });
  }

  // ── Bloques de datos que se pegan en el prompt ──
  function datosPublicacion(it, d, ficha) {
    const r = it.rentabilidad, c = it.catalogo, cal = it.calidad;
    const L = [
      `Publicación: ${it.title} (${it.id})`,
      it.permalink ? `Link: ${it.permalink}` : null,
      `Site: MLA · Estado: ${it.status}${it.catalog_listing ? ' · Publicación de catálogo' : ''}${it.logistica ? ' · Logística: ' + it.logistica : ''}`,
      `Precio: ${plata(it.price)} · Stock: ${it.stock == null ? 'FALTA_DATO' : num(it.stock) + ' u.'}${it.diasStock != null ? ` (cobertura ${Math.round(it.diasStock)} días al ritmo actual)` : ''}`,
      '',
      `Rendimiento de los últimos ${d.ventana} días (vs. los ${d.ventana} anteriores):`,
      `- Visitas: ${num(it.actual.visitas)} (${var_(it.cambio.visitas)})`,
      `- Unidades vendidas: ${num(it.actual.unidades)} (${var_(it.cambio.unidades)})`,
      `- Conversión: ${pct(it.actual.conversion, 2)} (mediana de la cuenta: ${pct(d.resumen.conversionMediana, 2)})`,
      `- Facturación: ${plata(it.actual.facturacion)}${it.abc ? ` · Curva ABC: ${it.abc}${it.participacion ? ` (${pct(it.participacion)} de la facturación)` : ''}` : ''}`,
      `- Clasificación del Tracker: ${d.clases?.[it.clase]?.txt || it.clase}`,
      '',
      'Rentabilidad por unidad:',
      r ? [
        `- Comisión: ${r.comisionPct != null ? r.comisionPct + '%' : 'FALTA_DATO'} (${plata(r.comision)})`,
        `- Envío a cargo del vendedor: ${r.envio == null ? 'FALTA_DATO' : plata(r.envio)}`,
        `- Impuestos: ${r.impuestosPct}% (${plata(r.impuestos)})`,
        `- Costo del producto: ${r.costo == null ? 'FALTA_DATO' : plata(r.costo)}`,
        r.completo ? `- Margen de contribución: ${plata(r.margen)} (${pct(r.margenPct)}) · Precio de equilibrio: ${plata(r.precioEquilibrio)} · ACOS de equilibrio: ${pct(r.acosEquilibrio)}` : '- Margen: FALTA_DATO (falta el costo o el envío)',
      ].join('\n') : '- FALTA_DATO',
      c ? `\nCatálogo: estado ${c.status || 'desconocido'}${c.price_to_win ? ` · price-to-win ${plata(c.price_to_win)}` : ''}${c.visit_share ? ` · participación de visitas: ${c.visit_share}` : ''}` : null,
      cal ? `\nCalidad según Mercado Libre: ${cal.score}/100 (${cal.nivel})${cal.faltan?.length ? '\nMejoras pendientes:\n' + cal.faltan.slice(0, 12).map(f => `- [${f.grupo}] ${f.titulo}${f.detalle?.length ? ': ' + f.detalle.join('; ') : ''}`).join('\n') : ''}` : null,
      it.diagnostico?.length ? '\nDiagnóstico del Tracker:\n' + it.diagnostico.map(x => `- ${x.titulo}. ${x.texto}`).join('\n') : null,
      it.precio ? `\nRecomendación de precio del Tracker: ${ACCION[it.precio.accion] || it.precio.accion}${it.precio.sugerido ? ' a ' + plata(it.precio.sugerido) : ''}. ${(it.precio.motivos || []).join(' ')}` : null,
    ];
    if (ficha) {
      L.push('', 'Ficha en Mercado Libre:',
        `- Categoría: ${ficha.categoria.ruta || ficha.categoria.nombre || ''} (${ficha.categoria.id})`,
        `- Condición: ${ficha.condicion || 'FALTA_DATO'} · Tipo: ${ficha.tipo || '—'} · Garantía: ${ficha.garantia || 'FALTA_DATO'}`,
        `- Fotos: ${ficha.fotos} · Variaciones: ${ficha.variaciones} · Descripción: ${ficha.descripcionLargo ? ficha.descripcionLargo + ' caracteres' : 'vacía'}`,
        `- Atributos cargados:\n${ficha.atributos.map(a => `  · ${a.nombre} (${a.id}): ${a.valor}`).join('\n') || '  (ninguno)'}`,
        `- Atributos de la categoría sin completar:\n${ficha.faltantes.map(a => `  · ${a.nombre} (${a.id}) — ${a.tipo}`).join('\n') || '  (ninguno)'}`);
    } else if (/auditor|atributos|titulos/.test(S.prompt)) {
      L.push('', 'Atributos: FALTA_DATO (no se trajeron los atributos de la categoría).');
    }
    L.push('', `Fuente: ML Tracker (API de Mercado Libre), datos al ${d.hasta}${d.demo ? ' — CUENTA DEMO CON DATOS SIMULADOS' : ''}.`);
    return L.filter(x => x != null).join('\n');
  }

  function datosCuenta(d, cuenta, conPreguntas) {
    const R = d.resumen, a = R.actual, b = R.anterior;
    const top = [...d.items].sort((x, y) => y.actual.facturacion - x.actual.facturacion || y.actual.visitas - x.actual.visitas).slice(0, 25);
    const L = [
      `Cuenta: ${cuenta?.nickname || d.cuenta || ''} · Site MLA · Moneda ARS`,
      `Período: ${d.ventana} días hasta el ${d.hasta}, comparado con los ${d.ventana} días anteriores.`,
      '',
      'Totales de la cuenta:',
      `- Visitas: ${num(a.visitas)} (${var_(b.visitas ? a.visitas / b.visitas - 1 : null)})`,
      `- Unidades: ${num(a.unidades)} (${var_(b.unidades ? a.unidades / b.unidades - 1 : null)})`,
      `- Facturación: ${plata(a.facturacion)} (${var_(b.facturacion ? a.facturacion / b.facturacion - 1 : null)})`,
      `- Conversión: ${pct(a.conversion, 2)} (mediana por publicación: ${pct(R.conversionMediana, 2)})`,
      `- Publicaciones: ${R.publicaciones} · ${Object.entries(R.conteo).map(([k, v]) => `${d.clases?.[k]?.txt || k}: ${v}`).join(', ')}`,
      `- Curva ABC: A ${R.abc.A}, B ${R.abc.B}, C ${R.abc.C}`,
      `- Rentabilidad: ${R.rentabilidad.conCosto} publicaciones con costo cargado, ${R.rentabilidad.sinCosto} sin costo (FALTA_DATO), ${R.rentabilidad.perdiendo} venden a pérdida${R.rentabilidad.ganancia != null ? `, contribución del período ${plata(R.rentabilidad.ganancia)}` : ''}`,
      R.calidadPromedio != null ? `- Calidad promedio según ML: ${R.calidadPromedio}/100` : null,
      '',
      d.alertas.length ? 'Alertas del Tracker:\n' + d.alertas.slice(0, 12).map(x => `- ${x.txt}`).join('\n') : 'Alertas del Tracker: ninguna',
      '',
      `Publicaciones (top ${top.length} por facturación):`,
      'id | título | precio | stock | días de cobertura | visitas | ventas | conversión | clase | margen | acción de precio',
      ...top.map(i => [i.id, i.title.slice(0, 50), plata(i.price), i.stock ?? '—', i.diasStock != null ? Math.round(i.diasStock) : i.stock === 0 ? 0 : 'SIN_ROTACION', num(i.actual.visitas), num(i.actual.unidades), pct(i.actual.conversion, 2), d.clases?.[i.clase]?.txt || i.clase, i.rentabilidad?.completo ? pct(i.rentabilidad.margenPct) : 'FALTA_DATO', ACCION[i.precio?.accion] || i.precio?.accion || '—'].join(' | ')),
    ];
    const qs = d.preguntas || [];
    if (qs.length) {
      L.push('', `Preguntas sin responder: ${qs.length}`);
      if (conPreguntas) L.push(...qs.slice(0, 15).map(q => `- [${q.id}] «${q.titulo}» (hace ${q.horas ?? '?'} h): ${q.texto}`));
    }
    L.push('', `Fuente: ML Tracker (API de Mercado Libre)${d.demo ? ' — CUENTA DEMO CON DATOS SIMULADOS' : ''}.`);
    return L.filter(x => x != null).join('\n');
  }

  // ═══ CV ═══
  function vCV() {
    const listas = S.data.skills.filter(s => ['aplicada', 'dominada'].includes(skillP(s.id).estado));
    const aprendiendo = S.data.skills.filter(s => skillP(s.id).estado === 'aprendiendo');
    const vinetas = listas.map(s => cvLinea(s, skillP(s.id)));
    const faltan = vinetas.filter(v => /\[[^\]]+\]/.test(v)).length;
    const grupos = [
      ['Mercado Libre', ['publicaciones', 'pricing', 'ads', 'promociones', 'voc', 'carga-masiva']],
      ['Análisis', ['rentabilidad', 'stock', 'reporting', 'mercado', 'conciliacion']],
      ['IA aplicada', ['mcp', 'automatizacion', 'imagenes', 'estrategia', 'sourcing']],
    ].map(([g, ids]) => [g, listas.filter(s => ids.includes(s.id)).map(s => s.nombre)]).filter(([, n]) => n.length);
    const perfil = listas.length
      ? `Analista de Mercado Libre orientado a rentabilidad. Foco en ${listas.slice(0, 3).map(s => s.nombre).join(', ').replace(/, ([^,]*)$/, ' y $1')}. Uso IA (Claude + API de Mercado Libre) con control de calidad: ningún dato inventado, cambios con piloto y rollback.`
      : '';
    const texto = [perfil && `PERFIL\n${perfil}`, grupos.length && `HABILIDADES\n${grupos.map(([g, n]) => `${g}: ${n.join(' · ')}`).join('\n')}`, vinetas.length && `LOGROS\n${vinetas.map(v => '• ' + v).join('\n')}`].filter(Boolean).join('\n\n');

    $('ac-body').innerHTML = !listas.length ? `
      <div class="tk-card ac-empty-cv">
        ${ic('briefcase')}
        <h3>Todavía no hay skills aplicadas</h3>
        <p>El CV se arma solo con lo que ya practicaste. En <b>Skills</b>, pasá una skill a «Aplicada» o «Dominada» y cargá el número que lograste: acá aparece la viñeta lista para pegar.</p>
        ${aprendiendo.length ? `<p class="tk-sub">Estás aprendiendo: ${aprendiendo.map(s => esc(s.nombre)).join(', ')}.</p>` : ''}
        <button type="button" class="btn-primary" data-ir-skills>${ic('layers')}Ir a Skills</button>
      </div>` : `
      ${faltan ? `<div class="tk-demo">${ic('alert')}<span>${faltan} ${faltan === 1 ? 'viñeta tiene' : 'viñetas tienen'} datos sin completar (entre corchetes). Cargalos en <button type="button" class="tk-linkbtn" data-ir-skills>Skills</button> con números reales antes de usarlas.</span></div>` : ''}
      <div class="tk-card">
        <div class="tk-card-head"><h3>Texto para el CV</h3><button type="button" class="btn-primary cp-sm" id="ac-cv-copy">${ic('copy')}Copiar todo</button></div>
        ${perfil ? `<h4 class="ac-cv-h">Perfil</h4><p class="ac-cv-p">${esc(perfil)}</p>` : ''}
        <h4 class="ac-cv-h">Habilidades</h4>
        <dl class="ac-cv-dl">${grupos.map(([g, n]) => `<dt>${g}</dt><dd>${n.map(esc).join(' · ')}</dd>`).join('')}</dl>
        <h4 class="ac-cv-h">Logros</h4>
        <ul class="ac-list ac-cv-list">${listas.map(s => `<li><span>${cvLinea(s, skillP(s.id), true)}</span> <button type="button" class="ac-mini" data-copiar-v="${esc(cvLinea(s, skillP(s.id)))}" title="Copiar esta viñeta">${ic('copy')}</button></li>`).join('')}</ul>
      </div>
      <p class="ac-note">${ic('bulb')}Usá solo viñetas con números que puedas defender en una entrevista. Mejor tres logros reales que diez genéricos.</p>`;
    $('ac-body').addEventListener('click', e => {
      if (e.target.closest('[data-ir-skills]')) irA('skills');
      if (e.target.closest('#ac-cv-copy')) copiar(texto, 'Texto del CV copiado');
      const v = e.target.closest('[data-copiar-v]'); if (v) copiar(v.dataset.copiarV, 'Viñeta copiada');
    });
  }

  window.DCAcademia = { abrir };
})();
