# DESIGN.md — Darío Colángelo · Portfolio

Documentado desde el código (`frontend/css/root.css`). Si algo acá contradice los tokens, mandan los tokens.

## Mundo visual

Grafito y un solo acento: amarillo señal. Es una herramienta de trabajo que muestra pruebas, no una landing con decoración. El amarillo marca la acción o el dato que importa y nunca se usa para decorar.

- **Tema oscuro por defecto**, con claro opcional (toggle o preferencia del sistema). En claro, las capas se arman con `--sheet-*` y `--band-bg`.
- **Portada:** "La trayectoria con pruebas". Una línea de tiempo (`.tl-list`) con capítulos por puesto. El capítulo Vení a la Cocina es el grande (caso Borner antes/después con resultados). Arriba van dos puertas: empresas y vendedores.
- **Sistema:** demo en vivo del ML Tracker con una cuenta de ejemplo, más la auditoría gratis por dos caminos (conectar la cuenta o hacer el chequeo rápido).

## Color

| Token | Oscuro | Uso |
|---|---|---|
| `--bg` / `--surface` / `--surface-2` | #0b0b0c / #131315 / #1a1a1d | fondo y capas |
| `--text` / `--text-2` / `--muted` | #ededea / #a7a7ad / #818189 | texto (AA sobre `--bg`) |
| `--accent` / `--accent-ink` | #ffe14a / #141207 | CTA principal, marca, puerta de vendedores |
| `--accent-soft` | amarillo al 10% | fondos teñidos (`.hbox`, cajas destacadas) |
| `--ok` / `--warn` / `--bad` | verde / ámbar / rojo | **solo datos**: estados, checks, antes/después |

Grises de una sola familia, levemente fría. No se suma un segundo acento.

## Tipografía

- **Bricolage Grotesque** (`--font-display`): títulos, con tracking negativo (-.02 a -.04em).
- **Geist** (`--font-sans`): texto y etiquetas.
- **JetBrains Mono** (`--font-mono`): **solo datos** (fechas de la línea de tiempo, IDs, cifras tabulares). No se usa para etiquetas decorativas.
- Tamaño mínimo de texto: .76rem.

## Forma

- Radios: 6 / 10 / 16px y píldora para chips y botones.
- Profundidad: `--edge` (brillo interno de 1px) + `--shadow-md/lg` con sombras neutras. Sin bordes laterales de color (side stripes).
- Contenedor de 1240px; `--pad-y` fluido para las secciones.

## Movimiento (Emil Kowalski)

- `--ease-out: cubic-bezier(.16,1,.3,1)`, 160–280ms, transiciones con propiedades explícitas (nunca `all`).
- Botones y puertas con `scale(.97–.98)` en `:active`. El hover solo aplica con `(hover: hover)`.
- Riel de la línea de tiempo animado por scroll (`animation-timeline: view()`).
- Carga: skeleton con barrido, no puntos que pulsan.
- Todo respeta `prefers-reduced-motion`.

## Prohibido en este proyecto

- Eyebrows o kickers arriba de los títulos (`section-label`, `ph-tag`, etc.).
- Filas de métricas tipo hero, tarjetas iguales en grilla, íconos-glifo.
- Mono como disfraz.
- Clases con prefijo `ad-`: el usuario usa AdBlock y las oculta.
- Precios públicos.
- Datos inventados: las demos usan una "cuenta de ejemplo" que se aclara como tal.

## Lo que funciona con Darío (actualizado 28/09/2026 — leer antes de diseñar)

Aprobado y publicado: portada (`css/port.css`, `js/port.js`, dragón en `js/dragon.js`), Trayectoria (`css/exp.css`, `js/exp.js`, datos en `js/exp-data.js`), Habilidades (`css/hab.css`, `js/hab.js`, `js/hab-data.js`) y Herramientas (`herramientas.html`, `css/herr.css`, `js/herr.js`). Son la vara de calidad.

- **La forma sale del contenido.** Cada sección se diseña para lo que muestra: el tiempo es una línea a escala real, las habilidades un mapa habilidad × puesto, las herramientas una vitrina por estado con demo. Nunca copiar la estética de otra sección como plantilla.
- **Mostrar completo y con pruebas:** capturas, publicaciones reales, links. Nada inventado; si es ejemplo, se rotula "Ejemplo" o "cuenta de ejemplo".
- **Vender por el problema:** cada herramienta arranca con la pregunta que resuelve ("¿Por qué cayeron tus ventas?") y termina en una acción ("Probalo gratis", "Avisame cuando esté").
- **Cada herramienta tiene una demo chica pero valiosa** + botón a la versión completa, a una muestra difuminada o al contacto.
- Colores grafito + amarillo (tokens de `root.css`), claro y oscuro, mobile 390px sin scroll horizontal.
- **Rechazado:** estilos-disfraz (informe impreso, planilla, cartel suizo, vidriera flúo "infantil", cobalto/lima), catálogos de publicaciones como protagonista de la portada, textos genéricos de "analista", líneas de tiempo decorativas que "van para abajo".
- Copy en español argentino con voseo, buena onda, sin exageraciones.
