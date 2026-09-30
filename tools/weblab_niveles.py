#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Niveles del Lab de Programación: cada ficha lleva dos datos para ordenar y filtrar.

  nivel (dificultad)  1 Inicial       se aplica en minutos, sin experiencia previa
                      2 Intermedio    necesita práctica o combinar varias piezas
                      3 Avanzado      requiere experiencia técnica o mucho criterio

  valor               "base"            conviene conocerlo: lo vas a cruzar seguido
                      "imprescindible"  sin esto una web queda floja o falla: no lo saltees
                      "pro"             lo que separa un trabajo profesional del resto

Categorías chicas (skills, stacks, servicios, arquitecturas, tipos de web, negocios): valores curados
a mano, uno por ficha. Categorías grandes importadas de ui-ux-pro-max (ux, estilos, tipografías,
landing, rubros, paletas): reglas a partir de sus propios datos (severidad, complejidad, secciones,
familia del rubro), con excepciones curadas en OVERRIDE.

  - build-weblab.py lo aplica al final del armado.
  - Solo:  python3 tools/weblab_niveles.py   (escribe nivel/valor en los JSON y en index.json)
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "data" / "weblab"
B, I, P = "base", "imprescindible", "pro"

# ── Curados a mano: id → (nivel, valor) ──
CURADO = {
  "skills": {
    "frontend-design": (1, I), "skill-creator": (2, P), "xlsx": (1, I), "docx": (1, B), "pptx": (1, B),
    "pdf": (1, B), "webapp-testing": (2, P), "mcp-builder": (3, P), "claude-api": (3, P),
    "web-artifacts-builder": (2, B), "canvas-design": (1, B), "algorithmic-art": (2, B),
    "theme-factory": (1, B), "brand-guidelines": (1, B), "internal-comms": (1, B), "doc-coauthoring": (1, B),
    "slack-gif-creator": (1, B), "superpowers": (2, P), "impeccable": (2, P), "ui-ux-pro-max": (1, I),
    "web-design-guidelines": (1, I), "react-best-practices": (3, P), "trailofbits": (3, P),
    "remotion": (3, P), "grill-me": (1, I), "claude-ads": (2, P), "ad-creative": (1, P),
    "copywriting": (1, I), "marketing-psychology": (1, B), "image": (1, I), "video": (2, P),
  },
  "stacks": {
    "vanilla": (1, I), "react-vite": (2, I), "nextjs": (3, P), "astro": (2, P), "vue": (2, B),
    "sveltekit": (3, B), "node-express": (2, I), "mern": (3, B), "tailwind": (1, I), "shadcn": (2, P),
  },
  "servicios": {
    "vercel": (1, I), "netlify": (1, B), "cloudflare-pages": (1, B), "github-pages": (1, B),
    "railway": (2, B), "render": (2, B), "mongodb-atlas": (2, I), "supabase": (2, P), "firebase": (2, B),
    "clerk": (2, P), "resend": (2, P), "formspree": (1, I), "mercadopago": (2, I), "stripe": (2, B),
    "tiendanube": (1, I), "wordpress": (1, B), "sanity": (2, P), "ga4": (1, I), "plausible": (1, B),
    "clarity": (1, P), "cloudinary": (2, B), "claude-api": (3, P), "groq": (3, B), "sentry": (2, P),
    "nic-ar": (1, I),
  },
  "arquitecturas": {
    "estatico": (1, I), "jamstack": (2, B), "spa-api": (2, I), "ssr": (3, B), "hibrida": (3, P),
    "serverless": (2, I), "monolito": (2, B), "baas": (2, P), "headless-cms": (2, P),
    "ecommerce-saas": (1, I), "microservicios": (3, B),
  },
  "soluciones": {
    "landing": (1, I), "institucional": (1, I), "portfolio": (1, I), "ecommerce": (3, I),
    "catalogo": (1, I), "blog": (2, B), "saas": (3, P), "dashboard": (3, P), "reservas": (2, I),
    "marketplace": (3, B), "interna": (2, P), "docs": (2, B), "pwa": (2, P),
  },
  # Patrones de landing: por lo que exige armarlos y lo que aportan a la conversión
  "landing": {
    "hero-features-cta": (1, I), "hero-testimonials-cta": (1, I), "product-demo-features": (2, P),
    "minimal-single-column": (1, B), "funnel-3-step-conversion": (2, I), "comparison-table-cta": (2, B),
    "lead-magnet-form": (1, I), "pricing-page-cta": (2, I), "video-first-hero": (2, B),
    "scroll-triggered-storytelling": (3, P), "ai-personalization-landing": (3, P), "waitlist-coming-soon": (1, B),
    "comparison-table-focus": (2, B), "pricing-focused-landing": (2, B), "app-store-style-landing": (1, B),
    "faq-documentation-landing": (1, B), "immersive-interactive-experience": (3, P), "event-conference-landing": (2, B),
    "product-review-ratings-focused": (1, I), "community-forum-landing": (2, B), "before-after-transformation": (1, I),
    "marketplace-directory": (3, B), "newsletter-content-first": (1, B), "webinar-registration": (1, B),
    "enterprise-gateway": (2, B), "portfolio-grid": (1, I), "horizontal-scroll-journey": (3, P),
    "bento-grid-showcase": (2, P), "interactive-3d-configurator": (3, P), "ai-driven-dynamic-landing": (3, B),
    "feature-rich-showcase": (2, B), "hero-centric-design": (1, B), "trust-authority-conversion": (1, I),
    "real-time-operations-landing": (3, B),
  },
  "negocios": {
    "restaurante": (1, I), "delivery": (2, I), "inmobiliaria": (2, I), "consultorio": (2, I),
    "estudio": (1, B), "gimnasio": (1, B), "estetica": (1, I), "veterinaria": (2, B), "tienda": (2, I),
    "comercio": (1, I), "construccion": (1, B), "turismo": (2, B), "educacion": (2, P), "eventos": (1, B),
    "hogar": (1, B), "profesional": (1, I),
  },
}

# Excepciones a las reglas: (categoría, id) → (nivel, valor)
OVERRIDE = {
  # Estilos que hoy usa medio mundo y conviene dominar
  ("estilos", "minimalism-swiss-style"): (1, I), ("estilos", "flat-design"): (1, I),
  ("estilos", "bento-box-grid"): (2, I), ("estilos", "dark-mode-oled"): (2, I),
  ("estilos", "accessible-ethical"): (1, I),
  # Tipografías versátiles: el punto de partida de casi cualquier proyecto
  ("tipografias", "classic-elegant"): (1, I), ("tipografias", "modern-professional"): (1, I),
  ("tipografias", "minimal-swiss"): (1, I), ("tipografias", "tech-startup"): (1, I),
}

# ── Reglas por categoría ──
def ux(e):
    tags = set(e.get("tags", []))
    avanz = {"UI espacial", "Interacción con IA", "Sustentabilidad", "Carga de datos"}
    medio = {"Animación", "Rendimiento", "Responsive", "Búsqueda"}
    nivel = 3 if tags & avanz else 2 if tags & medio else 1
    if "Severidad alta" in tags: valor = I
    elif tags & (avanz | {"Animación", "Rendimiento"}): valor = P
    else: valor = B
    return nivel, valor

def estilos(e):
    tags = set(e.get("tags", []))
    nivel = 3 if "Complejidad alta" in tags else 1 if "Complejidad baja" in tags else 2
    if nivel == 3: valor = P
    elif "General" in tags and "Rendimiento excelente" in tags: valor = I
    else: valor = B
    return nivel, valor

def tipografias(e):
    t = (e.get("tags") or [""])[0].lower()
    nivel = 1 if t in ("sans + sans", "serif + sans") else 2
    valor = P if t.startswith(("display", "script", "mono")) else B
    return nivel, valor

def familias_rubros():
    """Familia de cada rubro, leída de programacion-rubros.js (la misma que usa la vista previa)."""
    js = (ROOT / "frontend" / "js" / "programacion-rubros.js").read_text(encoding="utf-8")
    return dict(re.findall(r"'([a-z0-9-]+)':\s*\['([a-z]+)'", js))

FAM_NIVEL = {"tienda": 3, "panel": 3, "finanzas": 3, "aviso": 3, "movilidad": 3, "tramite": 2,
             "turno": 2, "viaje": 2, "curso": 2, "comunidad": 2, "juego": 3, "media": 2, "ciencia": 2}
# Rubros donde más webs se venden en Argentina (comercio chico y servicios) → imprescindibles;
# productos de software y finanzas → pro
FAM_VALOR = {"carta": I, "turno": I, "tienda": I, "estudio": I, "aviso": I, "viaje": I, "dona": I,
             "panel": P, "finanzas": P, "herramienta": P}

def rubro(e, fam):
    f = fam.get(e["id"], "negocio")
    return FAM_NIVEL.get(f, 1), FAM_VALOR.get(f, B)

def paleta(e, fam):
    return 1, FAM_VALOR.get(fam.get(e["id"], "negocio"), B)


def clasificar(cat, e, fam):
    if (cat, e["id"]) in OVERRIDE: return OVERRIDE[(cat, e["id"])]
    if cat in CURADO: return CURADO[cat].get(e["id"])
    if cat == "ux": return ux(e)
    if cat == "estilos": return estilos(e)
    if cat == "tipografias": return tipografias(e)
    if cat == "rubros": return rubro(e, fam)
    if cat == "paletas": return paleta(e, fam)
    return None


def aplicar(data, avisar=print):
    """Escribe nivel y valor en cada ficha de {categoría: [fichas]}. Devuelve cuántas quedaron sin clasificar."""
    fam = familias_rubros()
    faltan = 0
    for cat, fichas in data.items():
        for e in fichas:
            nv = clasificar(cat, e, fam)
            if not nv:
                faltan += 1; avisar(f"  · sin nivel: {cat}/{e['id']}"); continue
            e["nivel"], e["valor"] = nv
    return faltan


if __name__ == "__main__":
    idx = json.loads((OUT / "index.json").read_text(encoding="utf-8"))
    cats = [c["id"] for c in idx["categories"]]
    data = {c: json.loads((OUT / f"{c}.json").read_text(encoding="utf-8")) for c in cats}
    faltan = aplicar(data)
    for c in cats:
        (OUT / f"{c}.json").write_text(json.dumps(data[c], ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    # index.json: [cat, id, nombre, resumen, etiquetas, nivel, valor]
    por = {(c, e["id"]): e for c in cats for e in data[c]}
    for fila in idx["entries"]:
        e = por.get((fila[0], fila[1]))
        del fila[5:]
        fila += [e.get("nivel", 0), e.get("valor", "")] if e else [0, ""]
    (OUT / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    from collections import Counter
    for c in cats:
        cv = Counter(e.get("valor") for e in data[c]); cn = Counter(e.get("nivel") for e in data[c])
        print(f"{c:14} valor {dict(cv)}  nivel {dict(sorted(cn.items()))}", file=sys.stderr)
    print(f"Listo. Sin clasificar: {faltan}.", file=sys.stderr)
