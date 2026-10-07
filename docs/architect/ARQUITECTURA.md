# Web Project Architect — auditoría operativa y arquitectura

Decisiones tomadas el 07/10/2026. Lo que no figura acá no se decidió.

## 1. Auditoría operativa (qué había y qué se reutiliza)

| Tema | Hallazgo | Consecuencia |
|---|---|---|
| Stack | HTML/CSS/JS vanilla + funciones Node en Vercel (10 de 12 usadas) + MongoDB. Sin framework ni bundler. | La herramienta es **solo frontend**: no suma funciones serverless ni persistencia en servidor. |
| Build | `tools/build-deploy.py` copia `frontend/` entero a `public/`. | Los JSON nuevos se publican sin tocar el build. |
| Navegación | `tools/site-shell.py` es la fuente única de header, menú móvil y pie. | El recurso se integra agregando UNA entrada al grupo «Desarrollo web»; todas las páginas se regeneran. |
| Biblioteca web | `programacion.html` + `programacion-v2.js` + `data/weblab/*.json` (466 fichas): catálogo de **soluciones y piezas** con ejemplos para abrir. Rutas `#/f/<id>`. | Modelo distinto (catálogo vs. grafo conceptual + decisiones). **No se extiende ni se reemplaza.** Se enlaza por `library_refs`. |
| Sistema visual | Tokens V1 (`--fs-*`, `--sp-*`, `--radius-*`) y componentes `ui-*` ya existen, probados en Herramientas. | La UI nueva los usa; no inventa estilos globales. |
| Tests | `backend/test/*.mjs` con `node --test` (174 al empezar). Los módulos puros del motor viven en `backend/lib` (ESM). | Los módulos nuevos son **ESM puros** en `frontend/js/architect/` con su propio `package.json {"type":"module"}` para que Node los importe sin tocar el resto. |
| Zonas sensibles | `?r=`, `?asunto=`, `?pub=`, OAuth, motor económico, `salida.js`, anchors de `sistema.html`. | No se toca nada de eso. |
| Duplicaciones relevantes | «Tipos de web», «Arquitecturas», «Stacks» y «Servicios» de la Biblioteca se superponen en tema con el nuevo contenido. | No se copian: el grafo nuevo es conceptual y referencia las fichas de la Biblioteca. |

## 2. Ubicación

**Recurso independiente dentro de Desarrollo web**, en `arquitecto.html` (nombre público provisional: *Web Project Architect*; en el menú, «Project Architect»). Comparte con la Biblioteca web: navegación (grupo Desarrollo web), sistema visual y datos por referencia (`library_refs`). No comparte modelo de datos.

Por qué no dentro de Programación: la Biblioteca responde «¿qué piezas existen y cómo se ven?»; Architect responde «¿qué conviene y por qué?». Mezclarlos ensucia los dos.

## 3. Capas (todo puro y testeable salvo la UI)

```
data/architect/*.json        contenido: entidades, fuentes (y luego preguntas, reglas, prompts)
js/architect/model.js        dimensiones, enums, validación (entidad, fuente, conocimiento)
js/architect/search.js       normalización y búsqueda con pesos
js/architect/content.js      índices, relaciones con inversas, alternativas, tecnologías derivadas
js/architect/diagram.js      especificación declarativa → SVG (compartido por conceptos y blueprints)
js/architect/builder.js …    Project Builder, Decision Engine, Blueprint, ADR, Prompts, Pack
js/architect/app.js, views.js  UI (hash router) — única parte con DOM
backend/test/architect-*.test.mjs
```

## 4. Modelo de contenido (resumen)

- **Entidad**: 23 dimensiones (`product_type`, `architecture_style`, `rendering_strategy`, `data_pattern`, `communication_pattern`, `ai_workflow`, `ai_agent_pattern`, `quality_attribute`, `technology`, `tool`…). Cada una es una cosa distinta: *PostgreSQL ≠ base relacional*.
- `depth`: `full` (ficha completa) o `brief` (apoyo: tecnologías, atributos de calidad).
- **Relaciones tipadas** (`requires`, `enables`, `often_with`, `contrasts_with`, `implements`, `addresses`, `part_of`, `alternative_to`) con lectura inversa. Las tecnologías **no** se escriben a mano en cada concepto: se derivan de `implements`.
- **Alternativas** solo dentro de la misma familia, siempre con una nota «en qué se diferencia».
- **Evidencia**: `standard · official_documentation · official_framework · expert_source · industry_practice · recommendation · example · opinion`. Reglas validadas: lo respaldado por una fuente necesita una fuente **de ese tipo**; una opinión no se muestra con fuentes; una fuente solo puede ser de los cinco primeros tipos; los tipos de producto son siempre `recommendation`.
- **Ejemplos**: `real_project` exige URL; el contenido inicial no declara ninguno (no se infiere experiencia).
- **Fuentes**: nombre, organización, URL https, tipo, tema, evidencia, `checked` (fecha) y `verification` (`ok` | `blocked`). 65 fuentes; 64 verificadas el 07/10/2026 (ISO bloquea bots).

## 5. Qué se decidió sin pedir permiso (reversible)

- Persistencia del proyecto: **URL (hash) + localStorage**, sin servidor. Un proyecto se comparte con un enlace.
- Nombres de ids en inglés (estables), textos en español.
- Los textos del contenido son nuestros, escritos a partir de las fuentes citadas; ninguna cita textual extensa. Donde la fuente define algo (p. ej. workflow vs. agente de Anthropic, OWASP Top 10:2025) se verificó el texto de la fuente antes de afirmarlo.
- El motor de decisión es **determinista y explicable** (reglas en JSON con puntajes y razones), no un LLM.

## 6. Estado por fase (verificado el 07/10/2026)

| Fase | Estado | Dónde |
|---|---|---|
| 0 Base técnica (modelo, validaciones, fuentes) | hecha | `model.js`, `content.js`, `data/architect/` |
| 1 Explorer | hecha | `search.js`, `views.js` |
| 2 Ficha de concepto (con diagrama en 15 entidades) | hecha | `views.js`, `diagram.js` |
| 3 Project Builder (preguntas adaptativas) | hecha | `builder.js`, `questions.json` |
| 4 Decision Engine | hecha | `decide.js`, `rules.json`, `conditions.js` |
| 5 Blueprints | hecha | `blueprint.js` |
| 6 ADR | hecha | `adr.js` |
| 7 Prompt Generator | hecha | `prompts.js`, `prompts.json` |
| 8 Project Pack | hecha | `pack.js`, `pack.json`, `views-project.js` |

Verificación: `node --test backend/test/` → 273/273 (99 del Architect, incluido un barrido de 1500 proyectos aleatorios); `python3 tools/qa-architect.py` → 134/134 en Chromium (con `node tools/dev-server.mjs`).

## 7. Pendiente / límites declarados

- El contenido inicial es una muestra (60 entidades) para validar el modelo, no la base final.
- Solo 15 entidades tienen diagrama propio.
- Las fuentes se verifican a mano con `tools/architect-verificar-fuentes.mjs`; no hay chequeo automático en CI.
- Los atributos de las tecnologías (complejidad, costo, lock-in…) son criterio propio; solo Claude Code carece de alternativa cargada y el pack lo dice.
- «Autenticación y autorización» es una sola ficha que enseña la diferencia; si se amplía el contenido conviene separarla en dos.
- Las alternativas cercanas explican el porqué con la razón principal de la opción elegida, pero no cuantifican la diferencia.

## 8. Universo teórico vs. aplicación práctica (07/10/2026)

La base cubre todo lo que existe, aunque sea avanzado; la recomendación es proporcional al proyecto. Cuatro preguntas distintas:

| Pregunta | Dónde vive | Valores |
|---|---|---|
| ¿Existe? | Figura en la base (ficha completa o de apoyo) | — |
| ¿Cuánta justificación pide? | `justification` de cada concepto | `baseline` Punto de partida habitual · `by_need` Según necesidad · `strong_reason` Requiere razón fuerte |
| ¿Se necesita? | `necessity` de cada propuesta | `required` (lo exige el proyecto, regla con `required: true`) · `justified` (opción avanzada con su condición cumplida) · `proportional` (la opción simple que alcanza) |
| ¿Es apropiado para ESTE proyecto? | `fit` de cada opción | `appropriate` (propuesta) · `viable` Puede servir · `not_needed` No se necesita todavía · `not_fit` No es apropiado hoy |

Reglas del motor: (1) una opción con `justified_when` solo puede proponerse si esa condición se cumple; con datos desconocidos no se cumple (ante la duda, lo más simple); (2) todo concepto `strong_reason` debe tener `justified_when` y `unjustified` (lo valida `validateRules`); (3) el criterio es el proyecto (alcance, escala, equipo como carga de operación, tiempo, criticidad vía datos sensibles y pagos), nunca la capacidad de quien lo construye. Aún no hay señales de presupuesto ni de criticidad propias: son una ampliación futura del Project Builder.

### Complejidad práctica (niveles 1–4)

Contextualiza la aplicación; **no limita la teoría** ni cambia qué se recomienda (hay un test que lo comprueba). Un proyecto de nivel 4 no se bloquea: se hace visible su complejidad y su riesgo.

| Nivel | Qué es | Ejemplos |
|---|---|---|
| 1 | Informativo | landing, institucional, portfolio, sitio profesional informativo |
| 2 | Con backend y persistencia | e-commerce, reservas/turnos, formularios avanzados, CMS, integraciones con APIs |
| 3 | Aplicación o sistema | sistema de gestión, dashboard, portal, aplicación web, SaaS chico o mediano |
| 4 | Distribuido o de alta criticidad | sistemas distribuidos, multi-tenant complejo, tiempo real avanzado, microservicios, alta criticidad o escala |

- **Zona práctica habitual:** niveles 1 a 3 (`PRACTICAL_ZONE_MAX`). Fuera de ella se avisa y se pide supervisión cercana; no se bloquea.
- **En un concepto:** `practical_level` (desde qué nivel de proyecto entra en juego y cuánto cuidado pide). No es `level` (dificultad de aprenderlo). Los atributos de calidad no lo llevan.
- **En un proyecto:** nivel = el mayor entre el del tipo de producto (su `practical_level`) y los saltos de `complexity.bumps` en `rules.json` (señales o decisiones tomadas; cada salto trae su razón y, si sube a 3 o 4, la alternativa más simple). Producto sin definir: se estima en 2 y se marca incierto.
- **Qué muestra** (`res.complexity`): nivel, dentro/fuera de la zona, supervisión (`none` · `review` · `close`), por qué ese nivel, partes de la propuesta de nivel 3–4 con su opción más simple (en una elección, la alternativa de menor nivel; en un conjunto, el texto `simpler` de la regla) y qué lo simplificaría. Aparece en la pestaña Decisiones, en el resumen del Project Pack y como línea del contexto de todos los prompts.
- **Nombre del campo de justificación:** `justification` (antes `adoption`, que sugería popularidad): `baseline` · `by_need` · `strong_reason`.

## 9. QA profundo (07/10/2026)

Encontrado y corregido: SSR con cualquier producto lanzaba una excepción al armar el blueprint (etiqueta de 45 caracteres); el producto «otro» sin datos proponía sitio estático con base relacional; el sitio estático podía proponerse para productos con lógica propia; la cola de mensajes sugería operar un broker aunque el proyecto fuera chico; tres fuentes (ADR, C4) no se mostraban en ninguna parte; un hash mal formado lanzaba un error en `main.js`. Prueba nueva: `backend/test/architect-barrido.test.mjs`. Después se descubrió que ese barrido nunca respondía las preguntas de afinado (tiempo real, búsqueda, IA), por lo que no pasaba por WebSocket: una etiqueta de conexión de 35 caracteres rompía el blueprint con tiempo real. Corregido, y el barrido ahora exige haber recorrido las opciones principales y fuerza las raras (microservicios, eventos, pub/sub, agentes).

## 10. Primera tanda de contenido real (07/10/2026)

Cubre 9 tipos de producto (Landing, Institucional, **Portfolio**, E-commerce, **Reservas/turnos**, SaaS, Dashboard, Sistema de gestión, Marketplace) y 5 estilos de arquitectura (Monolito, Monolito modular, Microservicios, Orientada a eventos, Web-Queue-Worker). Portfolio y Reservas son tipos de producto propios (no sinónimos de Institucional ni de Landing) y entran en el Project Builder con sus preguntas, supuestos, datos de partida y requisitos funcionales.

- **Piso de calidad** (`backend/test/architect-contenido.test.mjs`): cada ficha de la tanda exige explicación de tres párrafos, cómo funciona, cuándo sí y cuándo no, ventajas, desventajas, trade-offs, alternativas, errores comunes, preguntas para decidir, relaciones, niveles, un ejemplo sencillo **y** uno aplicado a un proyecto realista (`conceptual_example`, rotulado como caso imaginado), y fuentes.
- **Hechos vs. criterio propio:** `source_notes` dice, fuente por fuente, qué hecho concreto respalda. Los tipos de producto siguen siendo `recommendation` aunque citen fuentes: cuándo conviene cada uno es criterio de este proyecto. Todas las fuentes nuevas se leyeron antes de citarlas.
- **Arquitecturas:** la ficha usa «Por qué elegirlo», «Por qué NO elegirlo» y «Cuándo una alternativa sería mejor» (cada alternativa explica en qué condiciones ganaría). No hay rankings ni puntajes en el contenido; las arquitecturas se recomiendan solo en proporción al proyecto (`justified_when`).
- **Justificación en tipos de producto:** no la llevan (un tipo de producto no se «recomienda» como un patrón); sí llevan `practical_level`, que fija el piso de complejidad del proyecto.
- Se agregaron 13 fuentes (Google Search Central, schema.org, MDN, PostgreSQL, PCI SSC, Stripe, Azure, AWS, OWASP).
