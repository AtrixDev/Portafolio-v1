// js/port.js — Portada: quién soy + el dragón de código + el mapa de todo lo que hay en la web, con vista previa de cada cosa
import { montarDragon } from './dragon.js';
import { esc, meses, PUESTOS } from './exp-data.js';
import { AREAS } from './hab-data.js';

// Años de práctica por habilidad, con la misma cuenta que la sección Habilidades
const anios = s => Object.keys(s.usos || {}).reduce((t, id) => { const p = PUESTOS.find(x => x.id === id); return p ? t + meses(p.desde, p.hasta) : t; }, 0) / 12;
const TOP = AREAS.flatMap(a => a.skills).filter(s => s.id !== 'coord').map(s => [s.n, anios(s)]).sort((a, b) => b[1] - a[1]);

montarDragon(document.getElementById('pt-dragon'));
const $ = id => document.getElementById(id);
const flecha = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// Vistas previas: cada una dibuja en chico lo que hay del otro lado
const PREV = {
  aud: () => `<div class="pv-aud"><div class="pv-gauge"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="tr"/><circle cx="60" cy="60" r="50" class="ar" pathLength="100"/></svg><p><b>76</b><span>salud</span></p></div>
    <ul class="pv-find"><li class="pv-ej">Cuenta de ejemplo</li><li><i></i>Perdió el catálogo en 1 publicación</li><li><i></i>2 productos se quedan sin stock</li><li><i></i>1 publicación vende a pérdida</li></ul></div>`,
  her: () => `<div class="pv-her"><div class="pv-seg" aria-hidden="true"><i class="f" style="--n:6"></i><i class="p" style="--n:3"></i><i class="d" style="--n:2"></i><i class="x" style="--n:3"></i></div>
    <p class="pv-legend"><span class="f">6 funcionando</span><span class="p">3 probando</span><span class="d">2 diseñando</span><span class="x">3 en idea</span></p>
    <p class="pv-chips">${['ML Tracker', 'Auditoría', 'Simulador', 'Minero de opiniones', 'Tendencias', 'Importación'].map(x => `<span>${x}</span>`).join('')}</p></div>`,
  trk: () => `<div class="pv-trk"><dl><div><dt>Ventas 28 días</dt><dd id="pv-v">748</dd></div><div><dt>Conversión</dt><dd id="pv-c">3,42%</dd></div><div><dt>Alertas</dt><dd id="pv-a">17</dd></div></dl>
    <svg class="pv-spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 L25 44 L50 46 L75 38 L100 40 L125 31 L150 34 L175 25 L200 28 L225 18 L250 21 L275 11 L300 13 L300 60 L0 60Z" class="a"/><path d="M0 48 L25 44 L50 46 L75 38 L100 40 L125 31 L150 34 L175 25 L200 28 L225 18 L250 21 L275 11 L300 13" class="l"/></svg></div>`,
  tra: () => `<ol class="pv-tra" aria-hidden="true">${[['Ministerio', '2018'], ['Esquina Taki', '2022'], ['Adamas', '2023'], ['DemasLed', '2025'], ['Vení a la Cocina', '2025', '+38,9%', 's'], ['Hoy', 'freelance', '', 'n']].map(([t, a, e, c], k) => `<li class="${c || ''}" style="--k:${k}"><i></i><b>${t}</b><span>${a}</span>${e ? `<em>${e}</em>` : ''}</li>`).join('')}</ol>`,
  hab: () => `<div class="pv-hab"><ol>${TOP.slice(0, 4).map(([t, v]) => `<li><span>${esc(t)}</span><i style="--v:${v / TOP[0][1]}"></i><b>${v.toLocaleString('es-AR', { maximumFractionDigits: 1 })} años</b></li>`).join('')}</ol><p>y ${AREAS.flatMap(a => a.skills).length - 4} habilidades más, cada una con sus resultados</p></div>`,
  dias: () => `<ol class="pv-dias" aria-hidden="true"><li style="--w:23%"><b>Días 1–7</b>Diagnosticar</li><li style="--w:47%"><b>8–21</b>Optimizar</li><li style="--w:30%"><b>22–30</b>Medir</li></ol>`,
  lab: () => `<div class="pv-lab" aria-hidden="true">${['ACOS y Product Ads', 'SEO de títulos', 'Anatomía de una publicación', 'Imágenes con IA'].map((t, i) => `<span style="--i:${i}">${t}</span>`).join('')}</div>`,
  prog: () => `<div class="pv-prog"><b>781</b><span>fichas en 12 categorías</span></div>`,
  web: () => `<ol class="pv-web" aria-hidden="true"><li>Tipo de web</li><li>Estructura</li><li>Estilo</li><li>Receta lista</li></ol>`,
};

const TILES = [
  ['aud', 'Para vendedores', 'Auditoría gratis de tu cuenta', 'Conectás tu cuenta y en minutos ves la salud por área y lo que más plata te hace perder.', 'Auditar mi cuenta', 'sistema.html#auditar'],
  ['her', 'Para vendedores', 'Herramientas que podés probar', 'Todo lo que construí, cada una con una demo para usar acá mismo.', 'Ver las herramientas', 'herramientas.html'],
  ['trk', 'Para vendedores y empresas', 'ML Tracker, en vivo', 'Mi sistema de análisis funcionando con una cuenta de ejemplo.', 'Abrir la demo', 'sistema.html#demo'],
  ['tra', 'Para empresas', 'Trayectoria completa', 'Seis puestos, de la escuela a mis propias herramientas: qué hice en cada uno y cómo se comprueba.', 'Ver la trayectoria', '#experiencia'],
  ['hab', 'Para empresas', 'Habilidades medidas', 'Once habilidades con los años de práctica de cada una, dónde las usé y qué resultados dieron.', 'Ver las habilidades', '#habilidades'],
  ['dias', 'Para empresas', 'Mis primeros 30 días', 'Qué haría en tu equipo, semana por semana.', 'Ver el plan', '#valor-prop'],
  ['lab', 'Para aprender', 'Lab ML: 8 guías', 'ACOS, SEO, fotos, precios y reputación, explicados con casos para estudiantes y apasionados del e-commerce.', 'Abrir el Lab', 'lab.html'],
  ['prog', 'Base de datos y ejemplos', 'Programación', 'Mi base de conocimiento para construir una web.', 'Explorar', 'programacion.html'],
  ['web', 'Para armar tu web', 'Armá tu web', 'La receta de tu próximo proyecto, paso a paso.', 'Empezar', 'armar.html'],
];
$('pt-map').innerHTML = TILES.map(([id, k, t, d, c, u]) => `<a class="pt-tile t-${id}" href="${u}">
  <div class="pt-prev">${PREV[id]()}</div>
  <div class="pt-txt"><small>${esc(k)}</small><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="pt-go">${esc(c)} ${flecha}</span></div></a>`).join('');

// Datos en vivo del Tracker y animaciones al entrar en pantalla
fetch('/api/tracker?action=demo').then(r => r.ok ? r.json() : null).then(d => {
  if (!d) return; const a = d.resumen.actual;
  $('pv-v').textContent = Math.round(a.unidades).toLocaleString('es-AR');
  $('pv-c').textContent = (a.conversion * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 }) + '%';
  $('pv-a').textContent = d.alertas.length;
}).catch(() => {});
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .25 });
document.querySelectorAll('.pt-tile').forEach(t => io.observe(t));

// Estado según la hora en Buenos Aires: de 8 a 22 disponible; de noche, recargando energía;
// sábados y domingos, el finde. Siempre invita a escribir.
function estado() {
  const f = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', weekday: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(new Date());
  const h = +f.find(x => x.type === 'hour').value, dia = f.find(x => x.type === 'weekday').value;
  const noche = h < 8 || h >= 22, finde = dia === 'Sat' || dia === 'Sun';
  const [tarjeta, arriba] = noche ? ['Recargando energía · escribime y te respondo a primera hora', 'Respondo a primera hora']
    : finde ? ['Disfrutando el finde (y adelantando pendientes) · escribime igual', 'Fin de semana']
    : ['Disponible para charlar', 'Disponible'];
  document.documentElement.classList.toggle('is-noche', noche);
  document.documentElement.classList.toggle('is-finde', finde && !noche);
  const card = document.querySelector('#pt-estado .pt-est-t'), top = document.querySelector('#pt-est-top .pt-est-t');
  if (card) card.textContent = tarjeta;
  if (top) top.textContent = arriba;
}
estado(); setInterval(estado, 60000);
