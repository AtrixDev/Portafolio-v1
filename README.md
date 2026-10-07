# Darío Colángelo — Portfolio y herramientas de e-commerce

Web personal de un analista de Mercado Libre que construye sus propias herramientas.
**En vivo:** https://portafolio-v1-dun-ten.vercel.app

- **Herramientas:** chequeo de publicación, rentabilidad, importación, pérdida en publicidad, auditoría de cuenta y más.
- **Guías:** guías de conversión, ACOS, SEO, pricing y métricas en Mercado Libre (`lab.html`).
- **Cómo trabajo:** IA y datos aplicados a Mercado Libre: demo del ML Tracker, diagnóstico, método, skills y prompts (`sistema.html`).
- **Desarrollo web:** Revisá tu web, Armá tu web y la Biblioteca web (`programacion.html`).
- **ML Tracker** (dentro del panel): analiza cuentas con la API oficial de Mercado Libre vía OAuth —
  tendencias con pruebas estadísticas, diagnóstico de caídas, motor de precios, rentabilidad real,
  stock, calidad y competencia en catálogo.

**Stack:** HTML/CSS/JS sin framework · Node.js (funciones serverless en Vercel) · MongoDB Atlas · API de Mercado Libre.

---


## Estructura del proyecto

```
proyecto/
├── frontend/                 ← Lo que se publica (Vercel sirve esta carpeta)
│   ├── index.html            ← Inicio: CV / trayectoria
│   ├── herramientas.html     ← Mercado Libre · Hacer: vitrina de herramientas (incluye el ÚNICO Chequeo de publicación)
│   ├── rentabilidad · importar · perdida · informe-muestra .html  ← herramientas y muestra
│   ├── sistema.html          ← Cómo trabajo (+ Auditoría de cuenta: el retorno de OAuth apunta a sistema.html?auditoria=…#auditar)
│   ├── lab.html (+ 8 guías)  ← Guías de Mercado Libre
│   ├── web.html · armar.html ← Desarrollo web: Revisá tu web · Armá tu web
│   ├── programacion.html     ← Biblioteca web (base de conocimiento, ejemplos en prog-ejemplos/)
│   ├── vinculado.html        ← vuelta de OAuth de un cliente; ia.html y tracker.html son redirects históricos
│   ├── contacto.html         ← Contacto (canales + formulario; acepta ?asunto= y ?pub=)
│   ├── admin.html            ← Panel: contenido, portfolio, mensajes, cuenta de ML
│   ├── css/  root · shared · simulador · index · tracker · contacto · programacion · lab · page
│   ├── js/   main (común) · score · simulador · index · tracker · contacto · programacion
│   ├── data/weblab/          ← JSON de la Biblioteca web (generado)
│   └── assets/               ← icons.svg, fotos, CV en PDF
│
├── backend/                  ← Funciones serverless (Vercel)
│   ├── api/
│   │   ├── db.js             ← Conexión MongoDB
│   │   ├── login.js          ← POST /api/login
│   │   ├── content.js        ← GET/POST /api/content
│   │   ├── portfolio.js      ← GET/POST/DELETE /api/portfolio
│   │   ├── audit.js          ← POST /api/audit        (auditoría de publicaciones)
│   │   ├── ml.js             ← GET  /api/ml?action=…  (vincular cuenta de ML)
│   │   ├── ml-callback.js    ← GET  /api/ml-callback  (vuelta de OAuth de ML)
│   │   ├── contact.js        ← POST/GET/PATCH/DELETE /api/contact
│   │   └── academia.js       ← GET/POST /api/academia (progreso de la Academia IA)
│   └── lib/                  ← Código compartido (no son endpoints)
│       ├── http.js · ml.js · audit.js
│
└── tools/                    ← Scripts de mantenimiento (no se publican)
    ├── dev-server.mjs        ← Servidor local: web + /api, sin instalar vercel
    ├── site-shell.py         ← Fuente única del menú (NAV), del pie y del resaltado activo (GRUPO_POR_PAGINA) en todas las páginas
    ├── build-weblab.py       ← Genera data/weblab/ (Biblioteca web)
    └── weblab_curado.py      ← Contenido en castellano de la Biblioteca web
```

## Ver local con todo funcionando

Necesita Node y MongoDB corriendo.

```bash
cd backend && npm install && cd ..
MONGODB_URI=mongodb://127.0.0.1:27017 node tools/dev-server.mjs
```

Abrí http://localhost:3000 (con `PORT=4000` cambiás el puerto).
El script lee también `backend/.env` si existe.

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Obligatoria | Para qué |
|---|---|---|
| `MONGODB_URI` | sí | Base de datos (MongoDB Atlas) |
| `ADMIN_USER`, `ADMIN_PASS` | sí | Login del admin |
| `ADMIN_TOKEN` | sí | Firma de sesiones. Generalo con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ML_APP_ID`, `ML_SECRET` | para la auditoría | Credenciales de tu app en developers.mercadolibre.com.ar |
| `ML_REDIRECT_URI` | para la auditoría | `https://TU-DOMINIO/api/ml-callback` (cargala igual en la app de ML) |
| `GROQ_API_KEY` | no | Si está, la auditoría sugiere un título optimizado con IA |
| `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` | no | Si están, cada mensaje del formulario también te llega por mail |

## Activar la auditoría de ML Tracker

Mercado Libre ya no deja leer publicaciones sin autenticación (el scraping redirige a un captcha
y la API pública responde 403). Por eso el servidor usa **tu** cuenta:

1. En developers.mercadolibre.com.ar → tu app → Redirect URIs: agregá `https://TU-DOMINIO/api/ml-callback` (sin borrar la del Meli Tracker). Tildá el flujo **Refresh Token**. El login usa PKCE, así que funciona tenga o no tildado "Requiere PKCE". Permisos mínimos: Usuarios (lectura) y Publicación y sincronización (lectura).
2. Cargá `ML_APP_ID`, `ML_SECRET` y `ML_REDIRECT_URI` en Vercel y redeployá.
3. Entrá a `admin.html` → **Mercado Libre** → **Vincular**. Aceptás en ML y volvés al admin.

El token se renueva solo. Si se vence o lo revocás, el admin te avisa para volver a vincular.

## Mantenimiento

- **Menú / pie de todas las páginas:** editá `NAV_ITEMS` en `tools/site-shell.py` y corré `python3 tools/site-shell.py`.
- **Biblioteca web (programacion.html):** sumá fichas en `tools/weblab_curado.py` y corré `python3 tools/build-weblab.py`. Lo que viene de la skill ui-ux-pro-max (en inglés) se traduce con `tools/weblab_traducciones.json`; si el script avisa textos sin traducir, agregalos ahí.
- **Skills de Claude (Biblioteca web):** editá `tools/weblab_skills.py` y corré `python3 tools/build-weblab.py`. Los ejemplos de tipos de web y los diagramas de arquitectura están en `EJEMPLOS` y `FLUJOS` de `tools/weblab_curado.py`; las vistas "Así se ve" se dibujan en `frontend/js/programacion-ejemplos.js`.
- **Academia IA / página IA:** todo el contenido (skills, plan, prompts, sistemas, stack) está en `frontend/data/ia-meli.json`; lo leen `ia.html` (pública) y la sección Academia IA del admin (`js/academia.js`). El progreso se guarda en la colección `academia`; solo las skills marcadas "mostrar en la web" salen en `/api/academia?action=publico`. Las skills de Claude sueltas están en `../../Skills-MELI/skills/`.
- **Capturas de resultados:** `frontend/assets/resultados/` (montos en pesos difuminados a propósito).
- **Tema claro/oscuro:** los colores están como variables en `frontend/css/root.css`.
- **Algoritmo del score:** vive en `backend/lib/audit.js` (API) y en `frontend/js/score.js` (simulador y auditoría de ejemplo). Si cambiás pesos o umbrales, cambialos en los dos.

## Sistema de diseño (rediseño sep-2026)

- **Color:** grafito + un solo acento amarillo (`--accent`). Verde/ámbar/rojo sólo para estados de datos (score, checks).
- **Tipos:** Bricolage Grotesque (títulos), Geist (texto), JetBrains Mono (datos y etiquetas `//`).
- **Radios:** superficies 16px, controles 10px, botones y chips en píldora.
- **Hojas:** `root.css` (tokens) → `shared.css` (nav, botones, pie, componentes del Lab) → hoja de la página → `surfaces.css` (vacía, última capa).
- **`tracker.html`** ya no es una página con contenido: redirige a `herramientas.html#tracker` (la demo pública está en `sistema.html#demo`).
- El frontend anterior quedó en `_backup-frontend-2026-09-25-pre-rediseno/`.

## Publicar en Vercel (proyecto `portafolio-v1`)

```bash
python3 tools/build-deploy.py        # arma .deploy/ (web en public/ + api/ + lib/)
cd .deploy && vercel deploy --prod   # la primera vez: vercel link --yes --project portafolio-v1
```

- El proyecto de Vercel tiene *Root Directory* = `dariocolangelo-portfolio/v2` (herencia del repo viejo); el script arma esa ruta dentro de `.deploy/`.
- Base de datos: MongoDB Atlas **Cluster0** (plan Free), base `portafolio`, usuario `portafolio` con el rol propio `portfolio-rw` (sólo lectura/escritura en esa base).
  **Ojo:** ese cluster también lo usa la web de Odontología Almagro (base `smiledesign`). No borrar ni cambiar el cluster.
- Variables en Vercel (production y preview): `MONGODB_URI`, `ADMIN_USER`, `ADMIN_PASS`, `ADMIN_TOKEN`, `ML_APP_ID`, `ML_SECRET`, `ML_REDIRECT_URI`.
