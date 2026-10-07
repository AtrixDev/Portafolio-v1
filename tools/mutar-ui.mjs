// tools/mutar-ui.mjs — prueba de MUTACIÓN de la capa UI de Rentabilidad (S7).
// Copia el proyecto a una carpeta temporal, exige una línea de base verde y, por cada mutante (un cambio chico y malicioso en
// frontend/js/rentabilidad*.js o num-ar.js), corre primero las pruebas de Node (rentabilidad-ui) y, si sobrevive, la de navegador (Chromium).
// Uso: node tools/mutar-ui.mjs [--solo-node]      Sale con 1 si algún mutante sobrevive a TODO.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOLO_NODE = process.argv.includes('--solo-node');
const T = mkdtempSync(join(tmpdir(), 'mut-ui-'));
for (const d of ['backend/api', 'backend/lib', 'backend/test', 'frontend', 'tools']) cpSync(join(RAIZ, d), join(T, d), { recursive: true, filter: s => !/_backup|experimentos|prog-ejemplos|capturas-demo|\/assets\/(img|imagenes)/.test(s) });
cpSync(join(RAIZ, 'backend/package.json'), join(T, 'backend/package.json')); symlinkSync(join(RAIZ, 'backend/node_modules'), join(T, 'backend/node_modules'));

const F = 'frontend/js/', FORM = F + 'rentabilidad-form.js', REN = F + 'rentabilidad-render.js', ORQ = F + 'rentabilidad.js', NUM = F + 'num-ar.js';
const M = [
  // formulario
  [FORM, `if (v.costoIva === 'si') costo.ivaIncluido = true; else if (v.costoIva === 'no') costo.ivaIncluido = false;`, `if (v.costoIva === 'si') costo.ivaIncluido = false; else if (v.costoIva === 'no') costo.ivaIncluido = true;`, 'IVA del costo invertido'],
  [FORM, `n / 100; };`, `n / 10; };`, 'porcentaje ÷10 en vez de ÷100'],
  [FORM, `if (!hay(texto)) return undefined;`, `if (false) return undefined;`, 'un campo vacío se manda'],
  [FORM, `export const REGIMEN_INICIAL = 'monotributo';`, `export const REGIMEN_INICIAL = 'ri';`, 'régimen inicial distinto'],
  [FORM, `if (!hay(v.costo)) faltan.push('costo.producto');`, ``, 'no se exige el costo'],
  [FORM, `precio: '15.000', costo: '6.000'`, `precio: '15.500', costo: '6.000'`, 'el ejemplo cambia de valor'],
  [FORM, `mapa.extras.push(fila);`, `mapa.extras.push(fila + 1);`, 'fila de error de extras corrida'],
  [FORM, `escribirNumero(f * 100, 6)`, `escribirNumero(f * 10, 6)`, 'ida y vuelta del porcentaje'],
  [FORM, `if (k !== filas.length - 1)`, `if (k !== 0)`, 'el último tramo deja de ser «sin tope»'],
  [FORM, `'precio': 'precio', 'unidades': 'unidades',`, `'precio': 'costo', 'unidades': 'unidades',`, 'el error del precio apunta al costo'],
  [FORM, `if (hay(x.nombre)) e.nombre = String(x.nombre).trim();`, `if (hay(x.nombre)) e.nombre = String(x.nombre);`, 'el nombre del extra no se recorta'],
  // render
  [REN, `const principal = filas[0], gana = principal.ok !== false;`, `const principal = filas[0], gana = principal.ok === false;`, 'ganar/perder invertido'],
  [REN, `r.costos.filter(c => c.monto !== 0)`, `r.costos.filter(c => c.monto === 0)`, 'sólo costos en cero'],
  [REN, `export const esc = s => String(s ?? '').replace(`, `export const esc = s => String(s ?? '').replace(/^$/, '').replace(`, null],   // (placeholder descartado abajo)
  [REN, `export const esc = s => String(s ?? '').replace(/[&<>"']/g,`, `export const esc = s => String(s ?? '').replace(/[&<>]/g,`, 'esc deja pasar comillas'],
  [REN, `<h3 id="rt-h-avisos">`, `<h3 id="rt-h-avisosX">`, 'cambia un ancla de aviso'],
  [REN, `return \`<div class="rt-res-in">\${veredicto}\${bloquePrecios}\${bloqueCostos}\${bloqueAvisos}\${bloqueSupuestos}\${bloqueDecidir}</div>\`;`, `return \`<div class="rt-res-in">\${veredicto}\${bloquePrecios}\${bloqueCostos}\${bloqueSupuestos}\${bloqueAvisos}\${bloqueDecidir}</div>\`;`, 'avisos y supuestos intercambiados'],
  [REN, `String(t ?? '').replace(/\\s*\\((?:true|false|"[^"]*")\\)/g, '')`, `String(t ?? '')`, 'errores del motor con pistas técnicas'],
  [REN, `e.efectoGanancia === 'mejora' ? '+' : ''`, `e.efectoGanancia === 'mejora' ? '' : '+'`, 'signo del cambio invertido'],
  [REN, `\${mismaVersion ? '' : \`<p class="rt-chico" data-sev="media">`, `\${!mismaVersion ? '' : \`<p class="rt-chico" data-sev="media">`, 'aviso de versión invertido'],
  [REN, `El ejemplo usa números inventados.`, `El ejemplo usa números reales.`, 'el ejemplo ya no se rotula como inventado'],
  [REN, `(gana ? \`<span class="rt-pieza" data-cat="ganancia"`, `(!gana ? \`<span class="rt-pieza" data-cat="ganancia"`, 'barra: ganancia dibujada al revés'],
  [REN, `\${gana ? 'Ganás' : 'Perdés plata:'}`, `\${gana ? 'Perdés plata:' : 'Ganás'}`, 'titular invertido'],
  [REN, `f.nota && f.nota !== lista[i - 1]?.nota ? f.nota : ''`, `f.nota ? f.nota : ''`, 'nota repetida'],
  [REN, `\${total ? \`<p class="rt-detalle">En`, `\${false ? \`<p class="rt-detalle">En`, 'se pierde la ganancia total'],
  // num-ar
  // orquestador (sólo las cubre el navegador)
  [ORQ, `if (d.herramienta !== 'rentabilidad')`, `if (d.herramienta === 'rentabilidad')`, '?r= de otra herramienta no se redirige'],
  [ORQ, `res?.status === 201 && body?.ok`, `res?.status === 200 && body?.ok`, 'el 201 no se reconoce'],
  [ORQ, `mensaje(status === 429 ?`, `mensaje(status === 428 ?`, 'el 429 pierde su mensaje'],
  [ORQ, `escribir(aValores(compartido.entradaDeclarada));`, `escribir(valoresVacios());`, '?r= no carga los datos'],
  [ORQ, `if (mismaVersion) dibujarEscenarios(compartido.entradaDeclarada); else $('#escenarios').hidden = true;`, `dibujarEscenarios(compartido.entradaDeclarada);`, 'escenarios con otra versión'],
  [ORQ, `const r = { ...datos.resultado, entrada: datos.entrada };       // lo guardado, tal cual: sin recalcular`, `const r = evaluar(datos.entrada);`, '?r= recalcula en silencio'],
  [ORQ, `body: JSON.stringify({ entrada: ultimo.entrada })`, `body: JSON.stringify({ entrada: ultimo.entrada, resultado: ultimo.r })`, 'el cliente manda métricas'],
  [ORQ, `  actDock();\n}\nif ('IntersectionObserver'`, `}\nif ('IntersectionObserver'`, 'el resumen fijo no se reevalúa'],
  [ORQ, `bloquear(false); history.replaceState(null, '', location.pathname);`, `history.replaceState(null, '', location.pathname);`, '«usar datos» no habilita el formulario'],
  [ORQ, `bloquear(false); history.replaceState(null, '', location.pathname);`, `bloquear(false);`, '«usar datos» no limpia ?r='],
  [ORQ, `if (res.status === 404) return errorCompartido(`, `if (res.status === 403) return errorCompartido(`, 'el 404 de ?r= no se reconoce'],
  [ORQ, `if (!res) return errorCompartido(`, `if (res === 1) return errorCompartido(`, 'el error de red de ?r= no se reconoce'],
  [ORQ, `const igual = guardado.huella === huella();`, `const igual = true;`, 'no avisa que el link guardado quedó viejo'],
  [ORQ, `if (compartido) return;\n  const { entrada, invalidos`, `const { entrada, invalidos`, 'recalcular también en modo compartido'],
  [ORQ, `if (n === null || Number.isNaN(n)) { err.textContent`, `if (false) { err.textContent`, 'precio de prueba inválido pasa'],
].filter(m => m[3] !== null);

const correr = (cmd, args) => spawnSync(cmd, args, { cwd: T, encoding: 'utf8', timeout: 600000 });
const verde = () => correr('node', ['--test', 'backend/test/rentabilidad-ui.test.mjs']).status === 0;
const base = verde(); if (!base) { console.log('LÍNEA DE BASE ROJA (node): no se puede mutar'); process.exit(2); }
if (!SOLO_NODE) { const b = correr('python3', ['tools/browser-rentabilidad.py', '--navegadores', 'chromium']); if (b.status !== 0) { console.log('LÍNEA DE BASE ROJA (navegador):\n' + b.stdout.slice(-800)); process.exit(2); } }
console.log(`línea de base verde · ${M.length} mutantes`);

let sobreviven = 0, porNode = 0, porNav = 0;
const SOLO = (process.argv.find(a => a.startsWith('--filtro=')) ?? '').slice(9);
for (const [archivo, de, a, desc] of M) {
  if (SOLO && !SOLO.split('|').some(f => desc.includes(f))) continue;
  const ruta = join(T, archivo), original = readFileSync(ruta, 'utf8');
  if (!original.includes(de)) { console.log(`✗ NO SE PUDO APLICAR: ${desc}`); sobreviven++; continue; }
  writeFileSync(ruta, original.replace(de, a));
  let r = 'SOBREVIVE';
  if (!verde()) { r = 'muere (node)'; porNode++; }
  else if (!SOLO_NODE && correr('python3', ['tools/browser-rentabilidad.py', '--navegadores', 'chromium']).status !== 0) { r = 'muere (navegador)'; porNav++; }
  if (r === 'SOBREVIVE') sobreviven++;
  console.log(`${r.padEnd(18)} ${archivo.split('/').pop().padEnd(24)} ${desc}`);
  writeFileSync(ruta, original);
}
console.log(`\n${M.length} mutantes · ${porNode} por Node · ${porNav} por navegador · ${sobreviven} sobreviven`);
rmSync(T, { recursive: true, force: true });
process.exit(sobreviven ? 1 : 0);
