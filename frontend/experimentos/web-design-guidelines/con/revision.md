# Revisión de `index.html` — Brasa, parrilla de barrio

Revisión hecha con las [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) de Vercel (skill `web-design-guidelines`), más chequeo manual de contraste y de la lógica del script. No se tocó el HTML.

Los problemas están ordenados de más grave a menos grave. Las referencias son `archivo:línea`.

---

## 🔴 Crítico: rompen la conversión (reservar)

### 1. El número de WhatsApp es de mentira
`index.html:442` — `const WHATSAPP = "5491100000000";`

Todos los botones de reserva (son 5: header, portada, tarjeta, bloque final y botón flotante) mandan a este número. Si la página sale así, **nadie puede reservar**. Hay un comentario ⚠️, pero es lo primero que hay que cambiar antes de publicar.

### 2. Sin JavaScript, los CTA de reserva no van a ningún lado
`index.html:292`, `:309`, `:413`, `:420`, `:436` — `href="#"` que el script reemplaza recién en `:446-450`.

Si el JS no carga, tarda, o falla (bloqueadores, conexión mala, error de sintaxis futuro), tocar "Reservar" te sube al principio de la página y listo. Es la acción principal del sitio y no debería depender de JS.
**Arreglo:** poner la URL `https://wa.me/…?text=…` directamente en el `href` (o sea, generarla una vez y pegarla en el HTML). El script sobra para esto.

---

## 🟠 Alto: accesibilidad y uso en celulares

### 3. El encabezado fijo tapa los títulos al navegar por anclas y el foco del teclado
`index.html:52-57` (`.cabecera` con `position: sticky`) — falta `scroll-margin-top` / `scroll-padding-top`.

Al tocar "La carta", "Nosotros" o "Cómo llegar", la sección arranca debajo del header (~65 px), así que el título `h2` queda escondido. Lo mismo al tabular: los enlaces pueden quedar tapados por el header (WCAG 2.4.11, *Focus Not Obscured*).
**Arreglo:** `html { scroll-padding-top: 5rem; }`.

### 4. En celulares desaparece toda la navegación
`index.html:71` — `@media (max-width: 640px) { .nav a:not(.boton) { display: none; } }`

Por debajo de 640 px se ocultan "La carta", "Nosotros" y "Cómo llegar" sin dar ninguna alternativa (ni menú hamburguesa ni links en otro lado). Justo en el dispositivo donde más se va a usar la página, la única forma de llegar a la carta o a la dirección es scrollear.
**Arreglo:** una fila de links compacta con scroll horizontal, o un `<details>`/menú simple.

### 5. El botón flotante tapa contenido y no respeta el área segura
`index.html:261-265` (`.flotante`).

- `bottom: 1rem` sin `env(safe-area-inset-bottom)`: en iPhone queda encima de la barra de inicio. Falta además `viewport-fit=cover` en `:5` si se quiere usar el inset.
- El `footer` (`:256`) no tiene espacio abajo, así que al final de la página el botón **tapa el texto del pie** (horario y dirección).
- Entre 641 y 820 px se ven a la vez el "Reservar" del header y el flotante; en la portada, además, conviven con el CTA grande. Tres botones iguales en la misma pantalla.
**Arreglo:** `bottom: calc(1rem + env(safe-area-inset-bottom))`, `padding-bottom` extra en el footer, y mostrar el flotante recién cuando el CTA de la portada sale de pantalla (o esconder el del header cuando está el flotante).

### 6. Links que abren otra pestaña sin avisar, y flechas que el lector de pantalla lee
`index.html:402`, `:413` (y todos los `.js-whatsapp` por `:448`).

Se abren en pestaña nueva con `target="_blank"` sin decirlo. Además, el `↗` de "Abrir en Google Maps ↗" y "Escribinos ahora ↗" lo leen los lectores de pantalla como "flecha hacia arriba a la derecha".
**Arreglo:** `<span aria-hidden="true">↗</span>` más un texto oculto "(se abre en otra pestaña)". Para WhatsApp en celular, el `target="_blank"` directamente no hace falta.

---

## 🟡 Medio: experiencia de uso y contenido

### 7. No hay ni una foto de la comida
Es una parrilla y la landing no muestra un solo plato ni el lugar. Todo el peso de la decisión queda en el texto. Suele ser lo que más convence en rubro gastronómico. Si se agregan fotos: `width`/`height` explícitos, `loading="lazy"` debajo del pliegue, `fetchpriority="high"` en la de portada y formatos AVIF/WebP.

### 8. Sin vista previa al compartir por WhatsApp o redes
`index.html:3-10` — faltan las etiquetas Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) y Twitter Card.

Irónico para un negocio que vive de WhatsApp: cuando alguien pase el link al grupo, sale sin imagen ni tarjeta. También convendría un JSON-LD `Restaurant` (dirección, horarios, `aggregateRating`) para aparecer mejor en Google Maps y la búsqueda local.

### 9. No hay alternativa a WhatsApp
La única forma de reservar o consultar es WhatsApp. No hay teléfono (`tel:`), ni mail, ni link a Instagram. A alguien sin WhatsApp (turistas, gente mayor, desktop sin la app) no le queda opción.

### 10. "Lo que sale hoy" es una carta fija
`index.html:326-328` — el título y el texto dicen que "la pizarra cambia según lo que consigamos en el día", pero la lista es HTML estático. Si un día no hay mollejas, la página igual las promete. Cambiar el texto a algo como "Nuestros clásicos" o aclarar que es una muestra.

### 11. El horario "20 a 00 h" se entiende a medias
`index.html:317`, `:406`, `:432`, `:465` — "de 20 a 00 h" y "hasta las 00 h" son raros de leer. "de 20 a 24 h" o "de 20 h a medianoche" es más claro. Ojo que al estar abierto, el script reemplaza el horario de la portada por "Abierto ahora · hasta las 00 h" y se pierde la info de qué días abren.

### 12. La calificación no se puede verificar
`index.html:315`, `:381-387` — "4,8 en Google · 1.247 reseñas" no enlaza a las reseñas. Un link a la ficha de Google suma credibilidad. Detalle menor: se muestran 5 estrellas llenas para un 4,8, y en la cita el lector de pantalla oye "4,8 en Google" sin el "de 5".

---

## 🟢 Bajo: pulido

- `index.html:2` — falta `color-scheme: dark` en `:root`/`html`: la barra de scroll y los controles nativos salen en modo claro sobre el fondo oscuro.
- `index.html:286`, `:431` — la marca "Brasa" sin `translate="no"`: el traductor automático de Chrome la puede convertir en "Ember" a los turistas.
- `index.html:337`, `:317`, `:406` — espacios no separables entre número y unidad (`400&nbsp;g`, `20&nbsp;h`) para que no queden cortados en dos líneas.
- `index.html:332` — la etiqueta "La de la casa" está adentro del `<h3>`, así que el nombre del título queda "Vacío a las brasas La de la casa". Mejor sacarla del heading o que el lector la lea separada.
- `index.html:284` — el logo apunta a `href="#"`. Mejor `href="/"` o `href="#contenido"`.
- `index.html:54-55`, `:92-101` — `backdrop-filter: blur()` en el header fijo más un gradiente con `filter: blur(10px)` animado en loop infinito: en celulares de gama baja puede trabar un poco el scroll. La animación sí respeta `prefers-reduced-motion` (bien).
- Falta `touch-action: manipulation` y definir `-webkit-tap-highlight-color` en botones y links (se ve el flash gris al tocar en Android/iOS).
- `index.html:454-467` — el estado abierto/cerrado se calcula una sola vez al cargar; si alguien deja la pestaña abierta desde las 19:50, sigue diciendo "Hoy abrimos a las 20 h". Un `setInterval` cada minuto lo resuelve. (La lógica en sí está bien, incluido el caso de las 00 h.)

---

## ✅ Lo que está bien

- `lang="es-AR"`, `meta description`, `theme-color` que coincide con el fondo, favicon inline.
- Link para saltar al contenido, `nav` con `aria-label`, jerarquía de títulos correcta (un `h1`, `h2` por sección, `h3` adentro).
- Íconos decorativos con `aria-hidden="true"`; el botón flotante tiene `aria-label` que incluye el texto visible.
- Foco visible con `:focus-visible`; sin `outline: none`.
- `prefers-reduced-motion` respetado en el scroll suave y en la animación de la portada; `transition` con propiedades explícitas (no `all`).
- **Contrastes medidos, todos pasan WCAG AA**: texto secundario `#a8988a` sobre fondo 6,6:1; naranja `#ff8a3d` sobre fondo 7,8:1; botón 5,7:1; precios `#8f3312` sobre crema 6,7:1; notas `#6d5a4d` 5,5:1.
- Rendimiento de base excelente: sin fuentes externas, sin imágenes, CSS inline, un script chiquito. `font-variant-numeric: tabular-nums` en precios y `text-wrap: balance` en el `h1`.
