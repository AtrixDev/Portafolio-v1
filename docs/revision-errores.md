# Revisión de errores del sitio

Registro de errores detectados para revisar y corregir juntos. Cada uno con dónde está, qué pasa y cómo arreglarlo.
Estado: `abierto` · `en curso` · `resuelto`.

## 1. Vista previa de rubros y paletas con texto de Mercado Libre — resuelto
- **Dónde:** Programación (`programacion.html`) → fichas de "Rubros" (192) y "Paletas de color". Código: `frontend/js/programacion-ejemplos.js`, función `paletaMock()`.
- **Qué pasa:** todas las fichas muestran la misma interfaz de ejemplo: "Resumen del mes · Ventas +18% y ACOS en 12,4%. Tres publicaciones necesitan fotos." Reportado por Darío en ONG / beneficencia: una ONG no tiene ventas ni ACOS.
- **Por qué es grave:** la vista previa debería vender lo que se puede hacer para ese rubro; hoy muestra un contenido que no le corresponde y resta credibilidad.
- **Cómo arreglarlo:** que cada rubro muestre un ejemplo real de su web (ONG: campaña de donación con meta y botón "Donar"; veterinaria: turnos; estudio jurídico: consulta; etc.), con contenido propio por rubro o por familia de rubros, en vez de un texto fijo.
- **Revisar también:** el resto de las fichas de Programación y Armá tu web (781 fichas) por el mismo tipo de error: contenido genérico o que no corresponde al rubro.

### Qué se hizo (28/09/2026)
- **Vista previa por rubro.** Los 192 rubros quedan agrupados en 20 familias en `frontend/js/programacion-rubros.js`. Cada familia define qué pieza muestra la interfaz de ejemplo y cada rubro trae su propio texto, creíble para su web:
  - **Donaciones y causas** (ONG, iglesia, crowdfunding): campaña con meta, barra de avance y botón «Donar».
  - **Turnos y consultas** (veterinaria, odontología, clínica, spa, telemedicina, plomero, guardería…): horarios disponibles y «Reservar turno».
  - **Gastronomía** (restaurante, panadería, bodega, delivery): carta con precios y «Reservar mesa» o «Pedir».
  - **Tiendas** (e-commerce, lujo, florería, farmacia, cajas por suscripción, subastas…): producto con precio y «Agregar al carrito».
  - **Viajes y alojamiento** (hotel, agencia, aerolínea, road trip): buscador con fechas.
  - **Avisos y listados** (inmobiliaria, concesionaria, clasificados, bolsa de trabajo, reseñas…): listado con precios.
  - **Paneles y software** (SaaS, analítica, finanzas, IoT, CRM, stock, ciberseguridad…): indicadores del rubro.
  - **Educación** (cursos, bootcamp, LMS, idiomas, chicos, instrumento…): avance del curso.
  - **Contenidos y documentación** (noticias, revista, newsletter, wiki, docs de API…): artículos.
  - **Audio y video** (música, series, podcasts, meditación…): reproductor.
  - **Eventos y cultura** (casamientos, congresos, teatro, museo, entradas, club…): fecha destacada y entradas.
  - **Estudios y servicios profesionales** (legal, agencia, fotografía, arquitectura, seguros…): servicios y «Pedir presupuesto» o «Pedir consulta».
  - **Apps de seguimiento personal** (hábitos, sueño, agua, ciclo, lectura, plantas, bebé…): el número del día.
  - **Comunidades y mensajería** (redes, foros, chat, citas, preguntas…): conversación.
  - **Juegos**, **Finanzas y pagos**, **Gobierno y trámites**, **Ciencia e investigación**, **Movilidad y logística** y **Herramientas de uso diario**, cada una con su pieza.
- Las **paletas** usan el mismo ejemplo de su rubro. Una paleta sin rubro usa un **sitio de negocio neutro**. Ningún rubro queda con el texto genérico: `paletaMock()` ya no tiene texto fijo.
- Los nombres de los sitios son inventados y la nota de la ficha lo aclara («Ejemplo inventado de una web de este rubro»).
- Arreglo de paso: el botón secundario del ejemplo se leía mal en paletas oscuras (usaba el primario sobre un fondo casi igual). Ahora usa el color de texto de la paleta.

### Revisión de las 781 fichas
Revisé todas las fichas de `frontend/data/weblab/*.json`, con estas pasadas:
- lectura ficha por ficha;
- búsqueda de datos de Mercado Libre fuera de lugar y de texto sin traducir;
- verificación del CSS citado;
- contraste real de cada paleta y de cada afirmación de contraste.

Armá tu web usa los mismos presets de «Negocios para vender», y no tenían errores.

Las menciones a Mercado Libre que quedan están donde corresponden: la ficha «Marca que vende en Mercado Libre», los ejemplos de tipos de web y los prompts de ejemplo de las skills, que son casos de uso de Darío.

Como las fichas de diseño se importan de la skill ui-ux-pro-max y se regeneran, las correcciones viven en `tools/weblab_correcciones.py` (cada una con su motivo). `build-weblab.py` las aplica después de traducir; también se pueden aplicar solas con `python3 tools/weblab_correcciones.py`. Las fichas curadas se corrigieron además en su fuente (`tools/weblab_curado.py`, `tools/weblab_skills.py`).

**Correcciones (49):**

*Tipos de web*
- `soluciones/saas` · Ejemplo propio: «ML Tracker: React + Node/Express + MongoDB + OAuth de Mercado Libre.» → «ML Tracker: JavaScript sin framework + funciones serverless en Node (Vercel) + MongoDB + OAuth de Mercado Libre.». ML Tracker no usa React ni Express.

*Arquitecturas*
- `arquitecturas/spa-api` · Ejemplo propio: «ML Tracker: React + Vite en el cliente, Node/Express + MongoDB en la API.» → «ML Tracker aplica la idea: el panel es una app en JavaScript sin framework que le pide JSON a /api/tracker (una función serverless con MongoDB). Frontend y API se publican juntos en Vercel.». ML Tracker no usa React, Vite ni Express.

*Stacks*
- `stacks/react-vite` · Lo uso en: «Cliente de ML Tracker.» → (se borra el campo). ML Tracker no usa React.
- `stacks/node-express` · Lo uso en: «API de ML Tracker.» → «Node sí: las funciones /api de esta web y de ML Tracker corren en Node como funciones serverless, sin Express.». La API de ML Tracker no usa Express.
- `stacks/mern` · Lo uso en: «ML Tracker.» → (se borra el campo). ML Tracker no usa Express ni React.

*Servicios*
- `servicios/railway` · Lo uso en: «El backend de ML Tracker está preparado para Railway (railway.json).» → (se borra el campo). No hay railway.json: ML Tracker corre en Vercel.
- `servicios/claude-api` · Lo uso en: «SEO Creator de ML Tracker.» → (se borra el campo). ML Tracker no llama a la API de Claude (arma prompts para pegar en claude.ai).

*Skills de Claude*
- `skills/claude-api` · Cuándo usarla: «Al integrar Claude en una app propia, como el generador de títulos de ML Tracker.» → «Al integrar Claude en una app propia, por ejemplo un generador de títulos para publicaciones.». ML Tracker no tiene un generador de títulos con Claude.
- `skills/react-best-practices` · prompt: «El dashboard del tracker tarda en cargar: revisalo con las buenas prácticas de React y proponé cambios.» → «El dashboard de mi app en Next.js tarda en cargar: revisalo con las buenas prácticas de React y proponé cambios.». El tracker no está hecho en React: el prompt no tenía sentido para esa skill.

*Rubros*
- `rubros/government-public-service` · resumen: «WCAG AAA mandatory. Trust paramount.» → «WCAG AAA obligatorio. La confianza es lo principal.». Texto en inglés.
- `rubros/government-public-service` · A tener en cuenta: «WCAG AAA mandatory. Trust paramount.» → «WCAG AAA obligatorio. La confianza es lo principal.». Texto en inglés.
- `rubros/beauty-spa-wellness-service` · Enfoque de color: «salvia #90EE90» → «verde claro #90EE90». #90EE90 es verde claro, no salvia.
- `rubros/financial-dashboard` · etiquetas: «portfolio, trading, ganancias y pérdidas» → «cartera, trading, ganancias y pérdidas». “Portfolio” en el sentido de cartera de inversiones.
- `rubros/wedding-event-planning` · etiquetas: «congreso, evento, meetup» → «casamiento, evento, planificación». Las etiquetas eran de congresos, no de casamientos.
- `rubros/wedding-event-planning` · Palabras clave: «congreso, evento, meetup, planificación, inscripción, entrada, casamiento» → «casamiento, evento, planificación, organización, invitados, salón, proveedores, fiesta». Las palabras clave eran de congresos, no de casamientos.
- `rubros/card-board-game` · etiquetas: «cartas, bolsa, ajedrez» → «cartas, tablero, ajedrez». “Board” es tablero, no bolsa.
- `rubros/water-hydration-reminder` · etiquetas: «riego, hidratación, tomar» → «agua, hidratación, tomar». “Water” es agua: riego es para plantas.
- `rubros/non-profit-charity` · etiquetas: «beneficencia, sin fines, de lucro» → «beneficencia, sin fines de lucro, ONG». Etiqueta partida al medio.
- `rubros/job-board-recruitment` · etiquetas: «bolsa, trabajo, reclutamiento» → «bolsa de trabajo, empleo, reclutamiento». Etiqueta partida al medio.

*Estilos de diseño*
- `estilos/exaggerated-minimalism` · Efectos y animación: «clamp(3rem 10vw 12rem)» → «clamp(3rem, 10vw, 12rem)». CSS inválido: clamp() lleva comas.
- `estilos/swiss-modernism-2-0` · Efectos y animación: «repeat(12 1fr)» → «repeat(12, 1fr)». CSS inválido: repeat() lleva coma.
- `estilos/modern-dark-cinema-mobile` · Variables CSS: «cubic-bezier(0.16 1 0.3 1)» → «cubic-bezier(0.16, 1, 0.3, 1)». CSS inválido: cubic-bezier() lleva comas.
- `estilos/kinetic-brutalism-mobile` · Modo claro: «✓ Oscuro principal» → «◐ Sólo en secciones invertidas». Modo claro y oscuro estaban invertidos.
- `estilos/kinetic-brutalism-mobile` · Modo oscuro: «◐ Sólo oscuro (secciones invertidas)» → «✓ Oscuro principal». Modo claro y oscuro estaban invertidos.
- `estilos/bold-typography-mobile-poster` · Modo claro: «✓ Modo oscuro principal» → «◐ Secciones claras opcionales». Modo claro y oscuro estaban invertidos.
- `estilos/bold-typography-mobile-poster` · Modo oscuro: «◐ Secciones claras opcionales» → «✓ Modo oscuro principal». Modo claro y oscuro estaban invertidos.
- `estilos/academia-scholarly-mobile` · Modo claro: «✓ Oscuro rico» → «◐ Secciones claras color pergamino». Modo claro y oscuro estaban invertidos.
- `estilos/academia-scholarly-mobile` · Modo oscuro: «◐ Secciones claras color pergamino» → «✓ Oscuro rico». Modo claro y oscuro estaban invertidos.
- `estilos/y2k-aesthetic` · Origen: «Y2K 2000s» → «Y2K, años 2000». Quedaba en inglés.
- `estilos/neumorphism-mobile` · colores: «texto apagado #6B7280» → «texto apagado #596070». #6B7280 sobre #E0E5EC da 3,8:1 y no llega a AA; #596070 da 5:1.

*Patrones de landing*
- `landing/video-first-hero` · Optimización de conversión: «El video genera un 86% más de engagement.» → «El video suele captar más la atención que una imagen fija: medilo contra una versión sin video.». Cifra sin fuente.
- `landing/scroll-triggered-storytelling` · Optimización de conversión: «La narrativa triplica el tiempo en la página.» → «Una buena narrativa suele alargar el tiempo en la página.». Cifra sin fuente.
- `landing/ai-personalization-landing` · Optimización de conversión: «Más de 20% de conversión con personalización.» → «La personalización puede mejorar la conversión: medila con un test A/B.». Cifra sin fuente.
- `landing/comparison-table-focus` · Optimización de conversión: «35% más de conversión.» → (se borra la frase). Cifra sin fuente.
- `landing/immersive-interactive-experience` · Optimización de conversión: «40% más de engagement. Hay que resignar rendimiento.» → «Suele generar más engagement, pero hay que resignar rendimiento.». Cifra sin fuente.
- `landing/before-after-transformation` · Optimización de conversión: «45% más de conversión.» → (se borra la frase). Cifra sin fuente.

*Tipografías*
- `tipografias/pixel-retro` · etiquetas: «Display + sans» → «Display + mono». VT323 es una monoespaciada.
- `tipografias/science-tech` · etiquetas: «Sans + sans» → «Sans + mono». Roboto Mono es una monoespaciada.
- `tipografias/neumorphism-mobile-plus-jakarta-sans-system` · Notas: «#3D4852 (contraste 7.5:1 contra #E0E5EC)» → «#3D4852 (contraste 7.4:1 contra #E0E5EC)». Contraste real: 7,38:1.
- `tipografias/neumorphism-mobile-plus-jakarta-sans-system` · Notas: «texto apagado #6B7280 (contraste 4.6:1)» → «texto apagado #596070 (contraste 5:1; el #6B7280 da 3.8:1 y no llega a AA)». Contraste real de #6B7280: 3,82:1.

*Buenas prácticas UX*
- `ux/36-color-contrast` · código bueno: «#333 on white (7:1)» → «#333 on white (12.6:1)». Contraste real: 12,63:1.
- `ux/68-viewport-meta` · Hacer: «Usá width=device-width initial-scale=1» → «Usá width=device-width, initial-scale=1». Faltaba la coma.
- `ux/25-tap-delay` · resumen: «Una demora de 300ms al tocar se siente lenta» → «Los navegadores viejos esperaban 300ms después de cada toque». Los navegadores actuales ya no agregan la demora.
- `ux/25-tap-delay` · Hacer: «Usá touch-action en CSS o fastclick» → «Usá touch-action: manipulation y el meta viewport con width=device-width (FastClick ya no hace falta)». FastClick quedó obsoleto.

*Paletas de color*
- `paletas/dental-practice` · acento: «#0EA5E9» → «#B7791F». El acento era el mismo celeste del primario (2,6:1) aunque la paleta dice “amarillo sonrisa”; #B7791F da 3,4:1.
- `paletas/freelancer-platform` · acento: «#16A34A» → «#138A3E». #16A34A daba 2,95:1 sobre el fondo; #138A3E da 4:1.
- `paletas/digital-products-downloads` · acento: «#16A34A» → «#138A3E». #16A34A daba 2,95:1 sobre el fondo; #138A3E da 4:1.
- `paletas/language-learning-app` · acento: «#16A34A» → «#138A3E». #16A34A daba 2,95:1 sobre el fondo; #138A3E da 4:1.
- `paletas/survey-form-builder` · resumen: «Verde azulado pregunta + verde progreso + azul enviar» → «Verde azulado de pregunta + verde de progreso + ámbar para enviar». La paleta no tiene azul: el acento es ámbar.

**Quedó para revisar con Darío:** la vista previa de los 84 estilos muestra siempre la misma tarjeta de producto («Mandolina V5 · Comprar · Envío gratis»). No es un error del rubro porque es la muestra del estilo, pero se podría variar según el «Ideal para» de cada estilo.

## 2. Portada: hero cortado y columna izquierda simple — resuelto (falta tu OK)
- **Dónde:** `index.html`, hero (`css/port.css`).
- **Qué pasa:** en 1366×768 el botón "Descargar CV" queda fuera de la primera pantalla. La columna izquierda (nombre, bajada, métricas, puertas) se ve plana.
- **Cómo arreglarlo:** achicar la escala del nombre y el aire vertical para que todo entre en 768 px, y rediseñar la jerarquía de la columna izquierda.
- **Hecho:** nombre más chico, todo entra en 1366×768 (en pantallas bajas se ocultan las bajadas de las puertas). La fila de números pasó a ser una prueba verificable: recorte real del panel de Métricas ("Ventas brutas +38,9%") + el resultado + link a las capturas. CV y "Escribime" como links de texto.

## 3. "Pasale el mouse o hacé clic" lejos del dragón — resuelto
- **Dónde:** portada, esquina inferior derecha del hero.
- **Cómo arreglarlo:** ponerlo justo debajo del dragón.

## 4. Trayectoria: "Herramientas propias" empieza tarde — resuelto (revisar años de práctica)
- **Dónde:** `js/exp-data.js`.
- **Qué pasa:** dice dic 2025 – hoy, pero Darío construye herramientas propias desde DemasLed.
- **Cómo arreglarlo:** que el capítulo arranque en DemasLed (2025).
- **Hecho:** carril propio "Proyectos" desde ene 2025, en paralelo a DemasLed y Vení a la Cocina. Los años de práctica ahora suman la unión de períodos (sin contar dos veces). Efecto: suben Product Ads 3,3 → 3,8; Imágenes, Precios, Automatización e IA 1,3 → 1,8; Tiendas y webs 3,3 → 3,8. También: "6 webs" → "4 webs" (Odontología Almagro, Tenshi TCG, Lovyme, este portfolio).

## 5. Demasiado espacio entre secciones y fondo liso — resuelto
- **Dónde:** portada (`--pad-y`, secciones).
- **Cómo arreglarlo:** reducir el gap entre secciones y darle al fondo un estilo propio.
- **Hecho:** `--pad-y` de 8,5rem a 5,5rem como máximo (todo el sitio). Fondo "papel milimetrado": grilla de 24 px y línea mayor cada 120 px, fija y desvanecida hacia los bordes, en claro y oscuro.

## 6. Sistema: probar que todo funcione — en curso
- **Qué hacer:** recorrido completo (demo del Tracker, auditoría con cuenta, chequeo rápido, tendencias, formularios) y anotar lo que falle.
- **Prueba del 30/09/2026 (Playwright, producción y local):** anda la demo del Tracker (20 publicaciones, el detalle cambia al elegir una), el catálogo de diagnóstico (10 filas, despliega causas), el buscador de prompts (filtra 22 → 12), la validación del formulario de conexión, el chequeo rápido con un link real (Borner /p/MLA27077244) y mobile en 390 px sin scroll horizontal.
- **Error encontrado: Buscador de tendencias roto.** Mercado Libre responde `404 "Not found public trends"` en `/trends/MLA` y en todas las categorías, aunque el token es válido (`/users/me` da 200). La web decía "Mercado Libre no publica tendencias para esa categoría", que es engañoso porque falla en todas. **Arreglado:** si Mercado Libre corta las tendencias, se muestra la última copia real guardada (colección `tendencias_ultima`, sin vencimiento) con su fecha; si no hay copia, el ejemplo rotulado con un aviso y una oferta de sacarlas a mano. Durante la caída se reintenta como mucho una vez por hora.
- **Falta probar a mano:** la auditoría con la cuenta conectada (OAuth real con Mercado Libre). Necesita que Darío inicie sesión con VJ999.

## 7. Programación: sin niveles ni demos que prueben el valor — en curso
- **Qué pasa:** las 781 fichas no tienen nivel de dificultad ni de valor, y las cards no se distinguen. Las fichas explican pero no muestran: por ejemplo, la skill Impeccable no muestra la diferencia entre una web genérica hecha con IA y la misma web hecha con la skill.
- **Cómo arreglarlo:** clasificar por nivel y por valor, con un símbolo de color en cada card, y sumar demos de antes y después que muestren qué mejora cada ficha.
- **Hecho:** las 781 fichas tienen dificultad (Inicial / Intermedio / Avanzado, barras) y valor (Base ○ / Imprescindible ◆ / Pro ✦), con filtros y orden (`tools/weblab_niveles.py`, se aplica en el build). Piloto de demos (`js/programacion-demos.js`): Impeccable (comparador), Copywriting, Excel, React Best Practices, 3 reglas UX interactivas (contraste, áreas táctiles, etiquetas), Stacks (vanilla y React) y las 74 tipografías (comparador automático).
- **Falta:** llevar las demos al resto de las fichas, en tandas.

## 8. Armá tu web: básico y poco valioso — abierto
- **Qué pasa:** el configurador se siente básico. Hay que decidir si vale la pena y qué rumbo darle.
