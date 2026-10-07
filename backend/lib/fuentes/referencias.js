// fuentes/referencias.js — valores de REFERENCIA con su procedencia. Son datos para SUGERIR en una interfaz, nunca para suponer.
//
// REGLA: el motor económico (backend/lib/motor) no importa este archivo ni contiene estos números. Una interfaz puede pre-llenar un campo
// con una referencia solo si lo marca como «orientativo» y deja que el usuario lo confirme o lo cambie. Un test lo verifica.
//
// estado:
//   documentado             tiene una fuente identificable (norma, resolución) y fecha de revisión
//   historico_sin_verificar valor que el código viejo ya traía; no sabemos con qué criterio se eligió ni cuándo
//   ejemplo                 número inventado a propósito para mostrar cómo funciona una pantalla
//   observado_api           leído de la API oficial en una fecha y para un caso concreto; NO es una regla general
//   supuesto_sin_verificar  hipótesis de modelado que el código viejo daba por cierta sin comprobarla

export const ESTADOS = ['documentado', 'historico_sin_verificar', 'ejemplo', 'observado_api', 'supuesto_sin_verificar'];

export const REFERENCIAS = [
  { id: 'iva_general', concepto: 'Alícuota general del IVA', valor: 0.21, unidad: 'fracción', estado: 'documentado',
    fuente: 'Ley 23.349 de IVA (alícuota general). Usada en importar.js como IVA_ML y IVA_LOCAL.', revisado: '2026-09',
    nota: 'Hay alícuotas reducidas (p. ej. 10,5%) que dependen del producto: el motor las recibe como dato.' },

  { id: 'comision_clasica', concepto: 'Comisión del marketplace, publicación Clásica', valor: 0.14, unidad: 'fracción del precio', estado: 'historico_sin_verificar',
    fuente: 'frontend/data/importacion.json › mercadolibre.comision_clasica (valor de la calculadora de importación)', revisado: '2026-09',
    nota: 'El propio archivo dice: «orientativas: dependen de la categoría y cambian seguido». Coincide con lo observado en una categoría (ver observaciones), no es general.' },
  { id: 'comision_premium', concepto: 'Comisión del marketplace, publicación Premium', valor: 0.29, unidad: 'fracción del precio', estado: 'historico_sin_verificar',
    fuente: 'frontend/data/importacion.json › mercadolibre.comision_premium', revisado: '2026-09',
    nota: 'INFERENCIA: 29% está entre lo observado en dos categorías (27,4% y 29,4%), que INCLUYEN la financiación. Entonces parece un total (venta + financiación), y el campo «cuotas» de importar.js sumado a este valor podría contar la financiación dos veces.' },
  { id: 'iibb_venta', concepto: 'Ingresos Brutos sobre la venta', valor: 0.035, unidad: 'fracción del ingreso neto', estado: 'historico_sin_verificar',
    fuente: 'frontend/data/importacion.json › mercadolibre.iibb_venta', revisado: '2026-09',
    nota: 'Depende de la jurisdicción y del régimen del vendedor. No hay fuente citada.' },
  { id: 'tipo_cambio_ejemplo', concepto: 'Tipo de cambio de la calculadora', valor: 1450, unidad: 'ARS por USD', estado: 'ejemplo',
    fuente: 'frontend/data/importacion.json › tipo_cambio_ejemplo', revisado: '2026-09',
    nota: 'Se actualiza a mano y envejece rápido. Nunca debe ser un default del motor.' },
  { id: 'alicuotas_importacion_por_rubro', concepto: 'Derechos, tasa de estadística, IVA, percepciones por rubro', valor: null, unidad: 'ver archivo', estado: 'documentado',
    fuente: 'frontend/data/importacion.json › categorias (fuente citada en _fuente: ARCA, RG 2937, RG 2281, SIRPEI); derecho de importación = valor típico por rubro a confirmar por NCM', revisado: '2026-09',
    nota: 'Pertenecen al costo de IMPORTACIÓN, que el motor no modela todavía (lo aportará un adaptador de importación). No se duplican acá.' },

  { id: 'cargos_con_iva_incluido', concepto: 'Los cargos del marketplace (comisión, cuotas, envío, cargo fijo) ya vienen con IVA incluido', valor: 'incluido', unidad: 'tratamiento de IVA', estado: 'supuesto_sin_verificar',
    fuente: 'importar.js: IVA_ML = 0.21 y el factor kML (un RI divide esos cargos por 1,21; un no inscripto los toma tal cual)', revisado: '2026-10',
    nota: 'ES EL SUPUESTO CON MÁS IMPACTO. Con el ejemplo de la calculadora, si fuera «adicional» la ganancia por unidad pasaría de $4.405 a $1.024 (no RI) y de $6.186 a $3.392 (RI). Se resuelve contrastando con el detalle de una venta real.' },

  // Lo observado en la API oficial (GET /sites/MLA/listing_prices), 02/10/2026, con el token de la cuenta de prueba. Son casos, no reglas.
  { id: 'obs_MLA1574_clasica', concepto: 'Categoría MLA1574, publicación Clásica (gold_special)', valor: { ventaPct: 0.14, financiacionPct: 0, fijoSegunPrecio: [[3000, 1330], [8000, 1330], [15000, 2740]] }, unidad: 'fracción y pesos', estado: 'observado_api',
    fuente: 'GET /sites/MLA/listing_prices?price={3000|8000|15000}&category_id=MLA1574', revisado: '2026-10-02',
    nota: 'El cargo fijo cambia con el precio (escalonado). No se conocen los cortes exactos entre 8.000 y 15.000.' },
  { id: 'obs_MLA1574_premium', concepto: 'Categoría MLA1574, publicación Premium (gold_pro)', valor: { ventaPct: 0.14, financiacionPct: 0.134, totalPct: 0.274, fijoSegunPrecio: [[3000, 1330], [8000, 1330], [15000, 2740]] }, unidad: 'fracción y pesos', estado: 'observado_api',
    fuente: 'GET /sites/MLA/listing_prices (percentage_fee 27,4 = meli_percentage_fee 14 + financing_add_on_fee 13,4)', revisado: '2026-10-02',
    nota: 'La Premium INCLUYE la financiación en su porcentaje.' },
  { id: 'obs_MLA3530_clasica', concepto: 'Categoría MLA3530, publicación Clásica (gold_special)', valor: { ventaPct: 0.16, financiacionPct: 0, fijoSegunPrecio: [[45000, 0]] }, unidad: 'fracción y pesos', estado: 'observado_api',
    fuente: 'GET /sites/MLA/listing_prices?price=45000&category_id=MLA3530', revisado: '2026-10-02', nota: 'Otra categoría: distinto porcentaje y sin cargo fijo a ese precio.' },
  { id: 'obs_MLA3530_premium', concepto: 'Categoría MLA3530, publicación Premium (gold_pro)', valor: { ventaPct: 0.16, financiacionPct: 0.134, totalPct: 0.294, fijoSegunPrecio: [[45000, 0]] }, unidad: 'fracción y pesos', estado: 'observado_api',
    fuente: 'GET /sites/MLA/listing_prices?price=45000&category_id=MLA3530', revisado: '2026-10-02', nota: 'Premium = 16% + 13,4% de financiación.' },
];

/** Supuestos implícitos de importar.js que NO son un valor numérico sino una forma de modelar (se documentan, no se copian al motor). */
export const SUPUESTOS_IMPLICITOS_IMPORTAR = [
  { id: 'valores_invalidos_a_cero', texto: 'Un número mal escrito o negativo se convierte en 0 en silencio (leer(): «malo ? 0»), aunque el campo se marca como inválido.', motor: 'El motor lo rechaza con un error por campo.' },
  { id: 'sin_precio_no_hay_resultado', texto: 'Con precio 0 calcula todo y la interfaz muestra «—».', motor: 'El motor exige precio > 0 (PRECIO_INVALIDO).' },
  { id: 'cargos_que_suman_100', texto: 'Comisión + cuotas ≥ 100% se calcula igual (ganancia absurda, precio mínimo NaN).', motor: 'El motor lo rechaza (PORCENTAJE_FUERA_DE_RANGO).' },
  { id: 'responsable_inscripto_apagado', texto: 'El interruptor «Soy responsable inscripto» arranca apagado: por defecto se calcula como si el IVA fuera costo.', motor: 'El régimen es obligatorio y sin default (la interfaz podrá preseleccionar monotributo, pero visible y editable).' },
  { id: 'ri_tributos_a_cuenta', texto: 'Para un RI, el IVA, el IVA adicional y las percepciones de aduana y de gastos locales NO son costo (se recuperan o compensan).', motor: 'Parte del costo de importación: fuera del motor por ahora.' },
  { id: 'premium_mas_cuotas', texto: 'Comisión Premium (29%) y «cuotas sin interés» son dos campos que se suman.', motor: 'El motor suma venta% + financiación% sin saber qué es «Premium»; avisar del posible doble conteo es tarea de la interfaz o del adaptador.' },
];
