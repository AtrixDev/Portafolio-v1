# Calidad base: SEO técnico, accesibilidad y seguridad de la API (07/10/2026)

Pruebas: `node --test backend/test/sitio-calidad.test.mjs` (22). Todo se publica con `python3 tools/build-deploy.py` y `vercel deploy --prod` desde `.deploy/`; **hasta ese deploy, los cambios de API y de cabeceras no están en producción**.

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

### Pendiente a propósito
- **CSP de scripts y estilos** (`script-src`/`style-src`): el sitio usa scripts y estilos en línea y Google Fonts; exige un inventario previo y probarla primero en `Content-Security-Policy-Report-Only`.
- 172 usos de `innerHTML` sin escape evidente en una búsqueda por texto: revisar caso por caso con un helper único.
- El token de admin vive en `sessionStorage`: aceptable mientras no haya XSS; la CSP de scripts es la mitigación real.
