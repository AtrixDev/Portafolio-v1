#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera los datos del Lab de Programación (frontend/data/weblab/).

  - Categorías curadas en castellano: tools/weblab_curado.py
  - Bibliotecas importadas de la skill ui-ux-pro-max (en inglés):
      estilos, patrones de landing, tipografías, paletas, rubros y guías UX.
    Se traducen al castellano rioplatense con tools/weblab_traducciones.json
    (inglés → castellano). Lo que no está en el diccionario queda en inglés:
    al final se informa cuántos textos faltan traducir.

Uso:  python3 tools/build-weblab.py [ruta/a/ui-ux-pro-max/data]
"""
import csv, json, os, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT  = ROOT / "frontend" / "data" / "weblab"
SRC  = Path(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/.claude/skills/ui-ux-pro-max/data"))
sys.path.insert(0, str(Path(__file__).parent))
import weblab_curado as C
import weblab_skills as SK
import weblab_negocios as NG
import weblab_correcciones as CR
import weblab_niveles as NV

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]

def rows(name):
    with open(SRC / name, encoding="utf-8") as f:
        return list(csv.DictReader(f))

def clean(v):
    return (v or "").strip()

def fields(row, mapping):
    return [[label, clean(row.get(col))] for col, label in mapping if clean(row.get(col))]

HEX = re.compile(r"#[0-9A-Fa-f]{6}\b")

CATS = [
  ("negocios",     "Negocios para vender", "Vender",  "briefcase", "Rubros de Argentina a los que les podés vender una web: qué necesitan, qué funcionalidades les generan ventas y cómo venderlo. Cada uno se puede abrir en el constructor.", "curado"),
  # id, nombre, grupo, ícono, descripción, origen
  ("soluciones",   "Tipos de web",        "Construir", "puzzle",  "Qué tipo de sitio necesita cada proyecto, qué secciones lleva y qué conviene usar.", "curado"),
  ("arquitecturas","Arquitecturas",       "Construir", "layers",  "Cómo se organiza una web por dentro: estático, SPA, SSR, serverless, BaaS…", "curado"),
  ("stacks",       "Stacks y frameworks", "Construir", "code",    "Lenguajes, frameworks y librerías: qué son y para qué sirven.", "curado"),
  ("servicios",    "Servicios",           "Construir", "cloud",   "Hosting, bases de datos, auth, email, pagos, analítica, IA.", "curado"),
  ("rubros",       "Rubros",              "Diseñar",   "target",  "Qué estilo, paleta y patrón de landing conviene según el tipo de producto.", "ui-ux-pro-max"),
  ("estilos",      "Estilos de diseño",   "Diseñar",   "sparkles","Minimalismo, glassmorphism, brutalismo, bento… con colores, efectos y checklist.", "ui-ux-pro-max"),
  ("landing",      "Patrones de landing", "Diseñar",   "layout",  "Estructuras de página probadas: orden de secciones, CTA y conversión.", "ui-ux-pro-max"),
  ("tipografias",  "Tipografías",         "Diseñar",   "type",    "Combinaciones de fuentes de Google Fonts con vista previa en vivo.", "ui-ux-pro-max"),
  ("paletas",      "Paletas de color",    "Diseñar",   "palette", "Paletas completas (primario, acento, fondo, texto) por tipo de producto.", "ui-ux-pro-max"),
  ("ux",           "Buenas prácticas UX", "Revisar",   "check",   "Qué hacer y qué evitar, con ejemplos de código y severidad.", "ui-ux-pro-max"),
  ("skills",       "Skills de Claude",    "Con IA",    "flask",   "Las skills más usadas para potenciar a Claude: qué hacen, cómo se instalan y un prompt de ejemplo para probarlas.", "curado"),
]

def curated(cat, items):
    out = []
    for it in items:
        e = dict(it); e["cat"] = cat; out.append(e)
    return out

# ── Traducción ────────────────────────────────────────────────
TR = json.loads((Path(__file__).parent / "weblab_traducciones.json").read_text(encoding="utf-8"))
# Campos técnicos que quedan como están (CSS, fuentes, prompts para IA)
NO_TRADUCIR = {"Variables CSS", "CSS técnico", "Import CSS", "Config Tailwind", "Fuente de títulos", "Fuente de texto", "Prompt para IA"}
PALETA = {"Primary": "Primario", "Secondary": "Secundario", "Accent": "Acento", "Background": "Fondo", "Foreground": "Texto",
          "Card": "Tarjeta", "Muted": "Apagado", "Border": "Borde", "Destructive": "Destructivo", "Ring": "Foco"}
SEVERIDAD = {"critical": "crítica", "high": "alta", "medium": "media", "low": "baja"}
faltan = set()

def t(s):
    if not s or not re.search(r"[A-Za-z]{2}", s): return s
    if s in TR: return TR[s]
    if not re.match(r"^(Complejidad|Modo |Rendimiento excelente|WCAG|Severidad )", s) and not HEX.fullmatch(s.strip()):
        faltan.add(s)
    return s

def traducir(data):
    for cat in ("estilos", "landing", "tipografias", "ux", "paletas", "rubros"):
        for e in data[cat]:
            e["name"] = t(e["name"])
            e["summary"] = t(e.get("summary", ""))
            e["tags"] = [SEVERIDAD.get(x[10:], x[10:]).join(["Severidad ", ""]) if x.startswith("Severidad ") else t(x) for x in e.get("tags", []) if len(x) > 1]
            if "palette" in e:
                e["palette"] = [[PALETA.get(n, n), h] for n, h in e["palette"]]
                e["fields"] = [[PALETA.get(k, k), v] for k, v in e["fields"]]
            else:
                e["fields"] = [[k, v if k in NO_TRADUCIR else t(v)] for k, v in e.get("fields", [])]

def build():
    data = {
      "soluciones":    curated("soluciones", C.SOLUCIONES),
      "arquitecturas": curated("arquitecturas", C.ARQUITECTURAS),
      "servicios":     curated("servicios", C.SERVICIOS),
      "stacks":        curated("stacks", C.STACKS),
      "skills":        curated("skills", SK.SKILLS),
      "negocios":      curated("negocios", NG.NEGOCIOS),
    }
    for e in data["soluciones"]:
        if e["id"] in NG.EJEMPLOS_AR: e["examples"] = NG.EJEMPLOS_AR[e["id"]]
        if e["id"] in NG.VENDER: e["fields"].insert(0, ["A quién se lo vendés", NG.VENDER[e["id"]]])
    for e in data["arquitecturas"]:
        if e["id"] in C.FLUJOS: e["flow"] = C.FLUJOS[e["id"]]

    # Estilos
    est = []
    for r in rows("styles.csv"):
        name = clean(r["Style Category"])
        sw = []
        for col in ("Primary Colors", "Secondary Colors"):
            sw += [h.upper() for h in HEX.findall(r.get(col, ""))]
        cx = {"low": "baja", "medium": "media", "high": "alta"}.get(clean(r.get("Complexity")).lower(), clean(r.get("Complexity")).lower())
        tags = [clean(r["Type"]), "Complejidad " + cx]
        if "Full" in r.get("Dark Mode ✓", ""): tags.append("Modo oscuro")
        if "Full" in r.get("Light Mode ✓", ""): tags.append("Modo claro")
        if "Excellent" in r.get("Performance", ""): tags.append("Rendimiento excelente")
        if "AAA" in r.get("Accessibility", ""): tags.append("WCAG AAA")
        est.append(dict(id=slug(name), cat="estilos", name=name, summary=clean(r["Best For"]),
          tags=[t for t in tags if t.strip()], swatches=list(dict.fromkeys(sw))[:8],
          fields=fields(r, [("Keywords","Palabras clave"),("Primary Colors","Colores principales"),("Secondary Colors","Colores secundarios"),
            ("Effects & Animation","Efectos y animación"),("Best For","Ideal para"),("Do Not Use For","Evitar en"),("Light Mode ✓","Modo claro"),
            ("Dark Mode ✓","Modo oscuro"),("Performance","Rendimiento"),("Accessibility","Accesibilidad"),("Mobile-Friendly","Mobile"),
            ("Conversion-Focused","Foco en conversión"),("Framework Compatibility","Frameworks"),("Era/Origin","Origen"),("Complexity","Complejidad"),
            ("Design System Variables","Variables CSS"),("CSS/Technical Keywords","CSS técnico"),("Implementation Checklist","Checklist"),
            ("AI Prompt Keywords","Prompt para IA")])))
    data["estilos"] = est
    style_ids = {e["name"].lower(): e["id"] for e in est}

    # Landing
    lan = []
    for r in rows("landing.csv"):
        name = clean(r["Pattern Name"])
        lan.append(dict(id=slug(name), cat="landing", name=name, summary=clean(r["Section Order"]),
          tags=[t.strip() for t in clean(r["Keywords"]).split(",")[:3] if t.strip()],
          fields=fields(r, [("Section Order","Orden de secciones"),("Primary CTA Placement","Ubicación del CTA"),("Color Strategy","Estrategia de color"),
            ("Recommended Effects","Efectos recomendados"),("Conversion Optimization","Optimización de conversión"),("Keywords","Palabras clave")])))
    data["landing"] = lan
    landing_ids = {e["name"].lower(): e["id"] for e in lan}

    # Tipografías
    tip = []
    for r in rows("typography.csv"):
        name = clean(r["Font Pairing Name"])
        tip.append(dict(id=slug(name), cat="tipografias", name=name, summary=clean(r["Mood/Style Keywords"]),
          tags=[clean(r["Category"])], fonts=dict(heading=clean(r["Heading Font"]), body=clean(r["Body Font"]), url=clean(r["Google Fonts URL"])),
          fields=fields(r, [("Heading Font","Fuente de títulos"),("Body Font","Fuente de texto"),("Mood/Style Keywords","Carácter"),("Best For","Ideal para"),
            ("CSS Import","Import CSS"),("Tailwind Config","Config Tailwind"),("Notes","Notas")])))
    data["tipografias"] = tip

    # Paletas
    pal = []
    COLS = ["Primary","Secondary","Accent","Background","Foreground","Card","Muted","Border","Destructive","Ring"]
    for r in rows("colors.csv"):
        name = clean(r["Product Type"])
        sw = [[c, clean(r.get(c)).upper()] for c in COLS if HEX.fullmatch(clean(r.get(c)) or "")]
        pal.append(dict(id=slug(name), cat="paletas", name=name, summary=clean(r.get("Notes")),
          tags=[], palette=sw, fields=[[c, v] for c, v in sw]))
    data["paletas"] = pal
    pal_ids = {e["name"].lower(): e["id"] for e in pal}

    # Rubros (enlaza estilos, landing y paleta)
    rub = []
    for r in rows("products.csv"):
        name = clean(r["Product Type"])
        rel = []
        for part in re.split(r"\s*\+\s*|,\s*", clean(r["Primary Style Recommendation"]) + "," + clean(r["Secondary Styles"])):
            sid = style_ids.get(part.lower().strip())
            if sid: rel.append(f"estilos/{sid}")
        lid = landing_ids.get(clean(r["Landing Page Pattern"]).lower())
        if lid: rel.append(f"landing/{lid}")
        if name.lower() in pal_ids: rel.append(f"paletas/{pal_ids[name.lower()]}")
        rub.append(dict(id=slug(name), cat="rubros", name=name, summary=clean(r["Key Considerations"]),
          tags=[t.strip() for t in clean(r["Keywords"]).split(",")[:3] if t.strip()], related=list(dict.fromkeys(rel)),
          fields=fields(r, [("Primary Style Recommendation","Estilo recomendado"),("Secondary Styles","Estilos alternativos"),
            ("Landing Page Pattern","Patrón de landing"),("Dashboard Style (if applicable)","Estilo de dashboard"),
            ("Color Palette Focus","Enfoque de color"),("Key Considerations","A tener en cuenta"),("Keywords","Palabras clave")])))
    data["rubros"] = rub

    # UX
    ux = []
    for r in rows("ux-guidelines.csv"):
        name = clean(r["Issue"])
        ux.append(dict(id=slug(f'{r["No"]}-{name}'), cat="ux", name=name, summary=clean(r["Description"]),
          tags=[clean(r["Category"]), "Severidad " + clean(r["Severity"]).lower()],
          code=dict(good=clean(r.get("Code Example Good")), bad=clean(r.get("Code Example Bad"))),
          fields=fields(r, [("Do","Hacer"),("Don't","Evitar"),("Platform","Plataforma"),("Severity","Severidad")])))
    data["ux"] = ux

    traducir(data)
    CR.aplicar(data)   # correcciones de contenido (ver tools/weblab_correcciones.py)
    NV.aplicar(data)   # dificultad y valor de cada ficha (ver tools/weblab_niveles.py)

    # Unicidad de ids por categoría
    for cat, items in data.items():
        seen = {}
        for e in items:
            base = e["id"]; n = seen.get(base, 0)
            if n: e["id"] = f"{base}-{n+1}"
            seen[base] = n + 1

    OUT.mkdir(parents=True, exist_ok=True)
    index = {"categories": [], "entries": []}
    for cid, name, group, icon, desc, origin in CATS:
        items = data[cid]
        (OUT / f"{cid}.json").write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        index["categories"].append(dict(id=cid, name=name, group=group, icon=icon, desc=desc, origin=origin, count=len(items)))
        for e in items:
            index["entries"].append([cid, e["id"], e["name"], e.get("summary", "")[:160], e.get("tags", []), e.get("nivel", 0), e.get("valor", "")])
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    total = sum(c["count"] for c in index["categories"])
    size = sum(f.stat().st_size for f in OUT.glob("*.json")) // 1024
    print(f"{total} entradas en {len(CATS)} categorías · {size} KB → {OUT}")
    if faltan:
        print(f"Atención: {len(faltan)} textos sin traducir (agregalos a tools/weblab_traducciones.json):")
        for s in sorted(faltan)[:20]: print("  ·", s[:90])

if __name__ == "__main__":
    build()
