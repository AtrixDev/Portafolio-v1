// js/rentabilidad-form.js — MODELO DEL FORMULARIO: lo que la persona escribió ↔ la entrada que entiende el motor. Puro (sin DOM, sin motor).
//
// Reglas de esta capa (las vigila un test):
//  · No hay NINGÚN valor económico por defecto: un campo vacío no se manda (el motor lo trata como «no declarado» y lo avisa).
//    «0» escrito a propósito sí se manda. El único valor preseleccionado es el régimen (monotributo, visible y editable).
//  · Los porcentajes se escriben como porcentaje (14) y se convierten a la fracción del motor (0,14): es solo un cambio de unidad.
//  · No se calcula nada: ni ganancia, ni margen, ni precios. Eso lo hace el motor.
import { parsearNumero, escribirNumero } from './num-ar.js';

export const REGIMEN_INICIAL = 'monotributo';

/** Estado vacío del formulario (todo texto). */
export const valoresVacios = () => ({
  precio: '', costo: '', costoIva: '', unidades: '',
  regimen: REGIMEN_INICIAL, ivaProducto: '',
  ventaPct: '', financiacionPct: '',
  fijo: { modo: 'valor', valor: '', tramos: [{ hasta: '', monto: '' }, { hasta: '', monto: '' }] },
  envio: { modo: 'valor', valor: '', tramos: [{ hasta: '', monto: '' }, { hasta: '', monto: '' }] },
  canalIva: '',
  acos: '', ventasPorAds: '', adsBase: '', adsIva: '',
  impuestos: '', devoluciones: '',
  extras: [],
  objMargen: '', objGanancia: '', objMes: '', fijosMes: '',
});

/** Ejemplo CLARAMENTE ROTULADO en la pantalla («números inventados»). No es un default: el usuario lo pide con un botón. */
export const EJEMPLO = {
  precio: '15.000', costo: '6.000', costoIva: 'si', unidades: '', regimen: 'monotributo', ivaProducto: '',
  ventaPct: '14', financiacionPct: '', fijo: { modo: 'valor', valor: '2.740', tramos: [{ hasta: '', monto: '' }, { hasta: '', monto: '' }] },
  envio: { modo: 'valor', valor: '', tramos: [{ hasta: '', monto: '' }, { hasta: '', monto: '' }] }, canalIva: 'incluido',
  acos: '', ventasPorAds: '', adsBase: '', adsIva: '', impuestos: '3,5', devoluciones: '', extras: [],
  objMargen: '20', objGanancia: '', objMes: '', fijosMes: '',
};

/** Etiquetas legibles de cada campo de la entrada (para resumir errores). */
export const ETIQUETAS = {
  'precio': 'Precio de venta', 'unidades': 'Unidades', 'fiscal.regimen': 'Régimen fiscal', 'fiscal.ivaProducto': 'IVA del producto',
  'costo.producto': 'Costo del producto', 'costo.ivaIncluido': '¿El costo incluye IVA?', 'costo.extras': 'Costos adicionales',
  'canal.ventaPct': 'Comisión', 'canal.financiacionPct': 'Financiación', 'canal.fijo': 'Cargo fijo', 'canal.envio': 'Envío', 'canal.ivaModo': 'IVA de los cargos del canal',
  'publicidad.acos': 'ACOS', 'publicidad.ventasPorAdsPct': 'Ventas que vienen de publicidad', 'publicidad.base': 'Base del ACOS', 'publicidad.ivaModo': 'IVA de la publicidad',
  'impuestosVentaPct': 'Impuestos sobre la venta', 'devolucionesPct': 'Devoluciones', 'objetivo.margenPct': 'Margen objetivo',
  'objetivo.gananciaUnidad': 'Ganancia objetivo por unidad', 'objetivo.gananciaMes': 'Ganancia objetivo del mes', 'fijosMes': 'Costos fijos del mes',
};

const pct = t => { const n = parsearNumero(t); return n === null || Number.isNaN(n) ? n : n / 100; };         // 14 → 0,14 (cambio de unidad)
const hay = t => String(t ?? '').trim() !== '';

/**
 * Construye la entrada del motor desde lo escrito.
 * @returns {{ entrada: object, invalidos: {campo:string, texto:string}[], faltan: string[], mapa: {extras:number[], fijo:number[], envio:number[]} }}
 *  · invalidos: textos que no son un número (no se mandan; se avisa al lado del campo)
 *  · faltan: lo mínimo para poder calcular (precio y costo)
 *  · mapa: de la posición en la entrada a la fila del formulario (para mostrar cada error del motor en su fila)
 */
export function construirEntrada(v) {
  const entrada = {}, invalidos = [], mapa = { extras: [], fijo: [], envio: [] };
  const num = (campo, texto, convertir = parsearNumero) => {
    if (!hay(texto)) return undefined;
    const n = convertir(texto);
    if (Number.isNaN(n)) { invalidos.push({ campo, texto: String(texto) }); return undefined; }
    return n;
  };
  const poner = (obj, clave, valor) => { if (valor !== undefined) obj[clave] = valor; return valor !== undefined; };

  poner(entrada, 'precio', num('precio', v.precio));
  poner(entrada, 'unidades', num('unidades', v.unidades));

  const fiscal = { regimen: v.regimen };
  poner(fiscal, 'ivaProducto', num('fiscal.ivaProducto', v.ivaProducto, pct));
  entrada.fiscal = fiscal;

  const costo = {};
  poner(costo, 'producto', num('costo.producto', v.costo));
  if (v.costoIva === 'si') costo.ivaIncluido = true; else if (v.costoIva === 'no') costo.ivaIncluido = false;
  const extras = [];
  (v.extras || []).forEach((x, fila) => {
    if (!hay(x.nombre) && !hay(x.monto) && !x.iva) return;                           // fila vacía: no cuenta
    const e = {}; if (hay(x.nombre)) e.nombre = String(x.nombre).trim();
    poner(e, 'monto', num(`costo.extras.${extras.length}.monto`, x.monto));
    if (x.iva === 'si') e.ivaIncluido = true; else if (x.iva === 'no') e.ivaIncluido = false;
    mapa.extras.push(fila); extras.push(e);
  });
  if (extras.length) costo.extras = extras;
  if (Object.keys(costo).length) entrada.costo = costo;

  // Cargo fijo / envío: un monto o una escala por precio. La fila k de la entrada es la fila k del formulario (se avisa si falta alguna).
  const monto = (campo, m, nombre) => {
    if (m.modo === 'tramos') {
      const filas = m.tramos.map((t, i) => ({ t, i })).filter(({ t }) => hay(t.hasta) || hay(t.monto));
      if (!filas.length) return undefined;
      const out = filas.map(({ t, i }, k) => {
        mapa[nombre].push(i);
        let hasta = null, importe = num(`${campo}.${k}.monto`, t.monto);
        if (k !== filas.length - 1) {                                                // la última fila vale «desde ahí en adelante»: sin tope
          hasta = num(`${campo}.${k}.hasta`, t.hasta);
          if (hasta === undefined) { if (!hay(t.hasta)) invalidos.push({ campo: `${campo}.${k}.hasta`, texto: '' }); hasta = -1; }
        }
        if (importe === undefined) { if (!hay(t.monto)) invalidos.push({ campo: `${campo}.${k}.monto`, texto: '' }); importe = -1; }
        return { hasta, monto: importe };
      });
      return out;
    }
    return num(campo, m.valor);
  };
  const canal = {};
  poner(canal, 'ventaPct', num('canal.ventaPct', v.ventaPct, pct));
  poner(canal, 'financiacionPct', num('canal.financiacionPct', v.financiacionPct, pct));
  poner(canal, 'fijo', monto('canal.fijo', v.fijo, 'fijo'));
  poner(canal, 'envio', monto('canal.envio', v.envio, 'envio'));
  if (v.canalIva) canal.ivaModo = v.canalIva;
  if (Object.keys(canal).length) entrada.canal = canal;

  const pub = {};
  poner(pub, 'acos', num('publicidad.acos', v.acos, pct));
  poner(pub, 'ventasPorAdsPct', num('publicidad.ventasPorAdsPct', v.ventasPorAds, pct));
  if (v.adsBase) pub.base = v.adsBase;
  if (v.adsIva) pub.ivaModo = v.adsIva;
  if (Object.keys(pub).length) entrada.publicidad = pub;

  poner(entrada, 'impuestosVentaPct', num('impuestosVentaPct', v.impuestos, pct));
  poner(entrada, 'devolucionesPct', num('devolucionesPct', v.devoluciones, pct));
  const obj = {};
  poner(obj, 'margenPct', num('objetivo.margenPct', v.objMargen, pct));
  poner(obj, 'gananciaUnidad', num('objetivo.gananciaUnidad', v.objGanancia));
  poner(obj, 'gananciaMes', num('objetivo.gananciaMes', v.objMes));
  if (Object.keys(obj).length) entrada.objetivo = obj;
  poner(entrada, 'fijosMes', num('fijosMes', v.fijosMes));

  const faltan = [];
  if (!hay(v.precio)) faltan.push('precio');
  if (!hay(v.costo)) faltan.push('costo.producto');
  return { entrada, invalidos, faltan, mapa };
}

/** Inversa: de una entrada declarada (la que quedó guardada) a los textos del formulario. Solo escribe lo que estaba declarado. */
export function aValores(d) {
  const v = valoresVacios(), t = n => escribirNumero(n), p = f => (typeof f === 'number' ? escribirNumero(f * 100, 6) : '');   // 0,14 → «14»
  v.precio = t(d.precio); v.unidades = t(d.unidades);
  v.regimen = d.fiscal?.regimen ?? REGIMEN_INICIAL; v.ivaProducto = p(d.fiscal?.ivaProducto);
  v.costo = t(d.costo?.producto); v.costoIva = d.costo?.ivaIncluido === true ? 'si' : d.costo?.ivaIncluido === false ? 'no' : '';
  v.extras = (d.costo?.extras || []).map(x => ({ nombre: x.nombre ?? '', monto: t(x.monto), iva: x.ivaIncluido === true ? 'si' : x.ivaIncluido === false ? 'no' : '' }));
  v.ventaPct = p(d.canal?.ventaPct); v.financiacionPct = p(d.canal?.financiacionPct); v.canalIva = d.canal?.ivaModo ?? '';
  for (const k of ['fijo', 'envio']) {
    const m = d.canal?.[k];
    if (Array.isArray(m)) { v[k] = { modo: 'tramos', valor: '', tramos: m.map(x => ({ hasta: x.hasta === null ? '' : t(x.hasta), monto: t(x.monto) })) }; while (v[k].tramos.length < 2) v[k].tramos.push({ hasta: '', monto: '' }); }
    else if (typeof m === 'number') v[k].valor = t(m);
  }
  v.acos = p(d.publicidad?.acos); v.ventasPorAds = p(d.publicidad?.ventasPorAdsPct); v.adsBase = d.publicidad?.base ?? ''; v.adsIva = d.publicidad?.ivaModo ?? '';
  v.impuestos = p(d.impuestosVentaPct); v.devoluciones = p(d.devolucionesPct);
  v.objMargen = p(d.objetivo?.margenPct); v.objGanancia = t(d.objetivo?.gananciaUnidad); v.objMes = t(d.objetivo?.gananciaMes); v.fijosMes = t(d.fijosMes);
  return v;
}

/** Nombre del control (atributo `name` / `data-campo`) al que corresponde un error del motor. */
export function campoAControl(campo, mapa = { extras: [], fijo: [], envio: [] }) {
  const f = {
    'precio': 'precio', 'unidades': 'unidades', 'fiscal.regimen': 'regimen', 'fiscal.ivaProducto': 'ivaProducto', 'fiscal.ivaServicios': 'ivaProducto',
    'costo.producto': 'costo', 'costo.ivaIncluido': 'costoIva', 'costo.ivaCompra': 'costo', 'canal.ventaPct': 'ventaPct', 'canal.financiacionPct': 'financiacionPct',
    'canal.fijo': 'fijo', 'canal.envio': 'envio', 'canal.ivaModo': 'canalIva', 'publicidad.acos': 'acos', 'publicidad.ventasPorAdsPct': 'ventasPorAds',
    'publicidad.base': 'adsBase', 'publicidad.ivaModo': 'adsIva', 'impuestosVentaPct': 'impuestos', 'devolucionesPct': 'devoluciones',
    'objetivo.margenPct': 'objMargen', 'objetivo.gananciaUnidad': 'objGanancia', 'objetivo.gananciaMes': 'objMes', 'fijosMes': 'fijosMes', 'costo.extras': 'extras',
  }[campo];
  if (f) return f;
  let m = campo.match(/^costo\.extras\.(\d+)\.(monto|ivaIncluido)$/);
  if (m) return `${m[2] === 'monto' ? 'extraMonto' : 'extraIva'}-${mapa.extras[Number(m[1])] ?? m[1]}`;
  m = campo.match(/^canal\.(fijo|envio)\.(\d+)\.(monto|hasta)$/);
  if (m) return `${m[1]}${m[3] === 'monto' ? 'Monto' : 'Hasta'}-${mapa[m[1]][Number(m[2])] ?? m[2]}`;
  return null;
}
