// js/herr.js — Herramientas: vitrina por estado. Cada herramienta trae una demo chica que se prueba ahí mismo
// y un botón a la versión completa, a una muestra o a "avisame cuando esté".
import { esc } from './exp-data.js';

const ETAPAS = { funciona: 'Funcionando', prueba: 'Probando', diseno: 'Diseñando', idea: 'En idea' };
const PASOS = ['Idea', 'Diseño', 'Construcción', 'Prueba', 'Funcionando'];
const NIVEL = { idea: 0, diseno: 1, prueba: 3, funciona: 4 };
const contacto = a => `contacto.html?asunto=${a}`;

const H = [
  { id: 'tracker', q: '¿Por qué cayeron tus ventas?', imp: ['10 tipos de problema', 'API oficial de Mercado Libre', 'Se actualiza todos los días'], e: 'funciona', n: 'ML Tracker', v: 'Te dice qué publicación se cae, por qué y qué hacer', p: 'Vendedores y empresas', cta: [['Abrir la demo completa', 'sistema.html#demo']] },
  { id: 'auditoria', q: '¿Dónde se te escapa la plata?', imp: ['Gratis', 'En minutos', 'Salud en 6 áreas'], e: 'funciona', n: 'Auditoría de cuenta', v: 'La salud de tu cuenta por área y lo que más plata te cuesta', p: 'Vendedores', cta: [['Auditar mi cuenta gratis', 'sistema.html#auditar']] },
  { id: 'chequeo', q: '¿Tu publicación está bien armada?', imp: ['Cualquier publicación', 'Sin conectar la cuenta', '5 por día'], e: 'funciona', n: 'Chequeo de publicación', v: 'Pegás un link y ves lo que le falta a la publicación', p: 'Vendedores', cta: [['Auditoría completa de la cuenta', 'sistema.html#auditar']] },
  { id: 'simulador', q: '¿Qué le falta a tu publicación?', imp: ['7 criterios', 'Al instante'], e: 'funciona', n: 'Simulador de puntaje', v: 'El criterio con el que reviso una publicación, para mover', p: 'Vendedores', cta: [['Revisar mi publicación real', 'sistema.html#auditar']] },
  { id: 'diagnostico', q: '¿Qué le pasa a tu cuenta?', imp: ['10 problemas típicos', 'Cómo se detecta', 'Qué hacer'], e: 'funciona', n: 'Catálogo de diagnóstico', v: 'Cómo se detecta cada problema típico y qué hacer', p: 'Vendedores y empresas', cta: [['Ver los 10 problemas', 'sistema.html#diagnostico']] },
  { id: 'opiniones', q: '¿Qué odian los compradores de tu rubro?', imp: ['Hasta 200 opiniones', 'Tuyas o de la competencia'], e: 'funciona', n: 'Minero de opiniones', v: 'Qué critican y qué elogian los compradores, en segundos', p: 'Vendedores', cta: [['Analizar mi producto', contacto('opiniones')]], nota: 'Es de uso interno: con tu producto lo corro yo.' },
  { id: 'tendencias', q: '¿Qué está por venderse?', imp: ['Por categoría', 'Datos reales de Mercado Libre'], e: 'funciona', n: 'Buscador de tendencias', v: 'Las búsquedas que más crecen en cada categoría', p: 'Vendedores', cta: [['Buscar tendencias ahora', 'sistema.html#tendencias'], ['Pedir la lista completa', contacto('tendencias')]] },
  { id: 'importacion', q: '¿Te conviene importarlo?', imp: ['Costo por unidad', 'Margen y precio mínimo'], e: 'funciona', n: 'Calculadora de importación', v: 'Cuánto te cuesta un producto importado puesto en tu depósito', p: 'Vendedores', cta: [['Abrir la calculadora completa', 'importar.html'], ['Analizarlo con vos', contacto('importacion')]] },
  { id: 'competencia', q: '¿Qué está haciendo tu competencia?', imp: ['Saltos de vendidos', 'Cambios de precio', 'Ventas estimadas con rango'], e: 'diseno', n: 'Alertas de competencia', v: 'Te avisa cuando un competidor salta de ventas o cambia el precio', p: 'Vendedores', cta: [['Avisame cuando esté', contacto('competencia')]] },
  { id: 'radar', q: '¿Qué va a pegar antes que el resto?', imp: ['Mercado Libre y afuera'], e: 'diseno', n: 'Radar de demanda', v: 'Productos que empiezan a crecer, antes que el resto', p: 'Vendedores', cta: [['Avisame cuando esté', contacto('radar')]] },
  { id: 'informe', q: '¿Qué recibís con la auditoría?', imp: ['10 problemas ordenados', 'Plan de acción'], e: 'funciona', n: 'Informe de muestra', v: 'Así se ve la auditoría completa que te entrego', p: 'Vendedores', cta: [['Ver el informe de muestra', 'informe-muestra.html'], ['Quiero el mío', 'sistema.html#auditar']] },
  { id: 'perdida', q: '¿Cuánto gastás de más en publicidad?', imp: ['En pesos por mes', 'Caso real: ACOS 30% → 12%'], e: 'funciona', n: '¿Cuánta plata estás perdiendo?', v: 'Lo que se va en publicidad de más, en pesos por mes', p: 'Vendedores', cta: [['Abrir la calculadora completa', 'perdida.html'], ['Quiero bajarlo', contacto('acos')]] },
  { id: 'desarmes', q: '¿Por qué no vende esa publicación?', imp: ['Casos reales', 'Antes y después'], e: 'idea', n: 'Desarmes de publicaciones', v: 'Una publicación real, desarmada: qué falla y cómo lo arreglo', p: 'Vendedores y empresas', cta: [['Desarmá la mía', contacto('desarme')]] },
  { id: 'mail', q: '¿Querés enterarte primero?', imp: ['Cada lunes', 'Un mail corto'], e: 'idea', n: 'Radar semanal por mail', v: 'Las tendencias que más crecieron, cada lunes en tu correo', p: 'Vendedores', cta: [['Quiero recibirlo', contacto('radar-mail')]] },
];

const ICON = {
  tracker: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  auditoria: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  chequeo: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  simulador: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  diagnostico: '<path d="M9 3h6v4H9zM5 7h14v14H5z"/><path d="M9 12h6M9 16h4"/>',
  opiniones: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/>',
  tendencias: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  importacion: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  competencia: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',
  perdida: '<path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4s-5 1-5 3.2S9 10 12 11s5 1.6 5 3.8S14.8 20 12 20s-5-.8-5-2.8"/>',
  informe: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  desarmes: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
};
const svg = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[id]}</svg>`;
const $ = id => document.getElementById(id);
const num = x => Math.round(x).toLocaleString('es-AR');
const plata = x => '$' + num(x);
const ic = e => ({
  funciona: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4" fill="currentColor"/></svg>',
  prueba: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3a5 5 0 0 1 0 10z" fill="currentColor"/></svg>',
  diseno: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3a5 5 0 0 1 5 5H8z" fill="currentColor"/></svg>',
  idea: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.6 2.2"/></svg>',
}[e]);
const ejemplo = t => `<p class="hd-tag">${esc(t)}</p>`;

// ── Demos: cada una devuelve su HTML y, si hace falta, engancha su lógica ──
let DEMO = null, DIAG = null;
const pDemo = fetch('/api/tracker?action=demo').then(r => r.ok ? r.json() : null).then(d => (DEMO = d)).catch(() => null);
const pDiag = fetch('data/ia-meli.json').then(r => r.json()).then(d => (DIAG = d.diagnostico)).catch(() => null);

const RESEÑAS = ['La canasta es muy chica, entran papas para una sola persona.', 'A los dos meses se empezó a pelar el antiadherente. Mala calidad.', 'Muy ruidosa y el olor a plástico no se va.', 'Cocina bien pero es chica para una familia.', 'Dejó de funcionar al mes y la garantía no respondió.', 'Buen precio, cumple.', 'Difícil de limpiar, la grasa queda pegada.', 'Llegó rápido y funciona bien.', 'Chica, para dos personas no alcanza. El antiadherente se raya.', 'El panel es confuso y el manual viene en inglés.', 'Buena por el precio.', 'Se peló el recubrimiento, no la recomiendo.'];
const TEMAS = [['Tamaño', /chic|alcanza|entran/i, -1], ['Antiadherente', /antiadherente|pel|recubrimiento|raya/i, -1], ['Ruido y olor', /ruidos|olor/i, -1], ['Limpieza', /limpiar|grasa/i, -1], ['Garantía y durabilidad', /garant|dejó de funcionar/i, -1], ['Instrucciones', /manual|confuso/i, -1], ['Precio', /precio/i, 1], ['Envío', /llegó rápido/i, 1]];

const DEMOS = {
  tracker: {
    html: () => {
      if (!DEMO) return '<div class="hd-load" aria-busy="true"><span></span><span></span><span></span></div>';
      const a = DEMO.resumen.actual;
      return `${ejemplo('En vivo · cuenta de ejemplo')}
        <dl class="hd-kpis"><div><dt>Ventas 28 días</dt><dd>${num(a.unidades)}</dd></div><div><dt>Conversión</dt><dd>${(a.conversion * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</dd></div><div><dt>Alertas</dt><dd>${DEMO.alertas.length}</dd></div></dl>
        <p class="hd-hint">Tocá una alerta para ver qué recomienda:</p>
        <ul class="hd-alerts">${DEMO.alertas.slice(0, 4).map(x => `<li><button type="button" data-item="${esc(x.id || '')}">${esc(x.txt)}</button></li>`).join('')}</ul>
        <div class="hd-out" id="hd-out" aria-live="polite"></div>`;
    },
    init: el => el.addEventListener('click', e => {
      const b = e.target.closest('[data-item]'); if (!b) return;
      el.querySelectorAll('[data-item]').forEach(x => x.classList.toggle('is-on', x === b));
      const it = DEMO.items.find(i => i.id === b.dataset.item), d = it?.diagnostico?.[0];
      $('hd-out').innerHTML = d ? `<b>${esc(d.titulo)}</b><p>${esc(d.texto)}</p>` : '<p>Esta alerta se resuelve reponiendo stock o revisando el precio del catálogo.</p>';
    }),
  },
  auditoria: {
    html: () => `${ejemplo('Resultado de una cuenta de ejemplo')}
      <div class="hd-health"><div class="hd-gauge"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="tr"/><circle cx="60" cy="60" r="50" class="ar" pathLength="100" style="stroke-dashoffset:24"/></svg><p><b>76</b><span>/100</span></p></div>
      <div><p class="hd-strong">Salud de la cuenta</p><p class="hd-soft">Lo que más plata le cuesta:</p>
      <ol class="hd-find">${(DEMO?.alertas || []).slice(0, 3).map(x => `<li>${esc(x.txt)}</li>`).join('') || '<li>Publicaciones que perdieron el catálogo</li><li>Stock por agotarse</li><li>Productos que venden a pérdida</li>'}</ol></div></div>
      <p class="hd-soft">Con tu cuenta conectada, esto sale con tus datos reales en unos minutos.</p>`,
  },
  chequeo: {
    html: () => `<form class="hd-form" id="hd-chk"><label for="hd-url">Link de una publicación de Mercado Libre</label>
      <div><input id="hd-url" type="url" inputmode="url" placeholder="https://www.mercadolibre.com.ar/…" required><button type="submit" class="btn-primary">Mirar</button></div></form>
      <div class="hd-out" id="hd-chk-out" aria-live="polite"><p class="hd-soft">Probalo con una publicación tuya o de la competencia. Son 5 chequeos por día.</p></div>`,
    init: el => $('hd-chk').addEventListener('submit', async e => {
      e.preventDefault(); const out = $('hd-chk-out'), b = e.submitter; b.disabled = true;
      out.innerHTML = '<div class="hd-load" aria-busy="true"><span></span><span></span><span></span></div>';
      try {
        const r = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: $('hd-url').value.trim() }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.rapido) { out.innerHTML = `<p class="hd-soft">${esc(d.error || 'No pude leer esa publicación. Revisá el link.')}</p>`; }
        else {
          const x = d.datos, f = [];
          if (x.fotos != null) f.push([x.fotos >= 7, `${x.fotos} fotos`, x.fotos >= 7 ? 'Buena secuencia' : 'Lo ideal son 7 o más']);
          if (x.atributos != null) f.push([x.atributos >= 10, `${x.atributos} atributos`, x.atributos >= 10 ? 'Aparece en los filtros' : 'Cada atributo que falta te saca de un filtro']);
          if (x.descripcion != null) f.push([x.descripcion > 300, x.descripcion ? `Descripción de ${num(x.descripcion)} caracteres` : 'Sin descripción', x.descripcion > 300 ? 'Tiene contenido' : 'No está ayudando a vender']);
          if (x.opiniones != null) f.push([true, `${num(x.opiniones)} opiniones`, 'Con el minero te digo qué critican']);
          out.innerHTML = `<p class="hd-strong">${esc(d.item?.title || 'Publicación')}</p><ul class="hd-rows">${f.map(([ok, t, s]) => `<li class="${ok ? 'ok' : 'bad'}"><b>${esc(t)}</b><span>${esc(s)}</span></li>`).join('')}</ul>`;
        }
      } catch { out.innerHTML = '<p class="hd-soft">Se cortó la conexión. Probá de nuevo.</p>'; }
      b.disabled = false;
    }),
  },
  simulador: {
    html: () => `<div class="hd-sim"><div class="hd-gauge"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="tr"/><circle cx="60" cy="60" r="50" class="ar" id="hs-ar" pathLength="100"/></svg><p><b id="hs-n">0</b><span>/100</span></p></div>
      <div class="hd-ctrl"><label><span>Fotos <b id="hs-of">3</b></span><input type="range" min="0" max="10" value="3" id="hs-f"></label>
      <label><span>Largo del título <b id="hs-ot">34</b></span><input type="range" min="0" max="60" value="34" id="hs-t"></label>
      <p class="hd-chips">${[['d', 'Descripción', 0], ['a', '5+ atributos', 0], ['g', 'Garantía', 0], ['e', 'Envío gratis', 1], ['s', 'Con stock', 1]].map(([k, t, on]) => `<label><input type="checkbox" id="hs-${k}"${on ? ' checked' : ''}>${t}</label>`).join('')}</p></div></div>
      <p class="hd-out" id="hs-tip" aria-live="polite"></p>`,
    init: el => {
      const g = k => $('hs-' + k);
      const run = () => {
        const f = +g('f').value, t = +g('t').value; g('of').textContent = f; g('ot').textContent = t;
        let s = Math.min(f, 7) / 7 * 30 + Math.min(t / 45, 1) * 20 + (g('d').checked ? 15 : 0) + (g('a').checked ? 15 : 0) + (g('g').checked ? 5 : 0) + (g('e').checked ? 10 : 0);
        if (!g('s').checked) s *= .4; s = Math.round(s);
        g('n').textContent = s; g('ar').style.strokeDashoffset = 100 - s; g('ar').style.stroke = s >= 75 ? 'var(--ok)' : s >= 50 ? 'var(--warn)' : 'var(--bad)';
        g('tip').textContent = !g('s').checked ? 'Sin stock, Mercado Libre la deja de mostrar: es lo primero.' : f < 6 ? `Sumá ${6 - f} foto${6 - f > 1 ? 's' : ''}: con 6 o más convierte mejor.` : t < 45 ? 'Usá más del título: las palabras que la gente busca.' : !g('a').checked ? 'Completá los atributos para aparecer en los filtros.' : !g('d').checked ? 'Una descripción con beneficios responde antes de que pregunten.' : 'Bien armada. Lo siguiente es medir visitas y conversión.';
      };
      el.addEventListener('input', run); run();
    },
  },
  diagnostico: {
    html: () => DIAG ? `<p class="hd-hint">¿Qué le pasa a tu cuenta?</p><p class="hd-chips hd-pick">${DIAG.map(d => `<button type="button" data-d="${esc(d.id)}">${esc(d.titulo)}</button>`).join('')}</p><div class="hd-out" id="hd-dx" aria-live="polite"></div>` : '<div class="hd-load" aria-busy="true"><span></span><span></span><span></span></div>',
    init: el => {
      const ver = id => { const d = DIAG.find(x => x.id === id); el.querySelectorAll('[data-d]').forEach(b => b.setAttribute('aria-pressed', b.dataset.d === id));
        $('hd-dx').innerHTML = `<p class="hd-soft"><b>Cómo lo detecto:</b> ${esc(d.regla)}</p><p class="hd-strong">Qué hacer</p><ol class="hd-find">${d.solucion.slice(0, 3).map(s => `<li>${esc(s)}</li>`).join('')}</ol>`; };
      el.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) ver(b.dataset.d); });
      if (DIAG) ver(DIAG[0].id);
    },
  },
  opiniones: {
    html: () => `${ejemplo('Ejemplo: 12 opiniones de una freidora de la competencia')}
      <ul class="hd-quotes">${RESEÑAS.slice(0, 3).map(r => `<li>«${esc(r)}»</li>`).join('')}<li class="hd-more">y 9 más…</li></ul>
      <button type="button" class="btn-primary" id="hd-mine">Analizar las 12 opiniones</button><div class="hd-out" id="hd-mine-out" aria-live="polite"></div>`,
    init: () => $('hd-mine').addEventListener('click', () => {
      const r = TEMAS.map(([t, re, s]) => [t, RESEÑAS.filter(x => re.test(x)).length, s]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
      const barra = ([t, n]) => `<li><span>${esc(t)}</span><i style="--v:${n / 12}"></i><b>${n}</b></li>`;
      $('hd-mine-out').innerHTML = `<p class="hd-strong">Qué critican</p><ul class="hd-bars bad">${r.filter(x => x[2] < 0).map(barra).join('')}</ul><p class="hd-strong">Qué elogian</p><ul class="hd-bars ok">${r.filter(x => x[2] > 0).map(barra).join('')}</ul><p class="hd-soft">Oportunidad: una freidora más grande y con antiadherente que dure, dicho en el título y en la primera foto.</p>`;
    }),
  },
  tendencias: {
    html: () => `${ejemplo('Así se ve · la versión completa trae datos reales')}
      <ol class="hd-trend">${['organizador de cajones', 'dispenser de detergente', 'lámpara de escritorio led'].map((t, i) => `<li><span>${i + 1}</span><b>${t}</b><em>creciendo</em></li>`).join('')}
      ${[4, 5, 6, 7, 8].map(i => `<li class="is-blur" aria-hidden="true"><span>${i}</span><b>${'█'.repeat(8 + (i * 3) % 7)}</b><em>creciendo</em></li>`).join('')}</ol>
      <p class="hd-soft">Los 3 primeros de cada categoría se ven completos. La lista entera, con las que valen la pena, te la paso yo.</p>`,
  },
  importacion: {
    html: () => `<div class="hd-calc"><label>Costo FOB por unidad (USD)<input type="number" id="hi-fob" value="4.2" min="0" step="0.1"></label>
      <label>Flete y seguro por unidad (USD)<input type="number" id="hi-flete" value="0.9" min="0" step="0.1"></label>
      <label>Derechos y tasas (%)<input type="number" id="hi-der" value="23" min="0" step="1"></label>
      <label>Dólar ($)<input type="number" id="hi-usd" value="1450" min="0" step="10"></label></div>
      <p class="hd-big" id="hi-out" aria-live="polite"></p><p class="hd-soft">Estimación rápida, sin IVA (recuperable si sos responsable inscripto) y sin gastos locales. La versión completa desglosa todo y te da el precio mínimo para vender en Mercado Libre.</p>`,
    init: el => { const run = () => { const v = id => +$(id).value || 0; const cif = v('hi-fob') + v('hi-flete'); const u = cif * (1 + v('hi-der') / 100) * v('hi-usd');
      $('hi-out').innerHTML = `<span>Costo puesto en Argentina</span><b>${plata(u)}</b><small>por unidad</small>`; }; el.addEventListener('input', run); run(); },
  },
  competencia: {
    html: () => `${ejemplo('Así se vería una alerta')}
      <ol class="hd-time"><li><em>1 de agosto</em><b>Competidor A pasó de +100 a +500 vendidos</b></li><li><em>10 de agosto</em><b>Bajó el precio 8%</b></li><li class="is-now"><em>Hoy</em><b>Vende entre 30 y 55 unidades por día</b><span>Estimado con los saltos de vendidos y sus opiniones</span></li></ol>
      <p class="hd-soft">La diseñé con lo que la API de Mercado Libre permite leer, sin trucos: por eso da un rango y no un número inventado.</p>`,
  },
  radar: {
    html: () => `${ejemplo('Así se vería el radar')}
      <ul class="hd-radar">${[['Creciendo en Mercado Libre', 'b'], ['Viral afuera, todavía no llegó', 'b'], ['Ya saturado', 'b']].map(([t]) => `<li><p class="hd-strong">${t}</p><span class="is-blur" aria-hidden="true">████████ ██████</span><span class="is-blur" aria-hidden="true">██████ ████████ ███</span></li>`).join('')}</ul>
      <p class="hd-soft">Cruza lo que crece en las búsquedas de Mercado Libre con lo que empieza a moverse afuera.</p>`,
  },
  perdida: {
    html: () => `<div class="hd-calc"><label>Ventas por Product Ads al mes ($)<input type="number" id="hp-v" value="3000000" min="0" step="100000"></label>
      <label>Tu ACOS actual (%)<input type="number" id="hp-a" value="30" min="0" max="100" step="1"></label>
      <label>ACOS al que se puede llegar (%)<input type="number" id="hp-o" value="15" min="0" max="100" step="1"></label></div>
      <p class="hd-big" id="hp-out" aria-live="polite"></p><p class="hd-soft">Es la diferencia entre lo que gastás y lo que gastarías con el ACOS objetivo, vendiendo lo mismo. En Vení a la Cocina lo bajé de 30% a 12%. La versión completa suma tu margen y la comisión: te dice hasta qué ACOS ganás plata.</p>`,
    init: el => { const run = () => { const v = id => +$(id).value || 0; const x = v('hp-v') * Math.max(0, v('hp-a') - v('hp-o')) / 100;
      $('hp-out').innerHTML = `<span>Estás gastando de más</span><b>${plata(x)}</b><small>por mes · ${plata(x * 12)} por año</small>`; }; el.addEventListener('input', run); run(); },
  },
  informe: {
    html: () => `<div class="hd-doc" aria-label="Vista previa del informe"><p class="hd-doc-t">Informe de auditoría · cuenta de ejemplo</p>
      <p class="hd-doc-h">1. Salud por área</p><span class="is-blur" aria-hidden="true">████████ ████ ██████████ ███</span>
      <p class="hd-doc-h">2. Los 10 problemas que más plata cuestan</p><span class="is-blur" aria-hidden="true">██████ ███████████ ████ █████</span><span class="is-blur" aria-hidden="true">████████████ ████████</span>
      <p class="hd-doc-h">3. Plan de acción en orden</p><span class="is-blur" aria-hidden="true">███████ ██████ ████████████</span></div>
      <p class="hd-soft">La muestra entera, armada con la cuenta de ejemplo, se abre con el botón de abajo. El tuyo sale con los datos de tu cuenta: te lo mando después de la auditoría gratis.</p>`,
  },
  desarmes: {
    html: () => `${ejemplo('Desarme: Mandolina Borner V5')}
      <p class="hd-was">Mandolina Borner V5 + Multibox Cortador Profesional Aleman Color Verde</p>
      <ul class="hd-rows"><li class="bad"><b>Título</b><span>Sin las palabras que la gente busca: «cortadora», «5 placas», «apto lavavajillas»</span></li><li class="bad"><b>Fotos</b><span>3 fotos sobre fondo blanco, sin uso real ni medidas</span></li><li class="bad"><b>Confianza</b><span>«Made in Germany» y la garantía no aparecen</span></li></ul>
      <p class="hd-is">Mandolina Cortadora Borner V5 Multibox | Profesional Alemán | 5 Placas | Cuchilla Inox | Apto Lavavajillas</p>`,
  },
  mail: {
    html: () => `<div class="hd-mailp"><p class="hd-strong">Lunes, 8:00 · Radar semanal</p><ol class="hd-trend"><li><span>1</span><b>organizador de cajones</b><em>creciendo</em></li><li class="is-blur" aria-hidden="true"><span>2</span><b>████████████</b><em>creciendo</em></li><li class="is-blur" aria-hidden="true"><span>3</span><b>██████████████</b><em>creciendo</em></li></ol></div>
      <p class="hd-soft">Un mail corto por semana con lo que más creció. Todavía no sale: dejame tu contacto y te aviso.</p>`,
  },
};

// ── Vitrina ──
function muelle() {
  $('hr-dock').innerHTML = Object.entries(ETAPAS).map(([e, t]) => {
    const l = H.filter(h => h.e === e);
    return `<section class="hr-grp" data-e="${e}"><h3><span class="hr-ic">${ic(e)}</span>${t}<span class="hr-n">${l.length}</span></h3>
      <ul>${l.map(h => `<li><button type="button" class="hr-item" data-id="${h.id}" aria-pressed="false"><span class="hr-iico">${svg(h.id)}</span><b>${esc(h.n)}</b><span class="hr-iq">${esc(h.q)}</span></button></li>`).join('')}</ul></section>`;
  }).join('');
}
let actual = null;
function abrir(id, desplazar) {
  const h = H.find(x => x.id === id); if (!h) return; actual = id;
  document.querySelectorAll('.hr-item').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
  const nivel = NIVEL[h.e], d = DEMOS[id];
  $('hr-stage').innerHTML = `<div class="hr-stage-in">
    <header class="hr-sh" data-e="${h.e}"><div class="hr-sh-top"><span class="hr-bigic">${svg(h.id)}</span><div><p class="hr-state" data-e="${h.e}"><span class="hr-ic">${ic(h.e)}</span>${ETAPAS[h.e]}</p><h3>${esc(h.n)}</h3></div></div>
      <p class="hr-q">${esc(h.q)}</p><p class="hr-v">${esc(h.v)}.</p>
      <ul class="hr-imp">${h.imp.map(x => `<li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8.5l3 3 7-7"/></svg>${esc(x)}</li>`).join('')}</ul>
      <ol class="hr-steps" aria-label="Etapa: ${ETAPAS[h.e]}">${PASOS.map((p, i) => `<li class="${i < nivel ? 'done' : i === nivel ? 'now' : ''}">${p}</li>`).join('')}</ol></header>
    <div class="hr-demo" id="hr-demo"><p class="hr-demo-k">Probalo acá</p>${d.html()}</div>
    <footer class="hr-sf">${h.cta.map(([t, u], i) => `<a class="${i ? 'btn-secondary' : 'btn-primary'}" href="${u}">${esc(t)}</a>`).join('')}<span>Para: ${esc(h.p)}${h.nota ? ' · ' + esc(h.nota) : ''}</span></footer>
  </div>`;
  d.init?.($('hr-demo'));
  history.replaceState(null, '', '#' + id);
  if (desplazar) { const r = $('hr-stage').getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * .6) $('hr-stage').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
}

muelle();
abrir(H.some(h => h.id === location.hash.slice(1)) ? location.hash.slice(1) : 'tracker');
$('hr-dock').addEventListener('click', e => { const b = e.target.closest('.hr-item'); if (b) abrir(b.dataset.id, true); });
Promise.all([pDemo, pDiag]).then(() => { if (['tracker', 'auditoria', 'diagnostico'].includes(actual)) abrir(actual); });
const cnt = e => H.filter(h => h.e === e).length;
$('hr-count').innerHTML = `<span class="hr-seg" aria-hidden="true">${Object.keys(ETAPAS).map(e => `<i data-e="${e}" style="--n:${cnt(e)}"></i>`).join('')}</span><span class="hr-leg">${Object.entries(ETAPAS).map(([e, t]) => `<span data-e="${e}">${cnt(e)} ${t.toLowerCase()}</span>`).join('')}</span>`;
