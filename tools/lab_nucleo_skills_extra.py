#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Skills: valor validado por Darío (01/10, tanda 1) y bloque "cómo empezar" (borrador de Claude, sin validar).
El pedido de ejemplo de cada skill figura como "sin probar" salvo que haya experimento."""

# id: (valor, porqué)  · Darío aprobó la tabla completa el 01/10
VALOR_SK = {
 "copywriting": ("imprescindible", "Una web bien diseñada que no dice qué ofrece no vende, y la IA tiende a escribir textos genéricos. Quien escribe con criterio se diferencia."),
 "impeccable": ("imprescindible", "Vino a corregir justo lo que hace la IA por defecto: webs genéricas hechas con la misma receta. Hoy es lo que marca la diferencia."),
 "webapp-testing": ("imprescindible", "Comprobar los flujos reales antes de entregar marca la diferencia entre algo que parece listo y algo que funciona."),
 "superpowers": ("pro", "Trabajar con plan y pruebas evita rehacer. Separa a quien usa IA con método de quien improvisa, pero no hace falta en todo."),
 "grill-me": ("pro", "Es un método que pocos usan y que ahorra construir de más. No hace falta en cada proyecto."),
 "claude-ads": ("pro", "Cubre estrategia, creatividades y reportes de publicidad paga: una especialización que no todos ofrecen."),
 "ad-creative": ("pro", "Genera variantes de anuncios en serie para probar. Es una especialización de publicidad paga."),
 "mcp-builder": ("pro", "Conectar a Claude con servicios propios es un nivel avanzado que pocos dominan."),
 "claude-api": ("pro", "Integrar IA en una app propia es una especialización técnica."),
 "trailofbits": ("pro", "La seguridad con metodología de auditora profesional es una especialización que casi nadie ofrece."),
 "react-best-practices": ("pro", "Optimizar React con criterio de impacto es una especialización técnica."),
 "web-design-guidelines": ("pro", "Chequea accesibilidad y rendimiento antes de publicar, algo que casi nadie hace y separa un sitio cuidado de uno entregado como salió."),
 "image": ("pro", "Útil cuando no hay fotos de producción, pero depende del trabajo: con producto real, la IA puede mostrar algo que no existe."),
 "frontend-design": ("base", "Es la skill de diseño más instalada: la usa cualquiera, así que no te diferencia."),
 "ui-ux-pro-max": ("base", "Lo usa todo el mundo y ya quedó genérico: no te diferencia."),
 "skill-creator": ("base", "Sirve para armar tus propias skills, pero no suma directamente al trabajo para clientes."),
 "remotion": ("base", "Es de nicho: videos con código, y pide saber React."),
 "video": ("base", "Es de nicho y cada video generado tiene un costo."),
 "marketing-psychology": ("base", "Son principios conocidos: sirven, pero no te diferencian por sí solos."),
 "xlsx": ("base", "Herramienta de oficina: conveniente, no te diferencia."),
 "docx": ("base", "Herramienta de oficina: conveniente, no te diferencia."),
 "pptx": ("base", "Herramienta de oficina: conveniente, no te diferencia."),
 "pdf": ("base", "Herramienta de oficina: conveniente, no te diferencia."),
 "web-artifacts-builder": ("base", "Sirve para prototipos rápidos, no para un trabajo final."),
 "canvas-design": ("base", "Útil para piezas sueltas; no cambia el resultado de un proyecto."),
 "algorithmic-art": ("base", "Es creativa y de nicho: un adorno, no una pieza clave."),
 "theme-factory": ("base", "Sirve para unificar piezas, pero es secundaria."),
 "brand-guidelines": ("base", "Es sobre todo un ejemplo para armar tu propia skill de marca."),
 "internal-comms": ("base", "Ayuda con comunicaciones internas: útil, no te diferencia."),
 "doc-coauthoring": ("base", "Un flujo guiado para escribir; conveniente, no te diferencia."),
 "slack-gif-creator": ("base", "Es de nicho y anecdótica."),
}

def it(l, x): return {"l": l, "x": x}
def C(mirar, exp=True):
    """Pasos para empezar. 'mirar' = qué revisar en el resultado."""
    pasos = [it("1. Instalala.", "Usá el comando de más abajo en Claude Code y reiniciá la sesión."),
             it("2. Probala con el pedido de ejemplo.", "Cambiale los datos por los de tu caso real: cuanto más concreto el pedido, mejor el resultado."),
             it("3. Mirá esto en el resultado.", mirar)]
    if exp: pasos.append(it("4. Compará con y sin la skill.", "En el experimento de esta ficha podés ver el mismo pedido con y sin la skill."))
    return pasos

COMO_SK = {
 "frontend-design": (C("Que la página tenga una dirección visual clara (tipografía, color, composición) y no la receta de siempre: degradé violeta, tarjetas iguales."), True),
 "skill-creator": (C("Que el SKILL.md diga con claridad cuándo se activa y qué hace, y que los casos de prueba comparen el resultado con y sin la skill."), True),
 "xlsx": (C("Abrí el archivo en Excel: las fórmulas tienen que estar vivas (no valores pegados), y los totales tienen que coincidir con tus datos."), True),
 "docx": (C("Abrí el documento en Word: los títulos deben usar estilos (para que arme el índice) y las tablas tienen que ser editables."), True),
 "pptx": (C("Revisá diapositiva por diapositiva: que no haya texto cortado, que los números sean los tuyos y que las notas del orador estén."), True),
 "pdf": (C("Cotejá una muestra de los datos extraídos con el original. Con escaneos, el OCR puede equivocarse en números."), True),
 "webapp-testing": (C("Que haya recorrido los casos que pediste (el válido y el roto), con una captura de cada estado y los errores de consola si los hubo."), True),
 "mcp-builder": (C("Que las herramientas del servidor tengan nombres y descripciones claras, y que las pruebes con una llamada real antes de confiar en ellas."), True),
 "claude-api": (C("Que use un modelo vigente y que la clave de la API quede en una variable de entorno, no escrita en el código."), True),
 "web-artifacts-builder": (C("Abrí el archivo HTML resultante: debe funcionar solo, sin servidor, y los cálculos tienen que dar lo que esperás."), True),
 "canvas-design": (C("Fijate que el texto sea legible y no esté cortado en los bordes, y que la pieza comunique una sola idea."), True),
 "algorithmic-art": (C("Probá guardar la semilla de la versión que te gusta para poder regenerarla igual después."), True),
 "theme-factory": (C("Comprobá que el tema se aplique a toda la pieza (títulos, tablas, gráficos) y que el contraste del texto siga siendo bueno."), True),
 "brand-guidelines": (C("Mirá cómo está armada la skill (qué dice sobre colores, tipografía y tono) y copiá esa estructura para tu propia marca."), True),
 "internal-comms": (C("Que el aviso se entienda en los primeros renglones y use tus cifras reales, sin inventar datos."), True),
 "doc-coauthoring": (C("Dejá que te pregunte: el valor está en el contexto que le das antes de que escriba. Al final, pedile que verifique que el documento se entienda solo."), True),
 "slack-gif-creator": (C("Verificá que el archivo pese poco y se vea bien en Slack, y que el texto se lea en tamaño chico."), True),
 "superpowers": (C("Que primero haya un brainstorming y un plan en tareas chicas, y que escriba las pruebas antes del código."), True),
 "impeccable": (C("Probá un comando por vez (por ejemplo audit, y después polish) y leé qué problemas encontró antes de aceptar los cambios."), True),
 "ui-ux-pro-max": (C("Que la recomendación de estilo, paleta y tipografías tenga sentido para el rubro, y no la aceptes sin compararla con tu criterio."), True),
 "web-design-guidelines": (C("Que el listado venga ordenado por importancia y que cada punto indique dónde está el problema, así lo podés corregir."), True),
 "react-best-practices": (C("Que los cambios propuestos apunten a lo que más pesa (renders, bundle, datos). Medí antes y después para confirmar que mejoró."), True),
 "trailofbits": (C("Que cada hallazgo indique qué archivo y por qué es un riesgo. Un análisis automático no encuentra todo: no lo tomes como una auditoría completa."), True),
 "remotion": (C("Previsualizá el video en Remotion antes de renderizarlo y chequeá los tiempos."), False),
 "grill-me": (C("Respondé las preguntas con honestidad, aunque incomoden: el plan final tiene que reflejar tus respuestas."), False),
 "claude-ads": (C("Que el plan use tu presupuesto y objetivo reales, y recordá que todo queda en borrador hasta que lo aprobás vos."), False),
 "ad-creative": (C("Revisá que cada texto sea verdadero: nada de urgencia o escasez inventadas. Probá varias variantes y medí cuál rinde."), True),
 "copywriting": (C("Que el titular diga qué es, para quién y por qué conviene, sin frases vacías. Leelo en voz alta: tiene que sonar a tu marca."), True),
 "marketing-psychology": (C("Que proponga el principio y cómo usarlo de forma honesta. Si te sugiere presionar con falsa escasez, descartalo."), True),
 "image": (C("Fijate que las imágenes tengan el espacio libre que pediste (por ejemplo para el producto) y que no muestren algo que no existe."), False),
 "video": (C("Previsualizá antes de generar: los videos hechos con modelos pagos tienen costo por cada render."), False),
}
