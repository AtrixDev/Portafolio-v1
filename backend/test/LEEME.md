# Pruebas de F0 / F0.1

## Suite del repo: 15 pruebas deterministas (`f0.test.mjs`)

```
node --test backend/test/f0.test.mjs      # esperado: tests 15 · pass 15 · fail 0
```

- No usan red, ni Mongo, ni Mercado Libre, ni reloj. Usan una base falsa en memoria y objetos fijos.
- Por eso no tienen estado previo ni fallas intermitentes: si una falla, es un error real.
- Cubren: IA con y sin clave (fallback obligatorio), que ninguna herramienta dependa de Groq, resultados (guardar/leer/validar), y F0.1 (sin score con poca evidencia, cobertura, plan honesto, resumen idéntico al guardado).

## Motor económico (S1 a S6)

```
node --test backend/test/economia.test.mjs          # 25 · validar + evaluar + capas
node --test backend/test/inversas.test.mjs          # 30 · precio piso, ACOS, costo máximo, unidades
node --test backend/test/escenarios.test.mjs        # 24 · escenarios, comparación y barridos
node --test backend/test/supuestos.test.mjs         # 10 · defaults y obligatorios documentados == comportamiento real
node --test backend/test/paridad-importar.test.mjs  # 12 · paridad con el modelo REAL de importar.js
node --test backend/test/motor-plomeria.test.mjs    #  8 · una sola fuente servida a Node y navegador, sin duplicar
node --test backend/test/vista.test.mjs             # 12 · la presentación formatea y NO calcula
node --test backend/test/calcular.test.mjs          # 16 · POST calcular: valida, recalcula, persiste, link, versión
node --test backend/test/                           # todas: tests 152 · pass 152 · fail 0
```

Misma regla: puras y deterministas (sin red, base, reloj ni azar; las pruebas «aleatorias» usan semilla fija). Los valores esperados están calculados a mano en los comentarios. `calcular.test.mjs` ejercita `manejar()` (la lógica real del endpoint) con una base en memoria; `motor-plomeria` levanta un `dev-server` local en un puerto libre, sin navegador.

- **Paridad con importar.js:** ejecuta el `modelo()` real de `frontend/js/importar.js` (sin modificarlo). `docs/motor-paridad-importar.md` se genera con `node tools/paridad-importar.mjs --escribir` y un test falla si queda desactualizado.
- **Paridad Node ↔ navegador (NO está en la suite: necesita navegadores):** `python3 tools/paridad-navegador.py` corre 224 casos (motor y presentación) en Node, Chromium y Firefox, contra el servidor local y contra el build real. `--autoprueba` sirve una copia rota a propósito y exige que la comparación la detecte. Requiere Playwright de Python con Chromium y Firefox (`python3 -m playwright install firefox`).
- **HTTP real de `calcular` (NO está en la suite: usa la base real):** `node tools/e2e-calcular.mjs` levanta `dev-server`, pega contra la base de `backend/.env` y limpia **filtrando por los ids que creó** (más una foto antes/después de las métricas). Nunca borrados globales.
- **Pruebas de mutación** (se rompe el código a propósito, en una copia, y se exige que los tests fallen): S1 8/8, S2 11/12 (la restante es un mutante equivalente), S3 15/15, S4 13/13, S5 8/8, S6 15/15 + 11 sobre `vista.js`. Al armar la copia hay que incluir `backend/package.json` **y `backend/api`** (`lib/http.js` importa `api/login.js`) y **exigir primero una línea de base verde**; sin eso, todo parece “detectado”. Además, cada mutación de `vista.js` debe caer en al menos DOS pruebas independientes (dinámica y estática): la primera versión de la prueba dinámica tenía un hueco que lo mostró.

## Prueba de punta a punta: NO forma parte de las 15

Se corrió a mano con Playwright contra un servidor local, la base real y un Resend simulado. **No está en el repo y no es determinista**, porque depende de:

- la base de datos real (los datos de prueba se crean y se borran filtrando por lo creado en la corrida);
- un token vigente de Mercado Libre y de la caché de 24 h de `audit_cache`;
- el límite diario de 5 chequeos por IP (`rateLimit`): después del 5.º chequeo desde la misma IP la prueba falla con 429 por diseño, no por un error del código. Hay que borrar la clave `auditpub:<ip>` de esa IP antes de repetirla.

Un resultado de esa prueba nunca se reporta como parte de las 15. Se informa aparte, con las condiciones en que se corrió.

## Deuda conocida (F6, sin tocar)

`rateLimit` (`lib/http.js`) tiene una carrera en el primer upsert: dos pedidos simultáneos pueden contar de menos. No afecta a ninguna de las 15 pruebas.

## UI de Rentabilidad (S7)

```
node --test backend/test/rentabilidad-ui.test.mjs      # 22 · formulario, render, cifras del motor, invariancia, reglas estáticas anti-cálculo
python3 tools/browser-rentabilidad.py                  # 274 comprobaciones en Chromium y Firefox (servidor de prueba en memoria: tools/servidor-prueba.mjs)
node tools/mutar-ui.mjs [--solo-node] [--filtro=texto] # 39 mutantes de la capa UI; los que sobreviven a Node se prueban en el navegador
```
Estas dos últimas necesitan navegadores y NO forman parte de `node --test backend/test/`. Todo: `tests 174 · pass 174`.
