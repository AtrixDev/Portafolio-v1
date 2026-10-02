#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Taxonomía compartida de Programación v2: tablas de clasificación (colección → tipo/subtipo/área,
excepciones de Estilos, pares Negocios ↔ Rubros, mapeo de campos al núcleo, temas).
Las usan weblab_clasificar.py (reporte, solo lectura) y weblab_migrar.py (genera frontend/data/lab/).
"""
import re, unicodedata

# ── Tipo · subtipo · área por colección (propuesta; se verifica con este reporte) ──
COL = {
    "negocios":      ("solucion",    "por rubro",         ["soluciones"]),
    "soluciones":    ("solucion",    "arquetipo de web",  ["desarrollo-web"]),   # en pantalla: "Tipos de web"
    "estilos":       ("tecnica",     "estilo visual",     ["desarrollo-web"]),
    "landing":       ("tecnica",     "patrón de página",  ["desarrollo-web"]),
    "ux":            ("tecnica",     "regla UX",          ["desarrollo-web"]),
    "tipografias":   ("recurso",     "par de fuentes",    ["desarrollo-web"]),
    "arquitecturas": ("tecnica",     "arquitectura",      ["programacion"]),
    "stacks":        ("herramienta", "stack",             ["programacion"]),
    "servicios":     ("herramienta", "servicio",          ["programacion"]),
    "skills":        ("herramienta", "skill",             ["ia-datos"]),
}
SUFIJO = {"servicios": "servicio", "skills": "skill", "estilos": "estilo", "landing": "patron", "negocios": "negocio",
          "soluciones": "tipo-de-web", "ux": "ux", "tipografias": "tipografia", "arquitecturas": "arquitectura", "stacks": "stack"}

# Estilos que no son estilos visuales (se resuelven con relaciones, sin borrar)
ESTILOS_ESTRUCTURA = {"hero-centric-design", "conversion-optimized", "feature-rich-showcase", "minimal-direct",
                      "social-proof-focused", "interactive-product-demo", "trust-authority", "storytelling-driven"}
ESTILOS_PANEL = {"data-dense-dashboard", "executive-dashboard", "real-time-monitoring", "drill-down-analytics",
                 "comparative-analysis-dashboard", "predictive-analytics", "user-behavior-analytics",
                 "financial-dashboard", "sales-intelligence-dashboard", "heat-map-heatmap-style"}
ESTILOS_VARIANTES = [("bento-box-grid", "bento-grids"), ("minimalism-swiss-style", "swiss-modernism-2-0"),
                     ("minimalism-swiss-style", "minimalist-monochrome"), ("brutalism", "neubrutalism")]
# estilo-estructura → patrón de landing equivalente probable (A CONFIRMAR por Darío)
ESTRUCTURA_A_LANDING = {"hero-centric-design": "hero-centric-design", "feature-rich-showcase": "feature-rich-showcase",   # mismo nombre
                        "trust-authority": "trust-authority-conversion", "storytelling-driven": "scroll-triggered-storytelling",
                        "interactive-product-demo": "product-demo-features", "minimal-direct": "minimal-single-column",   # probables
                        "conversion-optimized": "funnel-3-step-conversion", "social-proof-focused": "hero-testimonials-cta"}  # flojos

# Negocios ↔ rubros equivalentes probables (A CONFIRMAR por Darío)
NEGOCIO_RUBROS = {
    "restaurante": ["restaurant-food-service", "bakery-cafe", "brewery-winery"], "delivery": ["food-delivery-on-demand"],
    "inmobiliaria": ["real-estate-property"], "consultorio": ["medical-clinic", "dental-practice"],
    "estudio": ["legal-services"], "gimnasio": ["fitness-gym-app"], "estetica": ["beauty-spa-wellness-service"],
    "veterinaria": ["veterinary-clinic"], "tienda": ["e-commerce", "e-commerce-luxury"],
    "construccion": ["construction-architecture", "architecture-interior"],
    "turismo": ["hotel-hospitality", "travel-tourism-agency"],
    "educacion": ["online-course-e-learning", "educational-app"],
    "eventos": ["wedding-event-planning", "event-management", "photography-studio"],
    "hogar": ["home-services-plumber-electrician"], "profesional": ["portfolio-personal", "b2b-service"],
}

# ── Valor: lo que Darío dijo explícitamente (validado) ──
VALOR_DARIO = {("skills", "impeccable"): "imprescindible", ("skills", "ui-ux-pro-max"): "base", ("soluciones", "ecommerce"): "imprescindible"}

# ── Mapeo de campos del cuerpo → bloque del núcleo (por colección). Lo no listado va a "tecnico" ──
NUCLEO = {
    "estilos": {"Ideal para": "cuando_si", "Evitar en": "cuando_no", "Prompt para IA (en inglés)": "reutilizable.prompt"},
    "landing": {"Orden de secciones": "como", "Optimización de conversión": "aporta"},
    "tipografias": {"Ideal para": "cuando_si", "Fuente de títulos": "reutilizable.fuentes", "Fuente de texto": "reutilizable.fuentes", "Notas": "aporta"},
    "ux": {"Hacer": "como", "Evitar": "cuando_no"},
    "rubros": {"A tener en cuenta": "aporta"},
    "negocios": {"Qué web le vendés": "que_es", "Funcionalidades que venden": "aporta", "Cómo le trae clientes": "aporta", "Argumento de venta": "problema"},
    "soluciones": {"Cuándo conviene": "cuando_si", "Errores comunes": "cuando_no", "Funcionalidades clave": "aporta", "Secciones típicas": "como",
                   "A quién se lo vendés": "problema", "Ventaja": "aporta", "Clave de diseño": "como"},
    "arquitecturas": {"Cómo funciona": "que_es", "Ventajas": "aporta", "Desventajas": "cuando_no", "Cuándo usarla": "cuando_si"},
    "stacks": {"Ideal para": "cuando_si"},
    "servicios": {"Para qué": "que_es", "Por qué elegirlo": "aporta", "Ojo con": "cuando_no"},
    "skills": {"Qué hace": "que_es", "Cuándo usarla": "cuando_si"},
}
# Campos que afirman cosas sobre proyectos propios: se cotejan contra proyectos-verificables.md
CAMPOS_PROYECTO = {"Lo uso en", "Ejemplo propio"}
# Campos que se convierten en relaciones o evidencias candidatas
CAMPOS_RELACION = {"Tecnologías": "usa", "Combina con": "relacionada", "Alternativas": "relacionada", "Integración": "relacionada"}
# Campos obligatorios por colección (para detectar tipos mal asignados)
ESPERA = {"ux": ["code"], "tipografias": ["fonts"], "rubros": ["palette"], "skills": ["install"], "arquitecturas": ["flow"]}

# ── Temas: reglas explícitas con su fuente (palabra clave y campo) ──
TEMAS = {
    "accesibilidad": r"accesib|wcag|lector de pantalla|\baria\b",
    "rendimiento": r"rendimiento|lazy|caché|cache|peso de|carga de",
    "seguridad": r"seguridad|vulnerab|cifrad|autenticaci",
    "conversion": r"conversi[oó]n|\bcta\b|embudo",
    "identidad-marca": r"\bmarca\b|branding|identidad|\blogo",
    "automatizacion": r"automatiz|recordatorio|transaccional|webhook|flujo autom",
    "mercado-libre": r"mercado libre|mercadolibre|\bml\b",
    "e-commerce": r"e-?commerce|tienda|carrito|checkout|\bstock\b",
}
TEMA_POR_COLECCION = {"tipografias": ["identidad-marca"], "landing": ["conversion"]}


# Fichas de Estilos que se fusionan en el patrón de landing homónimo (mismo nombre, mismo contenido de fondo)
FUSIONAR_ESTILO_EN_LANDING = {"hero-centric-design", "feature-rich-showcase"}
# Servicios y stacks con una segunda área
DOS_AREAS = {("servicios", "tiendanube"): "desarrollo-web", ("servicios", "wordpress"): "desarrollo-web",
             ("servicios", "sanity"): "desarrollo-web", ("servicios", "claude-api"): "ia-datos",
             ("stacks", "tailwind"): "desarrollo-web", ("stacks", "shadcn"): "desarrollo-web"}
# Valor dicho por Darío + porqué (borrador de Claude, a revisar)
VALOR_PORQUE_DARIO = {
    ("skills", "impeccable"): "Vino a corregir justo lo que hace la IA por defecto: webs genéricas hechas con la misma receta. Hoy es lo que marca la diferencia.",
    ("skills", "ui-ux-pro-max"): "Lo usa todo el mundo y ya quedó genérico: no te diferencia.",
    ("soluciones", "ecommerce"): "Hoy un negocio que vende necesita su tienda online; sin ella se queda atrás.",
}

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def temas_de(col, e):
    """Devuelve [(tema, confianza, motivo)]. Confianza: alta (colección), media (nombre/resumen), baja (solo cuerpo)."""
    out = {}
    for t in TEMA_POR_COLECCION.get(col, []):
        out[t] = ("alta", f"colección {col}")
    cabeza = f"{e.get('name','')} {e.get('summary','')}".lower()
    cuerpo = " ".join(str(v) for _, v in e.get("fields", [])).lower()
    for t, rx in TEMAS.items():
        if t in out:
            continue
        m = re.search(rx, cabeza)
        if m:
            out[t] = ("media", f"'{m.group(0)}' en nombre/resumen")
        elif re.search(rx, cuerpo) and col in ("skills", "servicios", "negocios", "soluciones", "arquitecturas", "stacks", "landing"):
            m = re.search(rx, cuerpo)
            out[t] = ("baja", f"'{m.group(0)}' solo en el cuerpo")
    # tags de UX que ya son temas
    if col == "ux":
        tags = [x.lower() for x in e.get("tags", [])]
        if "accesibilidad" in tags: out["accesibilidad"] = ("alta", "tag Accesibilidad")
        if "rendimiento" in tags: out["rendimiento"] = ("alta", "tag Rendimiento")
    return [(t, c, m) for t, (c, m) in out.items()]


