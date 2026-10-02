#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Núcleo escrito de las skills (borrador de Claude, sin validar por Darío). Se apoya en la descripción de cada skill; no afirma nada sobre proyectos de Darío."""
def N(que, prob, aporta, si, no, resumen=None):
    d = {"nucleo": {"que_es": [{"l": "", "x": que}], "problema": [{"l": "", "x": prob}],
                    "aporta": [{"l": a, "x": b} for a, b in aporta],
                    "cuando_si": [{"l": "", "x": si}], "cuando_no": [{"l": "", "x": no}]}}
    if resumen: d["resumen"] = resumen
    return d

SK = {
 "frontend-design": N(
  "Una skill oficial de Anthropic que, antes de escribir código, le hace elegir a Claude una dirección visual (tipografía, color, composición) y después la ejecuta con detalle.",
  "Las interfaces hechas con IA suelen salir con la misma estética genérica: mismo degradé, mismas tarjetas, misma tipografía. La skill obliga a decidir un estilo antes de programar.",
  [("Punto de partida con criterio.", "Se define el estilo primero y se ejecuta después, en vez de improvisar sobre la marcha."), ("Es la más instalada.", "Es la skill de diseño más usada, así que es un buen primer paso para probar."), ("Sirve para casi cualquier interfaz.", "Landings, portfolios y componentes.")],
  "Landings, portfolios, componentes y cualquier interfaz que no querés que parezca hecha con una plantilla. Es una buena primera skill de diseño si recién empezás.",
  "Cuando ya tenés un sistema de diseño cerrado: ahí la skill propone un estilo nuevo y vas a pelear contra lo que ya está definido. Para pulir algo ya hecho conviene una skill de revisión, como Impeccable."),
 "skill-creator": N(
  "La skill oficial para crear otras skills: te guía para escribir el SKILL.md, arma casos de prueba (evals) y compara cómo rinde Claude con y sin la skill.",
  "Cuando repetís siempre las mismas instrucciones, copiarlas en cada conversación es lento y se pierde consistencia. Y una skill mal escrita no se nota hasta que falla.",
  [("Convierte instrucciones repetidas en una skill.", "Claude las usa solo cuando corresponde."), ("Se puede medir.", "Los casos de prueba comparan el resultado con y sin la skill, en lugar de confiar en la intuición.")],
  "Cuando repetís el mismo pedido muy seguido (un formato de informe, una forma de revisar código) y querés empaquetarlo para que se aplique solo.",
  "Para algo que hacés una vez, o que cambia cada vez: no vale el trabajo de empaquetarlo. Tampoco reemplaza probar la skill en tu caso real."),
 "xlsx": N(
  "Una skill oficial para crear, leer y editar planillas de Excel (.xlsx) con fórmulas que funcionan, formatos, varias hojas y gráficos.",
  "Pedirle a una IA una planilla suele terminar en una tabla de texto que después hay que armar a mano. Esta skill genera el archivo real, con las fórmulas vivas.",
  [("Archivos reales.", "Se abren en Excel con fórmulas, formatos y gráficos."), ("Limpieza de datos.", "Ordena planillas desordenadas antes de analizarlas.")],
  "Reportes de ventas, control de stock o análisis de campañas: cualquier planilla que después vas a abrir y seguir usando en Excel.",
  "Si solo necesitás un número o una cuenta rápida, no hace falta un archivo. Y revisá siempre las fórmulas con tus datos antes de usar el resultado para decidir."),
 "docx": N(
  "Una skill oficial para crear y editar documentos de Word (.docx) conservando estilos, y para leer documentos existentes, comentarios y cambios marcados.",
  "Un texto pegado en un chat hay que volver a darle formato en Word. Acá el documento sale con títulos, tablas e índice, listo para entregar.",
  [("Formato profesional.", "Títulos, tablas e índices desde el primer borrador."), ("Trabaja sobre documentos existentes.", "Respeta los estilos y lee los comentarios y los cambios marcados.")],
  "Informes, propuestas, manuales de procedimientos o cualquier entrega que el cliente espera como un Word.",
  "Si lo que necesitás es texto para pegar en un correo o en una web, un archivo es un paso de más. Para un documento que se escribe de a dos, hay un flujo guiado aparte (Doc Co-authoring)."),
 "pptx": N(
  "Una skill oficial para crear presentaciones de PowerPoint (.pptx) desde cero o a partir de una plantilla, con layouts, gráficos y notas del orador.",
  "Armar diapositivas lleva más tiempo que pensar qué decir. La skill resuelve el armado y deja el tiempo para el mensaje.",
  [("Parte de una plantilla.", "Puede respetar el diseño que ya usás."), ("Lee y reorganiza.", "También trabaja sobre presentaciones existentes.")],
  "Presentar resultados, el pitch de un proyecto o un reporte mensual.",
  "Cuando la presentación depende de una identidad visual muy trabajada: conviene partir de tu plantilla y revisar el resultado diapositiva por diapositiva."),
 "pdf": N(
  "Una skill oficial para trabajar con PDFs: extrae texto y tablas, une o separa archivos, completa formularios, agrega marcas de agua y aplica OCR a escaneos.",
  "Los PDFs suelen ser un callejón sin salida: el dato está adentro pero no se puede usar. La skill lo saca y lo vuelve utilizable.",
  [("Extrae datos.", "Texto y tablas de facturas o catálogos."), ("Opera sobre el archivo.", "Unir, dividir, completar formularios y marcas de agua."), ("OCR.", "Lee documentos escaneados.")],
  "Facturas, catálogos de proveedores en PDF, formularios o documentos escaneados.",
  "Cuando el PDF es de baja calidad o una foto torcida: el OCR comete errores y hay que revisar cada dato. Con información sensible, pensá antes de subir el archivo."),
 "webapp-testing": N(
  "Una skill oficial que prueba aplicaciones web locales manejando un navegador con Playwright: abre la app, hace clics, completa formularios, saca capturas y revisa errores de consola.",
  "Después de cada cambio en el frontend hay que probar a mano que nada se rompió. Es lento y se olvidan casos.",
  [("Pruebas de flujo completo.", "Recorre la app como lo haría una persona."), ("Evidencia visual.", "Capturas y errores de consola para ver qué pasó.")],
  "Después de un cambio en el frontend, para comprobar flujos completos (un formulario, un carrito) sin hacerlo a mano.",
  "En proyectos muy chicos o páginas estáticas, mirarlas en el navegador alcanza. No reemplaza las pruebas automáticas del código."),
 "mcp-builder": N(
  "Una skill oficial con una guía para construir servidores MCP, que son los que conectan a Claude con APIs y herramientas propias. Ayuda a diseñar las herramientas, escribir el servidor (TypeScript o Python) y probarlo.",
  "Claude solo usa directamente los servicios a los que está conectado. Si querés que use una API tuya o de un tercero, hace falta un servidor MCP bien diseñado.",
  [("Buenas prácticas de diseño.", "Qué herramientas exponer y cómo nombrarlas."), ("Dos lenguajes.", "TypeScript o Python.")],
  "Cuando querés que Claude consulte u opere un servicio propio o una API externa sin copiar y pegar datos.",
  "Si no vas a repetir la integración, un script alcanza. Es una skill de nivel avanzado: pide saber programar y entender cómo funciona una API."),
 "claude-api": N(
  "Una skill oficial con la referencia actualizada para construir con la API de Claude y sus SDKs: modelos vigentes, precios, streaming, tool use, caché de prompts y migraciones entre versiones.",
  "Los modelos y los precios cambian seguido, y una IA entrenada hace meses puede usar nombres o parámetros viejos. La skill pone la referencia al día.",
  [("Información vigente.", "Modelos y precios actuales."), ("Cubre lo difícil.", "Tool use, caché de prompts y streaming.")],
  "Al integrar Claude en una app propia, por ejemplo un generador de títulos o un asistente.",
  "Si solo usás Claude desde la aplicación, no la necesitás. Verificá los precios en la documentación oficial antes de calcular costos."),
 "web-artifacts-builder": N(
  "Una skill oficial que construye aplicaciones web de varios componentes con React, Tailwind y shadcn/ui, con estado y rutas, empaquetadas en un solo archivo HTML.",
  "Compartir un prototipo interactivo suele pedir armar un proyecto, un servidor y un deploy. Acá todo queda en un solo HTML.",
  [("Todo en un archivo.", "Se comparte con un link."), ("Componentes reales.", "React, Tailwind y shadcn/ui.")],
  "Prototipos interactivos, calculadoras o mini apps para compartir sin montar un proyecto.",
  "Para un sitio de producción con base de datos, cuentas y servidor: es para prototipos, no reemplaza una arquitectura real."),
 "canvas-design": N(
  "Una skill oficial para crear piezas visuales estáticas en PNG o PDF: primero define una filosofía visual y después compone afiches, portadas o gráficas.",
  "Las imágenes generadas sin criterio de diseño salen desordenadas. La skill obliga a decidir el concepto antes de componer.",
  [("Concepto antes que composición.", "Cada pieza parte de una idea visual."), ("Salida lista para usar.", "PNG o PDF.")],
  "Flyers, portadas, banners o infografías que no necesitan ser interactivas.",
  "Para piezas con la identidad exacta de una marca, o que necesitan fotos reales de producto: acá hay que revisar y ajustar el resultado a mano."),
 "algorithmic-art": N(
  "Una skill oficial para crear arte generativo con p5.js: aleatoriedad controlada, campos de flujo y partículas. Las piezas son reproducibles con una semilla.",
  "Un fondo generado al azar no se puede repetir ni ajustar. Con una semilla, la misma pieza se regenera y se pueden explorar variaciones.",
  [("Reproducible.", "La semilla permite volver a una versión que te gustó."), ("Explora variaciones.", "Cambiás parámetros y ves alternativas.")],
  "Fondos únicos para una marca, visuales para redes o experimentación creativa.",
  "Si necesitás un resultado exacto y previsible (un logo, una ilustración puntual), el arte generativo es el camino equivocado."),
 "theme-factory": N(
  "Una skill oficial con temas visuales prearmados (colores y tipografías) que se aplican de forma consistente a documentos, presentaciones y artifacts. También genera temas nuevos.",
  "Cuando una presentación, un informe y una página se hacen por separado, cada uno sale con su propio estilo. Un tema común los une.",
  [("Consistencia.", "Las piezas comparten colores y tipografías."), ("Temas listos.", "Evita empezar la paleta de cero.")],
  "Cuando tenés varias piezas (presentación, informe, página) y querés que compartan identidad.",
  "Si ya tenés una marca definida, usá sus colores y su tipografía: un tema genérico la va a pisar."),
 "brand-guidelines": N(
  "Una skill oficial que aplica los colores y la tipografía de la marca Anthropic. Sirve sobre todo como ejemplo de cómo empaquetar un manual de marca en una skill.",
  "Los manuales de marca en PDF no los lee una IA como reglas. Empaquetados en una skill, se aplican solos en cada pieza.",
  [("Un modelo para copiar.", "Muestra la estructura de una skill de marca."), ("Identidad en cada pieza.", "Los colores y la tipografía salen aplicados desde el primer borrador.")],
  "Como modelo para armar la skill del manual de marca de tu propia empresa o de un cliente.",
  "Usada tal cual solo sirve si querés la identidad de Anthropic. Para otra marca, hay que reemplazar sus reglas."),
 "internal-comms": N(
  "Una skill oficial para redactar comunicaciones internas con los formatos que usan las empresas: reportes de estado, novedades del equipo, resúmenes de incidentes y preguntas frecuentes.",
  "Los avisos internos suelen salir largos y confusos. Un formato conocido hace que se lean y se entiendan rápido.",
  [("Formatos reconocibles.", "Estado, novedades, incidentes y FAQ."), ("Más claro.", "Ordena la información por lo que necesita saber el lector.")],
  "Cuando tenés que informar avances o problemas al equipo o a la gerencia con claridad.",
  "Para comunicación con clientes o textos de marketing: el tono y el objetivo son otros (para eso, una skill de copywriting)."),
 "doc-coauthoring": N(
  "Una skill oficial con un flujo guiado para escribir documentos de a dos con Claude: junta contexto, propone una estructura, itera sección por sección y verifica que el documento se entienda solo.",
  "Pedir un documento largo de una sola vez sale genérico. Escribirlo por secciones, con contexto, sale más ajustado a lo que querés.",
  [("Escritura por etapas.", "Contexto, estructura y luego cada sección."), ("Revisión final.", "Chequea que alguien sin contexto lo entienda.")],
  "Propuestas, especificaciones técnicas o documentos de decisión que necesitan varias vueltas.",
  "Para un texto corto o de una sola pasada, el flujo es demasiado. Es mejor pedirlo directo."),
 "slack-gif-creator": N(
  "Una skill oficial que genera GIFs animados cortos respetando los límites de tamaño y dimensiones de Slack.",
  "Un GIF casero suele pesar de más y Slack lo rechaza o lo muestra mal. La skill ya conoce los límites.",
  [("Cumple los límites de Slack.", "Tamaño y dimensiones correctos."), ("Rápido.", "Un GIF para un anuncio o una celebración en minutos.")],
  "Celebraciones del equipo, reacciones o anuncios con un poco de humor.",
  "Es una skill de nicho: si no usás Slack o necesitás animaciones de marca cuidadas, no aporta."),
 "superpowers": N(
  "Una skill de la comunidad (de Jesse Vincent, aceptada en el marketplace oficial) que hace trabajar a Claude con método de desarrollador senior: brainstorming antes de programar, planes en tareas chicas, TDD y ejecución con subagentes.",
  "Pedirle a una IA una funcionalidad grande de una sola vez suele terminar en código que hay que rehacer. Con plan y pruebas, los errores aparecen antes.",
  [("Pensar antes de programar.", "Brainstorming y plan antes de la primera línea."), ("Tareas chicas y verificables.", "TDD y ejecución con subagentes.")],
  "Funcionalidades medianas o grandes donde improvisar sale caro.",
  "Para un arreglo de una línea o un script descartable, el método es más lento que hacerlo directo."),
 "ui-ux-pro-max": N(
  "Una base de conocimiento de diseño en forma de skill (de nextlevelbuilder): decenas de estilos, paletas por rubro, combinaciones tipográficas y buenas prácticas de UX. Las fichas de diseño de este Lab salen de esta skill.",
  "Elegir una dirección visual de cero es lento y arbitrario. Con un catálogo ordenado por rubro, la decisión parte de algo concreto.",
  [("Catálogo ordenado.", "Estilos, paletas, tipografías y reglas UX en un solo lugar."), ("Por rubro.", "Propone según el tipo de negocio.")],
  "Elegir la dirección visual de un proyecto nuevo según el rubro, o chequear una interfaz contra reglas de UX.",
  "No diferencia por sí sola: el resultado se parece a lo que genera cualquiera con la misma base. Conviene sumarle una skill de revisión de diseño."),
 "web-design-guidelines": N(
  "Una skill de la comunidad (Vercel Labs) que audita una interfaz contra más de 100 reglas de accesibilidad, rendimiento y UX y devuelve los problemas priorizados.",
  "Antes de publicar, es fácil pasar por alto contraste, foco, tamaños táctiles o imágenes sin texto alternativo. La skill los revisa regla por regla.",
  [("Revisión sistemática.", "Más de 100 reglas, una por una."), ("Problemas priorizados.", "Se arregla primero lo que más importa.")],
  "Antes de publicar un sitio o después de un rediseño.",
  "No reemplaza probar con personas reales ni con lectores de pantalla: es una revisión de reglas, no de experiencia de uso."),
 "react-best-practices": N(
  "Una skill de la comunidad (Vercel Labs) que aplica decenas de reglas de rendimiento para React y Next.js (renders, bundles, carga de datos), ordenadas por el impacto que tienen.",
  "Optimizar a ciegas lleva a tocar lo que no importa. Las reglas están ordenadas por lo que más mueve la aguja.",
  [("Priorizadas por impacto.", "Primero lo que más mejora la velocidad."), ("Cubre renders, bundles y datos.", "Los tres lugares donde suele perderse tiempo.")],
  "Aplicaciones en React que se sienten lentas, o antes de escalar un proyecto.",
  "Si el proyecto no usa React o Next.js no aplica. Y no optimices una app que todavía no tiene un problema medido."),
 "trailofbits": N(
  "Una skill de la comunidad (de Trail of Bits, una auditora de seguridad) que corre análisis estático con herramientas como CodeQL y Semgrep siguiendo procesos de auditoría reales.",
  "Un fallo de seguridad en una app con login o pagos sale caro. Los errores comunes se pueden detectar antes de publicar con herramientas automáticas.",
  [("Metodología profesional.", "Procesos de una auditora real."), ("Herramientas estándar.", "CodeQL y Semgrep.")],
  "Antes de publicar una app con login, pagos o datos de clientes.",
  "No reemplaza una auditoría humana: el análisis estático no encuentra todo. Es de nivel avanzado, hay que saber interpretar los resultados."),
 "remotion": N(
  "Una skill de la comunidad con experiencia de dominio para crear videos con código usando React y Remotion: guía para componer, animar y renderizar videos programáticos.",
  "Editar un video a mano no escala cuando hay que hacer muchos parecidos. Un video programado se regenera cambiando los datos.",
  [("Videos en serie.", "Cambiás el contenido y se vuelve a renderizar."), ("Control exacto.", "Cada animación está en código.")],
  "Videos de producto, clips para redes o piezas que se generan en serie.",
  "Para un único video con mucho material filmado, un editor tradicional es más directo. Pide saber React."),
 "grill-me": N(
  "Una skill de la comunidad (de Matt Pocock) que hace que Claude te entreviste y cuestione tus supuestos: hace preguntas incómodas sobre el diseño hasta que el plan cierra, antes de escribir una línea.",
  "Se empieza a construir con ideas a medio pensar y los problemas aparecen cuando ya hay código. Las preguntas a tiempo ahorran la mitad del trabajo.",
  [("Detecta huecos del plan.", "Preguntas que no te habías hecho."), ("Evita construir de más.", "Se descarta lo que no hacía falta.")],
  "Al arrancar una idea nueva, para no construir lo que no hacía falta.",
  "Cuando el problema ya está claro y probado: no hace falta más cuestionamiento. Tampoco sirve para tareas rutinarias."),
 "claude-ads": N(
  "Una skill de la comunidad (de Daniel Agrici) con un equipo completo de publicidad paga: 34 skills y 25 agentes para estrategia, auditoría, creatividades y reportes en Meta, Google, TikTok y otras plataformas. Todo queda en borrador hasta que lo aprobás.",
  "Manejar publicidad paga exige estrategia, creatividades, medición y reportes. Hacerlo todo a mano consume horas por cliente.",
  [("Cubre todo el ciclo.", "Plan de medios, Meta con píxel y Conversions API, textos, competencia, cálculo de ROAS y reportes."), ("Nada se publica solo.", "Todo queda en borrador hasta que lo aprobás.")],
  "Armar campañas de Meta Ads desde cero, auditar una cuenta que ya invierte o preparar el reporte mensual de un cliente.",
  "Sin presupuesto ni datos reales no hay mucho que auditar. Para generar imágenes necesita la clave de un proveedor (Gemini, OpenAI o Replicate)."),
 "ad-creative": N(
  "Una skill de la comunidad (de Corey Haines) que genera y escala anuncios: hooks, textos principales, títulos y variantes por formato para Feed, Stories y Reels.",
  "Los anuncios se cansan rápido y hay que renovarlos y probar variantes seguido. Escribirlos uno por uno no alcanza.",
  [("Variantes en serie.", "Muchos textos y hooks para testear."), ("Orienta el formato.", "Propone UGC, video sin cara o estático según el caso."), ("Hoja de ruta de pruebas.", "Ordena qué probar primero.")],
  "Cuando necesitás muchas variantes para testear o renovar anuncios que se cansaron.",
  "Si no tenés ni oferta ni público definidos, más anuncios no arreglan el problema de fondo. Revisá cada texto: las promesas deben ser reales."),
 "copywriting": N(
  "Una skill de la comunidad (de Corey Haines) para escribir textos que venden: propuesta de valor, títulos, llamados a la acción y estructura de página pensada para convertir, con la voz de la marca.",
  "Una página puede estar bien diseñada y no vender porque el texto no dice qué ofrece ni por qué conviene. El copy es lo que convierte la visita en contacto.",
  [("Propuesta de valor clara.", "Dice qué es, para quién y por qué."), ("Textos pensados para convertir.", "Títulos y llamados a la acción.")],
  "Antes de lanzar una landing o cuando una página tiene visitas y no convierte.",
  "Sin conocer al cliente y su producto, el texto sale genérico. Dale contexto real o revisá el borrador a mano."),
 "marketing-psychology": N(
  "Una skill de la comunidad (de Corey Haines) con principios de comportamiento aplicados a vender: anclaje, prueba social, aversión a la pérdida. Explica qué sesgo usar en cada situación y cómo aplicarlo sin manipular.",
  "Se toman decisiones de precio, oferta u orden de información por intuición. Los sesgos conocidos permiten hacerlo con criterio.",
  [("Un sesgo para cada situación.", "Precios, ofertas y orden de la información."), ("Sin manipular.", "Propone usarlos de forma honesta.")],
  "Diseñar ofertas, precios de preventa o el mensaje de un anuncio.",
  "No reemplaza probar con clientes reales: un principio funciona distinto según el público. No lo uses para presionar con falsa escasez."),
 "image": N(
  "Una skill de la comunidad (de Corey Haines) para generar imágenes de marketing con IA: piezas para redes, mockups de producto y banners. Elige el modelo según la pieza (FLUX, Gemini, Ideogram, GPT Image), arma los prompts y optimiza para web.",
  "Cada modelo de imágenes sirve para algo distinto y escribir buenos prompts lleva prueba y error. La skill decide cuál usar y cómo pedirlo.",
  [("Elige el modelo.", "Según la pieza que necesitás."), ("Prompts y optimización.", "Deja el archivo listo para la web.")],
  "Piezas para anuncios o redes cuando no hay fotos de producción. Funciona con ComfyUI local o con proveedores pagos.",
  "Para fotos reales de un producto, la IA no reemplaza al producto: puede mostrar algo que no existe. Revisá derechos y dejá claro cuando es una imagen generada."),
 "video": N(
  "Una skill de la comunidad (de Corey Haines) para producir videos con IA o con código: demos, clips para redes y anuncios. Elige entre video programático (Remotion, gratis), generación con IA (Veo, Kling, Runway) o avatares, y arma guion, escenas y render.",
  "Producir video es caro y lento, y hay muchas herramientas para elegir. La skill elige el camino según lo que necesitás.",
  [("Elige el método.", "Programático, generado con IA o con avatares."), ("Arma el guion y las escenas.", "Y deja el render listo.")],
  "Videos de anuncios para Reels y Stories, cuentas regresivas de lanzamientos o demos de producto.",
  "Para material con personas o productos reales, la generación con IA puede quedar artificial. Los modelos pagos suman costo por cada video."),
}
