#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valor PROVISIONAL (propuesta de Claude, 01/10) del resto de las colecciones, con el criterio de Darío:
Imprescindible = hoy hay que tenerlo y marca diferencia · Pro = lo que permite construir a medida / especialización · Base = ya armado, muy conocido o de nicho.
Nada de esto está validado por Darío."""
ORIGEN = "propuesta de Claude con el criterio de Darío (sin validar)"

ES_IMP = {"accessible-ethical", "inclusive-design"}
ES_PRO = {"glassmorphism", "liquid-glass", "motion-driven", "micro-interactions", "kinetic-typography", "parallax-storytelling", "3d-hyperrealism",
          "3d-product-preview", "ai-native-ui", "bento-box-grid", "bento-grids", "soft-ui-evolution", "swiss-modernism-2-0", "editorial-grid-magazine",
          "exaggerated-minimalism", "neubrutalism", "aurora-ui", "gradient-mesh-aurora-evolved", "dimensional-layering", "interactive-cursor-design",
          "dark-mode-oled", "minimalism-swiss-style",
          "conversion-optimized", "social-proof-focused", "trust-authority", "interactive-product-demo",
          "data-dense-dashboard", "executive-dashboard", "financial-dashboard", "sales-intelligence-dashboard", "user-behavior-analytics"}
LP_IMP = {"hero-features-cta", "hero-testimonials-cta", "trust-authority-conversion"}
LP_PRO = {"funnel-3-step-conversion", "lead-magnet-form", "before-after-transformation", "product-demo-features", "scroll-triggered-storytelling",
          "interactive-3d-configurator", "bento-grid-showcase", "horizontal-scroll-journey", "immersive-interactive-experience", "ai-personalization-landing",
          "portfolio-grid", "product-review-ratings-focused", "hero-centric-design"}
TP_PRO = {"classic-elegant", "luxury-serif", "luxury-minimalist", "fashion-forward", "bold-statement", "tech-startup", "premium-sans", "geometric-modern",
          "minimalist-portfolio", "accessibility-first", "corporate-trust"}
SOL_IMP = {"landing", "institucional"}            # ecommerce ya está validado por Darío
SOL_PRO = {"reservas", "catalogo", "saas", "dashboard", "interna", "pwa"}
AR_PRO = {"serverless", "spa-api", "hibrida", "ssr", "headless-cms", "jamstack"}

PORQUE = {
 "estilos": {"imprescindible": "La accesibilidad hoy hay que cuidarla y casi nadie la trabaja bien: marca diferencia.",
             "pro": "Requiere criterio y trabajo a medida para ejecutarse bien: separa un trabajo cuidado de uno de plantilla.",
             "base": "Es un estilo de nicho o decorativo: sirve cuando la marca lo pide, pero no te diferencia."},
 "landing": {"imprescindible": "Es la estructura que sostiene casi cualquier landing que vende.",
             "pro": "Es una estructura a medida que requiere diseñar y construir: te separa de la plantilla.",
             "base": "Es un patrón conocido o de uso puntual."},
 "tipografias": {"pro": "Combinación con carácter que ayuda a definir una identidad a medida.",
                 "base": "Combinación correcta y muy usada: sirve, pero no te diferencia."},
 "soluciones": {"imprescindible": "Es lo que más pide un negocio: sin esto no hay presencia online.",
                "pro": "Requiere construir a medida: un trabajo de más valor.",
                "base": "Es un tipo de web conocido, que muchas herramientas ya resuelven."},
 "arquitecturas": {"pro": "Entenderla permite construir a medida con criterio.",
                   "base": "Es un enfoque conocido, o que resuelve una herramienta ya armada."},
 "ux": {"imprescindible": "Casi nadie cuida la accesibilidad y hoy marca diferencia, además de ser una obligación.",
        "pro": "Es una buena práctica que requiere trabajo a medida y que muchos sitios no cuidan.",
        "base": "Es una buena práctica básica que cualquiera debería cumplir."},
}

def valor_resto(col, e):
    """Devuelve (valor, porque) o None."""
    i = e["id"]
    if col == "estilos": v = "imprescindible" if i in ES_IMP else "pro" if i in ES_PRO else "base"
    elif col == "landing": v = "imprescindible" if i in LP_IMP else "pro" if i in LP_PRO else "base"
    elif col == "tipografias": v = "pro" if i in TP_PRO else "base"
    elif col == "soluciones":
        if i == "ecommerce": return None
        v = "imprescindible" if i in SOL_IMP else "pro" if i in SOL_PRO else "base"
    elif col == "arquitecturas": v = "pro" if i in AR_PRO else "base"
    elif col == "ux":
        tags = " ".join(e.get("tags", []))
        alta = "Severidad alta" in tags
        if "Accesibilidad" in tags: v = "imprescindible" if alta else "pro"
        elif any(t in tags for t in ("Rendimiento", "Animación", "Interacción con IA", "Sustentabilidad")): v = "pro"
        else: v = "base"
    else: return None
    return v, PORQUE[col][v]
