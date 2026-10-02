#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Saca las miniaturas (640x400, WebP) de las demos de estilos para las tarjetas de la base, y opcionalmente hojas de contacto para revisarlas.

Uso:  python3 tools/lab_demos_miniaturas.py                 → todas
      python3 tools/lab_demos_miniaturas.py id1 id2 ...      → solo esas
      python3 tools/lab_demos_miniaturas.py --hojas          → además deja hojas de contacto en /tmp/claude-1000/caps/est/
Necesita un servidor estático sirviendo frontend/ en http://localhost:8767 (python3 -m http.server 8767 desde frontend/).
"""
import sys, os, subprocess
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import lab_demos_estilos as L
from playwright.sync_api import sync_playwright
from PIL import Image

D = L.OUT
TMP = Path("/tmp/claude-1000/caps/est"); TMP.mkdir(parents=True, exist_ok=True)

def patrones():
    """Miniaturas de las demos de patrones (python3 tools/lab_demos_miniaturas.py --patrones)."""
    import lab_demos_patrones as P
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = b.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="no-preference").new_page()
        for (_, i) in P.PATRONES:
            pg.goto(f"http://localhost:8767/prog-ejemplos/patrones/{i}.html", wait_until="load"); pg.wait_for_timeout(2600)
            pg.screenshot(path=str(TMP / f"p-{i}.png"))
            Image.open(TMP / f"p-{i}.png").convert("RGB").resize((640, 400), Image.LANCZOS).save(P.OUT / f"{i}.webp", "WEBP", quality=78, method=6)
        b.close()
    print(f"OK · {len(P.PATRONES)} miniaturas de patrones")

def negocios():
    """Miniaturas de los ejemplos por tipo de negocio (--negocios)."""
    out = Path(__file__).resolve().parent.parent / "frontend" / "prog-ejemplos" / "negocios"
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = b.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="no-preference").new_page()
        for f in sorted(out.glob("*.html")):
            pg.goto(f"http://localhost:8767/prog-ejemplos/negocios/{f.name}", wait_until="load"); pg.wait_for_timeout(2600)
            pg.screenshot(path=str(TMP / f"n-{f.stem}.png"))
            Image.open(TMP / f"n-{f.stem}.png").convert("RGB").resize((640, 400), Image.LANCZOS).save(out / f"{f.stem}.webp", "WEBP", quality=78, method=6)
        b.close()
    print("OK · miniaturas de negocios")

def main():
    if "--negocios" in sys.argv: return negocios()
    if "--patrones" in sys.argv: return patrones()
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ids = args or list(L.STYLES)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = b.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="no-preference").new_page()
        for i in ids:
            pg.goto(f"http://localhost:8767/prog-ejemplos/estilos/{i}.html", wait_until="load"); pg.wait_for_timeout(3200)
            pg.screenshot(path=str(TMP / f"{i}.png"))
            Image.open(TMP / f"{i}.png").convert("RGB").resize((640, 400), Image.LANCZOS).save(D / f"{i}.webp", "WEBP", quality=78, method=6)
        b.close()
    print(f"OK · {len(ids)} miniaturas en {D}")
    if "--hojas" in sys.argv:
        for n in range(0, len(ids), 6):
            im = Image.new("RGB", (1920, 800), "#888")
            for k, i in enumerate(ids[n:n + 6]):
                im.paste(Image.open(TMP / f"{i}.png").convert("RGB").resize((640, 400), Image.LANCZOS), ((k % 3) * 640, (k // 3) * 400))
            im.save(TMP / f"hoja-{n // 6}.png"); print("hoja", n // 6, ids[n:n + 6])

if __name__ == "__main__":
    main()
