# Defaults y supuestos: importar.js y el motor económico (S4)

Auditoría hecha leyendo el código real (`frontend/js/importar.js`, `frontend/data/importacion.json`, `frontend/importar.html`) y el motor (`backend/lib/motor/validar.js`). Lo que dice este documento está respaldado por tests: `backend/test/supuestos.test.mjs` contrasta el registro con el comportamiento real, y `backend/test/paridad-importar.test.mjs` ejecuta el modelo real de importar.js. Los números de la paridad están en `docs/motor-paridad-importar.md`.

## 1. Qué asume importar.js

| Dónde | Valor o regla | Clase | ¿Mueve el resultado en pesos? | Qué hace el motor nuevo |
|---|---|---|---|---|
| `importar.js` | `IVA_ML = 0.21`, `IVA_LOCAL = 0.21` | Hecho legal (alícuota general, Ley 23.349) | Sí | El 21% es el único default del motor, y queda anotado en `supuestos` solo cuando influye. |
| `importar.js` | Los cargos del marketplace (comisión, cuotas, envío, cargo fijo) **ya incluyen el IVA**: un RI los divide por 1,21, un no inscripto los toma tal cual | **Supuesto histórico sin verificar** | **Sí, mucho** | El tratamiento es un campo **obligatorio y sin default** (`canal.ivaModo`). La paridad se hizo declarándolo «incluido». |
| `importar.js` (`leer()`) | Un número mal escrito o negativo se convierte en 0 en silencio | Supuesto de código | Sí | El motor lo rechaza con un error por campo. |
| `importar.js` | Con precio 0 calcula todo y muestra «—» | Convención de pantalla | No | El motor exige precio > 0. |
| `importar.js` | Comisión + cuotas ≥ 100% se calcula igual | Sin validar | Sí | El motor lo rechaza. |
| `importar.js` | Para un RI, el IVA, el IVA adicional y las percepciones de aduana y de gastos locales **no son costo** | Modelo del costo de importación | Sí | Fuera de alcance: lo aportará un adaptador de importación. |
| `importacion.json` | Alícuotas por rubro: derecho, tasa de estadística, IVA, IVA adicional, Ganancias, IIBB de aduana | **Documentado** (ARCA, revisado 2026-09; el derecho es «valor típico, a confirmar por NCM») | Sí | Costo de importación: no se duplica en el motor. |
| `importacion.json` | Comisión Clásica 14%, Premium 29%, Ingresos Brutos de la venta 3,5% | **Histórico sin verificar** («orientativas, dependen de la categoría y cambian seguido») | Sí | **Nunca** son un default del motor. Viven como referencias de interfaz (`backend/lib/fuentes/referencias.js`). |
| `importacion.json` | Tipo de cambio 1.450 | Ejemplo | Sí | Nunca es un default. |
| `importacion.json` | Caso de ejemplo (precio 39.999, envío 4.500, cuotas 0, cargo fijo 0, margen objetivo 20%…) | Ejemplo inventado a propósito | — | Solo sirve como caso de prueba. |
| `importar.html` / `importar.js` | El interruptor «responsable inscripto» arranca **apagado**; arranca en Premium | Default de interfaz | Sí | El régimen es obligatorio. Una interfaz podrá preseleccionar monotributo, visible y editable. |

## 2. Qué exige y qué supone el motor nuevo

Está en `backend/lib/motor/supuestos.js` (datos puros) y un test lo contrasta campo por campo con `validar`.

**Obligatorio, sin default (faltar es un error):** `precio`, `costo.producto`, `fiscal.regimen`; y, cuando el régimen es `ri` o `monotributo` y hay algo a lo que aplicarlo: `canal.ivaModo`, `costo.ivaIncluido`, `publicidad.ivaModo`.

**Default registrado (queda en `supuestos` del resultado, solo si se usa):**
- `unidades` = 1
- IVA de producto, de compra y de servicios = 21%
- `ventasPorAdsPct` = 100% (el caso más caro)
- `publicidad.base` = precio

**Default con advertencia:** `impuestosVentaPct` ausente → 0 con `IMPUESTOS_NO_DECLARADOS`; sin bloque `canal` → todo 0 con `CANAL_NO_DECLARADO` (severidad alta).

**Nunca por defecto:** precio, costo, comisión, cargo fijo y envío, tipo de cambio, régimen fiscal, tratamiento del IVA de los cargos, ACOS.

## 3. Brecha encontrada en el propio motor (S1)

Hay defaults en 0 que cambian la ganancia en pesos y **no dejan supuesto ni advertencia**:

| Campo | Cuándo | Efecto |
|---|---|---|
| `canal.ventaPct`, `canal.financiacionPct`, `canal.fijo`, `canal.envio` | el canal se declaró pero falta el campo | ganancia sobreestimada |
| `devolucionesPct` | el campo no está | ganancia sobreestimada |
| `publicidad.acos` | el campo no está | equivale a «no hago publicidad» |
| `costo.extras` | el campo no está | costo subestimado |
| `fijosMes` | el campo no está | el punto de equilibrio sale en 0 unidades |

No se corrigió (S1 está congelado por pedido): un test (`BRECHAS CONOCIDAS`) fija el comportamiento actual para que cambiarlo sea una decisión explícita. **Propuesta, pendiente de aprobación:** que `validar` agregue a `supuestos` una línea «no declaraste X: se tomó 0» cuando el campo está **ausente** (no cuando es un 0 declarado).

## 4. Cómo se evita que un default se vuelva «verdad»

1. Cada default que influye queda anotado en el `supuestos` del resultado, con su valor y su razón.
2. Lo que no se puede suponer es obligatorio; si falta, hay un error con código estable.
3. Los valores de referencia (comisiones, IIBB, tipo de cambio, lo observado en la API) están **fuera del motor**, con estado y fecha. Un test verifica que el motor no los importe ni contenga esos números, y que sin comisión declarada se tome 0 y se avise, nunca 14% ni 29%.
4. Si alguien cambia un default en `validar.js` (por ejemplo la alícuota o las unidades), el test del registro falla hasta actualizar el registro a propósito.
5. Si cambia `importar.js` o el motor, la paridad se rompe (verificado con mutaciones en ambos lados).

## 5. Lo que sigue abierto

- **Falta una venta real** para saber si los cargos del marketplace vienen con IVA incluido o aparte. Con el ejemplo de la calculadora cambia la ganancia por unidad de $4.405 a $1.024 (no RI) y de $6.186 a $3.392 (RI).
- **Posible doble conteo de la financiación** en importar.js: lo observado el 02/10/2026 es que la comisión Premium ya incluye las cuotas.
- El costo de importación (CIF, derechos, percepciones, gastos locales) no está en el motor.
