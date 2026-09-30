# Revisión de `index.html` — Brasa, parrilla de barrio

Revisé accesibilidad, rendimiento y experiencia de uso. Los problemas están ordenados de más a menos importante. Las referencias de línea apuntan a `index.html`.

En general la base está bien: `lang="es-AR"`, jerarquía de títulos correcta (h1 → h2 → h3), link para saltar al contenido, `focus-visible` definido, se respeta `prefers-reduced-motion` en el scroll y en la animación, no hay fuentes externas ni imágenes pesadas, y los contrastes principales pasan AA (por ejemplo, el texto del botón sobre naranja da ~5,7:1, el precio `#8f3312` sobre hueso ~6,6:1 y `--humo` sobre carbón ~6,5:1). Lo que sigue es lo que hay que corregir.

---

## 🔴 Crítico

### 1. El número de WhatsApp es de mentira
**Líneas 441-442.** `const WHATSAPP = "5491100000000";` es un placeholder, y el comentario mismo lo avisa. **Todos** los botones de reserva (cabecera, portada, tarjeta "Reservas", bloque final y botón flotante) mandan a ese número. Como la página tiene un solo objetivo, que es conseguir reservas, así como está no convierte nada.

**Qué hacer:** poner el número real antes de publicar. Conviene revisarlo a mano abriendo el `wa.me` desde un celular.

### 2. Todos los botones de reserva dependen de JavaScript (`href="#"`)
**Líneas 292, 309, 413, 420, 436.** En el HTML los enlaces tienen `href="#"` y el script después les pone la URL. Si el JS no carga, tira error o lo bloquea una extensión, o si el visitante lo abre en un navegador embebido que falla, el botón **lleva al principio de la página** y no pasa nada más. Además, los buscadores y las vistas previas ven `#` como destino.

**Qué hacer:** escribir la URL de `https://wa.me/…?text=…` directamente en el `href` de cada enlace (con `target="_blank" rel="noopener"`). El JS queda opcional o se saca.

---

## 🟠 Alto

### 3. La única forma de reservar es WhatsApp, y el número no aparece en ningún lado
No hay teléfono visible ni enlace `tel:`. En la compu, `wa.me` abre WhatsApp Web, que pide escanear un QR. Mucha gente (la más grande, sobre todo, o quien no tiene WhatsApp en ese dispositivo) prefiere llamar o anotar el número. Encima, la tarjeta "Reservas" (líneas 409-414) dice "Por WhatsApp" pero no muestra el número.

**Qué hacer:** mostrar el número en texto (en la tarjeta "Reservas" y en el pie) y sumar un `<a href="tel:+54911…">` como alternativa.

### 4. En celulares desaparece la navegación
**Línea 71.** Por debajo de 640 px se ocultan "La carta", "Nosotros" y "Cómo llegar" con `display: none` y no se ofrece nada a cambio: ni menú hamburguesa ni links en otro lado. Justo el público de celular, que es el que más busca "cómo llegar", pierde el acceso directo.

**Qué hacer:** o bien un menú colapsable (un `<button aria-expanded>` que muestre los links), o bien dejar los tres links en una fila compacta y con scroll horizontal debajo de la marca. Con tres links cortos, la segunda opción alcanza.

### 5. El botón flotante tapa contenido y duplica al de la cabecera
**Líneas 261-265 y 436-438.** En pantallas de hasta 820 px aparecen **dos** botones "Reservar" fijos todo el tiempo: el de la cabecera sticky y el flotante. Además, el flotante queda encima del contenido del final: el texto del pie, el enlace "Escribinos ahora" y el propio botón "Reservar por WhatsApp" del bloque final. No hay `padding-bottom` que le deje lugar.

**Qué hacer:**
- Elegir uno: o se oculta el botón de la cabecera en celulares o se saca el flotante.
- Si se queda el flotante, agregar espacio al final (por ejemplo `footer { padding-bottom: 5rem }` en móvil) y usar `bottom: max(1rem, env(safe-area-inset-bottom))` para los iPhone con barra inferior.
- Se puede ocultar cuando el bloque `.reserva-final` está a la vista (con un `IntersectionObserver`), para no tener dos botones iguales uno arriba del otro.

---

## 🟡 Medio

### 6. Enlaces que abren otra pestaña sin avisar, y la flecha "↗" se lee en voz alta
**Líneas 402 y 413**, más todos los `.js-whatsapp`, porque el script les pone `target="_blank"`. Quien usa lector de pantalla no se entera de que se abre otra pestaña. Además, el "↗" se anuncia literalmente ("flecha hacia arriba a la derecha").

**Qué hacer:** envolver la flecha en `<span aria-hidden="true">↗</span>` y agregar un texto oculto visualmente: `<span class="sr-only">(se abre en otra pestaña)</span>`.

### 7. Las secciones quedan medio pegadas o tapadas por la cabecera sticky
**Línea 53** (`position: sticky`). Al tocar "La carta" o "Cómo llegar", la sección arranca en el borde superior y queda detrás de la cabecera, que mide unos 65-70 px. En celular el padding superior de la sección es de 4rem (64 px), así que el título queda justo al ras o apenas tapado. Lo mismo pasa con "Saltar al contenido".

**Qué hacer:** `section[id], main { scroll-margin-top: 5rem; }`.

### 8. El cartel "Abierto / Cerrado" tiene casos flojos
**Líneas 452-467.**
- **No se actualiza:** si alguien entra a las 19:55 y deja la pestaña abierta, sigue diciendo "Hoy abrimos a las 20 h" después de las 20. Conviene recalcularlo cada minuto con `setInterval` o al volver a la pestaña con `visibilitychange`.
- **Pisa el horario:** el texto reemplaza a "Mar. a dom. · 20 a 00 h". El que entra un martes a la tarde ve "Hoy abrimos a las 20 h" pero ya no ve qué días abren. Mejor mostrar el estado **además** del horario, no en su lugar.
- **Feriados y cierres excepcionales:** no están contemplados. Si algún día cierran, la página va a decir "Abierto ahora" igual. Como mínimo, tener una lista de fechas cerradas en el script.

### 9. Rendimiento: blur animado a pantalla completa y `backdrop-filter`
**Líneas 92-101 y 55.** El resplandor de la portada es un pseudo-elemento enorme (120 % de ancho y 90 % de alto) con `filter: blur(10px)` y una animación de opacidad **infinita**. A eso se suma el `backdrop-filter: blur(8px)` de la cabecera sticky, que se recalcula en cada scroll. En celulares de gama baja eso se nota en fluidez y en batería. El resto de la página es liviano, así que es lo único que pesa.

**Qué hacer:**
- Sacar el `filter: blur(10px)`: los `radial-gradient` ya tienen bordes suaves y visualmente casi no cambia.
- Agregar `will-change: opacity` al `::before` para que la animación quede en el compositor, o directamente frenar la animación cuando la portada sale de pantalla.
- Evaluar si el `backdrop-filter` hace falta: con un fondo al 88 % de opacidad casi no se ve el desenfoque.

---

## 🟢 Bajo

### 10. Detalles de lectores de pantalla en títulos y datos
- **Línea 332:** la etiqueta "La de la casa" está **dentro** del `<h3>`, así que el título se anuncia como "Vacío a las brasas La de la casa". Conviene sacarla del `<h3>` o separarla con texto oculto (", la de la casa").
- **Líneas 368, 372, 376:** los números "01", "02" y "03" se leen como parte del título ("cero uno El fuego"). Son decorativos: `aria-hidden="true"`.
- **Líneas 315 y 382:** se esconden las estrellas (bien), pero entonces se anuncia "4,8 en Google" sin decir sobre cuánto. Agregar "de 5" en texto oculto.

### 11. La etiqueta "La de la casa" es muy chica
**Línea 188.** `font-size: .7rem` equivale a ~11 px, en mayúsculas y con tracking. Es difícil de leer en celular. Subirla a `.75rem`-`.8rem` como mínimo.

### 12. Datos útiles que no son enlaces
- **Línea 316:** "Thames 1234" en la portada es texto plano. Si fuera un enlace a Google Maps ahorraría el scroll hasta "Cómo llegar".
- **Líneas 315 y 385:** "4,8 en Google · 1.247 reseñas" no enlaza a las reseñas. Enlazarlas suma confianza.

### 13. Sin vistas previas para compartir ni datos estructurados
No hay etiquetas Open Graph (`og:title`, `og:description`, `og:image`). Justamente para un restaurante que vive de WhatsApp, cuando alguien comparta el link en un grupo va a salir sin imagen y con una vista pobre. Tampoco hay JSON-LD de tipo `Restaurant` (dirección, horario, rango de precios), que ayuda a aparecer bien en búsquedas locales y en Maps. Falta además un `apple-touch-icon`, porque el favicon SVG embebido no sirve para "Agregar a inicio" en iOS.

### 14. `color-mix()` sin respaldo
**Línea 54.** En navegadores que no soportan `color-mix()` (Safari anterior a 16.2, Chrome anterior a 111) la declaración se descarta y la cabecera sticky queda **transparente**, con el texto encima del contenido. Hoy es poca gente, pero el arreglo es trivial: poner antes `background: rgba(26,19,16,.88);`.

### 15. Movimiento en hover sin respetar `prefers-reduced-motion`
**Línea 80.** El `translateY(-1px)` del botón es mínimo, pero para ser consistentes con el resto conviene anularlo dentro del `@media (prefers-reduced-motion: reduce)`.

### 16. Textos repetidos
"Mesa larga" (h1) y "sobremesa larga" (bajada) aparecen uno debajo del otro. "Trato de vecino" se repite en la bajada y en la intro de "Nosotros". No es un error, pero se nota al leer de corrido. Conviene variar alguna de las dos.

---

## Resumen de prioridades

| # | Problema | Impacto | Esfuerzo |
|---|----------|---------|----------|
| 1 | Número de WhatsApp placeholder | Nadie puede reservar | Mínimo |
| 2 | `href="#"` dependiente de JS | Reservas rotas si falla el JS | Bajo |
| 3 | Sin teléfono ni alternativa a WhatsApp | Se pierden reservas desde la compu | Bajo |
| 4 | Sin navegación en celular | Mala orientación en móvil | Bajo/medio |
| 5 | Botón flotante duplicado que tapa contenido | Molestia en móvil | Bajo |
| 6-9 | Nuevas pestañas, anclas, estado abierto, blur | Accesibilidad y fluidez | Bajo |
| 10-16 | Detalles de lectura, SEO y pulido | Menor | Mínimo |
