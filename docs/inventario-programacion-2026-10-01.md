# Inventario de la clasificación actual de Programación

Estado en producción al 01/10/2026 (commit `0ec5853` en adelante). Sale de los datos reales (`frontend/data/weblab/*.json`, `tools/build-weblab.py` y módulos asociados), no de memoria. No propone cambios: solo describe cómo está hoy. Los problemas que detecto van al final.

Las propuestas de rediseño (carpeta `_propuestas/programacion-v2/`) NO están en producción y no figuran acá.

## 0. Ubicación dentro del sitio

El sitio tiene siete entradas de menú. Programación es una de ellas y es la única que usa esta base.

```
Sitio
├── CV (index.html)
├── Herramientas (herramientas.html): 14 herramientas con demo
├── Lab ML (lab.html): guías estáticas de Mercado Libre (acos, anatomía, excels, imágenes, métricas, pricing, reputación, seo, vinculado)
├── Sistema (sistema.html): IA aplicada a Mercado Libre; catálogo de 10 diagnósticos (data/ia-meli.json)
├── Programación (programacion.html): ESTA BASE, 466 fichas
├── Revisá tu web (web.html): diagnóstico de la web de un negocio
└── Contacto (contacto.html)
(Fuera del menú pero existentes: armar.html "Armá tu web", que enlaza a fichas de Programación; ia.html, que redirige a Sistema.)
```

## 1. Estructura de Programación

La base tiene **un solo nivel de jerarquía formal**: grupo del menú lateral → categoría. **No existen subcategorías.** Lo que hace de subdivisión informal son las etiquetas (`tags`) y, en algunas categorías, campos como `severidad` o `familia`.

Total: **466 fichas en 11 categorías y 5 grupos**. 106 son curadas a mano (entre Darío y Claude) y 360 vienen importadas de la skill ui-ux-pro-max (traducidas).

```
Programación (466 fichas)
├── Vender
│   └── Negocios para vender (16)            [id interno: negocios]
├── Construir
│   ├── Tipos de web (13)                    [id interno: soluciones]
│   ├── Arquitecturas (11)
│   ├── Stacks y frameworks (10)
│   └── Servicios (25)
├── Diseñar
│   ├── Rubros (95)                          [importada]
│   ├── Estilos de diseño (68)               [importada]
│   ├── Patrones de landing (34)             [importada]
│   └── Tipografías (67)                     [importada]
├── Revisar
│   └── Buenas prácticas UX (96)             [importada]
└── Con IA
    └── Skills de Claude (31)
```

Atención con los nombres: la categoría que el visitante ve como "Tipos de web" tiene el id interno `soluciones`.

## 2. Detalle por categoría

Convención: **valor** (Imprescindible / Pro / Base) y **nivel** (1 Inicial, 2 Intermedio, 3 Avanzado) son campos de cada ficha. Los números son I/P/B.

### Vender → Negocios para vender (16) · curada
- **Qué representa:** rubros de Argentina a los que se les puede vender una web: qué web necesitan, qué funcionalidades les generan ventas, cómo les trae clientes y el argumento de venta.
- **Campos propios:** `fields` (Qué web le vendés, Funcionalidades que venden, Cómo le trae clientes, Argumento de venta), `related` (a Tipos de web y Servicios), `preset` (datos para precargar el constructor "Armá tu web": nombre, hero, ítems, paleta, fuentes, estilo, objetivo, secciones, funciones).
- **Valor** 8/1/7 · **Nivel** 9 inicial, 7 intermedio · **Tags** 34 distintos (turnos, confianza, WhatsApp…).
- **Demo propia:** ninguna en Programación (el `preset` alimenta armar.html).
- **Ejemplos:** Restaurante, bar o café · Consultorio médico u odontológico · Marca que vende en Mercado Libre.
- **Aparece en git:** 27/09/2026.

### Construir → Tipos de web (13) · curada · id `soluciones`
- **Qué representa:** qué tipo de sitio necesita un proyecto (landing, institucional, portfolio, e-commerce, catálogo, blog, SaaS, dashboard, reservas, marketplace, herramienta interna, documentación, PWA): secciones típicas, funcionalidades clave, errores comunes.
- **Campos propios:** `fields` (A quién se lo vendés, Cuándo conviene, Funcionalidades clave, Complejidad, Secciones típicas, Errores comunes, Ejemplo propio, Ventaja, Clave de diseño), `related`, `examples` (11 de 13, enlaces a sitios reales de terceros).
- **Valor** 6/4/3 · **Nivel** 4/5/4 · **Tags** 32.
- **Demo:** ninguna. Tiene ejemplos externos como enlaces.
- **Ejemplos:** Landing page · E-commerce / tienda online · Dashboard / panel de gestión.

### Construir → Arquitecturas (11) · curada
- **Qué representa:** cómo se organiza una web por dentro (estático, JAMstack, SPA + API, SSR, híbrida, serverless, monolito, BaaS, headless CMS, plataforma de e-commerce, microservicios).
- **Campos propios:** `fields` (Cómo funciona, Ventajas, Desventajas, Tecnologías, Cuándo usarla, Ejemplo propio, Hosting), `flow` (diagrama del recorrido de un pedido), `related` (a Servicios y Stacks).
- **Valor** 4/3/4 · **Nivel** 2/6/3 · **Tags** 23.
- **Demo:** diagrama de flujo generado desde `flow`.
- **Ejemplos:** Sitio estático · Funciones serverless · BaaS.

### Construir → Stacks y frameworks (10) · curada
- **Qué representa:** lenguajes, frameworks y librerías (HTML+CSS+JS, React+Vite, Next.js, Astro, Vue/Nuxt, SvelteKit, Node+Express, MERN, Tailwind, shadcn/ui).
- **Campos propios:** `fields` (Ideal para, Curva de aprendizaje, Lo uso en, Combina con), `related`.
- **Valor** 4/3/3 · **Nivel** 2/5/3 · **Tags** 15.
- **Demo:** las 10 tienen "el mismo botón, en este stack" funcionando, con su código.
- **Ejemplos:** HTML + CSS + JavaScript · React + Vite · SvelteKit.

### Construir → Servicios (25) · curada
- **Qué representa:** servicios de terceros: hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Railway, Render), bases de datos (MongoDB Atlas, Supabase, Firebase), autenticación (Clerk), email y formularios (Resend, Formspree), pagos (Mercado Pago, Stripe), plataformas (Tienda Nube, WordPress, Sanity), analítica (GA4, Plausible, Clarity), imágenes (Cloudinary), IA (Claude API, Groq), errores (Sentry) y dominios (NIC Argentina).
- **Campos propios:** `fields` (Para qué, Sitio, Lo uso en, Por qué elegirlo, Ojo con, Tip, Limitación, Alternativas, Integración), `related`.
- **Valor** 7/7/11 · **Nivel** 11/12/2 · **Tags** 31 (plan gratuito, hosting, auth, API, Argentina…).
- **Demo:** ninguna.
- **Ejemplos:** Vercel · Mercado Pago · MongoDB Atlas.

### Diseñar → Rubros (95) · importada
- **Qué representa:** para cada tipo de negocio o producto, qué estilo, paleta y patrón de landing conviene. Es un **recomendador**: cada rubro enlaza a estilos, a un patrón de landing y lleva su paleta.
- **Campos propios:** `fields` (Estilo recomendado, Estilos alternativos, Patrón de landing, Estilo de dashboard, Enfoque de color, A tener en cuenta, Palabras clave, Nota de la paleta), `palette` (10 colores con nombre), `related` (estilos: 316 enlaces; landing: 13).
- **Valor** 47/14/34 (calculado por "familia" del rubro) · **Nivel** 36/31/28 · **Tags** 222 distintos (palabras clave sueltas).
- **Demo:** vista "Así se ve" generada (un mini sitio del rubro pintado con la paleta). Ningún proyecto real.
- **Ejemplos:** SaaS (general) · Consultorio odontológico · Restaurante / gastronomía.
- **Historia:** había 192 rubros y 192 paletas aparte; el 01/10 se recortó a 95 y las paletas se fundieron adentro.

### Diseñar → Estilos de diseño (68) · importada
- **Qué representa:** estilos visuales (minimalismo, glassmorphism, brutalismo, bento, neumorfismo, aurora…), con colores, efectos y cuándo usarlos o evitarlos.
- **Campos propios:** `fields` (Palabras clave, Colores principales y secundarios, Efectos y animación, Ideal para, Evitar en, Modo claro/oscuro, Rendimiento, Accesibilidad, Mobile, Foco en conversión, Origen, Complejidad, Checklist, Prompt para IA en inglés), `swatches` (colores). Sin `related`.
- **Valor** 23/10/35 · **Nivel** 16/42/10 · **Tags** 11 (atributos: Modo claro 62, Modo oscuro 52, Complejidad media 40, Rendimiento excelente 33…).
- **Demo:** "Así se ve", una mini interfaz generada con los colores del estilo. Ningún proyecto real.
- **Ejemplos:** Minimalismo y estilo suizo · Glassmorphism · Neumorfismo.

### Diseñar → Patrones de landing (34) · importada
- **Qué representa:** estructuras de página probadas: orden de secciones, ubicación del CTA, estrategia de color, optimización de conversión.
- **Campos propios:** `fields` (Orden de secciones, Ubicación del CTA, Estrategia de color, Efectos recomendados, Optimización de conversión, Palabras clave). Sin `related`.
- **Valor** 9/7/18 · **Nivel** 14/12/8 · **Tags** 88 distintos (palabras clave, con duplicados parciales).
- **Demo:** "Así se arma", una página generada con el orden de secciones, siempre con el mismo negocio inventado (Yerbal del Monte).
- **Ejemplos:** Hero + funcionalidades + CTA · Hero + testimonios + CTA · Landing de evento / congreso.

### Diseñar → Tipografías (67) · importada
- **Qué representa:** combinaciones de fuentes de Google Fonts.
- **Campos propios:** `fonts` (títulos, texto, URL), `fields` (Fuente de títulos y de texto, Carácter, Ideal para, Import CSS, Config Tailwind, Notas). Sin `related`.
- **Valor** 4/21/42 · **Nivel** 30 inicial, 37 intermedio (no hay avanzado) · **Tags** 26 (Sans + sans 20, Serif + sans 10, Display + sans 9…).
- **Demo:** las 67 tienen antes/después automático (la misma página con Arial y con la combinación).
- **Ejemplos:** Clásica elegante · Profesional moderna · Académica / investigación.

### Revisar → Buenas prácticas UX (96) · importada
- **Qué representa:** reglas de usabilidad y accesibilidad: qué hacer, qué evitar, con severidad.
- **Campos propios:** `fields` (Hacer, Evitar, Plataforma, Severidad), `code` (ejemplo bien/mal; algunos son frases y llevan `tx` para mostrarse como texto). Sin `related`.
- **Valor** 31/16/49 (derivado de la severidad) · **Nivel** 64/26/6 · **Tags** 20 (Severidad media 57, alta 31, baja 8; categorías: Accesibilidad, Formularios, Animación…).
- **Demo:** 47 de 96 tienen "Así no / Así sí" interactivo con el resultado de cada panel a la vista.
- **Ejemplos:** Scroll suave · Navegación fija · Carga de fuentes.

### Con IA → Skills de Claude (31) · curada
- **Qué representa:** skills para potenciar a Claude (diseño, documentos, marketing, desarrollo, seguridad, creatividad). Cada una con qué hace, cuándo usarla, prompt de prueba y cómo se instala.
- **Campos propios:** `fields` (Qué hace, Cuándo usarla, Autor), `install` (comando), `prompt`, `source` (GitHub). Sin `related`.
- **Valor** 5/12/14 · **Nivel** 18/8/5 · **Tags** 32 (origen: Oficial Anthropic 17, Comunidad 14; tema: Diseño, Marketing, Desarrollo, Creatividad…).
- **Demo:** 26 de 31 tienen **experimento real** (mismo prompt sin y con la skill, con las dos salidas, tiempo, costo y pasos). Las 5 sin experimento: Grill Me, Image, Video, Remotion y Claude Ads.
- **Ejemplos:** Frontend Design · Skill Creator · Doc Co-authoring.

## 3. Estructura de datos de una ficha

Cada categoría es un JSON (`data/weblab/<id>.json`) con una lista de fichas. Más un `index.json` liviano con todas las fichas para el buscador: `[categoría, id, nombre, resumen(160), tags, nivel, valor]`.

Campos **comunes** a todas las fichas:

| Campo | Contenido |
|---|---|
| `id`, `cat` | identificador y categoría (los ids se repiten entre categorías: `airline` era rubro y paleta) |
| `name`, `summary` | nombre y resumen de una línea (su sentido cambia por categoría, ver problemas) |
| `tags` | lista de textos libres |
| `fields` | pares `[etiqueta, texto]`: el cuerpo de la ficha |
| `nivel` | 1, 2 o 3 |
| `valor` | `imprescindible`, `pro` o `base` |

Campos **opcionales según categoría:** `related` (lista de `cat/id`), `palette` (10 colores), `swatches`, `fonts`, `code` (bien/mal), `flow` (diagrama), `examples` (enlaces externos), `preset` (datos del constructor), `install`, `prompt`, `source`.

**No existen** campos de estado (completa, idea, en construcción), de tipo de entrada, de área, de fecha de revisión ni de enlace a un proyecto propio. Lo más parecido: `examples` (sitios de terceros, solo Tipos de web) y las etiquetas de texto "Ejemplo propio" o "Lo uso en" dentro de `fields`.

## 4. Cómo se calculan nivel y valor

Se generan en `tools/weblab_niveles.py`. **No son curación fina:** salvo las tablas escritas a mano para las categorías curadas y para skills, el resto sale de reglas.
- **Curado a mano (id → nivel, valor):** Skills, Stacks, Servicios, Arquitecturas, Tipos de web, Patrones de landing, Negocios.
- **Por regla:** Rubros (por familia: carta, turno, tienda, estudio, aviso, viaje y dona = Imprescindible; panel, finanzas y herramienta = Pro; el resto Base), Estilos (por complejidad), Tipografías (versátiles = Imprescindible), UX (por severidad).
- La etiqueta "valor" significa cosas distintas según la categoría (ver problemas).

## 5. Relaciones entre fichas

Solo las categorías curadas de construcción y los rubros tienen `related`:

| Desde → hacia | Enlaces |
|---|---|
| Rubros → Estilos | 316 |
| Rubros → Landing | 13 |
| Tipos de web → Servicios / Arquitecturas / Stacks | 18 / 20 / 10 |
| Servicios → Arquitecturas / Servicios / Tipos de web | 16 / 8 / 5 |
| Arquitecturas → Servicios / Stacks / Arquitecturas | 17 / 7 / 5 |
| Negocios → Tipos de web / Servicios / Arquitecturas | 31 / 12 / 2 |
| Stacks → Arquitecturas / Stacks / Servicios | 9 / 5 / 2 |

Estilos, Landing, Tipografías, UX y Skills **no tienen `related`**. No hay enlaces de vuelta (un estilo no sabe qué rubros lo recomiendan).

## 6. Qué es reciente y qué existía

El historial de git del proyecto empieza el 27/09/2026; lo anterior no tiene registro.

| Fecha | Cambio |
|---|---|
| 27/09 | Primer commit con las 11 categorías de contenido (las curadas y las importadas), 781 fichas |
| 28/09 | Revisión de las 781 fichas (49 correcciones de contenido) |
| 30/09 | Niveles y valor en todas las fichas; demos de antes/después (tipografías, stacks, UX); primeros experimentos de skills |
| 01/10 | Más experimentos (26 en total); demos UX con resultado a la vista; **recorte de 781 a 466 fichas**: Rubros 192→95, Tipografías 74→67, Estilos 84→68, UX 99→96, y la categoría **Paletas (192) eliminada** (se fundió dentro de Rubros) |

Categorías agregadas recientemente: ninguna nueva. Lo reciente es la eliminación de Paletas, el recorte de las importadas y la capa de nivel/valor/demos.

## 7. Problemas que detecto en la clasificación actual

Sin rediseñar; solo lo que ya veo.

**Nombres y estructura**
1. **El id y el nombre no coinciden.** "Tipos de web" se llama `soluciones` por dentro, y las relaciones de Negocios apuntan a `soluciones/landing`. Esto choca con cualquier uso futuro de la palabra "soluciones" para otra cosa.
2. **No hay subcategorías reales.** Todo cuelga de 5 grupos y 11 categorías. Los grupos tienen 1, 4, 4, 1 y 1 categorías, es decir, desparejos.
3. **Los grupos del menú mezclan funciones distintas:**
   - *Construir* junta qué construir (Tipos de web), cómo organizarlo (Arquitecturas), con qué herramientas (Stacks) y con qué servicios de terceros (Servicios).
   - *Diseñar* junta un recomendador (Rubros, que combina estilo, paleta y landing), una técnica visual (Estilos), una estructura de página (Landing) y un recurso (Tipografías).
   - *Revisar* y *Vender* tienen una sola categoría cada uno.
4. **Dentro de Servicios** conviven categorías de naturaleza distinta: hosting, bases de datos, autenticación, pagos, plataformas de e-commerce, CMS, analítica, IA y registro de dominios.
5. **Dentro de Stacks** conviven lenguaje base, frameworks, un stack completo (MERN) y librerías de estilos (Tailwind, shadcn/ui).

**Solapamientos y duplicados**
6. **Tres entradas "por tipo de negocio o proyecto" que se pisan:** Rubros (95, diseño por rubro), Negocios para vender (16, rubros argentinos con argumento de venta) y Tipos de web (13). Restaurante, consultorio, inmobiliaria, veterinaria, hotel o estudio jurídico aparecen en Rubros y en Negocios.
7. **"Landing" aparece en tres lugares:** el tipo de web "Landing page", los 34 Patrones de landing, y el campo "Patrón de landing" dentro de cada Rubro.
8. **Estilos mezcla estilos visuales con otras cosas:**
   - Estructuras de página que ya existen como patrones de landing: `hero-centric-design`, `conversion-optimized`, `feature-rich-showcase`, `minimal-direct`, `social-proof-focused`, `interactive-product-demo`, `trust-authority`, `storytelling-driven`.
   - Tipos de dashboard: `data-dense-dashboard`, `executive-dashboard`, `real-time-monitoring`, `drill-down-analytics`, `comparative-analysis-dashboard`, `predictive-analytics`, `user-behavior-analytics`, `financial-dashboard`, `sales-intelligence-dashboard`, `heat-map-heatmap-style`.
   - Duplicados o casi: `bento-box-grid` y `bento-grids`; `minimalism-swiss-style`, `swiss-modernism-2-0` y `minimalist-monochrome`; `brutalism` y `neubrutalism`.
9. **Skills** agrupa herramientas de naturaleza distinta (diseño, documentos Office, marketing, seguridad, video, arte) en una lista plana, y sus etiquetas mezclan origen ("Oficial Anthropic", "Comunidad") con tema.

**Etiquetas y campos**
10. **Las etiquetas no son un vocabulario común.** Estilos usa atributos (Modo claro, Complejidad media); Landing y Rubros usan palabras clave sueltas (88 y 222 distintas, con variantes como "hero", "centrado en el hero", "diseño centrado en el hero"); UX usa categoría + severidad; Skills usa origen + tema. No se puede filtrar entre categorías por una misma etiqueta.
11. **`summary` significa algo distinto en cada categoría:** en Estilos es "Ideal para", en Landing es el orden de secciones, en Tipografías son palabras de carácter, en Rubros son consideraciones. Por eso las tarjetas se ven parejas pero dicen cosas de naturaleza distinta.
12. **Cada categoría tiene su propio vocabulario de `fields`.** No hay un esquema común (qué es, qué soluciona, qué aporta, cuándo conviene, cuándo no). La información que más sirve para decidir (Ideal para, Evitar en, Cuándo usarla) está en etiquetas distintas por categoría. En las importadas hay además campos técnicos de poco uso (palabras clave, checklist, colores, un prompt en inglés).
13. **Los ids no son únicos entre categorías** (se repetían entre rubros y paletas, y siguen existiendo coincidencias de nombre entre categorías), así que la identidad de una ficha es la dupla categoría + id.

**Valor, nivel y relaciones**
14. **"Valor" no significa lo mismo en todas partes.** En UX sale de la severidad, en Rubros de la "familia" del negocio, en Estilos de la complejidad, y en las curadas de un juicio a mano. Mismo rótulo, criterios distintos. En Rubros, 47 de 95 son "Imprescindible".
15. **"Nivel" casi no discrimina en algunas:** Tipografías solo usa 1 y 2; UX es 64 de 96 inicial.
16. **Las relaciones son unidireccionales y parciales.** Solo 6 categorías las tienen y no hay enlaces de vuelta.

**Evidencia y contenido mostrable**
17. **No hay un campo que diga qué ficha tiene algo concreto para mostrar.** Cobertura actual: Skills 26 de 31 con experimento real; Tipografías 67 de 67 con vista previa automática; UX 47 de 96 con demo; Stacks 10 de 10; Estilos, Landing y Rubros solo con mini-maquetas generadas, sin ningún proyecto real; Servicios, Negocios, Tipos de web y Arquitecturas sin demo (Arquitecturas con diagrama; Tipos de web con enlaces a sitios de terceros en 11 de 13).
18. **No hay estados** (completa, idea) ni fecha de revisión del valor.
19. **Contenido que no es de Argentina o de negocios locales** sigue en Rubros (SaaS general, Gaming, Herramienta para desarrolladores, Bootcamp, Plataforma de IA…), junto a rubros que sí lo son.
