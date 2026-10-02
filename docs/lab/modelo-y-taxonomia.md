# Modelo de datos y taxonomía de Programación v2

Entrega A del plan. Para revisión de Darío. Describe cómo se representaría la base **si se aprueban las decisiones** de `casos-ambiguos.md`; lo que depende de una decisión pendiente está marcado **[decisión pendiente]**. La versión en formato máquina está en `taxonomia.json`. Las tablas de mapeo de las 466 fichas están en `tools/weblab_clasificar.py` y su resultado en `clasificacion-466.csv`.

## 1. La lógica en una línea

Cinco preguntas distintas que hoy una sola columna intenta contestar a la vez:

| Eje | Pregunta | Quién lo ve |
|---|---|---|
| **Tipo** | ¿Qué es esta ficha? | Visitante (etiqueta) |
| **Área** | ¿Dónde la encuentro? | Visitante (menú) |
| **Tema** | ¿Qué contexto transversal tiene? | Visitante (filtro) |
| **Evidencia** | ¿Qué puedo ver o comprobar? | Visitante (etiquetas) |
| **Colección** | ¿De dónde viene? | Solo migración (no se muestra) |

Una ficha existe una sola vez. Aparece en distintas vistas por relaciones, áreas, temas y filtros; nunca se duplica.

## 2. Tipos de ficha (6)

| Tipo | Qué es | Ejemplos de hoy |
|---|---|---|
| `solucion` | Problema → respuesta; compone otras fichas | Negocios (16), Tipos de web (13) |
| `funcionalidad` | Algo que hace una web o un sistema | Ninguna creada. Candidatas en `casos-ambiguos.md` §19 |
| `tecnica` | Cómo se hace, diseña o aplica algo | Estilos, patrones de landing, reglas UX, arquitecturas |
| `herramienta` | Con qué se hace | Stacks, servicios, skills |
| `recurso` | Algo reutilizable | Pares de fuentes; (luego) paletas y prompts |
| `proyecto` | Algo que Darío construyó de verdad | Ninguna creada. Candidatos en `proyectos-verificables.md` (Tenshi y la tienda de coleccionables: construidos, no publicados; esta última se muestra sin marca) |

Los **subtipos** son etiquetas controladas dentro de cada tipo: por rubro, arquetipo de web, estilo visual, patrón de página, patrón de panel, regla UX, arquitectura, stack, servicio, skill, par de fuentes. Casi todos coinciden con las colecciones actuales.

**No son tipos** (son evidencias): demo, experimento, maqueta, ejemplo. **Concepto** se absorbe en técnica y **tecnología** en herramienta.

## 3. Áreas (4) y temas

**Áreas** (dónde se navega; una ficha puede estar en 1 o 2): `soluciones` · `desarrollo-web` · `programacion` · `ia-datos`.

**Temas** (contexto transversal; vocabulario controlado, abierto a ampliación): `automatizacion` · `identidad-marca` · `seguridad` · `accesibilidad` · `conversion` · `rendimiento` · `mercado-libre` · `e-commerce`.
Automatización e Identidad y marca son **temas visibles, no áreas**, hasta que tengan unas 8 fichas. Cada asignación de tema guarda su regla y su confianza (alta, media o baja) para poder revisarla. **[decisión pendiente: caso 8]**

## 4. Evidencias (5)

Cada una con etiqueta obligatoria en la interfaz. Una ficha puede tener varias; una evidencia puede servir a varias fichas.

| Evidencia | Definición | Existe hoy |
|---|---|---|
| **Proyecto real** | Algo que Darío construyó como proyecto | Ninguna asociada todavía (depende de las fichas de proyecto) |
| **Demo** | Construida para demostrar una funcionalidad o concepto | 57 (47 reglas UX, 10 stacks) |
| **Experimento** | Algo que se probó, con prompt, tiempo, costo y veredicto | 26 (skills) |
| **Maqueta** | Representación visual generada | 196 (Así se ve / Así se arma, vista previa de fuentes, diagramas, presets) **[caso 11]** |
| **Ejemplo** | Sitio o solución de terceros | 11 (Tipos de web) |

Origen de cada evidencia: `propio`, `generado` o `terceros`. **Un proyecto es a la vez ficha (tipo `proyecto`) y evidencia de otras fichas**, con relaciones en los dos sentidos.

## 5. Nivel y valor

**Nivel** (dificultad): 1 Inicial, 2 Intermedio, 3 Avanzado. Se conserva el valor actual de cada ficha.

**Valor** (cuánto te diferencia hoy), criterio de Darío:

| Valor | Significado |
|---|---|
| **Imprescindible** | Hoy hay que tenerlo y marca diferencia |
| **Pro** | Una especialización que te separa del resto; no es para todos |
| **Base** | Básico, o ya tan usado que no te diferencia |

Cada valor lleva `valor_porque` (una línea), `valor_revisado` (fecha) y `valor_origen`:
- **validado por Darío**: hoy son 3 (Impeccable, UI UX Pro Max, E-commerce).
- **tabla manual (Claude, sin validar)**: 137 fichas curadas.
- **regla automática**: 231 fichas más los 95 rubros.

Todo lo que no es "validado" se muestra como **provisional/heredado** y no se toma como criterio definitivo. Se revisa colección por colección.

## 6. Esquema de la ficha

```
id               único global (ver §8)
tipo, subtipo
areas[]          máx. 2
temas[]          con regla y confianza
rubros[]         ids de rubro (faceta)
nivel            1 | 2 | 3
valor            imprescindible | pro | base
valor_porque, valor_revisado, valor_origen
nombre, resumen
nucleo {         todos opcionales
  que_es         qué es
  problema       qué problema resuelve
  aporta[]       qué aporta
  como           cómo se arma o se aplica      [decisión pendiente: caso 9]
  cuando_si      cuándo conviene
  cuando_no      cuándo no
}
evidencias[]     referencias a evidencias
reutilizable {   prompt {texto, estado: probado | sin probar, experimento}, recursos (paleta, fuentes) }
relaciones[]     {tipo, a}
tecnico          los campos actuales que no entran al núcleo (se muestran plegados)
origen, fuente   curada | importada | propia, y de dónde viene
legacy           {coleccion, id} originales
```

**Evidencia:** `id`, `tipo`, `titulo`, `origen` (`propio` | `generado` | `terceros`), `descripcion`, `url` o clave de demo, `fecha`; para experimentos, `prompt`, tiempo, costo, pasos y veredicto.

**Faceta de rubro** (los 95 rubros): conserva todos sus campos actuales (estilo recomendado y alternativos, patrón de landing, dashboard, enfoque de color, notas, palabras clave, paleta, familia) y suma `recomienda {estilos[], landing[], paleta}`. No lleva valor ni nivel a la vista **[caso 13]**.

**Dato duro:** ningún campo actual se pierde. Los que no alimentan el núcleo se guardan en `tecnico`; los que afirman cosas sobre proyectos propios ("Lo uso en", "Ejemplo propio") no se convierten en relaciones hasta cotejarlos con lo comprobado.

## 7. Relaciones

| Tipo | Significa | Inversa (se calcula sola) |
|---|---|---|
| `usa` | Un proyecto o solución usa una herramienta o técnica | `usado_en` |
| `implementa` | Un proyecto implementa una funcionalidad o técnica | `implementada_en` |
| `evidenciada_por` | Una ficha tiene un proyecto como evidencia | `evidencia_de` |
| `requiere` | Necesita otra ficha para funcionar | `requerida_por` |
| `parte_de` | Forma parte de una solución mayor | `incluye` |
| `variante_de` | Variante de otra ficha | `tiene_variante` |
| `recomendado_para` | Un estilo o patrón recomendado para un rubro | `recomienda` |
| `relacionada` | Vínculo genérico | `relacionada` |

Hoy los `related` existentes pasan como `relacionada`. Todas las relaciones con proyectos se crean **solo con información comprobada** (nivel A o B de `proyectos-verificables.md`).

## 8. Ids

- **Id global** = slug del nombre. Si dos fichas chocan, se agrega un sufijo por subtipo (`servicio-claude-api`, `skill-claude-api`).
- Los rubros viven en su propio espacio (`rubro:slug`).
- `legacy-ids` mapea cada `{colección, id}` viejo al nuevo, para redirigir las URLs antiguas y migrar la receta guardada en el navegador.
- Con la propuesta actual quedan **0 ids repetidos** (hoy son 4 más 1 de rubro). La unicidad la valida el reporte.

## 9. El recomendador de rubros

Elegir un rubro (buscador + grupos por familia) abre una página "Para <rubro>" con las **soluciones por rubro**, los **tipos de web** sugeridos (por las relaciones de Negocios), los **estilos y patrones** recomendados, la **paleta** copiable, los **recursos**, la **maqueta** ("Así se ve", etiquetada) y las **funcionalidades solo donde estén documentadas** (campo "Funcionalidades que venden"). En el otro sentido, cada estilo y patrón muestra "Recomendado para: …", calculado de `rubros.recomienda` (hoy esa relación va en un solo sentido: 316 enlaces de rubros a estilos y 13 a landing).

## 10. Las tres entradas

Son **vistas de la misma base** (no páginas distintas) y se recuerda la elegida.

| Vista | Qué ve el visitante |
|---|---|
| **Tengo un problema** | "¿De qué es tu negocio?" → soluciones filtradas por rubro, el recomendador y "Quiero algo así" |
| **Quiero aprender** | Técnicas, herramientas y recursos por área, de nivel inicial a avanzado; filtros por tema; demos y prompts |
| **Qué sabe hacer Darío** | **Proyectos → funcionalidades, técnicas y herramientas relacionadas → evidencias**: cada saber respaldado por algo construido o probado, siempre con la etiqueta de evidencia |

Siempre disponibles: buscador y "ver todo".

## 11. Cambios en el menú y en las fichas

**Menú:** la barra lateral deja de mostrar las 11 colecciones y muestra las **4 áreas** con contador y, adentro de cada una, filtros de tipo/subtipo. Fila de **temas** (los vacíos como "pronto"), selector de **rubro** y selector de **vista**. Se conservan los filtros de Valor y Nivel y el título "Base de datos de herramientas, funcionalidades e información útil".

**Ficha:** plantilla común con bloques opcionales, en este orden:
1. Encabezado: valor (con porqué, fecha y la marca "provisional" si corresponde), nivel, etiquetas de evidencia y "Quiero algo así".
2. Núcleo en filas compactas.
3. **Evidencias**, cada una con su etiqueta. El antes/después aparece cuando la ficha es lo que cambia (skills, estilos, tipografías, reglas UX); en soluciones, el antes es el problema. En experimentos: veredicto y criterio de análisis.
4. **Dónde lo usé**: enlaces a fichas de proyecto (solo relaciones comprobadas).
5. **Reutilizable**: prompt (Probado o Sin probar, con botón de copiar), paleta, fuentes.
6. Relaciones, incluidas las inversas.
7. Datos técnicos plegados.

## 12. Decisiones pendientes que afectan al modelo

| Caso | Pendiente | Efecto |
|---|---|---|
| 9 | Bloque `como` en el núcleo | Sin él, el contenido principal de 130 fichas (landing y UX) queda en `tecnico` |
| 11 | Qué cuenta como maqueta (diagramas y presets) | Cambia el conteo de evidencias |
| 13 | Valor y nivel en la faceta de rubro | Qué se muestra |
| 2, 3, 4, 5 | Fusiones y variantes de estilos | Cuántas fichas quedan en cada subtipo |
| 8 | Vocabulario de temas | Etiquetas y filtros |
| 14 | Formato de URL | Router y redirects |

Nada de esto se aplica a los datos reales hasta que apruebes el reporte de clasificación.
