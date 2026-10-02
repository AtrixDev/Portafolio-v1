# Reporte de clasificación: las 466 fichas

Entrega B del plan de Programación v2. **Solo informe**: no se modificó ningún dato de `frontend/`. Lo genera `tools/weblab_clasificar.py` (se puede volver a correr).

Archivos: `clasificacion-466.csv` (una fila por ficha más los 95 rubros como facetas) y `clasificacion-466-dudas.csv` (todos los casos dudosos, ordenados por gravedad).

## 1. Validaciones de conservación

| Validación | Esperado | Resultado |
|---|---|---|
| Fichas de entrada (sin rubros) | 371 | 371 ✔ |
| Rubros de entrada | 95 | 95 ✔ |
| Total entradas (fichas + rubros) | 466 | 466 ✔ |
| IDs propuestos únicos (duplicados = 0) | 0 | 0 ✔ |

Los campos del cuerpo de cada ficha **no se descartan**: los que no alimentan el núcleo se conservan en `tecnico`. Ver §7.

## 2. Por tipo y por área (propuesta)

| Tipo | Fichas |
|---|---|
| tecnica | 209 |
| recurso | 67 |
| herramienta | 66 |
| solucion | 29 |

| Área | Fichas (una ficha puede estar en 2 áreas) |
|---|---|
| desarrollo-web | 283 |
| programacion | 46 |
| ia-datos | 32 |
| soluciones | 16 |

| Tipo | Subtipo | Fichas |
|---|---|---|
| herramienta | servicio | 25 |
| herramienta | skill | 31 |
| herramienta | stack | 10 |
| recurso | par de fuentes | 67 |
| solucion | arquetipo de web | 13 |
| solucion | por rubro | 16 |
| tecnica | arquitectura | 11 |
| tecnica | estilo visual | 50 |
| tecnica | patrón de panel | 10 |
| tecnica | patrón de página | 42 |
| tecnica | regla UX | 96 |

## 3. Mapa colección → tipo · área

| Colección actual (nombre en pantalla) | Fichas | Tipo | Área |
|---|---|---|---|
| Negocios para vender | 16 | solucion / por rubro | soluciones |
| Tipos de web (id: soluciones) | 13 | solucion / arquetipo de web | desarrollo-web |
| estilos | 68 | tecnica / estilo visual | desarrollo-web |
| landing | 34 | tecnica / patrón de página | desarrollo-web |
| ux | 96 | tecnica / regla UX | desarrollo-web |
| tipografias | 67 | recurso / par de fuentes | desarrollo-web |
| arquitecturas | 11 | tecnica / arquitectura | programacion |
| stacks | 10 | herramienta / stack | programacion |
| servicios | 25 | herramienta / servicio | programacion |
| skills | 31 | herramienta / skill | ia-datos |
| Rubros | 95 | faceta / recomendador | transversal |

## 4. Temas asignados (por reglas con fuente)

Cada tema se asignó por una regla visible en el CSV (`temas_confianza`): **alta** = viene de la colección o una etiqueta; **media** = palabra clave en nombre o resumen; **baja** = palabra clave solo en el cuerpo. Los de confianza baja son los candidatos a error.

| Tema | Fichas |
|---|---|
| identidad-marca | 97 |
| conversion | 42 |
| accesibilidad | 25 |
| e-commerce | 24 |
| rendimiento | 23 |
| seguridad | 12 |
| mercado-libre | 11 |
| automatizacion | 8 |

Confianza de las asignaciones de tema: {'baja': 58, 'media': 64, 'alta': 120}.

## 5. Evidencias detectadas (de lo que ya existe)

| Evidencia | Fichas |
|---|---|
| maqueta(generada) | 102 |
| (sin evidencia) | 81 |
| maqueta(vista previa generada) | 67 |
| demo | 57 |
| experimento | 26 |
| maqueta(preset del constructor) | 16 |
| ejemplo(terceros) | 11 |
| maqueta(diagrama) | 11 |

Nota: no hay ningún **proyecto real** asociado a ninguna ficha todavía; eso depende de la entrega C. Las "maquetas" son las generadas por el sitio (Así se ve / Así se arma / vista previa de fuentes / diagrama).

## 6. Valor: de dónde viene cada uno

| Origen del valor | Valor | Fichas |
|---|---|---|
| regla automática | base | 126 |
| regla automática | imprescindible | 58 |
| regla automática | pro | 47 |
| tabla manual (Claude, sin validar) | base | 60 |
| tabla manual (Claude, sin validar) | imprescindible | 41 |
| tabla manual (Claude, sin validar) | pro | 36 |
| validado por Darío | imprescindible | 2 |
| validado por Darío | pro | 1 |

Todo lo que **no** está "validado por Darío" figura como **provisional/heredado**. Hoy solo hay tres valores que Darío dijo explícitamente: Impeccable (Imprescindible), UI UX Pro Max (Base) y E-commerce (Imprescindible).

## 7. A dónde irían los campos del cuerpo actual

Para cada colección, cuántos campos alimentarían cada bloque del núcleo (`que_es`, `problema`, `aporta`, `cuando_si`, `cuando_no`, `como`), cuántos van a `tecnico` y cuántos son relaciones o afirmaciones sobre proyectos propios que hay que verificar.

| Colección | que_es | problema | aporta | cuando_si | cuando_no | como | tecnico | relación | evidencia/relación (verificar) | reutilizable |
|---|---|---|---|---|---|---|---|---|---|---|
| negocios | 16 | 16 | 32 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| soluciones | 0 | 13 | 14 | 13 | 3 | 5 | 14 | 0 | 2 | 0 |
| estilos | 0 | 0 | 0 | 68 | 68 | 0 | 884 | 0 | 0 | 68 |
| landing | 0 | 0 | 34 | 0 | 0 | 34 | 136 | 0 | 0 | 0 |
| ux | 0 | 0 | 0 | 0 | 96 | 96 | 192 | 0 | 0 | 0 |
| tipografias | 0 | 0 | 67 | 67 | 0 | 0 | 201 | 0 | 0 | 134 |
| arquitecturas | 11 | 0 | 11 | 2 | 11 | 0 | 1 | 6 | 2 | 0 |
| stacks | 0 | 0 | 0 | 10 | 0 | 0 | 7 | 1 | 2 | 0 |
| servicios | 25 | 0 | 4 | 0 | 3 | 0 | 28 | 2 | 5 | 0 |
| skills | 31 | 0 | 0 | 31 | 0 | 0 | 31 | 0 | 0 | 0 |
| rubros | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Fichas **sin ninguna fuente** para el bloque "Qué es" (hay que escribirlo): ux 96, estilos 68, tipografias 67, landing 34, soluciones 13, stacks 10.

Fichas **sin fuente** para "Cuándo conviene": ux 96, landing 34, servicios 25, negocios 16, arquitecturas 9.

Hallazgo de modelo: Patrones de landing (34) y las reglas UX (96) tienen su contenido principal en "Orden de secciones" y "Hacer", que no encajan en qué es / problema / aporta. Se propone sumar un bloque **`como`** ("cómo se arma o se aplica") al núcleo. Está en la entrega A y en los casos ambiguos.

## 8. Casos dudosos y posibles clasificaciones incorrectas

Total: **157** casos. Ordenados por gravedad en `clasificacion-466-dudas.csv`; los de gravedad alta pasan a `casos-ambiguos.md` para decidir.

| Tipo de duda | Gravedad | Casos |
|---|---|---|
| negocio-rubro-a-confirmar | alta | 15 |
| estilo-estructura | alta | 8 |
| id-repetido | alta | 6 |
| valor-contradice-a-Dario | alta | 1 |
| estilo-panel | media | 10 |
| estilo-sin-colores | media | 9 |
| nombre-casi-igual | media | 4 |
| negocio-sin-rubro | media | 1 |
| id-repetido | media | 1 |
| area-doble | baja | 5 |
| valor-nivel-raro | baja | 2 |
| sin-evidencia | informativa | 81 |
| estilo-sin-colores | informativa | 14 |

### Qué revisa el detector

- Campo propio de la colección ausente (por ejemplo, una ficha de tipografía sin `fonts`): sugiere tipo mal asignado.
- Ids repetidos entre colecciones y nombres casi iguales (similitud ≥ 0,86), posibles duplicados.
- Estilos que en realidad son estructuras de página o tipos de panel; variantes entre estilos.
- Pares Negocios ↔ Rubros y negocios sin rubro equivalente.
- Valor que contradice lo que dijo Darío; Imprescindible con nivel Avanzado.
- Temas inferidos solo por una palabra clave del cuerpo (confianza baja) y fichas con más de 3 temas.
- Relaciones rotas; resúmenes vacíos; rubros sin recomendaciones.
- Fichas sin evidencia y fichas sin ninguna fuente para el núcleo (informativas, no son errores).

### Casos de gravedad alta

| Tipo | Colección | Id | Motivo |
|---|---|---|---|
| estilo-estructura | estilos | `conversion-optimized` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: funnel-3-step-conversion |
| estilo-estructura | estilos | `feature-rich-showcase` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: feature-rich-showcase |
| estilo-estructura | estilos | `hero-centric-design` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: hero-centric-design |
| estilo-estructura | estilos | `interactive-product-demo` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: product-demo-features |
| estilo-estructura | estilos | `minimal-direct` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: minimal-single-column |
| estilo-estructura | estilos | `social-proof-focused` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: hero-testimonials-cta |
| estilo-estructura | estilos | `storytelling-driven` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: scroll-triggered-storytelling |
| estilo-estructura | estilos | `trust-authority` | Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: trust-authority-conversion |
| id-repetido | estilos | `feature-rich-showcase` | Mismo id en ['estilos', 'landing']; se propone sufijo por subtipo |
| id-repetido | estilos | `hero-centric-design` | Mismo id en ['estilos', 'landing']; se propone sufijo por subtipo |
| id-repetido | landing | `feature-rich-showcase` | Mismo id en ['estilos', 'landing']; se propone sufijo por subtipo |
| id-repetido | landing | `hero-centric-design` | Mismo id en ['estilos', 'landing']; se propone sufijo por subtipo |
| id-repetido | servicios | `claude-api` | Mismo id en ['servicios', 'skills']; se propone sufijo por subtipo |
| id-repetido | skills | `claude-api` | Mismo id en ['servicios', 'skills']; se propone sufijo por subtipo |
| negocio-rubro-a-confirmar | negocios | `construccion` | Equivalentes propuestos: construction-architecture, architecture-interior |
| negocio-rubro-a-confirmar | negocios | `consultorio` | Equivalentes propuestos: medical-clinic, dental-practice |
| negocio-rubro-a-confirmar | negocios | `delivery` | Equivalentes propuestos: food-delivery-on-demand |
| negocio-rubro-a-confirmar | negocios | `educacion` | Equivalentes propuestos: online-course-e-learning, educational-app |
| negocio-rubro-a-confirmar | negocios | `estetica` | Equivalentes propuestos: beauty-spa-wellness-service |
| negocio-rubro-a-confirmar | negocios | `estudio` | Equivalentes propuestos: legal-services |
| negocio-rubro-a-confirmar | negocios | `eventos` | Equivalentes propuestos: wedding-event-planning, event-management, photography-studio |
| negocio-rubro-a-confirmar | negocios | `gimnasio` | Equivalentes propuestos: fitness-gym-app |
| negocio-rubro-a-confirmar | negocios | `hogar` | Equivalentes propuestos: home-services-plumber-electrician |
| negocio-rubro-a-confirmar | negocios | `inmobiliaria` | Equivalentes propuestos: real-estate-property |
| negocio-rubro-a-confirmar | negocios | `profesional` | Equivalentes propuestos: portfolio-personal, b2b-service |
| negocio-rubro-a-confirmar | negocios | `restaurante` | Equivalentes propuestos: restaurant-food-service, bakery-cafe, brewery-winery |
| negocio-rubro-a-confirmar | negocios | `tienda` | Equivalentes propuestos: e-commerce, e-commerce-luxury |
| negocio-rubro-a-confirmar | negocios | `turismo` | Equivalentes propuestos: hotel-hospitality, travel-tourism-agency |
| negocio-rubro-a-confirmar | negocios | `veterinaria` | Equivalentes propuestos: veterinary-clinic |
| valor-contradice-a-Dario | skills | `ui-ux-pro-max` | Darío dijo 'base' y el dato actual es 'pro' |

## 9. Afirmaciones sobre proyectos propios que hay que verificar

11 fichas tienen un campo "Lo uso en" o "Ejemplo propio" (texto escrito a mano en sesiones anteriores). **No se convierten en relaciones ni evidencias** hasta cotejarlos con `proyectos-verificables.md`.

| Colección | Id | Campo | Texto actual |
|---|---|---|---|
| soluciones | `portfolio` | Ejemplo propio | Esta misma web: HTML/CSS/JS sin framework + funciones serverless en Vercel + MongoDB. |
| soluciones | `saas` | Ejemplo propio | ML Tracker: JavaScript sin framework + funciones serverless en Node (Vercel) + MongoDB + OAuth de Mercado Libre. |
| arquitecturas | `spa-api` | Ejemplo propio | ML Tracker aplica la idea: el panel es una app en JavaScript sin framework que le pide JSON a /api/tracker (una función serverless con Mongo |
| arquitecturas | `serverless` | Ejemplo propio | Esta web: /api/audit, /api/contact y /api/content corren como funciones en Vercel. |
| stacks | `vanilla` | Lo uso en | Esta web. |
| stacks | `node-express` | Lo uso en | Node sí: las funciones /api de esta web y de ML Tracker corren en Node como funciones serverless, sin Express. |
| servicios | `vercel` | Lo uso en | Esta web (frontend + /api). |
| servicios | `mongodb-atlas` | Lo uso en | Esta web (contenido, mensajes, token de ML) y ML Tracker. |
| servicios | `resend` | Lo uso en | Opcional en /api/contact de esta web: si está configurado, te llega un mail por cada mensaje. |
| servicios | `tiendanube` | Lo uso en | Diseño de la tienda de Borner. |
| servicios | `groq` | Lo uso en | Opcional en la auditoría de esta web: sugiere un título optimizado. |
