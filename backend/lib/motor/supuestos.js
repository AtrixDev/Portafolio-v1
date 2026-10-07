// motor/supuestos.js — registro de lo que el motor EXIGE y de lo que SUPONE cuando falta un dato. Son solo datos (no se ejecuta lógica).
// No sustituye a validar.js: describe su comportamiento y un test lo contrasta campo por campo, para que esta documentación no pueda
// decir una cosa mientras el código hace otra. Si cambia validar.js, este registro y su test fallan hasta que se actualicen a propósito.
//
// clase de un default:
//   neutro          no cambia el cálculo por unidad
//   hecho_legal     es una norma, no una opinión (alícuota general del IVA)
//   conservador     el peor caso razonable, elegido para no sobreestimar la ganancia
//   cero            «no declaraste nada, se toma 0»: puede subestimar un costo
// registrado:  ¿queda anotado en `supuestos` del resultado cuando se usa?   aviso: código de advertencia que dispara (o null)
// brecha:      true = default que afecta el resultado en pesos y NO deja rastro (ni supuesto ni aviso). Se documenta, no se oculta.

/** Datos sin los cuales no hay resultado: faltar es un error, nunca un default. */
export const OBLIGATORIOS = [
  { campo: 'precio', cuando: 'siempre', codigo: 'CAMPO_REQUERIDO' },
  { campo: 'costo.producto', cuando: 'siempre (costoMaximoProveedor lo reemplaza por 0 porque es lo que averigua)', codigo: 'CAMPO_REQUERIDO' },
  { campo: 'fiscal.regimen', cuando: 'siempre', codigo: 'REGIMEN_INVALIDO' },
  { campo: 'canal.ivaModo', cuando: 'hay comisión, financiación, cargo fijo o envío y el régimen es ri o monotributo', codigo: 'IVA_MODO_REQUERIDO' },
  { campo: 'costo.ivaIncluido', cuando: 'hay costo (producto o extras) y el régimen es ri o monotributo', codigo: 'IVA_COSTO_REQUERIDO' },
  { campo: 'publicidad.ivaModo', cuando: 'ACOS × participación > 0 y el régimen es ri o monotributo', codigo: 'IVA_MODO_REQUERIDO' },
];

/** Lo que el motor supone si el dato no está. */
export const DEFAULTS = [
  { campo: 'unidades', valor: 1, clase: 'neutro', afecta: 'solo la ganancia total', registrado: true, aviso: null, brecha: false, cuando: 'siempre' },
  { campo: 'fiscal.ivaProducto', valor: 0.21, clase: 'hecho_legal', afecta: 'ingreso neto de un RI', registrado: true, aviso: null, brecha: false, cuando: 'régimen ri', fuente: 'Alícuota general del IVA (Ley 23.349)' },
  { campo: 'costo.ivaCompra', valor: 0.21, clase: 'hecho_legal', afecta: 'costo del producto', registrado: true, aviso: null, brecha: false, cuando: 'la alícuota influye: ri con costo «incluido» o monotributo con costo «sin IVA»', fuente: 'Alícuota general del IVA (Ley 23.349)' },
  { campo: 'fiscal.ivaServicios', valor: 0.21, clase: 'hecho_legal', afecta: 'cargos del canal y publicidad', registrado: true, aviso: null, brecha: false, cuando: 'la alícuota influye: ri con cargos «incluido» o monotributo con cargos «adicional»', fuente: 'Alícuota general del IVA (Ley 23.349)' },
  { campo: 'publicidad.ventasPorAdsPct', valor: 1, clase: 'conservador', afecta: 'gasto en publicidad por unidad', registrado: true, aviso: null, brecha: false, cuando: 'ACOS > 0', nota: 'Supone que TODAS las ventas vienen de publicidad: el caso más caro.' },
  { campo: 'publicidad.base', valor: 'precio', clase: 'neutro', afecta: 'gasto en publicidad por unidad', registrado: true, aviso: null, brecha: false, cuando: 'ACOS > 0' },
  { campo: 'impuestosVentaPct', valor: 0, clase: 'cero', afecta: 'ganancia por unidad', registrado: false, aviso: 'IMPUESTOS_NO_DECLARADOS', brecha: false, cuando: 'el campo no está' },
  { campo: 'canal', valor: 0, clase: 'cero', afecta: 'ganancia por unidad (comisión, financiación, cargo fijo y envío en 0)', registrado: false, aviso: 'CANAL_NO_DECLARADO', brecha: false, cuando: 'no hay bloque canal' },

  // ── BRECHAS: valores 0 que cambian el resultado y no dejan rastro. Se mantienen tal cual (S1 está congelado) y quedan a la vista. ──
  { campo: 'canal.ventaPct', valor: 0, clase: 'cero', afecta: 'ganancia por unidad', registrado: false, aviso: null, brecha: true, cuando: 'canal declarado sin este campo' },
  { campo: 'canal.financiacionPct', valor: 0, clase: 'cero', afecta: 'ganancia por unidad', registrado: false, aviso: null, brecha: true, cuando: 'canal declarado sin este campo' },
  { campo: 'canal.fijo', valor: 0, clase: 'cero', afecta: 'ganancia por unidad', registrado: false, aviso: null, brecha: true, cuando: 'canal declarado sin este campo' },
  { campo: 'canal.envio', valor: 0, clase: 'cero', afecta: 'ganancia por unidad', registrado: false, aviso: null, brecha: true, cuando: 'canal declarado sin este campo' },
  { campo: 'devolucionesPct', valor: 0, clase: 'cero', afecta: 'ganancia por unidad', registrado: false, aviso: null, brecha: true, cuando: 'el campo no está' },
  { campo: 'publicidad.acos', valor: 0, clase: 'cero', afecta: 'ganancia por unidad (equivale a «no hago publicidad»)', registrado: false, aviso: null, brecha: true, cuando: 'el campo no está' },
  { campo: 'costo.extras', valor: [], clase: 'cero', afecta: 'costo del producto', registrado: false, aviso: null, brecha: true, cuando: 'el campo no está' },
  { campo: 'fijosMes', valor: 0, clase: 'cero', afecta: 'unidades de equilibrio (con 0 el equilibrio es 0 unidades)', registrado: false, aviso: null, brecha: true, cuando: 'el campo no está' },
];

/** Campos opcionales cuya ausencia no es una suposición: «no hay objetivo» se representa con null. */
export const OPCIONALES_SIN_EFECTO = ['objetivo.margenPct', 'objetivo.gananciaUnidad', 'objetivo.gananciaMes'];

/** Valores que el motor jamás aplica por su cuenta (viven en fuentes/referencias.js como sugerencias de interfaz). */
export const NUNCA_POR_DEFECTO = ['precio', 'costo.producto', 'comisión del canal', 'cargo fijo y envío', 'tipo de cambio', 'régimen fiscal', 'tratamiento del IVA de los cargos', 'ACOS'];
