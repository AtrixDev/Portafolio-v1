// motor/validar.js — valida y normaliza la entrada del motor económico. Puro: sin red, sin DOM, sin azar, sin reloj.
//
// Reglas:
//  · NUNCA lanza: devuelve { ok, entrada, errores, advertencias, supuestos }.
//  · No muta lo que recibe.
//  · Los porcentajes entran como FRACCIÓN (0.14 = 14%). Si llega 14 se rechaza; no se "adivina".
//  · Lo que cambia el resultado y no se puede suponer (régimen, tratamiento de IVA) NO tiene valor por defecto:
//    si hace falta y no está, es un error. Los pocos defaults que hay quedan registrados en `supuestos`.
//  · Los montos son pesos, como número. Los textos no entran al motor (la interfaz los convierte).

export const REGIMENES = ['monotributo', 'ri', 'sin_iva'];
export const IVA_MODOS = ['incluido', 'adicional', 'sin'];
export const BASES_PUBLICIDAD = ['precio', 'neto'];

const MAX_DINERO = 1e9;
const MAX_TRAMOS = 10;
const MAX_EXTRAS = 20;
const ALICUOTA_GENERAL = 0.21;

const esObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const esNum = x => typeof x === 'number' && Number.isFinite(x);
const campoOk = c => c.replace(/\.(\d+)/g, '[$1]');

export function validar(cruda) {
  const errores = [], advertencias = [], supuestos = [];
  const err = (campo, codigo, texto) => errores.push({ campo, codigo, texto });
  const adv = (codigo, severidad, texto, campo) => advertencias.push({ codigo, severidad, texto, ...(campo ? { campo } : {}) });
  const sup = (campo, valor, texto) => supuestos.push({ campo, valor, fuente: 'default', texto });

  if (!esObj(cruda)) {
    err('entrada', 'ENTRADA_INVALIDA', 'La entrada tiene que ser un objeto con los datos del producto.');
    return { ok: false, entrada: null, errores, advertencias, supuestos };
  }

  // ── lectores ──
  // Dinero: número finito entre 0 y 1e9
  const dinero = (campo, v, { requerido = false, defecto = 0, min = 0 } = {}) => {
    if (v === undefined || v === null) {
      if (requerido) err(campo, 'CAMPO_REQUERIDO', `Falta ${campoOk(campo)}.`);
      return defecto;
    }
    if (!esNum(v)) { err(campo, 'TIPO_INVALIDO', `${campoOk(campo)} tiene que ser un número.`); return defecto; }
    if (v < min || v > MAX_DINERO) { err(campo, 'MONTO_FUERA_DE_RANGO', `${campoOk(campo)} tiene que estar entre ${min} y ${MAX_DINERO}.`); return defecto; }
    return v;
  };
  // Porcentaje como fracción. `max` es inclusivo si `maxIncl`, exclusivo si no.
  const fraccion = (campo, v, { defecto = 0, max = 1, maxIncl = false } = {}) => {
    if (v === undefined || v === null) return defecto;
    if (!esNum(v)) { err(campo, 'TIPO_INVALIDO', `${campoOk(campo)} tiene que ser un número.`); return defecto; }
    if (v < 0 || (maxIncl ? v > max : v >= max)) {
      const sugerido = v > 1 && v <= 100 ? ` ¿Quisiste decir ${v / 100}?` : '';
      err(campo, 'PORCENTAJE_FUERA_DE_RANGO', `${campoOk(campo)} va como fracción (0,14 = 14%) y tiene que estar entre 0 y ${max}.${sugerido}`);
      return defecto;
    }
    return v;
  };
  const elegir = (campo, v, validos, codigo, texto) => {
    if (!validos.includes(v)) { err(campo, codigo, texto); return null; }
    return v;
  };
  // Monto fijo o escalonado por precio: número, o [{ hasta, monto }] con `hasta` creciente y el último en null (sin tope).
  // El tramo aplica mientras precio < hasta.
  const montoOTramos = (campo, v) => {
    if (v === undefined || v === null) return 0;
    if (!Array.isArray(v)) return dinero(campo, v);
    if (!v.length || v.length > MAX_TRAMOS) { err(campo, 'TRAMOS_INVALIDOS', `${campoOk(campo)}: usá entre 1 y ${MAX_TRAMOS} tramos.`); return 0; }
    const out = [];
    let previo = 0, mal = false;
    v.forEach((t, i) => {
      const ultimo = i === v.length - 1;
      if (!esObj(t)) { mal = true; return; }
      const monto = dinero(`${campo}.${i}.monto`, t.monto, { requerido: true });
      let hasta = t.hasta;
      if (ultimo) { if (hasta !== null && hasta !== undefined) mal = true; hasta = null; }
      else if (!esNum(hasta) || hasta <= previo || hasta > MAX_DINERO) mal = true;
      else previo = hasta;
      out.push({ hasta, monto });
    });
    if (mal) { err(campo, 'TRAMOS_INVALIDOS', `${campoOk(campo)}: los tramos tienen que tener "hasta" creciente y el último sin tope (null).`); return 0; }
    return out;
  };
  const hayMonto = m => Array.isArray(m) ? m.some(t => t.monto > 0) : m > 0;

  // ── fiscal ──
  const f = esObj(cruda.fiscal) ? cruda.fiscal : {};
  const regimen = elegir('fiscal.regimen', f.regimen, REGIMENES, 'REGIMEN_INVALIDO', 'Elegí el régimen fiscal: monotributo, ri (responsable inscripto) o sin_iva.');
  const conIva = regimen === 'ri' || regimen === 'monotributo';

  // ── producto y costos ──
  const precio = dinero('precio', cruda.precio, { requerido: true });
  if (esNum(cruda.precio) && cruda.precio <= 0 && !errores.some(e => e.campo === 'precio')) err('precio', 'PRECIO_INVALIDO', 'El precio de venta tiene que ser mayor a cero.');
  let unidades = 1;
  if (cruda.unidades === undefined || cruda.unidades === null) sup('unidades', 1, 'No indicaste unidades: se calcula para 1.');
  else if (!Number.isInteger(cruda.unidades) || cruda.unidades < 1 || cruda.unidades > 1e7) err('unidades', 'UNIDADES_INVALIDAS', 'Las unidades tienen que ser un entero mayor o igual a 1.');
  else unidades = cruda.unidades;

  const c = esObj(cruda.costo) ? cruda.costo : {};
  const producto = dinero('costo.producto', c.producto, { requerido: true });
  const extras = [];
  if (c.extras !== undefined && c.extras !== null) {
    if (!Array.isArray(c.extras) || c.extras.length > MAX_EXTRAS) err('costo.extras', 'EXTRAS_INVALIDOS', `Los costos extra son una lista de hasta ${MAX_EXTRAS} ítems.`);
    else c.extras.forEach((x, i) => {
      if (!esObj(x)) { err(`costo.extras.${i}`, 'EXTRAS_INVALIDOS', `El costo extra ${i + 1} no es válido.`); return; }
      extras.push({ nombre: String(x.nombre ?? '').slice(0, 60), monto: dinero(`costo.extras.${i}.monto`, x.monto, { requerido: true }), ivaIncluido: x.ivaIncluido });
    });
  }
  const hayCosto = producto > 0 || extras.some(x => x.monto > 0);
  if (producto === 0 && !errores.some(e => e.campo === 'costo.producto')) adv('COSTO_CERO', 'media', 'El costo del producto es cero: el markup no se puede calcular y la ganancia puede estar sobreestimada.', 'costo.producto');

  // IVA del costo: explícito cuando importa (monotributo y RI). Sin default: si no se declaró y no hacía falta, queda null
  // (así las funciones inversas pueden pedirlo cuando lo necesiten, en vez de suponer).
  const ivaCosto = (campo, etiqueta, v) => {
    if (!conIva) return v === true;
    if (typeof v === 'boolean') return v;
    if (hayCosto) err(campo, 'IVA_COSTO_REQUERIDO', `Indicá si ${etiqueta} ya incluye IVA (true) o no (false).`);
    return null;
  };
  const costoIvaIncluido = ivaCosto('costo.ivaIncluido', 'el costo del producto', c.ivaIncluido);
  extras.forEach((x, i) => { x.ivaIncluido = ivaCosto(`costo.extras.${i}.ivaIncluido`, `el costo extra ${i + 1}`, x.ivaIncluido); });

  // ── canal de venta (marketplace, tienda propia…): comisión, financiación, cargo fijo, envío ──
  const k = esObj(cruda.canal) ? cruda.canal : {};
  if (cruda.canal === undefined || cruda.canal === null) adv('CANAL_NO_DECLARADO', 'alta', 'No cargaste comisión, cargo fijo ni envío del canal de venta: la ganancia está sobreestimada.', 'canal');
  const ventaPct = fraccion('canal.ventaPct', k.ventaPct);
  const financiacionPct = fraccion('canal.financiacionPct', k.financiacionPct);
  const fijo = montoOTramos('canal.fijo', k.fijo);
  const envio = montoOTramos('canal.envio', k.envio);
  if (ventaPct + financiacionPct >= 1 && !errores.some(e => e.campo.startsWith('canal.'))) err('canal.ventaPct', 'PORCENTAJE_FUERA_DE_RANGO', 'La comisión más la financiación no pueden sumar 100% o más.');
  const hayCargosCanal = ventaPct + financiacionPct > 0 || hayMonto(fijo) || hayMonto(envio);
  let canalIvaModo = k.ivaModo;
  if (regimen === 'sin_iva') canalIvaModo = 'sin';
  else if (conIva && hayCargosCanal) canalIvaModo = elegir('canal.ivaModo', canalIvaModo, IVA_MODOS, 'IVA_MODO_REQUERIDO', 'Indicá si los cargos del canal ya incluyen IVA ("incluido"), si el IVA se suma aparte ("adicional") o si no llevan IVA ("sin").');
  else canalIvaModo = IVA_MODOS.includes(canalIvaModo) ? canalIvaModo : null;

  // ── publicidad ──
  const p = esObj(cruda.publicidad) ? cruda.publicidad : {};
  const acos = fraccion('publicidad.acos', p.acos, { max: 5, maxIncl: true });
  let ventasPorAdsPct = 1;
  if (p.ventasPorAdsPct === undefined || p.ventasPorAdsPct === null) { if (acos > 0) sup('publicidad.ventasPorAdsPct', 1, 'Se asumió que el 100% de las ventas viene de publicidad: es el caso más caro (conservador).'); }
  else ventasPorAdsPct = fraccion('publicidad.ventasPorAdsPct', p.ventasPorAdsPct, { max: 1, maxIncl: true });
  let base = 'precio';
  if (p.base === undefined || p.base === null) { if (acos > 0) sup('publicidad.base', 'precio', 'El ACOS se aplicó sobre el precio publicado.'); }
  else base = elegir('publicidad.base', p.base, BASES_PUBLICIDAD, 'BASE_INVALIDA', 'La base de la publicidad es "precio" o "neto".') ?? 'precio';
  let adsIvaModo = p.ivaModo;
  if (regimen === 'sin_iva') adsIvaModo = 'sin';
  else if (conIva && acos * ventasPorAdsPct > 0) adsIvaModo = elegir('publicidad.ivaModo', adsIvaModo, IVA_MODOS, 'IVA_MODO_REQUERIDO', 'Indicá si la inversión en publicidad ya incluye IVA ("incluido"), si se suma aparte ("adicional") o si no lleva IVA ("sin").');
  else adsIvaModo = IVA_MODOS.includes(adsIvaModo) ? adsIvaModo : null;

  // ── alícuotas (único default: la general de 21%; solo se registra en `supuestos` si se usó) ──
  const alicuota = (campo, v, usada, texto) => {
    if (v === undefined || v === null) { if (usada) sup(campo, ALICUOTA_GENERAL, texto); return ALICUOTA_GENERAL; }
    return fraccion(campo, v, { max: 1 });
  };
  const costos = [costoIvaIncluido, ...extras.map(x => x.ivaIncluido)].filter(x => x !== null);
  const usaIvaCompra = conIva && hayCosto && (regimen === 'ri' ? costos.some(Boolean) : costos.some(x => !x));
  // la alícuota solo influye si el IVA se recupera de algo incluido (ri) o se suma a algo adicional (monotributo)
  const importa = modo => regimen === 'ri' ? modo === 'incluido' : modo === 'adicional';
  const usaIvaServicios = conIva && ((hayCargosCanal && importa(canalIvaModo)) || (acos * ventasPorAdsPct > 0 && importa(adsIvaModo)));
  const ivaProducto = alicuota('fiscal.ivaProducto', f.ivaProducto, regimen === 'ri', 'IVA del producto vendido: se usó la alícuota general de 21%.');
  const ivaCompra = alicuota('costo.ivaCompra', c.ivaCompra, usaIvaCompra, 'IVA de la compra del producto: se usó la alícuota general de 21%.');
  const ivaServicios = alicuota('fiscal.ivaServicios', f.ivaServicios, usaIvaServicios, 'IVA de los cargos del canal y de la publicidad: se usó la alícuota general de 21%.');

  // ── impuestos, devoluciones, objetivo, fijos ──
  if (cruda.impuestosVentaPct === undefined || cruda.impuestosVentaPct === null) adv('IMPUESTOS_NO_DECLARADOS', 'media', 'No cargaste impuestos sobre las ventas (IIBB u otros): si te corresponden, la ganancia está sobreestimada.', 'impuestosVentaPct');
  const impuestosVentaPct = fraccion('impuestosVentaPct', cruda.impuestosVentaPct);
  const devolucionesPct = fraccion('devolucionesPct', cruda.devolucionesPct);
  const o = esObj(cruda.objetivo) ? cruda.objetivo : {};
  const objetivo = {
    margenPct: o.margenPct === undefined || o.margenPct === null ? null : fraccion('objetivo.margenPct', o.margenPct),
    gananciaUnidad: o.gananciaUnidad === undefined || o.gananciaUnidad === null ? null : dinero('objetivo.gananciaUnidad', o.gananciaUnidad, { min: -MAX_DINERO }),
    gananciaMes: o.gananciaMes === undefined || o.gananciaMes === null ? null : dinero('objetivo.gananciaMes', o.gananciaMes),
  };
  const fijosMes = dinero('fijosMes', cruda.fijosMes);

  const ok = errores.length === 0;
  const entrada = ok ? {
    precio, unidades,
    fiscal: { regimen, ivaProducto, ivaServicios },
    costo: { producto, ivaIncluido: costoIvaIncluido, ivaCompra, extras: extras.map(x => ({ nombre: x.nombre, monto: x.monto, ivaIncluido: x.ivaIncluido })) },
    canal: { ventaPct, financiacionPct, fijo, envio, ivaModo: canalIvaModo },
    publicidad: { acos, ventasPorAdsPct, base, ivaModo: adsIvaModo },
    impuestosVentaPct, devolucionesPct, objetivo, fijosMes,
  } : null;
  return { ok, entrada, errores, advertencias, supuestos };
}
