# Qué mueve el posicionamiento en Mercado Libre (2025–2026)

> Investigación, no código de producto. Fuentes consultadas el **28/09/2026**.
> Cada factor lleva un rótulo:
> - **[OFICIAL]**: lo dice Mercado Libre en su Centro de Vendedores o en la documentación de la API.
> - **[COMUNIDAD]**: lo dicen consultoras, agencias o herramientas (Nubimetrics, Real Trends, blogs). **Ninguna de las fuentes de comunidad que revisé cita datos ni documentación oficial.**
> - **[A VALIDAR]**: no lo pude comprobar sin token o sin cuenta real.
>
> ML **no publica la fórmula** del orden "Más relevantes". La documentación dice solo que "por defecto, la búsqueda en los listados ya viene con un orden de relevancia definido". Todo lo que sigue son señales, no pesos.

## En corto

- **Lo oficial se reduce a siete cosas**: ficha completa y bien categorizada, fotos de calidad, catálogo (que "siempre aparece primero"), precio competitivo, reputación (la roja pierde exposición), experiencia de compra (reclamos y cancelaciones) y tipo de publicación (`priority_in_search`). Los videos son oficiales como *recomendación*, con un dato de ML de "2× ventas y 3× visitas en promedio", que es un promedio observacional, no causal.
- **Casi todo se puede medir con la API** usando la cuenta vinculada: `/item/{id}/performance`, `/items/{id}/price_to_win`, `/reputation/items/{id}/purchase_experience/integrators`, `/users/{id}`, visitas diarias y órdenes. ML Tracker ya lee varias de estas y **tira la historia**, porque sobreescribe `ptw` y `calidad` todos los días. Eso es lo primero que hay que cambiar para poder experimentar.
- **En ML no hay split A/B**: una publicación no se puede mostrar distinta a dos grupos. Los experimentos se hacen con **pares emparejados + antes/después** (diferencia en diferencias), con 28 días de pre y de post, igual que la `VENTANA` del Tracker.
- **Con poco tráfico, un cambio en conversión no se puede detectar.** Para ver +30% sobre 2% de conversión hacen falta unas 9.800 visitas por grupo. En publicaciones chicas hay que medir **visitas** (necesitás más de unas 200 por período) o posición, no conversión.

---

## 1. Factores oficiales

| # | Factor | Qué dice ML | Cómo medirlo con la API (cuenta propia) |
|---|---|---|---|
| O1 | **Ficha técnica completa** | "Cuanta más información precisa incluyas, más fácil será para los compradores encontrar tu producto utilizando los filtros". En `/performance`, la regla GTIN dice textualmente "completar el código… para estar más arriba en los resultados de búsqueda" | `GET /item/{id}/performance` → `score`, `level_wording`, `buckets[].variables[]` con `status: PENDING`. `GET /categories/{cat}/attributes` → atributos `required`, `catalog_required` y `relevance`. El Tracker ya calcula `faltantes` en `action=ficha` |
| O2 | **Categoría correcta** | "Un celular publicado en 'Hogar' difícilmente será encontrado" | `GET /sites/MLA/domain_discovery/search?q={titulo}&limit=3` y comparar con `item.category_id` |
| O3 | **Fotos de calidad** | "Si las fotos no son nítidas y no cumplen con los requisitos… tu publicación no estará entre los primeros resultados" | `/item/{id}/performance` → bucket `PICTURES` (ej. `PICTURES_QUANTITY_MIN`); `item.pictures.length` |
| O4 | **Catálogo** | "Las publicaciones del catálogo siempre aparecen primero en los resultados de búsqueda" | `item.catalog_listing`, `catalog_product_id`; `GET /items/{id}/price_to_win?version=v2` → `status` (winning, sharing_first_place, competing, listed), `visit_share`, `reason[]` |
| O5 | **Condiciones que ganan el catálogo** | Precio, **cuotas sin interés**, **Full**, **envío gratis**, **envío en el día**, reputación. Naranja o roja "podrán participar… pero no podrán ganar" | `price_to_win.boosts[]` con `status: boosted | opportunity | not_apply` para `fulfillment`, `free_installments`, `free_shipping`, `same_day_shipping` y `shipping_collect` |
| O6 | **Precio competitivo / Ofertas** | "Compará el precio… Si es posible ofrecer descuentos atractivos, puedes ganar un lugar en la sección de Ofertas" | `price_to_win.price_to_win` contra `current_price`; `/products/{id}` → `buy_box_winner_price_range` |
| O7 | **Reputación** | "Los vendedores con reputación roja tienen menor exposición"; hay que despachar en menos de 24 h y evitar cancelaciones y reclamos | `GET /users/{id}` → `seller_reputation.level_id`, `metrics.claims.rate`, `metrics.cancellations`, `metrics.delayed_handling_time`, `metrics.sales.completed` (60 días) |
| O8 | **Experiencia de compra** (por publicación) | "Algoritmo que aplica reglas… para posicionar cada ítem según su rendimiento" en atención (reclamos y cancelaciones); "afecta tu exposición y podríamos pausarla" | `GET /reputation/items/{id}/purchase_experience/integrators?locale=es_AR` → `reputation.value` y `color`, `metrics_details.problems[]`, `freeze`. Ojo: los ítems migrados a User Products responden **302** |
| O9 | **Tipo de publicación** | Cada `listing_type` tiene un `listing_exposure`; cada exposición trae `priority_in_search` (0 = Superior … 4 = Última) | `GET /sites/MLA/listing_types/{tipo}` → `configuration.listing_exposure`; `GET /sites/MLA/listing_exposures`. Hay que ver qué exposición tienen `gold_pro` y `free` en MLA [A VALIDAR con token: la doc solo muestra `gold_special` = `highest`] |
| O10 | **Videos / Clips** | "Aumentá en promedio 2 veces tus ventas. Obtené en promedio 3 veces más visitas". Se muestran en el inicio, la publicación, Mercado Play y "Videos" | No encontré endpoint de videos en la doc pública [A VALIDAR]. Se mide el efecto con visitas y órdenes (ver E6) |
| O11 | **Publicidad (Product Ads)** | Los anuncios ocupan posiciones pagas en los listados. El efecto sobre el orgánico **no está documentado** | Endpoints de métricas de Product Ads (90 días hacia atrás; se actualiza a las 10:00 GMT-3) |
| O12 | **Programa de Despegue** (vendedores nuevos) | Ayuda a vender más rápido; `price_to_win.reason` puede mostrar el límite de ventas del programa | `price_to_win.reason[]` |

## 2. Factores observados por la comunidad (sin confirmación oficial)

| # | Afirmación | Quién lo dice | Evidencia que muestran |
|---|---|---|---|
| C1 | **La conversión histórica es el factor más importante** | Base.com (24/04/2026), blogs de agencias | Ninguna. Es la hipótesis más citada y **razonable** (ML gana comisión por venta), pero no está publicada |
| C2 | **Ventas recientes / volumen** empujan el ranking | Nubimetrics Academia (29/05/2025), citando a un consultor | Ninguna |
| C3 | ML "detecta la conversión en 48–72 h" | Base.com | Ninguna |
| C4 | Estar **15–20% por encima del precio promedio sin justificación** penaliza | Base.com | Ninguna. Solo es oficial el precio para catálogo (O5/O6) |
| C5 | En 2026 se sumó **cumplimiento de SLA por SKU**, stock estable y **penalización por oversell** | Base.com | Ninguna. Es compatible con O7 y O8, que son oficiales, pero el "por SKU" no lo está |
| C6 | **Responder rápido las preguntas** mejora la posición | Varias agencias | Ninguna. ML lo recomienda por experiencia de compra (O8), sin atarlo a la posición |
| C7 | **Full** da más orgánico además del boost de catálogo | Agencias | El boost en catálogo es **oficial** (O5). El efecto fuera del catálogo no lo es |
| C8 | Poner las **keywords al principio del título** sube la posición | Varias | Ninguna. ML sí dice que aparecen primero los productos con las palabras buscadas |
| C9 | **Republicar** "resetea" una publicación que cayó | Folklore de vendedores | La doc de Visitas dice que al republicar "se heredan las visitas históricas del parent_item", lo que va **en contra** de la idea de un reset limpio |

---

## 3. Cómo experimentar en una cuenta real

### Reglas comunes a todos los experimentos

1. **Diseño**: para cada publicación tratada, se elige un **control** de la misma cuenta, parecido en categoría, precio (±30%), visitas del último período (±50%) y estado de catálogo. El control no se toca.
2. **Ventanas**: 28 días antes y 28 días después (la `VENTANA` del Tracker). Los primeros 3 días después del cambio no se cuentan (reindexado).
3. **Métrica de efecto**: diferencia en diferencias, `(post_T/pre_T) / (post_C/pre_C) − 1`. La significancia se calcula con los mismos tests del Tracker: `zConteos` (Poisson) para visitas y unidades, y `zProporciones` para conversión (exige ≥ 30 visitas).
4. **Tamaño mínimo**, antes de empezar:
   - Conversión base de 2% y efecto de +30% relativo → unas **9.800 visitas por grupo** (α 0,05, potencia 80%). Casi ninguna publicación chica llega.
   - Visitas con efecto de +20% → hacen falta **≥ 211 visitas por período** en Poisson puro. Como las visitas diarias varían más que eso, conviene **multiplicar por 2–3** (unas 500).
   - Si no llega, hay que agrupar varias publicaciones tratadas contra varias de control, o medir un resultado más directo (estado de catálogo, puntaje de calidad, posición en `/highlights`).
5. **Calendario**: evitar semanas de Hot Sale, CyberMonday, Black Friday y Navidad, cambios de cuotas del banco y cambios de precio propios en el control.
6. **Foto antes del cambio** (para volver atrás): se guarda en Mongo el estado completo de la publicación (`title`, `pictures[].id`, `attributes`, `price`, `listing_type_id`, `shipping`) **antes** de tocar nada.
7. **Una sola variable por publicación** a la vez.
8. **Corte anticipado**: si la tratada pierde más del 30% de unidades contra el control durante 7 días seguidos, se revierte.

### Experimentos

Los resultados de cada experimento se guardan en `exp_registro` (esquema al final).

**E1: Completar atributos (O1)**
- **Hipótesis**: pasar de `PENDING` a `COMPLETED` en `CHARACTERISTICS` (GTIN + requeridos) sube las visitas.
- **Variable**: atributos faltantes que el Tracker ya lista en `action=ficha`.
- **Métrica**: visitas/día (DiD); secundaria: `performance.score`.
- **Duración**: 28 + 28 días.
- **Piloto**: 5 publicaciones con más faltantes contra 5 de control.
- **Vuelta atrás**: casi nunca hace falta (dato correcto). Si un atributo movió la publicación a otro catálogo o dominio, se hace un `PUT /items/{id}` con los atributos de la foto.

**E2: Categoría (O2)**
- **Hipótesis**: si `domain_discovery` sugiere otra categoría y se corrige, suben visitas y conversión.
- **Variable**: `category_id`.
- **Métrica**: visitas/día y conversión.
- **Duración**: 28 + 28.
- **Piloto**: 1 o 2 publicaciones mal categorizadas.
- **Vuelta atrás**: **cuidado**, porque ML puede no dejar cambiar la categoría con ventas o en catálogo [A VALIDAR antes: intentarlo en una sin ventas]. Si no deja, el experimento no se hace.

**E3: Fotos (O3)**
- **Hipótesis**: pasar de menos de 3 fotos a 6 o más, con portada en fondo blanco, sube CTR → visitas.
- **Variable**: `pictures`.
- **Métrica**: visitas/día (no hay dato de impresiones orgánicas en la API pública).
- **Duración**: 28 + 28.
- **Piloto**: 4 contra 4.
- **Vuelta atrás**: `PUT /items/{id}` con los `pictures[].id` de la foto. Los IDs de imagen de ML siguen sirviendo mientras estén en la cuenta.

**E4: Boost de catálogo: cuotas sin interés o envío (O5)**
- **Hipótesis**: activar un boost en `opportunity` cambia `price_to_win.status` de `competing` a `sharing_first_place` o `winning`.
- **Variable**: una sola condición (cuotas **o** envío gratis **o** Full).
- **Métrica principal**: % de días en `winning` (hace falta la **historia diaria de `ptw`**, que hoy se pisa); secundaria: unidades.
- **Duración**: 14 + 14 (el estado de catálogo reacciona rápido).
- **Piloto**: 2–3 catálogos.
- **Vuelta atrás**: se desactiva la condición. **Guardrail de margen**: usar `rentabilidad()` del Tracker antes de activar cuotas.

**E5: Precio para ganar (O6)**
- **Hipótesis**: poner el precio en `price_to_win` hace ganar el catálogo y la suba de unidades compensa el margen.
- **Variable**: `price`.
- **Métricas**: unidades/día, margen total/día (con `tk_costos`) y % de días `winning`.
- **Duración**: 14 + 14.
- **Piloto**: 1 catálogo con margen holgado.
- **Vuelta atrás**: `PUT` al precio anterior. **Corte anticipado**: si el margen total cae más del 15%.

**E6: Video / Clip (O10)**
- **Hipótesis**: subir un clip aumenta visitas (ML dice 3× en promedio).
- **Variable**: tener clip aprobado (ML tarda hasta 2 días hábiles en aprobarlo; el "día 0" es el de la aprobación).
- **Métrica**: visitas/día y unidades (DiD).
- **Duración**: 28 + 28.
- **Piloto**: 3 contra 3.
- **Vuelta atrás**: se borra el clip.
- **Por qué vale la pena**: es el único factor oficial con una cifra, y la cifra de ML es observacional (los que suben video suelen ser vendedores más activos).

**E7: Keywords al inicio del título (C8, comunidad)**
- **Hipótesis**: mover el término más buscado (sacado de `/trends/MLA/{cat}`) al principio sube las visitas.
- **Variable**: `title`.
- **Métrica**: visitas/día.
- **Duración**: 28 + 28.
- **Piloto**: 3 contra 3, **solo en publicaciones sin ventas o con muy pocas**.
- **Vuelta atrás**: **riesgo alto**, porque ML puede bloquear el cambio de título en publicaciones con ventas o de catálogo [A VALIDAR antes]. Si no se puede revertir, no se corre en una publicación que venda.

**E8: Tiempo de respuesta a preguntas (C6, comunidad)**
- **Hipótesis**: responder en menos de 1 h (contra la mediana actual) sube la conversión.
- **Variable**: tiempo de respuesta, alternando semanas A/B (switchback) para toda la cuenta.
- **Métrica**: conversión semanal y `purchase_experience`.
- **Duración**: 8 semanas (4 A, 4 B, alternadas).
- **Vuelta atrás**: no hace falta.
- **Límite**: afecta a toda la cuenta y no hay control simultáneo. Es la evidencia más débil de la lista.

**No recomiendo probar C9 (republicar).** Rompe la serie de datos y, según la documentación de Visitas, la historia se hereda igual.

### Lo que hay que empezar a guardar para poder experimentar

Hoy `tracker-sync.js` hace `$set` de `ptw` y `calidad` en `tk_items`, así que **se pierde el día anterior**. Propuesta compacta: un documento por ítem por mes, con arrays por día.

```js
// tk_hist — historia diaria compacta de señales de posicionamiento (cuenta propia)
{ _id: 'MLA123:2026-09', item: 'MLA123', seller: '123456', m: '2026-09',
  d: { '28': { ps: 'w',          // price_to_win.status: w|s|c|l (winning/sharing/competing/listed)
               pw: 25999,        // price_to_win
               q: 69,            // performance.score
               pe: 50,           // purchase_experience.reputation.value
               h: 3 } } }        // posición en /highlights (si está en un top 20)
// Solo se escriben los campos que CAMBIARON contra el día anterior (el lector arrastra el último valor).

// exp_registro — experimentos
{ _id: 'E3-2026-10-01-MLA123', exp: 'E3', item: 'MLA123', control: 'MLA456',
  inicio: '2026-10-01', fin: '2026-10-29', antes: { title, pictures, attributes, price },
  resultado: { did: 0.18, z: 2.1, decision: 'mantener' } }
```

Tamaño estimado: 300 ítems × 30 días × ~40 B ≈ 360 KB/mes. Menos de 5 MB por año.

---

## Fuentes (consultadas el 28/09/2026)

**Oficiales**
- Centro de Vendedores, "Cómo posicionar tus productos en los resultados de búsqueda": https://vendedores.mercadolibre.com.ar/nota/como-posicionar-tus-productos-en-los-listados
- Centro de Vendedores, "Cómo funciona la competencia en Mercado Libre": https://vendedores.mercadolibre.com.ar/nota/como-funciona-la-competencia-en-catalogo
- Centro de Vendedores, "Subí videos y aumentá en promedio 2 veces tus ventas": https://vendedores.mercadolibre.com.ar/nota/sube-videos-de-tus-productos-para-llegar-a-mas-personas
- ML Developers, Calidad de publicaciones, `/item/{id}/performance` (31/01/2025): https://developers.mercadolibre.com.ar/es_ar/calidad-de-publicaciones
- ML Developers, Experiencia de compra (03/02/2026): https://developers.mercadolibre.com.ar/es_ar/experiencia-de-compra
- ML Developers, Competencia en catálogo, `price_to_win` v2 (21/07/2026): https://developers.mercadolibre.com.ar/es_ar/competencia-en-catalogo
- ML Developers, Tipos de publicación y `listing_exposures` (01/06/2026): https://developers.mercadolibre.com.ar/es_ar/tipos-de-publicacion-y-actualizaciones-de-articulos
- ML Developers, Reputación de vendedores (11/08/2025): https://developers.mercadolibre.com.ar/es_ar/reputacion-de-vendedores
- ML Developers, Visitas (02/01/2026): https://developers.mercadolibre.com.ar/es_ar/recurso-de-visitas
- ML Developers, Categorización / `domain_discovery`: https://developers.mercadolibre.com.ar/es_ar/categoriza-productos
- ML Developers, Ítems y búsquedas (orden por relevancia por defecto): https://developers.mercadolibre.com.ar/es_ar/items-y-busquedas
- ML Developers, Product Ads para Catálogo y User Products (06/07/2026): https://developers.mercadolibre.com.ar/es_ar/product-ads-para-catalogo-y-user-products-lectura

**Comunidad** (sin datos ni fuentes oficiales citadas)
- Base.com, "Cómo funciona el algoritmo de posicionamiento de Mercado Libre en 2026" (24/04/2026): https://base.com/es-AR/blog/algoritmo-posicionamiento-mercado-libre-2026/
- Nubimetrics Academia, "Qué prioriza el algoritmo de Mercado Libre" (29/05/2025): https://academia.nubimetrics.com/algoritmo-mercado-libre
- Real Trends, "Cómo estar en las primeras posiciones de búsqueda": https://real-trends.medium.com/c%C3%B3mo-estar-en-las-primeras-posiciones-de-una-b%C3%BAsqueda-en-mercadolibre-6c8b1e6beed2
