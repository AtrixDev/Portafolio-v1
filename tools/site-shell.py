#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unifica el "cascarón" de todas las páginas: menú, botón de tema, script anti-parpadeo y pie.

- Páginas nuevas: se escriben con marcadores
    <!--HEAD title="…" desc="…" css="archivo.css" active="tracker"-->   y   <!--FOOTER-->
  y este script los reemplaza por el <head>, el menú y el pie completos.
- Páginas existentes: reemplaza el bloque entre <!-- NAV:start --> y <!-- NAV:end -->
  (o el <nav> + menú móvil viejo la primera vez).

Uso:  python3 tools/site-shell.py
Para agregar una sección al menú, editá NAV_ITEMS y volvé a correrlo.
"""
import re
from pathlib import Path

FRONT = Path(__file__).resolve().parent.parent / "frontend"

NAV_ITEMS = [  # (id, texto, href)
    ("cv", "CV", "index.html"),
    ("herramientas", "Herramientas", "herramientas.html"),
    ("lab", "Lab ML", "lab.html"),
    ("sistema", "Sistema", "sistema.html"),
    ("programacion", "Base de datos", "programacion.html"),
    ("web", "Revisá tu web", "web.html"),
    ("contacto", "Contacto", "contacto.html"),
]

ACTIVE_BY_PAGE = {
    "index.html": "cv", "programacion.html": "programacion", "contacto.html": "contacto", "armar.html": "armar",
    "lab.html": "lab", "acos.html": "lab", "anatomia.html": "lab", "excels.html": "lab", "imagenes.html": "lab",
    "metricas.html": "lab", "pricing.html": "lab", "reputacion.html": "lab", "seo.html": "lab", "sistema.html": "sistema", "herramientas.html": "herramientas",
}

THEME_SCRIPT = ("<script>try{var t=localStorage.getItem('dc-theme');if(t)document.documentElement.dataset.theme=t}"
                "catch(e){}document.documentElement.classList.add('js')</script>")

FONTS = ('  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Geist:wght@400..700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">')

FAVICON = ('<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'>'
           '<rect width=\'32\' height=\'32\' rx=\'8\' fill=\'%23ffe14a\'/><text x=\'50%25\' y=\'54%25\' dominant-baseline=\'central\' '
           'text-anchor=\'middle\' font-family=\'monospace\' font-weight=\'bold\' font-size=\'14\' fill=\'%23141207\'>DC</text></svg>">')

def nav(active):
    def link(i, text, href, mobile=False):
        cur = ' aria-current="page"' if i == active else ""
        cls = []
        if i == active: cls.append("active")
        if i == "contacto" and not mobile: cls.append("nav-cta")
        c = f' class="{" ".join(cls)}"' if cls else ""
        return f'<a href="{href}"{c}{cur}>{text}</a>'
    items = "\n".join(f"    <li>{link(*it)}</li>" for it in NAV_ITEMS)
    mobile = "\n".join(f"  {link(*it, mobile=True)}" for it in NAV_ITEMS)
    return f'''<!-- NAV:start -->
<a href="#contenido" class="skip-link">Saltar al contenido</a>
<nav id="site-nav" aria-label="Principal">
  <a href="index.html" class="nav-logo" aria-label="Darío Colángelo, inicio"><span class="nav-mark" aria-hidden="true">DC</span><span class="nav-name">Darío Colángelo</span></a>
  <ul class="nav-links">
{items}
  </ul>
  <div class="nav-actions">
    <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Cambiar tema">
      <svg class="icon icon-sun" aria-hidden="true"><use href="assets/icons.svg#i-sun"/></svg>
      <svg class="icon icon-moon" aria-hidden="true"><use href="assets/icons.svg#i-moon"/></svg>
    </button>
    <button class="hamburger" id="hamburger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobileMenu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu" aria-label="Menú">
{mobile}
</div>
<!-- NAV:end -->'''

FOOTER = '''<footer>
  <p class="footer-name">Darío Colángelo<span>.</span></p>
  <ul class="footer-links">
    <li><a href="assets/Dario-Colangelo-CV.pdf" download><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-download"/></svg>CV en PDF</a></li>
    <li><a href="https://www.linkedin.com/in/dariocolangelo/" target="_blank" rel="noopener">LinkedIn</a></li>
    <li><a href="https://wa.me/541144474507" target="_blank" rel="noopener">WhatsApp</a></li>
    <li><a href="mailto:daricolangelo@gmail.com">daricolangelo@gmail.com</a></li>
  </ul>
  <div class="footer-note">
    <span>Analista de E-Commerce · CABA, Argentina</span>
    <a href="#contenido" class="footer-top"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-arrow-up"/></svg>Volver arriba</a>
  </div>
</footer>'''

def head(title, desc, css, active):
    extra = "".join(f'\n  <link rel="stylesheet" href="css/{c.strip()}">' for c in css.split(",") if c.strip())
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="author" content="Darío Colángelo">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#0b0b0c" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#efefec" media="(prefers-color-scheme: light)">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:locale" content="es_AR">
  {FAVICON}
{FONTS}
  {THEME_SCRIPT}
  <link rel="stylesheet" href="css/root.css">
  <link rel="stylesheet" href="css/shared.css">{extra}
  <link rel="stylesheet" href="css/surfaces.css">
</head>
<body>

{nav(active)}
'''

OLD_NAV = re.compile(r'(?:<a href="#contenido" class="skip-link">[^<]*</a>\s*)?(?:<!-- NAV -->\s*)?<nav\b.*?</nav>\s*<div class="mobile-menu"[^>]*>.*?</div>', re.S)
NAV_BLOCK = re.compile(r"<!-- NAV:start -->.*?<!-- NAV:end -->", re.S)
HEAD_MARK = re.compile(r'<!--HEAD title="([^"]*)" desc="([^"]*)" css="([^"]*)" active="([^"]*)"-->')

def process(path):
    s = path.read_text(encoding="utf-8")
    orig = s
    m = HEAD_MARK.search(s)
    if m:
        s = HEAD_MARK.sub(lambda m: head(*m.groups()), s, count=1)
    active = ACTIVE_BY_PAGE.get(path.name, "")
    if NAV_BLOCK.search(s):
        s = NAV_BLOCK.sub(lambda _: nav(active), s, count=1)
    elif OLD_NAV.search(s):
        s = OLD_NAV.sub(lambda _: nav(active), s, count=1)
    s = s.replace("<!--FOOTER-->", FOOTER)
    s = re.sub(r"<footer>.*?</footer>", lambda _: FOOTER, s, count=1, flags=re.S)
    s = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet"\s*/?>', lambda _: FONTS.strip().splitlines()[-1].strip(), s, count=1)
    s = re.sub(r'<link rel="icon" type="image/svg\+xml" href="data:image/svg\+xml,.*?</svg>">', lambda _: FAVICON, s, count=1, flags=re.S)
    s = re.sub(r'<meta name="theme-color" content="#0a0a0b"', '<meta name="theme-color" content="#0b0b0c"', s)
    s = re.sub(r'<meta name="theme-color" content="#fafafa"', '<meta name="theme-color" content="#efefec"', s)
    # Script anti-parpadeo del tema (antes de la primera hoja de estilos)
    if THEME_SCRIPT not in s:
        s = s.replace("<script>document.documentElement.classList.add('js');</script>\n", "")
        s = re.sub(r'(\s*)(<link rel="stylesheet" href="css/root\.css"\s*/?>)', lambda m: f"{m.group(1)}{THEME_SCRIPT}{m.group(1)}{m.group(2)}", s, count=1)
    # Capa visual común: siempre la última hoja de estilos
    if 'css/surfaces.css' not in s:
        s = s.replace("</head>", '  <link rel="stylesheet" href="css/surfaces.css">\n</head>', 1)
    # theme-color fijo viejo → claro/oscuro
    s = s.replace('<meta name="theme-color" content="#060810">',
                  '<meta name="theme-color" content="#0a0a0b" media="(prefers-color-scheme: dark)">\n  <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)">')
    # Las subpáginas del Lab no tienen <main id="contenido">: el primer bloque de contenido recibe el ancla
    if 'id="contenido"' not in s:
        s = re.sub(r'<(section|div) class="(ph|lab-hero)"', r'<\1 id="contenido" class="\2"', s, count=1)
    if s != orig:
        path.write_text(s, encoding="utf-8")
        return True
    return False

if __name__ == "__main__":
    for p in sorted(FRONT.glob("*.html")):
        if p.name in ("admin.html", "ia.html"):   # el panel y la redirección vieja no llevan menú
            continue
        print(("✓ " if process(p) else "· ") + p.name)
