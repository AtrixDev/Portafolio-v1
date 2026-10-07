#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO técnico: canonical + og:url en cada página indexable, y generación de robots.txt y sitemap.xml.

Una sola fuente de verdad: este script. Es idempotente.
  python3 tools/seo-tecnico.py            escribe los cambios
  python3 tools/seo-tecnico.py --check    no escribe; sale con 1 si algo está desactualizado (lo usa un test)

Reglas
- Indexable = la página NO tiene <meta name="robots" content="…noindex…"> y no es 404.html.
  Las que no lo son (admin, vinculado, 404, redirects ia/tracker) no llevan canonical ni van al sitemap.
- El canonical es SIEMPRE la URL limpia, sin parámetros: ?r= (resultado compartido), ?asunto= y ?pub= (contacto),
  ?auditoria= (retorno de OAuth) y cualquier otro quedan como variantes de la misma página. Los parámetros siguen
  funcionando: el canonical solo le dice al buscador cuál es la versión principal; no los reescribe ni redirige.
- robots.txt NO bloquea URLs con parámetros (no hay «Disallow: /*?»): un enlace compartido con ?r= tiene que seguir siendo accesible.
- La home se canoniza como «/» (no «/index.html»).
- Si el sitio pasa a un dominio propio, cambiar SITE (o definir SITE_URL) y volver a correr el script.
"""
import os, re, sys
from pathlib import Path

SITE = os.environ.get("SITE_URL", "https://portafolio-v1-dun-ten.vercel.app").rstrip("/")
FRONT = Path(__file__).resolve().parent.parent / "frontend"
NO_INDEXABLES = {"404.html"}

ROBOTS_META = re.compile(r'<meta name="robots" content="([^"]*)"[^>]*>', re.I)
CANON = re.compile(r'[ \t]*<link rel="canonical" href="[^"]*"\s*/?>\n?', re.I)
OGURL = re.compile(r'[ \t]*<meta property="og:url" content="[^"]*"\s*/?>\n?', re.I)


def url_de(nombre):
    return SITE + "/" if nombre == "index.html" else f"{SITE}/{nombre}"


def indexable(nombre, html):
    if nombre in NO_INDEXABLES:
        return False
    m = ROBOTS_META.search(html)
    return not (m and "noindex" in m.group(1).lower())


def con_canonical(html, url):
    html = CANON.sub("", html)
    html = OGURL.sub("", html)
    bloque = f'  <link rel="canonical" href="{url}">\n  <meta property="og:url" content="{url}">\n'
    # Después del meta robots; si la página no lo tiene, después de la description.
    for patron in (ROBOTS_META, re.compile(r'<meta name="description"[^>]*>', re.I)):
        m = patron.search(html)
        if m:
            fin = html.find("\n", m.end())
            fin = len(html) if fin == -1 else fin + 1
            return html[:fin] + bloque + html[fin:]
    raise SystemExit("sin lugar para el canonical")


def main(check):
    pendientes, urls = [], []
    for f in sorted(FRONT.glob("*.html")):
        html = f.read_text(encoding="utf-8")
        if not indexable(f.name, html):
            continue
        urls.append(url_de(f.name))
        nuevo = con_canonical(html, url_de(f.name))
        if nuevo != html:
            pendientes.append(f.name)
            if not check:
                f.write_text(nuevo, encoding="utf-8")

    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls)
               + "</urlset>\n")
    robots = ("User-agent: *\n"
              "Allow: /\n"
              "Disallow: /api/\n"
              "\n"
              f"Sitemap: {SITE}/sitemap.xml\n")
    for nombre, texto in (("sitemap.xml", sitemap), ("robots.txt", robots)):
        ruta = FRONT / nombre
        if not ruta.exists() or ruta.read_text(encoding="utf-8") != texto:
            pendientes.append(nombre)
            if not check:
                ruta.write_text(texto, encoding="utf-8")

    print(f"{len(urls)} páginas indexables · pendientes: {pendientes or 'ninguno'}")
    return 1 if (check and pendientes) else 0


if __name__ == "__main__":
    sys.exit(main("--check" in sys.argv))
