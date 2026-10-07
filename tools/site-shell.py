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
Para agregar una sección al menú, editá NAV (y GRUPO_POR_PAGINA) y volvé a correrlo.
"""
import re
from pathlib import Path

FRONT = Path(__file__).resolve().parent.parent / "frontend"

# Arquitectura de navegación (una sola fuente: header, menú móvil y pie salen de acá).
# Cada grupo tiene un enlace PADRE real (funciona sin JavaScript) y, adentro, bloques con título.
#   ("link",  id, texto, href)
#   ("grupo", id, texto, href_del_padre, [(título_del_bloque, [(texto, href), ...]), ...])
NAV = [
    ("link", "trayectoria", "Trayectoria", "index.html#experiencia"),
    ("grupo", "ml", "Mercado Libre", "herramientas.html", [
        ("Hacer", [
            ("Herramientas", "herramientas.html"),
            ("Chequeo de publicación", "herramientas.html#chequeo"),
            ("Rentabilidad", "rentabilidad.html"),
            ("Importación", "importar.html"),
            ("Pérdida en publicidad", "perdida.html"),
            ("Auditoría de cuenta", "sistema.html#auditar"),
            ("Informe de muestra", "informe-muestra.html"),
        ]),
        ("Aprender", [("Guías", "lab.html")]),
        ("Entender", [("Cómo trabajo", "sistema.html")]),
    ]),
    ("grupo", "web", "Desarrollo web", "web.html", [
        ("", [
            ("Revisá tu web", "web.html"),
            ("Armá tu web", "armar.html"),
            ("Biblioteca web", "programacion.html"),
            ("Project Architect", "arquitecto.html"),
        ]),
    ]),
    ("link", "contacto", "Contacto", "contacto.html"),
]

# Página → grupo del menú al que pertenece (resalta el padre). Lo que no figura no resalta nada.
GRUPO_POR_PAGINA = {
    "index.html": "trayectoria", "contacto.html": "contacto",
    "herramientas.html": "ml", "rentabilidad.html": "ml", "importar.html": "ml", "perdida.html": "ml",
    "informe-muestra.html": "ml", "sistema.html": "ml",
    "lab.html": "ml", "acos.html": "ml", "anatomia.html": "ml", "excels.html": "ml", "imagenes.html": "ml",
    "metricas.html": "ml", "pricing.html": "ml", "reputacion.html": "ml", "seo.html": "ml",
    "web.html": "web", "armar.html": "web", "programacion.html": "web", "arquitecto.html": "web",
}
# Las ocho guías cuelgan de «Guías» (lab.html) para marcar el ítem actual dentro del grupo.
GUIAS = {"acos.html", "anatomia.html", "excels.html", "imagenes.html", "metricas.html", "pricing.html", "reputacion.html", "seo.html"}

THEME_SCRIPT = ("<script>try{var t=localStorage.getItem('dc-theme');if(t)document.documentElement.dataset.theme=t}"
                "catch(e){}document.documentElement.classList.add('js')</script>")

FONTS = ('  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Geist:wght@400..700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">')

FAVICON = ('<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'>'
           '<rect width=\'32\' height=\'32\' rx=\'8\' fill=\'%23ffe14a\'/><text x=\'50%25\' y=\'54%25\' dominant-baseline=\'central\' '
           'text-anchor=\'middle\' font-family=\'monospace\' font-weight=\'bold\' font-size=\'14\' fill=\'%23141207\'>DC</text></svg>">')

CHEVRON = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'

def _actual(href, pagina):
    """El ítem es la página actual solo si apunta a esa página entera (los enlaces con #ancla no cuentan)."""
    if not pagina or "#" in href:
        return False
    return href == pagina or (href == "lab.html" and pagina in GUIAS)

def nav(active, pagina=""):
    def hoja(texto, href, cls="", pagina_actual=False, extra="", seccion=False):
        # «page» solo si el enlace ES la página actual; «true» si es el padre de la sección en la que estamos
        cur = ' aria-current="page"' if pagina_actual else (' aria-current="true"' if seccion else "")
        c = f' class="{cls.strip()}"' if cls.strip() else ""
        return f'<a href="{href}"{c}{cur}{extra}>{texto}</a>'

    def bloques(sub, gid, mobile):
        out = []
        for titulo, items in sub:
            li = "".join(
                f"<li>{hoja(t, h, pagina_actual=_actual(h, pagina))}</li>" for t, h in items)
            cab = f'<p class="{"mm-sub-h" if mobile else "nav-sub-h"}">{titulo}</p>' if titulo else ""
            out.append(f'{cab}<ul>{li}</ul>')
        return "".join(out)

    desk, mob = [], []
    for it in NAV:
        if it[0] == "link":
            _, i, texto, href = it
            act = i == active
            cls = ("active " if act else "") + ("nav-cta" if i == "contacto" else "")
            desk.append(f"    <li>{hoja(texto, href, cls, act)}</li>")
            mob.append(f"  {hoja(texto, href, 'active' if act else '', act)}")
        else:
            _, i, texto, href, sub = it
            act = i == active
            pcls = "nav-parent" + (" active" if act else "")
            desk.append(
                f'    <li class="nav-group" data-grupo="{i}">\n'
                f'      {hoja(texto, href, pcls, _actual(href, pagina), seccion=act)}\n'
                f'      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="nav-sub-{i}" aria-label="Opciones de {texto}">{CHEVRON}</button>\n'
                f'      <div class="nav-sub" id="nav-sub-{i}" aria-label="{texto}">{bloques(sub, i, False)}</div>\n'
                f'    </li>')
            mob.append(
                f'  <div class="mm-group" data-grupo="{i}">\n'
                f'    {hoja(texto, href, "active" if act else "", _actual(href, pagina), seccion=act)}\n'
                f'    <button type="button" class="mm-toggle" aria-expanded="false" aria-controls="mm-sub-{i}" aria-label="Opciones de {texto}">{CHEVRON}</button>\n'
                f'    <div class="mm-sub" id="mm-sub-{i}">{bloques(sub, i, True)}</div>\n'
                f'  </div>')
    items = "\n".join(desk)
    mobile = "\n".join(mob)
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
  <nav class="footer-index" aria-label="Mapa del sitio">
    <div class="footer-col">
      <h2>Darío Colángelo</h2>
      <ul>
        <li><a href="index.html#experiencia">Trayectoria</a></li>
        <li><a href="index.html#caso-exito">Casos</a></li>
        <li><a href="assets/Dario-Colangelo-CV.pdf" download><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-download"/></svg>CV en PDF</a></li>
        <li><a href="https://www.linkedin.com/in/dariocolangelo/" target="_blank" rel="noopener">LinkedIn</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2>Mercado Libre</h2>
      <ul>
        <li><a href="herramientas.html#chequeo">Chequeo de publicación</a></li>
        <li><a href="rentabilidad.html">Rentabilidad</a></li>
        <li><a href="importar.html">Importación</a></li>
        <li><a href="perdida.html">Pérdida en publicidad</a></li>
        <li><a href="sistema.html#auditar">Auditoría de cuenta</a></li>
        <li><a href="informe-muestra.html">Informe de muestra</a></li>
        <li><a href="lab.html">Guías</a></li>
        <li><a href="sistema.html">Cómo trabajo</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2>Desarrollo web</h2>
      <ul>
        <li><a href="web.html">Revisá tu web</a></li>
        <li><a href="armar.html">Armá tu web</a></li>
        <li><a href="programacion.html">Biblioteca web</a></li>
        <li><a href="arquitecto.html">Project Architect</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2>Contacto</h2>
      <ul>
        <li><a href="https://wa.me/541144474507" target="_blank" rel="noopener">WhatsApp</a></li>
        <li><a href="mailto:daricolangelo@gmail.com">Email</a></li>
        <li><a href="contacto.html#formulario">Formulario</a></li>
      </ul>
    </div>
  </nav>
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
    active = GRUPO_POR_PAGINA.get(path.name, "")
    if NAV_BLOCK.search(s):
        s = NAV_BLOCK.sub(lambda _: nav(active, path.name), s, count=1)
    elif OLD_NAV.search(s):
        s = OLD_NAV.sub(lambda _: nav(active, path.name), s, count=1)
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
