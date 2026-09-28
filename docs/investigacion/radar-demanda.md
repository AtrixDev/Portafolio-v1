# Radar de demanda: Shein Argentina + TikTok + Mercado Libre

> Investigación, no código de producto. Fecha de consulta de todas las fuentes: **28/09/2026**, salvo que se indique otra.
> Rótulos: **[VERIFICADO]** = lo leí en la fuente oficial ese día · **[TERCEROS]** = lo dice un blog o proveedor, no la fuente oficial · **[A VALIDAR]** = no lo pude comprobar, hay que probarlo con token o a mano.

## En corto

- **Lo que se puede automatizar de forma legal y gratis es casi todo de Mercado Libre**: `/trends` (búsquedas que crecen, semanal), `/highlights` (top 20 más vendidos por categoría) y `domain_discovery` (keyword → categoría). A eso se le suma el **RSS oficial de Google Trends** para Argentina.
- **TikTok y Shein no se pueden automatizar.** Sus términos prohíben los robots y el scraping. En el caso de Shein, dicen literalmente "medio **manual** o automatizado para indexar". Entran al radar solo como **observación humana**: Darío mira, anota la keyword y la carga en el admin.
- **La arquitectura mínima no necesita una función serverless nueva.** Alcanza con una acción `radar` dentro de `api/tracker.js`, un cron diario más (Hobby permite hasta 100 por proyecto, cada uno una vez por día) y tres colecciones chicas en Mongo, de unos 5 MB por año.
- **Primero hay que validar la señal y después construir.** Durante 4 semanas se corre a mano: ¿lo que aparece en TikTok o Shein aparece después en `/trends/MLA`? Si no pasa, el radar no suma nada frente a mirar `/trends` directamente.

---

## 1. Fuentes gratis y legales

| # | Fuente | Qué da | Acceso | Límites | ¿Se puede automatizar? |
|---|---|---|---|---|---|
| 1 | **ML `/trends/MLA`** y `/trends/MLA/{categoria}` | Hasta 50 keywords en 3 criterios: mayor crecimiento, más buscadas y más populares (búsquedas de la última semana contra dos semanas atrás) | API oficial, token Bearer | Se actualiza **semanalmente** | **Sí** [VERIFICADO] |
| 2 | **ML `/highlights/MLA/category/{cat}`** | Top 20 más vendidos de una **categoría hoja**, mezcla de `ITEM`, `PRODUCT` y `USER_PRODUCT`. También da la posición de un producto o ítem (`/highlights/MLA/product/{id}`, `/highlights/MLA/item/{id}`) y un filtro por marca (`?attribute=BRAND&attributeValue=`) | API oficial, token | Solo categorías hoja; devuelve 404 si el producto no está en ningún top 20. La frecuencia de actualización **no está documentada** | **Sí** [VERIFICADO] |
| 3 | **ML `/sites/MLA/domain_discovery/search?q=`** | Predice dominio y categoría para un texto libre (sirve para mapear una keyword de TikTok o Shein a una categoría de ML) | API oficial, token | La doc recomienda `limit=3` | **Sí** [VERIFICADO] |
| 4 | **ML `/products/{id}`** y `/products/{id}/items` | Precio del ganador (`buy_box_winner`), rango de precios y cantidad de vendedores del catálogo, para medir qué tan saturado está un candidato | API oficial, token | `available_quantity` en recursos públicos es **referencial por rangos** (1–50 → 1, 51–100 → 50, …) | **Sí** [VERIFICADO] |
| 5 | **Google Trends RSS** `https://trends.google.com/trending/rss?geo=AR` | Búsquedas en tendencia del día en Argentina, con tráfico aproximado ("2000+") y noticias asociadas | Feed público oficial, sin clave | Mucho ruido: deportes, noticias y famosos. Pocas keywords de producto | **Sí**: es un feed hecho para ser consumido [VERIFICADO: probé el feed, responde] |
| 6 | **Google Trends Explore** (web) | Interés en el tiempo, consultas relacionadas y comparación entre términos | Manual, en el navegador; exporta CSV desde la UI | `robots.txt` de trends.google.com **prohíbe `/explore?`**, así que librerías tipo pytrends quedan afuera | **No** (solo manual) |
| 7 | **Google Trends API (alpha)** | Hasta 5 años de datos escalados de forma consistente, diario, semanal o mensual, por país y subregión, con decenas de términos a la vez | **Por solicitud** (alpha, cupos limitados) | Sin precio publicado ni fecha de disponibilidad general | Sí, **si te aceptan**. Vale la pena anotarse |
| 8 | **TikTok Creative Center** (Top Products, Trends/hashtags, Top Ads) | Productos y hashtags en tendencia por región, categoría y período (7/30/120 días); detalle con métricas de anuncios | Web, **sin login** para ver | Top Products solo en desktop. **Que Argentina esté en el filtro de región de Top Products lo dicen terceros; no lo pude confirmar** porque la página se arma del lado del cliente | **No**: los ToS de TikTok prohíben extraer datos con medios automatizados [TERCEROS + ToS] |
| 9 | **TikTok Research API** | Datos públicos de TikTok | Solo investigadores académicos o sin fines de lucro de EE.UU., EEE, UK, Canadá, Suiza y Brasil; **uso comercial prohibido** | — | **No aplica** para Darío [VERIFICADO] |
| 10 | **Shein Argentina** (`ar.shein.com`), rankings | Listas "Best Sellers" (volumen y facturación), "Top Rated" (puntaje + ventas), "Most Favorited", "Most Popular" (tendencia de ventas de los últimos 7–14 días) y "Best Seller of New Arrival", **todas actualizadas diariamente** según las reglas publicadas por Shein | Web y app | — | **No.** Los T&C de Argentina prohíben "cualquier robot, araña u otro dispositivo, proceso, software o medio manual o automatizado para indexar o acceder al Servicio con cualquier fin" [VERIFICADO] |

### Contexto que cambia la lectura de Shein

Desde el **Decreto 604/2026** y la **RG ARCA 5884/2026** (Boletín Oficial, 30/07/2026) hay una sola regla para correo y courier: franquicia de USD 400 FOB por envío (pagando IVA), 5 envíos por año, tope de USD 3.000 y **uso personal, sin fin comercial**, hasta 3 unidades de la misma especie [fuente periodística, ver links]. Esto implica dos cosas:
1. Lo que se vende en Shein AR refleja **demanda de consumo final** en Argentina. Es una buena señal de gusto y de precio.
2. **No sirve como canal para traer mercadería para revender.** Si un candidato del radar pasa el filtro, se trae por régimen general de importación y hay que recalcular con la calculadora de importación de la rama `feat/calculadora-importacion`.

---

## 2. Qué se puede y qué no se puede scrapear

| Plataforma | Cláusula | Qué implica |
|---|---|---|
| Mercado Libre (TyC del Programa de Desarrolladores) | **7.6**: prohíbe "robots, harvesters, spiders, scraping u otra tecnología para acceder al Contenido de Mercado Libre o al Sitio". **7.8**: prohíbe volúmenes no razonables. **2.2.3**: ML limita las llamadas a su criterio | Solo la API. Nada de leer HTML de `/p/` o de listados desde el servidor |
| Mercado Libre (TyC Desarrolladores) | **5.4**: hace falta **autorización expresa de ML** para usar o publicar contenido que permita obtener estadísticas del sitio, **ventas**, precio promedio o **volumen vendido por categoría** | El radar y los estimadores quedan **en el admin privado**. No se publican en la web pública sin pedir permiso |
| Mercado Libre (TyC Desarrolladores) | **5.3**: lo que se muestra se actualiza al menos cada 24 h (cada 6 h si son listados de artículos), y la app tiene que decir con qué frecuencia actualiza | Mostrar la fecha de "último dato" en cada tarjeta del radar |
| Mercado Libre (buenas prácticas) | "No hacer web crawling, sino siempre trabajar con la API"; manejar el **429** distribuyendo las llamadas | El `ml()` de `tracker-sync.js` ya reintenta con 429. Hay que mantener ese patrón |
| Shein AR | Prohíbe robots y medios "manuales o automatizados" para indexar, y también usar proxies para esquivar restricciones geográficas | Solo mirada humana puntual. **No copiar catálogos ni fotos.** Se anota la keyword y el rango de precio visto |
| TikTok | Los ToS prohíben el scraping y la extracción automatizada; Creative Center está pensado para investigación manual | Igual que Shein |
| Google Trends | `robots.txt` bloquea `/explore?`; el RSS de tendencias diarias es público | RSS automatizado sí, Explore solo a mano |

> **Aviso sobre código que ya existe en el repo.** `backend/lib/portfolio-ml.js` (`leerHTML`) pide páginas de ML con `User-Agent: Googlebot` y `tools/extraer-ml.py` lee publicaciones con Chrome automatizado (Playwright). Las dos cosas caen dentro de lo que prohíbe la cláusula 7.6. Hoy se usan en volumen bajo y para publicaciones propias del portfolio, pero **no conviene reutilizarlas para el radar ni para competencia**. Recomendación: sacar el UA de Googlebot, que suplantar un bot de terceros agrava la situación, y dejar el script solo para las publicaciones que Darío gestionó.

---

## 3. Arquitectura mínima viable

### Restricciones del stack (verificadas)

- **Vercel Hobby**: máximo **12 funciones** por deployment cuando se usa `api/` sin framework. Hoy hay 10 archivos en `backend/api/`.
  - `api/db.js` es un helper, sin handler, y **cuenta como función**. Moverlo a `lib/db.js` libera un lugar [A VALIDAR en el próximo deploy].
- **Cron en Hobby**: hasta **100 crons por proyecto**, cada uno **como mucho una vez por día**, con precisión de hora (Vercel puede dispararlo en cualquier minuto de esa hora).
- **Duración**: con **Fluid compute**, Hobby tiene 300 s por defecto y como máximo. Sin Fluid, en proyectos creados antes del 23/04/2025, son 10 s por defecto y 60 s como máximo. El cron actual se corta a los 50 s (`vence = Date.now() + 50_000`), lo que hace pensar que el proyecto no tiene Fluid. **[A VALIDAR en el dashboard]**
- **Atlas M0** (compartido con Odontología Almagro): **0,5 GB** de almacenamiento, 100 ops/s, 500 conexiones, 500 colecciones, 10 GB de entrada y 10 GB de salida por 7 días, **sin backups**.

### Diseño

```
Vercel Cron (1/día, 06:00 AR = "0 9 * * *")
   └─ GET /api/tracker?action=radar   (misma función, Bearer CRON_SECRET)
        ├─ lunes: /trends/MLA + /trends/MLA/{cat} para ~15 categorías semilla
        ├─ diario: /highlights/MLA/category/{cat} para ~15 categorías hoja semilla
        ├─ diario: RSS Google Trends geo=AR (filtrado por lista de palabras de producto)
        ├─ keywords nuevas → /sites/MLA/domain_discovery/search?q=…&limit=3
        └─ candidatos nuevos → /products/{id} (precio ganador) + /products/{id}/items?limit=1 (paging.total = n.º vendedores)
Admin (privado) → pestaña "Radar"
   ├─ carga manual: keyword + fuente (tiktok | shein | otro) + nota + precio visto
   └─ tabla de candidatos con puntaje y "último dato: dd/mm hh:mm"
```

- **Sin función nueva.** Va una `action=radar` en `api/tracker.js`, que ya tiene el patrón de cron con `CRON_SECRET`, y la lógica en `backend/lib/radar.js`, pura como `tracker.js`, para poder testearla y hacer una demo.
- **Cron separado** del de sync, así no compite por los 50 s. Se agrega en `tools/build-deploy.py` junto al que ya existe:
  ```python
  "crons": [
    {"path": "/api/tracker?action=cron",  "schedule": "0 10 * * *"},
    {"path": "/api/tracker?action=radar", "schedule": "0 9 * * *"}
  ]
  ```
- **Token**: usa `getAccessToken(db)` de la cuenta principal. Todos los endpoints de arriba piden Bearer.
- **Llamadas por día**: unas 15 de highlights, 30 de productos nuevos (con caché: solo IDs que no están en la base) y 1 de RSS, cerca de **50 por día**. Los lunes se suman unas 16 de trends. Es un volumen muy bajo.

### Puntaje del candidato (v1, simple y explicable)

| Señal | Puntos |
|---|---|
| Aparece en `/trends/MLA` o `/trends/MLA/{cat}` esta semana | +3 (+1 extra si es nueva contra la semana anterior) |
| Un producto de su categoría entra al top 20 de `/highlights` | +2 |
| Cargada a mano desde TikTok (Creative Center) | +2 |
| Cargada a mano desde Shein (ranking "Most Popular" o "Best Sellers") | +2 |
| Aparece en el RSS de Google Trends AR | +1 |
| Catálogo saturado: `paging.total` de vendedores > 30 | −2 |

La regla de oro es que **ninguna fuente sola alcanza**: el candidato entra a "para mirar" con **≥ 5 puntos y al menos 2 fuentes distintas**.

### Esquema Mongo (compacto)

Prefijo `rd_` para no chocar con `tk_` y `pf_` (y **nunca `ad-`**, por el AdBlock).

```js
// rd_kw — una fila por keyword normalizada; historia semanal en arrays cortos
{ _id: 'freidora de aire',            // minúsculas, sin tildes, espacios simples
  cat: 'MLA1234', dom: 'MLA-AIR_FRYERS',
  f: { ml: ['2026-W39','2026-W40'],   // semanas ISO en /trends
       gt: ['2026-09-27'],            // días en RSS Google (máx 30, FIFO)
       tt: ['2026-09-25'], sh: [] },  // cargas manuales TikTok / Shein
  pts: 7, alta: ISODate, ult: ISODate }

// rd_top — top 20 por categoría y mes; por día solo los IDs en orden
{ _id: 'MLA1234:2026-09', cat: 'MLA1234',
  d: { '28': ['MLA123','MLAU456', …] } }        // ~20 × 14 B ≈ 300 B/día

// rd_manual — lo que carga Darío (auditable, nunca se borra solo)
{ _id: ObjectId, kw: 'freidora de aire', fuente: 'tiktok'|'shein'|'otro',
  nota: 'hashtag #airfryer AR 7d', precio: 45000, f: ISODate }
```

**Almacenamiento estimado**:
- `rd_top`: 15 categorías × 365 días × ~300 B ≈ **1,6 MB/año**.
- `rd_kw`: ~2.000 keywords × ~400 B ≈ **0,8 MB**.
- Con índices, **menos de 5 MB/año**.

Antes de crear nada, hay que medir cuánto ocupa hoy el cluster (ver validación 4).

**Limpieza**: el mismo cron borra de `rd_kw` las keywords con `ult` de más de 180 días y `pts < 5`. `rd_top` se conserva porque pesa poco y sirve para backtest.

---

## 4. Qué validar primero (en este orden)

1. **`/trends/MLA` con token real**: ¿responde 200 y con los tres criterios o solo keywords? La doc de ejemplo devuelve `keyword` + `url`, pero no qué criterio aplica a cada una [A VALIDAR]. Probarlo con 3 categorías.
2. **`/highlights`**: tomar 5 categorías hoja, sacar una foto diaria durante 7 días y ver **cada cuánto cambia el top 20**. Si cambia semanalmente, el cron del highlight puede ser semanal.
3. **`/products/{id}` y `/products/{id}/items`** con los IDs `PRODUCT` que devuelve highlights: ¿trae precio del ganador y `paging.total`? Los `USER_PRODUCT` (MLAU…) ¿se pueden leer? [A VALIDAR]
4. **Espacio en Atlas**: correr `db.stats()` sobre `portafolio` y sobre la base de Odontología para ver cuánto queda de los 512 MB. Si queda menos de 150 MB libres, primero hay que compactar `tk_fotos`, que hoy guarda un documento por ítem por día (ver `alertas-competencia.md`).
5. **Fluid compute**: revisar en Vercel (Settings → Functions) si está activo. Si está, el cron puede tener un presupuesto de 250 s en lugar de 50 s.
6. **TikTok Creative Center**: entrar a mano y confirmar si **Argentina** figura en el filtro de región de **Top Products** y de **Trends/Hashtags**. Si no figura, usar México o Brasil como proxy regional y dejarlo anotado.
7. **Backtest manual de 4 semanas** (lo más importante):
   - Cada lunes, anotar 10 productos o keywords de TikTok CC y 10 de Shein AR ("Most Popular").
   - Cada lunes, correr `/trends/MLA` y guardar la respuesta.
   - Métrica: **% de keywords de TikTok o Shein que aparecen en `/trends/MLA` dentro de las 4 semanas siguientes**, y con cuántos días de adelanto.
   - **Criterio de go**: si menos del 10% aparece, o no hay adelanto, el radar se simplifica a `/trends` + `/highlights`. Si más del 25% aparece con 1 semana o más de adelanto, se construye la carga manual.
8. **Anotarse en la alpha de Google Trends API** (gratis, por formulario). Si te aceptan, reemplaza el RSS por series de verdad.

---

## Fuentes (consultadas el 28/09/2026)

- ML Developers, Tendencias (última actualización 27/05/2025): https://developers.mercadolibre.com.ar/es_ar/tendencias
- ML Developers, Más vendidos / `/highlights` (última actualización 22/06/2026): https://developers.mercadolibre.com.ar/es_ar/mas-vendidos-en-mercado-libre
- ML Developers, Categorización / `domain_discovery` (30/12/2025): https://developers.mercadolibre.com.ar/es_ar/categoriza-productos
- ML Developers, Competencia en catálogo, `/products/{id}` y `buy_box_winner` (21/07/2026): https://developers.mercadolibre.com.ar/es_ar/competencia-en-catalogo
- ML Developers, Ítems y búsquedas, `available_quantity` por rangos y migración a `/items/bulk` antes del 25/10/2026 (10/09/2026): https://developers.mercadolibre.com.ar/es_ar/items-y-busquedas
- ML Developers, Buenas prácticas (no hacer crawling; manejar 429): https://developers.mercadolibre.com.ar/es_ar/buenas-practicas-para-uso-de-la-plataforma
- ML Developers, Términos y Condiciones (cláusulas 2.2.3, 5.3, 5.4, 7.6, 7.8): https://developers.mercadolibre.com.ar/es-ar-terminos-y-condiciones
- Google Trends RSS Argentina: https://trends.google.com/trending/rss?geo=AR · robots: https://trends.google.com/robots.txt
- Google, "Introducing the Google Trends API (alpha)" (24/07/2025): https://developers.google.com/search/blog/2025/07/trends-api · https://developers.google.com/search/apis/trends
- TikTok Creative Center: https://ads.tiktok.com/business/creativecenter · Ayuda Top Products: https://ads.tiktok.com/help/article/how-to-use-top-products
- TikTok Research API, elegibilidad: https://developers.tiktok.com/products/research-api/
- TikTok, Terms of Service: https://www.tiktok.com/legal/page/us/terms-of-service/en
- [TERCEROS] Regiones de Creative Center (incluye Argentina, sin confirmar): https://www.stackmatix.com/blog/tiktok-creative-center-guide
- Shein AR, Términos y Condiciones: https://m.shein.com/arg/Terms-and-Conditions-a-399.html
- Shein, Reglas de las listas de ranking (versión ar-en): https://m.shein.com/ar-en/rules-of-shein-ranking-list-a-1860.html
- Régimen courier 2026 (Decreto 604/2026, RG 5884/2026): https://www.derechoenzapatillas.com/2026/envios-postales-franquicia-400-dolares-correo-courier/ · https://www.ambito.com/informacion-general/los-nuevos-limites-arca-comprar-shein-temu-y-amazon-como-funciona-la-franquicia-us400-n6314261
- Vercel, Limits: https://vercel.com/docs/limits · Functions limits (Fluid, 300 s en Hobby): https://vercel.com/docs/functions/limitations · 12 funciones en Hobby: https://vercel.com/docs/functions/runtimes · Cron 100 por proyecto: https://vercel.com/changelog/cron-jobs-now-support-100-per-project-on-every-plan · Uso de cron: https://vercel.com/docs/cron-jobs/usage-and-pricing
- MongoDB Atlas, límites del cluster gratis: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
