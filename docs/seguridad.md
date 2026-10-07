# Calidad base: SEO técnico, accesibilidad y seguridad de la API (07/10/2026)

Pruebas: `node --test backend/test/sitio-calidad.test.mjs` (23). Se publica con `python3 tools/build-deploy.py` y `vercel deploy --prod` desde `.deploy/`. **Ya está en producción** (ver «Estado y validación»).

## SEO técnico
- `tools/seo-tecnico.py` (idempotente; `--check` para verificar) pone `canonical` + `og:url` en las 21 páginas indexables y genera `frontend/robots.txt` y `frontend/sitemap.xml`. Hay que correrlo al crear una página.
- Indexable = sin `noindex` y no 404. Quedan fuera: `admin`, `vinculado`, `404`, `ia` y `tracker` (los dos últimos son redirects históricos).
- El canonical es la URL **limpia**: `?r=` (resultado compartido), `?asunto=`/`?pub=`/`?motivo=` (contacto) y `?auditoria=` (vuelta de OAuth) son variantes de la misma página. Los parámetros no se reescriben ni redirigen y siguen funcionando.
- `robots.txt` bloquea solo `/api/` y **no** usa `Disallow` con `?` o `*`. `admin.html` no figura (se protege con `noindex` y login; listarlo avisaría de su existencia).
- Dominio: `SITE` vale `https://portafolio-v1-dun-ten.vercel.app`. Con dominio propio: `SITE_URL=https://… python3 tools/seo-tecnico.py` y redeploy.

## Accesibilidad base
- `<main>` agregado en `importar`, `rentabilidad` y `sistema` (lo hace `tools/site-shell.py`, de forma idempotente; el ancla `#contenido` quedó donde estaba). `admin`: el login es un `<main>` y el panel tiene su propio `<main id="cp-main">` con skip link.
- `programacion.html`: la `<nav>` de categorías ahora tiene `aria-label` (había varias `nav` sin distinguir).
- Movimiento reducido: ya estaba cubierto de forma global en `css/root.css` (todas las páginas con contenido lo cargan), así que no se tocó ninguna animación. Se corrigieron los dos únicos desplazamientos suaves de JS que lo ignoraban (`sistema.js`, `academia.js`). Un test impide reintroducir `behavior: 'smooth'` sin comprobarlo.
- `vinculado.html` (vuelta de OAuth, una sola tarjeta sin menú) no lleva skip link a propósito.

## Seguridad
### CORS (`backend/lib/cors.js`)
- Antes: `Access-Control-Allow-Origin: *` en todos los endpoints. Ahora se permite el **mismo origen**, `PUBLIC_URL`, los de la variable `CORS_ORIGINS` (lista separada por comas) y `localhost` fuera de producción.
- Se mantiene `*` solo para **GET** de `content` y `portfolio` (datos públicos que podrían embeberse).
- Compatibilidad: el frontend llama siempre con rutas relativas, así que no cambia nada para el sitio. Si algún sitio externo consumía otros endpoints desde el navegador, agregar su origen a `CORS_ORIGINS` (sin redeploy de código).
- No es una barrera de seguridad por sí sola (la API se protege con el token y los límites de uso): es defensa en profundidad.

### Token de admin en `?t=`
- Problema: la sesión (30 días) viajaba en la URL al vincular Mercado Libre (historial, logs, Referer), y `isAdmin` la aceptaba en **cualquier** endpoint.
- Ahora `isAdmin` solo acepta `Authorization: Bearer`. El único caso que necesita URL es la navegación al login de ML: `POST /api/ml?action=ticket` (con sesión) devuelve un **ticket de 2 minutos con alcance `ml-login`** que solo sirve para ese login (no abre otros endpoints; la sesión normal no sirve como ticket).
- El panel ya usa el ticket. **Migración:** `?t=` con la sesión completa sigue aceptado **solo** en `GET /api/ml?action=login` (enlaces o pestañas viejas). Pasos: (1) este deploy; (2) esperar 30 días (todas las sesiones emitidas antes expiran solas); (3) definir `ADMIN_QUERY_TOKEN=off` en Vercel para apagarlo, sin tocar código. El login de ML responde además `Cache-Control: no-store` y `Referrer-Policy: no-referrer`.
- Los enlaces de invitación para clientes (`inv=`) y el cron (`CRON_SECRET`) no cambian.

### Cabeceras (`tools/build-deploy.py` → `vercel.json`)
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy` (sin cámara, micrófono, geolocalización, pagos ni USB) y una CSP **mínima**: `base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'`. Se verificó que ninguna página ni los iframes de la Biblioteca generan violaciones. HSTS lo agrega Vercel.

## Estado y validación (cierre de la etapa, 07/10/2026)
- **Desplegado** a producción el 07/10/2026 (deployment `portafolio-v1-wy7wu36sm`, 17:38 hora argentina).
- **Verificado en producción** (QA post-deploy): las 26 páginas sin errores de JS; las 6 cabeceras en todas; `robots.txt` y `sitemap.xml` idénticos a los del repo (21 URLs, todas 200); canonical correcto; CORS por origen; parámetros `?r=`, `?asunto=`, `?pub=` y `?auditoria=`; navegación; Architect 134/134; 128 archivos servidos con SHA-256 idéntico al local. Tests locales: 296/296.
- **Flujo «Vincular» con Mercado Libre:** validado por Darío en producción, con su cuenta real, de punta a punta (admin → Cuentas → Vincular con el ticket de 2 minutos → autorización en Mercado Libre → vuelta al panel). Funcionó correctamente. Era el único flujo que había cambiado de comportamiento y que no se había podido cubrir con pruebas automáticas.
- Con esto queda **cerrada la etapa de profesionalización base** del portfolio (SEO técnico, accesibilidad base y seguridad de la API).

## Backlog técnico futuro
Nada de esto está en curso; son decisiones y trabajos para fases posteriores.
1. **Apagar el `?t=` con la sesión completa (`ADMIN_QUERY_TOKEN=off`).** Cuando termine el período de migración: las sesiones emitidas antes del deploy duran 30 días, así que desde el **06/11/2026** ya no queda ninguna vigente. Definir la variable en Vercel y redeployar (no requiere cambios de código); luego probar «Vincular» una vez más. El ticket de 2 minutos sigue funcionando.
2. **CSP más estricta (`script-src`/`style-src`), si se decide hacerla.** Requiere inventariar scripts y estilos en línea y Google Fonts, y probarla primero en `Content-Security-Policy-Report-Only`. Es la mitigación real para el token en `sessionStorage`.
3. **Auditoría de `innerHTML`/XSS.** Había 172 usos sin escape evidente en una búsqueda por texto (es una señal, no un bug confirmado): revisar caso por caso con un helper único de escape.
4. **CI.** Hoy los tests (`node --test backend/test/`, 296) y los QA de navegador (`tools/qa-architect.py`) se corren a mano. Un pipeline mínimo con los tests y `tools/seo-tecnico.py --check`; el chequeo de fuentes de Architect (`tools/architect-verificar-fuentes.mjs`) podría correr programado.
5. **Mejoras de performance** (no se tocó nada en esta etapa): `defer` en los 7 scripts de `programacion.html`, dimensiones de las imágenes de la home, peso de `experimentos/` y `prog-ejemplos/` que se publican, CV en PDF de 2,6 MB, imagen `og:image` y galería alojadas en el CDN de Mercado Libre, y Google Fonts autoalojadas.
6. **Otras mejoras de accesibilidad pendientes:** confirmar que `arquitecto.html` renderiza su `<h1>` (el HTML estático no lo trae), revisar el contraste y el foco de las pantallas con más JS (Tracker, Biblioteca web) y probar con lector de pantalla; `vinculado.html` queda sin skip link a propósito.
7. **Otros:** subir los commits locales a `origin` (la rama `main` lleva 16 de adelanto), y datos estructurados propios (`Person`, `WebSite`) si interesa el SEO.
