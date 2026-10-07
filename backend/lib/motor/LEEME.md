# Motor económico

Cálculo determinístico de la economía por unidad de un producto vendido. **Una sola fuente**: estos archivos. Se ejecutan tal cual en Node (servidor y tests) y en el navegador. No hay una segunda implementación en `frontend/`.

| Archivo | Rol |
|---|---|
| `validar.js` | valida y normaliza la entrada; nunca lanza |
| `economia.js` | `evaluar()`: ganancia, margen, markup y desglose de costos |
| `inversas.js` | precio piso, ACOS de equilibrio, costo máximo del proveedor, unidades |
| `escenarios.js` | «¿qué pasa si…?»: cambios, comparación y barridos (sin fórmulas propias) |
| `supuestos.js` | registro de lo obligatorio y de los defaults (datos; un test lo contrasta con `validar`) |
| `version.js` | `MOTOR_VERSION`, que viaja dentro de cada resultado |
| `vista.js` | **presentación**: da formato (es-AR, sin Intl) a lo que el motor ya calculó y arma el resumen guardable. **No calcula nada**: lo vigilan una prueba con resultados inventados y una regla estática |

**Reglas de capas** (las verifica `backend/test/economia.test.mjs`): estos archivos solo se importan entre sí con `./x.js` (`vista.js` solo toma `redondear` de `economia.js`); no usan Node, red, DOM, reloj ni azar; no mencionan ningún marketplace ni la IA. Los valores de referencia (comisiones, impuestos, tipo de cambio) viven fuera, en `backend/lib/fuentes/`.

## Cómo llega al navegador

- **Servidor y tests:** se importan como `../lib/motor/x.js` (en Vercel, `lib/` viaja completo).
- **Local:** `tools/dev-server.mjs` sirve `/js/motor/*.js` leyendo `backend/lib/motor/` (solo `[a-z]+.js`).
- **Deploy:** `tools/build-deploy.py` copia `backend/lib/motor/*.js` a `public/js/motor/` (sin `*.md`). La copia es del build; el repo no guarda ninguna.
- **Uso en una página:** `<script type="module">import { evaluar } from '/js/motor/economia.js'</script>`.

Navegadores: usa `structuredClone` (Chrome 98+, Firefox 94+, Safari 15.4+).

## Cómo se verifica

- `node --test backend/test/` — suite determinista (incluye `motor-plomeria.test.mjs`).
- `python3 tools/paridad-navegador.py` — ejecuta 224 casos en Node, Chromium y Firefox, contra el servidor local y contra el build real, y compara hasta el último decimal. `--autoprueba` verifica que la comparación detecta una copia rota.

## Cómo se usa desde el servidor (S6)

`POST /api/herramientas?action=calcular` con `{ entrada }` → `lib/rentabilidad.js › calcularYGuardar`: valida y **recalcula todo desde cero** (jamás lee métricas del cliente), arma el resumen con `vista.js` y lo guarda con la infraestructura de resultados de F0 (`lib/resultados.js`, link `?r=`, métricas, límite de 30 por hora por IP).

Lo que queda guardado en `resultados.datos`: `motor` (versión), `entradaDeclarada` (lo que el usuario declaró, podado a los campos que el motor reconoce), `entrada` (normalizada), `resultado` (la salida de `evaluar` sin repetir la entrada) y `objetivos` (la salida de `resolverObjetivos`). Con `entradaDeclarada` + `motor.version` se reproduce el resultado completo, incluidos supuestos y avisos; la entrada normalizada reproduce los números pero no los supuestos (ya los trae como si fueran declarados).
