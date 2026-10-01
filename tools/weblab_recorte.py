#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recorte y limpieza de lo importado de ui-ux-pro-max (Lab de Programación).

La skill trae ~670 fichas pensadas para cualquier producto del mundo. Acá se deja lo que le sirve a quien
arma webs para negocios y profesionales de Argentina, y se corrige lo que confundía:

  - Rubros: se sacan apps de consumo, juegos casuales, tecnología futurista y utilidades de celular.
  - Paletas: dejan de ser una categoría aparte (era una copia 1:1 de los rubros): cada rubro lleva su paleta.
  - Tipografías para alfabetos no latinos, estilos de app móvil y reglas de visionOS: fuera.
  - UX: los ejemplos "Bien / Mal" que estaban en inglés se traducen y se marcan como texto si no son código.
  - Estilos: se saca el "CSS técnico" y las variables, que eran pseudo-CSS en inglés que no se podía copiar,
    y los puntajes por framework (sin fuente).

build-weblab.py lo aplica después de las correcciones y antes de calcular nivel y valor.
"""

# ── Qué se saca ──
RUBROS = """
smart-home-iot-dashboard cybersecurity-platform autonomous-drone-fleet-manager sustainable-energy-climate-tech
status-page-incident-management rpa-automation-dashboard nft-web3-platform auction-platform gift-wishlist
telemedicine-platform micro-credentials-badges-platform flashcard-study-tool coding-challenge-practice
kids-learning-abc-math music-instrument-learning casual-puzzle-game trivia-quiz-game idle-clicker-game
word-crossword-game arcade-retro-game government-portal-civic-services grant-funding-portal
personal-finance-tracker expense-splitter-bill-split dating-app chat-messaging-app couple-relationship-app
anonymous-community-confession q-a-community-platform remote-work-collaboration-tool forum-discussion-board
testimonial-social-proof-widget biohacking-longevity-app quantum-computing-interface generative-art-platform
spatial-computing-os-app notes-writing-app grocery-shopping-list scanner-document-manager
calendar-scheduling-app password-manager translator-app calculator-unit-converter file-manager-transfer
email-client photo-editor-filters drawing-sketching-canvas meme-sticker-maker ai-photo-avatar-generator
link-in-bio-page-builder family-calendar-chores vpn-privacy-tool emergency-sos-safety wallpaper-theme-app
digital-signage-kiosk e-signature-document-workflow feature-flag-config-management
patient-portal-health-records resume-cv-builder survey-form-builder habit-tracker weather-app
diary-journal-app timer-pomodoro parenting-baby-tracker alarm-world-clock wardrobe-outfit-planner
plant-care-tracker book-reading-tracker mood-tracker running-cycling-gps yoga-stretching-guide
sleep-tracker calorie-nutrition-counter period-cycle-tracker medication-pill-reminder
water-hydration-reminder fasting-intermittent-timer study-together-virtual-coworking
ev-charging-ecosystem ride-hailing-transportation parking-finder public-transit-guide
voice-recorder-memo short-video-editor music-creation-beat-maker white-noise-ambient-sound
bookmark-read-later academic-journal-scholarly-publishing wiki-encyclopedia changelog-release-notes
open-source-project-landing patent-ip-database road-trip-planner local-events-discovery
space-tech-aerospace citizen-science-platform
""".split()

TIPOGRAFIAS = ["japanese-elegant", "korean-modern", "chinese-traditional", "chinese-simplified",
               "arabic-elegant", "thai-modern", "hebrew-modern"]

UX = ["27-haptic-feedback", "94-gaze-hover", "95-depth-layering"]   # vibración de celular y visionOS

ESTILOS = ["spatial-ui-visionos", "modern-dark-cinema-mobile", "saas-mobile-high-tech-boutique", "terminal-cli-mobile",
           "kinetic-brutalism-mobile", "flat-design-mobile-touch-first", "material-you-md3-mobile", "neo-brutalism-mobile",
           "bold-typography-mobile-poster", "academia-scholarly-mobile", "cyberpunk-mobile-hud", "bitcoin-defi-mobile",
           "claymorphism-mobile", "enterprise-saas-mobile", "sketch-hand-drawn-mobile", "neumorphism-mobile"]

# Campos de estilos que no se pueden copiar o no tienen fuente
CAMPOS_ESTILOS_FUERA = {"CSS técnico", "Variables CSS", "Frameworks"}

# ── UX: ejemplos "Bien / Mal" en castellano. Prefijo "~" = es una frase, no código ──
UX_EJEMPLOS = {
  1:  (None, "~Un <a href=\"#seccion\"> sin ese CSS"),
  2:  ("pt-20 (si el menú mide h-20)", "~Sin compensar el alto del menú"),
  3:  (None, "~Todos los links con el mismo estilo"),
  5:  ("~Parámetros en la URL (?filtro=x) o un #hash", "~Una sola URL para todos los estados"),
  6:  ("~Inicio > Categoría > Producto", "~Solo en páginas muy anidadas"),
  7:  ("~Una sola animación en el hero", "~animate-bounce en 5 o más elementos"),
  9:  (None, "~No consultar la preferencia de movimiento"),
  10: ("animate-pulse (esqueleto)", "~Pantalla en blanco mientras carga"),
  16: ("overflow-auto con scroll", "~overflow-hidden que corta el contenido"),
  17: ("~Menú fijo arriba y barra fija abajo, con espacio entre ambos", "~Varios elementos fijos que se tapan entre sí"),
  18: ("~Un contenedor padre con z-index aísla a sus hijos", "~z-index: 9999 que no hace efecto"),
  19: ("aspect-ratio o alto fijo", "~Imágenes sin dimensiones"),
  20: ("min-h-dvh o min-h-screen", "h-screen en el celular"),
  21: ("max-w-prose o max-w-3xl", "~Párrafos a todo el ancho"),
  22: (None, "w-6 h-6 en los botones"),
  23: (None, "gap-0 o gap-1"),
  24: ("~El scroll vertical como gesto principal", "~Un carrusel que solo se mueve de costado"),
  25: (None, "~Sin optimización táctil"),
  26: (None, "~El overscroll por defecto del navegador"),
  27: (None, "~Vibrar en cada toque"),
  28: (None, "outline-none sin una alternativa visible"),
  29: (None, "~Sin estilo de hover"),
  30: (None, "~Sin estado activo"),
  31: (None, "~Con el mismo estilo que el habilitado"),
  32: ("disabled={loading} + spinner", "~Botón que se puede tocar mientras carga"),
  33: ("~Borde rojo + mensaje de error", "~Sin ninguna señal del error"),
  34: ("~Toast o tilde de confirmación", "~La acción termina en silencio"),
  35: ("~Modal «¿Estás seguro?»", "~Borrar directo al hacer clic"),
  36: ("#333 sobre blanco (12,6:1)", "#999 sobre blanco (2,8:1)"),
  37: ("~Texto rojo + ícono de error", "~Solo un borde rojo para marcar el error"),
  38: ("alt='Perro jugando en el parque'", "alt='' en imágenes con contenido"),
  39: ("~h1, después h2, después h3", "~h1 y salto directo a h4"),
  40: ("aria-label='Cerrar menú'", None),
  41: ("~tabIndex para dar un orden propio", "~Elementos a los que no se llega con el teclado"),
  42: (None, "~<div> para todo"),
  43: (None, "~Solo placeholder='Email'"),
  44: (None, "~Solo un borde rojo"),
  45: ("~Link «Saltar al contenido»", "~100 tabulaciones para llegar al contenido"),
  46: ("srcset con varios tamaños", "~Una imagen de 4000 px para mostrarla a 400 px"),
  47: (None, "~Todas las imágenes cargan de entrada"),
  48: ("import() dinámico", "~Todo el código en un solo bundle"),
  49: ("headers Cache-Control", "~Cada pedido llega hasta el servidor"),
  50: (None, "~FOIT (texto invisible mientras carga la fuente)"),
  51: ("atributo async o defer", "<script src='...'> en el head"),
  52: ("~Un analizador de bundle", "~Sin medir el tamaño"),
  53: ("~CSS crítico adentro de la página", "~Todo el CSS bloqueando en el head"),
  54: (None, "~Solo placeholder='Email'"),
  55: ("~El error debajo de cada campo", "~Todos los errores juntos arriba del formulario"),
  56: ("~Validar al salir del campo (onBlur)", "~Validar solo al enviar"),
  57: (None, "type='text' para un email"),
  58: (None, "autocomplete='off' en todos lados"),
  59: ("~Asterisco (*) en los obligatorios", "~Que el usuario adivine cuáles lo son"),
  60: ("~Botón para mostrar u ocultar la contraseña", "~Contraseña siempre oculta"),
  61: ("~Cargando → mensaje de éxito", "~El botón no responde al tocarlo"),
  62: ("~Borde o fondo en los campos", "~Campos sin borde"),
  63: (None, "~Teclado de texto para números"),
  64: ("Mobile por defecto + md: lg: xl:", "~Escritorio por defecto y media queries con max-width"),
  65: ("~Probar en varios dispositivos", "~Desarrollar en uno solo"),
  66: ("~Botones más grandes en el celular", "~Botones de tamaño escritorio en el celular"),
  67: ("text-base o más grande", "text-xs en el texto del cuerpo"),
  68: (None, "~Sin la etiqueta meta viewport"),
  69: (None, "~Barra de scroll horizontal en el celular"),
  70: (None, "width='800' fijo"),
  71: ("contenedor con overflow-x-auto", "~La tabla se sale de la pantalla"),
  73: (None, "~Texto a todo el ancho de la pantalla"),
  74: ("~Escala tipográfica (12 14 16 18 24 32)", "~Tamaños arbitrarios"),
  75: ("font-display: swap + fuente de respaldo parecida", "~Sin fuente de respaldo"),
  77: ("~Negrita y más grande", "~Del mismo tamaño que el texto"),
  78: ("~Esqueleto o spinner", "~Pantalla congelada"),
  79: ("~«Todavía no hay nada. ¡Creá el primero!»", "~Un espacio en blanco vacío"),
  80: ("~Botón «Reintentar» + link de ayuda", "~Solo el mensaje de error"),
  81: ("~Indicador «Paso 2 de 4»", "~Sin información de los pasos"),
  82: ("~Toast que se cierra solo", "~Toast que nunca se va"),
  83: ("~Toast «Guardado con éxito»", "~Sin confirmación"),
  84: ("line-clamp-2 con «ver más»", "~Se desborda o se corta"),
  85: ("~«Hace 2 horas» o el formato local", "~01/02/03 (no se entiende cuál es el día)"),
  86: ("~1,2 K o 1.234", "1234567"),
  87: ("~Contenido de ejemplo real", None),
  88: ("~Botón «Saltar tutorial»", "~Pantalla bloqueada hasta terminar"),
  89: ("~Pedido con debounce + lista desplegable", "~Sin sugerencias"),
  90: ("~«Probá buscar X en su lugar»", "~«No se encontraron resultados.» y nada más"),
  91: ("~Columna de casillas + barra de acciones", "~Repetir la acción en cada fila"),
  92: ("~Etiqueta «Asistente de IA»", "~Un nombre humano falso sin aclarar que es IA"),
  93: ("~Efecto máquina de escribir", "~Spinner hasta que termina todo"),
  96: (None, "autoplay loop"),
  97: ("Compresión Draco", "~Archivos .obj sin comprimir"),
  98: ("~Componente de feedback (pulgar arriba o abajo)", "~Solo texto de lectura"),
}

# Dos reglas se llamaban igual: la segunda trata del salto de layout al cargar la fuente
UX_NOMBRES = {"75-font-loading": "Fuentes sin saltos de layout"}


def _num(id_):
    return int(id_.split("-")[0])


def aplicar(data, avisar=print):
    """Recorta, funde paletas en rubros y limpia. Devuelve cuántas fichas quedaron fuera por categoría."""
    fuera = {}

    # 1) Paletas → dentro de su rubro (antes de recortar, para no perder el vínculo)
    por_id = {e["id"]: e for e in data.get("rubros", [])}
    for p in data.pop("paletas", []):
        r = por_id.get(p["id"])
        if not r:
            avisar(f"  · paleta sin rubro: {p['id']}"); continue
        r["palette"] = p["palette"]
        if p.get("summary"):
            r["fields"].append(["Nota de la paleta", p["summary"]])
    for r in data.get("rubros", []):
        r["related"] = [x for x in r.get("related", []) if not x.startswith("paletas/")]

    # 2) Recorte
    for cat, ids in (("rubros", RUBROS), ("tipografias", TIPOGRAFIAS), ("ux", UX), ("estilos", ESTILOS)):
        antes = len(data[cat]); salen = set(ids)
        desconocidos = salen - {e["id"] for e in data[cat]}
        if desconocidos: avisar(f"  · recorte: ids que no existen en {cat}: {sorted(desconocidos)}")
        data[cat] = [e for e in data[cat] if e["id"] not in salen]
        fuera[cat] = antes - len(data[cat])

    # 3) Que nadie apunte a una ficha que ya no está
    existen = {(c, e["id"]) for c, lista in data.items() for e in lista}
    for lista in data.values():
        for e in lista:
            if e.get("related"):
                e["related"] = [x for x in e["related"] if "/" not in x or tuple(x.split("/", 1)) in existen]

    # 4) UX: ejemplos en castellano y nombres
    for e in data["ux"]:
        n = _num(e["id"])
        if e["id"] in UX_NOMBRES: e["name"] = UX_NOMBRES[e["id"]]
        if n in UX_EJEMPLOS:
            code = e.setdefault("code", {})
            tx = ""
            for lado, nuevo, marca in zip(("good", "bad"), UX_EJEMPLOS[n], ("g", "b")):
                if nuevo is None: continue
                if nuevo.startswith("~"): nuevo, tx = nuevo[1:], tx + marca
                code[lado] = nuevo
            # frases = las dos sin código; si solo una lo es, se marca cuál
            if tx: code["tx"] = tx
    return fuera


def limpiar_estilos(data):
    for e in data["estilos"]:
        e["fields"] = [[k, v] for k, v in e["fields"] if k not in CAMPOS_ESTILOS_FUERA]
        for par in e["fields"]:
            if par[0] == "Prompt para IA": par[0] = "Prompt para IA (en inglés)"
