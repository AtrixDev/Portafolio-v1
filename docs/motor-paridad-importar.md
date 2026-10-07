# Paridad: importar.js contra el motor económico nuevo

> Generado por `node tools/paridad-importar.mjs --escribir`. No se edita a mano: cada número sale de la ejecución.

## Qué se compara y cómo

- **importar.js no se modifica.** Se ejecuta su función `modelo()` REAL (el texto del archivo, extraído y evaluado). Verificado: da los mismos números, hasta el último decimal, que la página abierta en un navegador (`window.__importar.modelo`).
- **Se compara la parte de VENTA** (qué queda de cada venta en el marketplace). El motor recibe como DATO el costo por unidad que calculó importar.js.
- **La parte de COSTO de importación no se compara** porque el motor no la modela (la aportará un adaptador de importación en una etapa posterior). Ver «Lo que no se compara».
- **419 casos:** 19 armados a mano (rubros con IVA 21% y 10,5%, RI y no RI, Clásica y Premium, con y sin cuotas y cargo fijo, ventas a pérdida, objetivos de margen alcanzables e inalcanzables, y los casos límite) y 400 con semilla fija.
- **Traducción de datos** (el mismo mapeo en todos los casos): régimen = RI → `ri`, si no `monotributo`; IVA del producto = el IVA del rubro; comisión → `canal.ventaPct`; cuotas → `canal.financiacionPct`; envío y cargo fijo → `canal.envio` y `canal.fijo`; Ingresos Brutos de la venta → `impuestosVentaPct`; **los cargos del marketplace se declaran con IVA «incluido»** (es lo que importar.js supone, ver «Supuestos»); el costo por unidad entra sin IVA recuperable si es RI y con todos los tributos si no lo es.

## Resultado

**Los 14 conceptos de venta coinciden en los 417 casos comparables.** El motor rechaza 2 entradas que importar.js acepta (ver abajo). La paridad vale **bajo la hipótesis de que los cargos del marketplace ya incluyen IVA**, que importar.js asume y nadie verificó.

| Concepto | Casos | Coinciden | Máx. diferencia | Resultado |
|---|---|---|---|---|
| Ingreso neto (precio sin IVA) | 417 | 417 | 0 | Coincide en todos |
| IVA de la venta | 417 | 417 | 0 | Coincide en todos |
| Comisión | 417 | 417 | 0 | Coincide en todos |
| Cuotas / financiación | 417 | 417 | 0 | Coincide en todos |
| Envío | 417 | 417 | 0 | Coincide en todos |
| Cargo fijo | 417 | 417 | 0 | Coincide en todos |
| Ingresos Brutos de la venta | 417 | 417 | 0 | Coincide en todos |
| Costo por unidad (dato de entrada) | 417 | 417 | 0 | Coincide en todos |
| Ganancia por unidad | 417 | 417 | < 0,000001 | Coincide en todos |
| Margen (sobre ingreso neto) | 417 | 417 | < 0,000001 | Coincide en todos |
| Markup (sobre costo) | 417 | 417 | < 0,000001 | Coincide en todos |
| Ganancia total | 417 | 417 | < 0,000001 | Coincide en todos |
| Precio mínimo (ganancia 0), al peso hacia arriba | 417 | 417 | 0 | Coincide en todos |
| Precio para el margen objetivo, al peso hacia arriba | 417 | 417 | 0 | Coincide en todos |

## Caso base: el ejemplo con el que arranca la página (no inscripto)

| Concepto | importar.js | Motor nuevo | ¿Coincide? | Diferencia |
|---|---|---|---|---|
| Ingreso neto (precio sin IVA) | 39.999 | 39.999 | Sí | 0 |
| IVA de la venta | 0 | 0 | Sí | 0 |
| Comisión | 11.599,71 | 11.599,71 | Sí | 0 |
| Cuotas / financiación | 0 | 0 | Sí | 0 |
| Envío | 4.500 | 4.500 | Sí | 0 |
| Cargo fijo | 0 | 0 | Sí | 0 |
| Ingresos Brutos de la venta | 1.399,965 | 1.399,965 | Sí | 0 |
| Costo por unidad (dato de entrada) | 18.093,97495 | 18.093,97495 | Sí | 0 |
| Ganancia por unidad | 4.405,35005 | 4.405,35005 | Sí | < 0,000001 (ruido de punto flotante) |
| Margen (sobre ingreso neto) | 0,110137 | 0,110137 | Sí | < 0,000001 (ruido de punto flotante) |
| Markup (sobre costo) | 0,243471 | 0,243471 | Sí | < 0,000001 (ruido de punto flotante) |
| Ganancia total | 2.202.675,025 | 2.202.675,025 | Sí | < 0,000001 (ruido de punto flotante) |
| Precio mínimo (ganancia 0), al peso hacia arriba | 33.473 | 33.473 | Sí | 0 |
| Precio para el margen objetivo, al peso hacia arriba | 47.567 | 47.567 | Sí | 0 |

## El mismo ejemplo como responsable inscripto

| Concepto | importar.js | Motor nuevo | ¿Coincide? | Diferencia |
|---|---|---|---|---|
| Ingreso neto (precio sin IVA) | 33.057,024793 | 33.057,024793 | Sí | 0 |
| IVA de la venta | 6.941,975207 | 6.941,975207 | Sí | 0 |
| Comisión | 9.586,53719 | 9.586,53719 | Sí | 0 |
| Cuotas / financiación | 0 | 0 | Sí | 0 |
| Envío | 3.719,008264 | 3.719,008264 | Sí | 0 |
| Cargo fijo | 0 | 0 | Sí | 0 |
| Ingresos Brutos de la venta | 1.156,995868 | 1.156,995868 | Sí | 0 |
| Costo por unidad (dato de entrada) | 12.408,01 | 12.408,01 | Sí | 0 |
| Ganancia por unidad | 6.186,473471 | 6.186,473471 | Sí | < 0,000001 (ruido de punto flotante) |
| Margen (sobre ingreso neto) | 0,187146 | 0,187146 | Sí | < 0,000001 (ruido de punto flotante) |
| Markup (sobre costo) | 0,498587 | 0,498587 | Sí | < 0,000001 (ruido de punto flotante) |
| Ganancia total | 3.093.236,735537 | 3.093.236,735537 | Sí | < 0,000001 (ruido de punto flotante) |
| Precio mínimo (ganancia 0), al peso hacia arriba | 28.910 | 28.910 | Sí | 0 |
| Precio para el margen objetivo, al peso hacia arriba | 41.082 | 41.082 | Sí | 0 |

## Entradas que el motor rechaza y importar.js acepta

| Caso | Qué hace importar.js | Qué hace el motor | Clasificación |
|---|---|---|---|
| Sin precio cargado (la página muestra «—») | Calcula todo con ingreso 0 y la pantalla muestra «—» (ganancia -22.593,97495) | Rechaza la entrada: PRECIO_INVALIDO | Diferencia legítima: el motor exige un precio > 0; para importar.js «0» significa «todavía no cargó el precio» |
| Comisión + cuotas ≥ 100% | Calcula igual: ganancia -27.993,83995 y precio mínimo sin valor | Rechaza la entrada: PORCENTAJE_FUERA_DE_RANGO | Diferencia legítima: una comisión + financiación de 100% o más no tiene sentido económico; el motor lo informa en vez de devolver un número absurdo |

Además, importar.js convierte en silencio cualquier número mal escrito o negativo en 0 (`leer()`); el motor lo rechaza con un error por campo. No es comparable numéricamente: es otra política de validación.

## Lo que no se compara (costo de importación)

| Concepto de importar.js | Cómo se calcula |
|---|---|
| Mercadería (FOB) | unidades × FOB |
| Flete internacional | total, por kilo o por m³ |
| Seguro | % sobre FOB + flete |
| Valor en aduana (CIF) | FOB + flete + seguro |
| Derecho de importación | % sobre CIF |
| Tasa de estadística | % sobre CIF |
| IVA, IVA adicional, percepción de Ganancias, percepción de IIBB | % sobre CIF + derechos + tasa |
| Despachante, terminal, depósito y flete local | montos en pesos |
| IVA de los gastos locales | 21% de los gastos locales |
| Tipo de cambio | ARS por USD |
| Costo por unidad puesto en el depósito | suma de todo lo anterior ÷ unidades; con el tratamiento RI / no RI |

Todo esto vive hoy solo en importar.js. Para que el motor lo reemplace hará falta un adaptador de importación (etapa posterior, con su propia paridad).

## Supuestos de importar.js que la paridad NO prueba

**1. Los cargos del marketplace ya vienen con IVA incluido.** importar.js divide comisión, cuotas, envío y cargo fijo por 1,21 si el usuario es RI y los toma tal cual si no. Si el marketplace los cotizara SIN IVA (el IVA se suma aparte), la ganancia del ejemplo cambiaría así:

| Régimen | importar.js | Motor, cargos «incluido» | Motor, cargos «adicional» | Diferencia por el supuesto |
|---|---|---|---|---|
| Monotributo / no inscripto | 4.405,35 | 4.405,35 | 1.024,41 | 3.380,94 |
| Responsable inscripto | 6.186,47 | 6.186,47 | 3.392,31 | 2.794,16 |

Es el supuesto de mayor impacto y no está verificado. Se resuelve contrastando con el detalle de una venta real (pendiente).

**2. Posible doble conteo de la financiación.** importar.js usa 29% para Premium y además ofrece el campo «cuotas sin interés». Lo observado en la API oficial el 02/10/2026 (dos categorías) es que el porcentaje Premium **ya incluye** la financiación (27,4% = 14% + 13,4%; 29,4% = 16% + 13,4%). Si alguien carga una comisión Premium tomada de la publicación y además completa «cuotas», la financiación se cuenta dos veces. Con el ejemplo, cargar 13.4% de cuotas bajaría la ganancia por unidad de 4.405,35 a -954,52. Es una inferencia sobre cómo se carga el dato, no un error de cálculo; el motor solo suma venta% + financiación% y no sabe qué es «Premium».

**3. El responsable inscripto arranca apagado**, o sea que por defecto el IVA se trata como costo. En el motor el régimen es obligatorio y no tiene default.

## ¿De quién es cada diferencia?

| Hallazgo | ¿Motor mal? | ¿Supuesto distinto de importar.js? | ¿Diferencia conceptual legítima? | ¿Falta información? |
|---|---|---|---|---|
| Ventas: 14 conceptos | No (coincide) | No | — | — |
| Precio 0 | No | No | Sí (el motor exige precio > 0) | No |
| Comisión + cuotas ≥ 100% | No | No | Sí (el motor rechaza lo absurdo) | No |
| Números inválidos → 0 | No | Sí (importar.js los fuerza a 0) | Sí (otra política de validación) | No |
| Costo de importación | — | — | No se compara | Falta el adaptador |
| IVA incluido / adicional en los cargos | No (parametrizado) | **Sí: importar.js lo da por cierto** | — | **Sí: falta una venta real** |
| Doble conteo de financiación | No | Posible (dato de entrada) | — | Sí (cómo se carga) |
