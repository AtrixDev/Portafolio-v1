# Design: Brasa

## World
Mantel de papel madera de parrilla. La casa imprime en rojo; el mozo escribe en birome azul. Dos tintas, nada más. Sin fotos ni ilustraciones: la tipografía y los trazos hacen el trabajo.

## Color tokens
| token | valor | uso |
|---|---|---|
| --kraft | #c8995f | fondo total (drenched), con grano SVG y pliegues |
| --kraft-hondo | #b8874d | pista de scrollbar |
| --papel | #f3e3c8 | texto calado sobre sellos rojos |
| --rojo | #971a10 | impresos grandes (≥24px o bold ≥18.7px), guardas, filetes, sellos |
| --rojo-tinta | #6a120b | texto impreso de cuerpo (≥4.5:1 sobre kraft) |
| --birome | #172672 | todo lo manuscrito, foco, selección |
| --vino | rgb(110 24 34 / .1–.35) | aros de copa (mancha, no tinta) |

## Type
- Impresa: Archivo variable. Display 900 con wdth 62, en mayúsculas y line-height .9. Cuerpo entre 400 y 700 con wdth 88–92.
- Birome: Kalam 400/700, con leves rotaciones (−2° a 1.5°).
- Display máx. 6rem; el logo BRASA es un SVG `<text>` con filtro de tinta porosa.

## Components
- **Sello**: botón rojo con máscara de grano, filete interior calado, rotado −2°; al hover se endereza y sube.
- **Guarda**: banda impresa con texto repetido entre filetes dobles (arriba y abajo de la página).
- **Filete de sección**: doble línea roja de 2px (pseudo-elemento).
- **Selección = círculo de birome** (chips de día y hora, día de hoy, puntaje). **Tilde de birome** para los platos marcados.
- **Renglones**: caja con renglones azules para el mensaje de WhatsApp.

## Motion
Un momento: la birome dibuja el círculo del puntaje y el subrayado de "Hoy hay" (stroke-dashoffset, ease-out expo). Los tildes se dibujan al marcar. Todo se desactiva con prefers-reduced-motion.

## Layout
Contenido de 78rem de ancho máximo. Portada 7/5, comanda 5/7 y dónde 1/1; pasa a una columna a 880px. En el celular hay una barra-sello fija que se oculta mientras se ve el CTA de la portada o la comanda.
