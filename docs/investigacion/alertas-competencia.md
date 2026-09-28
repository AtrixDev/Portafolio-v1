# Alertas de competencia y estimador de ventas

> Diseño e investigación, no código de producto. Fuentes consultadas el **28/09/2026**.
> Rótulos: **[DOC]** = documentado por ML · **[EN USO]** = ya lo llama el código del repo y funciona · **[A VALIDAR]** = hay que probarlo con token antes de construir.

## En corto

- **El rango de vendidos ("+100", "+500", "+1000") de publicaciones ajenas no está en ningún endpoint documentado.** Se ve en la página web, y leer esa página desde un servidor o con un bot está **prohibido** (TyC Desarrolladores 7.6). El repo ya lo comprobó: `portfolio-ml.js` avisa "ML no deja leerlos desde el servidor".
  - Hay 3 caminos: (a) publicaciones **propias**, donde `sold_quantity` es exacto; (b) **carga manual** de Darío para unos 10 productos clave por semana; (c) **validar si `/products/{id}/items` o `/items/bulk` devuelven algún `sold_quantity`** para terceros, aunque sea por rangos.
- **Sí se pueden leer y estimar ventas** con tres señales públicas documentadas, sin tocar HTML:
  1. **Opiniones** (`/reviews/item/{id}?catalog_product_id=`): el total, y cada opinión trae `buying_date`.
  2. **Ventas del vendedor en 60 días** (`/users/{id}` → `seller_reputation.metrics.sales.completed`).
  3. **Ganador, precio y cantidad de vendedores del catálogo** (`/products/{id}`, `/products/{id}/items`).
- **El estimador da siempre un intervalo**, que sale de cruzar los tres métodos. Cuando los intervalos no se superponen, el sistema lo marca como "inconsistente" en lugar de inventar un número.
- **Hay que empezar a guardar historia hoy**, porque salvo las opiniones **nada se puede reconstruir hacia atrás**. Esquema compacto: un documento por producto por mes, guardando solo lo que cambia. Son unos 10 MB por año para 200 productos.
- **Uso privado.** La cláusula 5.4 de los TyC pide autorización expresa de ML para publicar estadísticas de ventas o volumen. Esto vive en el admin y **no se muestra en la web pública**.

---

## 1. Qué deja leer la API sobre la competencia

| Dato | Endpoint | Estado | Notas |
|---|---|---|---|
| Ganador del catálogo, su precio, envío, `listing_type`, reputación y `available_quantity` | `GET /products/{id}` → `buy_box_winner`, `buy_box_winner_price_range` | [DOC] [EN USO] | `available_quantity` en recursos públicos es **por rangos** (1–50 → 1; 51–100 → 50; …; 501–5000 → 500). Sirve solo para alertas gruesas de stock |
| Todas las ofertas del catálogo (vendedor, precio, precio original, envío gratis, Full, tipo, tienda oficial) | `GET /products/{id}/items?limit=20` | [EN USO] en `action=competencia` | ¿Trae `sold_quantity`? [A VALIDAR] |
| Opiniones de la publicación ganadora o de cualquiera | `GET /reviews/item/{item}?catalog_product_id={id}&limit=50&offset=` | [DOC] [EN USO] | `paging.total`, `rating_average`, `rating_levels`, y por opinión `date_created` y **`buying_date`**. Paginación limitada por `paging.total_pageable` |
| Posición en el top 20 de más vendidos | `GET /highlights/MLA/product/{id}` · `/highlights/MLA/item/{id}` · `/highlights/MLA/category/{cat}` | [DOC] | Devuelve 404 si no está en ningún top 20. Solo categorías hoja |
| Reputación y **ventas completadas en 60 días** del vendedor | `GET /users/{seller_id}` → `seller_reputation.metrics.sales.completed` (period "60 days"), `transactions.total` | [DOC] · lectura de terceros [EN USO] (`nickname` y `level_id`) · `metrics` de terceros [A VALIDAR] | Vendedores "protegidos": los datos reales van en `excluded`. En esos casos la ventana puede venir en 0 |
| Visitas de una publicación ajena | `GET /visits/items?ids={item}` | [EN USO] en `leerPublico()` de `lib/ml.js` | Es el total acumulado de 2 años. ¿Se puede pedir por día para terceros (`/items/{id}/visits/time_window`)? [A VALIDAR] |
| Preguntas de una publicación ajena | `GET /questions/search?item={item}&limit=1` → `total` | [EN USO] | Es un proxy de interés |
| Estado propio contra el ganador | `GET /items/{propio}/price_to_win?version=v2` | [DOC] [EN USO] | Hoy **se pisa todos los días** en `tk_items.ptw` |
| `/items/{id}` de terceros | — | **403** | Por eso no hay `sold_quantity`, fotos ni atributos |
| Cambios de estado de competencia (propio) | Notificaciones, tópico *Item competition* | [DOC] | Es un webhook. Necesitaría un endpoint receptor (una función más o una acción en `ml-callback.js`) |

> **Migración pendiente, que no es de esta investigación pero afecta al diseño:** `/items?ids=` y `/users?ids=` se deprecan. Hay que usar `/items/bulk?ids=` y `/users/bulk?ids=` **antes del 25/10/2026** (ML Developers, Ítems y búsquedas, actualizado el 10/09/2026). El sync del Tracker usa `/items?ids=` en `backend/lib/tracker-sync.js:73`. Al pasar a `/items/bulk` hay que agregar el prefijo `body.` a cada campo de `attributes`, y `code` pasa a llamarse `status_code`.

---

## 2. Detector de saltos de rango

Solo se aplica donde el rango sí se conoce: publicaciones propias, a partir de `sold_quantity` exacto convertido al rango que ve el comprador, y carga manual. Queda listo por si la validación del punto 1 abre una vía por API.

**Escalera de rangos.** ML no documenta los cortes. El parser del repo ya reconoce "+N vendidos" y "+N mil vendidos". La escalera se **aprende de los datos** en lugar de fijarse de antemano: se guarda cada etiqueta vista, y los cortes observados hasta ahora (+5, +25, +50, +100, +250, +500, +1000, +5 mil, +10 mil…) quedan como **hipótesis** [A VALIDAR comparando `sold_quantity` propio contra lo que muestra la página].

**Reglas del detector:**
1. `rango_hoy > rango_ayer` → evento `salto` con `{de, a, ventana: [dia_obs_anterior, dia_obs]}`.
2. **Antirrebote**: el salto se confirma con 2 observaciones seguidas, porque la página puede estar cacheada.
3. `rango_hoy < rango_ayer` → evento `anomalía` (republicación, fusión de catálogo o cambio de etiqueta). **No entra al estimador.**
4. Un cambio de `buy_box_winner.item_id` corta la serie del ítem, pero **no** la del producto.
5. Hay que tener claro **de quién es el número**: en `/p/` el "+1000 vendidos" puede ser del producto (todos los vendedores) o del ganador [A VALIDAR a mano en 3 catálogos que tengan una publicación propia, comparando contra `sold_quantity`]. El estimador guarda el alcance (`alc: 'producto'|'item'`).

---

## 3. Estimador de ventas por día con intervalo honesto

### Método A: entre dos saltos (el más preciso cuando existe)

Si el rango pasó de `a` en la ventana `(p1, t1]` y de `b` en la ventana `(p2, t2]`, las unidades vendidas entre los dos cruces son **exactamente `b − a`**. Lo único incierto es cuándo fue cada cruce:

```
duración ∈ [p2 − t1, t2 − p1]
ventas/día ∈ [ (b − a) / (t2 − p1) , (b − a) / (p2 − t1) ]
```

*Ejemplo*: +500 visto el día 10 (el 9 era +250) y +1000 visto el día 70 (el 69 era +500). Resultado: 500 unidades en 59 a 61 días, o sea **8,2–8,5 unidades/día**. La observación diaria deja el intervalo muy angosto. El supuesto fuerte es que el **ritmo fue constante** durante los 60 días. Es un promedio y no muestra picos.

### Método B: cota superior mientras no hay salto

Si el último cruce fue a `a` en `(p1, t1]` y hoy (`t`) sigue por debajo de `b`, entonces `ventas/día < (b − a) / (t − t1)`. Esta cota se va ajustando cada día que pasa sin salto. *Ejemplo*: 31 días en "+500" → **menos de 16/día**. No da cota inferior.

### Método C: opiniones, calibradas con cuentas propias

1. **Calibración** (de ML Tracker, datos propios): para cada publicación propia con `sold_quantity ≥ 50`, se calcula `r = opiniones / vendidas`, agrupado por categoría raíz. Se guardan la mediana y los percentiles p10 y p90 de `r`.
2. **Conteo**: `k` = opiniones nuevas del competidor en los últimos 28 días. Es mejor contarlas por **`buying_date`** que por `date_created`, porque así se ubican en el momento de la compra y no en el de la reseña. Al principio hay un faltante por el retraso entre compra y opinión, así que conviene usar la ventana de 28 días que **termina hace 14 días**.
3. **Intervalo de Poisson del 90% para `k`** (Garwood), con la aproximación de Wilson–Hilferty, que no necesita librerías:
   ```js
   // cuantil chi² aproximado; z = ±1,645 para 90%
   const chi2 = (nu, z) => nu * Math.pow(1 - 2 / (9 * nu) + z * Math.sqrt(2 / (9 * nu)), 3);
   const kLo = k === 0 ? 0 : chi2(2 * k, -1.645) / 2;
   const kHi = chi2(2 * k + 2, 1.645) / 2;
   // k = 12 → [6,9 ; 19,4]  (coincide con el cálculo exacto)
   ```
4. **Ventas/día** ∈ `[ kLo / r_p90 , kHi / r_p10 ] / 28`, con estimación puntual `k / r_mediana / 28`.

*Ejemplo con números inventados de calibración* (r mediana 8%, p10 4%, p90 14%), `k = 12` → puntual **5,4/día**, intervalo **1,8–17/día**. Es ancho, y está bien que lo sea: la tasa de opiniones varía mucho según la categoría y el precio.

### Método D: tope por vendedor

`metrics.sales.completed / 60` es el promedio diario de **todas** las ventas del vendedor en 60 días. Las ventas de ese producto no pueden superarlo. En catálogos donde el ganador es un vendedor de un solo producto (algo frecuente en vendedores chicos), este tope es casi la estimación misma. Depende de validar que `metrics` venga para terceros.

### Cómo se combinan

```
intervalo_final = A ∩ B ∩ C ∩ [0, D]   (usando los que estén disponibles)
si queda vacío      → estado 'inconsistente' (se muestra cada método por separado, sin número final)
si solo hay C       → confianza 'baja'
si hay A            → confianza 'alta' para el promedio del período entre saltos
```

Siguiendo el ejemplo: A = 8,2–8,5, C = 1,8–17 y D = 15 dan un final de **8,2–8,5/día, confianza alta**. En la interfaz se muestra así: *"≈ 8 ventas/día (entre 8,2 y 8,5; promedio 29/07–27/09; supone ritmo constante)"*.

**Límites que se dicen siempre en pantalla:**
- Ritmo constante dentro de cada período.
- La escalera de rangos es aprendida, no oficial.
- La tasa de opiniones se calibra con cuentas propias, que pueden no parecerse a la del competidor.
- Las ventas del vendedor incluyen todos sus productos.

---

## 4. Alertas

Se generan en el cron diario y quedan en `cm_eventos` (sin email en la v1: se ven en el admin).

| Alerta | Regla | Fuente |
|---|---|---|
| **Cambió el ganador** del catálogo donde competís | `buy_box_winner.item_id` distinto al de ayer | `/products/{id}` |
| **Bajó el precio del ganador** | Baja de más del 5% contra ayer, o precio por debajo de tu `price_to_win` | `/products/{id}` |
| **Entró un vendedor nuevo** | Un `seller_id` que no estaba en `/products/{id}/items` | `/products/{id}/items` |
| **Salto de rango** | Detector del punto 2, confirmado | Propio o manual |
| **Aceleración de opiniones** | `zConteos(opiniones últimos 7 días, promedio semanal de las 4 anteriores)` > 2, el mismo test del Tracker | `/reviews/item` |
| **Entró o salió del top 20** | Cambia la posición en `/highlights/MLA/product/{id}` (hay que tratar el 404 como "fuera") | `/highlights` |
| **Stock del ganador en rango bajo** | `available_quantity` referencial = 1 (rango 1–50) | `/products/{id}` |
| **Perdiste el catálogo** | `ptw.status` pasa de `w` o `s` a `c` o `l` | `/items/{propio}/price_to_win` |

---

## 5. Qué historial hay que empezar a guardar YA

Por prioridad. Todo lo que no se guarda hoy **se pierde para siempre**, salvo las opiniones, que traen fecha.

1. **Foto diaria de cada catálogo donde compite una cuenta vinculada** (sale de `tk_items.catalog_product_id`): ganador, precio, cantidad de vendedores y rango de stock del ganador.
2. **Historial diario de `price_to_win` propio.** Hoy se pisa. Hay que moverlo a la serie, que es la misma idea que `tk_hist` de `posicionamiento-ml.md`.
3. **Total de opiniones y `rating_levels`** del ganador de cada catálogo seguido. Además, **un backfill único** de opiniones con `buying_date` (hasta `total_pageable`) para reconstruir la historia hacia atrás.
4. **`metrics.sales.completed` (60 días) de cada vendedor competidor**: una línea por vendedor por día.
5. **Posición en `/highlights`** de los productos seguidos.
6. **Rangos de vendidos cargados a mano** (formulario en el admin) y, para las publicaciones propias, el rango calculado desde `sold_quantity`, para aprender la escalera.

---

## 6. Esquema Mongo compacto

Prefijo `cm_` (competencia). Los días van como claves `'01'`–`'31'` dentro de un documento por mes. Solo se escriben los campos que **cambiaron** contra el último valor guardado: el lector arrastra el valor anterior, igual que `serieDiaria()` hace con el precio.

```js
// cm_seguidos — qué se sigue (lo alimenta el sync: catálogos de las cuentas + altas manuales)
{ _id: 'MLA27077244',               // catalog_product_id (o item MLA… si no es catálogo)
  tipo: 'P' | 'I', cuentas: ['123456'], alta: ISODate, activo: true, cat: 'MLA1234' }

// cm_serie — historia diaria del producto seguido, un doc por mes
{ _id: 'MLA27077244:2026-09', p: 'MLA27077244', m: '2026-09',
  d: {
    '27': { w: 'MLA999', ws: 1234567, $: 25999, n: 7, sq: 50, r: 1520, rt: 4.7, h: 3 },
    '28': { $: 24999 }              // solo cambió el precio
  },
  rg: { '28': { v: 1000, alc: 'producto', src: 'manual' } } }  // rangos de vendidos, si hay
// w = item ganador · ws = seller ganador · $ = precio ganador · n = n.º vendedores
// sq = available_quantity referencial · r = total opiniones · rt = rating · h = posición highlights

// cm_vendedor — ventas 60 d por vendedor, un doc por mes
{ _id: '1234567:2026-09', s: '1234567', m: '2026-09', d: { '28': [900, '5_green'] } }

// cm_eventos — alertas (se leen en el admin)
{ _id: ObjectId, p: 'MLA27077244', t: 'ganador'|'precio'|'nuevo_vendedor'|'salto'|'opiniones'|'top20'|'stock'|'catalogo_perdido',
  f: '2026-09-28', de: …, a: …, visto: false }
// índices: { visto: 1, f: -1 } · { p: 1, f: -1 }
// limpieza: el cron borra eventos con f de hace más de 180 días (así no se depende de índices TTL)

// cm_calibracion — tasa opiniones/ventas por categoría raíz (se recalcula semanalmente)
{ _id: 'MLA1574', n: 23, r50: 0.081, r10: 0.04, r90: 0.14, f: ISODate }
```

**Tamaño estimado** para 200 productos seguidos:
- `cm_serie`: aproximadamente 1 doc completo (~90 B) + 29 docs chicos (~25 B) por mes, unos 1 KB por producto por mes → **~2,5 MB/año**.
- `cm_vendedor`: ~150 vendedores → **menos de 1 MB/año**.
- Eventos: unos 2 MB con retención de 180 días.
- Con índices: **menos de 10 MB/año**.

**Para comparar**: `tk_fotos` hoy guarda **un documento por ítem por día** (`_id: 'itemId:dia'`). Con 300 ítems son unos 110.000 documentos por año, más el overhead de índice por documento. Pasarlo al mismo patrón mensual es probablemente el mayor ahorro de espacio disponible en el cluster compartido [A VALIDAR midiendo con `db.tk_fotos.stats()`].

---

## 7. Dónde vive en el stack

- **Sin función nueva.** Se agrega una fase `competencia` en `lib/tracker-sync.js`, después de `calidad`, o una `action=competencia-cron` en `api/tracker.js` con su propio cron diario (en Hobby: hasta 100 crons, cada uno una vez por día).
- **Presupuesto de llamadas**: unas 4 por producto seguido por día (`/products`, `/products/items`, `/reviews?limit=1`, `/highlights/product`) más 1 por vendedor distinto. Para 200 productos y 150 vendedores son **~950 llamadas por día**, en paralelo de a 6 como el sync actual, con el reintento ante 429 que ya existe en `ml()`.
  - Si el proyecto no tiene Fluid compute (tope de 60 s), no entra en una sola corrida: se usa el mismo patrón de **cursor por tandas** que ya usa `sincronizar()`, repartido en 2 o 3 crons escalonados.
- **Admin**: la pestaña de competencia del Tracker (`action=competencia` ya lista los vendedores) suma tres cosas: la serie (precio del ganador y opiniones), la tarjeta del estimador con intervalo y confianza, y la lista de eventos no vistos.
- **Legal**:
  - TyC 5.3: mostrar la fecha y hora del último dato.
  - TyC 5.4: no publicar estimaciones de ventas en la web pública ni en la auditoría gratis sin autorización de ML.
  - TyC 7.6: no volver a leer HTML de ML desde el servidor. **Nota**: `leerHTML()` de `portfolio-ml.js` todavía existe y se hace pasar por Googlebot.

---

## 8. Validaciones antes de construir (1 tarde, con el token de la cuenta principal)

1. `/products/{id}/items?limit=20`: ¿aparece algún campo de vendidos (`sold_quantity` o parecido)? Si aparece, aunque sea por rangos, el detector del punto 2 se vuelve automático.
2. `/items/bulk?ids={ajeno}&attributes=body.id,body.sold_quantity`: ¿403 o algo parcial?
3. `/users/{seller_ajeno}`: ¿trae `seller_reputation.metrics.sales.completed`?
4. `/reviews/item/{ganador}?catalog_product_id={id}&limit=50`: ¿cuánto vale `total_pageable` en un catálogo grande? Eso define cuánto se puede reconstruir hacia atrás.
5. `/highlights/MLA/product/{id}` en 5 catálogos propios: ¿alguno está en un top 20?
6. A mano: en 3 catálogos con publicación propia, comparar el "+N vendidos" de la página con `sold_quantity` propio y con el total, para saber de quién es el número y dónde están los cortes.
7. Medir el espacio: `db.stats()` y `db.tk_fotos.stats()`.

---

## Fuentes (consultadas el 28/09/2026)

- ML Developers, Competencia en catálogo, `price_to_win` v2, `/products/{id}` y `buy_box_winner` (21/07/2026): https://developers.mercadolibre.com.ar/es_ar/competencia-en-catalogo
- ML Developers, Evaluaciones de un ítem, `/reviews/item`, `buying_date`, `total_pageable`, catálogo (18/09/2026): https://developers.mercadolibre.com.ar/es_ar/opiniones-sobre-producto
- ML Developers, Más vendidos, `/highlights` (22/06/2026): https://developers.mercadolibre.com.ar/es_ar/mas-vendidos-en-mercado-libre
- ML Developers, Reputación de vendedores, `metrics.sales.completed` 60 días (11/08/2025): https://developers.mercadolibre.com.ar/es_ar/reputacion-de-vendedores
- ML Developers, Ítems y búsquedas, `available_quantity` por rangos y deprecación de `/items?ids=` (10/09/2026): https://developers.mercadolibre.com.ar/es_ar/items-y-busquedas
- ML Developers, Visitas (02/01/2026): https://developers.mercadolibre.com.ar/es_ar/recurso-de-visitas
- ML Developers, Términos y Condiciones del Programa de Desarrolladores (5.3, 5.4, 7.6, 7.8): https://developers.mercadolibre.com.ar/es-ar-terminos-y-condiciones
- Vercel, Cron (100 por proyecto, una vez por día en Hobby): https://vercel.com/docs/cron-jobs/usage-and-pricing · Límites de funciones: https://vercel.com/docs/functions/limitations
- MongoDB Atlas, límites de M0: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- Intervalo de Poisson (Garwood) y aproximación de Wilson–Hilferty: fórmulas estándar. Verifiqué los números del ejemplo contra el cálculo exacto (scipy) para k = 12.
