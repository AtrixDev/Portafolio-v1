# Análisis de herramientas (02/10/2026)

Criterios: 1 funcionalidad · 2 copywriting · 3 utilidad · 4 valor real · 5 demo que termina en lead.
Límites reales de la API de Mercado Libre: ver `estado-herramientas.md`. Lo que SÍ se puede leer de cualquier publicación: descripción, preguntas, catálogo (`/products/{id}` y `/products/{id}/items`: precio, vendedor, reputación, envío, Full). Lo que NO: `/items` ajeno, opiniones ajenas, tendencias.
Ya existe una IA en el backend (Groq, `lib/audit.js: tituloConIA`) y rate limit por IP/día.

## Problemas transversales (afectan a todas)

1. **El lead se pierde.** Todos los CTA van a `contacto.html?asunto=x` sin llevar el resultado. Quien probó la demo llega a un formulario vacío. Solución: cada herramienta termina en «Recibir este resultado» que precarga el mensaje/WhatsApp con el resultado (o lo envía por mail) y registra un lead con el motivo y los datos.
2. **Cinco herramientas hacen lo mismo** (simulador, chequeo, auditoría, informe, diagnóstico): todas dicen «qué le falta a tu publicación/cuenta». El visitante no sabe cuál usar. Hay que ordenarlas en un recorrido: Chequeo (gratis, 1 link) → Auditoría (cuenta completa) → Informe (entregable).
3. **Las demos simulan en vez de resolver.** Si la demo no usa un input real del visitante, no convence a un vendedor escéptico.
4. **Copy por herramienta, no por problema.** Los nombres describen la función («Minero de opiniones»); el vendedor busca el resultado («Sacá qué critican de tu competencia»).
5. **Enlaces a sistema.html caían en la sección equivocada** (contenido que cargaba tarde empujaba el ancla). Arreglado en `main.js` (ancla estable).

## Herramienta por herramienta

### 1. Minero de opiniones — el más valioso, hoy el más flojo
- **Hoy:** clasifica texto pegado con regex. Frágil, tono por palabras clave, no extrae nada de ML.
- **Debe ser:** input = link/ID de una publicación → extrae → clasifica → recomienda.
  - Opiniones ajenas dan 403, pero **las preguntas de cualquier publicación sí se leen**. Fuente real pública: preguntas del comprador sobre la publicación del competidor = qué información le falta a su ficha.
  - Opiniones: propias vía cuenta conectada (hasta 200) o pegadas/CSV de cualquier otra.
  - Clasificación con IA (no regex): tema, tono, intensidad, frase textual de ejemplo, «objeción de compra».
  - **Comparar 2 publicaciones** (idea tuya, correcta): barras lado a lado por tema, «dónde ganás / dónde perdés», y salida accionable: qué poner en título, fotos y descripción para capitalizar lo que el otro hace mal.
  - Salida exportable (PDF/copia) y «Recibir el análisis completo».
- **Copy:** «Mirá qué le critican a tu competencia y vendé justo eso».
- **Lead:** entregable con 3 hallazgos gratis; el informe del rubro entero, por contacto.

### 2. Chequeo de publicación (+ absorber Simulador y Desarmes)
- **Hoy:** con link de catálogo anda (fotos, atributos); con link común solo descripción y preguntas. Si falla pide «Revisá el link» sin ayudar.
- **Mejor:** modo guiado cuando la API no deja leer (preguntar fotos/título a mano = el simulador actual), score + título optimizado con IA (ya existe `tituloConIA`) + plan de 3 acciones. **Comparar con otra publicación del mismo producto** (si ambas son de catálogo).
- El «Desarme» deja de ser una idea aparte: es el resultado de este chequeo, mostrado como antes/después. Borner queda como caso de prueba social.
- **Lead:** «Mandame el desarme completo con título, fotos y descripción reescritos».

### 3. Alertas de competencia → «Quién gana el catálogo y por qué»
- **Viable hoy:** `/products/{id}/items` lista todas las ofertas con precio, vendedor, reputación, envío gratis, Full. Un snapshot ya es útil: diferencia de precio contra el ganador, qué condiciones tiene el ganador que vos no, y precio objetivo para ganar.
- Después, con el cron diario que ya existe, historial y alertas de cambios (sin inventar ventas: sólo rangos).
- **Lead:** «Vigilo tu catálogo cada día y te aviso».

### 4. Auditoría de cuenta + Informe + ML Tracker
- Es el producto principal. Falta: probar el login de Mercado Libre de punta a punta (pendiente tuyo). La demo del Tracker debe mostrar **una alerta con el impacto en pesos** y terminar en «Conectá tu cuenta» (no «abrir la demo completa»).
- Informe de muestra: bien como prueba del entregable; asegurar que el PDF tenga marca y un CTA.

### 5. Diagnóstico (catálogo de 10 problemas)
- Es contenido, no herramienta. Mejor como **«¿Qué le pasa a tu cuenta?»**: 3 preguntas de síntomas → problema probable → qué hacer. Sin eso es una enciclopedia.

### 6. Calculadora de importación
- Es la más completa (309 líneas, desglose real). Falta: guardar/comparar 2 escenarios (aduana vs courier), precio mínimo de venta en ML con comisión, y «validar con despachante» como CTA. Es la bisagra hacia tu negocio de importación.

### 7. ¿Cuánta plata perdés? (ACOS)
- Funciona; agregar ACOS de equilibrio (el más importante) y explicar cuándo conviene subir inversión. CTA: «Revisamos tus campañas».

### 8. Tendencias / Radar / Mail
- Dependen de un dato que Mercado Libre cortó. Mantenerlas honestas (hecho). Valor: el radar sólo vale si hay fuente; **no construir** hasta definirla.

## Propuesta de orden
1. Minero de opiniones real (preguntas + opiniones propias/pegadas, IA, comparar 2) — el diferenciador.
2. Cierre de leads en todas (resultado precargado).
3. Chequeo con IA + comparación + absorber simulador y desarmes.
4. «Quién gana el catálogo» (snapshot).
5. Reordenar la vitrina por recorrido y reescribir el copy.
6. Mejoras a calculadoras.
